from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from seed import seed_medicines
from rag import collection, verify_medicine, check_interactions, chat
from vision import extract_medicine_from_image


@asynccontextmanager
async def lifespan(app: FastAPI):
    count = seed_medicines()
    print("MediVerify AI Service Ready")
    print(f"Medicines in ChromaDB: {count}")
    yield


app = FastAPI(title="MediVerify AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ────────────────────────────────────────────────────────────

class VerifyRequest(BaseModel):
    medicine_name: Optional[str] = None
    image_base64: Optional[str] = None


class InteractionsRequest(BaseModel):
    medicine1: str
    medicine2: str


class ChatRequest(BaseModel):
    message: str
    history: list[Any] = []


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/verify")
async def verify(body: VerifyRequest):
    name = body.medicine_name

    if body.image_base64:
        extracted = extract_medicine_from_image(body.image_base64)
        if extracted.get("medicine_name"):
            name = extracted["medicine_name"]

    if not name:
        return {
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

    return verify_medicine(name)


@app.post("/interactions")
async def interactions(body: InteractionsRequest):
    return check_interactions(body.medicine1, body.medicine2)


@app.post("/chat")
async def chat_endpoint(body: ChatRequest):
    return chat(body.message, body.history)


@app.get("/search")
async def search(q: str = Query(default="")):
    if not q.strip():
        return []
    try:
        results = collection.query(query_texts=[q], n_results=5)
        metas = results.get("metadatas", [[]])[0]
        return [m.get("name", "") for m in metas if m.get("name")]
    except Exception:
        return []


@app.get("/health")
async def health():
    return {"status": "ok", "medicines_count": collection.count()}
