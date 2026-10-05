from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional, List

from app.database import get_db, mark_expired_donations
from app.models.schemas import FoodDonationCreate, FoodDonationUpdate, FoodDonationOut
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/donations", tags=["Food Donations"])


def serialize_donation(doc: dict) -> dict:
    """Convert MongoDB document to API-friendly format."""
    doc["_id"] = str(doc["_id"])
    doc["donor_id"] = str(doc["donor_id"])
    return doc


@router.post("", response_model=FoodDonationOut, status_code=status.HTTP_201_CREATED)
def create_donation(
    donation: FoodDonationCreate,
    current_user: dict = Depends(require_role("donor", "admin")),
):
    """Create a new food donation (only Donor or Admin)."""
    db = get_db()

    donation_doc = {
        "donor_id": ObjectId(current_user["_id"]),
        "title": donation.title,
        "description": donation.description,
        "food_type": donation.food_type,
        "quantity": donation.quantity,
        "expiry_date": donation.expiry_date,
        "pickup_address": donation.pickup_address.model_dump(),
        "status": "available",
        "created_at": datetime.now(timezone.utc),
    }

    result = db.food_donations.insert_one(donation_doc)
    donation_doc["_id"] = result.inserted_id
    return serialize_donation(donation_doc)


@router.get("", response_model=List[FoodDonationOut])
def list_donations(
    city: Optional[str] = Query(None, description="Filter by city"),
    food_type: Optional[str] = Query(None, description="Filter by food type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    donor_id: Optional[str] = Query(None, description="Filter by donor"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List / search food donations with optional filters."""
    
    # Auto-expire old donations before listing
    mark_expired_donations()

    db = get_db()
    query = {}

    if city:
        query["pickup_address.city"] = {"$regex": city, "$options": "i"}
    if food_type:
        query["food_type"] = food_type
    if status:
        query["status"] = status
    if donor_id and ObjectId.is_valid(donor_id):
        query["donor_id"] = ObjectId(donor_id)

    cursor = (
        db.food_donations.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    donations = []
    for doc in cursor:
        donor = db.users.find_one({"_id": doc["donor_id"]}, {"name": 1})
        doc = serialize_donation(doc)
        if donor:
            doc["donor_name"] = donor.get("name")
        donations.append(doc)

    return donations


@router.get("/my/donations", response_model=List[FoodDonationOut])
def my_donations(current_user: dict = Depends(require_role("donor", "admin"))):
    """List donations created by the current logged-in user."""
    db = get_db()
    cursor = db.food_donations.find(
        {"donor_id": ObjectId(current_user["_id"])}
    ).sort("created_at", -1)

    return [serialize_donation(doc) for doc in cursor]


@router.get("/{donation_id}", response_model=FoodDonationOut)
def get_donation(donation_id: str):
    """Get a single donation by ID."""
    if not ObjectId.is_valid(donation_id):
        raise HTTPException(status_code=400, detail="Invalid donation ID")

    db = get_db()
    doc = db.food_donations.find_one({"_id": ObjectId(donation_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Donation not found")

    donor = db.users.find_one({"_id": doc["donor_id"]}, {"name": 1})
    doc = serialize_donation(doc)
    if donor:
        doc["donor_name"] = donor.get("name")
    return doc


@router.put("/{donation_id}", response_model=FoodDonationOut)
def update_donation(
    donation_id: str,
    update: FoodDonationUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a donation (only owner or Admin)."""
    if not ObjectId.is_valid(donation_id):
        raise HTTPException(status_code=400, detail="Invalid donation ID")

    db = get_db()
    doc = db.food_donations.find_one({"_id": ObjectId(donation_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Donation not found")

    # Authorization check
    if str(doc["donor_id"]) != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this donation")

    update_data = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    if "pickup_address" in update_data and update_data["pickup_address"]:
        update_data["pickup_address"] = update.pickup_address.model_dump()

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    db.food_donations.update_one(
        {"_id": ObjectId(donation_id)},
        {"$set": update_data}
    )

    updated = db.food_donations.find_one({"_id": ObjectId(donation_id)})
    return serialize_donation(updated)


@router.delete("/{donation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_donation(
    donation_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a donation (only owner or Admin)."""
    if not ObjectId.is_valid(donation_id):
        raise HTTPException(status_code=400, detail="Invalid donation ID")

    db = get_db()
    doc = db.food_donations.find_one({"_id": ObjectId(donation_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Donation not found")

    if str(doc["donor_id"]) != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this donation")

    # Also delete related requests
    db.requests.delete_many({"food_id": ObjectId(donation_id)})
    db.food_donations.delete_one({"_id": ObjectId(donation_id)})
    return None