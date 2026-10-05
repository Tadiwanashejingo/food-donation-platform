from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional, List

from app.database import get_db
from app.models.schemas import RequestCreate, RequestUpdate, RequestOut
from app.utils.auth import get_current_user, require_role


router = APIRouter(
    prefix="/api/requests",
    tags=["Food Requests"]
)


def serialize_request(doc: dict) -> dict:
    """Convert MongoDB ObjectIds to strings for API responses."""

    doc["_id"] = str(doc["_id"])
    doc["food_id"] = str(doc["food_id"])
    doc["receiver_id"] = str(doc["receiver_id"])

    return doc


@router.post(
    "",
    response_model=RequestOut,
    status_code=status.HTTP_201_CREATED
)
def create_request(
    request_data: RequestCreate,
    current_user: dict = Depends(
        require_role("receiver", "admin")
    ),
):
    """
    Submit a request for a food donation.
    Only receivers and admins can create requests.
    """

    # --------------------------------------------------
    # Validate Food ID
    # --------------------------------------------------

    if not ObjectId.is_valid(request_data.food_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid food ID"
        )

    db = get_db()

    # --------------------------------------------------
    # Find Food Donation
    # --------------------------------------------------

    food = db.food_donations.find_one(
        {
            "_id": ObjectId(request_data.food_id)
        }
    )

    if not food:
        raise HTTPException(
            status_code=404,
            detail="Food donation not found"
        )

    # --------------------------------------------------
    # Check Donation Status
    # --------------------------------------------------

    if food.get("status") != "available":
        raise HTTPException(
            status_code=400,
            detail=(
                f"This donation is not available "
                f"(current status: {food.get('status')})"
            ),
        )

    # --------------------------------------------------
    # Check Expiry Date
    # --------------------------------------------------

    expiry = food.get("expiry_date")

    if not expiry:
        raise HTTPException(
            status_code=400,
            detail="Food donation has no expiry date"
        )

    # Make naive datetime timezone-aware
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    # Current UTC time
    now = datetime.now(timezone.utc)

    # Check if food has expired
    if expiry < now:

        db.food_donations.update_one(
            {
                "_id": food["_id"]
            },
            {
                "$set": {
                    "status": "expired"
                }
            }
        )

        raise HTTPException(
            status_code=400,
            detail="This food has already expired and cannot be requested."
        )

    # --------------------------------------------------
    # Prevent Duplicate Pending Request
    # --------------------------------------------------

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
            detail="You already have a pending request for this item"
        )

    # --------------------------------------------------
    # Create Request
    # --------------------------------------------------

    request_doc = {
        "food_id": ObjectId(request_data.food_id),
        "receiver_id": ObjectId(current_user["_id"]),
        "message": request_data.message,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc),
        "updated_at": None,
    }

    result = db.requests.insert_one(request_doc)

    # --------------------------------------------------
    # Update Food Donation Status
    # --------------------------------------------------

    db.food_donations.update_one(
        {
            "_id": ObjectId(request_data.food_id)
        },
        {
            "$set": {
                "status": "requested"
            }
        },
    )

    # Add MongoDB generated ID
    request_doc["_id"] = result.inserted_id

    return serialize_request(request_doc)


# ======================================================
# LIST REQUESTS
# ======================================================

@router.get(
    "",
    response_model=List[RequestOut]
)
def list_requests(
    status_filter: Optional[str] = Query(
        None,
        alias="status"
    ),
    food_id: Optional[str] = None,

    current_user: dict = Depends(
        get_current_user
    ),

    skip: int = Query(
        0,
        ge=0
    ),

    limit: int = Query(
        20,
        ge=1,
        le=100
    ),
):
    """
    List food requests based on the user's role.
    """

    db = get_db()

    query = {}

    # --------------------------------------------------
    # Receiver Requests
    # --------------------------------------------------

    if current_user["role"] == "receiver":

        query["receiver_id"] = ObjectId(
            current_user["_id"]
        )

    # --------------------------------------------------
    # Donor Requests
    # --------------------------------------------------

    elif current_user["role"] == "donor":

        my_donation_ids = [
            d["_id"]
            for d in db.food_donations.find(
                {
                    "donor_id": ObjectId(
                        current_user["_id"]
                    )
                },
                {
                    "_id": 1
                }
            )
        ]

        query["food_id"] = {
            "$in": my_donation_ids
        }

    # --------------------------------------------------
    # Status Filter
    # --------------------------------------------------

    if status_filter:
        query["status"] = status_filter

    # --------------------------------------------------
    # Food ID Filter
    # --------------------------------------------------

    if food_id and ObjectId.is_valid(food_id):

        query["food_id"] = ObjectId(food_id)

    # --------------------------------------------------
    # Query Requests
    # --------------------------------------------------

    cursor = (
        db.requests
        .find(query)
        .sort("requested_at", -1)
        .skip(skip)
        .limit(limit)
    )

    results = []

    # --------------------------------------------------
    # Build Response
    # --------------------------------------------------

    for doc in cursor:

        food = db.food_donations.find_one(
            {
                "_id": doc["food_id"]
            },
            {
                "title": 1,
                "donor_id": 1
            }
        )

        receiver = db.users.find_one(
            {
                "_id": doc["receiver_id"]
            },
            {
                "name": 1
            }
        )

        doc = serialize_request(doc)

        if food:

            doc["food_title"] = food.get(
                "title"
            )

            donor_id = food.get(
                "donor_id"
            )

            doc["donor_id"] = (
                str(donor_id)
                if donor_id
                else None
            )

        if receiver:

            doc["receiver_name"] = receiver.get(
                "name"
            )

        results.append(doc)

    return results


# ======================================================
# GET SINGLE REQUEST
# ======================================================

@router.get(
    "/{request_id}",
    response_model=RequestOut
)
def get_request(
    request_id: str,
    current_user: dict = Depends(
        get_current_user
    ),
):
    """
    Get a single food request.
    """

    # --------------------------------------------------
    # Validate Request ID
    # --------------------------------------------------

    if not ObjectId.is_valid(request_id):

        raise HTTPException(
            status_code=400,
            detail="Invalid request ID"
        )

    db = get_db()

    # --------------------------------------------------
    # Find Request
    # --------------------------------------------------

    doc = db.requests.find_one(
        {
            "_id": ObjectId(request_id)
        }
    )

    if not doc:

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    # --------------------------------------------------
    # Find Food
    # --------------------------------------------------

    food = db.food_donations.find_one(
        {
            "_id": doc["food_id"]
        },
        {
            "donor_id": 1,
            "title": 1
        }
    )

    # --------------------------------------------------
    # Authorization
    # --------------------------------------------------

    is_owner = (
        str(doc["receiver_id"])
        == current_user["_id"]
    )

    is_donor = (
        food
        and str(food["donor_id"])
        == current_user["_id"]
    )

    is_admin = (
        current_user["role"]
        == "admin"
    )

    if not (
        is_owner
        or is_donor
        or is_admin
    ):

        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this request"
        )

    # --------------------------------------------------
    # Serialize
    # --------------------------------------------------

    doc = serialize_request(doc)

    if food:

        doc["food_title"] = food.get(
            "title"
        )

        donor_id = food.get(
            "donor_id"
        )

        doc["donor_id"] = (
            str(donor_id)
            if donor_id
            else None
        )

    receiver = db.users.find_one(
        {
            "_id": ObjectId(
                doc["receiver_id"]
            )
        },
        {
            "name": 1
        }
    )

    if receiver:

        doc["receiver_name"] = receiver.get(
            "name"
        )

    return doc


# ======================================================
# UPDATE REQUEST STATUS
# ======================================================

@router.patch(
    "/{request_id}",
    response_model=RequestOut
)
def update_request_status(
    request_id: str,
    update: RequestUpdate,
    current_user: dict = Depends(
        get_current_user
    ),
):
    """
    Accept, reject, or complete a food request.
    """

    # --------------------------------------------------
    # Validate Request ID
    # --------------------------------------------------

    if not ObjectId.is_valid(request_id):

        raise HTTPException(
            status_code=400,
            detail="Invalid request ID"
        )

    db = get_db()

    # --------------------------------------------------
    # Find Request
    # --------------------------------------------------

    doc = db.requests.find_one(
        {
            "_id": ObjectId(request_id)
        }
    )

    if not doc:

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    # --------------------------------------------------
    # Find Food Donation
    # --------------------------------------------------

    food = db.food_donations.find_one(
        {
            "_id": doc["food_id"]
        }
    )

    if not food:

        raise HTTPException(
            status_code=404,
            detail="Associated donation not found"
        )

    # --------------------------------------------------
    # Determine User Permissions
    # --------------------------------------------------

    is_donor = (
        str(food["donor_id"])
        == current_user["_id"]
    )

    is_admin = (
        current_user["role"]
        == "admin"
    )

    is_receiver = (
        str(doc["receiver_id"])
        == current_user["_id"]
    )

    new_status = update.status

    # --------------------------------------------------
    # Accept / Reject Permission
    # --------------------------------------------------

    if new_status in (
        "accepted",
        "rejected"
    ):

        if not (
            is_donor
            or is_admin
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "Only the donor or admin "
                    "can accept/reject"
                )
            )

    # --------------------------------------------------
    # Complete Permission
    # --------------------------------------------------

    if new_status == "completed":

        if not (
            is_donor
            or is_admin
            or is_receiver
        ):

            raise HTTPException(
                status_code=403,
                detail="Not authorized to complete this request"
            )

    # --------------------------------------------------
    # Update Request
    # --------------------------------------------------

    db.requests.update_one(
        {
            "_id": ObjectId(request_id)
        },
        {
            "$set": {
                "status": new_status,
                "updated_at": datetime.now(
                    timezone.utc
                ),
            }
        },
    )

    # --------------------------------------------------
    # ACCEPTED
    # --------------------------------------------------

    if new_status == "accepted":

        # Reject other pending requests
        db.requests.update_many(
            {
                "food_id": doc["food_id"],
                "_id": {
                    "$ne": ObjectId(request_id)
                },
                "status": "pending",
            },
            {
                "$set": {
                    "status": "rejected",
                    "updated_at": datetime.now(
                        timezone.utc
                    ),
                }
            },
        )

        # Update donation
        db.food_donations.update_one(
            {
                "_id": doc["food_id"]
            },
            {
                "$set": {
                    "status": "accepted"
                }
            }
        )

    # --------------------------------------------------
    # REJECTED
    # --------------------------------------------------

    elif new_status == "rejected":

        remaining = db.requests.count_documents(
            {
                "food_id": doc["food_id"],
                "status": {
                    "$in": [
                        "pending",
                        "accepted"
                    ]
                },
            }
        )

        if remaining == 0:

            db.food_donations.update_one(
                {
                    "_id": doc["food_id"]
                },
                {
                    "$set": {
                        "status": "available"
                    }
                }
            )

    # --------------------------------------------------
    # COMPLETED
    # --------------------------------------------------

    elif new_status == "completed":

        db.food_donations.update_one(
            {
                "_id": doc["food_id"]
            },
            {
                "$set": {
                    "status": "completed"
                }
            }
        )

    # --------------------------------------------------
    # Return Updated Request
    # --------------------------------------------------

    updated = db.requests.find_one(
        {
            "_id": ObjectId(request_id)
        }
    )

    return serialize_request(updated)