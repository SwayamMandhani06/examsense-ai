import logging
import os
import shutil
import uuid
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pymongo.database import Database

from app import schemas
from app.ai.embeddings import generate_embedding
from app.ai.pdf_utils import extract_text_from_pdf
from app.ai.question_extractor import build_question_key, extract_questions_with_ai
from app.ai.text_processing import chunk_text
from app.auth import get_current_user
from app.db.database import get_database, get_db, serialize_object_id, to_object_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subjects", tags=["Subjects"])

VALID_MATERIAL_TYPES = {"past_paper", "notes"}


def _subject_to_dict(subject: dict, material_count: int = 0, question_count: int = 0) -> dict:
    return {
        "id": serialize_object_id(subject.get("_id")),
        "name": subject.get("name", ""),
        "year": subject.get("year"),
        "code": "",
        "semester": 0,
        "materialCount": material_count,
        "questionCount": question_count,
        "icon": "📚",
        "createdAt": subject.get("created_at", datetime.utcnow()).isoformat(),
        "updatedAt": subject.get("updated_at", datetime.utcnow()).isoformat(),
    }


def _material_to_dict(material: dict) -> dict:
    uploaded_at = material.get("created_at")
    processed_at = material.get("processed_at")
    return {
        "id": serialize_object_id(material.get("_id")),
        "title": material.get("title", ""),
        "fileName": material.get("filename", ""),
        "fileUrl": f"/uploads/{material.get('filename', '')}",
        "materialType": material.get("material_type", "notes"),
        "year": material.get("year"),
        "subjectId": serialize_object_id(material.get("subject_id")),
        "uploadedBy": serialize_object_id(material.get("uploaded_by")),
        "size": material.get("size", 0),
        "uploadedAt": uploaded_at.isoformat() if isinstance(uploaded_at, datetime) else None,
        "processedAt": processed_at.isoformat() if isinstance(processed_at, datetime) else None,
        "processingStatus": material.get("processing_status", "completed"),
        "processingError": material.get("processing_error"),
    }


def _sum_frequency_map(db: Database, subject_ids: list[ObjectId], collection_name: str) -> dict[ObjectId, int]:
    if not subject_ids:
        return {}
    collection = db[collection_name]
    pipeline = [
        {"$match": {"subject_id": {"$in": subject_ids}}},
        {"$group": {"_id": "$subject_id", "count": {"$sum": "$frequency" if collection_name == "question_analytics" else 1}}},
    ]
    return {doc["_id"]: int(doc.get("count", 0)) for doc in collection.aggregate(pipeline)}


def process_pdf_background(
    material_id: str,
    subject_id: str,
    subject_name: str,
    exam_year: int,
    file_path: str,
) -> None:
    db = get_database()

    try:
        material_oid = to_object_id(material_id, "material_id")
        subject_oid = to_object_id(subject_id, "subject_id")
    except ValueError:
        logger.error("Background processing aborted due to invalid IDs")
        return

    try:
        db.materials.update_one(
            {"_id": material_oid},
            {
                "$set": {
                    "processing_status": "processing",
                    "processing_error": None,
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        logger.info("[PDF Pipeline] Starting for material %s", material_id)
        text = extract_text_from_pdf(file_path)
        if not text or not text.strip():
            logger.warning("[PDF Pipeline] No text extracted from %s", file_path)
            db.materials.update_one(
                {"_id": material_oid},
                {
                    "$set": {
                        "processing_status": "failed",
                        "processing_error": "No extractable text found in PDF.",
                        "updated_at": datetime.utcnow(),
                    }
                },
            )
            return

        chunks = chunk_text(text, chunk_size=500)
        chunk_docs: list[dict] = []
        # Reprocessing-safe: replace chunks for this material.
        db.document_chunks.delete_many({"material_id": material_oid})
        for chunk_content in chunks:
            if not chunk_content.strip():
                continue
            embedding = generate_embedding(chunk_content)
            chunk_docs.append(
                {
                    "material_id": material_oid,
                    "subject_id": subject_oid,
                    "content": chunk_content,
                    "embedding": embedding,
                    "created_at": datetime.utcnow(),
                }
            )

        if chunk_docs:
            db.document_chunks.insert_many(chunk_docs)
        logger.info("[PDF Pipeline] Saved %d chunks", len(chunk_docs))

        questions = extract_questions_with_ai(text, subject_name, exam_year)
        # Reprocessing-safe: replace analytics for this material.
        db.question_analytics.delete_many({"material_id": material_oid})
        question_docs: list[dict] = []

        for q in questions:
            question_text = str(q.get("question", "")).strip()
            topic = str(q.get("topic", "General")).strip() or "General"
            unit_raw = q.get("unit", 1)
            difficulty_raw = str(q.get("difficulty", "medium")).strip().lower()
            question_number = q.get("question_number")
            question_key = str(q.get("question_key", "")).strip() or build_question_key(question_text)

            if not question_text or len(question_text) < 10:
                continue
            if difficulty_raw not in {"easy", "medium", "hard"}:
                difficulty_raw = "medium"
            try:
                unit_value = int(unit_raw)
            except (ValueError, TypeError):
                unit_value = 1
            if unit_value < 1:
                unit_value = 1

            question_docs.append(
                {
                    "material_id": material_oid,
                    "question_number": int(question_number) if str(question_number).isdigit() else None,
                    "question_key": question_key,
                    "question": question_text,
                    "subject_id": subject_oid,
                    "exam_year": int(exam_year),
                    "topic": topic,
                    "unit": str(unit_value),
                    "difficulty": difficulty_raw,
                    "frequency": int(q.get("frequency", 1) or 1),
                    "last_appeared_year": int(exam_year),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
            )

        if question_docs:
            db.question_analytics.insert_many(question_docs)
        logger.info("[PDF Pipeline] Saved %d questions to analytics", len(question_docs))
        db.materials.update_one(
            {"_id": material_oid},
            {
                "$set": {
                    "processing_status": "completed",
                    "processing_error": None,
                    "processed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
            },
        )
    except Exception:
        logger.exception("[PDF Pipeline] Processing failed for material %s", material_id)
        db.materials.update_one(
            {"_id": material_oid},
            {
                "$set": {
                    "processing_status": "failed",
                    "processing_error": "Processing failed for this PDF.",
                    "updated_at": datetime.utcnow(),
                }
            },
        )


@router.get("")
def get_subjects(current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    query: dict = {}
    if current_user.get("role") == "student" and current_user.get("btech_year"):
        query["year"] = int(current_user["btech_year"])

    subjects = list(db.subjects.find(query).sort([("year", 1), ("name", 1)]))
    subject_ids = [s["_id"] for s in subjects]

    material_counts = _sum_frequency_map(db, subject_ids, "materials")
    question_counts = _sum_frequency_map(db, subject_ids, "question_analytics")

    return [
        _subject_to_dict(
            s,
            material_count=material_counts.get(s["_id"], 0),
            question_count=question_counts.get(s["_id"], 0),
        )
        for s in subjects
    ]


@router.get("/{subject_id}")
def get_subject(subject_id: str, current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    del current_user  # Endpoint requires auth but data is shared by role policy.

    try:
        subject_oid = to_object_id(subject_id, "subject_id")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    subject = db.subjects.find_one({"_id": subject_oid})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    materials = list(db.materials.find({"subject_id": subject_oid}).sort("created_at", -1))

    question_summary = list(
        db.question_analytics.aggregate(
            [
                {"$match": {"subject_id": subject_oid}},
                {"$group": {"_id": None, "count": {"$sum": "$frequency"}}},
            ]
        )
    )
    total_questions = int(question_summary[0]["count"]) if question_summary else 0

    result = _subject_to_dict(subject, material_count=len(materials), question_count=total_questions)
    result["materials"] = [_material_to_dict(m) for m in materials]
    return result


@router.post("")
def create_subject(
    subject: schemas.SubjectCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    existing = db.subjects.find_one({"name": subject.name.strip(), "year": int(subject.year)})
    if existing:
        raise HTTPException(status_code=400, detail="Subject already exists for this year")

    now = datetime.utcnow()
    doc = {
        "name": subject.name.strip(),
        "year": int(subject.year),
        "created_at": now,
        "updated_at": now,
    }
    inserted = db.subjects.insert_one(doc)
    created = db.subjects.find_one({"_id": inserted.inserted_id})
    return _subject_to_dict(created or doc, material_count=0, question_count=0)


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    try:
        subject_oid = to_object_id(subject_id, "subject_id")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    subject = db.subjects.find_one({"_id": subject_oid})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    materials = list(db.materials.find({"subject_id": subject_oid}))
    material_ids = [m["_id"] for m in materials]

    for material in materials:
        filename = material.get("filename")
        if filename:
            file_path = os.path.join("uploads", filename)
            if os.path.exists(file_path):
                os.remove(file_path)

    if material_ids:
        db.document_chunks.delete_many({"material_id": {"$in": material_ids}})

    db.materials.delete_many({"subject_id": subject_oid})
    db.question_analytics.delete_many({"subject_id": subject_oid})
    db.chat_sessions.delete_many({"subject_id": subject_oid})
    db.subjects.delete_one({"_id": subject_oid})

    return {"message": "Deleted"}


@router.get("/{subject_id}/materials")
def get_materials(
    subject_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    del current_user

    try:
        subject_oid = to_object_id(subject_id, "subject_id")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    materials = list(db.materials.find({"subject_id": subject_oid}).sort("created_at", -1))
    return [_material_to_dict(m) for m in materials]


@router.post("/{subject_id}/materials")
def upload_material(
    subject_id: str,
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    year: int = Form(...),
    material_type: str = Form("past_paper"),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    try:
        subject_oid = to_object_id(subject_id, "subject_id")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    subject = db.subjects.find_one({"_id": subject_oid})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    normalized_type = material_type.strip().lower()
    if normalized_type not in VALID_MATERIAL_TYPES:
        normalized_type = "notes"

    os.makedirs("uploads", exist_ok=True)
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join("uploads", filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    now = datetime.utcnow()
    material_doc = {
        "title": title.strip(),
        "filename": filename,
        "subject_id": subject_oid,
        "material_type": normalized_type,
        "year": int(year),
        "uploaded_by": to_object_id(current_user["_id"], "user_id"),
        "size": os.path.getsize(file_path),
        "processing_status": "queued",
        "processing_error": None,
        "processed_at": None,
        "created_at": now,
        "updated_at": now,
    }
    inserted = db.materials.insert_one(material_doc)
    created = db.materials.find_one({"_id": inserted.inserted_id})
    if not created:
        raise HTTPException(status_code=500, detail="Material upload failed")

    background_tasks.add_task(
        process_pdf_background,
        str(inserted.inserted_id),
        subject_id,
        subject.get("name", ""),
        int(year),
        file_path,
    )

    return _material_to_dict(created)


@router.delete("/{subject_id}/materials/{material_id}")
def delete_material(
    subject_id: str,
    material_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    try:
        subject_oid = to_object_id(subject_id, "subject_id")
        material_oid = to_object_id(material_id, "material_id")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    material = db.materials.find_one({"_id": material_oid, "subject_id": subject_oid})
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    filename = material.get("filename")
    if filename:
        file_path = os.path.join("uploads", filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    db.document_chunks.delete_many({"material_id": material_oid})
    db.question_analytics.delete_many({"material_id": material_oid})
    db.materials.delete_one({"_id": material_oid})
    return {"message": "Deleted"}
