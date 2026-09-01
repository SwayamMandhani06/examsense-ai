from __future__ import annotations

import os
from typing import Generator

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "examsense_db")

import logging
logger = logging.getLogger(__name__)

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _client


def get_database() -> Database:
    return get_client()[MONGODB_DB_NAME]


def get_db() -> Generator[Database, None, None]:
    yield get_database()


def close_mongo_connection() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def to_object_id(value: str | ObjectId, field_name: str = "id") -> ObjectId:
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(str(value))
    except Exception as exc:
        raise ValueError(f"Invalid {field_name}") from exc


def serialize_object_id(value: ObjectId | str | None) -> str | None:
    if value is None:
        return None
    return str(value)


def ensure_indexes() -> None:
    try:
        db = get_database()
        db.users.create_index([("email", ASCENDING)], unique=True, name="users_email_unique")
        db.subjects.create_index([("name", ASCENDING), ("year", ASCENDING)], name="subjects_name_year")
        db.subjects.create_index([("year", ASCENDING)], name="subjects_year")
        db.materials.create_index([("subject_id", ASCENDING)], name="materials_subject_id")
        db.materials.create_index([("uploaded_by", ASCENDING)], name="materials_uploaded_by")
        db.document_chunks.create_index([("material_id", ASCENDING)], name="chunks_material_id")
        db.document_chunks.create_index([("subject_id", ASCENDING)], name="chunks_subject_id")
        db.question_analytics.create_index([("subject_id", ASCENDING)], name="analytics_subject_id")
        db.question_analytics.create_index([("subject_id", ASCENDING), ("exam_year", ASCENDING)], name="analytics_subject_year")
        db.question_analytics.create_index([("material_id", ASCENDING)], name="analytics_material_id")
        db.question_analytics.create_index([("subject_id", ASCENDING), ("question_key", ASCENDING)], name="analytics_subject_qkey")
        db.question_analytics.create_index([("question", ASCENDING)], name="analytics_question")
        db.chat_sessions.create_index([("user_id", ASCENDING)], name="sessions_user_id")
        db.chat_sessions.create_index([("updated_at", DESCENDING)], name="sessions_updated_at")
        logger.info("MongoDB indexes verified successfully.")
    except Exception as exc:
        logger.warning("MongoDB index initialization deferred: %s", exc)
