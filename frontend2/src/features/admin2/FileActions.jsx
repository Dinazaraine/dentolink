import "bootstrap/dist/css/bootstrap.min.css";

export default function FileActions({ files, role, userId, orderId }) {
  let list = files || [];

  // ✅ Filtrage selon le rôle
  if (role === "admin") {
    // admin voit tout
    list = list.filter((f) => f.order_id === orderId);
  } else if (role === "dentiste") {
    // dentiste voit seulement ses fichiers
    list = list.filter(
      (f) => f.uploadedBy === "dentist" && f.uploadedById === userId && f.order_id === orderId
    );
  } else if (role === "user") {
    // user voit seulement ses fichiers
    list = list.filter(
      (f) => f.uploadedBy === "user" && f.uploadedById === userId && f.order_id === orderId
    );
  }

  return (
    <div className="mt-3">
      <h4 className="mb-3 text-primary">📂 Fichiers de la commande</h4>

      {list.length === 0 ? (
        <div className="alert alert-info">Aucun fichier n’a été envoyé.</div>
      ) : (
        <ul className="list-group shadow-sm">
          {list.map((f, i) => {
            const url = f.fullUrl || f.url;
            const name =
              f.originalName ||
              f.originalname ||
              (url ? url.split("/").pop() : "Fichier");

            // Détecter extension pour badge
            const ext = name.split(".").pop()?.toLowerCase();
            const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
            const isPdf = ext === "pdf";

            // ✅ Badge expéditeur
            const senderBadge =
              f.uploadedBy === "dentist" ? (
                <span className="badge bg-info ms-2">Dentiste</span>
              ) : f.uploadedBy === "user" ? (
                <span className="badge bg-secondary ms-2">Utilisateur</span>
              ) : (
                <span className="badge bg-dark ms-2">Autre</span>
              );

            return (
              <li
                key={i}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="fw-bold text-decoration-none"
                  >
                    {name}
                  </a>
                  <span
                    className={`badge ms-2 ${
                      isImage
                        ? "bg-success"
                        : isPdf
                        ? "bg-danger"
                        : "bg-secondary"
                    }`}
                  >
                    {ext?.toUpperCase() || "FILE"}
                  </span>
                  {senderBadge}
                </div>

                <div className="btn-group">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    🔍 Ouvrir
                  </a>
                  <a
                    href={url}
                    download={name}
                    className="btn btn-sm btn-outline-success"
                  >
                    ⬇ Télécharger
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
