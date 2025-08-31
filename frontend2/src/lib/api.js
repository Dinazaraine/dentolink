import axios from "axios";

export const BACKEND_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: BACKEND_URL,
});

// ✅ Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api; // <-- ajouté pour les imports par défaut
