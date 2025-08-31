// controllers/clientController.js
"use strict";

const { query } = require("../config/database");

// mini validation
function validate(body) {
  const err = [];
  if (!body || typeof body !== "object") err.push("Body JSON manquant.");
  const { firstName, lastName, sexe, birthDate } = body || {};
  if (!firstName || !firstName.trim()) err.push("firstName requis.");
  if (!lastName || !lastName.trim()) err.push("lastName requis.");
  if (!["M", "F"].includes(sexe)) err.push("sexe doit être 'M' ou 'F'.");
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(birthDate)))
    err.push("birthDate doit être au format YYYY-MM-DD.");
  return err;
}

// Create
function createClient(req, res) {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const { firstName, lastName, sexe } = req.body;
  // on force un YYYY-MM-DD propre (au cas où un '2025-08-21T...' arriverait)
  const birthDate =
    typeof req.body.birthDate === "string"
      ? req.body.birthDate.split("T")[0]
      : req.body.birthDate;

  const sql =
    "INSERT INTO clients (firstName, lastName, sexe, birthDate) VALUES (?, ?, ?, ?)";
  query(sql, [firstName.trim(), lastName.trim(), sexe, birthDate], function (err, result) {
    if (err) {
      console.error("[createClient] SQL:", err.code, err.sqlMessage);
      // 500 = erreur DB, 400 = payload invalide → ici on renvoie 500
      return res.status(500).json({ error: "Erreur DB lors de la création" });
    }
    res.status(201).json({
      id: result.insertId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      sexe,
      birthDate,
    });
  });
}

// Read all
function getAllClients(_req, res) {
  const sql =
    "SELECT id, firstName, lastName, sexe, DATE_FORMAT(birthDate,'%Y-%m-%d') AS birthDate, createdAt, updatedAt FROM clients ORDER BY id DESC";
  query(sql, [], function (err, rows) {
    if (err) {
      console.error("[getAllClients] SQL:", err.code, err.sqlMessage);
      return res.status(500).json({ error: "Erreur DB" });
    }
    res.json(rows);
  });
}

// Read one
function getClientById(req, res) {
  const id = Number(req.params.id);
  const sql =
    "SELECT id, firstName, lastName, sexe, DATE_FORMAT(birthDate,'%Y-%m-%d') AS birthDate, createdAt, updatedAt FROM clients WHERE id = ?";
  query(sql, [id], function (err, rows) {
    if (err) {
      console.error("[getClientById] SQL:", err.code, err.sqlMessage);
      return res.status(500).json({ error: "Erreur DB" });
    }
    if (!rows?.length) return res.status(404).json({ error: "Client introuvable" });
    res.json(rows[0]);
  });
}

// Update
function updateClient(req, res) {
  const id = Number(req.params.id);
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const { firstName, lastName, sexe } = req.body;
  const birthDate =
    typeof req.body.birthDate === "string"
      ? req.body.birthDate.split("T")[0]
      : req.body.birthDate;

  const sql =
    "UPDATE clients SET firstName=?, lastName=?, sexe=?, birthDate=?, updatedAt=NOW() WHERE id = ?";
  query(sql, [firstName.trim(), lastName.trim(), sexe, birthDate, id], function (err, result) {
    if (err) {
      console.error("[updateClient] SQL:", err.code, err.sqlMessage);
      return res.status(500).json({ error: "Erreur DB lors de la mise à jour" });
    }
    if (!result?.affectedRows) return res.status(404).json({ error: "Client introuvable" });

    // renvoi de l'objet mis à jour
    query(
      "SELECT id, firstName, lastName, sexe, DATE_FORMAT(birthDate,'%Y-%m-%d') AS birthDate, createdAt, updatedAt FROM clients WHERE id=?",
      [id],
      function (err2, rows) {
        if (err2) {
          console.error("[updateClient/readback] SQL:", err2.code, err2.sqlMessage);
          return res.status(500).json({ error: "Erreur DB (lecture post-update)" });
        }
        res.json(rows[0]);
      }
    );
  });
}

// Delete
function deleteClient(req, res) {
  const id = Number(req.params.id);
  query("DELETE FROM clients WHERE id = ?", [id], function (err, result) {
    if (err) {
      console.error("[deleteClient] SQL:", err.code, err.sqlMessage);
      return res.status(500).json({ error: "Erreur DB lors de la suppression" });
    }
    if (!result?.affectedRows) return res.status(404).json({ error: "Client introuvable" });
    res.status(204).send();
  });
}
function maskIfDentist(row, req) {
  if (req.user?.role === "dentiste") {
    return {
      ...row,
      firstName: null,
      lastName: null
    };
  }
  return row;
}

// Read all
function getAllClients(req, res) {
  const sql = "SELECT id, firstName, lastName, sexe, DATE_FORMAT(birthDate,'%Y-%m-%d') AS birthDate, createdAt, updatedAt FROM clients ORDER BY id DESC";
  query(sql, [], function (err, rows) {
    if (err) {
      console.error("[getAllClients] SQL:", err?.code, err?.sqlMessage);
      return res.status(500).json({ error: "Erreur DB" });
    }
    const data = Array.isArray(rows) ? rows.map(r => maskIfDentist(r, req)) : [];
    res.json(data);
  });
}

// Read one
function getClientById(req, res) {
  const id = Number(req.params.id);
  const sql = "SELECT id, firstName, lastName, sexe, DATE_FORMAT(birthDate,'%Y-%m-%d') AS birthDate, createdAt, updatedAt FROM clients WHERE id = ?";
  query(sql, [id], function (err, rows) {
    if (err) {
      console.error("[getClientById] SQL:", err?.code, err?.sqlMessage);
      return res.status(500).json({ error: "Erreur DB" });
    }
    if (!rows?.length) return res.status(404).json({ error: "Client introuvable" });
    res.json(maskIfDentist(rows[0], req));
  });
}
module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
};
