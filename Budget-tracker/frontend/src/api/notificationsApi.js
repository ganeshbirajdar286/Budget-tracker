import axios from "axios";
import api from "../lib/api";

const API_BASE = (import.meta.env.VITE_BASE_URL && import.meta.env.VITE_BASE_URL.replace(/\/$/, "")) || "http://localhost:5000";

// axios instance using absolute backend URL
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


export const getNotifications = async () => {
  const res = await api.get("/api/notifications");
  return res.data;
};
export const createNotification = async (payload) => {
  const res = await api.post("/api/notifications", payload);
  return res.data;
};

export const markAsRead = async (id) => {
  const res = await api.put(`/api/notifications/${id}/read`);
  return res.data;
};

export const markAllRead = async () => {
  const res = await api.put("/api/notifications/read-all");
  return res.data;
};

export const deleteNotification = async (id) => {
  const res = await api.delete(`/api/notifications/${id}`);
  return res.data;
};

export const clearNotifications = async () => {
  const res = await api.delete("/api/notifications");
  return res.data;
};

export const getNotificationSettings = async () => {
  const res = await api.get("/api/notifications/settings");
  return res.data;
};

export const updateNotificationSettings = async (settings) => {
  const res = await api.put("/api/notifications/settings", settings);
  return res.data;
};

export default api;