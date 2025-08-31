import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { FaHome, FaCogs, FaTruck, FaUsers, FaGem, FaFolder } from "react-icons/fa";

export default function AppLayout() {
  const { user, token, logout } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();

  function handleLogout() {
    qc.clear();
    logout();
    nav("/login", { replace: true });
  }

  const linkClass = ({ isActive }) =>
    "toplink px-3 py-2 rounded-md font-medium transition-colors " +
    (isActive ? "bg-purple-600 text-white" : "text-gray-700 hover:bg-gray-100");

  const isAdmin = token && user?.role === "admin";
  const isDentist = token && user?.role === "dentiste";

  return (
    <div className="app-shell" style={{ display: "flex", flexDirection: "column", minHeight: "60px" }}>
      <header
        className="topbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
          borderBottom: "1px solid #e5e7eb",
          height: "60px",
          backgroundColor: "#fff"
        }}
      >
        {/* Logo / Titre */}
        <div
          className="logo"
          style={{
            fontWeight: "bold",
            fontSize: "1.25rem",
            color: "#7c5cff",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <FaGem />
          DENTOLINK
        </div>

        {/* Liens de navigation */}
        <nav className="left" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {/* User classique */}
          {!isAdmin && !isDentist && token && (
            <>
              <NavLink to="/" className={linkClass} end style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaHome />
                Accueil
              </NavLink>
              <NavLink to="/products" className={linkClass} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaCogs />
                Produits
              </NavLink>
              <NavLink to="/orders" className={linkClass} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaTruck />
                Commandes
              </NavLink>
              <NavLink to="/clients" className={linkClass} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaUsers />
                Clients
              </NavLink>
            </>
          )}

          {/* Admin menu */}
          {isAdmin && (
            <>
              <NavLink to="/admin" className={linkClass} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaUsers />
                Dashboard
              </NavLink>
              <NavLink to="/admin/orders" className={linkClass} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaTruck />
                Commandes Admin
              </NavLink>
              <NavLink to="/admin/files" className={linkClass} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaFolder />
                Fichiers
              </NavLink>
            </>
          )}

          {/* Dentiste menu */}
          {isDentist && (
            <>
              <NavLink to="/dentiste" className={linkClass} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaUsers />
                Dashboard
              </NavLink>
              <NavLink to="/dentiste/orders" className={linkClass} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaTruck />
                Commandes Dentiste
              </NavLink>
              <NavLink to="/dentiste/orders/:id/upload" className={linkClass} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaFolder />
                Upload Fichiers
              </NavLink>
            </>
          )}
        </nav>

        {/* Zone utilisateur / connexion */}
        <div className="right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {token ? (
            <>
              {user && (
                <span
                  className="user-pill"
                  style={{ padding: "6px 12px", borderRadius: "12px", backgroundColor: "#f3f4f6", fontWeight: "500" }}
                >
                  {user.firstName} {user.lastName}
                </span>
              )}
              <button
                onClick={handleLogout}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                  transition: "0.2s"
                }}
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "#1f2937"
                }}
              >
                Connexion
              </NavLink>
              <NavLink
                to="/register"
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background: "#7c5cff",
                  color: "#fff",
                  cursor: "pointer",
                  textDecoration: "none"
                }}
              >
                Inscription
              </NavLink>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
