from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from typing import List

from app.database import get_db
from app.models.schemas import UserOut, UserUpdate
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile."""
    return current_user


@router.put("/me", response_model=UserOut)
def update_my_profile(
    update: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update current user's profile."""
    db = get_db()
    update_data = {
        k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None
    }

    if "address" in update_data and update_data["address"]:
        update_data["address"] = update.address.model_dump()

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data},
    )

    updated = db.users.find_one(
        {"_id": ObjectId(current_user["_id"])}, {"password": 0}
    )
    updated["_id"] = str(updated["_id"])
    return updated


@router.get("", response_model=List[UserOut])
def list_users(current_user: dict = Depends(require_role("admin"))):
    """List all users (Admin only)."""
    db = get_db()
    users = []
    for doc in db.users.find({}, {"password": 0}).sort("created_at", -1):
        doc["_id"] = str(doc["_id"])
        users.append(doc)
    return users


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, current_user: dict = Depends(require_role("admin"))):
    """Get a specific user by ID (Admin only)."""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["_id"] = str(user["_id"])
    return user