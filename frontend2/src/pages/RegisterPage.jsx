// src/pages/RegisterPage.jsx
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { registerApi } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
    companyName: "",
    phone_fixed: "",
    phone_mobile: "",
    siret: "",
    address: "",
    zipcode: "",
    city: "",
    country: "France",
  });

  const mut = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      // soit tu connectes directement si API renvoie token
      if (data.token) {
        login(data.token, data.user);
        nav("/app", { replace: true });
      } else {
        nav("/login", { replace: true });
      }
    },
  });

  return (
    <div className="auth-container">
      <h2>Inscription</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate(form);
        }}
        className="auth-form"
      >
        <label>Nom de l’entreprise / Cabinet</label>
        <input
          value={form.companyName}
          onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))}
          required
        />

        <label>Email professionnel</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
          required
        />

        <label>Mot de passe</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
          required
        />

        <label>Téléphone fixe</label>
        <input
          value={form.phone_fixed}
          onChange={(e) => setForm(f => ({ ...f, phone_fixed: e.target.value }))}
        />

        <label>Téléphone mobile</label>
        <input
          value={form.phone_mobile}
          onChange={(e) => setForm(f => ({ ...f, phone_mobile: e.target.value }))}
        />

        <label>SIRET (si disponible)</label>
        <input
          value={form.siret}
          onChange={(e) => setForm(f => ({ ...f, siret: e.target.value }))}
        />

        <label>Adresse complète</label>
        <input
          value={form.address}
          onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
          required
        />

        <label>Code postal</label>
        <input
          value={form.zipcode}
          onChange={(e) => setForm(f => ({ ...f, zipcode: e.target.value }))}
          required
        />

        <label>Ville</label>
        <input
          value={form.city}
          onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
          required
        />

        <label>Pays</label>
        <input
          value={form.country}
          onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))}
          required
        />

        <button disabled={mut.isPending}>
          {mut.isPending ? "Création…" : "Créer le compte"}
        </button>

        {mut.isError && (
          <div className="error">
            {String(mut.error.message || mut.error)}
          </div>
        )}
      </form>

      <p className="muted">
        Déjà inscrit ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  );
}
