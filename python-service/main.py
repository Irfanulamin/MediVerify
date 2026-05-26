import os
from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai
import chromadb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="MediVerify Python Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="medicines")

SEED_MEDICINES = [
    {
        "id": "med_001",
        "name": "Paracetamol 500mg",
        "uses": "Pain relief, fever reduction",
        "side_effects": "Liver damage in overdose, nausea",
        "fake_indicators": "Unusual smell, crumbling texture, no embossed marking",
    },
    {
        "id": "med_002",
        "name": "Amoxicillin 500mg",
        "uses": "Bacterial infections, respiratory tract infections",
        "side_effects": "Diarrhea, rash, allergic reactions",
        "fake_indicators": "Powder leaking from capsule, discoloration, no manufacturer seal",
    },
    {
        "id": "med_003",
        "name": "Metformin 500mg",
        "uses": "Type 2 diabetes management, blood sugar control",
        "side_effects": "Nausea, diarrhea, lactic acidosis (rare)",
        "fake_indicators": "Uneven tablet size, no score line, faded imprint",
    },
    {
        "id": "med_004",
        "name": "Omeprazole 20mg",
        "uses": "Acid reflux, gastric ulcers, GERD",
        "side_effects": "Headache, diarrhea, vitamin B12 deficiency long-term",
        "fake_indicators": "Capsule easily opens without resistance, no enteric coating visible",
    },
    {
        "id": "med_005",
        "name": "Atorvastatin 10mg",
        "uses": "High cholesterol, cardiovascular disease prevention",
        "side_effects": "Muscle pain, liver enzyme elevation, headache",
        "fake_indicators": "Irregular shape, chalk-like texture, missing hologram sticker",
    },
    {
        "id": "med_006",
        "name": "Napa Extra (Paracetamol + Caffeine)",
        "uses": "Headache, migraine, cold symptoms",
        "side_effects": "Insomnia, palpitations, liver risk in overdose",
        "fake_indicators": "Missing Square Pharmaceuticals branding, no batch number on strip",
    },
    {
        "id": "med_007",
        "name": "Ciprofloxacin 500mg",
        "uses": "Urinary tract infections, bacterial diarrhea, typhoid",
        "side_effects": "Tendon rupture risk, photosensitivity, nausea",
        "fake_indicators": "Tablet surface pitting, no company logo on packaging, wrong color (should be white)",
    },
    {
        "id": "med_008",
        "name": "Amlodipine 5mg",
        "uses": "High blood pressure, angina",
        "side_effects": "Ankle swelling, flushing, headache",
        "fake_indicators": "Tablet sticks together, packaging lacks registered trademark symbol",
    },
    {
        "id": "med_009",
        "name": "Diazepam 5mg",
        "uses": "Anxiety, muscle spasms, seizure management",
        "side_effects": "Drowsiness, dependence, cognitive impairment",
        "fake_indicators": "Blister pack seal broken easily, tablet crumbles, no schedule marking on packaging",
    },
    {
        "id": "med_010",
        "name": "Azithromycin 250mg",
        "uses": "Respiratory infections, skin infections, STIs",
        "side_effects": "Nausea, diarrhea, cardiac arrhythmia (rare)",
        "fake_indicators": "Coating peels unevenly, inconsistent tablet weight, spelling errors on packaging",
    },
]


def seed_collection():
    if collection.count() > 0:
        return
    documents = []
    metadatas = []
    ids = []
    for med in SEED_MEDICINES:
        doc = (
            f"Medicine: {med['name']}. "
            f"Uses: {med['uses']}. "
            f"Side effects: {med['side_effects']}. "
            f"Fake indicators: {med['fake_indicators']}."
        )
        documents.append(doc)
        metadatas.append({
            "name": med["name"],
            "uses": med["uses"],
            "side_effects": med["side_effects"],
            "fake_indicators": med["fake_indicators"],
        })
        ids.append(med["id"])
    collection.add(documents=documents, metadatas=metadatas, ids=ids)


seed_collection()


class VerifyRequest(BaseModel):
    query: str


class VerifyResponse(BaseModel):
    result: str
    explanation: str


class InteractionsRequest(BaseModel):
    medicine1: str
    medicine2: str


class InteractionsResponse(BaseModel):
    interaction_level: str
    explanation: str


@app.post("/verify", response_model=VerifyResponse)
async def verify_medicine(body: VerifyRequest):
    results = collection.query(query_texts=[body.query], n_results=3)
    context_parts = []
    if results and results.get("documents"):
        for doc in results["documents"][0]:
            context_parts.append(doc)
    context = "\n\n".join(context_parts)

    prompt = f"""You are a medicine verification assistant for Bangladesh's pharmaceutical market.

Based on the following verified medicine database entries:
{context}

A user is asking about: "{body.query}"

Please analyze whether this appears to be a legitimate medicine. Respond with:
1. A verdict on one of these lines: VERDICT: VERIFIED / VERDICT: SUSPICIOUS / VERDICT: UNKNOWN
2. A clear explanation (2-4 sentences) covering what the medicine is, whether it matches known legitimate medicines, and any concerns.

Be concise and helpful."""

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    text = response.text.strip()

    result = "UNKNOWN"
    if "VERDICT: VERIFIED" in text.upper():
        result = "VERIFIED"
    elif "VERDICT: SUSPICIOUS" in text.upper():
        result = "SUSPICIOUS"

    explanation = text
    for prefix in ["VERDICT: VERIFIED", "VERDICT: SUSPICIOUS", "VERDICT: UNKNOWN"]:
        explanation = explanation.replace(prefix, "").replace(prefix.lower(), "").strip()
    if explanation.startswith("\n"):
        explanation = explanation.lstrip("\n").strip()

    return VerifyResponse(result=result, explanation=explanation)


@app.post("/interactions", response_model=InteractionsResponse)
async def check_interactions(body: InteractionsRequest):
    results1 = collection.query(query_texts=[body.medicine1], n_results=2)
    results2 = collection.query(query_texts=[body.medicine2], n_results=2)

    context_parts = []
    for results in (results1, results2):
        if results and results.get("documents"):
            for doc in results["documents"][0]:
                context_parts.append(doc)
    context = "\n\n".join(context_parts)

    prompt = f"""You are a pharmaceutical interaction checker for Bangladesh's healthcare system.

Based on the following medicine database entries:
{context}

Analyze the potential drug-drug interaction between:
- Medicine 1: "{body.medicine1}"
- Medicine 2: "{body.medicine2}"

Respond with:
1. A verdict on one of these lines: VERDICT: SAFE / VERDICT: MODERATE / VERDICT: HIGH
2. A clear explanation (2-4 sentences) covering what each medicine does, any known interaction risks, and guidance.

Be concise and medically accurate."""

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    text = response.text.strip()

    interaction_level = "MODERATE"
    if "VERDICT: SAFE" in text.upper():
        interaction_level = "SAFE"
    elif "VERDICT: HIGH" in text.upper():
        interaction_level = "HIGH"
    elif "VERDICT: MODERATE" in text.upper():
        interaction_level = "MODERATE"

    explanation = text
    for prefix in ["VERDICT: SAFE", "VERDICT: MODERATE", "VERDICT: HIGH"]:
        explanation = explanation.replace(prefix, "").replace(prefix.lower(), "").strip()
    explanation = explanation.lstrip("\n").strip()

    return InteractionsResponse(interaction_level=interaction_level, explanation=explanation)


@app.get("/health")
async def health():
    return {"status": "ok"}
