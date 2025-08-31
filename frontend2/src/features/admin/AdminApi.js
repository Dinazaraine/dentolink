const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const getToken = () => localStorage.getItem("token") || null;

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || "Erreur API");
  return data;
}

export const adminApi = {
  /**
   * Liste des utilisateurs avec filtre (status, role)
   * GET /api/users?status=&role=
   */
  listUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/users${qs ? "?" + qs : ""}`);
  },

  /**
   * Met à jour le rôle de l'utilisateur
   * PATCH /api/users/:id/role
   */
  setRole: (id, role) =>
    request(`/api/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  /**
   * Met à jour le statut du compte (active, inactive, suspended)
   * PATCH /api/users/:id/status
   */
  setStatus: (id, accountStatus) =>
    request(`/api/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ accountStatus }),
    }),

  /**
   * Réinitialise le mot de passe d'un utilisateur (Admin)
   * PATCH /api/users/:id/password
   */
  resetPassword: (id, newPassword) =>
    request(`/api/users/${id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ newPassword }),
    }),

  /**
   * Force un utilisateur à réinitialiser son mot de passe
   * PATCH /api/users/:id/force-reset
   */
  setForceReset: (id, reset_required) =>
    request(`/api/users/${id}/force-reset`, {
      method: "PATCH",
      body: JSON.stringify({ reset_required: reset_required ? 1 : 0 }),
    }),

  /**
   * Met à jour le statut en ligne d'un utilisateur (Admin)
   * PATCH /api/users/:id/online
   */
  setOnlineStatus: (id, isOnline) =>
    request(`/api/users/${id}/online`, {
      method: "PATCH",
      body: JSON.stringify({ isOnline: isOnline ? 1 : 0 }),
    }),
};
