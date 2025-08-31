import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "../orders/api";

export default function ClientForm({ values = {}, onChange, onSubmit }) {
  const meQ = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const isDentist = meQ.data?.role === "dentiste";

  const handleChange = (patch) => onChange?.({ ...values, ...patch });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isDentist) onSubmit?.(values);
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 12 }}>
      <fieldset disabled={isDentist} style={{ border: 0, padding: 0, margin: 0 }}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Prénom</label>
          <input
            value={values.firstName || ""}
            onChange={(e) => handleChange({ firstName: e.target.value })}
            style={{ width: "100%", padding: 8, border: "1px solid #e5e7eb", borderRadius: 8 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Nom</label>
          <input
            value={values.lastName || ""}
            onChange={(e) => handleChange({ lastName: e.target.value })}
            style={{ width: "100%", padding: 8, border: "1px solid #e5e7eb", borderRadius: 8 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Sexe</label>
          <select
            value={values.sexe || ""}
            onChange={(e) => handleChange({ sexe: e.target.value })}
            style={{ width: "100%", padding: 8, border: "1px solid #e5e7eb", borderRadius: 8 }}
          >
            <option value="">--</option>
            <option value="M">Homme</option>
            <option value="F">Femme</option>
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Date de naissance
          </label>
          <input
            type="date"
            value={values.birthDate || ""}
            onChange={(e) => handleChange({ birthDate: e.target.value })}
            style={{ width: "100%", padding: 8, border: "1px solid #e5e7eb", borderRadius: 8 }}
          />
        </div>
      </fieldset>

      {!isDentist ? (
        <button
          type="submit"
          style={{
            marginTop: 12,
            padding: "8px 12px",
            borderRadius: 8,
            background: "#111827",
            color: "#fff",
            border: 0,
          }}
        >
          Enregistrer
        </button>
      ) : (
        <p style={{ marginTop: 12, color: "#666" }}>
          Vue Client (accès dentiste)&nbsp;: consultation uniquement, noms masqués.
        </p>
      )}
    </form>
  );
}
