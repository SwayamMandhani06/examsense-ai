from dataclasses import dataclass
from datetime import datetime
import re

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.ai.embeddings import generate_embedding
from app.ai.llm import generate_answer
from app.ai.scoring import calculate_final_score
from app.ai.similarity import find_top_k
from app.auth import get_current_user
from app.db.database import get_db, serialize_object_id, to_object_id

router = APIRouter(prefix="/ask", tags=["Ask AI"])


@dataclass
class ChunkDoc:
    id: str
    content: str
    material_id: str
    embedding: list[float]


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9]{3,}", text.lower()))


def _lexical_overlap(query: str, text: str) -> float:
    q_tokens = _tokenize(query)
    if not q_tokens:
        return 0.0
    t_tokens = _tokenize(text)
    if not t_tokens:
        return 0.0
    overlap = len(q_tokens.intersection(t_tokens))
    return overlap / max(len(q_tokens), 1)


def _build_sources(db: Database, top_chunks: list[dict]) -> list[dict]:
    if not top_chunks:
        return []

    material_ids: list[ObjectId] = []
    for chunk in top_chunks:
        try:
            material_ids.append(to_object_id(chunk["material_id"], "material_id"))
        except ValueError:
            continue

    material_map = {}
    if material_ids:
        for material in db.materials.find({"_id": {"$in": material_ids}}, {"filename": 1, "title": 1}):
            material_map[str(material["_id"])] = material.get("filename") or material.get("title") or "Unknown source"

    sources = []
    for chunk in top_chunks:
        material_id = str(chunk.get("material_id", ""))
        sources.append(
            {
                "documentId": str(chunk.get("chunk_id", "")),
                "fileName": material_map.get(material_id, "Source"),
                "relevantChunk": str(chunk.get("content", ""))[:400],
                "similarityScore": float(chunk.get("similarity", 0)),
            }
        )
    return sources


@router.post("")
def ask_question(payload: dict, current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    question = str(payload.get("question", "")).strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question required")

    subject_id_raw = payload.get("subject_id")
    subject_oid: ObjectId | None = None
    if subject_id_raw:
        try:
            subject_oid = to_object_id(str(subject_id_raw), "subject_id")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    existing_session = None
    session_id_raw = payload.get("session_id")
    if session_id_raw:
        try:
            session_oid = to_object_id(str(session_id_raw), "session_id")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        existing_session = db.chat_sessions.find_one({"_id": session_oid, "user_id": current_user["_id"]})
        if not existing_session:
            raise HTTPException(status_code=404, detail="Session not found")

    top_chunks: list[dict] = []
    context: list[str] = []

    question_embedding = generate_embedding(question)
    chunk_filter = {"subject_id": subject_oid} if subject_oid else {}
    chunk_docs = list(
        db.document_chunks.find(chunk_filter, {"content": 1, "embedding": 1, "material_id": 1}).limit(1500)
    )
    chunks = [
        ChunkDoc(
            id=str(chunk["_id"]),
            content=str(chunk.get("content", "")),
            material_id=str(chunk.get("material_id", "")),
            embedding=chunk.get("embedding", []),
        )
        for chunk in chunk_docs
        if chunk.get("embedding")
    ]
    if chunks:
        similar_chunks = find_top_k(question_embedding, chunks, k=14)
        for chunk in similar_chunks:
            lexical = _lexical_overlap(question, str(chunk.get("content", "")))
            semantic = float(chunk.get("similarity", 0))
            chunk["final_score"] = float((semantic * 0.82) + (lexical * 0.18))
            chunk["relevance"] = float(calculate_final_score(semantic, lexical, 0))
        similar_chunks.sort(key=lambda x: x["final_score"], reverse=True)

        # Keep only genuinely relevant chunks to avoid vague/off-topic responses.
        filtered = [c for c in similar_chunks if c["final_score"] >= 0.18]
        top_chunks = filtered[:5]
        context = [str(c["content"]).strip() for c in top_chunks if str(c.get("content", "")).strip()]

    previous_messages = existing_session.get("messages", []) if existing_session else []
    final_answer = generate_answer(question, context, chat_history=previous_messages[-8:])
    sources = _build_sources(db, top_chunks)

    user_message = {"role": "user", "content": question, "timestamp": datetime.utcnow().isoformat()}
    assistant_message = {
        "role": "assistant",
        "content": final_answer,
        "sources": sources,
        "timestamp": datetime.utcnow().isoformat(),
    }

    now = datetime.utcnow()
    if existing_session:
        updated_messages = previous_messages + [user_message, assistant_message]
        db.chat_sessions.update_one(
            {"_id": existing_session["_id"]},
            {"$set": {"messages": updated_messages, "updated_at": now}},
        )
        session_id = existing_session["_id"]
    else:
        new_session = {
            "user_id": current_user["_id"],
            "subject_id": subject_oid,
            "title": question[:60],
            "messages": [user_message, assistant_message],
            "created_at": now,
            "updated_at": now,
        }
        inserted = db.chat_sessions.insert_one(new_session)
        session_id = inserted.inserted_id

    return {
        "session_id": serialize_object_id(session_id),
        "question": question,
        "answer": final_answer,
        "sources": sources,
    }


@router.get("/sessions")
def get_sessions(current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    sessions = list(db.chat_sessions.find({"user_id": current_user["_id"]}).sort("updated_at", -1))

    response = []
    for session in sessions:
        messages = session.get("messages", [])
        title = session.get("title")
        if not title and messages:
            first_msg = next((m for m in messages if m.get("role") == "user"), messages[0])
            title = str(first_msg.get("content", ""))[:40] + "..."

        response.append(
            {
                "id": serialize_object_id(session.get("_id")),
                "subjectId": serialize_object_id(session.get("subject_id")),
                "title": title or "Chat",
                "messages": messages,
                "createdAt": session.get("created_at", datetime.utcnow()).isoformat(),
                "updatedAt": session.get("updated_at", datetime.utcnow()).isoformat(),
            }
        )

    return response


@router.get("/sessions/{session_id}")
def get_session(session_id: str, current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    try:
        session_oid = to_object_id(session_id, "session_id")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    session = db.chat_sessions.find_one({"_id": session_oid, "user_id": current_user["_id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = session.get("messages", [])
    title = session.get("title")
    if not title and messages:
        first_msg = next((m for m in messages if m.get("role") == "user"), messages[0])
        title = str(first_msg.get("content", ""))[:40] + "..."

    return {
        "id": serialize_object_id(session.get("_id")),
        "subjectId": serialize_object_id(session.get("subject_id")),
        "title": title or "Chat",
        "messages": messages,
        "createdAt": session.get("created_at", datetime.utcnow()).isoformat(),
        "updatedAt": session.get("updated_at", datetime.utcnow()).isoformat(),
    }


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    try:
        session_oid = to_object_id(session_id, "session_id")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    result = db.chat_sessions.delete_one({"_id": session_oid, "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}
