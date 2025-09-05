export default function FileActions({ files, role, userId, orderId }) {
  // Filtrage des fichiers selon rôle et commande
  let list = files || [];

  if (role === "admin") {
    // L'admin voit uniquement les fichiers envoyés par le dentiste pour cette commande
    list = list.filter(
      (f) => f.uploadedBy === "dentist" && f.orderId === orderId
    );
  } else if (role === "dentiste") {
    // Le dentiste voit seulement ses fichiers liés à cette commande
    list = list.filter(
      (f) =>
        f.uploadedBy === "dentist" &&
        f.uploadedById === userId &&
        f.orderId === orderId
    );
  }

  return (
    <div>
      <h4>Fichiers envoyés par le dentiste</h4>
      {list.length === 0 ? (
        <p>Aucun fichier n’a été envoyé.</p>
      ) : (
        list.map((f, i) => {
          const url = f.fullUrl || f.url;
          const name =
            f.originalName ||
            f.originalname ||
            (url ? url.split("/").pop() : "Fichier");

          return (
            <div key={i} style={{ marginBottom: "6px" }}>
              <a href={url} target="_blank" rel="noreferrer">
                {name}
              </a>
              <button
                style={{
                  marginLeft: "10px",
                  padding: "4px 8px",
                  borderRadius: 4,
                  border: "1px solid #D1D5DB",
                  cursor: "pointer",
                }}
                onClick={() => window.open(url, "_blank")}
              >
                Télécharger
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
