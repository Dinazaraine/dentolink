// frontend2/src/hooks/useHeartbeat.js
import { useEffect } from "react";

export default function useHeartbeat(enabled = true, intervalMs = 60000) {
  useEffect(() => {
    if (!enabled) return;
    let t;
    const hit = async () => {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await fetch(`${API_URL}/api/auth/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          });
        } catch {}
      }
      t = setTimeout(hit, intervalMs);
    };
    hit();
    return () => t && clearTimeout(t);
  }, [enabled, intervalMs]);
}
