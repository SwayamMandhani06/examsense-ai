from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class UserCreate(BaseModel):
    email: str
    password: str
    firstName: str = ""
    lastName: str = ""
    role: Optional[str] = "student"
    btechYear: Optional[str | int] = None


class UserProfileUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    btechYear: Optional[str | int] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    bio: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    firstName: str = ""
    lastName: str = ""
    role: str
    btechYear: Optional[int] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    bio: Optional[str] = None
    createdAt: str = ""

    model_config = ConfigDict(from_attributes=True)


class SubjectBase(BaseModel):
    name: str
    year: int


class SubjectCreate(SubjectBase):
    pass


class SubjectOut(SubjectBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class MaterialOut(BaseModel):
    id: int
    title: str
    filename: str
    material_type: str
    year: int
    subject_id: int
    uploaded_by: int

    model_config = ConfigDict(from_attributes=True)


class QuestionAnalyticsOut(BaseModel):
    id: int
    question: str
    subject_id: int
    exam_year: int
    topic: Optional[str]
    unit: Optional[str]
    difficulty: DifficultyLevel
    frequency: int
    last_appeared_year: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class DifficultyTrendPoint(BaseModel):
    year: int
    easy: int
    medium: int
    hard: int


class TopicDistributionItem(BaseModel):
    topic: str
    count: int


class UnitDistributionItem(BaseModel):
    unit: str
    count: int


class DifficultyDistributionItem(BaseModel):
    difficulty: DifficultyLevel
    count: int


class RepeatedQuestion(BaseModel):
    question: str
    frequency: int
    years: List[int]
