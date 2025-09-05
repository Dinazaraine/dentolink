"use strict";

const dotenv = require("dotenv");
dotenv.config();

const mysql = require("mysql2"); // API callback (pas de /promise)

/** Pool de connexions MySQL */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/** Helper de requête (callbacks) */
function query(sql, params, cb) {
  // Permet d’appeler query(sql, cb) sans params
  if (typeof params === "function") {
    cb = params;
    params = [];
  }
  pool.execute(sql, params, function (err, results, fields) {
    if (err) return cb(err);
    cb(null, results, fields);
  });
}

/** Test de connexion au démarrage (optionnel) */
pool.getConnection(function (err, conn) {
  if (err) {
    console.error("[DB] Échec de connexion MySQL :", err.message);
    // En prod, tu peux stopper l'app :
    // process.exit(1);
    return;
  }
  conn.ping(function (pingErr) {
    if (pingErr) {
      console.error("[DB] Ping MySQL a échoué :", pingErr.message);
    } else if (process.env.NODE_ENV === "development") {
      console.log("[DB] Connexion MySQL OK");
    }
    conn.release();
  });
});

module.exports = { pool, query };
