"""
One-time script to generate drug_monographs.json and fake_alerts.json using Gemini.
Run once: python generate_datasets.py
Skips generation if output files already exist and are non-empty.
"""
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not set")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash-lite")

DATA_DIR = Path(__file__).parent / "data"
MONOGRAPHS_PATH = DATA_DIR / "drug_monographs.json"
ALERTS_PATH = DATA_DIR / "fake_alerts.json"

BANGLADESHI_MEDICINES = [
    "Napa 500mg", "Napa Extra", "Ace 500mg", "Amodis 400mg", "Seclo 20mg",
    "Losectil 20mg", "Maxpro 20mg", "Pantop 40mg", "Aten 50mg", "Tenolol 50mg",
    "Amlodip 5mg", "Norvasc 5mg", "Clopivas 75mg", "Aspirine 75mg", "Metfin 500mg",
    "Glucophage 500mg", "Gliben 5mg", "Insulin Mixtard 30", "Thyronorm 50mcg",
    "Eltroxin 50mcg", "Amoxil 500mg", "Moxacil 500mg", "Zimax 500mg",
    "Azithromycin 500mg", "Ciprocin 500mg", "Ciprofloxacin 500mg",
    "Cefixime 200mg", "Cefix 200mg", "Doxycycline 100mg", "Vibramycin 100mg",
    "Metronidazole 400mg", "Flagyl 400mg", "Fluconazole 150mg", "Flucon 150mg",
    "Omeprazole 20mg", "Losec 20mg", "Ranitidine 150mg", "Antacid Plus",
    "Domperidone 10mg", "Motilium 10mg", "Ondansetron 4mg", "Zofran 4mg",
    "Loperamide 2mg", "Imodium 2mg", "Oral Saline", "Pedialyte", "Zinc 20mg",
    "ORS Tablet", "Vitamin C 500mg", "Vitamin D3 1000IU", "Calcium 500mg",
    "Ferrous Sulphate 200mg", "Folic Acid 5mg", "Multivitamin Tablet",
    "Diazepam 5mg", "Lorazepam 2mg", "Alprazolam 0.5mg", "Clonazepam 0.5mg",
    "Amitriptyline 25mg", "Imipramine 25mg", "Haloperidol 5mg", "Risperidone 2mg",
    "Prednisolone 5mg", "Dexamethasone 4mg", "Hydrocortisone 100mg",
    "Betamethasone Cream", "Clotrimazole Cream", "Terbinafine Cream",
    "Salbutamol Inhaler", "Ventolin Inhaler", "Montelukast 10mg", "Singulair 10mg",
    "Cetirizine 10mg", "Histacin 10mg", "Loratadine 10mg", "Lorfast 10mg",
    "Ibuprofen 400mg", "Brufen 400mg", "Naproxen 500mg", "Piroxicam 20mg",
    "Diclofenac 50mg", "Voltaren 50mg", "Tramadol 50mg", "Ultram 50mg",
    "Morphine Sulphate 10mg", "Codeine 30mg", "Gabapentin 300mg",
    "Atorvastatin 20mg", "Lipovas 20mg", "Rosuvastatin 10mg", "Crestor 10mg",
    "Losartan 50mg", "Lozar 50mg", "Enalapril 5mg", "Ramipril 5mg",
    "Furosemide 40mg", "Lasix 40mg", "Spironolactone 25mg", "Aldactone 25mg",
    "Digoxin 0.25mg", "Warfarin 5mg", "Heparin Injection", "Enoxaparin 40mg",
]


def call_gemini(prompt: str, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            response = model.generate_content(prompt)
            time.sleep(2)
            return response.text.strip()
        except Exception as e:
            if attempt < retries - 1:
                print(f"  Gemini error (attempt {attempt+1}): {e}. Retrying...")
                time.sleep(2)
            else:
                raise


def parse_json_response(raw: str) -> dict | list:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw.strip())


def generate_monographs():
    if MONOGRAPHS_PATH.exists() and MONOGRAPHS_PATH.stat().st_size > 100:
        print(f"Skipping monographs — {MONOGRAPHS_PATH} already exists")
        return

    print(f"Generating monographs for {len(BANGLADESHI_MEDICINES)} medicines...")
    monographs = []

    for i, name in enumerate(BANGLADESHI_MEDICINES, 1):
        print(f"  [{i}/{len(BANGLADESHI_MEDICINES)}] Generating monograph: {name}")
        prompt = f"""You are a pharmaceutical expert for Bangladesh.
Write a detailed pharmaceutical monograph for: {name}

Return ONLY valid JSON with exactly these fields:
{{
  "name": "{name}",
  "generic_name": "<INN generic name>",
  "category": "<therapeutic category>",
  "mechanism_of_action": "<how the drug works, 2-3 sentences>",
  "uses": ["<indication1>", "<indication2>", "<indication3>"],
  "dosage": "<standard adult dosage and frequency>",
  "contraindications": ["<contraindication1>", "<contraindication2>"],
  "interactions": ["<drug interaction1>", "<drug interaction2>"],
  "side_effects": ["<side effect1>", "<side effect2>", "<side effect3>"],
  "fake_detection_guide": "<how to identify fake/counterfeit versions of this medicine in Bangladesh, 2-3 practical tips>",
  "manufacturer_examples": ["<Bangladeshi company1>", "<Bangladeshi company2>"]
}}
Return ONLY valid JSON, no markdown, no explanation."""

        try:
            raw = call_gemini(prompt)
            monograph = parse_json_response(raw)
            monographs.append(monograph)
        except Exception as e:
            print(f"  ERROR generating {name}: {e}. Skipping.")

        if i % 10 == 0:
            time.sleep(1)

    MONOGRAPHS_PATH.write_text(json.dumps(monographs, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Saved {len(monographs)} monographs to {MONOGRAPHS_PATH}")


def generate_fake_alerts():
    if ALERTS_PATH.exists() and ALERTS_PATH.stat().st_size > 100:
        print(f"Skipping fake alerts — {ALERTS_PATH} already exists")
        return

    print("Generating 30 fake medicine alert records...")
    prompt = """You are a pharmaceutical safety expert for Bangladesh.
Generate 30 realistic counterfeit medicine alert reports from Bangladesh.
These should be plausible reports of fake medicines circulating in Bangladeshi markets.

Return ONLY valid JSON — an array of 30 objects, each with exactly these fields:
[
  {
    "medicine_name": "<name of the genuine medicine being counterfeited>",
    "fake_version_description": "<description of the fake version and how it differs>",
    "how_to_detect": ["<detection tip 1>", "<detection tip 2>", "<detection tip 3>"],
    "reported_location": "<Bangladeshi district or city>",
    "date": "<YYYY-MM-DD between 2022-01-01 and 2025-12-31>",
    "severity": "<low|medium|high>"
  }
]

Use realistic Bangladeshi medicines (Napa, Amodis, Seclo, etc.) and locations (Dhaka, Chittagong, Sylhet, etc.).
Return ONLY valid JSON array, no markdown."""

    try:
        raw = call_gemini(prompt)
        alerts = parse_json_response(raw)
        ALERTS_PATH.write_text(json.dumps(alerts, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Saved {len(alerts)} fake alerts to {ALERTS_PATH}")
    except Exception as e:
        print(f"ERROR generating fake alerts: {e}")


if __name__ == "__main__":
    generate_monographs()
    generate_fake_alerts()
    print("\nDataset generation complete.")
