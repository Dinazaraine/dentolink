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

  // ✅ Filtrage par recherche
  const filteredOrders = orders.filter((o) => {
    const s = search.toLowerCase();
    return (
      o.id.toString().includes(s) ||
      (o.patient_name || "").toLowerCase().includes(s) ||
      (o.work_type || "").toLowerCase().includes(s) ||
      (o.status || o.orderStatus || "").toLowerCase().includes(s)
    );
  });

  // ✅ Pagination
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const indexOfLast = currentPage * ORDERS_PER_PAGE;
  const indexOfFirst = indexOfLast - ORDERS_PER_PAGE;
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);

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
            <th><i className="bi bi-hash"></i> ID</th>
            <th><i className="bi bi-person"></i> Patient</th>
            <th><i className="bi bi-gender-ambiguous"></i> Sexe</th>
            <th><i className="bi bi-person-badge"></i> Âge</th>
            <th><i className="bi bi-tools"></i> Travail</th>
            <th><i className="bi bi-diagram-3"></i> Sub-type</th>
            <th><i className="bi bi-flag"></i> Statut</th>
            <th><i className="bi bi-cash-coin"></i> Total</th>
            <th className="text-center"><i className="bi bi-gear"></i> Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.map((order) => {
            const status = order.orderStatus || order.status || "en_attente";
            return (
              <>
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.patient_name || "N/A"}</td>
                  <td>{order.patient_sex || "N/A"}</td>
                  <td>{order.patient_age || "N/A"}</td>
                  <td>{order.work_type || "N/A"}</td>
                  <td>{order.sub_type || "N/A"}</td>
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
                  <td>{order.total ? `${order.total} €` : "N/A"}</td>
                  <td className="text-center">
                    <div className="btn-group">
                      <button
                        className={`btn btn-sm ${
                          selectedOrder?.id === order.id
                            ? "btn-secondary"
                            : "btn-info text-white"
                        }`}
                        data-bs-toggle="collapse"
                        data-bs-target={`#collapse-${order.id}`}
                        onClick={() => handleSelect(order)}
                      >
                        <i
                          className={`bi ${
                            selectedOrder?.id === order.id
                              ? "bi-x-circle"
                              : "bi-eye"
                          }`}
                        ></i>{" "}
                        {selectedOrder?.id === order.id ? "Fermer" : "Voir"}
                      </button>

                      <button
                        className="btn btn-sm btn-success"
                        disabled={updatingId === order.id}
                        onClick={() => handleStatusChange(order.id, "terminee")}
                      >
                        <i className="bi bi-check2"></i> Terminer
                      </button>

                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(order.id)}
                      >
                        <i className="bi bi-trash"></i> Supprimer
                      </button>
                    </div>
                  </td>
                </tr>

                {/* ✅ Collapse Bootstrap pour fichiers */}
                <tr>
                  <td colSpan="9" className="p-0 border-0">
                    <div
                      id={`collapse-${order.id}`}
                      className={`collapse ${
                        selectedOrder?.id === order.id ? "show" : ""
                      }`}
                    >
                      <div className="card card-body bg-light">
                        <h5 className="mb-3">
                          <i className="bi bi-folder2-open me-2"></i>
                          Détails commande #{order.id}
                        </h5>
                        <FileActions
                          files={uploadedFiles}
                          role="admin"
                          userId={null}
                          orderId={order.id}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              </>
            );
          })}
        </tbody>
      </table>

      {/* ✅ Pagination Bootstrap */}
      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <i className="bi bi-arrow-left"></i> Précédent
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
                Suivant <i className="bi bi-arrow-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
