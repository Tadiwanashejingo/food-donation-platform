# Community Food Donation Platform

**MongoDB + Python (PyMongo) + FastAPI**  
Aligned with **Sustainable Development Goal 2 – Zero Hunger**

A complete academic project that connects food donors (restaurants, households, events) with receivers (individuals, NGOs, shelters) to reduce food wastage and fight local hunger.

---

## Features

- User registration and login with role-based access (Donor, Receiver, Admin)
- Full CRUD operations on Food Donations
- Food Request lifecycle (pending → accepted / rejected → completed)
- Search and filter donations by city, food type, and status
- Impact Dashboard using MongoDB aggregation pipelines
- JWT Authentication + Password Hashing (bcrypt)
- Proper document-oriented schema with referencing and indexing

---

## Technology Stack

- **Backend**: Python 3.10+, FastAPI
- **Database**: MongoDB (Community or Atlas)
- **Driver**: PyMongo
- **Auth**: python-jose (JWT), passlib + bcrypt
- **Validation**: Pydantic v2

---

## Project Structure
