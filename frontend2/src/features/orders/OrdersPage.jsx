import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import OrderForm from "./OrderForm";
import OrderTable from "./OrderTable";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // ✅ Import des icônes Bootstrap

export default function OrdersPage() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const onToggleLines = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Récupération des commandes
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Erreur lors du chargement des commandes");
      return res.json();
    },
    onError: () => {
      setAlert({ type: "danger", message: "Impossible de charger les commandes" });
    },
  });

  // Récupération des clients
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Erreur lors du chargement des clients");
      return res.json();
    },
  });

  // Suppression commande
  const delMut = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression commande");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setAlert({ type: "warning", message: "Commande supprimée avec succès" });
    },
    onError: () => {
      setAlert({ type: "danger", message: "Impossible de supprimer la commande" });
    },
  });

  // ✅ Associer icône à chaque type d’alerte
  const alertIcon = {
    success: "bi-check-circle-fill",
    danger: "bi-x-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };

  return (
    <div className="container py-4">
      {/* ✅ En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">
          <i className="bi bi-box-seam me-2"></i> Gestion des Commandes
        </h2>
      </div>

      {/* ✅ Alerte dynamique avec icône + animation */}
      {alert.message && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show animate__animated animate__fadeInDown`}
          role="alert"
          style={{ animationDuration: "0.5s" }}
        >
          <i className={`bi ${alertIcon[alert.type]} me-2`}></i>
          {alert.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert({ type: "", message: "" })}
          ></button>
        </div>
      )}

      {/* ✅ Formulaire création commande */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          
          <OrderForm
            clients={clients || []}
            onCreated={() => {
              qc.invalidateQueries({ queryKey: ["orders"] });
              setAlert({ type: "success", message: "Commande créée avec succès" });
            }}
            onError={() => {
              setAlert({ type: "danger", message: "Erreur lors de la création" });
            }}
          />
        </div>
      </div>

      {/* ✅ Tableau des commandes */}
      
    </div>
  );
}
