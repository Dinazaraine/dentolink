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
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { fetchOrders } from "./adminAPI";
import "bootstrap/dist/css/bootstrap.min.css";

const COLORS = ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1", "#20c997"];

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const data = await fetchOrders();
      setOrders(data);
      setLoading(false);
    }
    loadOrders();
  }, []);

  if (loading) return <div className="text-center py-5">⏳ Chargement des statistiques...</div>;

  // 📊 Statistiques globales
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const uniquePatients = [...new Set(orders.map((o) => o.patient_name))].length;

  // 📊 Répartition par statut
  const statusData = Object.entries(
    orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, value]) => ({ name: status, value }));

  // 📊 Répartition par type de travail
  const workTypeData = Object.entries(
    orders.reduce((acc, o) => {
      const type = o.work_type || "Autre";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, value]) => ({ type, value }));

  // 📊 Évolution des commandes (par date)
  const ordersByDate = Object.entries(
    orders.reduce((acc, o) => {
      const date = new Date(o.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {})
  ).map(([date, value]) => ({ date, value }));

  // 📊 Revenus par mois
  const revenueByMonth = Object.entries(
    orders.reduce((acc, o) => {
      const month = new Date(o.created_at).toLocaleString("fr-FR", { month: "short", year: "numeric" });
      acc[month] = (acc[month] || 0) + parseFloat(o.total || 0);
      return acc;
    }, {})
  ).map(([month, value]) => ({ month, value }));

  return (
    <div className="container py-4">
      <h1 className="mb-4 text-primary fw-bold">📊 Tableau de bord Admin</h1>

      {/* ✅ Cartes statistiques */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card text-center shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title text-secondary">Total commandes</h5>
              <p className="display-6 fw-bold text-primary">{totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title text-secondary">Total encaissé</h5>
              <p className="display-6 fw-bold text-success">{totalRevenue.toFixed(2)} €</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title text-secondary">Patients uniques</h5>
              <p className="display-6 fw-bold text-warning">{uniquePatients}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Graphiques */}
      <div className="row g-4">
        {/* Répartition par statut */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title">Répartition par statut</h5>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Commandes par type de travail */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title">Commandes par type de travail</h5>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={workTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value">
                    {workTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Évolution des commandes */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title">Évolution des commandes</h5>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ordersByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#0d6efd" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Revenus par mois */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="card-title">Revenus par mois</h5>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="value" stroke="#198754" fill="#198754" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
