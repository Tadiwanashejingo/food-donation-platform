# 🌍 FoodBridge — Community Food Donation Platform

A full-stack web application that connects **food donors** with **receivers** to reduce food waste and support community nutrition.

Aligned with **UN SDG 2 – Zero Hunger**.

---

## ✨ Features

### Donor
- Register / login (JWT + role-based access)
- Create and manage food donations
- Accept / Reject / Complete requests
- Personal dashboard with impact overview

### Receiver
- Browse available donations (filter by city)
- Request food
- Track request status
- View platform Impact stats

### System
- MongoDB document model + indexes
- Auto-expiry of past-due donations
- Aggregation pipelines for impact analytics
- React UI with FoodBridge branding

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Database | MongoDB |
| Backend | Python, FastAPI, PyMongo |
| Auth | JWT, bcrypt |
| Frontend | React (Vite), Axios, React Router |
| Server | Uvicorn |

---

## 📁 Project Structure
