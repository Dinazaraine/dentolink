import { useQuery } from "@tanstack/react-query";
import { fetchClients } from "../clients/api";
import { fetchOrders, fetchMe } from "../orders/api";
import ClientTable from "./ClientTable";

function Spinner() {
  return <div style={{ padding: 12 }}>Chargement…</div>;
}

export default function ClientsPage() {
  const meQ = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const isDentist = meQ.data?.role === "dentiste";
  const isUser = meQ.data?.role === "user";

  const clientsQ = useQuery({
    queryKey: ["clients", isDentist],
    queryFn: () => fetchClients({}, isDentist),
    enabled: !!meQ.data,
  });

  if (meQ.isLoading || clientsQ.isLoading) return <Spinner />;

  if (meQ.isError)
    return <div style={{ color: "crimson", padding: 12 }}>Erreur profil : {String(meQ.error?.message)}</div>;

  if (clientsQ.isError)
    return <div style={{ color: "crimson", padding: 12 }}>Erreur clients : {String(clientsQ.error?.message)}</div>;

  // Pour user, on ne montre que ses commandes
  const data = isUser
    ? clientsQ.data.filter((c) => c.id === meQ.data.id)
    : clientsQ.data;

  return (
    <div style={{ padding: 12 }}>
      <h2 style={{ marginBottom: 12 }}>Espace Client {isDentist ? "(vue dentiste)" : ""}</h2>
      <ClientTable data={data} isDentist={isDentist} me={meQ.data} />
    </div>
  );
}
