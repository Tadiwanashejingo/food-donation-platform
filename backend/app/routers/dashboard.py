from fastapi import APIRouter, Depends
from bson import ObjectId

from app.database import get_db
from app.models.schemas import ImpactStats
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard & Impact"])


@router.get("/stats", response_model=ImpactStats)
def get_impact_stats(current_user: dict = Depends(get_current_user)):
    """
    Generate impact statistics using MongoDB aggregation pipelines.
    Available to all authenticated users.
    """
    db = get_db()

    # Donation counts by status
    donation_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    donation_stats = {
        item["_id"]: item["count"]
        for item in db.food_donations.aggregate(donation_pipeline)
    }

    total_donations = sum(donation_stats.values())
    completed_donations = donation_stats.get("completed", 0)
    available_donations = donation_stats.get("available", 0)

    # Request counts by status
    request_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    request_stats = {
        item["_id"]: item["count"]
        for item in db.requests.aggregate(request_pipeline)
    }
    total_requests = sum(request_stats.values())
    accepted_requests = request_stats.get("accepted", 0) + request_stats.get("completed", 0)

    # Active users
    active_donors = db.users.count_documents({"role": "donor"})
    active_receivers = db.users.count_documents({"role": "receiver"})

    # Food by type
    food_by_type = list(
        db.food_donations.aggregate([
            {"$group": {"_id": "$food_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$project": {"_id": 0, "food_type": "$_id", "count": 1}},
        ])
    )

    # Donations by city
    donations_by_city = list(
        db.food_donations.aggregate([
            {"$group": {"_id": "$pickup_address.city", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
            {"$project": {"_id": 0, "city": "$_id", "count": 1}},
        ])
    )

    # Recent donations
    recent = list(db.food_donations.find().sort("created_at", -1).limit(10))
    recent_donations = []
    for doc in recent:
        doc["_id"] = str(doc["_id"])
        doc["donor_id"] = str(doc["donor_id"])
        recent_donations.append(doc)

    return {
        "total_donations": total_donations,
        "completed_donations": completed_donations,
        "available_donations": available_donations,
        "total_requests": total_requests,
        "accepted_requests": accepted_requests,
        "active_donors": active_donors,
        "active_receivers": active_receivers,
        "food_by_type": food_by_type,
        "donations_by_city": donations_by_city,
        "recent_donations": recent_donations,
    }


@router.get("/admin/overview")
def admin_overview(current_user: dict = Depends(require_role("admin"))):
    """Extra admin-only overview."""
    db = get_db()

    users_by_role = list(
        db.users.aggregate([
            {"$group": {"_id": "$role", "count": {"$sum": 1}}},
            {"$project": {"_id": 0, "role": "$_id", "count": 1}},
        ])
    )

    recent_users = list(
        db.users.find({}, {"password": 0}).sort("created_at", -1).limit(5)
    )
    for u in recent_users:
        u["_id"] = str(u["_id"])

    return {
        "users_by_role": users_by_role,
        "recent_users": recent_users,
        "total_users": db.users.count_documents({}),
    }

@router.post("/expire-check")
def force_expire_check(current_user: dict = Depends(require_role("admin"))):
    """Manually trigger expiry check (Admin only)."""
    from app.database import mark_expired_donations
    count = mark_expired_donations()
    return {"message": f"Marked {count} donations as expired."}