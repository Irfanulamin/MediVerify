---
title: MediVerify AI Service
emoji: 💊
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# MediVerify AI Service

FastAPI + ChromaDB + sentence-transformers + Gemini RAG microservice for MediVerify.
Runs as a Docker Space on free CPU hardware. ChromaDB is re-seeded from
`data/medicines.json` (and monographs/manufacturers) on every boot, so ephemeral
storage is fine.

## Required Space secrets (Settings → Variables and secrets)

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | your Gemini API key |
| `INTERNAL_SECRET` | shared secret — must match the backend's `INTERNAL_SECRET` |
| `BACKEND_ORIGIN` | the deployed backend URL (Render), for CORS |
| `MONGODB_URI` | MongoDB Atlas connection string (used for the Gemini cache) |

All non-`/health` routes require the `x-internal-token: <INTERNAL_SECRET>` header,
so only the backend can call this service. `/health` is public for keep-alive pings.
