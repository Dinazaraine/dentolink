import { useState, useEffect } from "react";
import { getOrdersForDentist, getOrderFiles } from "./dentisteAPI";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function DentistOrderOverview() {
  const [orders, setOrders] = useState([]);
  const [filesMap, setFilesMap] = useState({}); // { orderId: [fichiers] }
  const [clientIdsMap, setClientIdsMap] = useState({}); // { orderId: [ids clients] }

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getOrdersForDentist();
      setOrders(Array.isArray(data) ? data : []);

      // Pour chaque commande, récupérer les fichiers et les IDs clients
      const filesPromises = data.map(async (order) => {
        const files = await getOrderFiles(order.id);
        const preparedFiles = (Array.isArray(files) ? files : []).map(f => ({
          ...f,
          fullUrl: f.url?.startsWith("/uploads") ? `${API_BASE_URL}${f.url}` : f.url
        }));
        const clientIds = [...new Set(preparedFiles.map(f => f.uploadedById).filter(Boolean))];
        return { orderId: order.id, files: preparedFiles, clientIds };
      });

      const results = await Promise.all(filesPromises);

      const filesObj = {};
      const clientIdsObj = {};
      results.forEach(r => {
        filesObj[r.orderId] = r.files;
        clientIdsObj[r.orderId] = r.clientIds;
      });

      setFilesMap(filesObj);
      setClientIdsMap(clientIdsObj);
    } catch (err) {
      console.error("Erreur fetchOrders:", err);
    }
  };

  const renderFilePreview = (file) => {
    const url = file.fullUrl || "";
    const ext = url.split(".").pop().toLowerCase();

    if (!url) return null;

    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      return <img key={file.id} src={url} alt={file.originalName || url} style={{ maxWidth: 120, maxHeight: 120, margin: 5, border: "1px solid #ccc", borderRadius: 6 }} />;
    } else if (ext === "pdf") {
      return <embed key={file.id} src={url} type="application/pdf" width={120} height={120} style={{ margin: 5, border: "1px solid #ccc", borderRadius: 6 }} />;
    } else {
      return <a key={file.id} href={url} target="_blank" rel="noopener noreferrer" style={{ margin: 5 }}>{file.originalName || url.split("/").pop()}</a>;
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <h2>Commandes Dentiste - Aperçu fichiers et clients</h2>

      {orders.map(order => (
        <div key={order.id} style={{ marginBottom: 20, padding: 12, border: "1px solid #ccc", borderRadius: 6 }}>
          <h3>Commande #{order.id}</h3>
          <p><strong>Statut :</strong> {order.status || "en_attente"}</p>
          <p><strong>Clients ayant uploadé :</strong> {clientIdsMap[order.id]?.join(", ") || "Aucun"}</p>

          {filesMap[order.id]?.length > 0 && (
            <div>
              <strong>Fichiers uploadés :</strong>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {filesMap[order.id].map(f => renderFilePreview(f))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
