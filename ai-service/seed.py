import json
from pathlib import Path

from rag import (
    medicines_collection,
    monographs_collection,
    alerts_collection,
)

DATA_DIR = Path(__file__).parent / "data"


def seed_medicines() -> int:
    if medicines_collection.count() > 0:
        count = medicines_collection.count()
        print(f"ChromaDB medicines already seeded ({count}). Skipping.")
        return count

    data_path = DATA_DIR / "medicines.json"
    with open(data_path, encoding="utf-8") as f:
        medicines = json.load(f)

    ids, documents, metadatas = [], [], []

    for med in medicines:
        name = med["name"]
        uses = med.get("uses", [])
        side_effects = med.get("sideEffects", [])
        fake_indicators = med.get("fakeIndicators", [])
        safe_alternatives = med.get("safeAlternatives", [])

        doc = (
            f"Medicine: {name}. "
            f"Generic: {med.get('genericName', '')}. "
            f"Manufacturer: {med.get('manufacturer', '')}. "
            f"Category: {med.get('category', '')}. "
            f"Uses: {', '.join(uses)}. "
            f"Side effects: {', '.join(side_effects)}. "
            f"Dosage: {med.get('dosage', '')}. "
            f"Price (BDT): {med.get('price_bdt', '')}. "
            f"Requires prescription: {med.get('requires_prescription', '')}. "
            f"Fake indicators: {', '.join(fake_indicators)}. "
            f"Safe alternatives: {', '.join(safe_alternatives)}."
        )
        med_id = name.lower().replace(" ", "-").replace("/", "-")

        ids.append(med_id)
        documents.append(doc)
        metadatas.append({
            "name": name,
            "genericName": med.get("genericName", ""),
            "manufacturer": med.get("manufacturer", ""),
            "uses": ", ".join(uses),
            "sideEffects": ", ".join(side_effects),
            "fakeIndicators": ", ".join(fake_indicators),
            "safeAlternatives": ", ".join(safe_alternatives),
        })

    medicines_collection.add(ids=ids, documents=documents, metadatas=metadatas)
    count = medicines_collection.count()
    print(f"Seeded {count} medicines into ChromaDB")
    return count


def seed_monographs() -> int:
    if monographs_collection.count() > 0:
        count = monographs_collection.count()
        print(f"ChromaDB drug_monographs already seeded ({count}). Skipping.")
        return count

    data_path = DATA_DIR / "drug_monographs.json"
    if not data_path.exists():
        print("drug_monographs.json not found. Run generate_datasets.py first.")
        return 0

    with open(data_path, encoding="utf-8") as f:
        monographs = json.load(f)

    ids, documents, metadatas = [], [], []

    for mono in monographs:
        name = mono.get("name", "")
        doc = (
            f"Medicine: {name}. "
            f"Generic: {mono.get('generic_name', '')}. "
            f"Category: {mono.get('category', '')}. "
            f"Mechanism: {mono.get('mechanism_of_action', '')}. "
            f"Uses: {', '.join(mono.get('uses', []))}. "
            f"Dosage: {mono.get('dosage', '')}. "
            f"Contraindications: {', '.join(mono.get('contraindications', []))}. "
            f"Interactions: {', '.join(mono.get('interactions', []))}. "
            f"Side effects: {', '.join(mono.get('side_effects', []))}. "
            f"Fake detection: {mono.get('fake_detection_guide', '')}."
        )
        mono_id = name.lower().replace(" ", "-").replace("/", "-") + "-monograph"

        ids.append(mono_id)
        documents.append(doc)
        metadatas.append({
            "name": name,
            "generic_name": mono.get("generic_name", ""),
            "category": mono.get("category", ""),
            "dosage": mono.get("dosage", ""),
        })

    monographs_collection.add(ids=ids, documents=documents, metadatas=metadatas)
    count = monographs_collection.count()
    print(f"Seeded {count} drug monographs into ChromaDB")
    return count


def seed_fake_alerts() -> int:
    if alerts_collection.count() > 0:
        count = alerts_collection.count()
        print(f"ChromaDB fake_alerts already seeded ({count}). Skipping.")
        return count

    data_path = DATA_DIR / "fake_alerts.json"
    if not data_path.exists():
        print("fake_alerts.json not found. Run generate_datasets.py first.")
        return 0

    with open(data_path, encoding="utf-8") as f:
        alerts = json.load(f)

    ids, documents, metadatas = [], [], []

    for i, alert in enumerate(alerts):
        med_name = alert.get("medicine_name", "")
        tips = alert.get("how_to_detect", [])
        doc = (
            f"FAKE ALERT: {med_name}. "
            f"Fake version: {alert.get('fake_version_description', '')}. "
            f"How to detect: {', '.join(tips)}. "
            f"Reported in: {alert.get('reported_location', '')}. "
            f"Date: {alert.get('date', '')}. "
            f"Severity: {alert.get('severity', '')}."
        )
        alert_id = f"alert-{i}-{med_name.lower().replace(' ', '-').replace('/', '-')}"

        ids.append(alert_id)
        documents.append(doc)
        metadatas.append({
            "medicine_name": med_name,
            "reported_location": alert.get("reported_location", ""),
            "date": alert.get("date", ""),
            "severity": alert.get("severity", ""),
        })

    alerts_collection.add(ids=ids, documents=documents, metadatas=metadatas)
    count = alerts_collection.count()
    print(f"Seeded {count} fake alerts into ChromaDB")
    return count
