const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const db = pool.promise();

async function findUserByEmail(email) {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
}

exports.register = async (req, res) => {
  try {
    const { email, password, firstName = "", lastName = "" } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email déjà utilisé" });

    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      "INSERT INTO users (email, passwordHash, firstName, lastName) VALUES (?, ?, ?, ?)",
      [email, hash, firstName, lastName]
    );

    const user = { id: r.insertId, email, firstName, lastName };
    const token = jwt.sign({ sub: user.id, email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (register)" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await findUserByEmail(email);
    if (!u) return res.status(401).json({ error: "Identifiants invalides" });

    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: "Identifiants invalides" });

    // Vérifs statut
    if (!u.isActive) return res.status(403).json({ error: "Compte inactif" });
    if (u.accountStatus !== "approved") {
      return res.status(403).json({ error: `Compte ${u.accountStatus}` });
    }

    // Met à jour last_login_at et première présence
    const now = new Date();
    await db.query(
      "UPDATE users SET last_login_at = ?, last_seen_at = ? WHERE id = ?",
      [now, now, u.id]
    );

    const user = {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      accountStatus: u.accountStatus,
      reset_required: !!u.reset_required
    };
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (login)" });
  }
};

// Utilisé par le frontend pour récupérer mon profil actuel
exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, email, firstName, lastName, role, accountStatus, reset_required, last_seen_at FROM users WHERE id = ?",
      [req.user.id]
    );
    const me = rows[0];
    res.json({ user: me });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (me)" });
  }
};

// Ping "présence": met à jour last_seen_at (appel périodique depuis React)
exports.heartbeat = async (req, res) => {
  try {
    await db.query("UPDATE users SET last_seen_at = ? WHERE id = ?", [new Date(), req.user.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (heartbeat)" });
  }
};

// Changement de mot de passe par l'utilisateur connecté
// - si reset_required=1 ou même cas normal (tu as demandé “champ pour modifier”)
exports.changeMyPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Nouveau mot de passe invalide (min 6 caractères)" });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE users SET passwordHash = ?, reset_required = 0 WHERE id = ?",
      [hash, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (changeMyPassword)" });
  }
};
