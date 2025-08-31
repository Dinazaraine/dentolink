import { useState, useEffect } from "react";
import {
  getOrdersForDentist,
  updateOrderStatus,
  uploadDentistFiles,
  getOrderFiles
} from "./dentisteAPI";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [localFiles, setLocalFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getOrdersForDentist();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur fetchOrders:", err);
    }
  };

  const handleSelect = async (order) => {
    setSelectedOrder(order);
    try {
      const files = await getOrderFiles(order.id);
      const preparedFiles = (files || []).map(f => ({
        ...f,
        fullUrl: f.url?.startsWith("/uploads") ? `${API_BASE_URL}${f.url}` : f.url,
      }));
      setUploadedFiles(preparedFiles);
      setLocalFiles([]);
    } catch (err) {
      console.error("Erreur getOrderFiles:", err);
      setUploadedFiles([]);
    }
  };

  const handleFileChange = (e) => {
    setLocalFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!selectedOrder || localFiles.length === 0) return;
    setUpdatingId(selectedOrder.id);
    try {
      const updatedOrder = await uploadDentistFiles(selectedOrder.id, localFiles);
      const preparedFiles = (updatedOrder.files || []).map(f => ({
        ...f,
        fullUrl: f.url?.startsWith("/uploads") ? `${API_BASE_URL}${f.url}` : f.url,
      }));
      setUploadedFiles(preparedFiles);
      setLocalFiles([]);

      // Mettre à jour le statut automatiquement après upload
      const statusUpdated = await updateOrderStatus(selectedOrder.id, "envoye_admin");
      setSelectedOrder(statusUpdated);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? statusUpdated : o));
    } catch (err) {
      console.error("Erreur uploadDentistFiles:", err);
    }
    setUpdatingId(null);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      console.error("Erreur updateOrderStatus:", err);
      alert(err.response?.data?.error || "Erreur mise à jour");
    }
    setUpdatingId(null);
  };

  const renderFilePreview = (file) => {
    const url = file.fullUrl || "";
    const ext = url.split(".").pop().toLowerCase();
    if (!url) return null;

    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      return <img key={file.id} src={url} alt={file.originalName || url} style={{ maxWidth: 150, maxHeight: 150, margin: 5, border: "1px solid #ccc", borderRadius: 6 }} />;
    } else if (ext === "pdf") {
      return <embed key={file.id} src={url} type="application/pdf" width={150} height={150} style={{ margin: 5, border: "1px solid #ccc", borderRadius: 6 }} />;
    } else {
      return <a key={file.id} href={url} target="_blank" rel="noopener noreferrer" style={{ margin: 5, display: "inline-block" }}>{file.originalName || url.split("/").pop()}</a>;
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <h2 style={{ marginBottom: 12, color: "#4B5563" }}>Commandes Dentiste</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#E5E7EB", textAlign: "left" }}>
            <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>ID</th>
            <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Patient</th>
            <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Sexe</th>
            <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Âge</th>
            <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Travail</th>
            <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Sub-type</th>
            <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Status</th>
            <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Total</th>
            <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
              <td style={{ padding: 8 }}>{order.id}</td>
              <td style={{ padding: 8 }}>Client masqué</td>
              <td style={{ padding: 8 }}>{order.patient_sex || "N/A"}</td>
              <td style={{ padding: 8 }}>{order.patient_age || "N/A"}</td>
              <td style={{ padding: 8 }}>{order.work_type || "N/A"}</td>
              <td style={{ padding: 8 }}>{order.sub_type || "N/A"}</td>
              <td style={{ padding: 8, textTransform: "capitalize" }}>{order.status || "en_attente"}</td>
              <td style={{ padding: 8 }}>{order.total ? `${order.total} €` : "N/A"}</td>
              <td style={{ padding: 8, display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleSelect(order)}
                  disabled={updatingId === order.id}
                  style={{ padding: "6px 10px", borderRadius: 6, border: "none", backgroundColor: "#7C3AED", color: "#fff", cursor: "pointer" }}
                >
                  Voir
                </button>

                {/* Boutons de transition de statut comme dans AdminOrdersPage */}
                {["envoye_admin"].map(s => (
                  <button
                    key={s}
                    disabled={updatingId === order.id || order.status === s}
                    onClick={() => handleStatusChange(order.id, s)}
                    style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
                  >
                    {s}
                  </button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <div style={{ marginTop: 20 }}>
          <h3>Détails commande #{selectedOrder.id}</h3>

          <div>
            <strong>Fichiers uploadés :</strong>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {(Array.isArray(uploadedFiles) ? uploadedFiles : []).map(f => (
                <div key={f.id}>{renderFilePreview(f)}</div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <input type="file" multiple onChange={handleFileChange} />
            <button
              onClick={handleUpload}
              disabled={localFiles.length === 0 || updatingId === selectedOrder.id}
              style={{ padding: "6px 12px", borderRadius: 6, border: "none", backgroundColor: "#10B981", color: "#fff", cursor: "pointer" }}
            >
              Envoyer à l'admin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
