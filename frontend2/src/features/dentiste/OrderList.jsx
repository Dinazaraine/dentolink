import { useState, useEffect } from "react";
import {
  getOrdersForDentist,
  uploadDentistFiles,
  getOrderFiles,
} from "./dentisteAPI";
import axios from "axios";
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

/* ✅ Mise à jour du statut côté backend */
async function localUpdateOrderStatus(orderId, next) {
  const token = localStorage.getItem("token");
  const res = await axios.put(
    `${API_URL}/orders/${orderId}/status`,
    { orderStatus: next },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = res.data || {};
  const s = data.orderStatus || data.status || next;
  return { ...data, orderStatus: s, status: s };
}

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [localFiles, setLocalFiles] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const ORDERS_PER_PAGE = 5;

  /* Charger toutes les commandes */
  useEffect(() => {
    fetchOrders();
  }, []);

  /* Refiltrage si recherche */
  useEffect(() => {
    filterOrders();
  }, [search, orders]);

  const fetchOrders = async () => {
    try {
      const data = await getOrdersForDentist();
      const normalized = Array.isArray(data) ? data : [];
      setOrders(normalized);
      setFilteredOrders(normalized);
    } catch (err) {
      console.error("❌ Erreur fetchOrders:", err);
    }
  };

  const filterOrders = () => {
    let filtered = orders.filter((o) => {
      const text = `${o.id} ${o.patient_name || ""} ${o.orderStatus || o.status || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleSelect = async (order) => {
    if (selectedOrderId === order.id) {
      setSelectedOrderId(null);
      setUploadedFiles([]);
      return;
    }
    setSelectedOrderId(order.id);
    try {
      const files = await getOrderFiles(order.id);
      const prepared = (files || []).map((f) => ({
        ...f,
        fullUrl: f?.url?.startsWith("/uploads")
          ? `${API_ORIGIN}${f.url}`
          : f.url,
      }));
      setUploadedFiles(prepared);
      setLocalFiles([]);
    } catch (err) {
      console.error("❌ Erreur getOrderFiles:", err);
      setUploadedFiles([]);
    }
  };

  const handleFileChange = (e) => {
    setLocalFiles(Array.from(e.target.files || []));
  };

  const handleUpload = async () => {
    if (!selectedOrderId || localFiles.length === 0) return;
    setUpdatingId(selectedOrderId);
    try {
      await uploadDentistFiles(selectedOrderId, localFiles);
      const files = await getOrderFiles(selectedOrderId);
      const prepared = (files || []).map((f) => ({
        ...f,
        fullUrl: f?.url?.startsWith("/uploads")
          ? `${API_ORIGIN}${f.url}`
          : f.url,
      }));
      setUploadedFiles(prepared);
      setLocalFiles([]);
    } catch (err) {
      console.error("❌ Erreur upload fichiers dentiste:", err);
      alert(
        err?.response?.data?.error || err?.message || "Erreur lors de l'envoi"
      );
    }
    setUpdatingId(null);
  };

  /* ✅ Fichiers utilisateur (colonne) */
  const renderUserFiles = (order) => {
    if (!Array.isArray(order.files)) return "—";
    const userFiles = order.files.filter((f) => f.uploadedBy === "user");
    if (!userFiles.length) return "—";
    return (
      <div className="d-flex flex-wrap gap-1">
        {userFiles.map((f, i) => {
          const ext = (f.originalName || f.storedName || "")
            .split(".")
            .pop()
            .toLowerCase();
          let icon = "bi-file-earmark-text";
          if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
            icon = "bi-image text-primary";
          else if (ext === "pdf") icon = "bi-file-earmark-pdf text-danger";
          else if (["doc", "docx"].includes(ext))
            icon = "bi-file-earmark-word text-info";
          else if (["xls", "xlsx"].includes(ext))
            icon = "bi-file-earmark-excel text-success";

          return (
            <a
              key={i}
              href={f.fullUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-outline-secondary"
            >
              <i className={`bi ${icon} me-1`}></i>
              {f.originalName || f.storedName}
            </a>
          );
        })}
      </div>
    );
  };

  /* Pagination */
  const indexOfLast = currentPage * ORDERS_PER_PAGE;
  const indexOfFirst = indexOfLast - ORDERS_PER_PAGE;
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);

  /* ✅ Helper affichage dents */
  const renderTeeth = (data) => {
    if (Array.isArray(data)) {
      return data.join(", ");
    }
    if (typeof data === "string") {
      return data; // ex: "[122141]"
    }
    return "—";
  };

  return (
    <div className="container-fluid py-4 bg-light">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold">
          <i className="bi bi-clipboard-data me-2"></i>
          Commandes Dentiste
        </h2>
        <input
          type="text"
          placeholder="🔍 Rechercher une commande..."
          className="form-control w-50 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="table-responsive shadow-sm rounded bg-white p-3">
        <table className="table table-striped table-hover align-middle text-center">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Sexe</th>
              <th>Âge</th>
              <th>Travaux</th>
              <th>Upper</th>
              <th>Lower</th>
              <th>Remarque</th>
              <th>Statut</th>
              <th>Fichiers utilisateur</th>
              <th>Actions</th>
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
                    {/* ✅ Travaux sous forme de liste */}
                    <td>
                      {Array.isArray(order.works) && order.works.length > 0 ? (
                        <ul className="list-unstyled mb-0 text-start">
                          {order.works.map((w, i) => (
                            <li key={i}>
                              <i className="bi bi-tools text-muted me-1"></i>
                              {w.work_type} – {w.sub_type || "N/A"} (
                              {parseFloat(w.price).toFixed(2)} €)
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted">Aucun travail</span>
                      )}
                    </td>
                    <td>
  {Array.isArray(order.works) && order.works.length > 0 ? (
    <ul className="list-unstyled mb-0">
      {order.works.map((w, i) => (
        <li key={i}>{renderTeeth(w.upper_teeth)}</li>
      ))}
    </ul>
  ) : (
    "—"
  )}
</td>

<td>
  {Array.isArray(order.works) && order.works.length > 0 ? (
    <ul className="list-unstyled mb-0">
      {order.works.map((w, i) => (
        <li key={i}>{renderTeeth(w.lower_teeth)}</li>
      ))}
    </ul>
  ) : (
    "—"
  )}
</td>

                    <td>{order.remark || "—"}</td>
                    <td>
                      <span
                        className={`badge ${
                          status === "en_cours"
                            ? "bg-warning text-dark"
                            : status === "annulee"
                            ? "bg-danger"
                            : "bg-secondary"
                        } px-3 py-2`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>{renderUserFiles(order)}</td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => handleSelect(order)}
                        >
                          {selectedOrderId === order.id ? "Fermer" : "Voir"}
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() =>
                            localUpdateOrderStatus(order.id, "en_cours").then(
                              (updated) =>
                                setOrders((prev) =>
                                  prev.map((o) =>
                                    o.id === order.id ? updated : o
                                  )
                                )
                            )
                          }
                        >
                          En cours
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() =>
                            localUpdateOrderStatus(order.id, "annulee").then(
                              (updated) =>
                                setOrders((prev) =>
                                  prev.map((o) =>
                                    o.id === order.id ? updated : o
                                  )
                                )
                            )
                          }
                        >
                          Annuler
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Bloc fichiers dentiste */}
                  {selectedOrderId === order.id && (
                    <tr>
                      <td colSpan={11}>
                        <div className="p-3 bg-light rounded shadow-sm text-start">
                          <h5 className="mb-3 text-primary">
                            <i className="bi bi-folder2-open me-2"></i>
                            Fichiers dentiste (commande #{order.id})
                          </h5>
                          <div className="d-flex flex-wrap">
                            {uploadedFiles
                              .filter((f) => f.uploadedBy === "dentist")
                              .map((f, i) => {
                                const ext = (f.originalName || f.storedName || "")
                                  .split(".")
                                  .pop()
                                  .toLowerCase();
                                let icon = "bi-file-earmark-text";
                                if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
                                  icon = "bi-image text-primary";
                                else if (ext === "pdf")
                                  icon = "bi-file-earmark-pdf text-danger";
                                else if (["doc", "docx"].includes(ext))
                                  icon = "bi-file-earmark-word text-info";
                                else if (["xls", "xlsx"].includes(ext))
                                  icon = "bi-file-earmark-excel text-success";
                                else if (["stl", "obj", "ply"].includes(ext))
                                  icon = "bi-box text-warning";

                                return (
                                  <a
                                    key={i}
                                    href={f.fullUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-outline-secondary m-1"
                                  >
                                    <i className={`bi ${icon} me-1`}></i>
                                    {f.originalName || f.storedName}
                                  </a>
                                );
                              })}
                          </div>

                          {/* Upload form */}
                          <div className="mt-3 d-flex gap-2">
                            <input
                              type="file"
                              className="form-control"
                              multiple
                              onChange={handleFileChange}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={handleUpload}
                              disabled={
                                localFiles.length === 0 ||
                                updatingId === order.id
                              }
                            >
                              <i className="bi bi-upload me-1"></i>
                              Envoyer à l’admin
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <nav className="mt-4">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              ⬅ Précédent
            </button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => (
            <li
              key={i}
              className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
            >
              <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
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
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Suivant ➡
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
