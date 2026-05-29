# MediVerify — Deploy Guide (all-Vercel serverless + Pinecone)

Monorepo, three **separate Vercel projects** from the same GitHub repo (`Irfanulamin`),
each with a different **Root Directory**. The ChromaDB→Pinecone migration is what makes
the AI service serverless-capable (no torch, no local disk).

| Vercel project | Root Directory | Runtime | Config |
|---|---|---|---|
| `mediverify-web` | `frontend/` | Next.js (native) | — |
| `mediverify-api` | `backend/`  | Node serverless | `backend/vercel.json` + `api/index.js` |
| `mediverify-ai`  | `ai-service/` | Python serverless | `ai-service/vercel.json` + `api/index.py` |

External managed services: **Pinecone** (vectors), **MongoDB Atlas** (data + Gemini cache),
**Gemini API** (LLM + embeddings). All free-tier.

> Vercel serverless scales to zero with **no idle-sleep penalty** like Render — so the
> Render blueprint (`render.yaml`) and keep-alive cron (`.github/workflows/keep-alive.yml`)
> are **no longer needed**. They remain in the repo only as a fallback if you'd rather run
> the NestJS backend on an always-on host (see note at the bottom).

---

## 0. One-time: seed Pinecone  ✅ (already done locally)
The index `mediverify` (768-dim, cosine) is already created and seeded
(61 medicines, 7 monographs, 14 manufacturers). To re-run after data changes:
```bash
cd ai-service
# .env must have PINECONE_API_KEY + GEMINI_API_KEY
python seed_pinecone.py
```
Seeding is idempotent (skips namespaces that already have vectors).

## 1. Shared values
- `INTERNAL_SECRET` — identical on backend + AI (authorizes backend→AI calls).
- `JWT_SECRET` — ≥ 32 chars.

## 2. AI service → Vercel (`ai-service/`)
New project → Root Directory `ai-service` → Framework "Other".
Env vars:
- `GEMINI_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX` = `mediverify`
- `INTERNAL_SECRET`
- `MONGODB_URI`
- `BACKEND_ORIGIN` = the backend Vercel URL (set after step 3)

`vercel.json` rewrites all routes to the FastAPI app and sets `maxDuration: 60`.
Verify: `curl https://mediverify-ai.vercel.app/health` → `{"status":"ok"}`

## 3. Backend → Vercel (`backend/`)
New project → Root Directory `backend`.
Env vars:
- `MONGODB_URI`, `JWT_SECRET`, `INTERNAL_SECRET`
- `AI_SERVICE_URL` = the AI Vercel URL (from step 2)
- `PYTHON_SERVICE_URL` = same AI Vercel URL
- `FRONTEND_URL` = the frontend Vercel URL (from step 4)

`vercel.json` builds with `nest build` and routes all requests through `api/index.js`
→ `dist/serverless.js` (a cached Nest app per warm container).
Verify: `curl https://mediverify-api.vercel.app/health`
Then set the AI project's `BACKEND_ORIGIN` to this URL and redeploy it.

> ⚠️ NestJS-on-Vercel is the fiddliest piece (decorator metadata + dependency tracing).
> The shim imports the **nest-built** `dist/` output to avoid Vercel re-compiling the TS.
> If the first deploy throws a DI/"cannot find module" error, that's the part to iterate
> on — or fall back to Render (see bottom).

## 4. Frontend → Vercel (`frontend/`)
New project → Root Directory `frontend`.
Env vars:
- `NEXT_PUBLIC_BACKEND_URL` = the backend Vercel URL
- `NEXT_PUBLIC_API_URL` = `/api/backend`
Then put this Vercel URL into the backend's `FRONTEND_URL` and redeploy the backend.

---

## Wiring summary
```
Browser ─HTTPS→ mediverify-web (Vercel/Next)
                   │ /api/proxy/* & /api/backend/* (server-side)
                   ▼
                 mediverify-api (Vercel/NestJS) ─x-internal-token→ mediverify-ai (Vercel/FastAPI)
                   │                                                  │
                   └────────────→ MongoDB Atlas ←────────────────────┤
                                                                      ├─→ Pinecone (vectors)
                                                                      └─→ Gemini (LLM + embeddings)
```

| Where | Key vars |
|---|---|
| Frontend | `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_API_URL=/api/backend` |
| Backend  | `MONGODB_URI`, `JWT_SECRET`, `INTERNAL_SECRET`, `AI_SERVICE_URL`, `PYTHON_SERVICE_URL`, `FRONTEND_URL` |
| AI       | `GEMINI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `INTERNAL_SECRET`, `MONGODB_URI`, `BACKEND_ORIGIN` |

## Models in use
- LLM: `gemini-2.5-flash` · Embeddings: `gemini-embedding-001` @ 768-dim (matches the Pinecone index).

## Fallback: backend on Render instead of Vercel
If NestJS-on-Vercel fights you, deploy the backend via `render.yaml` (Render free web
service) and re-enable `.github/workflows/keep-alive.yml` (repo secrets `BACKEND_URL`,
`AI_URL`) to beat Render's 15-min idle spindown. AI service stays on Vercel either way.
