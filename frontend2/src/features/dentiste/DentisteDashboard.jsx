import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts";
import { getOrdersForDentist, updateOrderStatus, uploadDentistFiles } from "./dentisteAPI";
import "bootstrap/dist/css/bootstrap.min.css";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#33AA99"];

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

  if (loading) return <div className="text-center my-5">⏳ Chargement du tableau de bord...</div>;

  // ✅ Stats rapides
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "en_attente").length;
  const completedOrders = orders.filter(o => o.status === "paye").length;
  const filesToUpload = orders.filter(o => !o.file_paths || o.file_paths === "[]").length;

  // ✅ Data Recharts
  const statusData = [
    { name: "En attente", value: pendingOrders },
    { name: "Terminées", value: completedOrders },
    { name: "Autres", value: totalOrders - pendingOrders - completedOrders },
  ];

  const workTypeData = Object.entries(
    orders.reduce((acc, o) => {
      const type = o.work_type || "Autre";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, value]) => ({ type, value }));

  const subTypeData = Object.entries(
    orders.reduce((acc, o) => {
      const sub = o.sub_type || "Autre";
      acc[sub] = (acc[sub] || 0) + 1;
      return acc;
    }, {})
  ).map(([sub, value]) => ({ sub, value }));

  const ordersByDate = Object.entries(
    orders.reduce((acc, o) => {
      const date = new Date(o.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {})
  ).map(([date, value]) => ({ date, value }));

  return (
    <div className="container py-4">
      <h1 className="mb-4 text-primary fw-bold">📊 Tableau de bord Dentiste</h1>

      {/* ✅ Statistiques */}
      <div className="row g-3 mb-4">
        <StatCard title="Total commandes" value={totalOrders} color="primary" />
        <StatCard title="En attente" value={pendingOrders} color="warning" />
        <StatCard title="Fichiers à uploader" value={filesToUpload} color="danger" />
      </div>

      {/* ✅ Graphiques */}
      <div className="row g-4">
        <ChartCard title="Répartition par statut">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={100} label>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Commandes par type de travail">
          <ResponsiveContainer>
            <BarChart data={workTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value">
                {workTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Évolution des commandes">
          <ResponsiveContainer>
            <LineChart data={ordersByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#0d6efd" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Répartition par sous-type">
          <ResponsiveContainer>
            <RadarChart data={subTypeData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="sub" />
              <PolarRadiusAxis />
              <Radar name="Sous-type" dataKey="value" stroke="#198754" fill="#198754" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ✅ Dernières commandes */}
      <div className="mt-5">
        <h3 className="mb-3">📝 Dernières commandes</h3>
        <div className="list-group">
          {orders.slice(0, 5).map(order => (
            <button
              key={order.id}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              onClick={() => setSelectedOrder(order)}
            >
              <span>
                <strong>Commande #{order.id}</strong> – {order.patient_name || "N/A"}
              </span>
              <span className={`badge ${order.status === "paye" ? "bg-success" : "bg-warning text-dark"}`}>
                {order.status}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
    
  );
}

/** ✅ Composant pour les statistiques */
function StatCard({ title, value, color }) {
  return (
    <div className="col-md-4">
      <div className={`card border-${color} shadow-sm h-100`}>
        <div className="card-body text-center">
          <h6 className="text-muted">{title}</h6>
          <p className={`display-6 text-${color} fw-bold`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

/** ✅ Composant pour les graphiques */
function ChartCard({ title, children }) {
  return (
    <div className="col-md-6" style={{ height: 350 }}>
      <div className="card h-100 shadow-sm">
        <div className="card-header bg-light fw-bold">{title}</div>
        <div className="card-body">
          {children}
        </div>
      </div>
    </div>
  );
}
