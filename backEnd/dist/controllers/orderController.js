"use strict";

const { query } = require("../config/database");
const path = require("path");
const fs = require("fs");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const PDFDocument = require("pdfkit");
const iconv = require("iconv-lite");
const nodemailer = require("nodemailer");

// ✅ Config du transporteur
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Erreur connexion SMTP :", error);
  } else {
    console.log("✅ Serveur prêt à envoyer des emails !");
  }
});

// ✅ Corrige l’encodage UTF-8
function normalizeFilename(name) {
  try {
    return iconv.decode(Buffer.from(name, "latin1"), "utf8");
  } catch {
    return name;
  }
}

// ✅ Nettoie le nom de fichier pour éviter les caractères problématiques
function safeFilename(name) {
  return name
    .normalize("NFD") // sépare accents
    .replace(/[\u0300-\u036f]/g, "") // supprime accents
    .replace(/[^a-zA-Z0-9._-]/g, "_"); // autres → underscore
}
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
  user: { panier:["en_attente"], en_attente:[], chez_dentiste:[], envoye_admin:[], terminee:[], terminee:[], annulee:[], paye:[], rembourse:[] },
  dentiste: { en_attente:["chez_dentiste"], chez_dentiste:["envoye_admin"], envoye_admin:[], terminee:[], terminee:[], panier:[], annulee:[], paye:[], rembourse:[] },
  admin: { en_attente:["chez_dentiste","annulee"], chez_dentiste:["envoye_admin","annulee"], envoye_admin:["terminee","annulee"], terminee:["terminee","annulee"], terminee:[], panier:["en_attente","annulee"], annulee:[], paye:["terminee"], rembourse:[] }
};
function canTransition(role, fromStatus, toStatus) {
  return NEXT_STATUS_BY_ROLE[role]?.[fromStatus]?.includes(toStatus) || false;
}
// ------------------------ Prix des produits ------------------------
const PRODUCT_PRICES = {
  Conjointe: {
    "Inlay core": 4.8, // 4 + 20%
    "Ilay onlay": 4.8,
    "Facette dentaire": 4.8,
    "Chape pour couronne": 4.8,
    "Couronne": 6.0, // 5 + 20%
  },
  Amovible: {
    "Sellite": 12.0, // 10 + 20%
  },
  Gouttières: {
    "Gouttière alligneur": 36.0, // 30 + 20%
  },
  Implant: {
    "Couronne sur Implant": 7.2, // 6 + 20%
    "Planification implantaire / Par dents": 4.8, // 4 + 20%
    "Guide Chirugicale": 24.0, // 20 + 20%
    "Piler personnalisée": 7.2, // 6 + 20%
    "All on 4/6 12dent avec fausse gencive": 78.0, // 65 + 20%
  },
};

// ------------------------ CRUD ------------------------

// Créer une commande
// controllers/orderController.js
// Créer une commande
// controllers/orderController.js
// ------------------------ CRUD ------------------------

// Créer une commande
// controllers/orderController.js
// controllers/orderController.js
exports.createOrder = async (req, res) => {
  try {
    console.log("🟢 [createOrder] req.body:", req.body);
    console.log("🟢 [createOrder] req.files:", req.files);

    // Champs patient
    const {
      patient_name,
      patient_sex,
      patient_age,
      model,
      remark,
      clientId,
    } = req.body;

    // ✅ Parse works (array JSON dans FormData)
    let works = [];
    try {
      works = JSON.parse(req.body.works || "[]");
      if (!Array.isArray(works)) works = [];
    } catch (err) {
      console.warn("⚠️ Impossible de parser works:", err.message);
      works = [];
    }

    // Vérifications minimales
    if (!patient_name || !patient_sex || !patient_age) {
      return res.status(400).json({ error: "Champs patient manquants" });
    }
    if (works.length === 0) {
      return res.status(400).json({ error: "Aucun travail fourni" });
    }

    // 🔹 Auteur / rôle
    const authorUserId = req.user?.id || null;
    const authorRole = req.user?.role || "user";
    const uploadedBy = authorRole === "dentiste" ? "dentist" : "user";
    const roleFolder = uploadedBy === "dentist" ? "dentists" : "users";

    // 🔹 Calcul prix total
    let total = 0;
    for (const w of works) {
      const wt = w.work_type || "";
      const st = w.sub_type || "";
      let price = 10.0; // prix par défaut
      if (PRODUCT_PRICES[wt] && PRODUCT_PRICES[wt][st]) {
        price = PRODUCT_PRICES[wt][st];
      }
      total += price;
    }

    // 🔹 Insertion commande principale
    const result = await queryAsync(
      `
      INSERT INTO orders 
        (userId, dentistId, patient_name, patient_sex, patient_age, 
         model, remark, clientId, total, orderStatus, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        authorUserId,
        1, // ⚠️ dentistId par défaut (adapter si nécessaire)
        patient_name,
        patient_sex,
        Number(patient_age) || null,
        model || null,
        remark || null,
        clientId ? parseInt(clientId) : null,
        total,
        "en_attente",
      ]
    );

    const orderId = result.insertId;

    // 🔹 Insertion des travaux (order_items)
    for (const w of works) {
      const wt = w.work_type || "";
      const st = w.sub_type || "";
      let price = 10.0;
      if (PRODUCT_PRICES[wt] && PRODUCT_PRICES[wt][st]) {
        price = PRODUCT_PRICES[wt][st];
      }

      await queryAsync(
  `INSERT INTO order_items (order_id, work_type, sub_type, price, upper_teeth, lower_teeth) 
   VALUES (?, ?, ?, ?, ?, ?)`,
  [
    orderId,
    wt,
    st,
    price,
    JSON.stringify(w.upper_teeth || []),
    JSON.stringify(w.lower_teeth || [])
  ]
);

    }

    // 🔹 Insertion des fichiers (order_files)
    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const f of req.files) {
        await queryAsync(
          `INSERT INTO order_files 
            (order_id, storedName, originalName, mimeType, size, url, uploadedBy, uploadedById, createdAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            orderId,
            f.filename,
            f.originalname,
            f.mimetype,
            f.size,
            `/uploads/${roleFolder}/${f.filename}`,
            uploadedBy,
            authorUserId,
          ]
        );
      }
    }

    res.status(201).json({ id: orderId, message: "Commande créée avec succès" });
  } catch (err) {
    console.error("[createOrder] error:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};




// Récupérer toutes les commandes

// ----------------------------------------------------
// 📌 GET ALL ORDERS
// ----------------------------------------------------
exports.getOrders = async (req, res) => {
  try {
    let orders;

    if (isAdmin(req) || isDentist(req)) {
      orders = await queryAsync("SELECT * FROM orders ORDER BY id DESC");
    } else {
      orders = await queryAsync(
        "SELECT * FROM orders WHERE userId = ? ORDER BY id DESC",
        [req.user.id]
      );
    }

    const files = await queryAsync("SELECT * FROM order_files");
    const items = await queryAsync("SELECT * FROM order_items");

    const ordersWithFiles = orders.map((order) => {
      const orderItems = items
        .filter((it) => it.order_id === order.id)
       .map((it) => ({
  ...it,
  upper_teeth: (() => {
    try {
      return JSON.parse(it.upper_teeth || "[]");
    } catch {
      return [];
    }
  })(),
  lower_teeth: (() => {
    try {
      return JSON.parse(it.lower_teeth || "[]");
    } catch {
      return [];
    }
  })(),
}));


      return {
        ...order,
        // Harmonisation statut
        status: order.orderStatus ?? order.status ?? null,
        orderStatus: order.orderStatus ?? order.status ?? null,
        paymentStatus: order.paymentStatus ?? null,
        works: orderItems,
        files: files.filter((f) => f.order_id === order.id).map(f => ({
          ...f,
          // normalisation URL si besoin
          previewUrl: f.url && f.url.startsWith("/")
            ? `${process.env.CLIENT_URL || "http://localhost:5173"}${f.url}`
            : f.url
        }))
      };
    });

    res.json(ordersWithFiles);
  } catch (err) {
    console.error("❌ Erreur getOrders:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// ----------------------------------------------------
// 📌 GET ORDER BY ID
// ----------------------------------------------------
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let orders;

    if (isAdmin(req) || isDentist(req)) {
      orders = await queryAsync("SELECT * FROM orders WHERE id = ?", [id]);
    } else {
      orders = await queryAsync(
        "SELECT * FROM orders WHERE id = ? AND userId = ?",
        [id, req.user.id]
      );
    }

    if (!orders.length) {
      return res.status(404).json({ error: "Commande introuvable" });
    }

    const order = orders[0];
    const files = await queryAsync("SELECT * FROM order_files WHERE order_id = ?", [id]);
    const items = await queryAsync("SELECT * FROM order_items WHERE order_id = ?", [id]);

    order.files = files.map(f => ({
      ...f,
      previewUrl: f.url && f.url.startsWith("/")
        ? `${process.env.CLIENT_URL || "http://localhost:5173"}${f.url}`
        : f.url
    }));

   order.works = items.map((it) => ({
  ...it,
  upper_teeth: (() => {
    try {
      return JSON.parse(it.upper_teeth || "[]");
    } catch {
      return [];
    }
  })(),
  lower_teeth: (() => {
    try {
      return JSON.parse(it.lower_teeth || "[]");
    } catch {
      return [];
    }
  })(),
}));


    // Ajout harmonisation statut
    order.status = order.orderStatus ?? order.status ?? null;
    order.orderStatus = order.orderStatus ?? order.status ?? null;
    order.paymentStatus = order.paymentStatus ?? null;

    res.json(order);
  } catch (err) {
    console.error("❌ Erreur getOrderById:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};


// Mettre à jour une commande
// Mettre à jour le statut d'une commande
// Mettre à jour une commande (générale)
// Cette méthode permet de mettre à jour différents champs de la commande,
// notamment les informations du patient, du travail, le montant total, etc.
// Elle gère également l'upload de nouveaux fichiers. Si `orderStatus` est
// présent dans le corps de la requête, il sera utilisé pour mettre à jour
// la colonne `status` de la commande.
// Mettre à jour une commande
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la commande existe
    const orders = await queryAsync("SELECT * FROM orders WHERE id = ?", [id]);
    if (!orders.length) {
      return res.status(404).json({ error: "Commande introuvable" });
    }
    const currentOrder = orders[0];

    const {
      patient_name,
      patient_sex,
      patient_age,
      model,
      remark,
      clientId,
      total,
      orderStatus,
      works, // ⚠️ tableau des travaux
    } = req.body || {};

    const updateParts = [];
    const updateParams = [];

    if (patient_name !== undefined) {
      updateParts.push("patient_name = ?");
      updateParams.push(patient_name || null);
    }
    if (patient_sex !== undefined) {
      updateParts.push("patient_sex = ?");
      updateParams.push(patient_sex || null);
    }
    if (patient_age !== undefined) {
      const ageNum =
        patient_age !== null && patient_age !== "" ? Number(patient_age) : null;
      updateParts.push("patient_age = ?");
      updateParams.push(!isNaN(ageNum) ? ageNum : null);
    }
    if (model !== undefined) {
      updateParts.push("model = ?");
      updateParams.push(model || null);
    }
    if (remark !== undefined) {
      updateParts.push("remark = ?");
      updateParams.push(remark || null);
    }
    if (clientId !== undefined) {
      const clientIdNum =
        clientId !== null && clientId !== "" ? Number(clientId) : null;
      updateParts.push("clientId = ?");
      updateParams.push(!isNaN(clientIdNum) ? clientIdNum : null);
    }
    if (total !== undefined) {
      const totalNum = total !== null && total !== "" ? Number(total) : null;
      updateParts.push("total = ?");
      updateParams.push(!isNaN(totalNum) ? totalNum : null);
    }
    if (orderStatus !== undefined) {
      updateParts.push("orderStatus = ?");
      updateParams.push(orderStatus);
    }

    if (updateParts.length) {
      updateParts.push("updatedAt = NOW()");
      await queryAsync(
        `UPDATE orders SET ${updateParts.join(", ")} WHERE id = ?`,
        [...updateParams, id]
      );
    }

    // 🔹 Mettre à jour les travaux si fournis
    if (works !== undefined) {
      try {
        const worksArray = Array.isArray(works)
          ? works
          : JSON.parse(works || "[]");

        // Supprimer les anciens travaux
        await queryAsync("DELETE FROM order_items WHERE order_id = ?", [id]);

        // Réinsertion des nouveaux
        for (const w of worksArray) {
          await queryAsync(
            `INSERT INTO order_items (order_id, work_type, sub_type, price, upper_teeth, lower_teeth) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              id,
              w.work_type || "",
              w.sub_type || "",
              Number(w.price) || 0,
              JSON.stringify(w.upper_teeth || []),
              JSON.stringify(w.lower_teeth || []),
            ]
          );
        }
      } catch (err) {
        console.error("❌ Erreur parsing works:", err.message);
      }
    }

    // 🔹 Upload fichiers dentiste / user
    const authorRole = req.user?.role || "user";
    const uploadedBy = authorRole === "dentiste" ? "dentist" : "user";
    const roleFolder = uploadedBy === "dentist" ? "dentists" : "users";
    const authorUserId = req.user?.id || null;

    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const f of req.files) {
        await queryAsync(
          `INSERT INTO order_files 
            (order_id, storedName, originalName, mimeType, size, url, uploadedBy, uploadedById, createdAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            id,
            f.filename,
            f.originalname,
            f.mimetype,
            f.size,
            `/uploads/${roleFolder}/${f.filename}`,
            uploadedBy,
            authorUserId,
          ]
        );
      }
    }

    // 🔹 Renvoyer commande mise à jour
    const [updatedOrders, fileRows, itemRows] = await Promise.all([
      queryAsync("SELECT * FROM orders WHERE id = ?", [id]),
      queryAsync("SELECT * FROM order_files WHERE order_id = ?", [id]),
      queryAsync("SELECT * FROM order_items WHERE order_id = ?", [id]),
    ]);

    const updatedOrder = updatedOrders[0];
    updatedOrder.files = fileRows || [];
    updatedOrder.works = (itemRows || []).map((it) => ({
      ...it,
      upper_teeth: (() => {
        try {
          return JSON.parse(it.upper_teeth || "[]");
        } catch {
          return [];
        }
      })(),
      lower_teeth: (() => {
        try {
          return JSON.parse(it.lower_teeth || "[]");
        } catch {
          return [];
        }
      })(),
    }));

    const s =
      updatedOrder.status ||
      updatedOrder.orderStatus ||
      orderStatus ||
      currentOrder.status;

    updatedOrder.status = s;
    updatedOrder.orderStatus = s;

    return res.json(updatedOrder);
  } catch (err) {
    console.error("[updateOrder] error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
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
// ------------------------ Webhook Stripe ------------------------
// ------------------------ Webhook Stripe ------------------------
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // ⚠️ Stripe nécessite le body brut (middleware express.raw)
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Erreur signature webhook Stripe:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ On ne traite que les paiements réussis
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentIntentId = session.payment_intent || session.id;

    // 🔹 Devise & montant
    const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "MGA"]);
    const currency = (session.currency || "eur").toUpperCase();
    const amount = ZERO_DECIMAL.has(currency)
      ? Number(session.amount_total)
      : Number(session.amount_total) / 100;

    try {
      if (session.metadata?.orderId) {
        // ✅ Cas 1 : paiement d'une seule commande
        const orderId = session.metadata.orderId;

        await queryAsync(
          `UPDATE orders 
           SET paymentStatus = 'paye', 
               paymentMethod = 'stripe', 
               transactionRef = ?, 
               updatedAt = NOW() 
           WHERE id = ?`,
          [paymentIntentId, orderId]
        );

        await queryAsync(
          `INSERT INTO payments (orderId, stripePaymentId, amount, currency, status) 
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, paymentIntentId, amount, currency, "success"]
        );

        console.log(`✅ Paiement confirmé pour commande #${orderId} (montant: ${amount} ${currency})`);
      }

      if (session.metadata?.orderIds) {
        // ✅ Cas 2 : paiement groupé
        const orderIds = session.metadata.orderIds.split(",").map((id) => id.trim());

        for (const orderId of orderIds) {
          await queryAsync(
            `UPDATE orders 
             SET paymentStatus = 'paye', 
                 paymentMethod = 'stripe', 
                 transactionRef = ?, 
                 updatedAt = NOW() 
             WHERE id = ?`,
            [paymentIntentId, orderId]
          );

          await queryAsync(
            `INSERT INTO payments (orderId, stripePaymentId, amount, currency, status) 
             VALUES (?, ?, ?, ?, ?)`,
            [orderId, paymentIntentId, amount, currency, "success"]
          );

          console.log(`✅ Paiement confirmé (multiple) pour commande #${orderId} (montant: ${amount} ${currency})`);
        }
      }
    } catch (err) {
      console.error("❌ Erreur mise à jour DB webhook:", err.message);
      return res.status(500).json({ error: "Erreur interne lors du traitement du webhook." });
    }
  }

  // Réponse obligatoire pour Stripe
  res.json({ received: true });
};




// --- Récupérer une commande brute par ID (pour Stripe) ---
exports.getOrderByIdRaw = async (id) => {
  const rows = await queryAsync("SELECT * FROM orders WHERE id = ?", [id]);
  return rows[0] || null;
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
const files = await queryAsync("SELECT * FROM order_files WHERE order_id = ?", [orderId]);

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
// controllers/orderController.js
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    if (!orderStatus) {
      return res.status(400).json({ error: "orderStatus manquant" });
    }

    // Vérifier que la commande existe
    const orders = await queryAsync("SELECT * FROM orders WHERE id = ?", [id]);
    if (!orders.length) {
      return res.status(404).json({ error: "Commande introuvable" });
    }

    // Tenter de mettre à jour les champs status et orderStatus ; si orderStatus n’existe pas, fallback
    try {
      await queryAsync(
  "UPDATE orders SET orderStatus = ?, updatedAt = NOW() WHERE id = ?",
  [orderStatus, id]
);

    } catch (err) {
      await queryAsync(
        "UPDATE orders SET orderStatus = ?, updatedAt = NOW() WHERE id = ?",
        [orderStatus, id]
      );
    }

    // Renvoyer la commande mise à jour avec ses fichiers
    const [updatedOrders, fileRows] = await Promise.all([
  queryAsync("SELECT * FROM orders WHERE id = ?", [id]),
  queryAsync("SELECT * FROM order_files WHERE order_id = ?", [id]), // ✅
]);
    const updatedOrder = updatedOrders[0];
    updatedOrder.files = fileRows || [];
    updatedOrder.status = orderStatus;
    updatedOrder.orderStatus = orderStatus;

    return res.json({
      message: "Commande mise à jour",
      ...updatedOrder,
    });
  } catch (err) {
    console.error("[updateOrderStatus] error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

// ------------------------ Génération de facture PDF ------------------------
exports.generateInvoiceMultiple = async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(",") : [];
    if (!ids.length) {
      return res.status(400).json({ error: "Aucune commande sélectionnée." });
    }

    const placeholders = ids.map(() => "?").join(",");

    // 🔹 Récupérer commandes + infos user
    const orders = await queryAsync(
      `SELECT o.*, 
              u.companyName, u.email AS user_email, u.phone_fixed, u.phone_mobile,
              u.siret, u.address, u.zipcode, u.city, u.country
       FROM orders o
       JOIN users u ON o.userId = u.id
       WHERE o.id IN (${placeholders})`,
      ids
    );

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: "Commandes introuvables." });
    }

    const items = await queryAsync(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
      ids
    );

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=facture-multiple.pdf");
    doc.pipe(res);

    // ==========================
    //   HEADER
    // ==========================
    try {
      doc.image("Dentolink.png", 50, 40, { width: 100 });
    } catch {
      doc.fontSize(16).fillColor("red").text("DENTOLINK", 50, 60);
    }

    // Titre centré
    doc.fontSize(20).fillColor("#1E3A8A").text("FACTURE", 0, 40, { align: "center" });
    doc.moveDown(2);

    // ==========================
    //   BLOCS FOURNISSEUR / CLIENT
    // ==========================
    const yStart = doc.y;

    // Fournisseur (à gauche)
    doc.fontSize(11).fillColor("#000").text("FOURNISSEUR :", 50, yStart);
    doc.fontSize(10).fillColor("#333");
    doc.text("DentoLink Digital Dental Lab", 50, yStart + 15);
    doc.text("Adresse: Niort, France / Antananarivo, Madagascar", 50);
    doc.text("Email: dentolink3@gmail.com", 50);
    doc.text("TVA intracom: FRXX999999999", 50);
    doc.text("SIRET: 123 456 789 00012", 50);

    // Client (à droite) → on prend le client de la première commande
    const client = orders[0];
    const xRight = 320;
    doc.fontSize(11).fillColor("#000").text("CLIENT :", xRight, yStart);
    doc.fontSize(10).fillColor("#333");
    doc.text(client.companyName || "N/A", xRight, yStart + 15);
    doc.text(`Email: ${client.user_email || "-"}`, xRight);
    if (client.phone_fixed) doc.text(`Tél (fixe): ${client.phone_fixed}`, xRight);
    if (client.phone_mobile) doc.text(`Tél (mobile): ${client.phone_mobile}`, xRight);
    if (client.siret) doc.text(`SIRET: ${client.siret}`, xRight);
    doc.text(
      `Adresse: ${client.address}, ${client.zipcode} ${client.city}, ${client.country}`,
      xRight,
      doc.y + 5,
      { width: 220 }
    );

    doc.moveDown(3);

    let grandTotal = 0;

    // ==========================
    //   DÉTAILS COMMANDES
    // ==========================
    for (const order of orders) {
      const orderItems = (items || []).filter((it) => it.order_id === order.id);
      const total = orderItems.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0);
      grandTotal += total;

      // --- Infos commande à droite ---
      doc
        .fontSize(12)
        .fillColor("#333")
        .text(`Commande #${order.id}`, 300, doc.y, { align: "right" });
      doc.fontSize(10).text(`Patient: ${order.patient_name || "N/A"}`, { align: "right" });
      doc.text(
        `Âge: ${order.patient_age || "-"} | Sexe: ${order.patient_sex || "-"}`,
        { align: "right" }
      );
      doc.text(`Statut commande: ${order.orderStatus || "-"}`, { align: "right" });
      doc.text(`Statut paiement: ${order.paymentStatus || "-"}`, { align: "right" });
      doc.moveDown(1);

      // --- Tableau travaux ---
      if (orderItems.length > 0) {
        doc.moveDown(1);

        const startY = doc.y;
        doc.font("Helvetica-Bold").fontSize(11);
        doc.text("Libellé", 50, startY);
        doc.text("Qté", 250, startY);
        doc.text("Prix U.", 320, startY);
        doc.text("Total", 420, startY);

        doc.moveDown(0.5);
        doc.font("Helvetica").fontSize(10);

        orderItems.forEach((it) => {
          const qty = it.quantity || 1;
          const unit = parseFloat(it.price) || 0;
          const lineTotal = qty * unit;

          const y = doc.y;
          doc.text(`${it.work_type} – ${it.sub_type || "N/A"}`, 50, y);
          doc.text(qty.toString(), 250, y);
          doc.text(`${unit.toFixed(2)} €`, 320, y);
          doc.text(`${lineTotal.toFixed(2)} €`, 420, y);
        });

        doc.moveDown(0.7);
        doc.font("Helvetica-Bold").text(`Sous-total: ${total.toFixed(2)} €`, {
          align: "right",
        });
        doc.font("Helvetica");
      } else {
        doc.text("Aucun travail associé.");
      }

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);
    }

    // ==========================
    //   RÉSUMÉ GLOBAL
    // ==========================
    const TVA_RATE = 0.20;
    const tva = grandTotal * TVA_RATE;
    const totalTTC = grandTotal + tva;

    doc.moveDown(2);
    doc.fontSize(12).fillColor("#000");
    doc.text(`Sous-total global: ${grandTotal.toFixed(2)} €`, { align: "right" });
    doc.text(`TVA (20%): ${tva.toFixed(2)} €`, { align: "right" });
    doc
      .fontSize(14)
      .fillColor("#1E3A8A")
      .text(`TOTAL TTC: ${totalTTC.toFixed(2)} €`, {
        align: "right",
        underline: true,
      });

    // ==========================
    //   PIED DE PAGE
    // ==========================
    doc.moveDown(2);
    doc.fontSize(9).fillColor("gray").text("Conditions de paiement: 30 jours nets.");
    doc.text("IBAN: FR76 3000 4000 5000 6000 7000 890");
    doc.text("BIC: BNPAFRPPXXX");
    doc.text("Cette facture est conforme aux normes fiscales européennes.");
    doc.moveDown(2);
    doc
      .fontSize(10)
      .fillColor("black")
      .text("Merci de votre confiance ", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("❌ Erreur facture multiple:", err);
    res.status(500).json({ error: "Impossible de générer la facture multiple." });
  }
};


// ------------------------ Génération de facture PDF avec logo et design ------------------------
exports.generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Vérifier que la commande existe
    const orders = await queryAsync("SELECT * FROM orders WHERE id = ?", [id]);
    if (!orders.length) {
      return res.status(404).json({ error: "Commande introuvable" });
    }
    const order = orders[0];

    // 🔹 Vérification autorisation
    if (
      req.user.role !== "admin" &&
      req.user.role !== "dentiste" &&
      String(order.userId) !== String(req.user.id)
    ) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    // 🔹 Créer le document PDF
    const doc = new PDFDocument({ margin: 40 });

    // Configurer headers HTTP
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=facture_commande_${order.id}.pdf`
    );
    doc.pipe(res);

    // --- Logo DentoLink ---
   // --- Logo DentoLink ---
// --- Logo DentoLink ---
const logoPath = path.join(__dirname, "/Dentolink.png");
try {
  doc.image(logoPath, 40, 30, { width: 100 }); // logo à gauche
} catch {
  doc
    .fontSize(18)
    .fillColor("#1E3A8A")
    .text("DENTOLINK PRO", 40, 50);
}

// --- En-tête société ---
doc
  .fontSize(22)
  .fillColor("#1E3A8A")
  .text("FACTURE", 0, 40, { align: "right", bold: true });

doc.moveDown(3);

// 🔹 Infos facture
doc.fontSize(12).fillColor("black");
doc.text(`Facture n°: ${order.id}`);
doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`);
doc.text(`Client ID: ${order.clientId || "N/A"}`);
doc.moveDown(2);

// --- Informations patient ---
doc
  .fontSize(14)
  .fillColor("#1E3A8A")
  .text("Informations patient", { underline: true });

doc.moveDown(0.5);
doc
  .fontSize(12)
  .fillColor("black")
  .text(`Nom : ${order.patient_name || "N/A"}`)
  .text(`Sexe : ${order.patient_sex || "N/A"}`)
  .text(`Âge : ${order.patient_age || "N/A"}`)
  .moveDown(2);

// --- Tableau des détails commande ---
doc
  .fontSize(14)
  .fillColor("#1E3A8A")
  .text("Détails de la commande", { underline: true });
doc.moveDown(0.5);

const startX = 50;
let y = doc.y + 10;

// 🔹 En-têtes du tableau
doc
  .rect(startX, y, 500, 25)
  .fill("#1E3A8A")
  .stroke()
  .fillColor("white")
  .fontSize(12)
  .text("Travail", startX + 10, y + 6, { width: 120 })
  .text("Sous-type", startX + 140, y + 6, { width: 150 })
  .text("Modèle", startX + 300, y + 6, { width: 100 })
  .text("Total (€)", startX + 420, y + 6, {
    width: 80,
    align: "right",
  });

y += 25;

// 🔹 Ligne commande
doc
  .rect(startX, y, 500, 25)
  .fill("#F9FAFB")
  .stroke()
  .fillColor("black")
  .fontSize(11)
  .text(order.work_type || "N/A", startX + 10, y + 7, { width: 120 })
  .text(order.sub_type || "N/A", startX + 140, y + 7, { width: 150 })
  .text(order.model || "-", startX + 300, y + 7, { width: 100 })
  .text(`${order.total || 0}`, startX + 420, y + 7, {
    width: 80,
    align: "right",
  });

y += 50;

// --- Résumé paiement ---
doc
  .fontSize(14)
  .fillColor("#1E3A8A")
  .text("Résumé paiement", { underline: true });
doc.moveDown(1);

// 🔹 Statuts en encadré
const boxX = startX;
let boxY = doc.y;
doc
  .rect(boxX, boxY, 500, 60)
  .stroke("#D1D5DB")
  .fillColor("white")
  .stroke();

doc
  .fontSize(12)
  .fillColor("black")
  .text("Statut commande :", boxX + 10, boxY + 10)
  .font("Helvetica-Bold")
  .fillColor("#1E40AF")
  .text(order.orderStatus || "en_cours", boxX + 150, boxY + 10);

doc
  .font("Helvetica")
  .fillColor("black")
  .text("Statut paiement :", boxX + 10, boxY + 30)
  .font("Helvetica-Bold")
  .fillColor(order.paymentStatus === "paye" ? "green" : "red")
  .text(order.paymentStatus || "panier", boxX + 150, boxY + 30);

doc.moveDown(5);

// --- Montant total ---
doc
  .fontSize(18)
  .fillColor("#16A34A")
  .text(`Total à payer : ${order.total || 0} €`, { align: "right" });

// --- Pied de page ---
doc.moveDown(4);
doc
  .fontSize(10)
  .fillColor("gray")
  .text(
    "Merci pour votre confiance avec DentoLink Pro.\nCette facture est générée automatiquement et n’a pas besoin de signature.",
    { align: "center" }
  );

doc.end();


  } catch (err) {
    console.error("Erreur génération facture:", err);
    res.status(500).json({ error: "Impossible de générer la facture." });
  }
};
// ------------------------ Messagerie temps réel ------------------------

// Envoi d’un message (sauvegarde DB + renvoi confirmation)
// ------------------------ Messagerie ------------------------

// Envoi d’un message (sauvegarde DB + notification + socket)
exports.sendMessage = async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user?.id;

    if (!from || !to || !message) {
      return res.status(400).json({ error: "Champs manquants (to, message)" });
    }

    // 🔹 Sauvegarde en base
    const result = await queryAsync(
      "INSERT INTO messages (senderId, receiverId, message) VALUES (?, ?, ?)",
      [from, to, message]
    );

    const insertedId = result.insertId;

    const [savedMessage] = await queryAsync(
      "SELECT * FROM messages WHERE id = ?",
      [insertedId]
    );

    // 🔹 Créer une notification pour le destinataire
    await queryAsync(
      `INSERT INTO notifications (userId, senderId, messageId, type, isRead)
       VALUES (?, ?, ?, 'message', 0)`,
      [to, from, insertedId]
    );

    // 🔹 Notifier en temps réel via socket.io
    if (req.io) {
      req.io.to(String(to)).emit("receive_message", savedMessage);
      req.io.to(String(to)).emit("new_notification", {
        from,
        message: savedMessage.message,
      });
    }

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error("❌ [sendMessage] error:", err);
    res.status(500).json({ error: "Impossible d’envoyer le message" });
  }
};

// Récupérer l’historique avec un utilisateur spécifique
exports.getMessagesWithUser = async (req, res) => {
  try {
    const myId = req.user?.id;
    const otherId = req.params.userId;

    if (!myId || !otherId) {
      return res.status(400).json({ error: "userId manquant" });
    }

    const rows = await queryAsync(
      `
      SELECT m.*, u1.firstName AS senderName, u2.firstName AS receiverName
      FROM messages m
      LEFT JOIN users u1 ON m.senderId = u1.id
      LEFT JOIN users u2 ON m.receiverId = u2.id
      WHERE (m.senderId = ? AND m.receiverId = ?)
         OR (m.senderId = ? AND m.receiverId = ?)
      ORDER BY m.createdAt ASC
      `,
      [myId, otherId, otherId, myId]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ [getMessagesWithUser] error:", err);
    res.status(500).json({ error: "Impossible de charger les messages" });
  }
};

// Récupérer la liste des dernières conversations (type Messenger)
exports.getConversations = async (req, res) => {
  try {
    const myId = req.user?.id;
    if (!myId) {
      return res.status(400).json({ error: "Utilisateur non connecté" });
    }

    const rows = await queryAsync(
      `
      SELECT m.id, m.message, m.createdAt,
             u.id AS otherId, u.firstName, u.lastName, u.is_online,
             (SELECT COUNT(*) FROM notifications n WHERE n.userId = ? AND n.senderId = u.id AND n.isRead = 0) AS unreadCount
      FROM messages m
      INNER JOIN (
        SELECT 
          CASE WHEN senderId = ? THEN receiverId ELSE senderId END as otherId,
          MAX(createdAt) as lastMsgDate
        FROM messages
        WHERE senderId = ? OR receiverId = ?
        GROUP BY otherId
      ) t ON (
          (m.senderId = ? AND m.receiverId = t.otherId)
          OR (m.senderId = t.otherId AND m.receiverId = ?)
        )
        AND m.createdAt = t.lastMsgDate
      INNER JOIN users u ON u.id = t.otherId
      ORDER BY m.createdAt DESC
      `,
      [myId, myId, myId, myId, myId, myId]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ [getConversations] error:", err);
    res.status(500).json({ error: "Impossible de charger les conversations" });
  }
};
// controllers/orderController.js
exports.payMultipleOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: "Liste des commandes vide" });
    }

    // Récupérer tous les items liés
    const placeholders = orderIds.map(() => "?").join(",");
    const items = await queryAsync(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
      orderIds
    );

    if (!items.length) {
      return res.status(404).json({ error: "Aucun travail trouvé pour ces commandes." });
    }

    // Préparer les line_items Stripe
    const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "MGA"]);
    const currency = (process.env.CHECKOUT_CURRENCY || "eur").toLowerCase();

    const line_items = items.map((it) => {
      const amount = Number(it.price) || 0;
      const unit_amount = ZERO_DECIMAL.has(currency.toUpperCase())
        ? Math.round(amount)
        : Math.round(amount * 100);

      return {
        price_data: {
          currency,
          product_data: {
            name: `${it.work_type} - ${it.sub_type || "N/A"} (Commande #${it.order_id})`,
          },
          unit_amount,
        },
        quantity: 1,
      };
    });

    // URL frontend
    const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const success_url = `${FRONTEND_URL}/orders?success=true`;
    const cancel_url = `${FRONTEND_URL}/orders?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url,
      cancel_url,
      metadata: { orderIds: orderIds.join(",") }, // important !
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ [payMultipleOrders] error:", err);
    res.status(500).json({ error: "Impossible de créer la session Stripe multiple" });
  }
};

