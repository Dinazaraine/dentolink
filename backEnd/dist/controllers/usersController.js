const bcrypt = require("bcryptjs");
const { pool } = require("../config/database");
const db = pool.promise();

const ONLINE_WINDOW_MIN = 5; // Durée pour considérer un user online
function isOnline(last_seen_at) {
  if (!last_seen_at) return false;
  const last = new Date(last_seen_at).getTime();
  return (Date.now() - last) <= ONLINE_WINDOW_MIN * 60 * 1000;
}

// ✅ Middleware pour mettre à jour last_seen_at
exports.updateLastSeen = async (userId) => {
  try {
    await db.query("UPDATE users SET last_seen_at = NOW(), isActive = 1 WHERE id = ?", [userId]);
  } catch (err) {
    console.error("Erreur updateLastSeen:", err);
  }
};

// ✅ Déconnexion (force offline)
exports.setOffline = async (userId) => {
  try {
    await db.query("UPDATE users SET isActive = 0 WHERE id = ?", [userId]);
  } catch (err) {
    console.error("Erreur setOffline:", err);
  }
};

// ✅ GET /api/users
exports.listUsers = async (req, res) => {
  try {
    const { status, role } = req.query;
    let sql = `SELECT id, email, firstName, lastName, role, accountStatus, isActive, last_login_at, last_seen_at, reset_required, createdAt FROM users`;
    const params = [];
    const where = [];

    if (status) { where.push("accountStatus = ?"); params.push(status); }
    if (role) { where.push("role = ?"); params.push(role); }
    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY createdAt DESC";

    const [rows] = await db.query(sql, params);

    // ✅ Ajouter champ "online" basé sur last_seen_at OU isActive
    const mapped = rows.map(u => ({
      ...u,
      online: u.isActive === 1 && isOnline(u.last_seen_at)
    }));

    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (listUsers)" });
  }
};

// ✅ Connexion utilisateur (mettre last_login_at et last_seen_at)
exports.updateLogin = async (userId) => {
  try {
    await db.query("UPDATE users SET last_login_at = NOW(), last_seen_at = NOW(), isActive = 1 WHERE id = ?", [userId]);
  } catch (err) {
    console.error("Erreur updateLogin:", err);
  }
};

// PATCH /api/users/:id/role
// PATCH /api/users/:id/role
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!["admin", "user", "dentiste"].includes(role)) {
      return res.status(400).json({ error: "Rôle invalide" });
    }
    await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (updateRole)" });
  }
};


// PATCH /api/users/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;
    const allowed = ["pending", "approved", "rejected", "suspended"];
    if (!allowed.includes(accountStatus)) {
      return res.status(400).json({ error: "Statut invalide" });
    }
    await db.query("UPDATE users SET accountStatus = ? WHERE id = ?", [accountStatus, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (updateStatus)" });
  }
};

// PATCH /api/users/:id/password
exports.adminResetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Nouveau mot de passe invalide (min 6 caractères)" });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET passwordHash = ?, reset_required = 0 WHERE id = ?", [hash, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (adminResetPassword)" });
  }
};

// PATCH /api/users/:id/force-reset
exports.forceResetFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { reset_required } = req.body;
    const flag = reset_required ? 1 : 0;
    await db.query("UPDATE users SET reset_required = ? WHERE id = ?", [flag, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (forceResetFlag)" });
  }
};
// Met à jour le statut en ligne d'un utilisateur
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return res.status(400).json({ error: "Valeur invalide pour isOnline" });
    }

    await query("UPDATE users SET is_online = ? WHERE id = ?", [isOnline, id]);

    res.json({ message: "Statut en ligne mis à jour", isOnline });
  } catch (error) {
    console.error("Erreur updateOnlineStatus:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
