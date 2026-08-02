# Ask Profile (Ask Bantu)

Personal AI assistant for recruiters — chat in real time with **Bantu Sagar’s advocate assistant**, **grounded strictly** in his information via RAG (OpenAI + Pinecone).

## MVP scope

- Résumé PDF ingestion → Pinecone embeddings
- Streaming chat (SSE) with source citations
- Glassmorphic UI, dark/light theme, local chat history
- Health check, résumé download, rate limiting, CORS, `robots: noindex`

**Phase 2 (not in MVP):** JD match mode, Whisper STT, TTS listen button.

---

## Monorepo layout

```
apps/api/          FastAPI + LangChain RAG
apps/web/          Next.js 15 (App Router) + Tailwind v4
scripts/ingest.py  PDF → Pinecone ingestion
data/resume.pdf    Candidate information
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key
- Pinecone API key (serverless index will be created by ingest if missing)

---

## 1. Environment

Copy the example env and fill in secrets:

```bash
cp .env.example .env
```

Required keys in `.env`:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Embeddings + chat |
| `PINECONE_API_KEY` | Vector store |
| `PINECONE_INDEX_NAME` | Default `ask-profile` |
| `LINKEDIN_URL` | Header LinkedIn button |

Frontend env (optional overrides):

```bash
cp apps/web/.env.example apps/web/.env.local
```

---

## 2. Ingest the résumé

From the repo root (using the existing `.venv` or a new one):

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r apps\api\requirements.txt
python scripts\ingest.py --reset
```

This extracts text from `data/resume.pdf`, chunks it, embeds with `text-embedding-3-small`, and upserts into Pinecone.

---

## 3. Run the API

```powershell
.\.venv\Scripts\Activate.ps1
cd apps\api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 4. Run the web app

```powershell
cd apps\web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API endpoints (MVP)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Status + KB readiness |
| `POST` | `/chat/stream` | SSE RAG chat |
| `GET` | `/resume/download` | Inline résumé PDF |

---

## Deploy API to FastAPI Cloud

Your API lives in a monorepo subdirectory. FastAPI Cloud + GitHub can deploy it if the repo is pushed and the **Application Directory** is set.

### 0. Push the API code (required)

`apps/api/` must be on GitHub. From the repo root:

```powershell
git add apps/api data/resume.pdf scripts .env.example README.md
git status
git commit -m "Add Ask Profile FastAPI API for FastAPI Cloud deploy"
git push origin HEAD
```

Do **not** commit `.env` (secrets).

### 1. Create / configure the app in FastAPI Cloud

1. Open [fastapicloud.com](https://fastapicloud.com) dashboard.
2. Create an app from your GitHub repo (`sagarcloud17/myAI`), **or** open the existing connected app.
3. **Settings → Application Directory** (or Root Directory when creating): set to:

   ```text
   apps/api
   ```

4. Save / redeploy.

### 2. Set environment variables

In the app **Environment / Secrets** settings, add at least:

| Variable | Example |
|----------|---------|
| `OPENAI_API_KEY` | `sk-...` |
| `PINECONE_API_KEY` | `pcsk_...` |
| `PINECONE_INDEX_NAME` | `ask-bantu` |
| `PINECONE_NAMESPACE` | `data-bantu` |
| `CANDIDATE_NAME` | `Bantu Sagar Kumar` |
| `CANDIDATE_SHORT_NAME` | `Bantu` |
| `CORS_ORIGINS` | `http://localhost:3000` (add Vercel URL later) |
| `LANGSMITH_TRACING` | `true` (optional) |
| `LANGSMITH_API_KEY` | `lsv2_pt_...` (optional) |
| `LANGSMITH_PROJECT` | `ask-bantu` |

Use the **same** Pinecone index/namespace you ingested locally.

### 3. Deploy

**Option A — GitHub (you already connected):**  
Push to the repo **default branch** (usually `main`). FastAPI Cloud builds and deploys automatically.

**Option B — CLI:**

```powershell
cd apps\api
pip install "fastapi[standard]"
fastapi login
fastapi deploy
```

### 4. Verify

After deploy you get a URL like `https://something.fastapicloud.dev`.

- Health: `https://YOUR_APP.fastapicloud.dev/health`
- Docs: `https://YOUR_APP.fastapicloud.dev/docs`
- Resume: `https://YOUR_APP.fastapicloud.dev/resume/download`

### 5. Point the frontend later

When the web app is on Vercel, set:

- API: `CORS_ORIGINS=https://your-app.vercel.app`
- FastAPI Cloud: set `API_SECRET` (Bearer token for `/chat` and `/resume`)
- Web (Vercel): set `API_URL` (FastAPI base URL) and the **same** `API_SECRET`
- Browser calls same-origin `/api/*` proxies; do **not** put `API_SECRET` in `NEXT_PUBLIC_*`
- Optional: `NEXT_PUBLIC_API_URL` as fallback for `API_URL` on the server only

---

## LangSmith tracing

Add to root `.env`:

```env
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_pt_...
LANGSMITH_PROJECT=ask-bantu
```

Restart the API. Chat runs appear in [LangSmith](https://smith.langchain.com) under project `ask-bantu` (`ask_profile_rag_chat` + retriever + LLM children). `/health` includes `"langsmith_enabled": true` when configured.

---

## Notes

- Chat history is stored in **browser `localStorage` only**.
- The bot speaks as Sagar’s assistant (third person) and must not invent facts missing from the PDF.
- Search engines are blocked via `robots.txt` + Next.js `robots: { index: false }`.
