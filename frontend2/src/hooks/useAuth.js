// src/auth/useAuth.js
import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setUser(d.user))
      .catch(() => setUser(null));
  }, []);
  return { user, role: user?.role, isAdmin: user?.role === "admin" };
}
