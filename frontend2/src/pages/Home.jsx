import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchClients } from "../features/clients/api.js";
import { fetchProducts } from "../features/products/api.js";
import { fetchOrders } from "../features/orders/api.js";
import {
  FaCogs, FaTruck, FaUserTie, FaCheckCircle, FaShieldAlt, FaIndustry, FaComments
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Home() {
  const clientsQ  = useQuery({ queryKey: ["clients"],  queryFn: fetchClients,  refetchOnMount: "always", refetchOnWindowFocus: false });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: fetchProducts, refetchOnMount: "always", refetchOnWindowFocus: false });
  const ordersQ   = useQuery({ queryKey: ["orders"],   queryFn: fetchOrders,   refetchOnMount: "always", refetchOnWindowFocus: false });

  const clients  = Array.isArray(clientsQ.data)  ? clientsQ.data  : [];
  const products = Array.isArray(productsQ.data) ? productsQ.data : [];
  const orders   = Array.isArray(ordersQ.data)   ? ordersQ.data   : [];
  const loading  = clientsQ.isLoading || productsQ.isLoading || ordersQ.isLoading;

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");

  const stats = useMemo(() => ({
    clients:  clients.length,
    products: products.length,
    orders:   orders.length,
    revenueEstimate: 0,
  }), [clients.length, products.length, orders.length]);

  const ddlmFeatures = [
    { title: "Diversité des services", description: "Couronnes, bridges, inlay-cores, aligneurs, guides chirurgicaux…", icon: <FaCogs /> },
    { title: "Livraison rapide", description: "Fabrication et livraison en 3 jours seulement.", icon: <FaTruck /> },
    { title: "Service aux dentistes", description: "Prothésistes disponibles sur site et par téléphone.", icon: <FaUserTie /> },
    { title: "Qualité reconnue", description: "Couronnes en zircon solides et durables.", icon: <FaCheckCircle /> },
    { title: "Garantie 2 ans", description: "Avec retouches disponibles.", icon: <FaShieldAlt /> },
    { title: "Capacité de production", description: "Jusqu’à 400 couronnes/mois.", icon: <FaIndustry /> }
  ];

  const sendMessage = () => {
    if (!inputMsg.trim()) return;
    const userMsg = { text: inputMsg, from: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg("");

    const botReply = {
      text: `Bonjour 👋 Merci pour votre message !\nContactez-nous : sundev.energie@gmail.com ou +33 6 85 41 84 56.`,
      from: "bot"
    };
    setTimeout(() => setMessages(prev => [...prev, botReply]), 400);
  };

  return (
    <div className="container py-4">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light border-bottom mb-4">
        <div className="container-fluid">
          <h1 className="navbar-brand fw-bold">Bienvenue</h1>
          
        </div>
      </nav>

      {/* KPIs */}
      <div className="row g-3 mb-5">
        <KpiCard label="Clients"   value={loading ? "…" : stats.clients}  hint="Total clients actifs" color="primary"  icon={<FaUserTie />} />
        <KpiCard label="Produits"  value={loading ? "…" : stats.products} hint="Catalogue disponible" color="success"  icon={<FaCogs />} />
        <KpiCard label="Commandes" value={loading ? "…" : stats.orders}   hint="Créées récemment"    color="warning"  icon={<FaTruck />} />
      </div>

      {/* Pourquoi nous choisir */}
      <section className="text-center py-5 bg-white">
        <h2 className="fw-bold mb-3">Pourquoi nous choisir ? ✅</h2>
        <div className="mx-auto mb-4" style={{ width: "60px", height: "4px", background: "linear-gradient(to right,#ec4899,#d946ef)" }} />
        <p className="text-muted mb-5" style={{ maxWidth: "650px", margin: "0 auto" }}>
          L’un des plus grands laboratoires dentaires 100% numériques, proposant nos services de sous-traitance aux laboratoires et dentistes de l’Océan Indien.
        </p>
        <div className="row g-4">
          {ddlmFeatures.map((f, idx) => (
            <div className="col-md-4" key={idx}>
              <div className="card h-100 shadow-sm border-0 p-3 text-start">
                <div className="fs-3 text-primary mb-2">{f.icon}</div>
                <h5 className="fw-bold">{f.title}</h5>
                <p className="text-muted">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chat Widget */}
      <div
        className="position-fixed shadow"
        style={{
          bottom: "20px", right: "20px",
          width: chatOpen ? "320px" : "60px",
          height: chatOpen ? "400px" : "60px",
          borderRadius: "20px", overflow: "hidden",
          backgroundColor: "#fff", transition: "all 0.3s"
        }}
      >
        <div
          className="bg-primary text-white d-flex justify-content-between align-items-center px-3 py-2"
          style={{ cursor: "pointer" }}
          onClick={() => setChatOpen(!chatOpen)}
        >
          <span>Chat</span>
          <span>{chatOpen ? "❌" : "💬"}</span>
        </div>
        {chatOpen && (
          <>
            <div className="p-2 flex-grow-1 overflow-auto" style={{ height: "300px" }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-2 p-2 rounded ${m.from === "user" ? "bg-primary text-white ms-auto" : "bg-light text-dark me-auto"}`}
                  style={{ maxWidth: "80%" }}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <div className="d-flex p-2 border-top">
              <input
                className="form-control"
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                placeholder="Écrire un message…"
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <button className="btn btn-primary ms-2" onClick={sendMessage}>Envoyer</button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

/** KPI Card avec Bootstrap */
function KpiCard({ label, value, hint, color, icon }) {
  return (
    <div className="col-md-4">
      <div className="card shadow-sm h-100">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <div className="text-muted">{label}</div>
            <div className="fs-4 fw-bold">{value}</div>
            <small className="text-muted">{hint}</small>
          </div>
          <div className={`fs-2 text-${color}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
