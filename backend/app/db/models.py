from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
    Enum,
    Index
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .database import Base


# ============================================================
# ENUMS
# ============================================================

class DifficultyLevel(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class UserRole(str, enum.Enum):
    admin = "admin"
    student = "student"


class MaterialType(str, enum.Enum):
    past_paper = "past_paper"
    notes = "notes"


# ============================================================
# USER TABLE
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)

    role = Column(
        Enum(UserRole, name="user_role_enum"),
        default=UserRole.student,
        nullable=False
    )

    btech_year = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    materials = relationship(
        "Material",
        back_populates="owner",
        cascade="all, delete-orphan"
    )


# ============================================================
# SUBJECT TABLE
# ============================================================

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)

    # 1,2,3,4 for B.Tech year
    year = Column(Integer, nullable=False, index=True)

    materials = relationship(
        "Material",
        back_populates="subject_rel",
        cascade="all, delete-orphan"
    )

    questions = relationship(
        "QuestionAnalytics",
        back_populates="subject",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_subject_year_unique", "name", "year"),
    )


# ============================================================
# MATERIAL TABLE
# ============================================================

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    material_type = Column(
        Enum(MaterialType, name="material_type_enum"),
        nullable=False,
        index=True
    )

    year = Column(Integer, nullable=False, index=True)

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    owner = relationship("User", back_populates="materials")

    subject_rel = relationship("Subject", back_populates="materials")

    chunks = relationship(
        "DocumentChunk",
        back_populates="material",
        cascade="all, delete-orphan"
    )


# ============================================================
# DOCUMENT CHUNKS TABLE
# ============================================================

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)

    material_id = Column(
        Integer,
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    content = Column(Text, nullable=False)

    # JSONB is better than JSON in PostgreSQL
    embedding = Column(JSONB, nullable=False)

    material = relationship("Material", back_populates="chunks")


# ============================================================
# QUESTION ANALYTICS TABLE
# ============================================================

class QuestionAnalytics(Base):
    __tablename__ = "question_analytics"

    id = Column(Integer, primary_key=True, index=True)

    question = Column(Text, nullable=False)

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    exam_year = Column(Integer, nullable=False, index=True)

    topic = Column(String, index=True)
    unit = Column(String, index=True)

    difficulty = Column(
        Enum(DifficultyLevel, name="difficulty_enum"),
        nullable=False,
        index=True
    )

    frequency = Column(Integer, default=1, nullable=False, index=True)

    last_appeared_year = Column(Integer, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    subject = relationship("Subject", back_populates="questions")

    __table_args__ = (
        Index("idx_subject_exam_year", "subject_id", "exam_year"),
        Index("idx_subject_difficulty", "subject_id", "difficulty"),
        Index("idx_subject_topic", "subject_id", "topic"),
        Index("idx_subject_unit", "subject_id", "unit"),
    )

from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)

    title = Column(String, nullable=True)

    messages = Column(JSONB, default=list)  
    # [{role: "user", content: "..."}]

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
