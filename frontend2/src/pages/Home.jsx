import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchClients } from "../features/clients/api.js";
import { fetchProducts } from "../features/products/api.js";
import { fetchOrders } from "../features/orders/api.js";
import Footer from "../layout/Footer.jsx";
import { FaCogs, FaTruck, FaUserTie, FaCheckCircle, FaShieldAlt, FaIndustry, FaPlus, FaUserPlus, FaShoppingBag, FaComments } from "react-icons/fa";

export default function Home() {
  const clientsQ = useQuery({ queryKey: ["clients"], queryFn: fetchClients, refetchOnMount: "always", refetchOnWindowFocus: false });
  const productsQ = useQuery({ queryKey: ["products"], queryFn: fetchProducts, refetchOnMount: "always", refetchOnWindowFocus: false });
  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: fetchOrders, refetchOnMount: "always", refetchOnWindowFocus: false });

  const clients  = Array.isArray(clientsQ.data)  ? clientsQ.data  : [];
  const products = Array.isArray(productsQ.data) ? productsQ.data : [];
  const orders   = Array.isArray(ordersQ.data)   ? ordersQ.data   : [];
  const loading = clientsQ.isLoading || productsQ.isLoading || ordersQ.isLoading;

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");

  const stats = useMemo(() => ({
    clients:  clients.length,
    products: products.length,
    orders:   orders.length,
    revenueEstimate: 0,
  }), [clients.length, products.length, orders.length]);

  const workSplit = useMemo(() => {
    const split = { conjointe: 0, amovible: 0, analyse_aligneur: 0, planification_implantaire: 0 };
    orders.forEach(o => { if (split[o.typeOfWork] != null) split[o.typeOfWork] += 1 });
    return split;
  }, [orders]);

  const totalWork = Object.values(workSplit).reduce((a,b)=>a+b,0);
  const pct = n => totalWork ? Math.round((n/totalWork)*100) : 0;

  const recentOrders = useMemo(() => {
    const byId = new Map(clients.map(c => [Number(c.id), c]));
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(o => ({
        id: o.id,
        typeOfWork: o.typeOfWork,
        createdAt: o.createdAt?.replace("T", " ").slice(0,16) ?? "",
        clientName: byId.get(Number(o.clientId)) ? `${byId.get(Number(o.clientId)).firstName} ${byId.get(Number(o.clientId)).lastName}` : `#${o.clientId}`,
        total: undefined
      }));
  }, [orders, clients]);

  const ddlmFeatures = [
    { title: "Diversité des services offerts", description: "Nous proposons une gamme élargie de produits, allant des couronnes dentaires, bridges, inlay-cores, aligneurs dentaires jusqu'aux guides chirurgicaux implantaires.", icon: <FaCogs /> },
    { title: "Délai de livraison rapide", description: "Fabrication et livraison chez le dentiste en aussi peu que 3 jours.", icon: <FaTruck /> },
    { title: "Service aux dentistes rapides", description: "Nos prothésistes se déplacent chez vous pour prendre et livrer vos commandes. Disponibles par téléphone dans l'Océan Indien.", icon: <FaUserTie /> },
    { title: "Qualité de nos produits", description: "Couronnes en zircon reconnues comme solides et durables.", icon: <FaCheckCircle /> },
    { title: "Garantie de nos produits", description: "Garantis 2 ans, retouches disponibles.", icon: <FaShieldAlt /> },
    { title: "Capacité de production", description: "Production jusqu'à 400 couronnes par mois. Partenariats possibles.", icon: <FaIndustry /> }
  ];

  const styles = {
    homeContainer: { padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif', position: 'relative' },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5e7eb', marginBottom: '24px', flexWrap: 'wrap' },
    navLinks: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    btn: { padding: '10px 14px', borderRadius: '10px', border: '1px solid transparent', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '.5rem', transition: '.2s ease' },
    btnPrimary: { background: 'linear-gradient(135deg, #7c5cff, #00c6ff)', color: '#fff', borderColor: 'transparent', boxShadow: '0 8px 20px rgba(124,92,255,.25)' },
    btnOutline: { background: 'transparent', borderColor: '#e5e7eb', color: '#1f2937' },
    chatWidget: { position: 'fixed', bottom: '20px', right: '20px', width: chatOpen ? '300px' : '60px', height: chatOpen ? '400px' : '60px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transition: 'all 0.3s', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    chatHeader: { padding: '10px', backgroundColor: '#7c5cff', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: '600' },
    chatMessages: { flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' },
    chatInputContainer: { display: 'flex', padding: '10px', borderTop: '1px solid #e5e7eb' },
    chatInput: { flex: 1, padding: '8px 10px', borderRadius: '10px', border: '1px solid #d1d5db' },
    chatSendBtn: { marginLeft: '6px', padding: '8px 12px', borderRadius: '10px', backgroundColor: '#7c5cff', color: '#fff', border: 'none', cursor: 'pointer' },
    chatMsgUser: { alignSelf: 'flex-end', backgroundColor: '#7c5cff', color: '#fff', padding: '6px 10px', borderRadius: '12px', maxWidth: '80%' },
    chatMsgBot: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb', color: '#111827', padding: '6px 10px', borderRadius: '12px', maxWidth: '80%' }
  };

  const sendMessage = () => {
    if (!inputMsg.trim()) return;
    const userMsg = { text: inputMsg, from: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');

    // réponse automatique instantanée
    const botReply = {
  text: `Bonjour ! Merci pour votre message 😊\nPour toute question ou assistance, vous pouvez nous contacter directement par email à sundev.energie@gmail.com ou par téléphone au +33 6 85 41 84 56. Nous serons ravis de vous aider !`,
  from: 'bot'
};

    setTimeout(() => setMessages(prev => [...prev, botReply]), 300); // léger délai pour effet de conversation
  };

  return (
    <div style={styles.homeContainer}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Bienvenue</h1>
        <div style={styles.navLinks}>
          <Link style={{...styles.btn, ...styles.btnOutline}} to="/clients">Gérer les clients</Link>
          <Link style={{...styles.btn, ...styles.btnOutline}} to="/products">Gérer les produits</Link>
          <Link style={{...styles.btn, ...styles.btnPrimary}} to="/orders">Créer une commande</Link>
          <button style={{...styles.btn, ...styles.btnPrimary}} onClick={() => setChatOpen(prev => !prev)}><FaComments /> Contacter</button>
        </div>
      </nav>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <KpiCard label="Clients" value={loading ? "…" : stats.clients} hint="Total clients actifs" icon={<PeopleIcon />} color="#7c5cff" />
        <KpiCard label="Produits" value={loading ? "…" : stats.products} hint="Catalogue disponible" icon={<BoxIcon />} color="#10b981" />
        <KpiCard label="Commandes" value={loading ? "…" : stats.orders} hint="Créées récemment" icon={<ReceiptIcon />} color="#facc15" />
      </div>

      {/* Pourquoi choisir la DDLM */}
      <section style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#fff' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '10px', color: '#111827' }}>Pourquoi nous choisir ? ✅</h2>
        <div style={{ height: '4px', width: '60px', background: 'linear-gradient(to right, #ec4899, #d946ef)', margin: '0 auto 20px auto' }} />
        <p style={{ maxWidth: '650px', margin: '0 auto 40px auto', color: '#6b7280', lineHeight: '1.6' }}>
          Nous sommes l'un des plus grands laboratoires dentaires , 100% numériques et assistés par ordinateur, offrant nos produits et services de sous-traitance aux laboratoires et dentistes de l'océan Indien.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          {ddlmFeatures.map((f, idx) => (
            <div key={idx} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left',
              background: '#f9fafb', borderRadius: '12px', padding: '20px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'pointer'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '1.5rem', color: '#d946ef', marginBottom: '10px' }}>{f.icon}</div>
              <h3 style={{ fontWeight: '700', fontSize: '1.125rem', marginBottom: '10px', color: '#111827' }}>{f.title}</h3>
              <p style={{ color: '#6b7280', lineHeight: '1.5' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chat Widget */}
      <div style={styles.chatWidget}>
        <div style={styles.chatHeader} onClick={() => setChatOpen(prev => !prev)}>
          Chat
          <span style={{ cursor: 'pointer' }}>{chatOpen ? '❌' : '💬'}</span>
        </div>
        {chatOpen && (
          <>
            <div style={styles.chatMessages}>
              {messages.map((m, i) => (
                <div key={i} style={m.from==='user'? styles.chatMsgUser : styles.chatMsgBot}>{m.text}</div>
              ))}
            </div>
            <div style={styles.chatInputContainer}>
              <input
                style={styles.chatInput}
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                placeholder="Écrire un message..."
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button style={styles.chatSendBtn} onClick={sendMessage}>Envoyer</button>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

/** KPI Component */
function KpiCard({ label, value, hint, icon, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '1rem', color:'#6b7280' }}>{label}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{value}</div>
        </div>
        <div style={{ fontSize: '2rem', color, backgroundColor: color + '1A', borderRadius:'50%', padding:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '.875rem', color:'#6b7280', marginTop:'8px' }}>{hint}</div>
    </div>
  );
}

/** Icônes */
function PeopleIcon(){ return <FaUserTie /> }
function BoxIcon(){ return <FaCogs /> }
function ReceiptIcon(){ return <FaTruck /> }
function CashIcon(){ return <FaShieldAlt /> }
function PlusIcon(){ return <FaPlus /> }
function UserPlusIcon(){ return <FaUserPlus /> }
function BagPlusIcon(){ return <FaShoppingBag /> }
