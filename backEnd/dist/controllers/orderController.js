"use strict";

const { query } = require("../config/database");
const path = require("path");
const fs = require("fs");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

// ------------------------ Helpers Rôles & SQL ------------------------
function isAdmin(req)    { return req.user?.role === "admin"; }
function isDentist(req)  { return req.user?.role === "dentiste"; }
function isUser(req)     { return req.user?.role === "user"; }

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
  });
}

// ------------------------ Helpers Stripe ------------------------
const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "MGA"]);
function fromStripeAmount(amount, currency) {
  const c = String(currency || "USD").toUpperCase();
  return ZERO_DECIMAL.has(c) ? Number(amount) : Number(amount) / 100;
}

// ------------------------ Status ------------------------
const NEXT_STATUS_BY_ROLE = {
  user: { panier:["en_attente"], en_attente:[], chez_dentiste:[], envoye_admin:[], valide_admin:[], terminee:[], annulee:[], paye:[], rembourse:[] },
  dentiste: { en_attente:["chez_dentiste"], chez_dentiste:["envoye_admin"], envoye_admin:[], valide_admin:[], terminee:[], panier:[], annulee:[], paye:[], rembourse:[] },
  admin: { en_attente:["chez_dentiste","annulee"], chez_dentiste:["envoye_admin","annulee"], envoye_admin:["valide_admin","annulee"], valide_admin:["terminee","annulee"], terminee:[], panier:["en_attente","annulee"], annulee:[], paye:["terminee"], rembourse:[] }
};
function canTransition(role, fromStatus, toStatus) {
  return NEXT_STATUS_BY_ROLE[role]?.[fromStatus]?.includes(toStatus) || false;
}

// ------------------------ CRUD ------------------------

// Créer une commande
exports.createOrder = async (req, res) => {
  try {
    const { patient_name, patient_sex, patient_age, work_type, sub_type, model, upper_teeth, lower_teeth, remark, clientId, total } = req.body;

    const upperTeethArray = upper_teeth ? JSON.parse(upper_teeth) : [];
    const lowerTeethArray = lower_teeth ? JSON.parse(lower_teeth) : [];

    // Dossier upload
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filePaths = Array.isArray(req.files) ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const authorUserId = req.user?.id || null;
    const authorRole   = req.user?.role || "user";

    let status = "panier";
    let dentistId = 1;

    if (authorRole === "user") status = "en_attente";
    else if (authorRole === "dentiste") status = "chez_dentiste";
    else if (authorRole === "admin") status = "envoye_admin";

    const sql = `
      INSERT INTO orders
      (userId, dentistId, patient_name, patient_sex, patient_age, work_type, sub_type, model,
       upper_teeth, lower_teeth, remark, clientId, total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      authorUserId, dentistId, patient_name || null, patient_sex || null, patient_age ? parseInt(patient_age) : null,
      work_type || null, sub_type || null, model || null,
      JSON.stringify(upperTeethArray), JSON.stringify(lowerTeethArray),
      remark || null, clientId ? parseInt(clientId) : null,
      total && !isNaN(Number(total)) ? Number(total) : 10.0,
      status
    ];
    const result = await queryAsync(sql, params);
    const orderId = result.insertId;

    // Ajout fichiers
    for (const f of req.files || []) {
      await queryAsync(
        "INSERT INTO order_files (orderId, storedName, originalName, url, uploadedBy, uploadedById) VALUES (?,?,?,?,?,?)",
        [orderId, f.filename, f.originalname, `/uploads/${f.filename}`, authorRole, authorUserId]
      );
    }

    // Récupération commande avec fichiers (JS aggregation)
    const [orderRows, fileRows] = await Promise.all([
      queryAsync("SELECT * FROM orders WHERE id = ?", [orderId]),
      queryAsync("SELECT * FROM order_files WHERE orderId = ?", [orderId])
    ]);
    const order = orderRows[0];
    order.files = fileRows;

    res.status(201).json(order);
  } catch (err) {
    console.error("Erreur createOrder:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Récupérer toutes les commandes
exports.getOrders = async (req, res) => {
  
  try {
    let orders;
    if (isAdmin(req) || isDentist(req)) {
      orders = await queryAsync("SELECT * FROM orders ORDER BY id DESC");
    } else {
      orders = await queryAsync("SELECT * FROM orders WHERE userId = ? ORDER BY id DESC", [req.user.id]);
    }

    // Récupérer tous les fichiers
    const files = await queryAsync("SELECT * FROM order_files");

    // Associer fichiers aux commandes
    const ordersWithFiles = orders.map(order => ({
      ...order,
      files: files.filter(f => f.orderId === order.id)
    }));


    res.json(ordersWithFiles);
  } catch (err) {
    console.error("Erreur getOrders:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Récupérer une commande par ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let orders;

    if (isAdmin(req) || isDentist(req)) {
      orders = await queryAsync("SELECT * FROM orders WHERE id = ?", [id]);
    } else {
      orders = await queryAsync("SELECT * FROM orders WHERE id = ? AND userId = ?", [id, req.user.id]);
    }

    if (!orders.length) return res.status(404).json({ error: "Commande introuvable" });

    const order = orders[0];
    const files = await queryAsync("SELECT * FROM order_files WHERE orderId = ?", [id]);
    order.files = files;

    res.json(order);
  } catch (err) {
    console.error("Erreur getOrderById:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Mettre à jour une commande
// Mettre à jour le statut d'une commande
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body; // ⚠️ Vérifier que tu récupères bien orderStatus
  if (!orderStatus) return res.status(400).json({ error: "orderStatus manquant" });

  try {
    const updated = await Order.update(
      { orderStatus },
      { where: { id } }
    );
    res.json({ message: "Commande mise à jour", updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};





// Supprimer une commande
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await queryAsync("DELETE FROM orders WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur deleteOrder:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// ------------------------ Webhook Stripe ------------------------
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Erreur signature webhook Stripe:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const orderId = session.metadata.orderId;

      console.log(`Paiement réussi pour la commande #${orderId}`);
      try {
        await queryAsync("UPDATE orders SET orderStatus = 'paye', updatedAt = NOW() WHERE id = ?", [orderId]);
        console.log(`Commande #${orderId} mise à jour en "paye"`);
      } catch (err) {
        console.error(`Erreur mise à jour commande #${orderId}:`, err.message);
      }
      break;

    default:
      console.log(`Événement Stripe non traité: ${event.type}`);
  }

  res.json({ received: true });
};
// ------------------------ Récupérer les fichiers d'une commande ------------------------
exports.getOrderFiles = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    // Vérifier que la commande existe
    const orders = await queryAsync("SELECT * FROM orders WHERE id = ?", [orderId]);
    if (!orders.length) return res.status(404).json({ error: "Commande introuvable" });
    const order = orders[0];

    // Vérification autorisation
    const role = req.user?.role;
    if (
      role !== "admin" &&
      role !== "dentiste" &&
      Number(order.userId) !== Number(req.user.id)
    ) return res.status(403).json({ error: "Non autorisé" });

    // Récupérer les fichiers depuis la table order_files
    const files = await queryAsync("SELECT * FROM order_files WHERE orderId = ?", [orderId]);

    // Préparer les URLs complètes pour le frontend
    const preparedFiles = files.map(f => ({
      ...f,
      url: f.url.startsWith("/uploads")
        ? `${process.env.API_URL || "http://localhost:3000"}${f.url}`
        : f.url
    }));

    res.json(preparedFiles);
  } catch (err) {
    console.error("Erreur getOrderFiles:", err);
    res.status(500).json({ error: "Impossible de récupérer les fichiers de la commande." });
  }
};
// Mettre à jour une commande (statut, patient, etc.)
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!orderId || orderId <= 0) return res.status(400).json({ error: "ID invalide" });

    const { status } = req.body; // <-- Le frontend doit envoyer { status: "terminee" }
    if (!status) return res.status(400).json({ error: "Statut requis" });

    // Vérifie si la commande existe
    const orders = await queryAsync("SELECT * FROM orders WHERE id = ?", [orderId]);
    if (!orders.length) return res.status(404).json({ error: "Commande introuvable" });

    const order = orders[0];
    const role = req.user?.role;

    // Vérifie si la transition est autorisée
    const allowedStatuses =  ["terminee"];
    if (!allowedStatuses.includes(status)) {
      return res.status(403).json({ error: "Transition non autorisée" });
    }

    // Met à jour le statut en base
    await queryAsync("UPDATE orders SET orderStatus = ?, updatedAt = NOW() WHERE id = ?", [status, orderId]);

    // Retourne la commande mise à jour avec fichiers
    const [updatedOrders, files] = await Promise.all([
      queryAsync("SELECT * FROM orders WHERE id = ?", [orderId]),
      queryAsync("SELECT * FROM order_files WHERE orderId = ?", [orderId])
    ]);

    const updatedOrder = updatedOrders[0];
    updatedOrder.files = files;

    res.json(updatedOrder);
  } catch (err) {
    console.error("[updateOrderStatus] error:", err);
    res.status(500).json({ error: "Impossible de mettre à jour la commande" });
  }
};


