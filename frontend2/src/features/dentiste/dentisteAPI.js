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
  // Supprimer le nom et prénom des clients
  return res.data.map(order => ({
    ...order,
    client_name: undefined,  // ou order.client_name = null si nécessaire
    client_firstname: undefined
  }));
};

// Mettre à jour le statut d'une commande (envoyer à l'admin)
export const updateOrderStatus = async (orderId, status) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(
    `${API_BASE}/orders/${orderId}/status`,
    { status },
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

  return res.data; // commande complète mise à jour
};


// Récupérer tous les fichiers d'une commande
export const getOrderFiles = async (orderId) => {
  const res = await axios.get(`${API_URL}/orders/${orderId}`, { headers: getAuthHeaders() });
  return res.data.files || [];
};
