from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime


# ---------- Address ----------
class Address(BaseModel):
    city: str
    area: Optional[str] = None
    pincode: Optional[str] = None


# ---------- User Schemas ----------
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["donor", "receiver", "admin"] = "receiver"
    phone: Optional[str] = None
    address: Optional[Address] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[Address] = None


class UserOut(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    address: Optional[Address] = None
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Food Donation Schemas ----------
class FoodDonationCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    food_type: Literal[
        "cooked", "packaged", "fruits", "vegetables", "bakery", "dairy", "other"
    ] = "cooked"
    quantity: str = Field(..., min_length=1)
    expiry_date: datetime
    pickup_address: Address


class FoodDonationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    food_type: Optional[str] = None
    quantity: Optional[str] = None
    expiry_date: Optional[datetime] = None
    pickup_address: Optional[Address] = None
    status: Optional[Literal["available", "requested", "completed", "expired"]] = None


class FoodDonationOut(BaseModel):
    id: str = Field(..., alias="_id")
    donor_id: str
    title: str
    description: Optional[str] = None
    food_type: str
    quantity: str
    expiry_date: datetime
    pickup_address: Address
    status: str
    created_at: datetime
    donor_name: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


# ---------- Request Schemas ----------
class RequestCreate(BaseModel):
    food_id: str
    message: Optional[str] = None


class RequestUpdate(BaseModel):
    status: Literal["pending", "accepted", "rejected", "completed"]


class RequestOut(BaseModel):
    id: str = Field(..., alias="_id")
    food_id: str
    receiver_id: str
    message: Optional[str] = None
    status: str
    requested_at: datetime
    updated_at: Optional[datetime] = None

    # Extra info
    food_title: Optional[str] = None
    donor_id: Optional[str] = None
    donor_name: Optional[str] = None
    donor_phone: Optional[str] = None
    donor_email: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_phone: Optional[str] = None
    receiver_email: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


# ---------- Dashboard Stats ----------
class ImpactStats(BaseModel):
    total_donations: int
    completed_donations: int
    available_donations: int
    total_requests: int
    accepted_requests: int
    active_donors: int
    active_receivers: int
    food_by_type: List[dict]
    donations_by_city: List[dict]
    recent_donations: List[FoodDonationOut]