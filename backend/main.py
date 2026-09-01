from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.db.database import close_mongo_connection, ensure_indexes

from app.routers import auth, subjects, analytics, ask

app = FastAPI(title="ExamSense AI")

# Serve uploaded files (PDFs, etc.)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
def startup_event():
    ensure_indexes()


@app.on_event("shutdown")
def shutdown_event():
    close_mongo_connection()


# Health check endpoints for deployment platforms
@app.get("/")
def root():
    return {"status": "ok", "app": "ExamSense AI API"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# Dynamic CORS origins configuration
raw_origins = os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_URL", "http://localhost:3000,http://127.0.0.1:3000"))
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(analytics.router)
app.include_router(ask.router)
