import os

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "examsense_db")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", os.getenv("OPENROUTER_API_KEY", ""))
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
