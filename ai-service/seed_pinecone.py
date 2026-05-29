"""One-time Pinecone seeding.

Run once locally (or as a deploy step) after setting PINECONE_API_KEY and
GEMINI_API_KEY. Idempotent: each seeder skips namespaces that already have data.

    python seed_pinecone.py
"""

from seed import (
    seed_medicines,
    seed_monographs,
    seed_fake_alerts,
    seed_manufacturers,
)

if __name__ == "__main__":
    m = seed_medicines()
    mo = seed_monographs()
    a = seed_fake_alerts()
    mf = seed_manufacturers()
    print("\n=== Pinecone seed complete ===")
    print(f"  medicines:     {m}")
    print(f"  monographs:    {mo}")
    print(f"  fake_alerts:   {a}")
    print(f"  manufacturers: {mf}")
