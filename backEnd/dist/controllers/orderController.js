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
transporter.verify((error) => {
  if (error) {
    console.error("❌ Erreur connexion SMTP :", error);
  } else {
    console.log("✅ Serveur prêt à envoyer des emails !");
  }
});

// ✅ Fonction utilitaire pour envoyer un email
// ✅ Fonction utilitaire pour envoyer un email
async function sendEmail(to, subject, html, attachments = []) {
  try {
    await transporter.sendMail({
      from: `"DentoLink Pro" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments, // ✅ permet d’envoyer des pièces jointes
    });
    console.log("📧 Email envoyé à", to);
  } catch (err) {
    console.error("❌ Erreur envoi email:", err.message);
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
        1, // ⚠️ dentistId par défaut
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
          JSON.stringify(w.lower_teeth || []),
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

    // 🔹 Récup infos pour email
    const [userRows, items, files] = await Promise.all([
      queryAsync("SELECT * FROM users WHERE id = ?", [authorUserId]),
      queryAsync("SELECT * FROM order_items WHERE order_id = ?", [orderId]),
      queryAsync("SELECT * FROM order_files WHERE order_id = ?", [orderId]),
    ]);

    const user = userRows[0] || {};

    // ✅ Construire le tableau des travaux
    let worksRows = items
      .map((it) => {
        const upper = JSON.parse(it.upper_teeth || "[]").join(", ") || "-";
        const lower = JSON.parse(it.lower_teeth || "[]").join(", ") || "-";
        return `
        <tr>
          <td style="border:1px solid #ddd;padding:8px;">${it.work_type}</td>
          <td style="border:1px solid #ddd;padding:8px;">${it.sub_type || "-"}</td>
          <td style="border:1px solid #ddd;padding:8px;">${upper}</td>
          <td style="border:1px solid #ddd;padding:8px;">${lower}</td>
          <td style="border:1px solid #ddd;padding:8px;text-align:right;">${Number(
            it.price || 0
          ).toFixed(2)} €</td>
        </tr>`;
      })
      .join("");

    // ✅ Construire la liste des fichiers (liens de téléchargement)
    const API_BASE = process.env.API_URL || "http://localhost:3000";
    let fileLis =
      files.length > 0
        ? files
            .map(
              (f) =>
                `<li><a href="${API_BASE}${f.url}" target="_blank">${f.originalName}</a> (${Math.round(
                  f.size / 1024
                )} Ko)</li>`
            )
            .join("")
        : "<li>Aucun fichier joint</li>";

    // ✅ Email complet (dentolink)
    const emailHtmlDentolink = `
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
        <h2 style="color:#1E3A8A;">Nouvelle commande #${orderId}</h2>

        <h3>👤 Patient</h3>
        <p>
          <b>Nom :</b> ${patient_name}<br/>
          <b>Sexe :</b> ${patient_sex}<br/>
          <b>Âge :</b> ${patient_age}<br/>
          <b>Modèle :</b> ${model || "-"}<br/>
          <b>Remarque :</b> ${remark || "-"}
        </p>

        <h3>🏢 Client</h3>
        <p>
          <b>Société :</b> ${user.companyName || "-"}<br/>
          <b>Email :</b> ${user.email || "-"}<br/>
          <b>Téléphone fixe :</b> ${user.phone_fixed || "-"}<br/>
          <b>Téléphone mobile :</b> ${user.phone_mobile || "-"}<br/>
          <b>Adresse :</b> ${user.address || "-"}, ${user.zipcode || ""} ${user.city || ""}, ${user.country || ""}
        </p>

        <h3>🛠 Travaux</h3>
        <table style="border-collapse:collapse;width:100%;margin-bottom:15px;">
          <thead>
            <tr style="background:#1E3A8A;color:white;">
              <th style="border:1px solid #ddd;padding:8px;">Type</th>
              <th style="border:1px solid #ddd;padding:8px;">Sous-type</th>
              <th style="border:1px solid #ddd;padding:8px;">Dents Haut</th>
              <th style="border:1px solid #ddd;padding:8px;">Dents Bas</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:right;">Prix (€)</th>
            </tr>
          </thead>
          <tbody>
            ${worksRows}
          </tbody>
        </table>

        <h3>📂 Fichiers (cliquez pour télécharger)</h3>
        <ul>${fileLis}</ul>

        <h3>💰 Total</h3>
        <p style="font-size:16px;font-weight:bold;color:#16A34A;">${total.toFixed(
          2
        )} €</p>
      </div>
    `;

    // ✅ Email simplifié (sundev) → sans bloc Client
    const emailHtmlSundev = `
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
        <h2 style="color:#1E3A8A;">Nouvelle commande #${orderId}</h2>

        <h3>👤 Patient</h3>
        <p>
          <b>Nom :</b> ${patient_name}<br/>
          <b>Sexe :</b> ${patient_sex}<br/>
          <b>Âge :</b> ${patient_age}<br/>
          <b>Modèle :</b> ${model || "-"}<br/>
          <b>Remarque :</b> ${remark || "-"}
        </p>

        <h3>🛠 Travaux</h3>
        <table style="border-collapse:collapse;width:100%;margin-bottom:15px;">
          <thead>
            <tr style="background:#1E3A8A;color:white;">
              <th style="border:1px solid #ddd;padding:8px;">Type</th>
              <th style="border:1px solid #ddd;padding:8px;">Sous-type</th>
              <th style="border:1px solid #ddd;padding:8px;">Dents Haut</th>
              <th style="border:1px solid #ddd;padding:8px;">Dents Bas</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:right;">Prix (€)</th>
            </tr>
          </thead>
          <tbody>
            ${worksRows}
          </tbody>
        </table>

        <h3>📂 Fichiers (cliquez pour télécharger)</h3>
        <ul>${fileLis}</ul>

        <h3>💰 Total</h3>
        <p style="font-size:16px;font-weight:bold;color:#16A34A;">${total.toFixed(
          2
        )} €</p>
      </div>
    `;

    // 🔹 Envoi email complet (dentolink)
    await sendEmail(
      "dentolink3@gmail.com",
      `Nouvelle commande #${orderId}`,
      emailHtmlDentolink
    );

    // 🔹 Envoi email simplifié (sundev)
    await sendEmail(
      "dentallabmg@gmail.com",
      `Nouvelle commande #${orderId}`,
      emailHtmlSundev
    );

    res
      .status(201)
      .json({ id: orderId, message: "Commande créée avec succès" });
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
// controllers/orderController.js
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // ⚠️ Nécessite app.post('/api/orders/webhook', express.raw({ type: 'application/json' }), ...)
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Erreur signature webhook Stripe:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Devise (pour enregistrement payments)
    const currency = (session.currency || "eur").toUpperCase();

    try {
      // --- Paiement d'UNE commande ---
      if (session.metadata?.orderId) {
        const orderId = session.metadata.orderId;

        // Total de la commande basé sur la DB (somme des items)
        const rows = await queryAsync(
          `SELECT SUM(price) AS total FROM order_items WHERE order_id = ?`,
          [orderId]
        );
        const amount = Number(rows?.[0]?.total || 0);

        await queryAsync(
          `UPDATE orders
             SET paymentStatus = 'paye',
                 paymentMethod = 'stripe',
                 transactionRef = ?,
                 updatedAt = NOW()
           WHERE id = ?`,
          [session.payment_intent || session.id, orderId]
        );

        await queryAsync(
  `INSERT INTO payments (orderId, stripePaymentId, amount, currency, status, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, NOW(), NOW())
   ON DUPLICATE KEY UPDATE 
     status = VALUES(status),
     updatedAt = NOW()`,
  [orderId, paymentIntentId, amount, currency, "success"]
);


        console.log(`✅ Paiement confirmé (single) #${orderId} – total DB: ${amount.toFixed(2)} ${currency}`);
      }

      // --- Paiement MULTIPLE ---
      if (session.metadata?.orderIds) {
        const orderIds = session.metadata.orderIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (orderIds.length) {
          const placeholders = orderIds.map(() => "?").join(",");
          // Totaux par commande depuis DB
          const totals = await queryAsync(
            `SELECT order_id, SUM(price) AS total
               FROM order_items
              WHERE order_id IN (${placeholders})
              GROUP BY order_id`,
            orderIds
          );

          // Indexer par order_id
          const totalByOrder = new Map(
            totals.map((r) => [String(r.order_id), Number(r.total || 0)])
          );

          for (const orderId of orderIds) {
            const amount = totalByOrder.get(String(orderId)) || 0;

            await queryAsync(
              `UPDATE orders
                 SET paymentStatus = 'paye',
                     paymentMethod = 'stripe',
                     transactionRef = ?,
                     updatedAt = NOW()
               WHERE id = ?`,
              [session.payment_intent || session.id, orderId]
            );

            await queryAsync(
              `INSERT INTO payments (orderId, stripePaymentId, amount, currency, status)
               VALUES (?, ?, ?, ?, ?)`,
              [orderId, session.payment_intent || session.id, amount, currency, "success"]
            );

            console.log(`✅ Paiement confirmé (multiple) #${orderId} – total DB: ${amount.toFixed(2)} ${currency}`);
          }
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
// Mettre à jour une commande (statut, paiement, etc.)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    if (!orderStatus && !paymentStatus) {
      return res.status(400).json({ error: "orderStatus ou paymentStatus manquant" });
    }

    // Vérifier que la commande existe
    const orders = await queryAsync("SELECT * FROM orders WHERE id = ?", [id]);
    if (!orders.length) {
      return res.status(404).json({ error: "Commande introuvable" });
    }
    const currentOrder = orders[0];

    // 🔹 Mise à jour DB
    const updateParts = [];
    const params = [];

    if (orderStatus) {
      updateParts.push("orderStatus = ?");
      params.push(orderStatus);
    }
    if (paymentStatus) {
      updateParts.push("paymentStatus = ?");
      params.push(paymentStatus);
    }

    if (updateParts.length) {
      updateParts.push("updatedAt = NOW()");
      await queryAsync(
        `UPDATE orders SET ${updateParts.join(", ")} WHERE id = ?`,
        [...params, id]
      );
    }

    // 🔹 Récupérer commande mise à jour
    const [updatedOrders, fileRows] = await Promise.all([
      queryAsync("SELECT * FROM orders WHERE id = ?", [id]),
      queryAsync("SELECT * FROM order_files WHERE order_id = ?", [id]),
    ]);
    const updatedOrder = updatedOrders[0];
    updatedOrder.files = fileRows || [];

    // ✅ Envoi email si statut important
    if (orderStatus === "en_cours") {
      const subject = `Commande #${id} en cours`;
      const html = `<h3>Commande en cours</h3>
         <p>La commande <b>#${id}</b> est passée en statut <b>en_cours</b>.</p>
         <p>Patient : ${currentOrder.patient_name || "N/A"}</p>`;

      await sendEmail("dentolink3@gmail.com", subject, html);
      await sendEmail("dentallabmg@gmail.com", subject, html);
    }

    if (paymentStatus === "paye") {
      const subject = `Commande #${id} payée`;
      const html = `<h3>Paiement reçu</h3>
         <p>La commande <b>#${id}</b> a été marquée comme <b>payée</b>.</p>
         <p>Montant total : ${currentOrder.total || 0} €</p>`;

      await sendEmail("dentolink3@gmail.com", subject, html);
      await sendEmail("dentallabmg@gmail.com", subject, html);
    }

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
const { PassThrough } = require("stream");

exports.generateInvoiceMultiple = async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(",") : [];
    if (!ids.length) {
      return res.status(400).json({ error: "Aucune commande sélectionnée." });
    }

    const placeholders = ids.map(() => "?").join(",");

    // 🔹 Commandes + infos utilisateur
    const orders = await queryAsync(
      `SELECT o.*, 
              u.id AS u_id, u.companyName, u.email AS user_email, u.phone_fixed, u.phone_mobile,
              u.siret, u.address, u.zipcode, u.city, u.country
       FROM orders o
       JOIN users u ON o.userId = u.id
       WHERE o.id IN (${placeholders})`,
      ids
    );
    if (!orders.length) {
      return res.status(404).json({ error: "Commandes introuvables." });
    }

    // 🔹 Items
    const items = await queryAsync(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
      ids
    );

    // === PARAMS TVA ===
    const VAT_RATE = 0.20; // 20%
    const to2 = (n) => Number(n || 0).toFixed(2);

    // -------------------------------
    // 1) Création du PDF (double pipe: HTTP + email)
    // -------------------------------
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // → HTTP
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=facture-multiple.pdf");
    doc.pipe(res);

    // → Email
    const emailStream = new PassThrough();
    const chunks = [];
    emailStream.on("data", (c) => chunks.push(c));
    emailStream.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      // Clients uniques (par userId)
      const uniqueClientsMap = new Map();
      for (const o of orders) {
        uniqueClientsMap.set(o.u_id, {
          companyName: o.companyName || "-",
          email: o.user_email || "-",
          phone: o.phone_fixed || o.phone_mobile || "-",
          siret: o.siret || "-",
          address: `${o.address || "-"}, ${o.zipcode || ""} ${o.city || ""}, ${o.country || ""}`.replace(/\s+/g," ").trim()
        });
      }
      const uniqueClients = Array.from(uniqueClientsMap.values());

      const clientsHtml = uniqueClients
        .map(
          (c) => `
            <li>
              <b>${c.companyName}</b><br/>
              Email: ${c.email}<br/>
              Tél: ${c.phone}<br/>
              SIRET: ${c.siret}<br/>
              Adresse: ${c.address}
            </li>`
        )
        .join("");

      const emailHtml = `
        <div style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
          <h2 style="color:#1E3A8A;margin:0 0 6px;">Facture multiple générée</h2>
          <p style="margin:0 0 12px;">Commandes: ${ids.join(", ")}</p>
          <h3 style="margin:12px 0 6px;">Clients</h3>
          <ul>${clientsHtml}</ul>
        </div>`;

      try {
        await sendEmail(
          "dentolink3@gmail.com",
          "Nouvelle facture générée",
          emailHtml,
          [{ filename: "facture-multiple.pdf", content: pdfBuffer }]
        );
        console.log("📧 Facture envoyée à dentolink3@gmail.com");
      } catch (err) {
        console.error("❌ Erreur envoi facture email:", err.message);
      }
    });
    doc.pipe(emailStream);

    // ==========================
    //   CONTENU FACTURE (PDF)
    // ==========================

    // --- Logo ou fallback texte ---
 try {
  const logoPath = path.join(__dirname, "Dentolink.png"); // 🔹 chemin absolu
  doc.image(logoPath, 50, 40, { width: 100 });
} catch (err) {
  console.error("⚠️ Impossible de charger le logo:", err.message);
  doc.fontSize(18).fillColor("red").text("DENTOLINK", 50, 60);
}
    doc.moveDown(3);

    // --- Fournisseur (gauche) ---
    const yStart = 120;
    doc.font("Helvetica-Bold").fillColor("#000").text("FOURNISSEUR :", 50, yStart);
    doc.font("Helvetica").fontSize(10).fillColor("#333").text(
      `DentoLink Digital Dental Lab
Adresse: Niort, France / Antananarivo, Madagascar
Email: dentolink3@gmail.com
TVA intracom: FRXX999999999
SIRET: 123 456 789 00012`,
      50,
      yStart + 15,
      { width: 250 }
    );

    // --- Client de référence (première commande) à droite ---
    const client = orders[0];
    const xRight = 350;
    doc.font("Helvetica-Bold").fillColor("#000").text("CLIENT :", xRight, yStart);
    doc.font("Helvetica").fontSize(10).fillColor("#333").text(
      `${client.companyName || "N/A"}
Email: ${client.user_email || "-"}
Tél (fixe): ${client.phone_fixed || "-"}
SIRET: ${client.siret || "-"}
Adresse: ${client.address || "-"}, ${client.zipcode || ""} ${client.city || ""}, ${client.country || ""}`,
      xRight,
      yStart + 15,
      { width: 200 }
    );

    doc.moveDown(4);

    // Totaux globaux (HT / TVA / TTC)
    let totalHTGlobal = 0;
    let totalTVAGlobal = 0;
    let totalTTCGlobal = 0;

    // === Pour chaque commande ===
    for (const order of orders) {
      const orderItems = items.filter((it) => it.order_id === order.id);

      doc.moveDown(1.5);
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#000").text(`Commande #${order.id}`, 50);
      doc.font("Helvetica").fontSize(10).fillColor("#333")
        .text(`Patient: ${order.patient_name || "-"} | Âge: ${order.patient_age || "-"} | Sexe: ${order.patient_sex || "-"}`)
        .text(`Statut commande: ${order.orderStatus || "-"}`)
        .text(`Statut paiement: ${order.paymentStatus || "-"}`);
      doc.moveDown(0.8);

      // En-têtes tableau
      let y = doc.y + 4;
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#000");
      doc.text("Libellé", 50, y);
      doc.text("Qté", 250, y, { width: 40, align: "right" });
      doc.text("PU HT", 300, y, { width: 60, align: "right" });
      doc.text("TVA", 365, y, { width: 60, align: "right" });
      doc.text("PU TTC", 430, y, { width: 60, align: "right" });
      doc.text("Total TTC", 500, y, { width: 70, align: "right" });
      y += 18;

      doc.font("Helvetica").fontSize(10).fillColor("#333");

      let totalOrderTTC = 0;
      let totalOrderHT = 0;
      let totalOrderTVA = 0;

      orderItems.forEach((it) => {
        const qty = Number(it.quantity || 1);
        const unitTTC = Number(it.price || 0);            // prix en base = TTC
        const unitHT  = unitTTC / (1 + VAT_RATE);
        const unitTVA = unitTTC - unitHT;

        const lineTTC = unitTTC * qty;
        const lineHT  = unitHT * qty;
        const lineTVA = unitTVA * qty;

        totalOrderTTC += lineTTC;
        totalOrderHT  += lineHT;
        totalOrderTVA += lineTVA;

        doc.text(`${it.work_type} – ${it.sub_type || "-"}`, 50, y, { width: 190 });
        doc.text(qty.toString(), 250, y, { width: 40, align: "right" });
        doc.text(`${to2(unitHT)} €`, 300, y, { width: 60, align: "right" });
        doc.text(`${to2(unitTVA)} €`, 365, y, { width: 60, align: "right" });
        doc.text(`${to2(unitTTC)} €`, 430, y, { width: 60, align: "right" });
        doc.text(`${to2(lineTTC)} €`, 500, y, { width: 70, align: "right" });
        y += 18;
      });

      totalHTGlobal  += totalOrderHT;
      totalTVAGlobal += totalOrderTVA;
      totalTTCGlobal += totalOrderTTC;

      doc.moveDown(0.6);
      doc.font("Helvetica-Bold").fillColor("#000");
      doc.text(`Sous-total HT: ${to2(totalOrderHT)} €`, 400, y, { width: 170, align: "right" });
      doc.text(`TVA: ${to2(totalOrderTVA)} €`, 400, doc.y, { width: 170, align: "right" });
      doc.text(`Sous-total TTC: ${to2(totalOrderTTC)} €`, 400, doc.y, { width: 170, align: "right" });
      doc.font("Helvetica").fillColor("#333");
      doc.moveDown(1.2);

      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#CCC").stroke();
      doc.moveDown(0.8);
    }

    // ===== Résumé global =====
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
      .text(`TOTAL HT global: ${to2(totalHTGlobal)} €`, 380, doc.y, { width: 190, align: "right" })
      .text(`TOTAL TVA: ${to2(totalTVAGlobal)} €`, 380, doc.y, { width: 190, align: "right" });
    doc.fillColor("#1E3A8A").fontSize(14)
      .text(`TOTAL TTC global: ${to2(totalTTCGlobal)} €`, 380, doc.y, { width: 190, align: "right", underline: true });

    // Pied de page
    doc.moveDown(2);
    doc.font("Helvetica").fontSize(9).fillColor("#666")
      .text("Conditions de paiement: 30 jours nets.")
      .text("IBAN: FR76 3000 4000 5000 6000 7000 890  —  BIC: BNPAFRPPXXX")
      .text("Cette facture est conforme aux normes fiscales européennes.");
    doc.moveDown(1).fontSize(10).fillColor("#000").text("Merci de votre confiance.", { align: "center" });

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
// controllers/orderController.js
exports.payMultipleOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: "Liste des commandes vide" });
    }

    // Récupérer les lignes (items) de toutes les commandes
    const placeholders = orderIds.map(() => "?").join(",");
    const items = await queryAsync(
      `SELECT order_id, work_type, sub_type, price
       FROM order_items
       WHERE order_id IN (${placeholders})`,
      orderIds
    );

    if (!items.length) {
      return res.status(404).json({ error: "Aucun travail trouvé pour ces commandes." });
    }

    // Préparer line_items Stripe à partir des prix DB (1 ligne = 1 item)
    const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "MGA"]);
    const currency = (process.env.CHECKOUT_CURRENCY || "eur").toLowerCase();

    const line_items = items.map((it) => {
      const unit = Number(it.price) || 0;
      const unit_amount = ZERO_DECIMAL.has(currency.toUpperCase())
        ? Math.round(unit)
        : Math.round(unit * 100);

      return {
        price_data: {
          currency,
          product_data: {
            name: `${it.work_type} – ${it.sub_type || "N/A"} (Commande #${it.order_id})`,
          },
          unit_amount,
        },
        quantity: 1, // pas de colonne quantity en DB → 1 par défaut
      };
    });

    // Total (debug)
    const total = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
    console.log(`🧾 Paiement multiple pour [${orderIds.join(", ")}] → Total DB: ${total.toFixed(2)} ${currency.toUpperCase()}`);

    // URLs retour
    const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const success_url = `${FRONTEND_URL}/orders?success=true`;
    const cancel_url = `${FRONTEND_URL}/orders?canceled=true`;

    // Création session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url,
      cancel_url,
      metadata: { orderIds: orderIds.join(",") },      // 🔑 indispensable pour le webhook
      client_reference_id: orderIds.join(","),         // 🔎 traçabilité côté Stripe
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ [payMultipleOrders] error:", err);
    res.status(500).json({ error: "Impossible de créer la session Stripe multiple" });
  }
};


