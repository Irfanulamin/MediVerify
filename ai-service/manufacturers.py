"""Manufacturer registry: Pinecone-backed lookup of registered BD pharma companies."""

import json
from pathlib import Path

from rag import _query_collection
from vector_store import make_collection

DATA_PATH = Path(__file__).parent / "data" / "manufacturers.json"

MANUFACTURER_MATCH_THRESHOLD = 0.3

manufacturers_collection = make_collection("manufacturer_registry")


def _slug(name: str) -> str:
    return name.lower().replace(" ", "-").replace("/", "-").replace(".", "")


def _doc_text(entry: dict) -> str:
    aliases = ", ".join(entry.get("aliases", []))
    brands = ", ".join(entry.get("brands", [])[:12]) or "various"
    return (
        f"{entry['name']} (aliases: {aliases}). "
        f"Registered Bangladeshi pharmaceutical company. "
        f"Brands: {brands}. "
        f"Batch format: {entry.get('batch_format', 'unknown')}. "
        f"DGDA license: {entry.get('dgda_license', 'unknown')}. "
        f"Headquarters: {entry.get('headquarters', 'Bangladesh')}."
    )


def _flatten_metadata(entry: dict) -> dict:
    return {
        "name": entry["name"],
        "aliases": ", ".join(entry.get("aliases", [])),
        "brands": ", ".join(entry.get("brands", [])),
        "batch_format": entry.get("batch_format", ""),
        "dgda_license": entry.get("dgda_license", "unknown"),
        "headquarters": entry.get("headquarters", ""),
        "notes": entry.get("notes", ""),
    }


def _expand_metadata(meta: dict) -> dict:
    return {
        "name": meta.get("name", ""),
        "aliases": [a.strip() for a in (meta.get("aliases", "") or "").split(",") if a.strip()],
        "brands": [b.strip() for b in (meta.get("brands", "") or "").split(",") if b.strip()],
        "batch_format": meta.get("batch_format", ""),
        "dgda_license": meta.get("dgda_license", "unknown"),
        "headquarters": meta.get("headquarters", ""),
        "notes": meta.get("notes", ""),
    }


def seed_manufacturers() -> int:
    if not DATA_PATH.exists():
        print("[Registry] manufacturers.json not found, skipping seed")
        return manufacturers_collection.count()

    with open(DATA_PATH, encoding="utf-8") as f:
        entries = json.load(f)

    try:
        existing = manufacturers_collection.get(include=[])
        existing_ids = set(existing.get("ids", []))
    except Exception:
        existing_ids = set()

    ids, documents, metadatas = [], [], []
    for entry in entries:
        mid = _slug(entry["name"])
        if mid in existing_ids:
            continue
        ids.append(mid)
        documents.append(_doc_text(entry))
        metadatas.append(_flatten_metadata(entry))

    if ids:
        manufacturers_collection.add(ids=ids, documents=documents, metadatas=metadatas)
        print(f"[Registry] Seeded {len(ids)} new manufacturers into Pinecone")
    else:
        print("[Registry] No new manufacturers to seed (all already present)")

    count = manufacturers_collection.count()
    print(f"[Registry] Total manufacturers in registry: {count}")
    return count


def lookup_manufacturer(raw_name: str) -> dict | None:
    """Look up a manufacturer in the registry. Returns the document metadata
    (with list fields rehydrated) when the best match is within threshold,
    else None."""
    if not raw_name or not raw_name.strip():
        return None

    # Normalise via the existing BD alias map first
    from vision import _normalise_manufacturer
    query = _normalise_manufacturer(raw_name.strip()) or raw_name.strip()

    try:
        docs, metas, dists = _query_collection(manufacturers_collection, query, n_results=1)
    except Exception as e:
        print(f"[Registry] Query error: {e}")
        return None

    if not metas or not dists:
        return None

    best_dist = dists[0]
    if best_dist >= MANUFACTURER_MATCH_THRESHOLD:
        print(f"[Registry] No registry hit for {query!r} (best dist={best_dist:.3f})")
        return None

    expanded = _expand_metadata(metas[0])
    print(f"[Registry] Hit: {expanded['name']!r} for query {query!r} (dist={best_dist:.3f})")
    return expanded
