import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Récupérer toutes les commandes
export const fetchOrders = async () => {
  const res = await axios.get(`${API_BASE}/orders`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Mettre à jour le statut d'une commande
export const updateOrderStatus = async (orderId, orderStatus) => {
  const res = await axios.put(
    `${API_BASE}/orders/${orderId}/status`,
    { orderStatus },
    { headers: getAuthHeaders() }
  );
  return res.data;
};

// Supprimer une commande
export const deleteOrder = async (orderId) => {
  const res = await axios.delete(`${API_BASE}/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// Récupérer les fichiers d'une commande
export const getOrderFiles = async (orderId) => {
  const res = await axios.get(`${API_BASE}/orders/${orderId}/files`, {
    headers: getAuthHeaders(),
  });
  return res.data || [];   // directement un tableau de fichiers
};
