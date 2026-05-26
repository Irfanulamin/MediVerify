# MediVerify

**AI-powered medicine verification platform for Bangladesh's pharmaceutical market.**

MediVerify helps pharmacists, doctors, and patients identify counterfeit or suspicious medicines in real time. Users describe a medicine — its name, appearance, packaging, or batch details — and the system returns an AI verdict backed by a curated pharmaceutical knowledge base, along with drug interaction analysis between any two medicines.

---

## The Problem

Counterfeit and substandard medicines are a serious public health threat in Bangladesh. Patients and healthcare workers often have no reliable, fast way to verify whether a medicine is legitimate before it is dispensed or consumed. MediVerify addresses this directly with an AI pipeline that can flag suspicious medicines and explain why.

---

## Features

- **Medicine Verification** — Describe any medicine and receive a `VERIFIED`, `SUSPICIOUS`, or `UNKNOWN` verdict with a plain-language explanation.
- **Drug Interaction Checker** — Check two medicines against each other and receive a `SAFE`, `MODERATE`, or `HIGH` risk rating with clinical context.
- **JWT-Authenticated API** — All verification endpoints are protected; users register and log in to receive a token.
- **RAG-Powered AI** — Responses are grounded in a ChromaDB vector knowledge base seeded with real medicines common in Bangladesh, then synthesized by Google Gemini.

---

## Architecture

```
Browser (Next.js : 3000)
        │
        │ REST (axios)
        ▼
NestJS API (port 3001)
  ├── /auth/register  →  MongoDB (users)
  ├── /auth/login     →  MongoDB + JWT
  └── /verify         →  Python AI Service (port 8000)
       └── /interactions
                │
                ▼
        FastAPI + ChromaDB + Gemini 1.5 Flash
```

The frontend communicates exclusively with the NestJS backend. NestJS owns authentication and proxies all verification requests to the Python microservice. The Python service uses ChromaDB for semantic retrieval and Gemini to generate verdicts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.6 (App Router), React 19, Tailwind CSS v4, Framer Motion, Lucide React |
| Backend | NestJS 11, Mongoose, MongoDB, Passport JWT, bcrypt |
| AI Service | FastAPI, ChromaDB (local persistence), Google Gemini 1.5 Flash |

---

## Project Structure

```
mediverify/
├── frontend/          # Next.js app — UI, auth pages, dashboard
├── backend/           # NestJS API — auth, JWT, verification proxy
├── python-service/    # FastAPI — ChromaDB RAG + Gemini AI
└── openspec/          # Design specs and change proposals
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+
- MongoDB running locally or a MongoDB Atlas URI
- Google Gemini API key ([get one here](https://aistudio.google.com/))

### 1. Clone and install

```bash
git clone <repo-url>
cd mediverify

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install

# Python service
cd ../python-service && pip install -r requirements.txt
```

### 2. Configure environment variables

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**`backend/.env`**
```env
MONGODB_URI=mongodb://localhost:27017/mediverify
JWT_SECRET=your_jwt_secret_here
PYTHON_SERVICE_URL=http://localhost:8000
PORT=3001
```

**`python-service/.env`**
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run all services

Open three terminals:

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev

# Terminal 2 — Backend
cd backend && npm run start:dev

# Terminal 3 — Python AI service
cd python-service && uvicorn main:app --reload --port 8000
```

The app will be available at `http://localhost:3000`.

---

## API Reference

All `/verify` endpoints require a `Bearer` JWT token in the `Authorization` header.

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/auth/register` | `{ name, email, password }` | Create a new account |
| `POST` | `/auth/login` | `{ email, password }` | Returns a JWT access token |

### Verification (JWT required)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/verify` | `{ query: string }` | Verify a medicine by name or description |
| `POST` | `/verify/interactions` | `{ medicine1, medicine2 }` | Check drug-drug interaction risk |

**Verification verdict values:** `VERIFIED` · `SUSPICIOUS` · `UNKNOWN`

**Interaction level values:** `SAFE` · `MODERATE` · `HIGH`

---

## How the AI Works

1. The user's query is embedded and searched against a **ChromaDB** vector collection of medicines seeded with common Bangladeshi pharmaceutical products (Napa Extra, Ciprofloxacin, Metformin, and others).
2. The top matching medicine entries are retrieved as context (RAG).
3. A structured prompt is sent to **Gemini 1.5 Flash** with the retrieved context and user query.
4. Gemini returns a verdict and explanation, which is parsed and returned to the frontend.

This approach keeps responses grounded in real pharmaceutical data rather than relying solely on the model's general knowledge.

---

## Medicine Knowledge Base

The ChromaDB collection is seeded on first run with 10 medicines including authenticity indicators specific to each — physical appearance, packaging details, and manufacturer markings that distinguish genuine products from fakes. The collection grows as more entries are added.

---

## License

Private — all rights reserved.
