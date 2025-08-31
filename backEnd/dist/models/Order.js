"use strict";

const { query } = require("../config/database");

/** ------------------------ Table Orders ------------------------ */
function createTable(cb) {
  const sql = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      userId    INT UNSIGNED DEFAULT NULL,
      dentistId INT UNSIGNED DEFAULT 1, -- dentiste unique
      clientId  INT UNSIGNED DEFAULT NULL,
      
      -- Patient
      patient_name VARCHAR(120) NOT NULL,
      sex ENUM('homme','femme') DEFAULT NULL,
      age TINYINT(3) UNSIGNED DEFAULT NULL,
      patient_sex VARCHAR(10) DEFAULT NULL,
      patient_age TINYINT(3) UNSIGNED DEFAULT NULL,
      
      -- Travail
      typeOfWork ENUM('conjointe','amovible','analyse_aligneur','planification_implantaire','gouttiere','implant') DEFAULT NULL,
      work_type VARCHAR(50) DEFAULT NULL,
      sub_type  VARCHAR(120) DEFAULT NULL,
      model     VARCHAR(120) DEFAULT NULL,
      
      -- Dents / fichiers
      numDent LONGTEXT,
      upper_teeth LONGTEXT DEFAULT NULL,
      lower_teeth LONGTEXT DEFAULT NULL,
      file_paths LONGTEXT DEFAULT NULL,
      remark TEXT DEFAULT NULL,
      
      -- Paiement / statut
      status ENUM(
        'panier','en_attente','chez_dentiste','envoye_admin','valide_admin',
        'terminee','annulee','paye','rembourse'
      ) NOT NULL DEFAULT 'panier',
      total DECIMAL(10,2) NOT NULL DEFAULT 10.00,
      paymentMethod ENUM('stripe','mvola','orange_money','airtel_money','visa','mastercard','autre') DEFAULT NULL,
      transactionRef VARCHAR(100) DEFAULT NULL,
      
      -- Dates
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- FK
      CONSTRAINT fk_orders_client   FOREIGN KEY (clientId)  REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_orders_user     FOREIGN KEY (userId)    REFERENCES users(id)   ON UPDATE CASCADE ON DELETE SET NULL,
      CONSTRAINT fk_orders_dentist  FOREIGN KEY (dentistId) REFERENCES users(id)   ON UPDATE CASCADE ON DELETE SET NULL,
      
      -- Index
      INDEX idx_orders_client (clientId),
      INDEX idx_orders_user   (userId),
      INDEX idx_orders_dent   (dentistId),
      INDEX idx_orders_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  query(sql, cb || (() => {}));
}

/** ------------------------ Helpers JSON ------------------------ */
function parseJSONField(s) { if (!s) return null; try { return JSON.parse(s); } catch { return null; } }
function serializeJSONField(v) { return v == null ? null : JSON.stringify(v); }

/** ------------------------ CRUD ------------------------ */

// Create
function create(data, files = [], cb) {
  const payload = {
    ...data,
    upper_teeth: serializeJSONField(data.upper_teeth),
    lower_teeth: serializeJSONField(data.lower_teeth),
    file_paths:  serializeJSONField(files.map(f => ({ storedName: f.filename, originalName: f.originalname, url: `/uploads/${f.filename}` }))),
    numDent:     serializeJSONField(data.numDent),
    dentistId:   1, // dentiste unique
  };
  query("INSERT INTO orders SET ?", payload, (err, result) => {
    if (err) return cb(err);
    const orderId = result.insertId;

    // Ajout fichiers dans order_files
    files.forEach(f => {
      query(
        "INSERT INTO order_files (orderId, storedName, originalName, url, uploadedBy, uploadedById) VALUES (?,?,?,?,?,?)",
        [orderId, f.filename, f.originalname, `/uploads/${f.filename}`, data.uploadedBy || 'user', data.uploadedById || null]
      );
    });

    cb(null, { id: orderId, ...data, files: files.map(f => ({ storedName: f.filename, originalName: f.originalname, url: `/uploads/${f.filename}` })) });
  });
}

// Find all
function findAll(cb) {
  query(`
    SELECT o.*, 
           JSON_ARRAYAGG(JSON_OBJECT(
             'id', f.id,
             'storedName', f.storedName,
             'originalName', f.originalName,
             'url', f.url,
             'uploadedBy', f.uploadedBy,
             'uploadedById', f.uploadedById
           )) AS files
    FROM orders o
    LEFT JOIN order_files f ON f.orderId = o.id
    GROUP BY o.id
    ORDER BY o.createdAt DESC
  `, (err, rows) => {
    if (err) return cb(err);
    const mapped = rows.map(r => ({
      ...r,
      upper_teeth: parseJSONField(r.upper_teeth),
      lower_teeth: parseJSONField(r.lower_teeth),
      file_paths:  parseJSONField(r.file_paths),
      numDent:     parseJSONField(r.numDent),
      files:       r.files && r.files !== '[null]' ? JSON.parse(r.files) : [],
    }));
    cb(null, mapped);
  });
}

// Find by id
function findById(id, cb) {
  query(`
    SELECT o.*, 
           JSON_ARRAYAGG(JSON_OBJECT(
             'id', f.id,
             'storedName', f.storedName,
             'originalName', f.originalName,
             'url', f.url,
             'uploadedBy', f.uploadedBy,
             'uploadedById', f.uploadedById
           )) AS files
    FROM orders o
    LEFT JOIN order_files f ON f.orderId = o.id
    WHERE o.id = ?
    GROUP BY o.id
  `, [id], (err, rows) => {
    if (err) return cb(err);
    if (!rows?.length) return cb(null, null);
    const r = rows[0];
    r.upper_teeth = parseJSONField(r.upper_teeth);
    r.lower_teeth = parseJSONField(r.lower_teeth);
    r.file_paths  = parseJSONField(r.file_paths);
    r.numDent     = parseJSONField(r.numDent);
    r.files       = r.files && r.files !== '[null]' ? JSON.parse(r.files) : [];
    cb(null, r);
  });
}

// Update (partiel)
function update(id, data, files = [], cb) {
  const payload = { ...data };
  if ("upper_teeth" in payload) payload.upper_teeth = serializeJSONField(payload.upper_teeth);
  if ("lower_teeth" in payload) payload.lower_teeth = serializeJSONField(payload.lower_teeth);
  if ("numDent"     in payload) payload.numDent     = serializeJSONField(payload.numDent);

  query("UPDATE orders SET ? WHERE id = ?", [payload, id], (err, res) => {
    if (err) return cb(err);
    if (!res || res.affectedRows === 0) return cb(null, null);

    // Ajout fichiers uploadés
    files.forEach(f => {
      query(
        "INSERT INTO order_files (orderId, storedName, originalName, url, uploadedBy, uploadedById) VALUES (?,?,?,?,?,?)",
        [id, f.filename, f.originalname, `/uploads/${f.filename}`, data.uploadedBy || 'user', data.uploadedById || null]
      );
    });

    findById(id, cb);
  });
}

// Remove
function remove(id, cb) {
  // Supprimer fichiers associés
  query("DELETE FROM order_files WHERE orderId = ?", [id], (err) => {
    if (err) return cb(err);
    query("DELETE FROM orders WHERE id = ?", [id], (err2, res) => {
      if (err2) return cb(err2);
      cb(null, !!res?.affectedRows);
    });
  });
}

module.exports = { createTable, create, findAll, findById, update, remove };
