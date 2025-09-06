"use strict";

const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { requireAuth, requireAdmin } = require("../middlewares/auth");
const router = express.Router();

// Lecture : authentifié (on garde une cohérence d’API, et ça évite l’anonymat total)
router.get("/", requireAuth, getAllProducts);
router.get("/:id", requireAuth, getProductById);

// Écriture : admin uniquement
router.post("/", requireAuth, requireAdmin, createProduct);
router.put("/:id", requireAuth, requireAdmin, updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

module.exports = router;
