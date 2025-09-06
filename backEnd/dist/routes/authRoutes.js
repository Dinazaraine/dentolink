const express = require("express");
const { register, login, me, heartbeat, changeMyPassword } = require("../controllers/authController");
const { requireAuth } = require("../middlewares/auth");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// profil et heartbeat nécessitent un token
router.get("/me", requireAuth, me);
router.post("/heartbeat", requireAuth, heartbeat);
router.patch("/me/password", requireAuth, changeMyPassword);

module.exports = router;
