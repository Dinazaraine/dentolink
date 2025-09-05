// src/auth/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function loginApi({ email, password }) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { token, user }
}

export async function registerApi({
  email,
  password,
  companyName,
  phone_fixed,
  phone_mobile,
  siret,
  address,
  zipcode,
  city,
  country,
}) {
  const r = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      companyName,
      phone_fixed,
      phone_mobile,
      siret,
      address,
      zipcode,
      city,
      country,
    }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { token, user } ou { message, user } selon backend
}

// helper fetch avec token
export async function authFetch(url, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const r = await fetch(url, { ...options, headers });
  if (r.status === 401) throw new Error("Unauthorized");
  return r;
}
