from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
from dotenv import load_dotenv
import psycopg
import os

load_dotenv()
app = FastAPI()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

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
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "length": len(text),
        "preview": text[:100],
    }