# MediVerify AI Service — Hugging Face Spaces (Docker SDK)
# FastAPI + ChromaDB + sentence-transformers + Gemini RAG.
FROM python:3.11-slim

# Native build deps for some wheels + curl for healthchecks.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HF Spaces routes external traffic to app_port (declared in README.md → 7860).
# ChromaDB persists to ./chroma_db; on free Spaces storage is ephemeral, but the
# lifespan re-seeds idempotently from data/medicines.json on every boot.
ENV PORT=7860
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
