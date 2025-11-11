// src/api/transactions.js
import api, { API_BASE } from "../lib/api";



// OR if you must use fetch:
export async function getTransactionsFetch(userId) {
  const url = `${API_BASE}/api/transactions${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  return res.json();
}
