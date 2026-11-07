const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authenticateToken = require('../middleware/authMiddleware');

// Semua endpoint butuh token JWT
router.use(authenticateToken);

router.get('/', accountController.getAccounts);
router.get('/:id', accountController.getAccountById); // Tambah: detail 1 akun
router.post('/', accountController.createAccount);
router.put('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;