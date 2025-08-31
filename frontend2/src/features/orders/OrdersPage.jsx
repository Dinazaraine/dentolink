import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import OrderForm from "./OrderForm";
import OrderTable from "./OrderTable";
import Footer from "../../layout/Footer.jsx"; // <-- Import du footer

export default function OrdersPage() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);

  const onToggleLines = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      return res.json();
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    },
  });

  const delMut = useMutation({
    mutationFn: async (id) => {
      await fetch(`/api/orders/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });

  const payMut = useMutation({
    mutationFn: async (id) => {
      await fetch(`/api/orders/${id}/pay`, { method: "POST" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });

  return (
    <div className="orders-page min-h-screen flex flex-col">
      <div style={{ display: "grid", gap: 16, flex: 1 }}>
        <OrderForm
          clients={clients || []}
          onCreated={() => qc.invalidateQueries({ queryKey: ["orders"] })}
        />

        <h2>Mes commandes</h2>

        {!orders?.length && <div>Aucune commande.</div>}

        {!!orders?.length && (
          <OrderTable
            data={orders}
            onToggleLines={onToggleLines}
            expandedId={expandedId}
            onDelete={(id) => {
              if (confirm("Supprimer cette commande ?")) delMut.mutate(id);
            }}
            onPay={(id) => payMut.mutate(id)}
          />
        )}
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
