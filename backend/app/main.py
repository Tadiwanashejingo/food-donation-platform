from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import connect_to_mongo, close_mongo_connection, mark_expired_donations
from app.routers import auth, donations, requests, dashboard, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_mongo()
    expired_count = mark_expired_donations()
    print(f"Marked {expired_count} donations as expired on startup.")
    yield
    close_mongo_connection()


app = FastAPI(
    title="Community Food Donation Platform",
    description="MongoDB + FastAPI project aligned with SDG 2 – Zero Hunger",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(donations.router)
app.include_router(requests.router)
app.include_router(dashboard.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {
        "message": "Community Food Donation Platform API",
        "sdg": "SDG 2 – Zero Hunger",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}