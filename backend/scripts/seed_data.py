"""
Seed script – creates sample users, donations and requests.
Run from project root:
    python -m scripts.seed_data
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datetime import datetime, timedelta, timezone
from app.database import connect_to_mongo, get_db
from app.utils.auth import hash_password


def seed():
    connect_to_mongo()
    db = get_db()

    # Clear existing data
    db.users.delete_many({})
    db.food_donations.delete_many({})
    db.requests.delete_many({})
    print("Cleared existing collections.")

    # ---------- Users ----------
    users = [
        {
            "name": "Admin User",
            "email": "admin@foodshare.com",
            "password": hash_password("admin123"),
            "role": "admin",
            "phone": "9999999999",
            "address": {"city": "Mumbai", "area": "Andheri", "pincode": "400053"},
            "created_at": datetime.now(timezone.utc),
        },
        {
            "name": "Rahul Sharma",
            "email": "rahul.donor@example.com",
            "password": hash_password("donor123"),
            "role": "donor",
            "phone": "9876543210",
            "address": {"city": "Mumbai", "area": "Bandra", "pincode": "400050"},
            "created_at": datetime.now(timezone.utc),
        },
        {
            "name": "Priya Patel",
            "email": "priya.donor@example.com",
            "password": hash_password("donor123"),
            "role": "donor",
            "phone": "9876543211",
            "address": {"city": "Pune", "area": "Kothrud", "pincode": "411038"},
            "created_at": datetime.now(timezone.utc),
        },
        {
            "name": "Amit Kumar",
            "email": "amit.receiver@example.com",
            "password": hash_password("receiver123"),
            "role": "receiver",
            "phone": "9123456780",
            "address": {"city": "Mumbai", "area": "Dadar", "pincode": "400014"},
            "created_at": datetime.now(timezone.utc),
        },
        {
            "name": "Sunita Devi",
            "email": "sunita.receiver@example.com",
            "password": hash_password("receiver123"),
            "role": "receiver",
            "phone": "9123456781",
            "address": {"city": "Pune", "area": "Hadapsar", "pincode": "411028"},
            "created_at": datetime.now(timezone.utc),
        },
    ]

    user_ids = {}
    for u in users:
        result = db.users.insert_one(u)
        user_ids[u["email"]] = result.inserted_id
        print(f"Created user: {u['name']} ({u['role']})")

    # ---------- Food Donations ----------
    now = datetime.now(timezone.utc)
    donations = [
        {
            "donor_id": user_ids["rahul.donor@example.com"],
            "title": "Fresh Vegetable Biryani (20 plates)",
            "description": "Leftover from a wedding catering. Hygienically packed.",
            "food_type": "cooked",
            "quantity": "20 plates",
            "expiry_date": now + timedelta(hours=8),
            "pickup_address": {"city": "Mumbai", "area": "Bandra West", "pincode": "400050"},
            "status": "available",
            "created_at": now - timedelta(hours=2),
        },
        {
            "donor_id": user_ids["rahul.donor@example.com"],
            "title": "Packaged Biscuits & Snacks",
            "description": "Unopened packets from office pantry clearance.",
            "food_type": "packaged",
            "quantity": "15 packets",
            "expiry_date": now + timedelta(days=30),
            "pickup_address": {"city": "Mumbai", "area": "Andheri East", "pincode": "400069"},
            "status": "available",
            "created_at": now - timedelta(hours=5),
        },
        {
            "donor_id": user_ids["priya.donor@example.com"],
            "title": "Fresh Fruits Basket",
            "description": "Apples, bananas and oranges from a local market surplus.",
            "food_type": "fruits",
            "quantity": "5 kg",
            "expiry_date": now + timedelta(days=3),
            "pickup_address": {"city": "Pune", "area": "Kothrud", "pincode": "411038"},
            "status": "available",
            "created_at": now - timedelta(hours=1),
        },
        {
            "donor_id": user_ids["priya.donor@example.com"],
            "title": "Homemade Roti & Sabzi",
            "description": "Extra food prepared for a family function.",
            "food_type": "cooked",
            "quantity": "12 plates",
            "expiry_date": now + timedelta(hours=6),
            "pickup_address": {"city": "Pune", "area": "Kothrud", "pincode": "411038"},
            "status": "requested",
            "created_at": now - timedelta(hours=3),
        },
        {
            "donor_id": user_ids["rahul.donor@example.com"],
            "title": "Bakery Items – Bread & Cakes",
            "description": "End-of-day bakery surplus. Still fresh.",
            "food_type": "bakery",
            "quantity": "8 loaves + 4 cakes",
            "expiry_date": now + timedelta(hours=12),
            "pickup_address": {"city": "Mumbai", "area": "Bandra", "pincode": "400050"},
            "status": "completed",
            "created_at": now - timedelta(days=1),
        },
    ]

    donation_ids = []
    for d in donations:
        result = db.food_donations.insert_one(d)
        donation_ids.append(result.inserted_id)
        print(f"Created donation: {d['title']}")

    # ---------- Requests ----------
    requests_data = [
        {
            "food_id": donation_ids[3],  # Homemade Roti
            "receiver_id": user_ids["sunita.receiver@example.com"],
            "message": "We run a small shelter. This would help a lot.",
            "status": "pending",
            "requested_at": now - timedelta(hours=1),
            "updated_at": None,
        },
        {
            "food_id": donation_ids[4],  # Bakery
            "receiver_id": user_ids["amit.receiver@example.com"],
            "message": "Thank you for the donation!",
            "status": "completed",
            "requested_at": now - timedelta(days=1, hours=2),
            "updated_at": now - timedelta(days=1),
        },
    ]

    for r in requests_data:
        db.requests.insert_one(r)
        print(f"Created request for food_id: {r['food_id']}")

    print("\n✅ Seed data inserted successfully!")
    print("\nDemo credentials:")
    print("  Admin    → admin@foodshare.com / admin123")
    print("  Donor    → rahul.donor@example.com / donor123")
    print("  Donor    → priya.donor@example.com / donor123")
    print("  Receiver → amit.receiver@example.com / receiver123")
    print("  Receiver → sunita.receiver@example.com / receiver123")


if __name__ == "__main__":
    seed()