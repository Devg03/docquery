# docuquery

A retrieval-augmented generation (RAG) document assistant. Upload a document, ask questions in plain English, and get answers grounded in the document's actual contents — not the model's training data.

**Live demo:** https://docquery-frontend-ik9i.onrender.com

> **Note:** The backend is hosted on a free tier and spins down after inactivity. The first request may take ~30–60 seconds to wake the server — subsequent requests are fast.

![docuquery screenshot](docs/docquery_ss.png)

## What it does

docuquery lets you ask natural-language questions about your own documents. Instead of relying on what a language model already knows, it retrieves the most relevant passages from your uploaded document and uses them as grounded context to generate an accurate answer.

- Upload a text document
- Ask any question about its contents
- Get an answer sourced directly from the document, with the model instructed to say when an answer isn't present rather than hallucinate

## How it works

docuquery implements a complete RAG pipeline:

1. **Ingestion** — the uploaded document is split into overlapping text chunks (1000 characters, 200-character overlap) so that meaning isn't lost across boundaries.
2. **Embedding** — each chunk is converted into a 1536-dimension vector using OpenAI's `text-embedding-3-small` model, capturing its semantic meaning.
3. **Storage** — chunks and their vectors are stored together in PostgreSQL using the pgvector extension.
4. **Retrieval** — an incoming question is embedded with the same model, and pgvector's cosine-distance search (`<=>`) finds the chunks closest in meaning.
5. **Generation** — the retrieved chunks are passed as context to `gpt-4o-mini`, which generates an answer grounded in that context.

```
Upload → Chunk → Embed → Store (pgvector)
                                   │
Question → Embed → Similarity search ──► Relevant chunks → LLM → Answer
```

## Tech stack

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS

**Backend**
- FastAPI (Python)
- psycopg (PostgreSQL driver)
- OpenAI API (`text-embedding-3-small`, `gpt-4o-mini`)

**Database**
- PostgreSQL with the pgvector extension (hosted on Neon)

**Infrastructure**
- Docker & Docker Compose
- Deployed on Render (backend web service + static frontend)

## Running locally

### Prerequisites
- Docker and Docker Compose
- Node.js
- An OpenAI API key

### 1. Clone the repository
```bash
git clone https://github.com/Devg03/docquery.git
cd docquery
```

### 2. Configure environment variables

Create a root `.env` file (see `.env.example`):
```
DB_PASSWORD=your_password
OPENAI_API_KEY=your_openai_key
```

Create `backend/.env` (see `backend/.env.example`):
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/postgres
OPENAI_API_KEY=your_openai_key
```

Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8000
```

### 3. Start the backend and database
```bash
docker compose up --build
```

### 4. Create the database table

In another terminal, connect to the database and create the table:
```bash
docker exec -it docquery-db-1 psql -U postgres -d postgres
```
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE chunks (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding VECTOR(1536)
);
```

### 5. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Architecture notes

- The database is decoupled from the backend, so the same code runs against a local Docker Postgres in development and a managed Neon instance in production simply by changing `DATABASE_URL`.
- Embeddings are batched into a single API call per document rather than one call per chunk, reducing latency and cost.
- All database queries use parameterized statements to prevent SQL injection.