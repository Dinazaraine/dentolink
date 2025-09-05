import UsersTable from "./UsersTable";
import "bootstrap/dist/css/bootstrap.min.css";

export default function UsersPage() {
  return (
    <div className="container-fluid min-vh-100 d-flex flex-column bg-light">
      {/* Header */}
      

      {/* Main Content */}
      <main className="flex-grow-1 py-5">
        <div className="container">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-primary">📋 Tableau des Utilisateurs</h5>
              <button className="btn btn-sm btn-success">
                ➕ Ajouter un utilisateur
              </button>
            </div>
            <div className="card-body">
              <UsersTable />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
