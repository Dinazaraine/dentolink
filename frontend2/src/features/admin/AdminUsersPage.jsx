import UsersTable from "./UsersTable";
import Footer from "../../layout/Footer.jsx";

export default function UsersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white py-6 px-4 shadow-md">
        <h1 className="text-2xl font-bold">Liste des Utilisateurs</h1>
        <p className="mt-1 text-sm text-blue-100">
          Consultez tous les utilisateurs et leurs informations importantes.
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <UsersTable />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
