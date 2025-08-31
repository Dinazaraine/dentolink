// src/pages/RegisterPage.jsx
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { registerApi } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });

  const mut = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      // soit tu connectes directement :
      if (data.token) {
        login(data.token, data.user);
        nav("/", { replace: true });
      } else {
        nav("/login", { replace: true });
      }
    },
  });

  return (
    <div className="auth-container">
      <h2>Inscription</h2>
      <form
        onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }}
        className="auth-form"
      >
        <label>Prénom</label>
        <input value={form.firstName} onChange={e=>setForm(f=>({...f,firstName:e.target.value}))} />
        <label>Nom</label>
        <input value={form.lastName} onChange={e=>setForm(f=>({...f,lastName:e.target.value}))} />
        <label>Email</label>
        <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
        <label>Mot de passe</label>
        <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required />
        <button disabled={mut.isPending}>{mut.isPending ? "Création…" : "Créer le compte"}</button>
        {mut.isError && <div className="error">{String(mut.error.message || mut.error)}</div>}
      </form>
      <p className="muted">Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
    </div>
  );
}
