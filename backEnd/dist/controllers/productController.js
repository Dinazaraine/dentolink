// controllers/productController.js
"use strict";

const { query } = require("../config/database");

// mini validation
function validate(body) {
  const errors = [];
  if (!body || typeof body !== "object") errors.push("Body JSON manquant.");
  const { name, price } = body || {};
  if (!name || !name.trim()) errors.push("name requis.");
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) errors.push("price doit être un nombre >= 0.");
  return errors;
}

// Create a new product
function createProduct(req, res) {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const name = req.body.name.trim();
  const price = Number(req.body.price);

  // si tu n'as PAS modifié la table en SQL (DEFAULT timestamps), tu peux forcer NOW() ici :
  const sql =
    "INSERT INTO products (name, price, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())";

  query(sql, [name, price], function (err, result) {
    if (err) {
      console.error("[createProduct] SQL:", err.code, err.sqlMessage);
      return res.status(500).json({ error: "Erreur DB lors de la création" });
    }
    res.status(201).json({ id: result.insertId, name, price });
  });
}

// Get all products
function getAllProducts(_req, res) {
  const sql =
    "SELECT id, name, price+0 AS price, createdAt, updatedAt FROM products ORDER BY id DESC";
  query(sql, [], function (err, rows) {
    if (err) {
      console.error("[getAllProducts] SQL:", err.code, err.sqlMessage);
      return res.status(500).json({ error: "Erreur DB" });
    }
    res.json(rows);
  });
}

// Get single product by ID
function getProductById(req, res) {
  const id = Number(req.params.id);
  const sql =
    "SELECT id, name, price+0 AS price, createdAt, updatedAt FROM products WHERE id = ?";
  query(sql, [id], function (err, rows) {
    if (err) {
      console.error("[getProductById] SQL:", err.code, err.sqlMessage);
      return res.status(500).json({ error: "Erreur DB" });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(rows[0]);
  });
}

// Update a product
function updateProduct(req, res) {
  const id = Number(req.params.id);
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const name = req.body.name.trim();
  const price = Number(req.body.price);

  const sql =
    "UPDATE products SET name = ?, price = ?, updatedAt = NOW() WHERE id = ?";
  query(sql, [name, price, id], function (err, result) {
    if (err) {
      console.error("[updateProduct] SQL:", err.code, err.sqlMessage);
      return res.status(500).json({ error: "Erreur DB lors de la mise à jour" });
    }
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    query(
      "SELECT id, name, price+0 AS price, createdAt, updatedAt FROM products WHERE id = ?",
      [id],
      function (err2, rows) {
        if (err2) {
          console.error("[updateProduct/readback] SQL:", err2.code, err2.sqlMessage);
          return res.status(500).json({ error: "Erreur DB (lecture post-update)" });
        }
        res.json(rows[0]);
      }
    );
  });
}

// Delete a product
function deleteProduct(req, res) {
  const id = Number(req.params.id);
  query("DELETE FROM products WHERE id = ?", [id], function (err, result) {
    if (err) {
      console.error("[deleteProduct] SQL:", err.code, err.sqlMessage);
      return res.status(500).json({ error: "Erreur DB lors de la suppression" });
    }
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(204).send();
  });
}

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
