const db = require('../config/db');

exports.createTransaction = async (req, res) => {
  // Mendukung format camelCase (accountId) maupun snake_case (account_id)
  const account_id = req.body.account_id || req.body.accountId;
  const category_id = req.body.category_id || req.body.categoryId;
  const { type, amount, description, date } = req.body;
  const userId = req.user.id;

  if (!account_id || !type || !amount || !date) {
    return res.status(400).json({ message: 'Akun, tipe, jumlah, dan tanggal wajib diisi!' });
  }

  // Ambil koneksi dari pool untuk MySQL Transaction (ACID)
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Kunci row akun dengan FOR UPDATE agar tidak ada race condition
    const [accounts] = await connection.query(
      'SELECT balance FROM accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [account_id, userId]
    );

    if (accounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Akun tidak ditemukan!' });
    }

    const currentBalance = parseFloat(accounts[0].balance);
    const txAmount = parseFloat(amount);
    let newBalance = currentBalance;

    if (type.toUpperCase() === 'INCOME') {
      newBalance += txAmount; // Pemasukan: tambah saldo
    } else if (type.toUpperCase() === 'EXPENSE') {
      if (currentBalance < txAmount) {
        await connection.rollback();
        return res.status(400).json({ message: 'Saldo akun tidak mencukupi untuk pengeluaran ini!' });
      }
      newBalance -= txAmount; // Pengeluaran: kurangi saldo
    } else {
      await connection.rollback();
      return res.status(400).json({ message: 'Tipe transaksi tidak valid! (Pilih: INCOME / EXPENSE)' });
    }

    // Insert record transaksi ke database
    const [txResult] = await connection.query(
      `INSERT INTO transactions (user_id, account_id, category_id, type, amount, description, date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, account_id, category_id || null, type.toUpperCase(), txAmount, description || null, date]
    );

    // Update saldo akun secara atomik
    await connection.query(
      'UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?',
      [newBalance, account_id, userId]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Transaksi berhasil dicatat dan saldo telah diperbarui!',
      transactionId: txResult.insertId,
      updatedBalance: newBalance
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Gagal mencatat transaksi', error: error.message });
  } finally {
    connection.release(); // Kembalikan koneksi ke pool
  }
};

// ============================================================
// 2. Transfer Antar Akun (Top-Up GoPay dari BCA, Isi E-Money, dll.)
// ============================================================
exports.createTransfer = async (req, res) => {
  // Dukungan kompatibilitas: Cek camelCase & snake_case sekaligus
  const from_account_id = req.body.from_account_id || req.body.fromAccountId;
  const to_account_id = req.body.to_account_id || req.body.toAccountId;
  const { amount, fee, description, date } = req.body;
  const userId = req.user.id;

  if (!from_account_id || !to_account_id || !amount || !date) {
    return res.status(400).json({ message: 'Akun asal, akun tujuan, jumlah, dan tanggal wajib diisi!' });
  }

  if (parseInt(from_account_id) === parseInt(to_account_id)) {
    return res.status(400).json({ message: 'Akun asal dan akun tujuan tidak boleh sama!' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const transferAmount = parseFloat(amount);
    const adminFee = fee ? parseFloat(fee) : 0.00;
    const totalDeduction = transferAmount + adminFee;

    // Cek & kunci saldo akun asal
    const [fromAcc] = await connection.query(
      'SELECT balance, name FROM accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [from_account_id, userId]
    );

    if (fromAcc.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Akun asal tidak ditemukan!' });
    }

    const fromBalance = parseFloat(fromAcc[0].balance);
    if (fromBalance < totalDeduction) {
      await connection.rollback();
      return res.status(400).json({ message: 'Saldo akun asal tidak mencukupi (sudah termasuk biaya admin)!' });
    }

    // Cek & kunci saldo akun tujuan
    const [toAcc] = await connection.query(
      'SELECT balance, name FROM accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [to_account_id, userId]
    );

    if (toAcc.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Akun tujuan tidak ditemukan!' });
    }

    const toBalance = parseFloat(toAcc[0].balance);

    // Kurangi saldo akun asal (jumlah transfer + biaya admin)
    await connection.query(
      'UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?',
      [fromBalance - totalDeduction, from_account_id, userId]
    );

    // Tambah saldo akun tujuan (hanya jumlah transfer, tanpa biaya admin)
    await connection.query(
      'UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?',
      [toBalance + transferAmount, to_account_id, userId]
    );

    // Catat transfer ke tabel transfers
    const [transferResult] = await connection.query(
      `INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, fee, date, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, from_account_id, to_account_id, transferAmount, adminFee, date, description || null]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Transfer saldo berhasil!',
      transferId: transferResult.insertId
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Gagal melakukan transfer', error: error.message });
  } finally {
    connection.release();
  }
};

// ============================================================
// 3. Ambil Riwayat Transaksi (dengan filter opsional)
// ============================================================
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { account_id, accountId, type, start_date, end_date, limit = 50 } = req.query;
    const selectedAccount = account_id || accountId;

    let query = `
      SELECT t.id, t.account_id, t.category_id, t.type, t.amount, t.description, t.date,
             a.name AS account_name, a.type AS account_type,
             c.name AS category_name, c.type AS category_type
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?`;

    const params = [userId];

    if (selectedAccount) { query += ' AND t.account_id = ?'; params.push(selectedAccount); }
    if (type) { query += ' AND t.type = ?'; params.push(type.toUpperCase()); }
    if (start_date) { query += ' AND t.date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND t.date <= ?'; params.push(end_date); }

    query += ' ORDER BY t.date DESC, t.id DESC LIMIT ?';
    params.push(parseInt(limit));

    const [transactions] = await db.query(query, params);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// ============================================================
// 4. Ambil Riwayat Transfer Antar Akun
// ============================================================
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const query = `
      SELECT * FROM (
        -- 1. Transaksi Biasa (INCOME / EXPENSE)
        SELECT 
          t.id AS id,
          'TRANSACTION' AS source_type,
          t.account_id,
          t.type,
          t.amount,
          t.description,
          t.date,
          a.name AS account_name,
          c.name AS category_name
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?

        UNION ALL

        -- 2. Data Transfer
        SELECT 
          tr.id AS id,
          'TRANSFER' AS source_type,
          tr.from_account_id AS account_id,
          'TRANSFER' AS type,
          tr.amount,
          CONCAT('Transfer: ', fa.name, ' ➔ ', ta.name, IF(tr.description IS NOT NULL AND tr.description != '', CONCAT(' (', tr.description, ')'), '')) AS description,
          tr.date,
          fa.name AS account_name,
          'Transfer Antar Akun' AS category_name
        FROM transfers tr
        JOIN accounts fa ON tr.from_account_id = fa.id
        JOIN accounts ta ON tr.to_account_id = ta.id
        WHERE tr.user_id = ?
      ) AS combined_history
      ORDER BY date DESC, id DESC
      LIMIT ?
    `;

    const [rows] = await db.query(query, [userId, userId, parseInt(limit)]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// ============================================================
// 5. Hapus Transaksi + Otomatis Revert Saldo Akun
// ============================================================
exports.deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [transactions] = await connection.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (transactions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Transaksi tidak ditemukan!' });
    }

    const tx = transactions[0];

    const [accounts] = await connection.query(
      'SELECT balance FROM accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [tx.account_id, userId]
    );

    if (accounts.length > 0) {
      const currentBalance = parseFloat(accounts[0].balance);
      const txAmount = parseFloat(tx.amount);
      let revertedBalance;

      if (tx.type === 'INCOME') {
        revertedBalance = currentBalance - txAmount;
      } else {
        revertedBalance = currentBalance + txAmount;
      }

      await connection.query(
        'UPDATE accounts SET balance = ? WHERE id = ?',
        [revertedBalance, tx.account_id]
      );
    }

    await connection.query('DELETE FROM transactions WHERE id = ?', [id]);

    await connection.commit();

    res.json({ message: 'Transaksi berhasil dihapus dan saldo telah dikembalikan!' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Gagal menghapus transaksi', error: error.message });
  } finally {
    connection.release();
  }
};