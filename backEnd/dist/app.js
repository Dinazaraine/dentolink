"use strict";

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const http = require("http");         // ✅ nécessaire pour socket.io
const { Server } = require("socket.io"); // ✅ socket.io

dotenv.config();

const clientRoutes = require("./routes/clientRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderProductRoutes = require("./routes/orderProductRoutes");
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");

const orderController = require("./controllers/orderController");
const { pool } = require("./config/database");

let syncModels = null;
try {
  ({ syncModels } = require("./models"));
} catch {
  console.warn("⚠️ Aucun models trouvé pour syncModels (ignorer si normal).");
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // ton frontend en développement
    methods: ["GET", "POST"],
    credentials: true,              // ⚠️ obligatoire si tu utilises withCredentials
  },
});

/* --------------------------- Gestion Socket.IO --------------------------- */
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Un utilisateur est connecté :", socket.id);

  socket.on("user_online", (userId) => {
    onlineUsers.set(socket.id, userId);
    io.emit("online_users", Array.from(onlineUsers.values()));
  });

  socket.on("send_message", (data) => {
    console.log("💬 Nouveau message :", data);
    // envoi au destinataire spécifique si socket.id connu
    for (let [sockId, uid] of onlineUsers.entries()) {
      if (uid === data.to) {
        io.to(sockId).emit("receive_message", {
          from: data.from,
          message: data.message,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Déconnecté :", socket.id);
    onlineUsers.delete(socket.id);
    io.emit("online_users", Array.from(onlineUsers.values()));
  });
});

/* --------------------------- CORS --------------------------- */
// On lit la variable d'environnement CORS_ORIGIN (liste séparée par des virgules),
// ou à défaut on prend "http://localhost:5173"
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter((o) => o); // retire les vides éventuels

// Ajout manuel du domaine Vercel s'il n'est pas déjà dans la liste
const vercelDomain = "https://dentolink-qyyh.vercel.app";
if (!allowedOrigins.includes(vercelDomain)) {
  allowedOrigins.push(vercelDomain);
}

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* ------------------ Sécurité (Stripe CSP inclus) ------------------ */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
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

/* -------- Webhook Stripe (AVANT body parsers !) -------- */
app.post(
  "/api/orders/webhook",
  express.raw({ type: "application/json" }),
  orderController.handleStripeWebhook
);

/* ------------------ Body parsers globaux ------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------- Fichiers statiques ------------------- */
const uploadDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadDir));
console.log("📂 Uploads servis depuis :", uploadDir);

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

/* ----------------------------- 404 handler ----------------------------- */
app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

/* ----------------------- Démarrage + connexion DB ---------------------- */
const PORT = Number(process.env.PORT) || 3000;

function startServer() {
  server.listen(PORT, () => { // ✅ server.listen au lieu de app.listen
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(", ")}`);
    console.log("⚡ Socket.IO prêt !");
  });
}

function bootstrap() {
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
process.on("unhandledRejection", (reason) =>
  console.error("UNHANDLED REJECTION:", reason)
);
process.on("uncaughtException", (err) =>
  console.error("UNCAUGHT EXCEPTION:", err)
);

module.exports = { app, io }; // ✅ on exporte aussi io si besoin ailleurs
