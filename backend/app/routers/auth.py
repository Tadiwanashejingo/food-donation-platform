from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timezone
from bson import ObjectId

from app.database import get_db
from app.models.schemas import UserCreate, UserOut, Token
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate):
    """Register a new user (donor / receiver / admin)."""
    db = get_db()

    # Check if email already exists
    if db.users.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_doc = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": user.role,
        "phone": user.phone,
        "address": user.address.model_dump() if user.address else None,
        "created_at": datetime.now(timezone.utc),
    }

    result = db.users.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    user_doc.pop("password", None)   # never return password
    return user_doc


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and receive JWT access token."""
    db = get_db()
    user = db.users.find_one({"email": form_data.username})

    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user["_id"]), "role": user["role"]}
    )

    user["_id"] = str(user["_id"])
    user.pop("password", None)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserOut)
def get_me(current_user: dict = Depends(get_current_user)):
    """Get current logged-in user profile."""
    return current_user