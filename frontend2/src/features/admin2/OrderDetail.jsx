import FileActions from "./FileActions";

export default function OrderDetail({ order, onStatusChange }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", marginTop: "20px" }}>
      <h3>Détails Commande #{order.id}</h3>
      <p>Patient: {order.patient_name}</p>
      <p>Sexe: {order.sex}</p>
      <p>Travail: {order.typeOfWork}</p>
      <p>Status: {order.status}</p>

      <FileActions files={order.dentistFiles} />

      <div>
        <h4>Actions Admin</h4>
        {["valide_admin", "terminee", "envoye_admin"].map(status => (
          <button key={status} onClick={() => onStatusChange(order.id, status)}>
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
