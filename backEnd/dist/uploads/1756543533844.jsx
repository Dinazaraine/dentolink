import { useState } from "react";
import { fetchOrders, updateOrderStatus } from "../orders/api";

export default function ClientTable({ data = [], isDentist = false, me }) {
  const [clientsData, setClientsData] = useState(data);
  const [loadingIds, setLoadingIds] = useState([]);

  if (!data.length) return <div style={{ padding: 12 }}>Aucun client.</div>;

  const th = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #e5e7eb" };
  const td = { padding: "8px 10px", borderBottom: "1px solid #f3f4f6" };

  const handleStatusChange = async (orderId, currentStatus) => {
    let nextStatus;
    switch (currentStatus) {
      case "en_attente":
        nextStatus = "chez_dentiste";
        break;
      case "chez_dentiste":
        nextStatus = "envoye_admin";
        break;
      case "envoye_admin":
        nextStatus = "valide_admin";
        break;
      case "valide_admin":
        nextStatus = "terminee";
        break;
      default:
        return;
    }

    try {
      setLoadingIds((prev) => [...prev, orderId]);
      await updateOrderStatus(orderId, nextStatus);
      const updatedClients = await fetchOrders({ userId: me.id, role: me.role });
      setClientsData(updatedClients);
    } catch (err) {
      console.error("Erreur mise à jour statut :", err);
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: isDentist ? "2px solid #2563eb" : "1px solid #e5e7eb",
        borderRadius: 12,
        overflowX: "auto",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>{isDentist ? "Client" : "Nom complet"}</th>
            <th style={th}>Sexe</th>
            <th style={th}>Date de naissance</th>
            <th style={th}>Statut commande</th>
            {isDentist && <th style={th}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {clientsData.map((c) => {
            const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim();
            const order = c.currentOrder || {};
            const isLoading = loadingIds.includes(order.id);

            return (
              <tr key={c.id}>
                <td style={td}>#{c.id}</td>
                <td style={td} title={isDentist ? "ID client réel masqué" : fullName}>
                  {isDentist ? `Client #${c.id}` : fullName || "-"}
                </td>
                <td style={td}>{c.sexe || "-"}</td>
                <td style={td}>{c.birthDate || "-"}</td>
                <td style={td}>{order.status || "-"}</td>
                {isDentist && (
                  <td style={td}>
                    {["en_attente", "chez_dentiste"].includes(order.status) && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleStatusChange(order.id, order.status)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "none",
                          background: order.status === "en_attente" ? "#2563eb" : "#16a34a",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        {order.status === "en_attente" ? "Prendre en charge" : "Envoyer à l'admin"}
                      </button>
                    )}
                    {!["en_attente", "chez_dentiste"].includes(order.status) && "-"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
