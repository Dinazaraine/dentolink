"use strict";

const { query } = require("../config/database");

function createTable(cb) {
  const sql = `
    CREATE TABLE IF NOT EXISTS order_products (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      orderId   INT UNSIGNED NOT NULL,
      productId INT UNSIGNED NOT NULL,
      quantity  INT UNSIGNED NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_op_order   FOREIGN KEY (orderId)   REFERENCES orders(id)   ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_op_product FOREIGN KEY (productId) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
      UNIQUE KEY uq_order_product (orderId, productId),
      INDEX idx_op_order (orderId),
      INDEX idx_op_product (productId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  query(sql, cb || function () {});
}

function create(data, cb) {
  query("INSERT INTO order_products SET ?", data, (err, result) => {
    if (err) return cb(err);
    cb(null, Object.assign({ id: result.insertId }, data));
  });
}
function findAll(cb) { query("SELECT * FROM order_products", (e, r)=> e?cb(e):cb(null,r)); }
function findById(id, cb) {
  query("SELECT * FROM order_products WHERE id = ?", [id], (e, rows)=> {
    if (e) return cb(e);
    cb(null, rows && rows[0] ? rows[0] : null);
  });
}
function update(id, data, cb) {
  query("UPDATE order_products SET ? WHERE id = ?", [data, id], (e, r)=> {
    if (e) return cb(e);
    if (!r || !r.affectedRows) return cb(null, null);
    findById(id, cb);
  });
}
function remove(id, cb) {
  query("DELETE FROM order_products WHERE id = ?", [id], (e, r)=> e?cb(e):cb(null, !!r?.affectedRows));
}

function findByOrderId(orderId, cb)  { query("SELECT * FROM order_products WHERE orderId = ?",  [orderId], cb); }
function findByProductId(productId, cb){ query("SELECT * FROM order_products WHERE productId = ?",[productId], cb); }

module.exports = {
  createTable, create, findAll, findById, update, remove,
  findByOrderId, findByProductId,
};
