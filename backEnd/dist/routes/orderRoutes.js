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
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ----- Routes CRUD -----
router.get("/", requireAuth, orderController.getOrders);
router.get("/:id", requireAuth, orderController.getOrderById);
router.post("/", requireAuth, upload.array("files"), orderController.createOrder);
router.put("/:id", requireAuth, upload.array("files"), orderController.updateOrder); // une seule
router.delete("/:id", requireAuth, orderController.deleteOrder);
router.get("/:id/files", requireAuth, orderController.getOrderFiles);
router.put("/:id/status", requireAuth, orderController.updateOrderStatus);
// ----- Stripe : créer une session de paiement -----
router.post("/:id/create-checkout-session", requireAuth, async (req, res) => {
  const orderId = req.params.id;
  try {
    const order = await orderController.getOrderByIdRaw(orderId);
    if (!order) return res.status(404).json({ error: "Commande introuvable." });

    if (
      req.user.role !== "admin" &&
      String(order.userId) !== String(req.user.id) &&
      String(order.dentistId || "") !== String(req.user.id)
    ) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "MGA"]);
    const currency = (process.env.CHECKOUT_CURRENCY || "eur").toLowerCase();
    const amount = Number(order.total) || 10;
    const unit_amount = ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100);

    const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const success_url = `${FRONTEND_URL}/orders?success=true`;
    const cancel_url = `${FRONTEND_URL}/orders?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: `Commande #${order.id}${order.patient_name ? " - " + order.patient_name : ""}` },
            unit_amount,
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: String(order.id) },
      client_reference_id: String(order.id),
      success_url,
      cancel_url,
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Impossible de créer la session Stripe." });
  }
});

module.exports = router;
