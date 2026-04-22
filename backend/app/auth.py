import os
from datetime import datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.db.database import get_database

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
BCRYPT_MAX_PASSWORD_BYTES = 72


def hash_password(password: str):
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > BCRYPT_MAX_PASSWORD_BYTES:
        raise ValueError("Password is too long. Please keep it within 72 bytes.")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password, hashed_password):
    try:
        plain_bytes = plain_password.encode("utf-8")
        if len(plain_bytes) > BCRYPT_MAX_PASSWORD_BYTES:
            return False
        return bcrypt.checkpw(plain_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_database()
    user = db.users.find_one({"email": email})

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user
