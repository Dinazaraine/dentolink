// routes/orderProductRoutes.js
"use strict";

const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const {
  createOrderProduct,
  getAllOrderProducts,
  getOrderProductById,
  updateOrderProduct,
  deleteOrderProduct,
  getProductsByOrderId,
  getOrdersByProductId,
} = require("../controllers/orderProductController");

const router = express.Router();

router.post("/", requireAuth, createOrderProduct);
router.get("/", requireAuth, getAllOrderProducts);

// Spécifiques AVANT "/:id"
router.get("/order/:orderId", requireAuth, getProductsByOrderId);
router.get("/product/:productId", requireAuth, getOrdersByProductId);

router.get("/:id", requireAuth, getOrderProductById);
router.put("/:id", requireAuth, updateOrderProduct);
router.delete("/:id", requireAuth, deleteOrderProduct);

module.exports = router;
