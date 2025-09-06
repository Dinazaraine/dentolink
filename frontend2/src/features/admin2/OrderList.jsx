import { useState, useEffect } from "react";
import {
  fetchOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderFiles,
} from "./adminAPI";
import FileActions from "./FileActions";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_ORIGIN = (() => {
  try {
    const u = new URL(API_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return window.location.origin;
  }
})();

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ORDERS_PER_PAGE = 5;

  useEffect(() => {
    fetchOrders2();
  }, []);

  const fetchOrders2 = async () => {
    try {
      const data = await fetchOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur fetchOrders:", err);
    }
  };

  const handleSelect = async (order) => {
    if (selectedOrder?.id === order.id) {
      setSelectedOrder(null);
      return;
    }
    setSelectedOrder(order);
    try {
      const files = await getOrderFiles(order.id);
      const prepared = (files || []).map((f) => ({
        ...f,
        fullUrl: f?.url?.startsWith("/uploads")
          ? `${API_ORIGIN}${f.url}`
          : f.url,
      }));
      setUploadedFiles(prepared);
    } catch (err) {
      console.error("Erreur getOrderFiles:", err);
      setUploadedFiles([]);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } catch (err) {
      console.error("Erreur updateOrderStatus:", err);
      alert("Erreur mise à jour du statut");
    }
    setUpdatingId(null);
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Supprimer cette commande ?")) return;
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (err) {
      console.error("Erreur deleteOrder:", err);
    }
  };

  // ✅ Filtrage recherche
  const filteredOrders = orders.filter((o) => {
    const s = search.toLowerCase();
    return (
      o.id.toString().includes(s) ||
      (o.patient_name || "").toLowerCase().includes(s) ||
      (o.status || o.orderStatus || "").toLowerCase().includes(s) ||
      (o.paymentStatus || "").toLowerCase().includes(s)
    );
  });

  // ✅ Pagination
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const indexOfLast = currentPage * ORDERS_PER_PAGE;
  const indexOfFirst = indexOfLast - ORDERS_PER_PAGE;
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);

  // ✅ Couleurs par type de travail
  const colorMap = {
    Amovible: "#16A34A",
    Gouttières: "#FACC15",
    Conjointe: "#0EA5E9",
    Implant: "#9333EA",
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">
          <i className="bi bi-box-seam me-2"></i> Commandes (Admin)
        </h2>
        <input
          type="text"
          className="form-control w-50 shadow-sm"
          placeholder="🔍 Rechercher par ID, patient, type, statut..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <table className="table table-striped table-hover align-middle shadow-sm">
        <thead className="table-dark">
          <tr>
            <th><i className="bi bi-hash me-1"></i> ID</th>
            <th><i className="bi bi-person me-1"></i> Patient</th>
            <th><i className="bi bi-gender-ambiguous me-1"></i> Sexe</th>
            <th><i className="bi bi-person-badge me-1"></i> Âge</th>
            <th><i className="bi bi-tools me-1"></i> Travaux</th>
            <th><i className="bi bi-arrow-up-circle me-1"></i> Upper</th>
            <th><i className="bi bi-arrow-down-circle me-1"></i> Lower</th>
            <th><i className="bi bi-chat-left-text me-1"></i> Remarque</th>
            <th><i className="bi bi-flag me-1"></i> Statut</th>
            <th><i className="bi bi-cash-coin me-1"></i> Paiement</th>
            <th><i className="bi bi-currency-euro me-1"></i> Total</th>
            <th className="text-center"><i className="bi bi-gear me-1"></i> Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.map((order) => {
            const status = order.orderStatus || order.status || "en_attente";
            const payment = order.paymentStatus || "panier";
            return (
              <>
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.patient_name || "N/A"}</td>
                  <td>{order.patient_sex || "N/A"}</td>
                  <td>{order.patient_age || "N/A"}</td>

                  {/* ✅ Travaux */}
                  <td>
                    {Array.isArray(order.works) && order.works.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {order.works.map((w, i) => {
                          const bgColor = colorMap[w.work_type] || "#1E3A8A";
                          return (
                            <div
                              key={i}
                              className="p-2 rounded text-white fw-bold"
                              style={{ backgroundColor: bgColor }}
                            >
                              <i className="bi bi-tools me-1"></i>
                              {w.work_type} – {w.sub_type || "N/A"}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted">Aucun travail</span>
                    )}
                  </td>

                  {/* ✅ Upper */}
                  <td>
                    {Array.isArray(order.works) && order.works.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {order.works.map((w, i) =>
                          (w.upper_teeth || []).length > 0 ? (
                            w.upper_teeth.map((t, j) => (
                              <span
                                key={`${i}-u-${j}`}
                                className="badge text-white"
                                style={{
                                  backgroundColor:
                                    colorMap[w.work_type] || "#1E3A8A",
                                }}
                              >
                                <i className="bi bi-arrow-up-circle me-1"></i>
                                {t}
                              </span>
                            ))
                          ) : (
                            <span key={i} className="text-muted">—</span>
                          )
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* ✅ Lower */}
                  <td>
                    {Array.isArray(order.works) && order.works.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {order.works.map((w, i) =>
                          (w.lower_teeth || []).length > 0 ? (
                            w.lower_teeth.map((t, j) => (
                              <span
                                key={`${i}-l-${j}`}
                                className="badge text-white"
                                style={{
                                  backgroundColor:
                                    colorMap[w.work_type] || "#1E3A8A",
                                }}
                              >
                                <i className="bi bi-arrow-down-circle me-1"></i>
                                {t}
                              </span>
                            ))
                          ) : (
                            <span key={i} className="text-muted">—</span>
                          )
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* ✅ Remarque */}
                  <td>{order.remark || "—"}</td>

                  {/* ✅ Statut commande */}
                  <td>
                    <span
                      className={`badge ${
                        status === "terminee"
                          ? "bg-success"
                          : status === "en_attente"
                          ? "bg-warning text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {status}
                    </span>
                  </td>

                  {/* ✅ Statut paiement */}
                  <td>
                    <span
                      className={`badge ${
                        payment === "paye"
                          ? "bg-success"
                          : payment === "rembourse"
                          ? "bg-info text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {payment}
                    </span>
                  </td>

                  <td>{order.total ? `${order.total} €` : "N/A"}</td>

                  <td className="text-center">
                    <div className="btn-group">
                      <button
                        className={`btn btn-sm ${
                          selectedOrder?.id === order.id
                            ? "btn-secondary"
                            : "btn-info text-white"
                        }`}
                        onClick={() => handleSelect(order)}
                      >
                        {selectedOrder?.id === order.id ? "Fermer" : "Voir"}
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        disabled={updatingId === order.id}
                        onClick={() => handleStatusChange(order.id, "terminee")}
                      >
                        Terminer
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(order.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>

                {/* ✅ Collapse fichiers */}
                {selectedOrder?.id === order.id && (
                  <tr>
                    <td colSpan="12" className="p-0 border-0">
                      <div className="card card-body bg-light">
                        <h5 className="mb-3 text-primary">
                          <i className="bi bi-folder2-open me-2"></i>
                          Fichiers commande #{order.id}
                        </h5>
                        <FileActions
                          files={uploadedFiles}
                          role="admin"
                          userId={null}
                          orderId={order.id}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>

      {/* ✅ Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ⬅ Précédent
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li
                key={i}
                className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${
                currentPage === totalPages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Suivant ➡
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
