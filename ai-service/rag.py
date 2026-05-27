import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SIMILARITY_THRESHOLD = 1.2

_embedding_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
_client = chromadb.PersistentClient(path="./chroma_db")

medicines_collection = _client.get_or_create_collection(
    name="medicines",
    embedding_function=_embedding_fn,
)
monographs_collection = _client.get_or_create_collection(
    name="drug_monographs",
    embedding_function=_embedding_fn,
)
alerts_collection = _client.get_or_create_collection(
    name="fake_alerts",
    embedding_function=_embedding_fn,
)

# Kept for backwards compatibility (main.py /search imports `collection`)
collection = medicines_collection

DATA_DIR = Path(__file__).parent / "data"

# ── MongoDB cache ─────────────────────────────────────────────────────────────

_gemini_cache_col = None

_MONGODB_URI = os.environ.get("MONGODB_URI", "")
if _MONGODB_URI:
    try:
        import pymongo
        _mongo_client = pymongo.MongoClient(_MONGODB_URI, serverSelectionTimeoutMS=5000)
        _mongo_client.admin.command("ping")
        _db = _mongo_client["mediverify-db"]
        _gemini_cache_col = _db["gemini_cache"]
        print("[Cache] MongoDB gemini_cache connected")
    except Exception as _e:
        print(f"[Cache] MongoDB connection failed: {_e}")


def _cache_get(key: str) -> dict | None:
    if _gemini_cache_col is None:
        return None
    try:
        doc = _gemini_cache_col.find_one({"key": key.lower()})
        if doc:
            doc.pop("_id", None)
            doc.pop("key", None)
            return doc["response"]
    except Exception:
        pass
    return None


def _cache_set(key: str, response: dict) -> None:
    if _gemini_cache_col is None:
        return
    try:
        _gemini_cache_col.update_one(
            {"key": key.lower()},
            {"$set": {"key": key.lower(), "response": response}},
            upsert=True,
        )
    except Exception:
        pass


# ── Fallbacks ─────────────────────────────────────────────────────────────────

_VERIFY_FALLBACK = {
    "trust_score": 0,
    "is_verified": False,
    "manufacturer_match": False,
    "explanation": "Could not verify this medicine",
    "fake_indicators": [],
    "safe_alternatives": [],
    "confidence_breakdown": {
        "manufacturer_match": False,
        "batch_format_valid": False,
        "price_in_range": False,
    },
}

_INTERACTION_FALLBACK = {
    "is_safe": False,
    "severity": "severe",
    "explanation": "Could not determine interaction",
    "recommendation": "Consult a doctor before combining these medicines",
}


# ── Gemini helpers ────────────────────────────────────────────────────────────

def _call_gemini(prompt: str, retries: int = 3) -> str:
    for i in range(retries):
        try:
            model = genai.GenerativeModel("gemini-2.0-flash-lite")
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            if "429" in str(e):
                wait = (i + 1) * 10
                print(f"[Gemini] Rate limited, waiting {wait}s (attempt {i + 1}/{retries})")
                time.sleep(wait)
            else:
                raise e
    raise Exception("Gemini rate limit exceeded after all retries")


def _clean_json(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```", 2)
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rsplit("```", 1)[0]
    return raw.strip()


# ── ChromaDB helpers ──────────────────────────────────────────────────────────

def _query_collection(col, text: str, n_results: int = 5) -> tuple[list, list, list]:
    """Query a ChromaDB collection, return only results below SIMILARITY_THRESHOLD."""
    try:
        results = col.query(
            query_texts=[text],
            n_results=n_results,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as e:
        print(f"[RAG] Collection query error: {e}")
        return [], [], []

    raw_docs = results.get("documents", [[]])[0]
    raw_metas = results.get("metadatas", [[]])[0]
    raw_distances = results.get("distances", [[]])[0]

    best = min(raw_distances) if raw_distances else 9.99
    good_docs, good_metas, good_dists = [], [], []
    for doc, meta, dist in zip(raw_docs, raw_metas, raw_distances):
        if dist < SIMILARITY_THRESHOLD:
            good_docs.append(doc)
            good_metas.append(meta)
            good_dists.append(dist)

    print(f"[RAG] Querying for: {text!r} | Collection: {col.name}")
    print(f"[RAG] ChromaDB hits: {len(good_docs)} | Best distance: {best:.4f}")

    return good_docs, good_metas, good_dists


# ── Core RAG functions ────────────────────────────────────────────────────────

def get_from_gemini_knowledge(medicine_name: str) -> dict:
    """Fetch medicine info from Gemini when ChromaDB has no good match."""
    cached = _cache_get(f"knowledge:{medicine_name}")
    if cached:
        print(f"[Cache] Gemini knowledge cache hit: {medicine_name}")
        return cached

    prompt = f"""You are a pharmaceutical expert for Bangladesh.
Provide detailed information about the medicine: {medicine_name}

Return ONLY valid JSON with exactly these fields:
{{
  "name": "{medicine_name}",
  "generic_name": "<INN generic name>",
  "manufacturer": "<likely Bangladeshi pharmaceutical company>",
  "uses": ["<use1>", "<use2>", "<use3>"],
  "side_effects": ["<side effect1>", "<side effect2>"],
  "dosage": "<standard adult dosage>",
  "price_bdt": <estimated price in Bangladeshi Taka as number>,
  "requires_prescription": <true or false>,
  "fake_indicators": ["<fake detection tip1>", "<fake detection tip2>"],
  "safe_alternatives": ["<alternative1>", "<alternative2>"],
  "found_via": "gemini_knowledge",
  "trust_score": 55,
  "explanation": "Information retrieved from AI knowledge base. Not yet in verified database. Consult a registered pharmacist.",
  "is_verified": false,
  "confidence_breakdown": {{
    "manufacturer_match": false,
    "batch_format_valid": false,
    "price_in_range": false
  }}
}}
Return ONLY valid JSON, no markdown."""

    try:
        raw = _call_gemini(prompt)
        result = json.loads(_clean_json(raw))
        _cache_set(f"knowledge:{medicine_name}", result)
        return result
    except Exception as e:
        print(f"[RAG] Gemini knowledge fallback error: {e}")
        return _VERIFY_FALLBACK.copy()


def _auto_store(medicine_name: str, data: dict) -> None:
    """Store a Gemini-discovered medicine back into ChromaDB and medicines.json."""
    try:
        doc = (
            f"Medicine: {data.get('name', medicine_name)}. "
            f"Generic: {data.get('generic_name', '')}. "
            f"Manufacturer: {data.get('manufacturer', '')}. "
            f"Uses: {', '.join(data.get('uses', []))}. "
            f"Side effects: {', '.join(data.get('side_effects', []))}. "
            f"Dosage: {data.get('dosage', '')}. "
            f"Fake indicators: {', '.join(data.get('fake_indicators', []))}. "
            f"Safe alternatives: {', '.join(data.get('safe_alternatives', []))}."
        )
        med_id = medicine_name.lower().replace(" ", "-").replace("/", "-")
        meta = {
            "name": data.get("name", medicine_name),
            "genericName": data.get("generic_name", ""),
            "manufacturer": data.get("manufacturer", ""),
            "uses": ", ".join(data.get("uses", [])),
            "sideEffects": ", ".join(data.get("side_effects", [])),
            "fakeIndicators": ", ".join(data.get("fake_indicators", [])),
            "safeAlternatives": ", ".join(data.get("safe_alternatives", [])),
        }
        medicines_collection.add(ids=[med_id], documents=[doc], metadatas=[meta])
        print(f"[RAG] New medicine learned: {medicine_name}")
    except Exception as e:
        print(f"[RAG] ChromaDB auto-store failed: {e}")

    try:
        medicines_path = DATA_DIR / "medicines.json"
        with open(medicines_path, encoding="utf-8") as f:
            existing = json.load(f)
        names = {m.get("name", "").lower() for m in existing}
        if medicine_name.lower() not in names:
            existing.append({
                "name": data.get("name", medicine_name),
                "genericName": data.get("generic_name", ""),
                "manufacturer": data.get("manufacturer", ""),
                "uses": data.get("uses", []),
                "sideEffects": data.get("side_effects", []),
                "fakeIndicators": data.get("fake_indicators", []),
                "safeAlternatives": data.get("safe_alternatives", []),
            })
            with open(medicines_path, "w", encoding="utf-8") as f:
                json.dump(existing, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[RAG] medicines.json update failed: {e}")


def verify_medicine(medicine_name: str) -> dict:
    cached = _cache_get(f"verify:{medicine_name}")
    if cached:
        print(f"[Cache] Verify cache hit: {medicine_name}")
        return cached

    med_docs, _, _ = _query_collection(medicines_collection, medicine_name, n_results=3)
    mono_docs, _, _ = _query_collection(monographs_collection, medicine_name, n_results=2)
    alert_docs, _, _ = _query_collection(alerts_collection, medicine_name, n_results=3)

    has_results = any([med_docs, mono_docs, alert_docs])

    if not has_results:
        print(f"[RAG] Source: gemini_knowledge")
        result = get_from_gemini_knowledge(medicine_name)
        if result is not _VERIFY_FALLBACK and result.get("trust_score") == 55:
            _auto_store(medicine_name, result)
        return result

    print(f"[RAG] Source: chromadb")

    context_parts = []
    if med_docs:
        context_parts.append("MEDICINE DATABASE:\n" + "\n\n".join(med_docs))
    if mono_docs:
        context_parts.append("DRUG MONOGRAPH:\n" + "\n\n".join(mono_docs))
    if alert_docs:
        context_parts.append("FAKE ALERTS FOR THIS MEDICINE:\n" + "\n\n".join(alert_docs))

    context = "\n\n---\n\n".join(context_parts)

    prompt = f"""You are MediVerify AI. Analyze this medicine and return a JSON response with exactly these fields:
{{
  "trust_score": <number 0-100>,
  "is_verified": <boolean>,
  "manufacturer_match": <boolean>,
  "explanation": "<2-3 sentences why this score>",
  "fake_indicators": ["<indicator1>", "<indicator2>"],
  "safe_alternatives": ["<alt1>", "<alt2>"],
  "confidence_breakdown": {{
    "manufacturer_match": <boolean>,
    "batch_format_valid": <boolean>,
    "price_in_range": <boolean>
  }}
}}

Context from verified medicine database:
{context}

Medicine to verify: "{medicine_name}"

Base your answer on the provided context. Return ONLY valid JSON, no markdown."""

    try:
        raw = _call_gemini(prompt)
        result = json.loads(_clean_json(raw))
        print(f"[RAG] Trust score: {result.get('trust_score')}")
        if result.get("trust_score", 0) > 0:
            _cache_set(f"verify:{medicine_name}", result)
        return result
    except Exception as e:
        print(f"[RAG] Gemini verify error: {e}")
        return _VERIFY_FALLBACK.copy()


def check_interactions(medicine1: str, medicine2: str) -> dict:
    cache_key = f"interactions:{min(medicine1, medicine2)}:{max(medicine1, medicine2)}"
    cached = _cache_get(cache_key)
    if cached:
        print(f"[Cache] Interaction cache hit: {medicine1} + {medicine2}")
        return cached

    med1_docs, _, _ = _query_collection(medicines_collection, medicine1, n_results=2)
    med2_docs, _, _ = _query_collection(medicines_collection, medicine2, n_results=2)
    mono1_docs, _, _ = _query_collection(monographs_collection, medicine1, n_results=1)
    mono2_docs, _, _ = _query_collection(monographs_collection, medicine2, n_results=1)

    context_parts = []
    if med1_docs:
        context_parts.append(f"MEDICINE 1 ({medicine1}):\n" + "\n".join(med1_docs))
    if mono1_docs:
        context_parts.append(f"MONOGRAPH ({medicine1}):\n" + "\n".join(mono1_docs))
    if med2_docs:
        context_parts.append(f"MEDICINE 2 ({medicine2}):\n" + "\n".join(med2_docs))
    if mono2_docs:
        context_parts.append(f"MONOGRAPH ({medicine2}):\n" + "\n".join(mono2_docs))
    context = "\n\n".join(context_parts).strip()

    prompt = f"""Check drug interaction between "{medicine1}" and "{medicine2}".

Context from verified medicine database:
{context}

Return JSON with exactly these fields:
{{
  "is_safe": <boolean>,
  "severity": "<safe|mild|moderate|severe>",
  "explanation": "<explanation of interaction mechanism>",
  "recommendation": "<specific actionable advice>"
}}
Return ONLY valid JSON."""

    try:
        raw = _call_gemini(prompt)
        result = json.loads(_clean_json(raw))
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        print(f"[RAG] Gemini interaction error: {e}")
        return _INTERACTION_FALLBACK.copy()


def chat(message: str, history: list) -> dict:
    docs, _, _ = _query_collection(medicines_collection, message, n_results=3)
    mono_docs, _, _ = _query_collection(monographs_collection, message, n_results=2)

    context_parts = []
    if docs:
        context_parts.append("MEDICINE DATABASE:\n" + "\n\n".join(docs))
    if mono_docs:
        context_parts.append("DRUG MONOGRAPH:\n" + "\n\n".join(mono_docs))
    context = "\n\n".join(context_parts)

    sources = []
    try:
        raw_results = medicines_collection.query(
            query_texts=[message], n_results=3,
            include=["metadatas", "distances"],
        )
        for meta, dist in zip(
            raw_results.get("metadatas", [[]])[0],
            raw_results.get("distances", [[]])[0],
        ):
            if dist < SIMILARITY_THRESHOLD and meta.get("name"):
                sources.append(meta["name"])
    except Exception:
        pass

    history_text = ""
    for turn in history:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        history_text += f"{role.capitalize()}: {content}\n"

    prompt = f"""You are MediVerify AI assistant helping Bangladeshi users understand medicines safely.
Answer ONLY based on provided context. Always recommend consulting a doctor.
Respond in the same language as the user message. Keep responses short and clear.

Context from medicine database:
{context}

{history_text}User: {message}
Assistant:"""

    try:
        response_text = _call_gemini(prompt)
        return {"response": response_text, "sources": sources}
    except Exception as e:
        print(f"[RAG] Gemini chat error: {e}")
        return {
            "response": "I'm sorry, I couldn't process your request. Please consult a doctor.",
            "sources": [],
        }
