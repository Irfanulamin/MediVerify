"""Pinecone-backed vector store with a ChromaDB-compatible surface.

Replaces the old local ChromaDB + sentence-transformers setup so the service can
run on serverless (no torch, no local persistence). Embeddings come from Gemini
`text-embedding-004` (768-dim). Each former Chroma "collection" maps to a Pinecone
namespace inside a single index (free tier = 1 index).

The `Collection` wrapper exposes exactly the methods the rest of the codebase used:
`.query()`, `.add()`, `.count()`, `.get()`, and `.name` — returning Chroma-shaped
results so `rag.py` / `manufacturers.py` / `seed.py` need almost no changes. Cosine
similarity is converted to a "distance" (1 - score) so existing thresholds still hold.
"""

import os
import time
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai
from pinecone import Pinecone, ServerlessSpec

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

EMBED_MODEL = "models/gemini-embedding-001"
EMBED_DIM = 768  # gemini-embedding-001 defaults to 3072; we request 768 to match the index

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY", "")
PINECONE_INDEX = os.environ.get("PINECONE_INDEX", "mediverify")
PINECONE_CLOUD = os.environ.get("PINECONE_CLOUD", "aws")
PINECONE_REGION = os.environ.get("PINECONE_REGION", "us-east-1")

_pc = None
_index = None


def _get_index():
    """Lazily connect to Pinecone (and create the index on first use)."""
    global _pc, _index
    if _index is not None:
        return _index
    if not PINECONE_API_KEY:
        raise RuntimeError("PINECONE_API_KEY is not set")
    _pc = Pinecone(api_key=PINECONE_API_KEY)
    listed = _pc.list_indexes()
    if hasattr(listed, "names"):
        names = listed.names()
    else:
        names = [getattr(i, "name", None) or (i.get("name") if isinstance(i, dict) else None) for i in listed]
    if PINECONE_INDEX not in names:
        print(f"[Vector] Creating Pinecone index {PINECONE_INDEX!r} ({EMBED_DIM}d, cosine)")
        _pc.create_index(
            name=PINECONE_INDEX,
            dimension=EMBED_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud=PINECONE_CLOUD, region=PINECONE_REGION),
        )
    _index = _pc.Index(PINECONE_INDEX)
    return _index


def _embed_one(text: str, task_type: str, retries: int = 4) -> list[float]:
    """Embed a single string, retrying on rate limits (429)."""
    last = ""
    for i in range(retries):
        try:
            res = genai.embed_content(
                model=EMBED_MODEL,
                content=text or " ",
                task_type=task_type,
                output_dimensionality=EMBED_DIM,
            )
            emb = res["embedding"]
            return emb[0] if emb and isinstance(emb[0], list) else emb
        except Exception as e:
            last = str(e)
            if "429" in last or "RESOURCE_EXHAUSTED" in last:
                wait = (i + 1) * 4
                print(f"[Vector] embed rate-limited, waiting {wait}s ({i + 1}/{retries})")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError(f"embed failed after {retries} retries: {last[:200]}")


def embed_documents(texts: list[str]) -> list[list[float]]:
    """Embed documents one-by-one (gemini-embedding-001 is strict on batching)."""
    out: list[list[float]] = []
    for t in texts:
        out.append(_embed_one(t, "retrieval_document"))
        time.sleep(0.15)  # gentle pacing to stay under free-tier RPM
    return out


@lru_cache(maxsize=1024)
def embed_query(text: str) -> list[float]:
    """Embed a single query string (cached — verify queries the same name across
    3 namespaces, so this avoids 2 redundant Gemini embedding calls per lookup)."""
    return _embed_one(text, "retrieval_query")


class Collection:
    """ChromaDB-compatible wrapper over one Pinecone namespace."""

    def __init__(self, namespace: str):
        self.namespace = namespace
        self.name = namespace

    def add(self, ids, documents, metadatas):
        if not ids:
            return
        embs = embed_documents(list(documents))
        vectors = []
        for _id, doc, meta, emb in zip(ids, documents, metadatas, embs):
            md = dict(meta or {})
            md["_doc"] = doc  # stash the document text in metadata
            vectors.append({"id": _id, "values": emb, "metadata": md})
        idx = _get_index()
        for i in range(0, len(vectors), 100):
            idx.upsert(vectors=vectors[i:i + 100], namespace=self.namespace)

    def query(self, query_texts, n_results: int = 5, include=None):
        idx = _get_index()
        qtext = query_texts[0] if query_texts else ""
        try:
            res = idx.query(
                vector=embed_query(qtext),
                top_k=n_results,
                namespace=self.namespace,
                include_metadata=True,
            )
        except Exception as e:
            print(f"[Vector] query error on {self.namespace!r}: {e}")
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

        matches = getattr(res, "matches", None)
        if matches is None and isinstance(res, dict):
            matches = res.get("matches", [])
        docs, metas, dists = [], [], []
        for m in matches or []:
            md = dict(getattr(m, "metadata", None) or (m.get("metadata") if isinstance(m, dict) else {}) or {})
            score = getattr(m, "score", None)
            if score is None and isinstance(m, dict):
                score = m.get("score", 0.0)
            doc = md.pop("_doc", "")
            docs.append(doc)
            metas.append(md)
            dists.append(1.0 - float(score or 0.0))  # cosine similarity -> distance
        return {"documents": [docs], "metadatas": [metas], "distances": [dists]}

    def count(self) -> int:
        try:
            stats = _get_index().describe_index_stats()
            namespaces = getattr(stats, "namespaces", None)
            if namespaces is None and isinstance(stats, dict):
                namespaces = stats.get("namespaces", {})
            entry = (namespaces or {}).get(self.namespace)
            if entry is None:
                return 0
            return int(getattr(entry, "vector_count", None) or entry.get("vector_count", 0))
        except Exception as e:
            print(f"[Vector] count error on {self.namespace!r}: {e}")
            return 0

    def get(self, include=None) -> dict:
        """Return existing ids in this namespace (used for idempotent seeding)."""
        ids: list[str] = []
        try:
            for page in _get_index().list(namespace=self.namespace):
                ids.extend(page)
        except Exception as e:
            print(f"[Vector] list error on {self.namespace!r}: {e}")
        return {"ids": ids}


def make_collection(namespace: str) -> Collection:
    return Collection(namespace)
