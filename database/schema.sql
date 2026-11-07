-- ============================================================
-- FINANCE MANAGER - DATABASE SCHEMA
-- MySQL | db_finance_manager
-- ============================================================

-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS db_finance_manager 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE db_finance_manager;

-- ============================================================
-- TABEL 1: USERS
-- Menyimpan data akun pengguna aplikasi
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABEL 2: ACCOUNTS
-- Menyimpan semua jenis rekening/dompet user:
--   CASH     = Uang tunai di dompet
--   BANK     = Rekening bank (BCA, Mandiri, BRI, dll.)
--   E-WALLET = Dompet digital (GoPay, OVO, DANA, ShopeePay, LinkAja)
--   E-MONEY  = Kartu e-money fisik (Flazz, Brizzi, TapCash, e-Toll)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  type        ENUM('CASH', 'BANK', 'E-WALLET', 'E-MONEY') NOT NULL,
  balance     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABEL 3: CATEGORIES
-- Kategori transaksi (bisa dibuat user sendiri)
--   Type INCOME  = kategori pemasukan
--   Type EXPENSE = kategori pengeluaran
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  type        ENUM('INCOME', 'EXPENSE') NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABEL 4: TRANSACTIONS
-- Mencatat setiap transaksi keuangan (pemasukan & pengeluaran)
-- Saldo di tabel accounts otomatis terupdate saat transaksi masuk
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  account_id  INT           NOT NULL,
  category_id INT           NULL,              -- Boleh kosong (tidak dikategorikan)
  type        ENUM('INCOME', 'EXPENSE') NOT NULL,
  amount      DECIMAL(15,2) NOT NULL,
  description TEXT          NULL,
  date        DATE          NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)        ON DELETE CASCADE,
  FOREIGN KEY (account_id)  REFERENCES accounts(id)     ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)   ON DELETE SET NULL
);

-- ============================================================
-- TABEL 5: TRANSFERS
-- Mencatat transfer antar akun (e.g., BCA -> GoPay, Bank -> E-Money)
-- Fee = biaya admin transfer (bisa 0 jika tidak ada biaya)
-- ============================================================
CREATE TABLE IF NOT EXISTS transfers (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT           NOT NULL,
  from_account_id   INT           NOT NULL,
  to_account_id     INT           NOT NULL,
  amount            DECIMAL(15,2) NOT NULL,
  fee               DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  date              DATE          NOT NULL,
  description       TEXT          NULL,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)           REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (from_account_id)   REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (to_account_id)     REFERENCES accounts(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEX untuk performa query (optional, sangat disarankan)
-- ============================================================
CREATE INDEX idx_transactions_user_date  ON transactions (user_id, date DESC);
CREATE INDEX idx_transactions_account    ON transactions (account_id);
CREATE INDEX idx_transfers_user          ON transfers (user_id);
CREATE INDEX idx_accounts_user           ON accounts (user_id);

-- ============================================================
-- CATATAN PENGGUNAAN:
-- Jalankan file ini di phpMyAdmin Laragon, atau via terminal:
--   mysql -u root < database/schema.sql
-- ============================================================
