from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional, List

from app.database import get_db
from app.models.schemas import RequestCreate, RequestUpdate, RequestOut
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/requests", tags=["Food Requests"])


def serialize_request(doc: dict, db=None) -> dict:
    """Convert MongoDB document to API response. Share contacts only when accepted."""
    item = {
        "_id": str(doc["_id"]),
        "food_id": str(doc["food_id"]),
        "receiver_id": str(doc["receiver_id"]),
        "message": doc.get("message"),
        "status": doc.get("status"),
        "requested_at": doc.get("requested_at"),
        "updated_at": doc.get("updated_at"),
        "food_title": None,
        "donor_id": None,
        "donor_name": None,
        "donor_phone": None,
        "donor_email": None,
        "receiver_name": None,
        "receiver_phone": None,
        "receiver_email": None,
    }

    if db is None:
        return item

    food = db.food_donations.find_one({"_id": doc["food_id"]})
    if food:
        item["food_title"] = food.get("title")
        item["donor_id"] = str(food["donor_id"]) if food.get("donor_id") else None

        donor = db.users.find_one({"_id": food["donor_id"]})
        if donor:
            item["donor_name"] = donor.get("name")
            if doc.get("status") == "accepted":
                item["donor_phone"] = donor.get("phone")
                item["donor_email"] = donor.get("email")

    receiver = db.users.find_one({"_id": doc["receiver_id"]})
    if receiver:
        item["receiver_name"] = receiver.get("name")
        if doc.get("status") == "accepted":
            item["receiver_phone"] = receiver.get("phone")
            item["receiver_email"] = receiver.get("email")

    return item


@router.post("", response_model=RequestOut, status_code=status.HTTP_201_CREATED)
def create_request(
    request_data: RequestCreate,
    current_user: dict = Depends(require_role("receiver", "admin")),
):
    """Submit a request for a food donation (Receiver or Admin only)."""
    if not ObjectId.is_valid(request_data.food_id):
        raise HTTPException(status_code=400, detail="Invalid food ID")

    db = get_db()

    food = db.food_donations.find_one({"_id": ObjectId(request_data.food_id)})
    if not food:
        raise HTTPException(status_code=404, detail="Food donation not found")

    if food.get("status") != "available":
        raise HTTPException(
            status_code=400,
            detail=f"This donation is not available (current status: {food.get('status')})",
        )

    expiry = food.get("expiry_date")
    if not expiry:
        raise HTTPException(status_code=400, detail="Food donation has no expiry date")

    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    if expiry < now:
        db.food_donations.update_one(
            {"_id": food["_id"]},
            {"$set": {"status": "expired"}},
        )
        raise HTTPException(
            status_code=400,
            detail="This food has already expired and cannot be requested.",
        )

    existing = db.requests.find_one(
        {
            "food_id": ObjectId(request_data.food_id),
            "receiver_id": ObjectId(current_user["_id"]),
            "status": "pending",
        }
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending request for this item",
        )

    request_doc = {
        "food_id": ObjectId(request_data.food_id),
        "receiver_id": ObjectId(current_user["_id"]),
        "message": request_data.message,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc),
        "updated_at": None,
    }

    result = db.requests.insert_one(request_doc)

    db.food_donations.update_one(
        {"_id": ObjectId(request_data.food_id)},
        {"$set": {"status": "requested"}},
    )

    request_doc["_id"] = result.inserted_id
    return serialize_request(request_doc, db)


@router.get("", response_model=List[RequestOut])
def list_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    food_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List food requests based on the user's role."""
    db = get_db()
    query = {}

    if current_user["role"] == "receiver":
        query["receiver_id"] = ObjectId(current_user["_id"])

    elif current_user["role"] == "donor":
        my_donation_ids = [
            d["_id"]
            for d in db.food_donations.find(
                {"donor_id": ObjectId(current_user["_id"])},
                {"_id": 1},
            )
        ]
        query["food_id"] = {"$in": my_donation_ids}

    if status_filter:
        query["status"] = status_filter

    if food_id and ObjectId.is_valid(food_id):
        query["food_id"] = ObjectId(food_id)

    cursor = (
        db.requests.find(query)
        .sort("requested_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [serialize_request(doc, db) for doc in cursor]


@router.get("/{request_id}", response_model=RequestOut)
def get_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a single food request."""
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")

    db = get_db()
    doc = db.requests.find_one({"_id": ObjectId(request_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")

    food = db.food_donations.find_one(
        {"_id": doc["food_id"]},
        {"donor_id": 1, "title": 1},
    )

    is_owner = str(doc["receiver_id"]) == current_user["_id"]
    is_donor = food and str(food["donor_id"]) == current_user["_id"]
    is_admin = current_user["role"] == "admin"

    if not (is_owner or is_donor or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to view this request")

    return serialize_request(doc, db)


@router.patch("/{request_id}", response_model=RequestOut)
def update_request_status(
    request_id: str,
    update: RequestUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Accept, reject, or complete a food request."""
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")

    db = get_db()
    doc = db.requests.find_one({"_id": ObjectId(request_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")

    food = db.food_donations.find_one({"_id": doc["food_id"]})
    if not food:
        raise HTTPException(status_code=404, detail="Associated donation not found")

    is_donor = str(food["donor_id"]) == current_user["_id"]
    is_admin = current_user["role"] == "admin"
    is_receiver = str(doc["receiver_id"]) == current_user["_id"]
    new_status = update.status

    if new_status in ("accepted", "rejected"):
        if not (is_donor or is_admin):
            raise HTTPException(
                status_code=403,
                detail="Only the donor or admin can accept/reject",
            )

    if new_status == "completed":
        if not (is_donor or is_admin or is_receiver):
            raise HTTPException(
                status_code=403,
                detail="Not authorized to complete this request",
            )

    db.requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    if new_status == "accepted":
        # Reject other pending requests for same food
        db.requests.update_many(
            {
                "food_id": doc["food_id"],
                "_id": {"$ne": ObjectId(request_id)},
                "status": "pending",
            },
            {
                "$set": {
                    "status": "rejected",
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        db.food_donations.update_one(
            {"_id": doc["food_id"]},
            {"$set": {"status": "accepted"}},
        )

    elif new_status == "rejected":
        remaining = db.requests.count_documents(
            {
                "food_id": doc["food_id"],
                "status": {"$in": ["pending", "accepted"]},
            }
        )
        if remaining == 0:
            db.food_donations.update_one(
                {"_id": doc["food_id"]},
                {"$set": {"status": "available"}},
            )

    elif new_status == "completed":
        db.food_donations.update_one(
            {"_id": doc["food_id"]},
            {"$set": {"status": "completed"}},
        )

    updated = db.requests.find_one({"_id": ObjectId(request_id)})
    return serialize_request(updated, db)