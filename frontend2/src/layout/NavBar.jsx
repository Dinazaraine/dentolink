import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { authFetch } from "../auth/api"; // Helper pour requêtes avec token
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function NavBar() {
  const { user, token, logout, login } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    companyName: user?.companyName || "",
    email: user?.email || "",
    phone_fixed: user?.phone_fixed || "",
    phone_mobile: user?.phone_mobile || "",
    address: user?.address || "",
  });

  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // 🔹 Alertes
  const [alert, setAlert] = useState({ type: "", message: "" });

  function handleLogout() {
    qc.clear();
    logout();
    nav("/login", { replace: true });
  }

  async function handleSave() {
    try {
      // 🔹 Mise à jour infos utilisateur
      const r = await authFetch(`http://localhost:3000/api/users/${user.id}`, {
        token,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error("Erreur mise à jour utilisateur");
      await r.json();
      login(token, { ...user, ...form });

      let successMsg = "Profil mis à jour avec succès ✅";

      // 🔹 Changement mot de passe
      if (passwords.newPassword) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          setAlert({
            type: "danger",
            message: "Les mots de passe ne correspondent pas ❌",
          });
          return;
        }
        const p = await authFetch(
          "http://localhost:3000/api/auth/me/password",
          {
            token,
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword: passwords.newPassword }),
          }
        );
        if (!p.ok) throw new Error("Erreur changement mot de passe");
        successMsg += " — Mot de passe modifié ✅";
      }

      setAlert({ type: "success", message: successMsg });
      setShowModal(false);
    } catch (e) {
      console.error(e);
      setAlert({
        type: "danger",
        message: "Impossible de sauvegarder les modifications ❌",
      });
    }
  }

  const isAdmin = token && user?.role === "admin";
  const isDentist = token && user?.role === "dentiste";

  return (
    <>
      <div
        className="d-flex flex-column p-3 text-white shadow"
        style={{
          width: collapsed ? "80px" : "240px",
          transition: "width 0.3s",
          minHeight: "100vh",
          background: "linear-gradient(180deg, #0d6efd, #6f42c1)",
        }}
      >
        {/* Logo + bouton toggle */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-gem fs-4 me-2"></i>
            {!collapsed && <span className="fs-5 fw-bold">DENTOLINK</span>}
          </div>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={() => setCollapsed(!collapsed)}
          >
            <i className="bi bi-list"></i>
          </button>
        </div>
        <hr className="text-white" />

        {/* Liens de navigation */}
        <ul className="nav nav-pills flex-column mb-auto">
          {/* Utilisateur simple */}
          {!isAdmin && !isDentist && token && (
            <>
              <li>
                <NavLink to="/" className="nav-link text-white d-flex align-items-center">
                  <i className="bi bi-house-door me-2"></i>
                  {!collapsed && "Accueil"}
                </NavLink>
              </li>
              <li>
                <NavLink to="/products" className="nav-link text-white d-flex align-items-center">
                  <i className="bi bi-gear me-2"></i>
                  {!collapsed && "Produits"}
                </NavLink>
              </li>
              <li>
                <NavLink to="/OrderTable" className="nav-link text-white d-flex align-items-center">
                  <i className="bi bi-bag-check me-2"></i>
                  {!collapsed && "Liste Commandes"}
                </NavLink>
              </li>
              
              <li>
                <NavLink to="/orders" className="nav-link text-white d-flex align-items-center">
                  <i className="bi bi-cart4 me-2"></i>
                  {!collapsed && "Crée Commandes"}
                </NavLink>
              </li>
            </>
          )}

          {/* Admin */}
          {isAdmin && (
            <>
              <li>
                <NavLink to="/admin" className="nav-link text-white d-flex align-items-center">
                  <i className="bi bi-speedometer2 me-2"></i>
                  {!collapsed && "Dashboard"}
                </NavLink>
              </li>
              <li>
                <NavLink to="/AdminUsersPage" className="nav-link text-white d-flex align-items-center">
                  <i className="bi bi-people me-2"></i>
                  {!collapsed && "Utilisateurs"}
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/orders" className="nav-link text-white d-flex align-items-center">
                  <i className="bi bi-clipboard-check me-2"></i>
                  {!collapsed && "Commandes Admin"}
                </NavLink>
              </li>
            </>
          )}

          {/* Dentiste */}
          {isDentist && (
            <>
              <li>
                <NavLink to="/dentiste" className="nav-link text-white d-flex align-items-center">
                  <i className="bi bi-person-workspace me-2"></i>
                  {!collapsed && "Dashboard"}
                </NavLink>
              </li>
              <li>
                <NavLink to="/dentiste/orders" className="nav-link text-white d-flex align-items-center">
                  <i className="bi bi-list-check me-2"></i>
                  {!collapsed && "Commandes Dentiste"}
                </NavLink>
              </li>
              <li>
                <NavLink to="/dentiste/orders/:id/upload" className="nav-link text-white d-flex align-items-center">
                  <i className="bi bi-folder2-open me-2"></i>
                  {!collapsed && "Upload Fichiers"}
                </NavLink>
              </li>
            </>
          )}
        </ul>
        <hr className="text-white" />

        {/* Zone utilisateur */}
        <div>
          {token ? (
            <>
              {!collapsed && user && (
  <div
    className="mb-2 text-center"
    style={{ cursor: "pointer" }}
    onClick={() => setShowModal(true)}
  >
    <span className="badge bg-light text-dark px-3 py-2">
      <i className="bi bi-gear me-2"></i>
      {user.companyName || `${user.firstName} ${user.lastName}`}
    </span>
  </div>
)}

              <button className="btn btn-outline-light btn-sm w-100" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>
                {!collapsed && "Se déconnecter"}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-outline-light btn-sm w-100 mb-2">
                <i className="bi bi-box-arrow-in-right me-1"></i>
                {!collapsed && "Connexion"}
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm w-100">
                <i className="bi bi-person-plus me-1"></i>
                {!collapsed && "Inscription"}
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* =====================
          ALERT GLOBAL
      ===================== */}
      {alert.message && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show position-fixed`}
          style={{ top: "20px", right: "20px", zIndex: 2000 }}
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

      {/* =====================
          MODAL PROFIL
      ===================== */}
      {showModal && (
  <div
    className="modal show fade d-block"
    tabIndex="-1"
    style={{ background: "rgba(0,0,0,.5)" }}
  >
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="bi bi-person-circle me-2"></i>
            Modifier mon profil
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowModal(false)}
          ></button>
        </div>

        <div className="modal-body">
          {/* Infos entreprise */}
          <div className="mb-2">
            <label className="form-label">
              <i className="bi bi-building me-1"></i> Nom de l’entreprise
            </label>
            <input
              className="form-control"
              value={form.companyName}
              onChange={(e) =>
                setForm((f) => ({ ...f, companyName: e.target.value }))
              }
            />
          </div>

          <div className="mb-2">
            <label className="form-label">
              <i className="bi bi-envelope-at me-1"></i> Email
            </label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>

          <div className="mb-2">
            <label className="form-label">
              <i className="bi bi-telephone me-1"></i> Téléphone fixe
            </label>
            <input
              className="form-control"
              value={form.phone_fixed}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone_fixed: e.target.value }))
              }
            />
          </div>

          <div className="mb-2">
            <label className="form-label">
              <i className="bi bi-phone me-1"></i> Téléphone mobile
            </label>
            <input
              className="form-control"
              value={form.phone_mobile}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone_mobile: e.target.value }))
              }
            />
          </div>

          <div className="mb-2">
            <label className="form-label">
              <i className="bi bi-geo-alt me-1"></i> Adresse
            </label>
            <input
              className="form-control"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </div>

          <hr />
          {/* Changement de mot de passe */}
          <h6>
            <i className="bi bi-key me-2"></i>
            Changer mon mot de passe
          </h6>

          <div className="mb-2">
            <label className="form-label">
              <i className="bi bi-lock me-1"></i> Nouveau mot de passe
            </label>
            <input
              type="password"
              className="form-control"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, newPassword: e.target.value }))
              }
            />
          </div>

          <div className="mb-2">
            <label className="form-label">
              <i className="bi bi-lock-fill me-1"></i> Confirmer mot de passe
            </label>
            <input
              type="password"
              className="form-control"
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords((p) => ({
                  ...p,
                  confirmPassword: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowModal(false)}
          >
            <i className="bi bi-x-circle me-1"></i> Annuler
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <i className="bi bi-save me-1"></i> Enregistrer
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </>
  );
}
