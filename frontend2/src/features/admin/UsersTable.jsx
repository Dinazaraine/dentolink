import { useEffect, useState } from "react";
import { adminApi } from "./AdminApi.js";
import UserOnlineDot from "../../components/UserOnlineDot.jsx";

const roleOptions = ["user", "admin"];
const statusOptions = ["pending", "approved", "rejected", "suspended"];

export default function UsersTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: "", status: "" });

  // Récupération des données
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listUsers({
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      });
      setRows(data);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [filters]);

  const applyFilters = (e) => {
    e?.preventDefault?.();
    fetchData();
  };

  const onRoleChange = async (id, role) => {
    try {
      await adminApi.setRole(id, role);
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  const onStatusChange = async (id, accountStatus) => {
    try {
      await adminApi.setStatus(id, accountStatus);
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  const onResetPassword = async (id) => {
    const newPassword = prompt("Nouveau mot de passe (min 6 caractères) :");
    if (!newPassword) return;
    try {
      await adminApi.resetPassword(id, newPassword);
      alert("Mot de passe mis à jour.");
    } catch (e) {
      alert(e.message);
    }
  };

  const onToggleForceReset = async (id, currentFlag) => {
    try {
      await adminApi.setForceReset(id, !currentFlag);
      fetchData();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <form
        onSubmit={applyFilters}
        className="flex items-center gap-3 flex-wrap bg-white p-4 rounded shadow"
      >
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium">Rôle :</label>
          <select
            className="border rounded px-2 py-1"
            value={filters.role}
            onChange={(e) =>
              setFilters((f) => ({ ...f, role: e.target.value }))
            }
          >
            <option value="">Tous</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <label className="text-sm font-medium">Statut :</label>
          <select
            className="border rounded px-2 py-1"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">Tous</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <button
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
          type="submit"
        >
          Filtrer
        </button>
        <button
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition"
          type="button"
          onClick={() => {
            setFilters({ role: "", status: "" });
            fetchData();
          }}
        >
          Réinitialiser
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="text-center py-6 text-gray-500">Chargement…</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Connecté</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Rôle</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Dernier login</th>
                <th className="px-4 py-3 text-left">Reset req.</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                >
                  <td className="px-4 py-3">
                    <UserOnlineDot online={!!u.online} size={14} />
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="border rounded px-2 py-1"
                      value={u.role}
                      onChange={(e) => onRoleChange(u.id, e.target.value)}
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="border rounded px-2 py-1"
                      value={u.accountStatus}
                      onChange={(e) => onStatusChange(u.id, e.target.value)}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{u.reset_required ? "oui" : "non"}</td>
                  <td className="px-4 py-3 flex gap-2 flex-wrap">
                    <button
                      className="bg-yellow-200 px-2 py-1 rounded hover:bg-yellow-300 transition"
                      onClick={() => onResetPassword(u.id)}
                    >
                      Réinit. mdp
                    </button>
                    <button
                      className="bg-red-200 px-2 py-1 rounded hover:bg-red-300 transition"
                      onClick={() =>
                        onToggleForceReset(u.id, !!u.reset_required)
                      }
                    >
                      {u.reset_required ? "Retirer reset" : "Forcer reset"}
                    </button>
                    <button
                      className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 transition"
                      onClick={() => navigator.clipboard?.writeText(u.email)}
                    >
                      Copier email
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right p-3">
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
              onClick={fetchData}
            >
              Rafraîchir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
