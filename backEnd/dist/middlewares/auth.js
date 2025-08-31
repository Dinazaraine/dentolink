const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const db = pool.promise();

async function getUserById(id) {
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0] || null;
}

exports.requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Token manquant" });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });

    if (!user.isActive) return res.status(403).json({ error: "Compte inactif" });
    if (user.accountStatus !== "approved") {
      return res.status(403).json({ error: `Compte ${user.accountStatus}` });
    }

    req.user = { id: user.id, email: user.email, role: user.role, reset_required: !!user.reset_required };
    next();
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: "Token invalide" });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Réservé aux admins" });
  }
  next();
};
