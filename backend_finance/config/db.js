const mysql = require('mysql2/promise');
require('dotenv').config();

// Buat Connection Pool untuk efisiensi
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Cek Koneksi saat server berjalan
const testConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ Berhasil terhubung ke Database MySQL Laragon');
    connection.release();
  } catch (error) {
    console.error('❌ Gagal terhubung ke Database MySQL:', error.message);
  }
};

testConnection();

module.exports = db;