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

// All report routes require authentication
router.use(protect);

// Dashboard stats are accessible by both Admin and Staff
router.get('/dashboard', getDashboardStats);

// Restrict all other analytics and export reports to Admin only
router.get('/income', isAdmin, getIncomeReport);
router.get('/expenses', isAdmin, getExpenseReport);
router.get('/profit-loss', isAdmin, getProfitLossReport);
router.get('/occupancy', isAdmin, getOccupancyReport);
router.get('/export/pdf', isAdmin, exportPDF);
router.get('/export/excel', isAdmin, exportExcel);

module.exports = router;