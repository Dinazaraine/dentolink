import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Token pour l'authentification
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ---------------------- Commandes ----------------------

// Récupère toutes les commandes pour le dentiste (sans afficher le nom du client)
export const getOrdersForDentist = async () => {
  const res = await axios.get(`${API_URL}/orders`, { headers: getAuthHeaders() });
  return res.data.map(order => ({
    ...order,
    client_name: undefined,
    client_firstname: undefined,
    // 🔹 Préparer les fichiers avec URLs complètes
    files: (order.files || []).map(f => {
      const url = f.url || "";
      const fullUrl = url.startsWith("/uploads") ? `${API_ORIGIN}${url}` : url;
      return { ...f, fullUrl };
    })
  }));
};

// Mettre à jour le statut d'une commande (envoyer à l'admin)
export const updateOrderStatus = async (orderId, orderStatus) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(
    `${API_URL}/orders/${orderId}/status`,
    { orderStatus },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// ---------------------- Fichiers ----------------------

// Upload des fichiers réalisés par le dentiste pour une commande
export const uploadDentistFiles = async (orderId, files = []) => {
  const formData = new FormData();
  (files || []).forEach(file => formData.append("files", file));

  const res = await axios.put(`${API_URL}/orders/${orderId}`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  // 🔹 Retourner commande + fichiers avec URLs complètes
  return {
    ...res.data,
    files: (res.data?.files || []).map(f => {
      const url = f.url || "";
      const fullUrl = url.startsWith("/uploads") ? `${API_ORIGIN}${url}` : url;
      return { ...f, fullUrl };
    })
  };
};

// Déterminer l'origine API
const API_ORIGIN = (() => {
  try {
    const u = new URL(API_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return window.location.origin;
  }
})();

// Récupérer tous les fichiers d'une commande
export const getOrderFiles = async (orderId) => {
  const res = await axios.get(`${API_URL}/orders/${orderId}/files`, {
    headers: getAuthHeaders(),
  });

  return (res.data || []).map(f => {
    const url = f.url || "";
    const fullUrl = url.startsWith("/uploads") ? `${API_ORIGIN}${url}` : url;
    return { ...f, fullUrl };
  });
};
