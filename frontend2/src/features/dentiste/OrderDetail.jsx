// ... imports déjà présents
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// ✅ Fonction preview avec badge User/Dentiste
const renderFilePreview = (file) => {
  const url = file.url || file.fullUrl;
  const ext = url.split(".").pop().toLowerCase();

  const iconMap = {
    pdf: "bi-file-earmark-pdf text-danger",
    jpg: "bi-image text-primary",
    jpeg: "bi-image text-primary",
    png: "bi-image text-primary",
    gif: "bi-image text-primary",
    webp: "bi-image text-primary",
    stl: "bi-box text-warning",
    obj: "bi-box text-warning",
    ply: "bi-box text-warning",
  };
  const icon = iconMap[ext] || "bi-file-earmark-text text-secondary";

  // Déterminer le badge selon uploader
  const badge =
    file.uploadedBy === "user" ? (
      <span className="badge bg-primary">User</span>
    ) : file.uploadedBy === "dentist" ? (
      <span className="badge bg-success">Dentiste</span>
    ) : (
      <span className="badge bg-secondary">Autre</span>
    );

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return (
      <div className="m-2 text-center">
        <img
          src={url}
          alt={file.originalName || url}
          className="img-thumbnail mb-1"
          style={{ maxWidth: 80, maxHeight: 80 }}
        />
        <div>{badge}</div>
      </div>
    );
  }
  if (ext === "pdf") {
    return (
      <div className="m-2 text-center">
        <i className="bi bi-file-earmark-pdf text-danger fs-3 d-block"></i>
        <a href={url} target="_blank" rel="noreferrer">
          {file.originalName || "PDF"}
        </a>
        <div>{badge}</div>
      </div>
    );
  }
  return (
    <div className="m-2 text-center">
      <i className={`bi ${icon} fs-3 d-block`}></i>
      <a href={url} target="_blank" rel="noreferrer">
        {file.originalName || url.split("/").pop()}
      </a>
      <div>{badge}</div>
    </div>
  );
};

// ... ton composant principal
export default function OrderList() {
  // ... états et fonctions existants

  return (
    <div className="container-fluid py-4 bg-light">
      {/* TABLE */}
      <div className="table-responsive shadow-sm rounded bg-white p-3">
        <table className="table table-striped table-hover align-middle text-center">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Sexe</th>
              <th>Âge</th>
              <th>Travail</th>
              <th>Sub-type</th>
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
              const status = order.status || order.orderStatus || "en_attente";
              return (
                <>
                  <tr key={order.id}>
                    {/* colonnes de base ... */}
                    <td>{order.id}</td>
                    <td>{order.patient_name || "N/A"}</td>
                    <td>{order.patient_sex || "N/A"}</td>
                    <td>{order.patient_age || "N/A"}</td>
                    <td>{order.work_type || "N/A"}</td>
                    <td>{order.sub_type || "N/A"}</td>
                    <td>
                      {(() => {
                        try {
                          const upper = JSON.parse(order.upper_teeth || "[]");
                          return Array.isArray(upper) && upper.length
                            ? upper.join(", ")
                            : "—";
                        } catch {
                          return order.upper_teeth || "—";
                        }
                      })()}
                    </td>
                    <td>
                      {(() => {
                        try {
                          const lower = JSON.parse(order.lower_teeth || "[]");
                          return Array.isArray(lower) && lower.length
                            ? lower.join(", ")
                            : "—";
                        } catch {
                          return order.lower_teeth || "—";
                        }
                      })()}
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
                    <td>
                      {/* Aperçu des fichiers utilisateur uniquement */}
                      <div className="d-flex flex-wrap justify-content-center">
                        {Array.isArray(order.files) &&
                          order.files
                            .filter((f) => f.uploadedBy === "user")
                            .map((f, i) => (
                              <div key={i}>{renderFilePreview(f)}</div>
                            ))}
                      </div>
                    </td>
                    <td>
                      {/* boutons voir/en cours/annuler */}
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

                  {/* ✅ Section détaillée avec badges user/dentiste */}
                  {selectedOrderId === order.id && (
                    <tr>
                      <td colSpan={12}>
                        <div className="p-3 bg-light rounded shadow-sm text-start">
                          <h5 className="mb-3 text-primary">
                            <i className="bi bi-folder2-open me-2"></i>
                            Tous les fichiers de la commande #{order.id}
                          </h5>
                          <div className="d-flex flex-wrap">
                            {uploadedFiles.map((f, i) => (
                              <div key={i}>{renderFilePreview(f)}</div>
                            ))}
                          </div>
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
    </div>
  );
}
