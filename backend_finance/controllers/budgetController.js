const db = require('../config/db'); // ⚠️ adjust path to match where your db.js actually lives

// ===== BILLS (checklist / schedule) =====

exports.getBills = async (req, res) => {
  try {
    const userId = req.user.id; // ⚠️ change to req.user.userId etc. if that's your JWT payload field
    const [rows] = await db.query(
      `SELECT b.*, c.name AS category_name
       FROM budget_bills b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ?
       ORDER BY b.is_paid ASC, b.due_date ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data tagihan', error: err.message });
  }
};

exports.createBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, amount, due_date, category_id, recurring } = req.body;

    if (!title || !amount || !due_date) {
      return res.status(400).json({ message: 'Title, amount, dan due_date wajib diisi' });
    }

    const [result] = await db.query(
      `INSERT INTO budget_bills (user_id, category_id, title, amount, due_date, recurring)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, category_id || null, title, amount, due_date, recurring || 'none']
    );

    res.status(201).json({ id: result.insertId, message: 'Tagihan berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah tagihan', error: err.message });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, amount, due_date, category_id, recurring, is_paid } = req.body;

    const [existing] = await db.query(
      'SELECT * FROM budget_bills WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Tagihan tidak ditemukan' });
    }

    await db.query(
      `UPDATE budget_bills SET
        title = COALESCE(?, title),
        amount = COALESCE(?, amount),
        due_date = COALESCE(?, due_date),
        category_id = ?,
        recurring = COALESCE(?, recurring),
        is_paid = COALESCE(?, is_paid)
       WHERE id = ? AND user_id = ?`,
      [
        title ?? null,
        amount ?? null,
        due_date ?? null,
        category_id !== undefined ? category_id : existing[0].category_id,
        recurring ?? null,
        is_paid !== undefined ? is_paid : null,
        id,
        userId,
      ]
    );

    res.json({ message: 'Tagihan berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui tagihan', error: err.message });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await db.query('DELETE FROM budget_bills WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Tagihan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus tagihan', error: err.message });
  }
};

// ===== CATEGORY LIMITS + LIVE SPENDING PROGRESS =====

exports.getBudgetOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    // ⚠️ Assumes `transactions` has columns: user_id, category_id, amount, type ('expense'/'income'), date
    const [rows] = await db.query(
      `SELECT
         c.id AS category_id,
         c.name AS category_name,
         COALESCE(l.monthly_limit, 0) AS monthly_limit,
         COALESCE(SUM(CASE
            WHEN t.type = 'expense'
             AND MONTH(t.date) = MONTH(CURDATE())
             AND YEAR(t.date) = YEAR(CURDATE())
            THEN t.amount ELSE 0 END), 0) AS spent
       FROM categories c
       LEFT JOIN budget_limits l ON l.category_id = c.id AND l.user_id = c.user_id
       LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = c.user_id
       WHERE c.user_id = ?
       GROUP BY c.id, c.name, l.monthly_limit`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil overview budget', error: err.message });
  }
};

exports.setLimit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, monthly_limit } = req.body;

    if (!category_id || monthly_limit === undefined) {
      return res.status(400).json({ message: 'category_id dan monthly_limit wajib diisi' });
    }

    await db.query(
      `INSERT INTO budget_limits (user_id, category_id, monthly_limit)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit)`,
      [userId, category_id, monthly_limit]
    );

    res.json({ message: 'Limit budget berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menyimpan limit budget', error: err.message });
  }
};