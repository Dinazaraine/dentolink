"use strict";

// Exporte les “modèles service” (pas d’ORM)
const User         = require("./User");
const Client       = require("./Client");
const Product      = require("./Product");
const Order        = require("./Order");
const OrderProduct = require("./OrderProduct");

/**
 * Création des tables dans le bon ordre :
 * 1) users  2) clients  3) products  4) orders (FK vers users/clients)  5) order_products
 */
function syncModels(cb) {
  User.createTable(function (err) {
    if (err) return done(err);
    Client.createTable(function (err2) {
      if (err2) return done(err2);
      Product.createTable(function (err3) {
        if (err3) return done(err3);
        Order.createTable(function (err4) {
          if (err4) return done(err4);
          OrderProduct.createTable(function (err5) {
            return done(err5 || null);
          });
        });
      });
    });
  });

  function done(err) {
    if (err) {
      console.error("[DB] syncModels error:", err);
      if (cb) cb(err);
      return;
    }
    console.log("[DB] Tables OK");
    if (cb) cb(null);
  }
}

module.exports = {
  User,
  Client,
  Product,
  Order,
  OrderProduct,
  syncModels,
};
