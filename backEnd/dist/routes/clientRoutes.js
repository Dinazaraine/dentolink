"use strict";

const express = require("express");
const {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

// ⚠️ on exige un token partout : le dentiste sera détecté côté controller et les noms seront masqués
router.post("/", requireAuth, createClient);
router.get("/", requireAuth, getAllClients);
router.get("/:id", requireAuth, getClientById);
router.put("/:id", requireAuth, updateClient);
router.delete("/:id", requireAuth, deleteClient);

module.exports = router;
