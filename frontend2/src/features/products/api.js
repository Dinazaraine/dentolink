// /src/features/products/api.js
import api from "../../lib/api.js";

const toNumber = (v) => {
  if (v === null || v === undefined) return v;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
};

const normalizeProduct = (p) => {
  if (!p) return p;
  return { ...p, price: toNumber(p.price) };
};

export const fetchProducts = async () => {
  const r = await api.get("/products");
  const arr = Array.isArray(r.data) ? r.data : [];
  return arr.map(normalizeProduct);
};

export const fetchProductById = async (id) => {
  const r = await api.get(`/products/${id}`);
  return normalizeProduct(r.data);
};

export const createProduct = async (payload) => {
  try {
    const body = { ...payload, price: toNumber(payload.price) };
    const r = await api.post("/products", body);
    return normalizeProduct(r.data);
  } catch (err) {
    console.error("createProduct error →", err.response?.data || err.message);
    throw err;
  }
};

export const updateProduct = async (id, payload) => {
  try {
    const body = { ...payload, price: toNumber(payload.price) };
    const r = await api.put(`/products/${id}`, body);
    return normalizeProduct(r.data);
  } catch (err) {
    console.error("updateProduct error →", err.response?.data || err.message);
    throw err;
  }
};

export const deleteProduct = async (id) => {
  try {
    await api.delete(`/products/${id}`); // 204 attendu
    return true;
  } catch (err) {
    console.error("deleteProduct error →", err.response?.data || err.message);
    throw err;
  }
};
