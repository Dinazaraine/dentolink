"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const orderController = require("../controllers/orderController");
const { requireAuth } = require("../middlewares/auth");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

// --- Config Multer ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = path.join(__dirname, "../uploads");

    // choisir sous-dossier selon rôle
    let role = req.user?.role || "inconnu";
    let roleFolder = role === "dentiste" ? "dentists" : role === "user" ? "users" : "others";

    const uploadDir = path.join(baseDir, roleFolder);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    console.log(`📂 Destination upload -> Utilisateur ID: ${req.user?.id || "?"}, rôle: ${role}, dossier: ${roleFolder}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const finalName = Date.now() + path.extname(file.originalname);
    console.log(`📎 Nouveau fichier uploadé: ${file.originalname} → ${finalName}`);
    cb(null, finalName);
  },
});
const upload = multer({ storage });

// Middleware debug pour voir les fichiers après multer
const logFilesMiddleware = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    console.log("✅ Fichiers reçus par Multer:", req.files.map(f => f.originalname));
  } else {
    console.log("⚠️ Aucun fichier reçu par Multer !");
  }
  next();
};
router.get("/invoice-multiple", requireAuth, orderController.generateInvoiceMultiple);
router.get("/:id/invoice", requireAuth, orderController.generateInvoice);
// ----- Routes CRUD -----
router.post("/pay-multiple", requireAuth, orderController.payMultipleOrders);

router.get("/", requireAuth, orderController.getOrders);
router.get("/:id", requireAuth, orderController.getOrderById);

router.post(
  "/",
  requireAuth,
  upload.array("files"), // multer
  logFilesMiddleware,    // debug
  orderController.createOrder
);

router.put(
  "/:id",
  requireAuth,
  upload.array("files"),
  logFilesMiddleware,
  orderController.updateOrder
);

router.delete("/:id", requireAuth, orderController.deleteOrder);

router.get("/:id/files", requireAuth, orderController.getOrderFiles);
router.put("/:id/status", requireAuth, orderController.updateOrderStatus);



// --- Messagerie ---
// Routes messages

// ----- Stripe : créer une session de paiement -----
router.post("/:id/create-checkout-session", requireAuth, async (req, res) => {
  const orderId = req.params.id;
  try {
    // 🔹 Charger la commande
    const order = await orderController.getOrderByIdRaw(orderId);
    if (!order) return res.status(404).json({ error: "Commande introuvable." });

    // 🔹 Vérif autorisation
    if (
      req.user.role !== "admin" &&
      String(order.userId) !== String(req.user.id) &&
      String(order.dentistId || "") !== String(req.user.id)
    ) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    // 🔹 Charger les travaux (order_items)
    const items = await queryAsync(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orderId]
    );

    if (!items.length) {
      return res.status(400).json({ error: "Aucun travail associé à cette commande." });
    }

    // 🔹 Préparer les line_items Stripe
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
            name: `${it.work_type} - ${it.sub_type || "N/A"}`,
          },
          unit_amount,
        },
        quantity: 1,
      };
    });

    // 🔹 URLs de redirection
    const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const success_url = `${FRONTEND_URL}/orders?success=true`;
    const cancel_url = `${FRONTEND_URL}/orders?canceled=true`;

    // 🔹 Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      metadata: { orderId: String(order.id) }, // ✅ garder lien vers commande
      client_reference_id: String(order.id),
      success_url,
      cancel_url,
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("❌ Stripe error:", err);
    res.status(500).json({ error: "Impossible de créer la session Stripe." });
  }
});


module.exports = router;
