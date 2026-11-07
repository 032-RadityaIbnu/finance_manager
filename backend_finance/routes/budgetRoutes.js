const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/bills', budgetController.getBills);
router.post('/bills', budgetController.createBill);
router.put('/bills/:id', budgetController.updateBill);
router.delete('/bills/:id', budgetController.deleteBill);

router.get('/overview', budgetController.getBudgetOverview);
router.post('/limits', budgetController.setLimit);

module.exports = router;