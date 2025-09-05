import { Outlet } from "react-router-dom";   // 👈 Ajoute ça
import NavBar from "./NavBar";

export default function AppLayout() {
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar (NavBar.jsx transformé en sidebar rétractable) */}
      <NavBar />

      {/* Contenu principal */}
      <div className="flex-grow-1 p-4" style={{ background: "#f8f9fa" }}>
        <Outlet />   {/* ✅ maintenant défini */}
      </div>
    </div>
  );
}
