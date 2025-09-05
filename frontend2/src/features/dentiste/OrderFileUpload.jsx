import { useState, useEffect } from "react";
import { getOrdersForDentist, getOrderFiles } from "./dentisteAPI";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function DentistOrderOverview() {
  const [orders, setOrders] = useState([]);
  const [filesMap, setFilesMap] = useState({});
  const [clientIdsMap, setClientIdsMap] = useState({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ORDERS_PER_PAGE = 4;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getOrdersForDentist();
      setOrders(Array.isArray(data) ? data : []);

      const filesPromises = data.map(async (order) => {
        const files = await getOrderFiles(order.id);
        const preparedFiles = (Array.isArray(files) ? files : []).map((f) => ({
          ...f,
          fullUrl: f.url?.startsWith("/uploads")
            ? `${API_BASE_URL}${f.url}`
            : f.url,
        }));
        const clientIds = [
          ...new Set(preparedFiles.map((f) => f.uploadedById).filter(Boolean)),
        ];
        return { orderId: order.id, files: preparedFiles, clientIds };
      });

      const results = await Promise.all(filesPromises);

      const filesObj = {};
      const clientIdsObj = {};
      results.forEach((r) => {
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
    const ext = (file.originalName || url).split(".").pop().toLowerCase();
    if (!url) return null;

    let icon = "bi-file-earmark-text text-secondary";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) icon = "bi-image text-primary";
    else if (ext === "pdf") icon = "bi-file-earmark-pdf text-danger";
    else if (["doc", "docx"].includes(ext)) icon = "bi-file-earmark-word text-info";
    else if (["xls", "xlsx"].includes(ext)) icon = "bi-file-earmark-excel text-success";
    else if (["stl", "obj", "ply"].includes(ext)) icon = "bi-box text-warning";

    const badge =
      file.uploadedBy === "user" ? (
        <span className="badge bg-primary ms-2">User</span>
      ) : file.uploadedBy === "dentist" ? (
        <span className="badge bg-success ms-2">Dentiste</span>
      ) : (
        <span className="badge bg-secondary ms-2">Autre</span>
      );

    return (
      <a
        key={file.id}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline-light border m-2 d-flex align-items-center"
        style={{ minWidth: "120px" }}
      >
        <i className={`bi ${icon} me-2 fs-4`}></i>
        <span className="text-truncate" style={{ maxWidth: "80px" }}>
          {file.originalName || url.split("/").pop()}
        </span>
        {badge}
      </a>
    );
  };

  // ✅ Filtrage
  const filteredOrders = orders.filter((o) => {
    const searchText = search.toLowerCase();
    const clientIds = clientIdsMap[o.id]?.join(", ") || "";
    return (
      o.id.toString().includes(searchText) ||
      (o.status || "").toLowerCase().includes(searchText) ||
      clientIds.toLowerCase().includes(searchText)
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
        <h2 className="text-primary fw-bold">🦷 Commandes Dentiste - Aperçu</h2>
        <input
          type="text"
          placeholder="🔍 Rechercher par ID, statut, client..."
          className="form-control w-50 shadow-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {currentOrders.length === 0 ? (
        <div className="alert alert-info">Aucune commande trouvée.</div>
      ) : (
        <div className="row g-4">
          {currentOrders.map((order) => (
            <div className="col-md-6" key={order.id}>
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <h5 className="card-title d-flex align-items-center justify-content-between">
                    Commande #{order.id}
                    <span
                      className={`badge ${
                        order.status === "paye"
                          ? "bg-success"
                          : order.status === "en_attente"
                          ? "bg-warning text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {order.status || "en_attente"}
                    </span>
                  </h5>

                  <p className="card-text">
                    <strong>Clients ayant uploadé :</strong>{" "}
                    {clientIdsMap[order.id]?.length > 0 ? (
                      <span className="text-success">
                        {clientIdsMap[order.id].join(", ")}
                      </span>
                    ) : (
                      <span className="text-muted">Aucun</span>
                    )}
                  </p>

                  {filesMap[order.id]?.length > 0 && (
                    <>
                      <h6 className="mt-3">📂 Fichiers :</h6>
                      <div className="d-flex flex-wrap">
                        {filesMap[order.id].map((f) => renderFilePreview(f))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Pagination Bootstrap */}
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
