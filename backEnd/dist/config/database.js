"use strict";

const dotenv = require("dotenv");
dotenv.config();

const mysql = require("mysql2");

/** Création du pool depuis DATABASE_URL */
let pool;

if (process.env.DATABASE_URL) {
  const dbUrl = new URL(process.env.DATABASE_URL);

  pool = mysql.createPool({
    host: dbUrl.hostname,
    port: dbUrl.port || 3306,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace("/", ""), // enlève le "/" devant railway
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
} else {
  console.error("[DB] ❌ Aucune variable DATABASE_URL trouvée !");
  process.exit(1);
}

/** Helper query */
function query(sql, params, cb) {
  if (typeof params === "function") {
    cb = params;
    params = [];
  }
  pool.execute(sql, params, function (err, results, fields) {
    if (err) return cb(err);
    cb(null, results, fields);
  });
}

/** Test de connexion */
pool.getConnection(function (err, conn) {
  if (err) {
    console.error("[DB] ❌ Échec de connexion MySQL :", err.message);
    return;
  }
  conn.ping(function (pingErr) {
    if (pingErr) {
      console.error("[DB] ❌ Ping MySQL a échoué :", pingErr.message);
    } else {
      console.log("[DB] ✅ Connexion MySQL OK via DATABASE_URL");
    }
    conn.release();
  });
});

module.exports = { pool, query };
