import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#33AA99"];

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const data = await getAllOrders();
      setOrders(data);
      setLoading(false);
    }
    fetchOrders();
  }, []);

  if (loading) return <div>Chargement des statistiques...</div>;

  // Statistiques globales
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const uniquePatients = [...new Set(orders.map((o) => o.patient_name))].length;

  // Répartition par statut
  const statusData = Object.entries(
    orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, value]) => ({ name: status, value }));

  // Répartition par type de travail
  const workTypeData = Object.entries(
    orders.reduce((acc, o) => {
      const type = o.work_type || "Autre";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, value]) => ({ type, value }));

  return (
    <div style={{ padding: 20 }}>
      <h1>Tableau de bord Admin</h1>

      {/* Cartes statistiques */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div style={{ flex: 1, padding: 20, border: "1px solid #ccc", borderRadius: 10 }}>
          <h2>Total commandes</h2>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{totalOrders}</p>
        </div>
        <div style={{ flex: 1, padding: 20, border: "1px solid #ccc", borderRadius: 10 }}>
          <h2>Total encaissé</h2>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{totalRevenue.toFixed(2)} €</p>
        </div>
        <div style={{ flex: 1, padding: 20, border: "1px solid #ccc", borderRadius: 10 }}>
          <h2>Patients uniques</h2>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{uniquePatients}</p>
        </div>
      </div>

      {/* Graphiques */}
      <div style={{ display: "flex", gap: "50px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300, height: 300 }}>
          <h3>Répartition par statut</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={100} fill="#8884d8" label>
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
    </div>
  );
}
