import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai
from vector_store import make_collection

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SIMILARITY_THRESHOLD = 0.9
# Cosine distance (1 - cosine_similarity) from Pinecone/Gemini embeddings. Only a
# near-identical embedding short-circuits the name check; everything else must pass
# the token-overlap test below. (Was 0.4, tuned for ChromaDB's L2 distance, which
# wrongly matched unrelated meds like "Diapro" to in-DB drugs at ~0.35.)
FUZZY_MATCH_DISTANCE = 0.15
_DOSAGE_TOKEN_RE = __import__("re").compile(r"^\d+(mg|mcg|ml|iu|g)?$")


def _name_tokens(name: str) -> set[str]:
    out: set[str] = set()
    for raw in (name or "").lower().replace("-", " ").split():
        tok = raw.strip()
        if len(tok) >= 3 and not _DOSAGE_TOKEN_RE.match(tok):
            out.add(tok)
    return out


def _name_matches(input_name: str, candidate_name: str, distance: float) -> bool:
    if distance < FUZZY_MATCH_DISTANCE:
        return True
    in_tokens = _name_tokens(input_name)
    cand_tokens = _name_tokens(candidate_name)
    if not in_tokens or not cand_tokens:
        return False
    for it in in_tokens:
        for ct in cand_tokens:
            if it in ct or ct in it:
                return True
    return False


def _names_equal(a: str, b: str) -> bool:
    return (a or "").strip().lower() == (b or "").strip().lower()

# Pinecone-backed collections (one namespace each) — see vector_store.py.
medicines_collection = make_collection("medicines")
monographs_collection = make_collection("drug_monographs")
alerts_collection = make_collection("fake_alerts")

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
    last_err = ""
    for i in range(retries):
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            last_err = str(e)
            print(f"[Gemini] Error (attempt {i + 1}/{retries}): {last_err[:300]}")
            if "RESOURCE_EXHAUSTED" in last_err and "PerDay" in last_err:
                print("[Gemini] Daily quota exhausted — bailing out, no point retrying")
                raise Exception(f"Gemini daily quota exhausted: {last_err[:200]}")
            if "429" in last_err:
                wait = (i + 1) * 5
                print(f"[Gemini] Rate limited, waiting {wait}s")
                time.sleep(wait)
            else:
                raise e
    raise Exception(f"Gemini call failed after {retries} retries: {last_err[:200]}")


def _call_gemini_vision(parts: list, retries: int = 3) -> str:
    for i in range(retries):
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(parts)
            time.sleep(2)
            return response.text.strip()
        except Exception as e:
            if "429" in str(e):
                wait = (i + 1) * 10
                print(f"[Gemini] Rate limited (vision), waiting {wait}s (attempt {i + 1}/{retries})")
                time.sleep(wait)
            else:
                raise e
    raise Exception("Gemini vision rate limit exceeded after all retries")


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
    print(f"[RAG] Pinecone hits: {len(good_docs)} | Best distance: {best:.4f}")

    return good_docs, good_metas, good_dists


# ── Rule-based fallback when Gemini is unavailable ───────────────────────────

def _score_from_chroma(
    medicine_name: str,
    med_metas: list,
    med_dists: list,
    alert_docs: list,
    fast_path: bool = False,
) -> dict:
    """Compute a trust score purely from ChromaDB metadata — no Gemini call.

    When fast_path=True the explanation is written as the primary response,
    not as a Gemini-unavailable fallback message.
    """
    if not med_metas:
        return {
            "trust_score": 20,
            "is_verified": False,
            "manufacturer_match": False,
            "explanation": (
                f"'{medicine_name}' was not found in the verified medicine database. "
                "It may be a new, regional, or misspelled medicine name. "
                "Please consult a registered pharmacist."
            ),
            "fake_indicators": [
                "Always verify packaging matches known brand design",
                "Check for government drug registration number on pack",
                "Purchase only from licensed pharmacies",
            ],
            "safe_alternatives": [],
            "confidence_breakdown": {
                "manufacturer_match": False,
                "batch_format_valid": False,
                "price_in_range": False,
            },
        }

    best_idx = med_dists.index(min(med_dists))
    best_dist = med_dists[best_idx]
    meta = med_metas[best_idx]

    manufacturer = meta.get("manufacturer", "")
    fake_indicators = [i.strip() for i in meta.get("fakeIndicators", "").split(",") if i.strip()]
    safe_alternatives = [a.strip() for a in meta.get("safeAlternatives", "").split(",") if a.strip()]
    generic_name = meta.get("genericName", "")

    manufacturer_known = bool(
        manufacturer and manufacturer.lower() not in ("various", "unknown", "")
    )
    has_fake_alerts = len(alert_docs) > 0

    # Distance 0.0 → 100 pts, distance 1.2 → 0 pts
    distance_score = max(0, round((1.0 - best_dist / SIMILARITY_THRESHOLD) * 85))

    trust_score = distance_score
    if manufacturer_known:
        trust_score = min(100, trust_score + 12)
    if has_fake_alerts:
        trust_score = max(0, trust_score - 20)

    trust_score = max(0, min(100, trust_score))
    is_verified = trust_score >= 60

    parts = [f"'{medicine_name}' is in the MediVerify verified database"]
    if generic_name:
        parts.append(f"(generic: {generic_name})")
    if manufacturer_known:
        parts.append(f"manufactured by {manufacturer}")
    if has_fake_alerts:
        parts.append("⚠ Counterfeit versions of this medicine have been reported — inspect packaging carefully")
    if not fast_path:
        parts.append("(AI explanation temporarily unavailable; score based on database match)")

    return {
        "trust_score": trust_score,
        "is_verified": is_verified,
        "manufacturer_match": manufacturer_known,
        "explanation": ". ".join(parts) + ".",
        "fake_indicators": fake_indicators[:4] if fake_indicators else [
            "Check hologram seal on packaging",
            "Verify batch number on outer carton matches blister strip",
            "Buy only from licensed pharmacies",
        ],
        "safe_alternatives": safe_alternatives[:3],
        "confidence_breakdown": {
            "manufacturer_match": manufacturer_known,
            "batch_format_valid": False,
            "price_in_range": False,
        },
    }


# ── Core RAG functions ────────────────────────────────────────────────────────

def get_from_gemini_knowledge(medicine_name: str) -> dict:
    """Fetch medicine info from Gemini when ChromaDB has no good match."""
    cached = _cache_get(f"knowledge:{medicine_name.lower()}")
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
        _cache_set(f"knowledge:{medicine_name.lower()}", result)
        return result
    except Exception as e:
        print(f"[RAG] Gemini knowledge fallback error: {e}")
        # AI is down/rate-limited AND the medicine isn't in our DB — we genuinely
        # cannot assess it. Return an explicit "unavailable" state (NOT a 0%/low
        # score that looks like a fake verdict). `ai_unavailable` tells the caller
        # not to cache or store this, so it retries cleanly when the API recovers.
        return {
            "trust_score": None,
            "is_verified": False,
            "ai_unavailable": True,
            "manufacturer_match": False,
            "explanation": (
                f"AI verification is temporarily unavailable (rate limit), and '{medicine_name}' "
                "isn't in the local verified database yet. This is NOT a fake verdict — "
                "please try again in a minute."
            ),
            "fake_indicators": [],
            "safe_alternatives": [],
            "confidence_breakdown": {
                "manufacturer_match": False,
                "batch_format_valid": False,
                "price_in_range": False,
            },
        }


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
    cached = _cache_get(f"verify:{medicine_name.lower()}")
    if cached:
        print(f"[Cache] Verify cache hit: {medicine_name}")
        return cached

    med_docs, med_metas, med_dists = _query_collection(medicines_collection, medicine_name, n_results=3)
    mono_docs, _, _ = _query_collection(monographs_collection, medicine_name, n_results=2)
    alert_docs, _, _ = _query_collection(alerts_collection, medicine_name, n_results=3)

    best_meta_name = med_metas[0].get("name", "") if med_metas else ""
    best_dist = med_dists[0] if med_dists else 9.99
    name_match = bool(med_metas) and _name_matches(medicine_name, best_meta_name, best_dist)

    if med_metas and not name_match:
        print(f"[RAG] Rejecting false-positive: {medicine_name!r} vs {best_meta_name!r} (dist={best_dist:.3f})")
        med_docs, med_metas, med_dists = [], [], []

    # Only a real medicine-name match counts as "found". Loose monograph/alert
    # semantic hits alone must NOT trigger the suspicious-scoring path for an
    # otherwise-unknown medicine — fall through to Gemini knowledge instead, which
    # returns real info about legitimate meds that just aren't in our small DB yet.
    has_results = bool(med_docs)

    if not has_results:
        print(f"[RAG] Source: gemini_knowledge")
        result = get_from_gemini_knowledge(medicine_name)
        # Don't cache or auto-store when the API was down / medicine not verifiable.
        if result.get("ai_unavailable"):
            print(f"[RAG] AI unavailable for {medicine_name!r} — not caching/storing")
            return result
        if result.get("trust_score", 0) == 55:
            _auto_store(medicine_name, result)
        _cache_set(f"verify:{medicine_name.lower()}", result)
        return result

    if name_match and _name_tokens(medicine_name) == _name_tokens(best_meta_name):
        print(f"[RAG] Source: chromadb (fast path, no Gemini)")
        result = _score_from_chroma(medicine_name, med_metas, med_dists, alert_docs, fast_path=True)
        _cache_set(f"verify:{medicine_name.lower()}", result)
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
            _cache_set(f"verify:{medicine_name.lower()}", result)
        return result
    except Exception as e:
        print(f"[RAG] Gemini unavailable ({e.__class__.__name__}), using database-only score")
        # Degraded (AI down) — return a DB-based score but DON'T cache it, so the
        # next lookup gets the richer Gemini answer once the API recovers.
        result = _score_from_chroma(medicine_name, med_metas, med_dists, alert_docs)
        result["ai_unavailable"] = True
        return result


def check_interactions(medicine1: str, medicine2: str) -> dict:
    a = (medicine1 or "").strip()
    b = (medicine2 or "").strip()
    if not a or not b:
        return {
            "is_safe": False,
            "severity": "MODERATE",
            "interaction_type": "Missing input",
            "what_happens": "Both medicine names are required to check for interactions.",
            "recommendation": "Enter the names of both medicines and try again.",
            "can_take_together": False,
            "time_gap_needed": None,
            "consult_doctor": True,
            "medicine1": medicine1,
            "medicine2": medicine2,
            "source": "validation_error",
        }

    key_a, key_b = sorted([a.lower(), b.lower()])
    cache_key = f"interactions:{key_a}:{key_b}"
    cached = _cache_get(cache_key)
    if cached:
        print(f"[Cache] Interaction cache hit: {a} + {b}")
        return cached

    med1_docs, med1_metas, _ = _query_collection(medicines_collection, a, n_results=2)
    med2_docs, med2_metas, _ = _query_collection(medicines_collection, b, n_results=2)
    mono1_docs, _, _ = _query_collection(monographs_collection, a, n_results=1)
    mono2_docs, _, _ = _query_collection(monographs_collection, b, n_results=1)

    context_parts = []
    if med1_docs:
        context_parts.append(f"MEDICINE 1 ({a}):\n" + "\n".join(med1_docs))
    if mono1_docs:
        context_parts.append(f"MONOGRAPH ({a}):\n" + "\n".join(mono1_docs))
    if med2_docs:
        context_parts.append(f"MEDICINE 2 ({b}):\n" + "\n".join(med2_docs))
    if mono2_docs:
        context_parts.append(f"MONOGRAPH ({b}):\n" + "\n".join(mono2_docs))
    context = "\n\n".join(context_parts).strip() or "No verified database information for either medicine."

    prompt = f"""You are a pharmaceutical expert for Bangladesh.
Check the drug interaction between:
Medicine 1: {a}
Medicine 2: {b}

Database information:
{context}

Return ONLY valid JSON with this exact shape:
{{
  "is_safe": <boolean>,
  "severity": "SAFE" | "MILD" | "MODERATE" | "SEVERE" | "DANGEROUS",
  "interaction_type": "<short label, e.g. 'CYP3A4 inhibition' or 'No known interaction'>",
  "what_happens": "<2-3 sentences in simple language explaining what happens if taken together>",
  "recommendation": "<one specific actionable sentence>",
  "can_take_together": <boolean>,
  "time_gap_needed": "<e.g. '4 hours apart'>" | null,
  "consult_doctor": <boolean>
}}

Rules:
- SAFE = no known interaction, fine to take together
- MILD = minor interaction, usually fine but be aware
- MODERATE = use caution, possibly space doses
- SEVERE = avoid unless under medical supervision
- DANGEROUS = do NOT take together under any circumstance
- If unsure, prefer MODERATE with consult_doctor: true rather than guessing SAFE.
- Return ONLY JSON, no markdown."""

    def _meta_summary(meta_list, name):
        if not meta_list:
            return {"name": name, "generic_name": None, "manufacturer": None, "found": False}
        m = meta_list[0]
        return {
            "name": m.get("name", name),
            "generic_name": m.get("genericName"),
            "manufacturer": m.get("manufacturer"),
            "found": True,
        }

    medicine1_info = _meta_summary(med1_metas, a)
    medicine2_info = _meta_summary(med2_metas, b)

    try:
        raw = _call_gemini(prompt)
        result = json.loads(_clean_json(raw))
        result.setdefault("time_gap_needed", None)
        result.setdefault("consult_doctor", False)
        result["medicine1"] = medicine1_info
        result["medicine2"] = medicine2_info
        result["source"] = "gemini"
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        print(f"[RAG] Gemini unavailable for interactions ({e.__class__.__name__}: {str(e)[:120]}), using rule-based fallback")
        both_found = medicine1_info["found"] and medicine2_info["found"]
        result = {
            "is_safe": False,
            "severity": "MODERATE",
            "interaction_type": "AI analysis unavailable",
            "what_happens": (
                f"Both '{a}' and '{b}' are recognised in our verified medicine database, but the AI interaction analysis is temporarily unavailable."
                if both_found else
                f"At least one of '{a}' and '{b}' is not in our verified database, and the AI interaction analysis is temporarily unavailable."
            ),
            "recommendation": "AI analysis unavailable — consult a pharmacist or doctor before combining these medicines.",
            "can_take_together": True,
            "time_gap_needed": None,
            "consult_doctor": True,
            "medicine1": medicine1_info,
            "medicine2": medicine2_info,
            "source": "rule_based",
        }
        _cache_set(cache_key, result)
        return result


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
        print(f"[RAG] Gemini chat unavailable ({e.__class__.__name__})")
        if sources:
            return {
                "response": (
                    f"I found these medicines related to your question: {', '.join(sources)}. "
                    "AI explanation is temporarily unavailable. Please consult a pharmacist for detailed advice."
                ),
                "sources": sources,
            }
        return {
            "response": "I'm sorry, I couldn't find information on that. Please consult a registered pharmacist or doctor.",
            "sources": [],
        }
