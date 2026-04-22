# ExamSense AI

ExamSense AI is a full-stack academic intelligence platform for managing subjects and study materials, extracting question insights from uploaded PDFs, and answering questions with retrieval-grounded AI.

## Highlights

- JWT-based authentication with role support (`admin`, `student`)
- Subject and material management with PDF uploads
- Background processing pipeline (`queued -> processing -> completed/failed`)
- Question analytics: topic, unit, difficulty, trend, and repeated-question signals
- Ask-AI chat with context retrieval from processed material chunks
- Responsive Next.js dashboard with real-time analytics views

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, React Query, Axios, Recharts |
| Backend | FastAPI, PyMongo, python-jose, bcrypt, pypdf, sentence-transformers |
| Database | MongoDB |
| AI | OpenRouter API (LLM inference + question extraction workflow) |

## Project Structure

```text
.
├── backend/    # FastAPI API, AI pipeline, MongoDB integration
└── frontend/   # Next.js app (App Router) dashboard and chat UI
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB instance (local or remote)
- OpenRouter API key

## Environment Variables

### `backend/.env`

Copy from `backend/.env.example` and configure:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=examsense_db
SECRET_KEY=replace-with-a-long-random-secret
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-opus-4.1
OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_APP_NAME=ExamSense AI
```

### `frontend/.env.local`

Copy from `frontend/.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Local Development Setup

### 1. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend

Open a second terminal:

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

## Application URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs (Swagger): `http://localhost:8000/docs`

## Production Run

### Frontend

```powershell
cd frontend
npm run build
npm run start
```

### Backend

```powershell
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Core API Areas

- `/auth` — registration, login, profile, password change
- `/subjects` — subject CRUD and material management
- `/analytics` — computed analytics endpoints
- `/ask` — retrieval-grounded chat and session history

## Operational Notes

- For best extraction quality, upload text-based PDFs.
- Uploaded files are stored in `backend/uploads/`.
- To re-run analytics extraction for existing materials:

```powershell
cd backend
python reprocess_pdfs.py
```

## Security Notes

- Never commit `.env` files or API keys.
- Rotate secrets before deploying publicly.
