import { useState, useEffect } from "react";
import {
  fetchOrders,
  createCheckoutSession,
  generateInvoice,
  generateInvoiceMultiple, // ✅ facture multiple
  payMultipleOrders, // ✅ paiement multiple
} from "./api";
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

// ✅ helper pour afficher les dents
const renderTeeth = (data) => {
  if (Array.isArray(data)) return data.join(", ");
  if (typeof data === "string") return data;
  return "—";
};

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [expandedRemarks, setExpandedRemarks] = useState({});

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

  // ✅ Sélection libre (même si payé)
  const toggleSelect = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllPanier = () => {
    const panierOrders = orders
      .filter((o) => o.paymentStatus === "panier")
      .map((o) => o.id);
    setSelectedOrders(panierOrders);
  };

  const handleDeselectAll = () => {
    setSelectedOrders([]);
  };

  // ✅ Paiement = uniquement commandes non payées
  const handlePaySelected = async () => {
    const unpaidOrders = orders
      .filter((o) => selectedOrders.includes(o.id) && o.paymentStatus !== "paye")
      .map((o) => o.id);

    if (unpaidOrders.length === 0) {
      alert("Aucune commande sélectionnée n'est payable (déjà payées).");
      return;
    }

    try {
      const { url } = await payMultipleOrders(unpaidOrders);
      if (!url) throw new Error("Erreur création session Stripe");
      window.location.href = url;
    } catch (err) {
      console.error("Erreur paiement multiple:", err);
      alert(err?.message || "Impossible de lancer le paiement.");
    }
  };

  // ✅ Facture multiple = fonctionne pour toutes (payées ou non)
  const handleInvoiceSelected = async () => {
    if (selectedOrders.length === 0) {
      alert("Veuillez sélectionner au moins une commande.");
      return;
    }
    try {
      await generateInvoiceMultiple(selectedOrders);
    } catch (err) {
      console.error("Erreur facture multiple:", err);
      alert(err?.message || "Impossible de générer la facture multiple.");
    }
  };

  const toggleRemark = (id) => {
    setExpandedRemarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 🔍 Filtrage
  const filteredOrders = orders.filter((o) => {
    const s = search.toLowerCase();
    const worksStr = (o.works || [])
      .map((it) => `${it.work_type} ${it.sub_type}`)
      .join(" ")
      .toLowerCase();
    return (
      o.id.toString().includes(s) ||
      (o.patient_name || "").toLowerCase().includes(s) ||
      worksStr.includes(s) ||
      (o.orderStatus || "").toLowerCase().includes(s) ||
      (o.paymentStatus || "").toLowerCase().includes(s)
    );
  });

  // 📑 Pagination
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const indexOfLast = currentPage * ORDERS_PER_PAGE;
  const indexOfFirst = indexOfLast - ORDERS_PER_PAGE;
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);

  // 💰 Total sélectionné (toutes les commandes, payées incluses)
  const totalSelected = orders
    .filter((o) => selectedOrders.includes(o.id))
    .reduce((sum, o) => {
      const subtotal = (o.works || []).reduce(
        (acc, it) => acc + (parseFloat(it.price) || 0),
        0
      );
      return sum + subtotal;
    }, 0);

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold">
          <i className="bi bi-box-seam me-2"></i>
          Gestion des Commandes
        </h2>
        <input
          type="text"
          className="form-control w-50 shadow-sm"
          placeholder="🔍 Rechercher une commande..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Boutons de sélection */}
      <div className="mb-3 d-flex gap-2">
        <button className="btn btn-outline-primary" onClick={handleSelectAllPanier}>
          <i className="bi bi-check2-all me-1"></i>
          Sélectionner tous les paniers
        </button>
        <button className="btn btn-outline-danger" onClick={handleDeselectAll}>
          <i className="bi bi-x-circle me-1"></i>
          Désélectionner tout
        </button>
      </div>

      {/* Tableau */}
      <div className="card shadow-lg border-0">
        <div className="card-body p-0">
          <table className="table table-hover table-bordered mb-0">
            <thead className="bg-dark text-white text-center">
              <tr>
                <th>Sélection</th>
                <th>ID</th>
                <th>Patient</th>
                <th>Sexe</th>
                <th>Âge</th>
                <th>Travaux</th>
                <th>Upper</th>
                <th>Lower</th>
                <th>Modèle</th>
                <th>Remarques</th>
                <th>Fichiers (Dentiste)</th>
                <th>Fichiers (Utilisateur)</th>
                <th>Statut commande</th>
                <th>Statut paiement</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => {
                const status = order.orderStatus || "en_attente";
                const payment = order.paymentStatus || "panier";
                const subtotal = (order.works || []).reduce(
                  (acc, it) => acc + (parseFloat(it.price) || 0),
                  0
                );
                const remark = order.remark || "-";
                const isExpanded = expandedRemarks[order.id];
                const shortRemark =
                  remark.length > 15 ? remark.substring(0, 15) + "..." : remark;

                return (
                  <tr key={order.id}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelect(order.id)}
                      />
                    </td>
                    <td className="fw-bold text-primary">#{order.id}</td>
                    <td>{order.patient_name || "N/A"}</td>
                    <td>{order.patient_sex || "N/A"}</td>
                    <td>{order.patient_age || "N/A"}</td>
                    <td>
                      {(order.works || []).length > 0 ? (
                        <ul className="list-unstyled mb-0">
                          {order.works.map((it, idx) => (
                            <li key={idx}>
                              <i className="bi bi-tools me-1 text-muted"></i>
                              {it.work_type} – {it.sub_type} ({it.price} €){" "}
                              {it.teeth ? <small>[{it.teeth}]</small> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted">Aucun travail</span>
                      )}
                    </td>
                    {/* ✅ Affichage Upper / Lower */}
                    <td>
                      {(order.works || []).map((it, idx) => (
                        <div key={idx}>{renderTeeth(it.upper_teeth)}</div>
                      ))}
                    </td>
                    <td>
                      {(order.works || []).map((it, idx) => (
                        <div key={idx}>{renderTeeth(it.lower_teeth)}</div>
                      ))}
                    </td>
                    <td>{order.model || "-"}</td>
                    <td>
                      {isExpanded ? remark : shortRemark}{" "}
                      {remark.length > 15 && (
                        <button
                          className="btn btn-link btn-sm p-0"
                          onClick={() => toggleRemark(order.id)}
                        >
                          {isExpanded ? "Voir moins" : "Voir plus"}
                        </button>
                      )}
                    </td>
                    {/* ✅ Fichiers dentiste : visibles uniquement si commande terminée */}
                    <td>
                      {status === "terminee" ? (
                        (order.files || []).filter(
                          (f) => f.uploadedBy === "dentist"
                        ).length > 0 ? (
                          <ul className="list-unstyled mb-2">
                            {order.files
                              .filter((f) => f.uploadedBy === "dentist")
                              .map((f, idx) => (
                                <li key={idx}>
                                  <a
                                    href={
                                      f.url?.startsWith("/uploads")
                                        ? `${API_ORIGIN}${f.url}`
                                        : f.url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <i className="bi bi-file-earmark-text me-1"></i>
                                    {f.originalName || f.storedName}
                                  </a>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <span className="text-muted">Aucun fichier</span>
                        )
                      ) : (
                        <span className="text-muted">
                          Fichiers disponibles après validation
                        </span>
                      )}
                    </td>
                    <td>
                      {(order.files || []).filter(
                        (f) => f.uploadedBy === "user"
                      ).length > 0 ? (
                        <ul className="list-unstyled mb-2">
                          {order.files
                            .filter((f) => f.uploadedBy === "user")
                            .map((f, idx) => (
                              <li key={idx}>
                                <a
                                  href={
                                    f.url?.startsWith("/uploads")
                                      ? `${API_ORIGIN}${f.url}`
                                      : f.url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <i className="bi bi-file-earmark-text me-1"></i>
                                  {f.originalName || f.storedName}
                                </a>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <span className="text-muted">Aucun fichier</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          status === "terminee"
                            ? "bg-success"
                            : status === "en_cours"
                            ? "bg-warning text-dark"
                            : "bg-secondary"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          payment === "paye"
                            ? "bg-success"
                            : payment === "panier"
                            ? "bg-secondary"
                            : "bg-danger"
                        }`}
                      >
                        {payment}
                      </span>
                    </td>
                    <td className="fw-bold text-end text-success">
                      {subtotal.toFixed(2)} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📑 Pagination */}
      <nav className="mt-3">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <i className="bi bi-chevron-left"></i> Précédent
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
            className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Suivant <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>

      {/* ✅ Footer */}
      <div className="d-flex flex-column mt-3 p-3 bg-light border rounded shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5>
            Total sélectionné :{" "}
            <span className="text-success fw-bold">
              {totalSelected.toFixed(2)} €
            </span>
          </h5>
          <div className="d-flex gap-2">
            <button
              className="btn btn-success"
              onClick={handlePaySelected}
              disabled={selectedOrders.length === 0}
            >
              <i className="bi bi-credit-card me-2"></i>
              Payer la sélection ({selectedOrders.length})
            </button>
            <button
              className="btn btn-dark"
              onClick={handleInvoiceSelected}
              disabled={selectedOrders.length === 0}
            >
              <i className="bi bi-receipt me-2"></i>
              Facturer la sélection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
