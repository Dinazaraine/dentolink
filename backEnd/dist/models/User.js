"use strict";

const { query } = require("../config/database");

function createTable(cb) {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(190) NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      companyName VARCHAR(150) NOT NULL,
      phone_fixed VARCHAR(20) DEFAULT NULL,
      phone_mobile VARCHAR(20) DEFAULT NULL,
      siret VARCHAR(20) DEFAULT NULL,
      address VARCHAR(255) NOT NULL,
      zipcode VARCHAR(10) NOT NULL,
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL DEFAULT 'France',
      role ENUM('user','dentiste','admin') NOT NULL DEFAULT 'user',
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      accountStatus ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
      reset_required TINYINT(1) NOT NULL DEFAULT 0,
      last_login_at DATETIME NULL,
      last_seen_at DATETIME NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      is_online TINYINT(1) DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  query(sql, cb || function () {});
}

module.exports = { createTable };
