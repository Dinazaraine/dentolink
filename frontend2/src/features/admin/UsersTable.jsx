import { useEffect, useState } from "react";
import { adminApi } from "./AdminApi.js";
import UserOnlineDot from "../../components/UserOnlineDot.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const roleOptions = ["user", "dentiste", "admin"];
const statusOptions = ["pending", "approved", "rejected", "suspended"];

export default function UsersTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: "", status: "" });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const USERS_PER_PAGE = 5;

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
      setAlert({ type: "danger", message: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [filters]);

  // Recherche (nom, email, rôle, statut)
  const filteredUsers = rows.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(s) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(s) ||
      u.role?.toLowerCase().includes(s) ||
      u.accountStatus?.toLowerCase().includes(s)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const indexOfLast = currentPage * USERS_PER_PAGE;
  const indexOfFirst = indexOfLast - USERS_PER_PAGE;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);

  // Handlers
  const onRoleChange = async (id, role) => {
    try {
      await adminApi.setRole(id, role);
      setAlert({ type: "success", message: "Rôle mis à jour ✅" });
      fetchData();
    } catch (e) {
      setAlert({ type: "danger", message: e.message });
    }
  };

  const onStatusChange = async (id, accountStatus) => {
    try {
      await adminApi.setStatus(id, accountStatus);
      setAlert({ type: "success", message: "Statut mis à jour ✅" });
      fetchData();
    } catch (e) {
      setAlert({ type: "danger", message: e.message });
    }
  };

  return (
    <div>
      {/* 🔹 Alertes */}
      {alert.message && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show`}
          role="alert"
        >
          {alert.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert({ type: "", message: "" })}
          ></button>
        </div>
      )}

      {/* 🔹 Barre de recherche */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-primary mb-0">
          <i className="bi bi-people-fill me-2"></i> Utilisateurs
        </h4>
        <input
          type="text"
          className="form-control w-50 shadow-sm"
          placeholder="🔍 Rechercher par email, nom, rôle, statut..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* 🔹 Filtres */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchData();
        }}
        className="card card-body mb-4 shadow-sm"
      >
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <label className="form-label fw-bold">Rôle :</label>
            <select
              className="form-select"
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

          <div className="col-md-6">
            <label className="form-label fw-bold">Statut :</label>
            <select
              className="form-select"
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
        </div>
      </form>

      {/* 🔹 Tableau */}
      {loading ? (
        <div className="text-center py-5 text-muted">Chargement…</div>
      ) : (
        <div className="table-responsive shadow-sm rounded">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-primary">
              <tr>
                <th>
                  <i className="bi bi-circle-fill text-success me-2"></i> Connecté
                </th>
                <th><i className="bi bi-envelope-at me-2"></i> Email</th>
                <th><i className="bi bi-person-badge me-2"></i> Nom</th>
                <th><i className="bi bi-diagram-3 me-2"></i> Rôle</th>
                <th><i className="bi bi-shield-check me-2"></i> Statut</th>
                <th><i className="bi bi-clock-history me-2"></i> Dernier login</th>
                <th><i className="bi bi-exclamation-circle me-2"></i> Reset req.</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <UserOnlineDot online={!!u.online} size={14} />
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {u.firstName} {u.lastName}
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
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
                  <td>
                    <select
                      className="form-select form-select-sm"
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
                  <td>
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.reset_required ? "bg-danger" : "bg-success"
                      }`}
                    >
                      {u.reset_required ? "Oui" : "Non"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 🔹 Pagination Bootstrap */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    ⬅ Précédent
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li
                    key={i}
                    className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Suivant ➡
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
