import axios from "axios";

const api = axios.create({
  baseURL: "https://food-donation-platform-1a6b.onrender.com", // your FastAPI backend
});

// Automatically attach the token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;