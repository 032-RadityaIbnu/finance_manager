const db = require('../config/db');

// 1. Ambil semua kategori user (INCOME & EXPENSE)
exports.getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY type ASC, name ASC',
      [userId]
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 2. Tambah Kategori Baru
exports.createCategory = async (req, res) => {
  const { name, type } = req.body;
  const userId = req.user.id;

  if (!name || !type) {
    return res.status(400).json({ message: 'Nama dan tipe kategori wajib diisi!' });
  }

  if (!['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
    return res.status(400).json({ message: 'Tipe kategori harus INCOME atau EXPENSE' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
      [userId, name, type.toUpperCase()]
    );

    res.status(201).json({
      message: 'Kategori berhasil ditambahkan!',
      categoryId: result.insertId,
      category: { id: result.insertId, user_id: userId, name, type: type.toUpperCase() }
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 3. Update Kategori
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;
  const userId = req.user.id;

  try {
    // Pastikan kategori milik user ini
    const [existing] = await db.query(
      'SELECT * FROM categories WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan!' });
    }

    const updatedName = name || existing[0].name;
    const updatedType = type ? type.toUpperCase() : existing[0].type;

    if (!['INCOME', 'EXPENSE'].includes(updatedType)) {
      return res.status(400).json({ message: 'Tipe kategori harus INCOME atau EXPENSE' });
    }

    await db.query(
      'UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?',
      [updatedName, updatedType, id, userId]
    );

    res.json({ message: 'Kategori berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 4. Hapus Kategori
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan!' });
    }

    res.json({ message: 'Kategori berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};