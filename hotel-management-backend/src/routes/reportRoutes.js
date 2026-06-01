const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getIncomeReport,
    getExpenseReport,
    getProfitLossReport,
    getOccupancyReport,
    exportPDF,
    exportExcel
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All report routes require admin access
router.use(protect);
router.use(isAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/income', getIncomeReport);
router.get('/expenses', getExpenseReport);
router.get('/profit-loss', getProfitLossReport);
router.get('/occupancy', getOccupancyReport);
router.get('/export/pdf', exportPDF);
router.get('/export/excel', exportExcel);

module.exports = router;