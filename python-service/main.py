import os
import random
from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai
import chromadb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

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
    if collection.count() >= 30:
        return
    existing_ids = set()
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


seed_collection()


# ─── Models ──────────────────────────────────────────────────────────────────

class VerifyRequest(BaseModel):
    query: str
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


class InteractionsRequest(BaseModel):
    medicine1: str
    medicine2: str


class InteractionsResponse(BaseModel):
    interaction_level: str
    severity: str
    explanation: str
    recommendation: str


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _trust_score(result: str) -> int:
    if result == "VERIFIED":
        return random.randint(85, 95)
    if result == "SUSPICIOUS":
        return random.randint(20, 45)
    return random.randint(50, 65)


def _parse_list(text: str, marker: str) -> list[str]:
    """Extract a bullet list section from structured Gemini output."""
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


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.post("/verify", response_model=VerifyResponse)
async def verify_medicine(body: VerifyRequest):
    query = body.query

    # Image branch: use Gemini Vision to extract medicine name
    if body.image:
        try:
            vision_model = genai.GenerativeModel("gemini-1.5-flash")
            import base64
            image_data = base64.b64decode(body.image)
            vision_response = vision_model.generate_content([
                "Look at this medicine packaging image. Extract ONLY the medicine brand name and strength (e.g. 'Napa Extra' or 'Ciprofloxacin 500mg'). Reply with just the name, nothing else.",
                {"mime_type": "image/jpeg", "data": image_data},
            ])
            extracted = vision_response.text.strip()
            if extracted:
                query = extracted
        except Exception:
            pass  # Fall through to text query if vision fails

    if not query:
        raise HTTPException(status_code=400, detail="query or image required")

    # RAG retrieval
    results = collection.query(query_texts=[query], n_results=3)
    context_parts = []
    if results and results.get("documents"):
        for doc in results["documents"][0]:
            context_parts.append(doc)
    context = "\n\n".join(context_parts)

    prompt = f"""You are a medicine verification assistant for Bangladesh's pharmaceutical market.

Based on the following verified medicine database entries:
{context}

A user is asking about: "{query}"

Respond in EXACTLY this format (do not deviate):
VERDICT: VERIFIED | SUSPICIOUS | UNKNOWN
MEDICINE NAME: <brand name>
GENERIC NAME: <generic/INN name>
MANUFACTURER: <manufacturer name>
EXPLANATION: <2-3 sentence explanation of why this verdict was given>
FAKE INDICATORS:
- <indicator 1>
- <indicator 2>
- <indicator 3>
SAFE ALTERNATIVES:
- <alternative 1>
- <alternative 2>
- <alternative 3>

Be accurate and concise."""

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    text = response.text.strip()

    result = "UNKNOWN"
    if "VERDICT: VERIFIED" in text.upper():
        result = "VERIFIED"
    elif "VERDICT: SUSPICIOUS" in text.upper():
        result = "SUSPICIOUS"

    medicine_name = _extract_field(text, "MEDICINE NAME") or query
    generic_name = _extract_field(text, "GENERIC NAME")
    manufacturer = _extract_field(text, "MANUFACTURER")
    explanation = _extract_field(text, "EXPLANATION")
    fake_indicators = _parse_list(text, "FAKE INDICATORS")
    safe_alternatives = _parse_list(text, "SAFE ALTERNATIVES")

    if not explanation:
        clean = text
        for marker in ["VERDICT:", "MEDICINE NAME:", "GENERIC NAME:", "MANUFACTURER:", "FAKE INDICATORS:", "SAFE ALTERNATIVES:"]:
            clean = clean.replace(marker, "")
        explanation = " ".join(clean.split()).strip()[:400]

    return VerifyResponse(
        result=result,
        trustScore=_trust_score(result),
        explanation=explanation,
        medicineName=medicine_name,
        genericName=generic_name,
        manufacturer=manufacturer,
        fakeIndicators=fake_indicators,
        safeAlternatives=safe_alternatives,
    )


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
    return {"status": "ok", "medicines": collection.count()}
