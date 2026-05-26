import json
import os
from dotenv import load_dotenv

load_dotenv()

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

_embedding_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
_client = chromadb.PersistentClient(path="./chroma_db")
collection = _client.get_or_create_collection(
    name="medicines",
    embedding_function=_embedding_fn,
)

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


def _call_gemini(prompt: str) -> str:
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    return response.text.strip()


def _build_context(results: dict) -> tuple[str, list[str]]:
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    context_parts = []
    sources = []
    for i, doc in enumerate(docs):
        context_parts.append(doc)
        if i < len(metas) and metas[i]:
            sources.append(metas[i].get("name", ""))
    return "\n\n".join(context_parts), [s for s in sources if s]


def verify_medicine(medicine_name: str) -> dict:
    results = collection.query(query_texts=[medicine_name], n_results=3)
    context, _ = _build_context(results)

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

Base your answer ONLY on the provided context. Return ONLY valid JSON, no markdown, no explanation."""

    try:
        raw = _call_gemini(prompt)
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(raw)
    except Exception:
        return _VERIFY_FALLBACK.copy()


def check_interactions(medicine1: str, medicine2: str) -> dict:
    results1 = collection.query(query_texts=[medicine1], n_results=2)
    results2 = collection.query(query_texts=[medicine2], n_results=2)
    ctx1, _ = _build_context(results1)
    ctx2, _ = _build_context(results2)
    context = f"{ctx1}\n\n{ctx2}".strip()

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
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(raw)
    except Exception:
        return _INTERACTION_FALLBACK.copy()


def chat(message: str, history: list) -> dict:
    results = collection.query(query_texts=[message], n_results=3)
    context, sources = _build_context(results)

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
    except Exception:
        return {
            "response": "I'm sorry, I couldn't process your request. Please consult a doctor.",
            "sources": [],
        }
