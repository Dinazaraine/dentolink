// /src/features/orderProducts/api.js
import api from "../../lib/api.js";

/**
 * Récupère les lignes d'une commande (protégé: requireAuth côté backend).
 * - user: ne voit que ses propres commandes
 * - admin: peut tout voir
 */
export const fetchOrderProductsByOrder = async (orderId) => {
  try {
    const r = await api.get(`/order-products/order/${orderId}`);
    return Array.isArray(r.data) ? r.data : [];
  } catch (err) {
    // 401/403 ==> pas autorisé ou token absent/expiré
    console.error("fetchOrderProductsByOrder error →", err.response?.data || err.message);
    throw err;
  }
};

/** Supprime une ligne produit d'une commande (owner ou admin) */
export const deleteOrderProduct = async (id) => {
  try {
    await api.delete(`/order-products/${id}`); // 204 attendu
    return true;
  } catch (err) {
    console.error("deleteOrderProduct error →", err.response?.data || err.message);
    throw err;
  }
};

/**
 * Crée une ligne produit.
 * payload attendu: { orderId:number, productId:number, quantity:number>0 }
 * Le backend vérifiera que la commande appartient au user (ou admin).
 */
export const createOrderProduct = async (payload) => {
  try {
    const body = {
      orderId: Number(payload.orderId),
      productId: Number(payload.productId),
      quantity: Number(payload.quantity),
    };
    const r = await api.post("/order-products", body);
    return r.data;
  } catch (err) {
    console.error("createOrderProduct error →", err.response?.data || err.message);
    throw err;
  }
};
