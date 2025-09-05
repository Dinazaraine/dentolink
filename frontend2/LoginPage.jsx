import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { loginApi, registerApi } from "../auth/api";
import "./auth.css";

export default function AuthPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPw, setShowPw] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const loginMut = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      login(data.token, data.user);
      nav("/", { replace: true });
    },
  });

  const regMut = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      if (data?.token) {
        login(data.token, data.user);
        nav("/", { replace: true });
      } else {
        // si ton API renvoie juste un OK sans token
        setMode("login");
      }
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      loginMut.mutate(loginForm);
    } else {
      regMut.mutate(regForm);
    }
  };

  const isLoading = loginMut.isPending || regMut.isPending;
  const err =
    (loginMut.isError && (loginMut.error?.message || String(loginMut.error))) ||
    (regMut.isError && (regMut.error?.message || String(regMut.error))) ||
    "";

  return (
    <div className="auth-shell">
      {/* Bandeau gauche avec illustration / branding */}
      <aside className="auth-hero">
        <div className="brand">
          <div className="logo-dot" />
          <h1>DentoLink Admin</h1>
          <p>Plateforme sécurisée — gérez vos commandes et vos clients.</p>
        </div>
        <ul className="bullets">
          <li>🔐 Authentification sécurisée JWT</li>
          <li>⚡ Rapide et fluide (React + React Query)</li>
          <li>🧠 Expérience moderne & épurée</li>
        </ul>
        <div className="hero-credit">© {new Date().getFullYear()} — DentoLink</div>
      </aside>

      {/* Carte d'auth */}
      <main className="auth-main">
        <div className="glass-card">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
              type="button"
            >
              Se connecter
            </button>
            <button
              className={`tab ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
              type="button"
            >
              Créer un compte
            </button>
          </div>

          {/* Titre */}
          <h2 className="title">
            {mode === "login" ? "Bienvenue 👋" : "Créer votre compte ✨"}
          </h2>
          <p className="subtitle">
            {mode === "login"
              ? "Accédez à votre tableau de bord en toute sécurité."
              : "Renseignez vos informations pour démarrer."}
          </p>

          {/* Formulaire */}
          <form className="form" onSubmit={onSubmit}>
            {mode === "register" && (
              <div className="row">
                <div className="field">
                  <label>Prénom</label>
                  <input
                    value={regForm.firstName}
                    onChange={(e) =>
                      setRegForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    placeholder="Jean"
                    autoComplete="given-name"
                  />
                </div>
                <div className="field">
                  <label>Nom</label>
                  <input
                    value={regForm.lastName}
                    onChange={(e) =>
                      setRegForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    placeholder="Dupont"
                    autoComplete="family-name"
                  />
                </div>
              </div>
            )}

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={mode === "login" ? loginForm.email : regForm.email}
                onChange={(e) =>
                  mode === "login"
                    ? setLoginForm((f) => ({ ...f, email: e.target.value }))
                    : setRegForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="votre@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <label>Mot de passe</label>
              <div className="pw-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  value={mode === "login" ? loginForm.password : regForm.password}
                  onChange={(e) =>
                    mode === "login"
                      ? setLoginForm((f) => ({ ...f, password: e.target.value }))
                      : setRegForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Actions */}
            <button className="cta" disabled={isLoading}>
              {isLoading
                ? mode === "login"
                  ? "Connexion…"
                  : "Création…"
                : mode === "login"
                ? "Se connecter"
                : "Créer le compte"}
            </button>

            {!!err && <div className="error">{err}</div>}
          </form>

          {/* Pied */}
          <div className="switch">
            {mode === "login" ? (
              <span>
                Pas de compte ?{" "}
                <button className="linklike" onClick={() => setMode("register")} type="button">
                  Créer un compte
                </button>
              </span>
            ) : (
              <span>
                Déjà inscrit ?{" "}
                <button className="linklike" onClick={() => setMode("login")} type="button">
                  Se connecter
                </button>
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
