const db = require('../config/db'); // Menggunakan koneksi mysql2 pool

exports.getAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [accounts] = await db.query(
      'SELECT id, name, type, balance, created_at FROM accounts WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );

    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};
// 2. Ambil rincian 1 akun berdasarkan ID
exports.getAccountById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [accounts] = await db.query(
      'SELECT id, name, type, balance, created_at FROM accounts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Akun tidak ditemukan!' });
    }

    res.json(accounts[0]);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 3. Tambah Akun Baru (Cash, Bank, GoPay, E-Money, dll.)
exports.createAccount = async (req, res) => {
  const { name, type, balance } = req.body;
  const userId = req.user.id;

  if (!name || !type) {
    return res.status(400).json({ message: 'Nama akun dan tipe akun wajib diisi!' });
  }

  // Validasi tipe akun sesuai ENUM database[cite: 1]
  const validTypes = ['CASH', 'BANK', 'E-WALLET', 'E-MONEY'];
  if (!validTypes.includes(type.toUpperCase())) {
    return res.status(400).json({ message: 'Tipe akun tidak valid! (Pilih: CASH, BANK, E-WALLET, E-MONEY)' });
  }

  try {
    const initialBalance = balance ? parseFloat(balance) : 0.00;

    const [result] = await db.query(
      'INSERT INTO accounts (user_id, name, type, balance) VALUES (?, ?, ?, ?)',
      [userId, name, type.toUpperCase(), initialBalance]
    );

    res.status(201).json({
      message: 'Akun berhasil ditambahkan!',
      account: {
        id: result.insertId,
        user_id: userId,
        name,
        type: type.toUpperCase(),
        balance: initialBalance
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 4. Update Data Akun (Nama / Tipe / Saldo)
exports.updateAccount = async (req, res) => {
  const { id } = req.params;
  const { name, type, balance } = req.body;
  const userId = req.user.id;

  try {
    const [existing] = await db.query(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Akun tidak ditemukan!' });
    }

    const updatedName = name || existing[0].name;
    const updatedType = type ? type.toUpperCase() : existing[0].type;
    const updatedBalance = balance !== undefined ? parseFloat(balance) : existing[0].balance;

    await db.query(
      'UPDATE accounts SET name = ?, type = ?, balance = ? WHERE id = ? AND user_id = ?',
      [updatedName, updatedType, updatedBalance, id, userId]
    );

    res.json({ message: 'Akun berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 5. Hapus Akun
exports.deleteAccount = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      'DELETE FROM accounts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Akun tidak ditemukan!' });
    }

    res.json({ message: 'Akun berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};