// src/auth/api.js
const BASE = "http://localhost:3000/api"; // ← adapte

export async function loginApi({ email, password }) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { token, user }
}

export async function registerApi({ email, password, firstName, lastName }) {
  const r = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, firstName, lastName }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { token, user } ou { ok:true } si tu préfères confirmer puis login
}

// helper fetch avec token
export async function authFetch(url, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const r = await fetch(url, { ...options, headers });
  if (r.status === 401) throw new Error("Unauthorized");
  return r;
}
