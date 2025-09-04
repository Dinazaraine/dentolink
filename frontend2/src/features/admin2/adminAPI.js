import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Récupérer toutes les commandes
export const fetchOrders = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  return res.data;
};

// Mettre à jour le statut d'une commande
export const updateOrderStatus = async (orderId, status) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(
    `${API_BASE}/orders/${orderId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Supprimer une commande
export const deleteOrder = async (orderId) => {
  const token = localStorage.getItem("token");
  const res = await axios.delete(`${API_BASE}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
