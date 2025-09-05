const express = require("express");
const {
  listUsers,
  login,
  register,
  updateRole,
  updateStatus,
  adminResetPassword,
  forceResetFlag,
  updateOnlineStatus,
  updateUser,
  deleteUser,
  getUserById,
} = require("../controllers/usersController");

const { requireAuth, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// ==============================
// 🔓 Authentification publique
// ==============================
router.post("/register", register); // inscription
router.post("/login", login);       // connexion

// ==============================
// 🔒 Routes protégées
// ==============================

// 📌 Liste de tous les utilisateurs (admin uniquement)
router.get("/", requireAuth, requireAdmin, listUsers);

// 📌 Récupérer un utilisateur par ID (admin ou propriétaire)
router.get("/:id", requireAuth, getUserById);

// 📌 Mettre à jour ses infos (user normal) ou tout (admin)
router.patch("/:id", requireAuth, updateUser);

// 📌 Mettre à jour le statut en ligne (connexion/déconnexion)
router.patch("/:id/online", requireAuth, updateOnlineStatus);

// ==============================
// 🔒 Routes réservées aux admins
// ==============================
router.patch("/:id/role", requireAuth, requireAdmin, updateRole);
router.patch("/:id/status", requireAuth, requireAdmin, updateStatus);
router.patch("/:id/password", requireAuth, requireAdmin, adminResetPassword);
router.patch("/:id/force-reset", requireAuth, requireAdmin, forceResetFlag);
router.delete("/:id", requireAuth, requireAdmin, deleteUser);

module.exports = router;
