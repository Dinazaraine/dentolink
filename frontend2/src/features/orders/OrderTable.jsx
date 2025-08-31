import React, { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { createCheckoutSession } from "./api";

// ⚠️ Clé publique Stripe (mets-la aussi dans VITE_STRIPE_PUBLISHABLE_KEY si tu veux)
const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51RvLaoCvQPh2OtHrXvlcEMjxbC0kCXLAuhYkpe78oCjg4RJ6NVncoFL0dUFvfOFoNAsVLcncaSag55Ivv3Wjr9KB00QcLjIWA2";

export default function OrderTable({ data, onToggleLines, expandedId, onDelete }) {
  const stripePromise = useMemo(() => loadStripe(STRIPE_PUBLISHABLE_KEY), []);

  // 🔹 Création et redirection vers une session Stripe fraîche
  const handlePay = async (orderId) => {
    try {
      // 1️⃣ Crée une session côté backend
      const { id: sessionId, url } = await createCheckoutSession(orderId);

      // 2️⃣ Si l'URL de Checkout est fournie par l'API, redirige directement (plus rapide)
      if (url) {
        window.location.assign(url);
        return;
      }

      // 3️⃣ Sinon, utilise redirectToCheckout avec sessionId
      if (!sessionId) throw new Error("Session Stripe introuvable.");
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe n'a pas pu être initialisé.");

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (err) {
      console.error("Erreur paiement:", err);
      alert(
        err.message ||
          "Quelque chose s'est mal passé. Veuillez réessayer avec une nouvelle session."
      );
    }
  };

  return (
    <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "#bf2727bd", textAlign: "left" }}>
          <th>ID</th>
          <th>Patient</th>
          <th>Sexe</th>
          <th>Âge</th>
          <th>Work-type</th>
          <th>Sub-type</th>
          <th>Status</th>
          <th>Dents</th>
          <th style={{ width: 260 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data?.length ? (
          data.map((o) => (
            <React.Fragment key={o.id}>
              <tr style={{ borderTop: "1px solid #eee" }}>
                <td>{o.id}</td>
                <td>{o.patient_name}</td>
                <td>{o.patient_sex}</td>
                <td>{o.patient_age}</td>
                <td>{o.work_type || "-"}</td>
                <td>{o.sub_type || "-"}</td>
                <td>{o.status || "panier"}</td>
                <td>
                  Upper: {Array.isArray(o.upper_teeth) ? o.upper_teeth.join(", ") : "-"}
                  <br />
                  Lower: {Array.isArray(o.lower_teeth) ? o.lower_teeth.join(", ") : "-"}
                </td>
                <td style={{ display: "flex", gap: 8 }}>
                  {onToggleLines && (
                    <button
                      onClick={() => onToggleLines(o.id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #111",
                        background: "#fff",
                      }}
                    >
                      {expandedId === o.id ? "Masquer détails" : "Voir détails"}
                    </button>
                  )}

                  <button
                    onClick={() => handlePay(o.id)}
                    disabled={o.status === "paye"}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #007",
                      background: o.status === "paye" ? "#ccc" : "#007",
                      color: "#fff",
                      cursor: o.status === "paye" ? "not-allowed" : "pointer",
                    }}
                  >
                    {o.status === "paye" ? "Payé" : "Payer"}
                  </button>

                  {onDelete && (
                    <button
                      onClick={() => onDelete(o.id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #a00",
                        background: "#a00",
                        color: "#fff",
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>

              {expandedId === o.id && (
                <tr>
                  <td colSpan={9} style={{ background: "#f9f9f9", padding: "10px" }}>
                    <div style={{ display: "grid", gap: "6px" }}>
                      <strong>Détails de la commande :</strong>
                      <div>
                        <b>Patient:</b> {o.patient_name}
                      </div>
                      <div>
                        <b>Sexe:</b> {o.patient_sex}
                      </div>
                      <div>
                        <b>Âge:</b> {o.patient_age}
                      </div>
                      <div>
                        <b>Work-type:</b> {o.work_type || "-"}
                      </div>
                      <div>
                        <b>Sub-type:</b> {o.sub_type || "-"}
                      </div>
                      <div>
                        <b>Status:</b> {o.status || "panier"}
                      </div>
                      <div>
                        <b>Total:</b> {o.total} €
                      </div>
                      <div>
                        <b>Dents supérieures:</b>{" "}
                        {Array.isArray(o.upper_teeth) ? o.upper_teeth.join(", ") : "-"}
                      </div>
                      <div>
                        <b>Dents inférieures:</b>{" "}
                        {Array.isArray(o.lower_teeth) ? o.lower_teeth.join(", ") : "-"}
                      </div>
                      <div>
                        <b>Date:</b>{" "}
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))
        ) : (
          <tr>
            <td colSpan={9}>Aucune commande.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
