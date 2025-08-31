import { useEffect, useState } from "react";
import { getOrdersForDentist, updateOrderStatus, uploadDentistFiles } from "./dentisteAPI";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function DentisteDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const data = await getOrdersForDentist();
      setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, status) => {
    await updateOrderStatus(orderId, status);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const handleFileUpload = async (orderId, files) => {
    await uploadDentistFiles(orderId, files);
    // rafraîchir les fichiers si nécessaire
  };

  if (loading) return <div>Chargement du tableau de bord...</div>;

  // Statistiques rapides
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "en_attente").length;
  const completedOrders = orders.filter(o => o.status === "paye").length;
  const filesToUpload = orders.filter(o => !o.file_paths || o.file_paths === "[]").length;

  // Données graphiques
  const statusData = [
    { name: "En attente", value: pendingOrders },
    { name: "Terminées", value: completedOrders },
    { name: "Autres", value: totalOrders - pendingOrders - completedOrders }
  ];

  const workTypeData = Object.entries(
    orders.reduce((acc, o) => {
      const type = o.work_type || "Autre";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, value]) => ({ type, value }));

  return (
    <div style={{ padding: 20 }}>
      <h1>Tableau de bord Dentiste</h1>

      {/* Cartes statistiques */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div style={{ flex: 1, padding: 20, border: "1px solid #ccc", borderRadius: 10, background: "#f0f8ff" }}>
          <h2>Total commandes</h2>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{totalOrders}</p>
        </div>
        <div style={{ flex: 1, padding: 20, border: "1px solid #ccc", borderRadius: 10, background: "#fef9f0" }}>
          <h2>En attente</h2>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{pendingOrders}</p>
        </div>
        <div style={{ flex: 1, padding: 20, border: "1px solid #ccc", borderRadius: 10, background: "#f0fff4" }}>
          <h2>Fichiers à uploader</h2>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{filesToUpload}</p>
        </div>
      </div>

      {/* Graphiques */}
      <div style={{ display: "flex", gap: "50px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300, height: 300 }}>
          <h3>Répartition par statut</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={100} label>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, minWidth: 500, height: 300 }}>
          <h3>Commandes par type de travail</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d">
                {workTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5 dernières commandes */}
      <div style={{ marginTop: 30 }}>
        <h3>Dernières commandes</h3>
        {orders.slice(0, 5).map(order => (
          <div key={order.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10, borderRadius: 8, background: "#fafafa", cursor: "pointer" }}
               onClick={() => setSelectedOrder(order)}>
            <strong>Commande #{order.id}</strong> - {order.patient_name || "Non renseigné"} - {order.status}
          </div>
        ))}
      </div>

      {/* Détail de la commande sélectionnée */}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onStatusChange={handleStatusChange}
          onFileUpload={handleFileUpload}
        />
      )}
    </div>
  );
}
