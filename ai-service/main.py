import os
from contextlib import asynccontextmanager
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

load_dotenv()

from seed import seed_medicines, seed_monographs, seed_fake_alerts, seed_manufacturers
from rag import (
    medicines_collection,
    monographs_collection,
    alerts_collection,
    verify_medicine,
    check_interactions,
    chat,
    _query_collection,
)
from manufacturers import manufacturers_collection
from vision import extract_medicine_from_image
from investigate import investigate_medicine, extract_from_speech
from compare import compare_medicines

INTERNAL_SECRET = os.environ.get("INTERNAL_SECRET", "")
BACKEND_ORIGIN = os.environ.get("BACKEND_ORIGIN", "http://localhost:3001")


@asynccontextmanager
async def lifespan(app: FastAPI):
    med_count = seed_medicines()
    mono_count = seed_monographs()
    alert_count = seed_fake_alerts()
    mfr_count = seed_manufacturers()
    print("MediVerify AI Service Ready")
    print(f"  Medicines:       {med_count}")
    print(f"  Drug monographs: {mono_count}")
    print(f"  Fake alerts:     {alert_count}")
    print(f"  Manufacturers:   {mfr_count}")
    yield


app = FastAPI(title="MediVerify AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[BACKEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def require_internal_token(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    token = request.headers.get("x-internal-token", "")
    if not INTERNAL_SECRET or token != INTERNAL_SECRET:
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return await call_next(request)


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


class InvestigateRequest(BaseModel):
    medicine_name: str
    manufacturer: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    purchase_location: Optional[str] = None
    price_paid: Optional[float] = None


class ExtractRequest(BaseModel):
    transcript: str


class CompareRequest(BaseModel):
    name: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/verify")
async def verify(body: VerifyRequest):
    name = body.medicine_name
    extraction: dict | None = None

    if body.image_base64:
        extraction = extract_medicine_from_image(body.image_base64)
        if extraction.get("error"):
            return extraction
        if extraction.get("medicine_name"):
            name = extraction["medicine_name"]

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

    result = verify_medicine(name)

    if extraction:
        result["extracted_name"] = extraction.get("medicine_name")
        result["batch_number"] = extraction.get("batch_number")
        result["expiry_date"] = extraction.get("expiry_date")
        result["manufacturer_from_image"] = extraction.get("manufacturer")

    return result


@app.post("/interactions")
async def interactions(body: InteractionsRequest):
    return check_interactions(body.medicine1, body.medicine2)


@app.post("/chat")
async def chat_endpoint(body: ChatRequest):
    return chat(body.message, body.history)


@app.post("/investigate")
async def investigate(body: InvestigateRequest):
    return investigate_medicine(body.model_dump())


@app.post("/extract-from-speech")
async def extract(body: ExtractRequest):
    return extract_from_speech(body.transcript)


@app.post("/compare")
async def compare(body: CompareRequest):
    return compare_medicines(body.name)


@app.get("/search")
async def search(q: str = Query(default="")):
    if not q.strip():
        return []
    try:
        docs, metas, _ = _query_collection(medicines_collection, q, n_results=5)
        return [
            {"name": m.get("name", ""), "manufacturer": m.get("manufacturer", "")}
            for m in metas
            if m.get("name")
        ]
    except Exception:
        return []


class ReembedRequest(BaseModel):
    medicine: dict


@app.post("/admin/medicines/reembed")
async def reembed_medicine(body: ReembedRequest):
    med = body.medicine
    name = med.get("name", "")
    if not name:
        return {"status": "error", "detail": "name is required"}
    med_id = name.lower().replace(" ", "-").replace("/", "-")
    uses = med.get("uses") or []
    side_effects = med.get("sideEffects") or []
    fake_indicators = med.get("fakeIndicators") or []
    safe_alternatives = med.get("safeAlternatives") or []
    doc = (
        f"Medicine: {name}. "
        f"Generic: {med.get('genericName', '')}. "
        f"Manufacturer: {med.get('manufacturer', '')}. "
        f"Uses: {', '.join(uses)}. "
        f"Side effects: {', '.join(side_effects)}. "
        f"Price (BDT): {med.get('price', '')}. "
        f"Fake indicators: {', '.join(fake_indicators)}. "
        f"Safe alternatives: {', '.join(safe_alternatives)}."
    )
    meta = {
        "name": name,
        "genericName": med.get("genericName", ""),
        "manufacturer": med.get("manufacturer", ""),
        "uses": ", ".join(uses),
        "sideEffects": ", ".join(side_effects),
        "fakeIndicators": ", ".join(fake_indicators),
        "safeAlternatives": ", ".join(safe_alternatives),
    }
    medicines_collection.upsert(ids=[med_id], documents=[doc], metadatas=[meta])
    return {"status": "ok", "id": med_id}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "medicines_count": medicines_collection.count(),
        "monographs_count": monographs_collection.count(),
        "alerts_count": alerts_collection.count(),
        "manufacturers_count": manufacturers_collection.count(),
    }
