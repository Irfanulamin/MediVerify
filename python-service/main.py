import os
import json
import base64
import io
from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai
import chromadb
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=GEMINI_API_KEY)

INTERNAL_SECRET = os.environ.get("INTERNAL_SECRET", "")
BACKEND_ORIGIN = os.environ.get("BACKEND_ORIGIN", "http://localhost:3001")

app = FastAPI(title="MediVerify Python Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[BACKEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def require_internal_token(request: Request, call_next):
    if request.url.path in ("/health", "/test"):
        return await call_next(request)
    token = request.headers.get("x-internal-token", "")
    if not INTERNAL_SECRET or token != INTERNAL_SECRET:
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return await call_next(request)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="medicines")

SEED_MEDICINES = [
    {"id": "med_001", "name": "Paracetamol 500mg", "genericName": "Paracetamol", "manufacturer": "Various", "uses": "Pain relief, fever reduction", "side_effects": "Liver damage in overdose, nausea", "fake_indicators": "Unusual smell, crumbling texture, no embossed marking", "alternatives": "Napa, Ace, Typenol"},
    {"id": "med_002", "name": "Amoxicillin 500mg", "genericName": "Amoxicillin", "manufacturer": "Various", "uses": "Bacterial infections, respiratory tract infections", "side_effects": "Diarrhea, rash, allergic reactions", "fake_indicators": "Powder leaking from capsule, discoloration, no manufacturer seal", "alternatives": "Moxacil, Amoxil"},
    {"id": "med_003", "name": "Metformin 500mg", "genericName": "Metformin HCl", "manufacturer": "Various", "uses": "Type 2 diabetes management, blood sugar control", "side_effects": "Nausea, diarrhea, lactic acidosis (rare)", "fake_indicators": "Uneven tablet size, no score line, faded imprint", "alternatives": "Glucophage, Diaformin"},
    {"id": "med_004", "name": "Omeprazole 20mg", "genericName": "Omeprazole", "manufacturer": "Various", "uses": "Acid reflux, gastric ulcers, GERD", "side_effects": "Headache, diarrhea, vitamin B12 deficiency long-term", "fake_indicators": "Capsule easily opens without resistance, no enteric coating visible", "alternatives": "Seclo, Losectil, Omez"},
    {"id": "med_005", "name": "Atorvastatin 10mg", "genericName": "Atorvastatin Calcium", "manufacturer": "Various", "uses": "High cholesterol, cardiovascular disease prevention", "side_effects": "Muscle pain, liver enzyme elevation, headache", "fake_indicators": "Irregular shape, chalk-like texture, missing hologram sticker", "alternatives": "Lipitor, Atova"},
    {"id": "med_006", "name": "Napa Extra", "genericName": "Paracetamol + Caffeine", "manufacturer": "Beximco Pharmaceuticals", "uses": "Headache, migraine, cold symptoms", "side_effects": "Insomnia, palpitations, liver risk in overdose", "fake_indicators": "Missing Beximco branding, no batch number on strip, wrong font on blister", "alternatives": "Ace Plus, Paracetamol + Caffeine generic"},
    {"id": "med_007", "name": "Ciprofloxacin 500mg", "genericName": "Ciprofloxacin HCl", "manufacturer": "Various", "uses": "Urinary tract infections, bacterial diarrhea, typhoid", "side_effects": "Tendon rupture risk, photosensitivity, nausea", "fake_indicators": "Tablet surface pitting, no company logo on packaging, wrong color (should be white)", "alternatives": "Ciprocin, Cifran"},
    {"id": "med_008", "name": "Amlodipine 5mg", "genericName": "Amlodipine Besylate", "manufacturer": "Various", "uses": "High blood pressure, angina", "side_effects": "Ankle swelling, flushing, headache", "fake_indicators": "Tablet sticks together, packaging lacks registered trademark symbol", "alternatives": "Amlovas, Norvasc"},
    {"id": "med_009", "name": "Diazepam 5mg", "genericName": "Diazepam", "manufacturer": "Various", "uses": "Anxiety, muscle spasms, seizure management", "side_effects": "Drowsiness, dependence, cognitive impairment", "fake_indicators": "Blister pack seal broken easily, tablet crumbles, no schedule marking on packaging", "alternatives": "Valium, Seduxen"},
    {"id": "med_010", "name": "Azithromycin 250mg", "genericName": "Azithromycin", "manufacturer": "Various", "uses": "Respiratory infections, skin infections, STIs", "side_effects": "Nausea, diarrhea, cardiac arrhythmia (rare)", "fake_indicators": "Coating peels unevenly, inconsistent tablet weight, spelling errors on packaging", "alternatives": "Zithromax, Azicin"},
    {"id": "med_011", "name": "Napa 500mg", "genericName": "Paracetamol", "manufacturer": "Beximco Pharmaceuticals", "uses": "Pain relief, fever reduction", "side_effects": "Liver damage in overdose", "fake_indicators": "Missing Beximco logo, blister print quality poor, tablet color slightly off-white", "alternatives": "Ace, Paracetamol generic"},
    {"id": "med_012", "name": "Seclo 20mg", "genericName": "Omeprazole", "manufacturer": "Square Pharmaceuticals", "uses": "Acid reflux, peptic ulcer, GERD", "side_effects": "Headache, diarrhea, abdominal pain", "fake_indicators": "Capsule discolored, no Square Pharmaceuticals seal, wrong capsule size", "alternatives": "Omeprazole generic, Losectil"},
    {"id": "med_013", "name": "Amodis 400mg", "genericName": "Metronidazole", "manufacturer": "Square Pharmaceuticals", "uses": "Bacterial and parasitic infections, amoebic dysentery", "side_effects": "Nausea, metallic taste, dizziness", "fake_indicators": "Tablet does not have score line, packaging color faded, no batch number", "alternatives": "Metronidazole generic, Flagyl"},
    {"id": "med_014", "name": "Ciprocin 500mg", "genericName": "Ciprofloxacin", "manufacturer": "Square Pharmaceuticals", "uses": "Typhoid, UTI, respiratory infections", "side_effects": "Nausea, dizziness, tendon damage (rare)", "fake_indicators": "Tablet color not bright white, no Square branding on strip, imprint blurred", "alternatives": "Ciprofloxacin generic, Cifran"},
    {"id": "med_015", "name": "Losectil 20mg", "genericName": "Omeprazole", "manufacturer": "Incepta Pharmaceuticals", "uses": "Gastric ulcer, GERD, H. pylori eradication", "side_effects": "Headache, diarrhea, nausea", "fake_indicators": "Capsule color inconsistent, Incepta branding missing, no expiry embossed", "alternatives": "Seclo, Omeprazole generic"},
    {"id": "med_016", "name": "Atenolol 50mg", "genericName": "Atenolol", "manufacturer": "Various", "uses": "Hypertension, angina, heart rate control", "side_effects": "Fatigue, cold extremities, bradycardia", "fake_indicators": "Tablet lacks score line, no manufacturer embossing, packaging seal broken", "alternatives": "Tenormin, Aten"},
    {"id": "med_017", "name": "Metronidazole 400mg", "genericName": "Metronidazole", "manufacturer": "Various", "uses": "Anaerobic bacterial infections, protozoal infections", "side_effects": "Metallic taste, nausea, peripheral neuropathy", "fake_indicators": "Tablet crumbles, no batch code on packaging, label printing quality poor", "alternatives": "Amodis, Flagyl"},
    {"id": "med_018", "name": "Cetirizine 10mg", "genericName": "Cetirizine HCl", "manufacturer": "Various", "uses": "Allergic rhinitis, urticaria, hay fever", "side_effects": "Drowsiness, dry mouth, headache", "fake_indicators": "Tablet size inconsistent, no scored line, packaging font differs from original", "alternatives": "Zirtec, Aller-C"},
    {"id": "med_019", "name": "Losartan 50mg", "genericName": "Losartan Potassium", "manufacturer": "Various", "uses": "Hypertension, heart failure, diabetic nephropathy", "side_effects": "Dizziness, hyperkalemia, upper respiratory infection", "fake_indicators": "Tablet color not consistent, missing hologram, no registered trademark", "alternatives": "Cozaar, Losacar"},
    {"id": "med_020", "name": "Fluconazole 150mg", "genericName": "Fluconazole", "manufacturer": "Various", "uses": "Fungal infections, candidiasis, cryptococcal meningitis", "side_effects": "Nausea, headache, hepatotoxicity (rare)", "fake_indicators": "Capsule weight inconsistent, no manufacturer code, broken foil seal", "alternatives": "Diflucan, Flucoral"},
    {"id": "med_021", "name": "Pantoprazole 40mg", "genericName": "Pantoprazole Sodium", "manufacturer": "Various", "uses": "GERD, erosive esophagitis, Zollinger-Ellison syndrome", "side_effects": "Headache, diarrhea, abdominal pain", "fake_indicators": "Enteric coating missing, tablet disintegrates in hand, packaging seal peeled", "alternatives": "Pantop, Protonix"},
    {"id": "med_022", "name": "Clopidogrel 75mg", "genericName": "Clopidogrel Bisulfate", "manufacturer": "Various", "uses": "Prevention of heart attack and stroke, ACS", "side_effects": "Bleeding risk, bruising, gastrointestinal upset", "fake_indicators": "Tablet color not standard pink, no debossed marking, packaging tamper evident missing", "alternatives": "Plavix, Clopilet"},
    {"id": "med_023", "name": "Glimepiride 2mg", "genericName": "Glimepiride", "manufacturer": "Various", "uses": "Type 2 diabetes, blood sugar lowering", "side_effects": "Hypoglycemia, weight gain, nausea", "fake_indicators": "Tablet size variation, no embossed G-2 marking, wrong hue of pink", "alternatives": "Amaryl, Glimpid"},
    {"id": "med_024", "name": "Rabeprazole 20mg", "genericName": "Rabeprazole Sodium", "manufacturer": "Various", "uses": "GERD, peptic ulcer, H. pylori treatment", "side_effects": "Headache, diarrhea, flatulence", "fake_indicators": "Enteric coating absent, capsule discolored, missing product code on blister", "alternatives": "Aciphex, Razo"},
    {"id": "med_025", "name": "Amitriptyline 25mg", "genericName": "Amitriptyline HCl", "manufacturer": "Various", "uses": "Depression, neuropathic pain, migraine prevention", "side_effects": "Drowsiness, dry mouth, constipation, cardiac effects", "fake_indicators": "Tablet coating uneven, no scored line, packaging lacks schedule information", "alternatives": "Elavil, Tryptanol"},
    {"id": "med_026", "name": "Prednisolone 5mg", "genericName": "Prednisolone", "manufacturer": "Various", "uses": "Inflammatory conditions, asthma, autoimmune diseases", "side_effects": "Weight gain, immunosuppression, osteoporosis long-term", "fake_indicators": "Tablet crumbles, no debossed dosage, packaging print quality poor", "alternatives": "Deltacortril, Meticortelone"},
    {"id": "med_027", "name": "Salbutamol Inhaler 100mcg", "genericName": "Salbutamol", "manufacturer": "GlaxoSmithKline", "uses": "Asthma, COPD, bronchospasm relief", "side_effects": "Tremor, palpitations, headache", "fake_indicators": "Inhaler nozzle color wrong (should be blue), canister weight light, no dose counter", "alternatives": "Ventolin, Asthalin"},
    {"id": "med_028", "name": "Insulin Regular 100IU/mL", "genericName": "Human Insulin", "manufacturer": "Novo Nordisk / Sanofi", "uses": "Type 1 and Type 2 diabetes management", "side_effects": "Hypoglycemia, injection site reactions, weight gain", "fake_indicators": "Vial cloudy when should be clear, no cold chain seal, expiry print quality poor", "alternatives": "Actrapid, Humulin R"},
    {"id": "med_029", "name": "Doxycycline 100mg", "genericName": "Doxycycline Hyclate", "manufacturer": "Various", "uses": "Bacterial infections, malaria prophylaxis, acne", "side_effects": "Photosensitivity, nausea, esophageal irritation", "fake_indicators": "Capsule color not yellow, powder inside discolored brown, no manufacturer info on strip", "alternatives": "Vibramycin, Doxylin"},
    {"id": "med_030", "name": "Folic Acid 5mg", "genericName": "Folic Acid", "manufacturer": "Various", "uses": "Folate deficiency, pregnancy supplementation, megaloblastic anemia", "side_effects": "Rare at normal doses; nausea at high doses", "fake_indicators": "Tablet color not consistent yellow, no expiry on individual strip, packaging lacks dosage info", "alternatives": "Folate, Folicare"},
]


def seed_collection():
    count = collection.count()
    print(f"ChromaDB contains {count} medicines")
    if count > 0:
        return

    print("ChromaDB is empty. Seeding now...")
    existing_ids: set = set()
    try:
        existing = collection.get()
        existing_ids = set(existing.get("ids", []))
    except Exception:
        pass

    documents, metadatas, ids = [], [], []
    for med in SEED_MEDICINES:
        if med["id"] in existing_ids:
            continue
        doc = (
            f"Medicine: {med['name']}. Generic: {med['genericName']}. "
            f"Manufacturer: {med['manufacturer']}. Uses: {med['uses']}. "
            f"Side effects: {med['side_effects']}. "
            f"Fake indicators: {med['fake_indicators']}. "
            f"Alternatives: {med['alternatives']}."
        )
        documents.append(doc)
        metadatas.append({
            "name": med["name"],
            "genericName": med["genericName"],
            "manufacturer": med["manufacturer"],
            "uses": med["uses"],
            "side_effects": med["side_effects"],
            "fake_indicators": med["fake_indicators"],
            "alternatives": med["alternatives"],
        })
        ids.append(med["id"])

    if documents:
        collection.add(documents=documents, metadatas=metadatas, ids=ids)
        for med in SEED_MEDICINES:
            if med["id"] in ids:
                print(f"  Stored: {med['name']}")


seed_collection()
print(f"Startup complete. ChromaDB has {collection.count()} medicines.")


# ─── Models ──────────────────────────────────────────────────────────────────

class VerifyRequest(BaseModel):
    query: str = ""
    image: Optional[str] = None


class VerifyResponse(BaseModel):
    result: str
    trustScore: int
    explanation: str
    medicineName: str
    genericName: str
    manufacturer: str
    fakeIndicators: list[str]
    safeAlternatives: list[str]
    foundInDatabase: bool = False
    uses: list[str] = []
    sideEffects: list[str] = []
    couldReadImage: Optional[bool] = None
    generalInfo: Optional[str] = None


class InteractionsRequest(BaseModel):
    medicine1: str
    medicine2: str


class InteractionsResponse(BaseModel):
    interaction_level: str
    severity: str
    explanation: str
    recommendation: str


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


def _parse_list(text: str, marker: str) -> list[str]:
    lines = text.split("\n")
    collecting = False
    items = []
    for line in lines:
        if marker.lower() in line.lower():
            collecting = True
            continue
        if collecting:
            stripped = line.strip().lstrip("-•*").strip()
            if stripped and not stripped.endswith(":"):
                items.append(stripped)
            elif not stripped:
                collecting = False
    return items[:5]


def _extract_field(text: str, label: str) -> str:
    for line in text.split("\n"):
        if line.strip().lower().startswith(label.lower()):
            return line.split(":", 1)[-1].strip()
    return ""


def _not_found_response(query: str, could_read_image: Optional[bool] = None) -> VerifyResponse:
    return VerifyResponse(
        result="UNKNOWN",
        trustScore=0,
        explanation="Medicine not found in our database.",
        medicineName=query,
        genericName="",
        manufacturer="",
        fakeIndicators=[],
        safeAlternatives=[],
        foundInDatabase=False,
        uses=[],
        sideEffects=[],
        couldReadImage=could_read_image,
    )


def _unreadable_image_response() -> VerifyResponse:
    return VerifyResponse(
        result="UNKNOWN",
        trustScore=0,
        explanation="Could not read image clearly. Please try better lighting or type the name.",
        medicineName="",
        genericName="",
        manufacturer="",
        fakeIndicators=[],
        safeAlternatives=[],
        foundInDatabase=False,
        uses=[],
        sideEffects=[],
        couldReadImage=False,
    )


def _general_knowledge_verify(query: str, could_read_image: Optional[bool] = None) -> VerifyResponse:
    """Call Gemini without RAG context when ChromaDB has no good match."""
    print(f"Using general knowledge fallback for: {query}")
    prompt = f"""You are a medicine expert for Bangladesh's pharmaceutical market.
The user is asking about: "{query}"
This medicine is NOT in our verified database.

Using your general pharmaceutical knowledge, provide information about this medicine.
Return ONLY valid JSON (no markdown, no backticks):
{{
  "trust_score": <integer 40-60, since this is unverified general knowledge>,
  "is_verified": false,
  "found_in_database": false,
  "medicine_name": "<corrected spelling of the medicine name if there is a typo, otherwise as given>",
  "general_info": "<1-2 sentence plain-language description of what this medicine is used for>",
  "explanation": "Not in our verified database. General information only — accuracy not guaranteed.",
  "recommendation": "Please verify with a licensed pharmacist before use.",
  "safe_alternatives": []
}}

Return ONLY valid JSON."""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        print("Gemini general-knowledge response received")
        data = json.loads(_strip_fences(response.text.strip()))
        trust_score = max(0, min(100, int(data.get("trust_score", 50))))
        return VerifyResponse(
            result="UNKNOWN",
            trustScore=trust_score,
            explanation=data.get("explanation", "Not in our verified database. General information only."),
            medicineName=data.get("medicine_name", query),
            genericName="",
            manufacturer="",
            fakeIndicators=[],
            safeAlternatives=data.get("safe_alternatives", []),
            foundInDatabase=False,
            uses=[],
            sideEffects=[],
            couldReadImage=could_read_image,
            generalInfo=data.get("general_info", ""),
        )
    except Exception as e:
        print(f"General knowledge fallback failed: {e}")
        return _not_found_response(query, could_read_image)


def _rag_verify(query: str, could_read_image: Optional[bool] = None) -> VerifyResponse:
    """Core RAG verification: ChromaDB query → Gemini JSON → VerifyResponse."""
    print(f"Querying ChromaDB for: {query}")
    results = collection.query(query_texts=[query], n_results=3)

    docs = results.get("documents", [[]])[0] if results else []
    distances = results.get("distances", [[]])[0] if results else []
    top_distance = distances[0] if distances else None
    print(f"ChromaDB returned {len(docs)} results" + (f" (top distance: {top_distance:.3f})" if top_distance is not None else ""))

    if not docs or (top_distance is not None and top_distance > 1.5):
        if not docs:
            print("No ChromaDB results. Using general knowledge fallback.")
        else:
            print(f"No RAG match (distance={top_distance:.2f}). Using general knowledge fallback.")
        return _general_knowledge_verify(query, could_read_image)

    context = "\n\n".join(docs)
    print(f"Calling Gemini with context length: {len(context)}")

    prompt = f"""You are MediVerify AI for Bangladesh's pharmaceutical market.

Here is verified medicine data from our database:
{context}

A user is asking about: "{query}"

Return ONLY valid JSON with no markdown, no backticks, no explanation:
{{
  "trust_score": <integer 0-100, how well this medicine matches the database>,
  "is_verified": <boolean, true if this appears to be a legitimate medicine>,
  "medicine_name": "<correct brand name from database>",
  "generic_name": "<generic/INN name>",
  "manufacturer": "<manufacturer name>",
  "uses": ["<use 1>", "<use 2>", "<use 3>"],
  "side_effects": ["<side effect 1>", "<side effect 2>", "<side effect 3>"],
  "explanation": "<2-3 sentences explaining the trust score and verification status>",
  "fake_indicators": ["<indicator 1>", "<indicator 2>", "<indicator 3>"],
  "safe_alternatives": ["<alternative 1>", "<alternative 2>"],
  "found_in_database": true
}}

Scoring guide:
- 80-100: Medicine name closely matches database entry
- 40-79: Partial match or generic name match
- 0-39: Unknown or suspicious

Return ONLY valid JSON."""

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    print("Gemini response received")
    text = response.text.strip()

    try:
        data = json.loads(_strip_fences(text))
        raw_score = data.get("trust_score", 0)
        trust_score = max(0, min(100, int(raw_score)))
        is_verified = bool(data.get("is_verified", False))

        if is_verified:
            result = "VERIFIED"
        elif trust_score >= 40:
            result = "SUSPICIOUS"
        else:
            result = "UNKNOWN"

        return VerifyResponse(
            result=result,
            trustScore=trust_score,
            explanation=data.get("explanation", ""),
            medicineName=data.get("medicine_name", query),
            genericName=data.get("generic_name", ""),
            manufacturer=data.get("manufacturer", ""),
            fakeIndicators=data.get("fake_indicators", []),
            safeAlternatives=data.get("safe_alternatives", []),
            foundInDatabase=bool(data.get("found_in_database", True)),
            uses=data.get("uses", []),
            sideEffects=data.get("side_effects", []),
            couldReadImage=could_read_image,
        )
    except (json.JSONDecodeError, ValueError, TypeError):
        # Fallback: structured-text extraction
        print("Gemini JSON parse failed, falling back to text extraction")
        result = "UNKNOWN"
        if "VERIFIED" in text.upper():
            result = "VERIFIED"
        elif "SUSPICIOUS" in text.upper():
            result = "SUSPICIOUS"

        return VerifyResponse(
            result=result,
            trustScore=0,
            explanation=_extract_field(text, "EXPLANATION") or text[:300],
            medicineName=_extract_field(text, "MEDICINE NAME") or query,
            genericName=_extract_field(text, "GENERIC NAME"),
            manufacturer=_extract_field(text, "MANUFACTURER"),
            fakeIndicators=_parse_list(text, "FAKE INDICATORS"),
            safeAlternatives=_parse_list(text, "SAFE ALTERNATIVES"),
            foundInDatabase=False,
            uses=[],
            sideEffects=[],
            couldReadImage=could_read_image,
        )


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.post("/verify", response_model=VerifyResponse)
async def verify_medicine(body: VerifyRequest):
    # ── Image path ──────────────────────────────────────────────────────────
    if body.image:
        try:
            import PIL.Image
            image_bytes = base64.b64decode(body.image)
            pil_image = PIL.Image.open(io.BytesIO(image_bytes))

            vision_prompt = """Look at this medicine packaging image carefully.
Extract what you can read and return ONLY valid JSON (no markdown, no backticks):
{
  "medicine_name": "<brand name or null if unreadable>",
  "batch_number": "<batch number or null>",
  "expiry_date": "<expiry date or null>",
  "manufacturer": "<manufacturer or null>",
  "could_read_image": <true if you could read the medicine name, false if image is too blurry/unclear>
}
If you cannot read anything clearly, set could_read_image to false and all other fields to null."""

            vision_model = genai.GenerativeModel("gemini-1.5-flash")
            vision_response = vision_model.generate_content([vision_prompt, pil_image])
            extracted = json.loads(_strip_fences(vision_response.text))

            if extracted.get("could_read_image") and extracted.get("medicine_name"):
                return _rag_verify(extracted["medicine_name"], could_read_image=True)
            else:
                return _unreadable_image_response()

        except Exception as e:
            print(f"Image processing error: {e}")
            return _unreadable_image_response()

    # ── Text path ────────────────────────────────────────────────────────────
    query = body.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="query or image required")

    return _rag_verify(query)


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

Analyze the drug-drug interaction between:
- Medicine 1: "{body.medicine1}"
- Medicine 2: "{body.medicine2}"

Respond in EXACTLY this format:
VERDICT: SAFE | MODERATE | HIGH
EXPLANATION: <2-3 sentences about the interaction mechanism and risks>
RECOMMENDATION: <specific actionable advice for the patient or pharmacist>"""

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

    severity_map = {"SAFE": "mild", "MODERATE": "moderate", "HIGH": "severe"}
    severity = severity_map[interaction_level]

    explanation = _extract_field(text, "EXPLANATION")
    recommendation = _extract_field(text, "RECOMMENDATION")

    if not explanation:
        explanation = text[:300]
    if not recommendation:
        recommendation = "Consult your doctor or pharmacist before taking these medicines together."

    return InteractionsResponse(
        interaction_level=interaction_level,
        severity=severity,
        explanation=explanation,
        recommendation=recommendation,
    )


@app.get("/search")
async def search_medicines(q: str = ""):
    if not q.strip():
        return []

    try:
        results = collection.query(query_texts=[q], n_results=5)
        items = []
        if results and results.get("metadatas"):
            for i, meta in enumerate(results["metadatas"][0]):
                items.append({
                    "id": results["ids"][0][i],
                    "name": meta.get("name", ""),
                    "genericName": meta.get("genericName", ""),
                    "manufacturer": meta.get("manufacturer", ""),
                })
        return items
    except Exception:
        return []


@app.get("/health")
async def health():
    return {"status": "ok", "medicines_in_chromadb": collection.count()}


@app.get("/test")
async def test_chromadb():
    """Debug endpoint — query ChromaDB for Napa Extra and return raw result. Delete after confirming real data."""
    result = collection.query(query_texts=["Napa Extra"], n_results=3)
    return result


# ─── AI Explain & Symptoms ───────────────────────────────────────────────────

class MedicineExplainRequest(BaseModel):
    medicine_name: str


class SymptomsRequest(BaseModel):
    symptoms: str


@app.post("/explain")
async def explain_medicine(body: MedicineExplainRequest):
    prompt = f"""You are a pharmacist assistant. Explain the medicine "{body.medicine_name}" in simple, plain language for a patient in Bangladesh.

Respond in EXACTLY this format:
SUMMARY: <1-2 sentences on what it treats>
SIDE_EFFECTS: <2-3 most common side effects in plain language, no jargon>
DOSAGE: <standard dosage range — e.g. 1 tablet (500mg) every 4-6 hours, max 4g/day>

Keep each section to 1-2 sentences. Be clear and direct."""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()

        summary = _extract_field(text, "SUMMARY")
        side_effects = _extract_field(text, "SIDE_EFFECTS")
        dosage = _extract_field(text, "DOSAGE")

        return {
            "summary": summary or "Information not available.",
            "sideEffects": side_effects or "Consult your doctor.",
            "dosage": dosage or "Follow your doctor's instructions.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/symptoms")
async def check_symptoms(body: SymptomsRequest):
    prompt = f"""A patient in Bangladesh describes the following symptoms: "{body.symptoms}"

List 3-5 common medicines a doctor might consider for these symptoms. For each, give the generic name and one short reason why a doctor might prescribe it.

Respond in EXACTLY this format (one medicine per line after MEDICINES:):
MEDICINES:
- <Generic Name>: <one sentence reason>
- <Generic Name>: <one sentence reason>
- <Generic Name>: <one sentence reason>
DISCLAIMER: This is not medical advice. Please consult a qualified doctor or pharmacist before taking any medication."""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()

        medicines = []
        disclaimer = ""
        collecting = False
        for line in text.split("\n"):
            stripped = line.strip()
            if stripped.upper().startswith("MEDICINES:"):
                collecting = True
                continue
            if stripped.upper().startswith("DISCLAIMER:"):
                disclaimer = stripped.split(":", 1)[-1].strip()
                collecting = False
                continue
            if collecting and stripped.startswith("-"):
                parts = stripped.lstrip("-").strip().split(":", 1)
                if len(parts) == 2:
                    medicines.append({"name": parts[0].strip(), "reason": parts[1].strip()})

        if not disclaimer:
            disclaimer = "This is not medical advice. Please consult a qualified doctor or pharmacist before taking any medication."

        return {"medicines": medicines, "disclaimer": disclaimer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
