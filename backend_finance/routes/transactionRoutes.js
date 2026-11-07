const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', transactionController.getTransactions);           // Semua transaksi + transfer
router.post('/', transactionController.createTransaction);        // Tambah pemasukan/pengeluaran
router.post('/transfer', transactionController.createTransfer);   // Transfer antar akun
router.delete('/:id', transactionController.deleteTransaction);   // Hapus transaksi

if (transactionController.getTransfers) {
  router.get('/transfers', transactionController.getTransfers);
}

module.exports = router;