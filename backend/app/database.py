from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from dotenv import load_dotenv
from datetime import datetime, timezone
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "food_donation_db")

client: MongoClient = None
db: Database = None


def connect_to_mongo():
    """Initialize MongoDB connection and create indexes."""
    global client, db
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]

    # Indexes for better performance
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.users.create_index([("role", ASCENDING)])

    db.food_donations.create_index([("status", ASCENDING)])
    db.food_donations.create_index([("food_type", ASCENDING)])
    db.food_donations.create_index([("pickup_address.city", ASCENDING)])
    db.food_donations.create_index([("donor_id", ASCENDING)])
    db.food_donations.create_index([("expiry_date", ASCENDING)])
    db.food_donations.create_index([("created_at", DESCENDING)])

    db.requests.create_index([("food_id", ASCENDING)])
    db.requests.create_index([("receiver_id", ASCENDING)])
    db.requests.create_index([("status", ASCENDING)])
    db.requests.create_index([("requested_at", DESCENDING)])

    print(f"✅ Connected to MongoDB → {DATABASE_NAME}")
    return db


def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")


def get_db() -> Database:
    return db


def mark_expired_donations():
    """Mark donations as expired if expiry_date has passed."""
    db = get_db()
    now = datetime.now(timezone.utc)

    result = db.food_donations.update_many(
        {
            "expiry_date": {"$lt": now},
            "status": {"$in": ["available", "requested"]}
        },
        {"$set": {"status": "expired"}}
    )
    return result.modified_count