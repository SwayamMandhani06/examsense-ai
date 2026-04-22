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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(analytics.router)
app.include_router(ask.router)
