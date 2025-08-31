import { useEffect, useState } from "react";
import { fetchOrders, updateOrderStatus, deleteOrder } from "./adminAPI";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const role = localStorage.getItem("role"); // Assurez-vous que le rôle est stocké

  const STATUS_TRANSITIONS = {
    user: { panier:["en_attente"], en_attente:[], chez_dentiste:[], envoye_admin:[], valide_admin:[], terminee:[], annulee:[], paye:[], rembourse:[] },
    dentiste: { en_attente:["chez_dentiste"], chez_dentiste:["envoye_admin"], envoye_admin:[], valide_admin:[], terminee:[], panier:[], annulee:[], paye:[], rembourse:[] },
    admin: { en_attente:["chez_dentiste","annulee"], chez_dentiste:["envoye_admin","annulee"], envoye_admin:["valide_admin","annulee"], valide_admin:["terminee","annulee"], terminee:[], panier:["en_attente","annulee"], annulee:[], paye:["terminee"], rembourse:[] }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      
      setOrders(data);
    } catch (err) {
      console.error("Erreur chargement commandes:", err);
    }
    setLoading(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );
    } catch (err) {
      console.error(`Erreur mise à jour commande ${orderId}:`, err);
      alert(err.response?.data?.error || "Erreur mise à jour");
    }
    setUpdatingId(null);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) return <div>Chargement des commandes...</div>;
  if (!orders.length) return <div>Aucune commande trouvée.</div>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead style={{ backgroundColor: "#E5E7EB", textAlign: "left" }}>
        <tr>
          <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>ID</th>
          <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Patient</th>
          <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Statut</th>
          <th style={{ padding: 8, border: "1px solid #D1D5DB" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          const nextStatuses =  ["terminee"];
          return (
            <tr key={order.id} style={{ border: "1px solid #D1D5DB" }}>
              <td style={{ padding: 8 }}>{order.id}</td>
              <td style={{ padding: 8 }}>{order.patient_name || "-"}</td>
              <td style={{ padding: 8 }}>{order.orderStatus}</td>
              <td style={{ padding: 8 }}>
                {nextStatuses.map((s) => (    
                  <button
                    key={s}
                    disabled={updatingId === order.id}
                    onClick={() => handleStatusChange(order.id, s)}
                    style={{ marginRight: 5 }}
                  >
                    {s}
                  </button>
                ))}
                {role === "admin" && (
                  <button
                    disabled={updatingId === order.id}
                    onClick={() => deleteOrder(order.id).then(loadOrders)}
                    style={{ color: "red" }}
                  >
                    Supprimer
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
