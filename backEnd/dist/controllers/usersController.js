const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");
const db = pool.promise();

const ONLINE_WINDOW_MIN = 5; // Durée pour considérer un user online
function isOnline(last_seen_at) {
  if (!last_seen_at) return false;
  const last = new Date(last_seen_at).getTime();
  return Date.now() - last <= ONLINE_WINDOW_MIN * 60 * 1000;
}

// ✅ Middleware pour mettre à jour last_seen_at
exports.updateLastSeen = async (userId) => {
  try {
    await db.query(
      "UPDATE users SET last_seen_at = NOW(), isActive = 1 WHERE id = ?",
      [userId]
    );
  } catch (err) {
    console.error("Erreur updateLastSeen:", err);
  }
};

// ✅ Déconnexion (force offline)
exports.setOffline = async (userId) => {
  try {
    await db.query("UPDATE users SET isActive = 0, is_online = 0 WHERE id = ?", [
      userId,
    ]);
  } catch (err) {
    console.error("Erreur setOffline:", err);
  }
};

// ✅ GET /api/users
exports.listUsers = async (req, res) => {
  try {
    const { status, role } = req.query;
    let sql = `SELECT id, email, companyName, phone_fixed, phone_mobile, siret,
                      address, zipcode, city, country,
                      role, accountStatus, isActive, last_login_at, last_seen_at,
                      reset_required, createdAt, is_online
               FROM users`;
    const params = [];
    const where = [];

    if (status) {
      where.push("accountStatus = ?");
      params.push(status);
    }
    if (role) {
      where.push("role = ?");
      params.push(role);
    }
    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY createdAt DESC";

    const [rows] = await db.query(sql, params);

    const mapped = rows.map((u) => ({
      ...u,
      online: u.isActive === 1 && isOnline(u.last_seen_at),
    }));

    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (listUsers)" });
  }
};

// ✅ Connexion via email professionnel
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email et mot de passe requis" });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ error: "Utilisateur introuvable" });

    const user = rows[0];

    if (user.accountStatus !== "approved" || !user.isActive) {
      return res
        .status(403)
        .json({ error: "Compte en attente, suspendu ou inactif" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

    // Génération du JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    // Mise à jour login
    await db.query(
      "UPDATE users SET last_login_at = NOW(), last_seen_at = NOW(), isActive = 1, is_online = 1 WHERE id = ?",
      [user.id]
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ error: "Erreur serveur (login)" });
  }
};

// ✅ Update role
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

// ✅ Update status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;
    const allowed = ["pending", "approved", "rejected", "suspended"];
    if (!allowed.includes(accountStatus)) {
      return res.status(400).json({ error: "Statut invalide" });
    }
    await db.query("UPDATE users SET accountStatus = ? WHERE id = ?", [
      accountStatus,
      id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (updateStatus)" });
  }
};

// ✅ Reset password (admin)
exports.adminResetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Mot de passe invalide (min 6 caractères)" });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE users SET passwordHash = ?, reset_required = 0 WHERE id = ?",
      [hash, id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (adminResetPassword)" });
  }
};

// ✅ Forcer reset du mot de passe
exports.forceResetFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { reset_required } = req.body;
    const flag = reset_required ? 1 : 0;
    await db.query("UPDATE users SET reset_required = ? WHERE id = ?", [
      flag,
      id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur (forceResetFlag)" });
  }
};

// ✅ Mettre à jour statut en ligne
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return res.status(400).json({ error: "Valeur invalide pour isOnline" });
    }

    await db.query("UPDATE users SET is_online = ? WHERE id = ?", [
      isOnline ? 1 : 0,
      id,
    ]);

    res.json({ message: "Statut en ligne mis à jour", isOnline });
  } catch (error) {
    console.error("Erreur updateOnlineStatus:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
// ✅ Inscription (Register)
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      companyName,
      phone_fixed,
      phone_mobile,
      siret,
      address,
      zipcode,
      city,
      country
    } = req.body;

    // Vérification champs obligatoires
    if (!email || !password || !companyName || !address || !zipcode || !city) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    // Vérifier si l'email existe déjà
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }

    // Hash mot de passe
    const hash = await bcrypt.hash(password, 10);

    // Insérer l’utilisateur (par défaut role = user, statut = pending)
    const [result] = await db.query(
      `INSERT INTO users 
        (email, passwordHash, companyName, phone_fixed, phone_mobile, siret, address, zipcode, city, country, role, accountStatus, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'pending', NOW())`,
      [
        email,
        hash,
        companyName,
        phone_fixed || null,
        phone_mobile || null,
        siret || null,
        address,
        zipcode,
        city,
        country || "France"
      ]
    );

    const userId = result.insertId;

    res.status(201).json({
      message: "Inscription réussie (en attente de validation par un admin)",
      user: {
        id: userId,
        email,
        companyName,
        role: "user",          // ✅ cohérent avec l’insertion
        accountStatus: "pending"
      }
    });
  } catch (err) {
    console.error("Erreur register:", err);
    res.status(500).json({ error: "Erreur serveur (register)" });
  }
};

// ✅ Modifier toutes les informations d’un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      email,
      password,
      companyName,
      phone_fixed,
      phone_mobile,
      siret,
      address,
      zipcode,
      city,
      country,
      role,
      accountStatus,
      isActive
    } = req.body;

    // Vérification : si email déjà utilisé par un autre compte
    if (email) {
      const [existing] = await db.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, id]);
      if (existing.length > 0) {
        return res.status(409).json({ error: "Cet email est déjà utilisé par un autre compte" });
      }
    }

    // Gestion mot de passe (si fourni)
    let passwordHash = null;
    if (password && password.length >= 6) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Construction dynamique de la requête
    const fields = [];
    const values = [];

    if (email) { fields.push("email = ?"); values.push(email); }
    if (passwordHash) { fields.push("passwordHash = ?"); values.push(passwordHash); }
    if (companyName) { fields.push("companyName = ?"); values.push(companyName); }
    if (phone_fixed !== undefined) { fields.push("phone_fixed = ?"); values.push(phone_fixed); }
    if (phone_mobile !== undefined) { fields.push("phone_mobile = ?"); values.push(phone_mobile); }
    if (siret !== undefined) { fields.push("siret = ?"); values.push(siret); }
    if (address) { fields.push("address = ?"); values.push(address); }
    if (zipcode) { fields.push("zipcode = ?"); values.push(zipcode); }
    if (city) { fields.push("city = ?"); values.push(city); }
    if (country) { fields.push("country = ?"); values.push(country); }
    if (role) { fields.push("role = ?"); values.push(role); }
    if (accountStatus) { fields.push("accountStatus = ?"); values.push(accountStatus); }
    if (isActive !== undefined) { fields.push("isActive = ?"); values.push(isActive ? 1 : 0); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
    }

    values.push(id);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    await db.query(sql, values);

    res.json({ message: "Utilisateur mis à jour avec succès" });
  } catch (err) {
    console.error("Erreur updateUser:", err);
    res.status(500).json({ error: "Erreur serveur (updateUser)" });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    console.error("Erreur deleteUser:", err);
    res.status(500).json({ error: "Erreur serveur (deleteUser)" });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Erreur getUserById:", err);
    res.status(500).json({ error: "Erreur serveur (getUserById)" });
  }
};
