"use strict";

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

dotenv.config();

const clientRoutes = require("./routes/clientRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderProductRoutes = require("./routes/orderProductRoutes");
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");

const { pool } = require("./config/database");

let syncModels = null;
try {
  ({ syncModels } = require("./models"));
} catch (_) {}

const app = express();

/* --------------------------- CORS --------------------------- */
const allowedOrigins = ("https://dentolink-5h6k.vercel.app" ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // ajoute "X-Requested-With" si tu l'utilises côté front
    credentials: true,
  })
);

/* ------------------ Sécurité (Stripe CSP inclus) ------------------ */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        frameSrc: ["https://js.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        imgSrc: ["'self'", "data:", "https://*.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

/* -------- Webhook Stripe (AVANT les parsers; une seule fois !) -------- */
app.post(
  "/api/orders/webhook",
  express.raw({ type: "application/json" }),
  require("./controllers/orderController").handleStripeWebhook
);

/* ------------------ Body parsers globaux (après webhook) ------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------------------ Healthcheck ------------------------------ */
app.get("/health", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV ?? "development" });
});

/* --------------------------------- Routes --------------------------------- */
app.use("/api/clients", clientRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-products", orderProductRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));/* ---------------------- (Optionnel) PaymentIntent util --------------------- */
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "MGA"]);
function toStripeAmount(amount, currency) {
  const c = String(currency || "USD").toUpperCase();
  return ZERO_DECIMAL.has(c) ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);
}

app.post("/api/payment/create-intent", async (req, res) => {
  try {
    const { amount, currency = "usd" } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeAmount(amount, currency),
      currency,
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Erreur création PaymentIntent:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ----------------------------- 404 handler ----------------------------- */
app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

/* ----------------------- Démarrage + connexion DB ---------------------- */
const PORT = Number(process.env.PORT) || 3000;

function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(", ")}`);
  });
}

function bootstrap() {
  const { pool } = require("./config/database");
  pool.getConnection((err, conn) => {
    if (err) {
      console.error("❌ Échec de connexion MySQL :", err.message);
      process.exit(1);
      return;
    }
    conn.ping((pingErr) => {
      if (pingErr) {
        console.error("❌ Ping MySQL échoué :", pingErr.message);
        conn.release();
        process.exit(1);
        return;
      }
      console.log("✅ Connexion MySQL OK");
      conn.release();

      if (typeof syncModels === "function") {
        syncModels((syncErr) => {
          if (syncErr) {
            console.error("❌ Erreur syncModels :", syncErr.message || syncErr);
            process.exit(1);
            return;
          }
          console.log("✅ Tables prêtes");
          startServer();
        });
      } else {
        startServer();
      }
    });
  });
}

bootstrap();

/* ---------------------------- Gestion erreurs ---------------------------- */
process.on("unhandledRejection", (reason) => console.error("UNHANDLED REJECTION:", reason));
process.on("uncaughtException", (err) => console.error("UNCAUGHT EXCEPTION:", err));

module.exports = app;
