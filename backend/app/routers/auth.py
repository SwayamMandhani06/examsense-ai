from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pymongo.database import Database

from app import schemas
from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.db.database import get_db, serialize_object_id

router = APIRouter(prefix="/auth", tags=["Auth"])


def _normalize_btech_year(year_value: str | int | None) -> int | None:
    if year_value is None:
        return None
    year_map = {"1st": 1, "2nd": 2, "3rd": 3, "4th": 4}
    if isinstance(year_value, int):
        return year_value if year_value in (1, 2, 3, 4) else None
    return year_map.get(str(year_value).strip().lower())


def user_to_dict(user: dict) -> dict:
    return {
        "id": serialize_object_id(user.get("_id")),
        "email": user.get("email", ""),
        "firstName": user.get("first_name", "") or "",
        "lastName": user.get("last_name", "") or "",
        "role": user.get("role", "student"),
        "btechYear": user.get("btech_year"),
        "phone": user.get("phone"),
        "college": user.get("college"),
        "bio": user.get("bio"),
        "createdAt": user.get("created_at", datetime.utcnow()).isoformat(),
    }


@router.post("/register")
def register(user: schemas.UserCreate, db: Database = Depends(get_db)):
    normalized_email = user.email.strip().lower()
    existing = db.users.find_one({"email": normalized_email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = (user.role or "student").lower()
    if role not in {"admin", "student"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    try:
        hashed_password = hash_password(user.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    new_user_doc = {
        "email": normalized_email,
        "hashed_password": hashed_password,
        "first_name": user.firstName.strip(),
        "last_name": user.lastName.strip(),
        "role": role,
        "btech_year": _normalize_btech_year(user.btechYear),
        "phone": None,
        "college": None,
        "bio": None,
        "created_at": datetime.utcnow(),
    }

    inserted = db.users.insert_one(new_user_doc)
    created_user = db.users.find_one({"_id": inserted.inserted_id})
    if not created_user:
        raise HTTPException(status_code=500, detail="Failed to create user")

    token = create_access_token({"sub": created_user["email"]})
    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": user_to_dict(created_user),
    }


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Database = Depends(get_db)):
    user = db.users.find_one({"email": form_data.username.strip().lower()})
    if not user or not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": user["email"]})
    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": user_to_dict(user),
    }


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return user_to_dict(current_user)


@router.patch("/me")
def update_me(payload: schemas.UserProfileUpdate, current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    updates: dict = {}

    if payload.firstName is not None:
        updates["first_name"] = payload.firstName.strip()
    if payload.lastName is not None:
        updates["last_name"] = payload.lastName.strip()
    if payload.btechYear is not None:
        updates["btech_year"] = _normalize_btech_year(payload.btechYear)
    if payload.phone is not None:
        phone = payload.phone.strip()
        updates["phone"] = phone or None
    if payload.college is not None:
        college = payload.college.strip()
        updates["college"] = college or None
    if payload.bio is not None:
        bio = payload.bio.strip()
        updates["bio"] = bio[:1200] if bio else None

    if not updates:
        return user_to_dict(current_user)

    db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": updates},
    )
    updated_user = db.users.find_one({"_id": current_user["_id"]}) or current_user
    return user_to_dict(updated_user)


@router.post("/change-password")
def change_password(payload: schemas.PasswordChangeRequest, current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    current = payload.currentPassword or ""
    new = payload.newPassword or ""

    if not verify_password(current, current_user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(new) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    if current == new:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    try:
        new_hash = hash_password(new)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    db.users.update_one({"_id": current_user["_id"]}, {"$set": {"hashed_password": new_hash}})
    return {"message": "Password updated successfully"}
