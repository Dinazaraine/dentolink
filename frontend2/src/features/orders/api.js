import api from "../../lib/api"; // ✅ Instance centralisée d'axios

/** Petit helper JSON.parse sans crash */
const safeParseJSON = (v, fallback) => {
  if (v == null) return fallback;
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v || "[]");
    } catch {
      return fallback;
    }
  }
  return fallback;
};

/** ---------------- Normalisation des commandes ---------------- */
export const normalizeOrder = (o) => {
  if (!o) return null;
  return {
    ...o,
    upper_teeth: safeParseJSON(o.upper_teeth, []),
    lower_teeth: safeParseJSON(o.lower_teeth, []),
    file_paths: safeParseJSON(o.file_paths, []),
    id: Number(o.id),
    clientId: o.clientId !== undefined ? Number(o.clientId) : null,
    total:
      o.total !== undefined && o.total !== null && !Number.isNaN(Number(o.total))
        ? Number(o.total)
        : 10.0,
    orderStatus: o.orderStatus || o.status || "en_attente", // ✅ normalisation
    paymentStatus:
      o.paymentStatus && o.paymentStatus !== "null" && o.paymentStatus !== ""
        ? o.paymentStatus
        : "panier", // ✅ corrigé
    paymentMethod: o.paymentMethod || null,
    transactionRef: o.transactionRef || null,
  };
};

/** ---------------- Helpers ---------------- */
const buildFormData = (payload) => {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, Array.isArray(v) || typeof v === "object" ? JSON.stringify(v) : v);
  });
  if (Array.isArray(payload?.files)) {
    payload.files.forEach((f) => fd.append("files", f));
  }
  return fd;
};

/** ----------- API Commandes ----------- */
export const fetchOrders = async (params = {}) => {
  const r = await api.get(`/orders`, { params });
  return Array.isArray(r.data) ? r.data.map(normalizeOrder) : [];
};

export const fetchOrderById = async (id) => {
  const r = await api.get(`/orders/${id}`);
  return normalizeOrder(r.data);
};

export const createOrder = async (payload) => {
  // ✅ pas de Content-Type ici → axios gère boundary automatiquement
  const r = await api.post(`/orders`, buildFormData(payload));
  return normalizeOrder(r.data);
};

export const updateOrder = async (id, payload) => {
  // ✅ idem pour update
  const r = await api.put(`/orders/${id}`, buildFormData(payload));
  return normalizeOrder(r.data);
};

export const deleteOrder = async (id) => {
  await api.delete(`/orders/${id}`);
  return true;
};

/** ----------- Stripe Checkout ----------- */
export const createCheckoutSession = async (orderId) => {
  try {
    const { data } = await api.post(`/orders/${orderId}/create-checkout-session`, {
      t: Date.now(),
    });

    if (!data?.url) {
      throw new Error("La session Stripe n'a pas pu être créée.");
    }

    return data; // { id, url }
  } catch (err) {
    console.error("Erreur API Stripe:", err?.response?.data || err?.message);
    throw new Error(err?.response?.data?.error || "Impossible de créer la session de paiement.");
  }
};

/** Vérifie le paiement et récupère la commande */
export const fetchOrderAfterPayment = async (orderId) => {
  return await fetchOrderById(orderId);
};

/** ----------- Profil utilisateur courant ----------- */
export const fetchMe = async () => {
  const r = await api.get(`/auth/me`);
  return r.data?.user || null;
};

/** ----------- Changer uniquement le statut d’une commande ----------- */
export const updateOrderStatus = async (id, nextStatus) => {
  const r = await api.put(`/orders/${id}/status`, { orderStatus: nextStatus });
  return normalizeOrder(r.data);
};

/** ----------- Télécharger un fichier depuis /uploads ----------- */
export const downloadFile = async (fileNameOrPath) => {
  const name = String(fileNameOrPath || "").replace(/^\/?uploads\//, "");
  const res = await api.get(`/uploads/${name}`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/** ----------- Mise à jour de statut par dentiste ----------- */
export const updateOrderStatusByDentist = async (id, currentStatus) => {
  let nextStatus;
  if (currentStatus === "en_attente") {
    nextStatus = "chez_dentiste";
  } else if (currentStatus === "chez_dentiste") {
    nextStatus = "envoye_admin";
  } else {
    throw new Error("Statut non modifiable par le dentiste");
  }

  const r = await api.put(`/orders/${id}/status`, { orderStatus: nextStatus });
  return normalizeOrder(r.data);
};

/** ----------- Récupérer les fichiers d'une commande ----------- */
export const getOrderFiles = async (orderId) => {
  const res = await api.get(`/orders/${orderId}/files`);
  return res.data || []; // ✅ tableau de fichiers
};

/** ----------- Générer / Télécharger une facture PDF ----------- */
export const generateInvoice = async (orderId) => {
  try {
    const res = await api.get(`/orders/${orderId}/invoice`, {
      responseType: "blob", // ⚠️ nécessaire pour recevoir un PDF
    });

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `facture_commande_${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("Erreur génération facture:", err?.response?.data || err?.message);
    throw new Error("Impossible de générer la facture PDF.");
  }
};

/** ----------- Messagerie ----------- */

// Envoyer un message
export const sendMessage = async (to, message) => {
  if (!to || !message?.trim()) {
    throw new Error("Destinataire ou message manquant");
  }

  const r = await api.post(`/orders/messages`, { to, message });
  return r.data; // { id, senderId, receiverId, message, createdAt, ... }
};

// Récupérer l’historique avec un utilisateur
export const fetchMessagesWithUser = async (userId) => {
  if (!userId) return [];
  const r = await api.get(`/orders/messages/${userId}`);
  return Array.isArray(r.data) ? r.data : [];
};

// Récupérer la liste des conversations (dernier message par utilisateur)
export const fetchConversations = async () => {
  const r = await api.get(`/orders/conversations`);
  return Array.isArray(r.data) ? r.data : [];
};

/** ----------- Notifications ----------- */

// Récupérer mes notifications (messages non lus)
export const fetchNotifications = async () => {
  try {
    const r = await api.get(`/orders/notifications`);
    return Array.isArray(r.data) ? r.data : [];
  } catch (err) {
    console.error("Erreur lors du chargement des notifications:", err);
    return [];
  }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) return false;
  try {
    await api.patch(`/orders/notifications/${notificationId}/read`);
    return true;
  } catch (err) {
    console.error("Erreur lors de la mise à jour de la notification:", err);
    return false;
  }
};
/** ----------- Paiement multiple ----------- */
export const payMultipleOrders = async (orderIds = []) => {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new Error("Aucune commande sélectionnée");
  }

  try {
    const { data } = await api.post(`/orders/pay-multiple`, { orderIds });

    if (!data?.url) {
      throw new Error("Erreur création session Stripe");
    }

    return data; // { url: "https://checkout.stripe.com/..." }
  } catch (err) {
    console.error("Erreur API payMultipleOrders:", err?.response?.data || err?.message);
    throw new Error(err?.response?.data?.error || "Impossible de créer la session Stripe multiple.");
  }
};

/** ----------- Facture groupée ----------- */
export const generateInvoiceMultiple = async (orderIds = []) => {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new Error("Aucune commande sélectionnée");
  }

  try {
    const res = await api.get(`/orders/invoice-multiple`, {
      params: { ids: orderIds.join(",") },
      responseType: "blob", // ✅ recevoir un PDF
    });

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `facture_multiple.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("Erreur génération facture multiple:", err?.response?.data || err?.message);
    throw new Error("Impossible de générer la facture multiple.");
  }
};
