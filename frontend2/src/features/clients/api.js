import api from "../../lib/api"; // ✅ On utilise l'instance Axios centralisée

/** ---------------- Helpers ---------------- */
const normalizeClient = (c, isDentist = false) => {
  if (!c) return null;
  const birthDate =
    typeof c.birthDate === "string" ? c.birthDate.split("T")[0] : c.birthDate;

  return {
    ...c,
    id: Number(c.id),
    firstName: isDentist ? "" : c.firstName ?? "",
    lastName: isDentist ? "" : c.lastName ?? "",
    sexe: c.sexe ?? "",
    birthDate: birthDate || null,
  };
};

/** ----------- API Clients ----------- */
export const fetchClients = async (params = {}, isDentist = false) => {
  const r = await api.get(`/clients`, { params });
  return Array.isArray(r.data) ? r.data.map((c) => normalizeClient(c, isDentist)) : [];
};

export const fetchClientById = async (id, isDentist = false) => {
  const r = await api.get(`/clients/${id}`);
  return normalizeClient(r.data, isDentist);
};

export const createClient = async (payload) => {
  const r = await api.post(`/clients`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return normalizeClient(r.data);
};

export const updateClient = async (id, payload) => {
  const r = await api.put(`/clients/${id}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return normalizeClient(r.data);
};

export const deleteClient = async (id) => {
  await api.delete(`/clients/${id}`);
  return true;
};
