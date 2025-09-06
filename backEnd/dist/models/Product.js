"use strict";

const { query } = require("../config/database");

function createTable(cb) {
  const sql = `
    CREATE TABLE IF NOT EXISTS products (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name  VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  query(sql, cb || function () {});
}

function create(data, cb) {
  query("INSERT INTO products SET ?", data, function (err, result) {
    if (err) return cb(err);
    cb(null, Object.assign({ id: result.insertId }, data));
  });
}
function findAll(cb) { query("SELECT * FROM products", (e, r)=> e?cb(e):cb(null,r)); }
function findById(id, cb) {
  query("SELECT * FROM products WHERE id = ?", [id], (e, rows)=> {
    if (e) return cb(e);
    cb(null, rows && rows[0] ? rows[0] : null);
  });
}
function update(id, data, cb) {
  query("UPDATE products SET ? WHERE id = ?", [data, id], (e, r)=> {
    if (e) return cb(e);
    if (!r || !r.affectedRows) return cb(null, null);
    findById(id, cb);
  });
}
function remove(id, cb) {
  query("DELETE FROM products WHERE id = ?", [id], (e, r)=> e?cb(e):cb(null, !!r?.affectedRows));
}

module.exports = { createTable, create, findAll, findById, update, remove };
