/**********************
 * PRODUITS – données *
 **********************/
const products = [
  // visuels réels dans /image/produitN.png
  { id: 1,  name: "Suite MAESTRO 3D",                price: 0.0, category: "appareil", description: "Conception/planif. numérique dentaire",        image: "images/produit1.png"  },
  { id: 2,  name: "Perforations Maxillaire",         price: 89.00,  category: "appareil", description: "Gabarits de perçage – zone maxillaire",      image: "images/produit2.png"  },
  { id: 3,  name: "Guide Chirurgical (All-on)",      price: 129.00, category: "appareil", description: "Guide multi-implants planifié 3D",            image: "images/produit3.png"  },
  { id: 4,  name: "Planification Implantaire 3D",    price: 159.00, category: "appareil", description: "Workflow CBCT + scan + planning",             image: "images/produit4.png"  },
  { id: 5,  name: "Set-up Occlusal Numérique",       price: 99.00,  category: "appareil", description: "Analyse occlusale – modèles 3D",             image: "images/produit5.png"  },
  { id: 6,  name: "Préparation Pilier Numérique",    price: 79.00,  category: "appareil", description: "Prépa pilier/abutment numérique",            image: "images/produit6.png"  },
  { id: 7,  name: "Inlay Core (exocad)",             price: 89.00,  category: "couronne", description: "Inlay-core sur mesure prêt usinage",         image: "images/produit7.png"  },
  { id: 8,  name: "Couronnes Anatomiques",           price: 119.00, category: "couronne", description: "Anatomiques – morphologie fidèle",           image: "images/produit8.png"  },
  { id: 9,  name: "Onlay Molaire Zircone",           price: 109.00, category: "couronne", description: "Onlay haute résistance – esthétique",        image: "images/produit9.png"  },
  { id: 10, name: "Facette Unitaire Antérieure",     price: 129.00, category: "couronne", description: "Facette veneer antérieure unitaire",         image: "images/produit10.png" },
  { id: 11, name: "Pilier Numérique – Modèle A",  price: 95.00,  category: "appareil", description: "Pilier personnalisé issu de planif 3D",      image: "images/produit11.png" },
  { id: 12, name: "Pilier Numérique – Modèle B",  price: 99.00,  category: "appareil", description: "Variante renforcée pour postérieur",         image: "images/produit12.png" },
];

/**************************
 * ÉTAT GLOBAL & DIVERS   *
 **************************/
let currentFilter = "all";
let filteredProducts = [...products];
let cart = JSON.parse(localStorage.getItem("ddlmCart")) || [];
const messages = JSON.parse(localStorage.getItem("ddlmMessages")) || [];
let chatOpen = false;

/******************************
 * NAV – Affichage des pages  *
 ******************************/
function showSection(sectionName) {
  // Masquer toutes les sections
  document.querySelectorAll(".section-content").forEach(sec => sec.style.display = "none");

  // Afficher seulement la section demandée
  const target = document.getElementById(sectionName);
  if (target) target.style.display = "block";

  // Afficher ou masquer le hero
  const heroSection = document.getElementById("heroSection");
  if (heroSection) {
    if (sectionName === "accueil") {
      heroSection.style.display = "block"; // visible uniquement sur Accueil
    } else {
      heroSection.style.display = "none";  // masqué ailleurs
    }
  }

  // Chargements dynamiques selon la section
  if (sectionName === "produits") renderProducts();
  if (sectionName === "checkout") updateOrderSummary();
  if (sectionName === "admin") updateAdminDashboard();

  // Fermer menu mobile/panier si ouverts
  const navbarCollapse = document.querySelector(".navbar-collapse");
  if (navbarCollapse && navbarCollapse.classList.contains("show")) navbarCollapse.classList.remove("show");
  if (document.getElementById("cartSidebar")?.classList.contains("open")) toggleCart();

  // Scroll en haut
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/************************
 * FILTRES & RENDU GRID *
 ************************/
function filterProducts(category, ev) {
  currentFilter = category;
  filteredProducts = (category === "all") ? [...products] : products.filter(p => p.category === category);

  // état visuel des boutons
  document.querySelectorAll(".filters .btn").forEach(b => b.classList.remove("active"));
  if (ev && ev.target) ev.target.classList.add("active");

  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  const data = filteredProducts;
  if (!data.length) {
    grid.innerHTML = `<div class="col-12 text-center text-muted">Aucun produit</div>`;
    return;
  }

  grid.innerHTML = data.map((p, i) => `
    <div class="col-12 col-sm-6 col-md-4 col-lg-3">
      <div class="product-card animate__animated animate__fadeInUp" style="animation-delay:${i * 0.05}s">
        <img
          src="${p.image}"
          alt="${p.name}"
          class="product-image"
          loading="lazy"
          onerror="this.onerror=null;this.src='images/produit1.png';"
          style="height:170px;object-fit:cover;border-radius:.5rem"
          onclick="openImageGallery(${p.id})"
        >
        <div class="product-info mt-2 text-center">
          <h6 class="mb-1">${p.name}</h6>
          <p class="text-muted mb-0" style="min-height:2.5em">${p.description}</p>
          <button class="btn btn-sm btn-outline-primary mt-2" onclick="openImageGallery(${p.id})">
            <i class="fas fa-images me-1"></i> Voir
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderServicesProducts() {
  const container = document.getElementById("services-products");
  if (!container) return;

  // Exemple : on affiche seulement 4 produits en vitrine
  const data = products.slice(0, 4);

  container.innerHTML = data.map((p, i) => `
    <div class="col-md-3">
      <div class="service-card animate__animated animate__fadeInUp" style="animation-delay:${i * 0.1}s">
        <img src="${p.image}" alt="${p.name}" class="service-image" style="height:150px;object-fit:cover;border-radius:.5rem"/>
        <div class="service-content text-center mt-2">
          <h6 class="mb-1">${p.name}</h6>
          <p class="text-muted small">${p.description}</p>
          <button class="btn btn-sm btn-outline-primary" onclick="openImageGallery(${p.id})">
            <i class="fas fa-images me-1"></i> Voir
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

/*****************
 * PANIER (UI)   *
 *****************/
function addToCart(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;

  const found = cart.find(i => i.id === productId);
  if (found) found.quantity += 1;
  else cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, quantity: 1 });

  updateCartUI();
  saveCart();
  showNotification(`${p.name} ajouté au panier !`);
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  updateCartUI(); saveCart();
}

function updateQuantity(productId, qty) {
  if (qty <= 0) return removeFromCart(productId);
  const it = cart.find(i => i.id === productId);
  if (it) { it.quantity = qty; updateCartUI(); saveCart(); }
}

function updateCartUI() {
  const cartBadge = document.getElementById("cartBadge");
  const cartContent = document.getElementById("cartContent");
  const cartTotal = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  if (cartBadge) cartBadge.textContent = totalItems;

  if (!cart.length) {
    cartContent.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
        <p>Votre panier est vide</p>
      </div>`;
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (cartTotal) cartTotal.textContent = "0.00€";
    return;
  }

  cartContent.innerHTML = cart.map(item => `
    <div class="cart-item d-flex align-items-center mb-3">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:1rem;">
      <div class="cart-item-info flex-grow-1">
        <div class="cart-item-name fw-bold">${item.name}</div>
        <div class="cart-item-price text-primary">${item.price.toFixed(2)}€</div>
        <div class="quantity-controls d-flex align-items-center mt-2">
          <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
          <input type="number" class="form-control form-control-sm mx-2" style="width:60px" value="${item.quantity}" min="1" onchange="updateQuantity(${item.id}, parseInt(this.value))">
          <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
          <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join("");

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  if (cartTotal) cartTotal.textContent = `${total.toFixed(2)}€`;
  if (checkoutBtn) checkoutBtn.disabled = false;
}

function toggleCart() {
  document.getElementById("cartSidebar").classList.toggle("open");
  document.getElementById("cartOverlay").classList.toggle("show");
}

function saveCart() {
  localStorage.setItem("ddlmCart", JSON.stringify(cart));
}

/*********************
 * GALERIE PRODUIT   *
 *********************/
function openImageGallery(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById("imageModal");
  const modalTitle = document.getElementById("imageModalTitle");
  const carouselImages = document.getElementById("carouselImages");

  modalTitle.textContent = product.name;

  // Duplique l'image (remplace par tes vues si tu en as plusieurs)
  const images = [product.image, product.image, product.image];

  carouselImages.innerHTML = images.map((img, idx) => `
    <div class="carousel-item ${idx === 0 ? "active" : ""}">
      <img src="${img}" alt="${product.name} - Vue ${idx + 1}" class="d-block w-100" style="height:400px;object-fit:cover;">
    </div>
  `).join("");

  const bsModal = window.bootstrap.Modal.getOrCreateInstance(modal);
  bsModal.show();
}

/***************
 * CHAT WIDGET *
 ***************/
function toggleChat() {
  const chatWidget = document.getElementById("chatWidget");
  chatOpen = !chatOpen;
  chatWidget.classList.toggle("open", chatOpen);
}

function sendMessage() {
  const chatInput = document.getElementById("chatInput");
  const message = chatInput.value.trim();
  if (!message) return;

  addMessageToChat(message, "user");
  chatInput.value = "";

  setTimeout(() => {
    const botResponse = getBotResponse(message);
    addMessageToChat(botResponse, "bot");
  }, 800);
}

function addMessageToChat(message, sender) {
  const chatMessages = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  messageDiv.innerHTML = `<div class="message-content"><p>${message}</p><span class="message-time">${time}</span></div>`;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotResponse(message) {
  const responses = {
    bonjour: "Bonjour! Comment puis-je vous aider avec nos services dentaires?",
    prix: "Nos prix varient selon les services. Les consultations commencent à 50€, les prothèses à partir de 150€.",
    livraison: "Livraison partout à Madagascar. Gratuite ≥ 100€.",
    garantie: "Tous nos produits sont garantis 2 ans.",
    "rendez-vous": "Pour un RDV : +261 34 12 345 67 ou via la page Contact.",
    default: "Merci pour votre message ! Un conseiller vous répondra très vite."
  };
  const msg = message.toLowerCase();
  for (const [k, v] of Object.entries(responses)) if (msg.includes(k)) return v;
  return responses.default;
}
function handleChatKeyPress(e) { if (e.key === "Enter") sendMessage(); }

/****************
 * CHECKOUT     *
 ****************/
function updateOrderSummary() {
  const orderSummary = document.getElementById("orderSummary");
  const subtotal = document.getElementById("subtotal");
  const tax = document.getElementById("tax");
  const finalTotal = document.getElementById("finalTotal");
  const shipping = document.getElementById("shipping");

  if (!cart.length) { orderSummary.innerHTML = '<p class="text-muted">Votre panier est vide</p>'; return; }

  const subtotalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxAmount = subtotalAmount * 0.2;
  const shippingCost = subtotalAmount >= 100 ? 0 : 15;
  const totalAmount = subtotalAmount + taxAmount + shippingCost;

  orderSummary.innerHTML = cart.map(i => `
    <div class="order-item d-flex justify-content-between mb-2">
      <div><strong>${i.name}</strong><br><small>Quantité: ${i.quantity}</small></div>
      <div>${(i.price * i.quantity).toFixed(2)}€</div>
    </div>`).join("");

  subtotal.textContent = `${subtotalAmount.toFixed(2)}€`;
  tax.textContent = `${taxAmount.toFixed(2)}€`;
  shipping.textContent = shippingCost === 0 ? "Gratuite" : `${shippingCost.toFixed(2)}€`;
  finalTotal.textContent = `${totalAmount.toFixed(2)}€`;
}

async function processPayment() {
  const form = document.getElementById("checkoutForm");
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Traitement en cours...';
  btn.disabled = true;

  const order = {
    id: Date.now(),
    date: new Date().toISOString(),
    customer: `${document.getElementById("firstName").value} ${document.getElementById("lastName").value}`,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    address: `${document.getElementById("address").value}, ${document.getElementById("city").value} ${document.getElementById("zipCode").value}`,
    items: [...cart],
    total: cart.reduce((s, i) => s + i.price * i.quantity, 0),
    status: "En attente"
  };

  try {
    const response = await fetch("http://localhost:3001/api/commandes", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order)
    });

    if (response.ok) {
      cart = []; updateCartUI(); saveCart();
      showNotification("✅ Commande envoyée au laboratoire avec succès !");
      form.reset();
      setTimeout(() => showSection("accueil"), 1500);
    } else {
      showNotification("❌ Une erreur est survenue lors de l'envoi.");
    }
  } catch (err) {
    console.error(err);
    showNotification("❌ Impossible de contacter le serveur.");
  }

  btn.innerHTML = originalText;
  btn.disabled = false;
}

/****************
 * CONTACT      *
 ****************/
function handleContactForm() {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm) return;

  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Envoi en cours...';
    submitBtn.disabled = true;

    const message = {
      id: Date.now(),
      date: new Date().toLocaleDateString("fr-FR"),
      name: document.getElementById("contactName").value,
      email: document.getElementById("contactEmail").value,
      phone: document.getElementById("contactPhone").value,
      subject: document.getElementById("contactSubject").value,
      message: document.getElementById("contactMessage").value,
      status: "Non lu",
    };

    messages.push(message);
    localStorage.setItem("ddlmMessages", JSON.stringify(messages));

    setTimeout(() => {
      showNotification("Votre message a été envoyé avec succès !");
      this.reset(); submitBtn.innerHTML = originalText; submitBtn.disabled = false;
    }, 1200);
  });
}

/****************
 * ADMIN        *
 ****************/
async function updateAdminDashboard() {
  try {
    const res = await fetch("http://localhost:3001/api/commandes");
    const commandes = await res.json();

    // stats
    const totalOrders = commandes.length;
    const pendingOrders = commandes.filter(o => o.status === "En attente").length;
    const completedOrders = commandes.filter(o => o.status === "Terminée").length;
    const totalRevenue = commandes.reduce((s, o) => s + (o.total || 0), 0);

    document.getElementById("totalOrders").textContent = totalOrders;
    document.getElementById("pendingOrders").textContent = pendingOrders;
    document.getElementById("completedOrders").textContent = completedOrders;
    document.getElementById("totalRevenue").textContent = `${totalRevenue.toFixed(2)}€`;

    // tableau
    const tbody = document.getElementById("ordersTableBody");
    tbody.innerHTML = commandes.length
      ? commandes.map((o, i) => `
          <tr>
            <td>#${i + 1}</td>
            <td>${new Date(o.date).toLocaleDateString()}</td>
            <td>${o.customer || "Inconnu"}</td>
            <td>${o.email || "—"}</td>
            <td>${(o.total ?? 0).toFixed(2)}€</td>
            <td><span class="badge ${o.status === "Terminée" ? "bg-success" : "bg-warning"}">${o.status || "En attente"}</span></td>
            <td>
              <button class="btn btn-sm btn-success" onclick="markOrderCompleted(${o.id})"><i class="fas fa-check"></i></button>
            </td>
          </tr>
        `).join("")
      : `<tr><td colspan="7" class="text-center text-muted">Aucune commande pour le moment</td></tr>`;
  } catch (err) {
    console.error("Erreur de récupération des commandes :", err);
    showNotification("❌ Impossible de charger les commandes.");
  }

  // messages
  const messagesTableBody = document.getElementById("messagesTableBody");
  messagesTableBody.innerHTML = messages.length
    ? messages.map(m => `
        <tr>
          <td>${m.date}</td><td>${m.name}</td><td>${m.email}</td><td>${m.subject}</td>
          <td>${m.message.substring(0, 50)}...</td>
          <td><button class="btn btn-sm btn-primary" onclick="viewMessage(${m.id})"><i class="fas fa-eye"></i></button></td>
        </tr>`).join("")
    : '<tr><td colspan="6" class="text-center text-muted">Aucun message pour le moment</td></tr>';
}

async function markOrderCompleted(orderId) {
  try {
    const res = await fetch(`http://localhost:3001/api/commandes/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Terminée" })
    });
    if (!res.ok) throw new Error("API non disponible");
    showNotification(`Commande #${orderId} marquée comme Terminée.`);
    updateAdminDashboard();
  } catch {
    const local = JSON.parse(localStorage.getItem("ddlmOrders")) || [];
    const found = local.find(o => o.id === orderId);
    if (found) found.status = "Terminée";
    localStorage.setItem("ddlmOrders", JSON.stringify(local));
    showNotification(`(Local) Commande #${orderId} marquée comme Terminée.`);
    updateAdminDashboard();
  }
}

function viewMessage(messageId) {
  const m = messages.find(x => x.id === messageId);
  if (m) alert(`Message de: ${m.name}\nEmail: ${m.email}\nSujet: ${m.subject}\n\n${m.message}`);
}

/*****************
 * UTILITAIRES   *
 *****************/
function showNotification(message) {
  const toast = document.getElementById("notificationToast");
  const toastMessage = document.getElementById("toastMessage");
  toastMessage.textContent = message;
  const bsToast = window.bootstrap.Toast.getOrCreateInstance(toast);
  bsToast.show();
}

function animateCounters() {
  document.querySelectorAll(".counter").forEach(counter => {
    const target = parseInt(counter.getAttribute("data-target"), 10) || 0;
    const step = Math.max(1, Math.round(target / 80));
    let current = 0;
    const tick = () => {
      current = Math.min(target, current + step);
      counter.textContent = current.toLocaleString();
      if (current < target) requestAnimationFrame(tick);
    };
    tick();
  });
}

function formatCardNumber(input) {
  const value = input.value.replace(/\s/g, "").replace(/[^0-9]/g, "");
  input.value = (value.match(/.{1,4}/g) || [value]).join(" ");
}

function formatExpiryDate(input) {
  let v = input.value.replace(/\D/g, "").slice(0,4);
  if (v.length >= 3) v = v.slice(0,2) + "/" + v.slice(2);
  input.value = v;
}

/*****************
 * INIT           *
 *****************/
document.addEventListener("DOMContentLoaded", () => {
  showSection("accueil");
  updateCartUI();
  handleContactForm();
  renderServicesProducts(); // 👈 Injection des produits en Services


  const cardNumberInput = document.getElementById("cardNumber");
  const expiryDateInput = document.getElementById("expiryDate");
  if (cardNumberInput) cardNumberInput.addEventListener("input", () => formatCardNumber(cardNumberInput));
  if (expiryDateInput) expiryDateInput.addEventListener("input", () => formatExpiryDate(expiryDateInput));

  // Observer simple pour fade-in / compteurs
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains("counter-item")) animateCounters();
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  document.querySelectorAll(".product-card, .feature-item, .counter-item").forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity .6s ease, transform .6s ease";
    observer.observe(el);
  });
});

// Effets header / overlay panier / paiement radio
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header-section");
  if (!header) return;
  if (window.scrollY > 100) {
    header.style.background = "rgba(255,255,255,0.95)";
    header.style.backdropFilter = "blur(10px)";
  } else {
    header.style.background = "#ffffff";
    header.style.backdropFilter = "none";
  }
});

document.addEventListener("click", (e) => {
  const cartSidebar = document.getElementById("cartSidebar");
  const cartLink = document.querySelector(".cart-link");
  if (cartSidebar && !cartSidebar.contains(e.target) && cartLink && !cartLink.contains(e.target) && cartSidebar.classList.contains("open")) {
    toggleCart();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.name === "paymentMethod") {
    const creditCardForm = document.getElementById("creditCardForm");
    if (creditCardForm) creditCardForm.style.display = (e.target.value === "credit") ? "block" : "none";
  }
});

/*****************
 * MULTILINGUE   *
 *****************/
const translations = {
  fr: {
    nav_home:"Accueil", nav_services:"Services", nav_produits:"Produits",
    nav_apropos:"À propos", nav_contact:"Contact", nav_connexion:"Connexion",
    hero_title:"Excellence en Prothèse Dentaire",
    hero_subtitle:"Laboratoire dentaire numérique de pointe à Madagascar...",
    discover_services:"Découvrir nos Services",
    welcome_title:"Bienvenue chez DENTOLINK Digital Dental Lab",
    welcome_text:"Laboratoire dentaire numérique de référence à Madagascar...",
    btn_services:"Nos Services", btn_contact:"Nous Contacter",
    produits_showcase:"Échantillons de nos Réalisations",
    produit_implants:"Implants Dentaires", produit_protheses:"Prothèses Complètes", produit_outils:"Équipements Spécialisés",
    contact_title:"Contactez-Nous", form_send:"Envoyer"
  },
  en: {
    nav_home:"Home", nav_services:"Services", nav_produits:"Products",
    nav_apropos:"About Us", nav_contact:"Contact", nav_connexion:"Login",
    hero_title:"Excellence in Dental Prosthetics",
    hero_subtitle:"State-of-the-art digital dental lab in Madagascar...",
    discover_services:"Discover our Services",
    welcome_title:"Welcome to DENTOLINK Digital Dental Lab",
    welcome_text:"Leading digital dental laboratory in Madagascar...",
    btn_services:"Our Services", btn_contact:"Contact Us",
    produits_showcase:"Samples of Our Work",
    produit_implants:"Dental Implants", produit_protheses:"Full Dentures", produit_outils:"Specialized Equipment",
    contact_title:"Contact Us", form_send:"Send"
  }
};

function setLanguage(lang) {
  localStorage.setItem("siteLang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

// Charger la langue enregistrée au démarrage
document.addEventListener("DOMContentLoaded", () => {
  setLanguage(localStorage.getItem("siteLang") || "fr");
});

