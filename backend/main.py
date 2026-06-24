from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
from dotenv import load_dotenv
from openai import OpenAI
from pgvector.psycopg import register_vector
from pydantic import BaseModel
import psycopg
import os

load_dotenv()
app = FastAPI()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# OpenAI
client = OpenAI(api_key = os.getenv("OPENAI_API_KEY"))

# CORS
origins = [
    "http://127.0.0.1:5173",      # Local Vite dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def root():
    return {"message": "ok"}

@app.get("/db-health")
def db_health():
    try:
        with psycopg.connect(dbname = DB_NAME,
                        port = DB_PORT, 
                        user = DB_USER, 
                        password = DB_PASSWORD, 
                        host = DB_HOST) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                print(cur.fetchone())
                return {"message": "ok"}
    except Exception as e: 
        print(e)
        return {"message": "error"}
    
@app.post("/upload")
async def upload_file(file: UploadFile):
    contents = await file.read()
    text = contents.decode("utf-8")

    chunks = chunk_text(text=text)
    embeddings = embed_texts(chunks)

    with psycopg.connect(
        dbname=DB_NAME, port=DB_PORT, user=DB_USER, password=DB_PASSWORD, host=DB_HOST
    ) as conn:
        register_vector(conn)
        with conn.cursor() as cur:
            for content, embedding in zip(chunks, embeddings):
                cur.execute(
                    "INSERT INTO chunks (content, embedding) VALUES (%s, %s)",
                    (content, embedding)
                )
    return {
        "filename": file.filename,
        "num_chunks": len(chunks),
    }

def chunk_text(text):
    chunk_size = 1000
    overlap = 200
    chunks = list()
    start = 0
    while start < len(text):
        chunks.append(text[start : start + chunk_size])
        start = start + (chunk_size - overlap)
    return chunks

def embed_texts(chunks: list):
    response = client.embeddings.create(
        model = "text-embedding-3-small",
        input = chunks
    )
    return [item.embedding for item in response.data]

class AskRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_Questions(request: AskRequest):
    question_vector = embed_texts([request.question])[0]

    with psycopg.connect(
        dbname=DB_NAME, port=DB_PORT, user=DB_USER, password=DB_PASSWORD, host=DB_HOST
    ) as conn:
        register_vector(conn)
        with conn.cursor() as cur:
            cur.execute(
                "SELECT content FROM chunks ORDER by embedding <=> %s::vector LIMIT 3",
                (question_vector,),
            )
            rows = cur.fetchall()
    
    results = [row[0] for row in rows]
    return {"chunks": results}
