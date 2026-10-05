import { createContext, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post("/api/auth/login", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const { access_token, user } = response.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    return user;
  };

  const register = async (userData) => {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};