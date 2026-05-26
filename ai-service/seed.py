import json
import os
from pathlib import Path

from rag import collection


def seed_medicines() -> int:
    if collection.count() > 0:
        print(f"ChromaDB already seeded ({collection.count()} medicines). Skipping.")
        return collection.count()

    data_path = Path(__file__).parent / "data" / "medicines.json"
    with open(data_path, encoding="utf-8") as f:
        medicines = json.load(f)

    ids, documents, metadatas = [], [], []

    for med in medicines:
        name = med["name"]
        doc = (
            f"Medicine: {name}. "
            f"Generic: {med['genericName']}. "
            f"Manufacturer: {med['manufacturer']}. "
            f"Uses: {', '.join(med['uses'])}. "
            f"Side effects: {', '.join(med['sideEffects'])}. "
            f"Fake indicators: {', '.join(med['fakeIndicators'])}. "
            f"Safe alternatives: {', '.join(med['safeAlternatives'])}."
        )
        med_id = name.lower().replace(" ", "-").replace("/", "-")

        ids.append(med_id)
        documents.append(doc)
        metadatas.append({
            "name": name,
            "genericName": med["genericName"],
            "manufacturer": med["manufacturer"],
            "uses": ", ".join(med["uses"]),
            "sideEffects": ", ".join(med["sideEffects"]),
            "fakeIndicators": ", ".join(med["fakeIndicators"]),
            "safeAlternatives": ", ".join(med["safeAlternatives"]),
        })

    collection.add(ids=ids, documents=documents, metadatas=metadatas)
    count = collection.count()
    print(f"Seeded {count} medicines into ChromaDB")
    return count
