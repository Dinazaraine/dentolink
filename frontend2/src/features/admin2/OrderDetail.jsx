import FileActions from "./FileActions";

export default function OrderDetail({ order, onStatusChange }) {
  if (!order) return <div>Aucune commande sélectionnée.</div>;

  const status = order.orderStatus || order.status || "en_attente";

  return (
    <div className="card mt-3 shadow-sm">
      <div className="card-body">
        <h3 className="mb-3 text-primary">Détails Commande #{order.id}</h3>

        <p><strong>Patient :</strong> {order.patient_name || "N/A"}</p>
        <p><strong>Sexe :</strong> {order.patient_sex || "N/A"}</p>
        <p><strong>Âge :</strong> {order.patient_age || "N/A"}</p>
        <p><strong>Statut :</strong> {status}</p>

        {/* ✅ Travaux */}
        <h5 className="mt-4">Travaux</h5>
        {(order.works || []).length > 0 ? (
          <ul className="list-group mb-3">
            {order.works.map((w, idx) => (
              <li key={idx} className="list-group-item">
                <strong>{w.work_type}</strong> – {w.sub_type} ({w.price} €)
                <br />
                <small>Upper: {Array.isArray(w.upper_teeth) ? w.upper_teeth.join(", ") : "—"}</small>
                <br />
                <small>Lower: {Array.isArray(w.lower_teeth) ? w.lower_teeth.join(", ") : "—"}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Aucun travail renseigné</p>
        )}

        {/* ✅ Fichiers dentiste */}
        <FileActions
          files={(order.files || []).filter((f) => f.uploadedBy === "dentist")}
          role="dentiste"
          orderId={order.id}
          userId={order.dentistId}
        />

        {/* ✅ Fichiers utilisateur */}
        <FileActions
          files={(order.files || []).filter((f) => f.uploadedBy === "user")}
          role="user"
          orderId={order.id}
          userId={order.userId}
        />

        {/* ✅ Actions Admin */}
        <div className="mt-4">
          <h5>Actions Admin</h5>
          {["envoye_admin", "valide_admin", "terminee"].map((newStatus) => (
            <button
              key={newStatus}
              className="btn btn-sm btn-outline-primary me-2"
              onClick={() => onStatusChange(order.id, newStatus)}
            >
              {newStatus}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
