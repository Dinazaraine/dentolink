"use strict";

const { pool } = require("./config/database");
const users = require("./models/User");
const clients = require("./models/Client");
const products = require("./models/Product");
const orders = require("./models/Order");
const orderProducts = require("./models/OrderProduct");

const dbName = process.env.DB_NAME || "dinazar";

console.log("⏳ Initialisation de la base et des tables...");

// Étape 1 : Créer la base si elle n'existe pas
pool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`, (err) => {
  if (err) {
    console.error("❌ Erreur création base :", err.message);
    process.exit(1);
  }

  console.log(`✅ Base '${dbName}' OK`);

  // Sélectionner la base
  pool.query(`USE \`${dbName}\`;`, (err2) => {
    if (err2) {
      console.error("❌ Erreur sélection base :", err2.message);
      process.exit(1);
    }

    // Étape 2 : Créer les tables
    users.createTable((err) => {
      if (err) return console.error("❌ Erreur table users :", err.message);
      console.log("✅ Table 'users' créée");

      clients.createTable((err) => {
        if (err) return console.error("❌ Erreur table clients :", err.message);
        console.log("✅ Table 'clients' créée");

        products.createTable((err) => {
          if (err) return console.error("❌ Erreur table products :", err.message);
          console.log("✅ Table 'products' créée");

          orders.createTable((err) => {
            if (err) return console.error("❌ Erreur table orders :", err.message);
            console.log("✅ Table 'orders' créée");

            orderProducts.createTable((err) => {
              if (err) return console.error("❌ Erreur table order_products :", err.message);
              console.log("✅ Table 'order_products' créée");

              console.log("🎉 Initialisation terminée !");
              process.exit(0);
            });
          });
        });
      });
    });
  });
});
