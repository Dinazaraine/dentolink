const express = require("express");
const {
  listUsers,
  updateRole,
  updateStatus,
  adminResetPassword,
  forceResetFlag,
  updateOnlineStatus
} = require("../controllers/usersController");
const { requireAuth, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

// Route pour lister les utilisateurs (lecture seule)
router.get("/", requireAuth, listUsers);

// Routes réservées aux admins (modifications)
router.patch("/:id/role", requireAuth, requireAdmin, updateRole);
router.patch("/:id/status", requireAuth, requireAdmin, updateStatus);
router.patch("/:id/password", requireAuth, requireAdmin, adminResetPassword);
router.patch("/:id/force-reset", requireAuth, requireAdmin, forceResetFlag);

// ✅ Nouvelle route pour mettre à jour le statut en ligne (connexion/déconnexion)
router.patch("/:id/online", requireAuth, updateOnlineStatus);

module.exports = router;
