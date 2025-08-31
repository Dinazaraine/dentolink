import { useState } from "react";
import OrderFileUpload from "./OrderFileUpload";

export default function OrderDetail({ order, onStatusChange, onFileUpload }) {
  const renderFilePreview = (file) => {
    const ext = file.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      return <img src={file} alt={file} style={{ maxWidth: 150, maxHeight: 150, margin: 5, border: "1px solid #ccc", borderRadius: 6 }} />;
    } else if (ext === "pdf") {
      return <embed src={file} type="application/pdf" width={150} height={150} style={{ margin: 5, border: "1px solid #ccc", borderRadius: 6 }} />;
    } else {
      return <a href={file} target="_blank" rel="noreferrer" style={{ margin: 5, display: "inline-block" }}>{file.split("/").pop()}</a>;
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 12, marginTop: 20, borderRadius: 8, backgroundColor: "#F9FAFB" }}>
      <h3>Détails Commande #{order.id}</h3>

      <div style={{ lineHeight: 1.6 }}>
        <p><strong>Patient:</strong> {order.patient_name || "Non renseigné"}</p>
        <p><strong>Sexe:</strong> {order.sex || "Non renseigné"}</p>
        <p><strong>Âge:</strong> {order.age || "N/A"}</p>
        <p><strong>Work-type:</strong> {order.typeOfWork || "N/A"}</p>
        <p><strong>Sub-type:</strong> {order.subType || "N/A"}</p>
        <p><strong>Status:</strong> {order.status || "en_attente"}</p>
        <p><strong>Total:</strong> {order.total ? `${order.total} €` : "N/A"}</p>
        <p><strong>Dents supérieures:</strong> {order.upperTeeth || "N/A"}</p>
        <p><strong>Dents inférieures:</strong> {order.lowerTeeth || "N/A"}</p>
        <p><strong>Date:</strong> {order.date || "N/A"}</p>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>Envoyer vos fichiers</h4>
        <OrderFileUpload orderId={order.id} onFileUpload={onFileUpload} />
      </div>

      {order.file_paths?.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h4>Fichiers du client</h4>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {order.file_paths.map((f, i) => (
              <div key={i}>{renderFilePreview(f)}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <h4>Changer le statut</h4>
        {["en_attente", "chez_dentiste", "envoye_admin"].map(status => (
          <button
            key={status}
            onClick={() => onStatusChange(order.id, status)}
            style={{
              marginRight: 8,
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#7C3AED",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
