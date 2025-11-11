// src/lib/api.js
import axios from "axios";

// Use VITE_API_URL (deployed) or fallback to localhost for dev
const RAW_API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
// remove potential trailing slash
export const API_BASE = RAW_API_BASE.replace(/\/$/, "");

// axios instance: uses absolute backend URL and sends cookies
const api = axios.create({
  baseURL: API_BASE,       // e.g. https://budget-tracker-1-01.onrender.com
  withCredentials: true,   // include cookies for cookie-based auth
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: attach Authorization header if you store a JWT in localStorage
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (err) => Promise.reject(err));

export default api;
