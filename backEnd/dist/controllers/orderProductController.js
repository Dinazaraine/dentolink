"use strict";

import pool from "../config/database.js";
import fs from "fs";
import path from "path";
const isAdmin = (req) => req.user?.role === "admin";

function validate(body) {
  const errors = [];
  const { orderId, productId, quantity } = body || {};
  if (!Number.isFinite(Number(orderId)) || Number(orderId) <= 0) errors.push("orderId invalide.");
  if (!Number.isFinite(Number(productId)) || Number(productId) <= 0) errors.push("productId invalide.");
  if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) errors.push("quantity doit être un entier > 0.");
  return errors;
}

/** Vérifie que la commande appartient à l'utilisateur (ou admin) */
async function canAccessOrder(orderId, req) {
  if (isAdmin(req)) return true;
  const [rows] = await pool.execute("SELECT userId FROM orders WHERE id = ?", [orderId]);
  if (!rows.length) return false;
  return Number(rows[0].userId) === Number(req.user.id);
}

/** Vérifie l'accès via op.id (jointure vers orders) */
async function canAccessOrderProduct(opId, req) {
  if (isAdmin(req)) return true;
  const sql = `
    SELECT o.userId
    FROM order_products op
    JOIN orders o ON o.id = op.orderId
    WHERE op.id = ?
  `;
  const [rows] = await pool.execute(sql, [opId]);
  if (!rows.length) return false;
  return Number(rows[0].userId) === Number(req.user.id);
}

/** ✅ Créer un produit lié à une commande */
export async function createOrderProduct(req, res) {
  try {
    const errors = validate(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(" ") });

    const { orderId, productId, quantity } = req.body;

    if (!(await canAccessOrder(orderId, req))) {
      return res.status(404).json({ error: "Commande introuvable ou non autorisée" });
    }

    const sql = `
      INSERT INTO order_products (orderId, productId, quantity, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.execute(sql, [orderId, productId, quantity]);
    res.status(201).json({ id: result.insertId, orderId, productId, quantity });
  } catch (err) {
    console.error("[createOrderProduct] error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Ce produit est déjà ajouté pour cette commande." });
    }
    res.status(500).json({ error: "Erreur lors de la création" });
  }
}

/** ✅ Lire tous les produits liés aux commandes */
export async function getAllOrderProducts(req, res) {
  try {
    let sql = `
      SELECT op.id, op.orderId, op.productId, op.quantity, op.createdAt, op.updatedAt
      FROM order_products op
      ORDER BY op.id DESC
    `;
    let params = [];

    if (!isAdmin(req)) {
      sql = `
        SELECT op.id, op.orderId, op.productId, op.quantity, op.createdAt, op.updatedAt
        FROM order_products op
        JOIN orders o ON o.id = op.orderId
        WHERE o.userId = ?
        ORDER BY op.id DESC
      `;
      params = [req.user.id];
    }

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("[getAllOrderProducts] error:", err);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
}

/** ✅ Lire un lien commande-produit */
export async function getOrderProductById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "id invalide" });

    if (!(await canAccessOrderProduct(id, req))) {
      return res.status(404).json({ error: "Lien introuvable ou non autorisé" });
    }

    const [rows] = await pool.execute(
      "SELECT id, orderId, productId, quantity, createdAt, updatedAt FROM order_products WHERE id = ?",
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: "Lien introuvable" });
    res.json(rows[0]);
  } catch (err) {
    console.error("[getOrderProductById] error:", err);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
}

/** ✅ Mettre à jour */
export async function updateOrderProduct(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "id invalide" });

    const errors = validate(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(" ") });

    if (!(await canAccessOrderProduct(id, req))) {
      return res.status(404).json({ error: "Lien introuvable ou non autorisé" });
    }

    const { orderId, productId, quantity } = req.body;

    if (!(await canAccessOrder(orderId, req))) {
      return res.status(404).json({ error: "Nouvelle commande non autorisée" });
    }

    const sql = `
      UPDATE order_products
      SET orderId = ?, productId = ?, quantity = ?, updatedAt = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [orderId, productId, quantity, id]);

    if (!result.affectedRows) return res.status(404).json({ error: "Lien introuvable" });

    const [rows] = await pool.execute(
      "SELECT id, orderId, productId, quantity, createdAt, updatedAt FROM order_products WHERE id = ?",
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("[updateOrderProduct] error:", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
}

/** ✅ Supprimer */
export async function deleteOrderProduct(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "id invalide" });

    if (!(await canAccessOrderProduct(id, req))) {
      return res.status(404).json({ error: "Lien introuvable ou non autorisé" });
    }

    const [result] = await pool.execute("DELETE FROM order_products WHERE id = ?", [id]);

    if (!result.affectedRows) return res.status(404).json({ error: "Lien introuvable" });
    res.status(204).send();
  } catch (err) {
    console.error("[deleteOrderProduct] error:", err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
}

/** ✅ Récupérer produits par commande */
export async function getProductsByOrderId(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isFinite(orderId) || orderId <= 0) return res.status(400).json({ error: "orderId invalide" });

    if (!(await canAccessOrder(orderId, req))) {
      return res.status(404).json({ error: "Commande introuvable ou non autorisée" });
    }

    const [rows] = await pool.execute(
      "SELECT id, orderId, productId, quantity, createdAt, updatedAt FROM order_products WHERE orderId = ?",
      [orderId]
    );

    res.json(rows);
  } catch (err) {
    console.error("[getProductsByOrderId] error:", err);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
}

/** ✅ Récupérer commandes par produit */
export async function getOrdersByProductId(req, res) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isFinite(productId) || productId <= 0) return res.status(400).json({ error: "productId invalide" });

    let sql = `
      SELECT op.id, op.orderId, op.productId, op.quantity, op.createdAt, op.updatedAt
      FROM order_products op
      JOIN orders o ON o.id = op.orderId
      WHERE op.productId = ?
    `;
    const params = [productId];

    if (!isAdmin(req)) {
      sql += " AND o.userId = ?";
      params.push(req.user.id);
    }

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("[getOrdersByProductId] error:", err);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
}
export async function getOrderFiles(req, res) {
  try {
    const orderId = req.params.id;
    const uploadsDir = path.join(process.cwd(), "uploads"); // folder uploads au niveau du backend root

    if (!fs.existsSync(uploadsDir)) return res.json([]);

    const files = fs.readdirSync(uploadsDir)
      .filter(file => file.includes(orderId)) // filtre les fichiers correspondant à cette commande
      .map(file => ({
        originalName: file,
        url: `/uploads/${file}`, // c'est cette URL que tu dois servir via express.static
      }));

    res.json(files);
  } catch (err) {
    console.error("Erreur getOrderFiles:", err);
    res.status(500).json({ error: "Impossible de récupérer les fichiers de la commande." });
  }
}
