// src/features/orders/api.js
import api from "../../lib/api"; // ✅ Import de l'instance centralisée

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
    status: o.status || "panier",
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
  const r = await api.post(`/orders`, buildFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeOrder(r.data);
};

export const updateOrder = async (id, payload) => {
  const r = await api.put(`/orders/${id}`, buildFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });
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
  const fd = new FormData();
  fd.append("status", nextStatus);
  const r = await api.put(`/orders/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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
export const updateOrderStatusByDentist = async (id, currentStatus) => {
  let nextStatus;
  if (currentStatus === "en_attente") {
    nextStatus = "chez_dentiste";
  } else if (currentStatus === "chez_dentiste") {
    nextStatus = "envoye_admin";
  } else {
    throw new Error("Statut non modifiable par le dentiste");
  }

  const fd = new FormData();
  fd.append("status", nextStatus);

  const r = await api.put(`/orders/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return normalizeOrder(r.data);
};
