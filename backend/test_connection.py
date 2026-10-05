from app.database import connect_to_mongo, get_db

connect_to_mongo()
db = get_db()

print("Collections:", db.list_collection_names())
print("✅ Connection successful!")