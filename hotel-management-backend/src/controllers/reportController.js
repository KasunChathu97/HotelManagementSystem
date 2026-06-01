const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

// @desc    Get dashboard statistics
// @route   GET /api/v1/reports/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');
        const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
        
        // Total rooms
        const totalRooms = await sequelize.query(
            'SELECT COUNT(*) as total FROM rooms',
            { type: QueryTypes.SELECT }
        );
        
        // Available rooms
        const availableRooms = await sequelize.query(
            "SELECT COUNT(*) as available FROM rooms WHERE status = 'available'",
            { type: QueryTypes.SELECT }
        );
        
        // Occupied rooms
        const occupiedRooms = await sequelize.query(
            "SELECT COUNT(*) as occupied FROM rooms WHERE status = 'occupied'",
            { type: QueryTypes.SELECT }
        );
        
        // Today's check-ins
        const todayCheckins = await sequelize.query(
            'SELECT COUNT(*) as checkins FROM bookings WHERE check_in_date = :today AND booking_status = "confirmed"',
            {
                replacements: { today },
                type: QueryTypes.SELECT
            }
        );
        
        // Today's check-outs
        const todayCheckouts = await sequelize.query(
            'SELECT COUNT(*) as checkouts FROM bookings WHERE check_out_date = :today AND booking_status = "checked_in"',
            {
                replacements: { today },
                type: QueryTypes.SELECT
            }
        );
        
        // Monthly income
        const monthlyIncome = await sequelize.query(
            `SELECT COALESCE(SUM(amount), 0) as income 
             FROM payments 
             WHERE payment_status = 'completed' 
             AND DATE(payment_date) >= :startOfMonth`,
            {
                replacements: { startOfMonth },
                type: QueryTypes.SELECT
            }
        );
        
        // Monthly expenses
        const monthlyExpenses = await sequelize.query(
            `SELECT COALESCE(SUM(amount), 0) as expenses 
             FROM expenses 
             WHERE DATE(expense_date) >= :startOfMonth`,
            {
                replacements: { startOfMonth },
                type: QueryTypes.SELECT
            }
        );
        
        // Recent bookings
        const recentBookings = await sequelize.query(
            `SELECT b.*, c.first_name, c.last_name, r.room_number 
             FROM bookings b
             JOIN customers c ON b.customer_id = c.customer_id
             JOIN rooms r ON b.room_id = r.room_id
             ORDER BY b.booking_date DESC
             LIMIT 10`,
            { type: QueryTypes.SELECT }
        );
        
        res.json({
            success: true,
            data: {
                rooms: {
                    total: totalRooms[0].total,
                    available: availableRooms[0].available,
                    occupied: occupiedRooms[0].occupied,
                    occupancy_rate: ((occupiedRooms[0].occupied / totalRooms[0].total) * 100).toFixed(2)
                },
                todays_activity: {
                    checkins: todayCheckins[0].checkins,
                    checkouts: todayCheckouts[0].checkouts
                },
                monthly_finance: {
                    income: monthlyIncome[0].income,
                    expenses: monthlyExpenses[0].expenses,
                    profit: monthlyIncome[0].income - monthlyExpenses[0].expenses
                },
                recent_bookings: recentBookings
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get income report
// @route   GET /api/v1/reports/income
// @access  Private/Admin
const getIncomeReport = async (req, res) => {
    try {
        const { start_date, end_date, group_by = 'day' } = req.query;
        
        let groupByClause = '';
        if (group_by === 'day') {
            groupByClause = 'DATE(payment_date)';
        } else if (group_by === 'month') {
            groupByClause = "DATE_FORMAT(payment_date, '%Y-%m')";
        } else if (group_by === 'year') {
            groupByClause = "DATE_FORMAT(payment_date, '%Y')";
        }
        
        const incomeData = await sequelize.query(
            `SELECT 
                ${groupByClause} as period,
                COALESCE(SUM(amount), 0) as total_income,
                COUNT(*) as transaction_count,
                payment_method
             FROM payments
             WHERE payment_status = 'completed'
             ${start_date ? 'AND DATE(payment_date) >= :start_date' : ''}
             ${end_date ? 'AND DATE(payment_date) <= :end_date' : ''}
             GROUP BY period, payment_method
             ORDER BY period DESC`,
            {
                replacements: { start_date, end_date },
                type: QueryTypes.SELECT
            }
        );
        
        res.json({
            success: true,
            data: incomeData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get expense report
// @route   GET /api/v1/reports/expenses
// @access  Private/Admin
const getExpenseReport = async (req, res) => {
    try {
        const { start_date, end_date, expense_type } = req.query;
        
        let whereClause = 'WHERE 1=1';
        if (start_date) whereClause += ' AND DATE(expense_date) >= :start_date';
        if (end_date) whereClause += ' AND DATE(expense_date) <= :end_date';
        if (expense_type) whereClause += ' AND expense_type = :expense_type';
        
        const expenses = await sequelize.query(
            `SELECT 
                expense_type,
                category,
                SUM(amount) as total_amount,
                COUNT(*) as expense_count,
                DATE_FORMAT(expense_date, '%Y-%m') as month
             FROM expenses
             ${whereClause}
             GROUP BY expense_type, category, DATE_FORMAT(expense_date, '%Y-%m')
             ORDER BY expense_date DESC`,
            {
                replacements: { start_date, end_date, expense_type },
                type: QueryTypes.SELECT
            }
        );
        
        const totalExpenses = await sequelize.query(
            `SELECT COALESCE(SUM(amount), 0) as total
             FROM expenses
             ${whereClause}`,
            {
                replacements: { start_date, end_date, expense_type },
                type: QueryTypes.SELECT
            }
        );
        
        res.json({
            success: true,
            data: {
                total: totalExpenses[0].total,
                breakdown: expenses
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get profit & loss report
// @route   GET /api/v1/reports/profit-loss
// @access  Private/Admin
const getProfitLossReport = async (req, res) => {
    try {
        const { year, month } = req.query;
        
        let dateCondition = '';
        if (year && month) {
            dateCondition = `AND DATE(payment_date) >= '${year}-${month}-01' 
                             AND DATE(payment_date) <= LAST_DAY('${year}-${month}-01')`;
        } else if (year) {
            dateCondition = `AND YEAR(payment_date) = ${year}`;
        }
        
        const profitLoss = await sequelize.query(
            `SELECT
                'Income' as type,
                COALESCE(SUM(amount), 0) as total
             FROM payments
             WHERE payment_status = 'completed' ${dateCondition}
             
             UNION ALL
             
             SELECT
                'Expenses' as type,
                COALESCE(SUM(amount), 0) as total
             FROM expenses
             WHERE 1=1 ${dateCondition.replace('payment_date', 'expense_date')}`,
            { type: QueryTypes.SELECT }
        );
        
        const income = profitLoss.find(p => p.type === 'Income')?.total || 0;
        const expenses = profitLoss.find(p => p.type === 'Expenses')?.total || 0;
        
        res.json({
            success: true,
            data: {
                total_income: income,
                total_expenses: expenses,
                gross_profit: income - expenses,
                profit_margin: income > 0 ? ((income - expenses) / income * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get room occupancy report
// @route   GET /api/v1/reports/occupancy
// @access  Private/Admin
const getOccupancyReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const occupancy = await sequelize.query(
            `SELECT 
                r.room_id,
                r.room_number,
                r.room_type,
                COUNT(b.booking_id) as total_bookings,
                SUM(CASE WHEN b.booking_status IN ('confirmed', 'checked_in') THEN 1 ELSE 0 END) as current_occupancy,
                AVG(DATEDIFF(b.check_out_date, b.check_in_date)) as avg_stay_duration,
                SUM(b.total_amount) as total_revenue
             FROM rooms r
             LEFT JOIN bookings b ON r.room_id = b.room_id
             WHERE b.booking_status NOT IN ('cancelled', 'no_show')
             ${start_date ? 'AND b.check_in_date >= :start_date' : ''}
             ${end_date ? 'AND b.check_out_date <= :end_date' : ''}
             GROUP BY r.room_id
             ORDER BY total_revenue DESC`,
            {
                replacements: { start_date, end_date },
                type: QueryTypes.SELECT
            }
        );
        
        res.json({
            success: true,
            data: occupancy
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Export report as PDF
// @route   GET /api/v1/reports/export/pdf
// @access  Private/Admin
const exportPDF = async (req, res) => {
    try {
        const { report_type, start_date, end_date } = req.query;
        
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${report_type}_report_${Date.now()}.pdf`);
        
        doc.pipe(res);
        
        // Add content to PDF
        doc.fontSize(20).text(`${report_type.toUpperCase()} Report`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${start_date || 'All'} to ${end_date || 'Present'}`);
        doc.moveDown();
        
        // Add report data based on type
        if (report_type === 'income') {
            const incomeData = await getIncomeReportData(start_date, end_date);
            // Add table to PDF
            doc.text('Income Summary:', { underline: true });
            doc.moveDown();
            incomeData.forEach(item => {
                doc.text(`${item.period}: $${item.total_income} (${item.transaction_count} transactions)`);
            });
        }
        
        doc.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating PDF'
        });
    }
};

// @desc    Export report as Excel
// @route   GET /api/v1/reports/export/excel
// @access  Private/Admin
const exportExcel = async (req, res) => {
    try {
        const { report_type, start_date, end_date } = req.query;
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${report_type}_report`);
        
        // Define columns
        worksheet.columns = [
            { header: 'Period', key: 'period', width: 15 },
            { header: 'Total Amount', key: 'amount', width: 15 },
            { header: 'Transaction Count', key: 'count', width: 20 },
            { header: 'Payment Method', key: 'method', width: 15 }
        ];
        
        // Add data
        let data;
        if (report_type === 'income') {
            data = await getIncomeReportData(start_date, end_date);
            data.forEach(item => {
                worksheet.addRow({
                    period: item.period,
                    amount: item.total_income,
                    count: item.transaction_count,
                    method: item.payment_method
                });
            });
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${report_type}_report_${Date.now()}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating Excel file'
        });
    }
};

// Helper function to get income report data
async function getIncomeReportData(start_date, end_date) {
    return await sequelize.query(
        `SELECT 
            DATE(payment_date) as period,
            COALESCE(SUM(amount), 0) as total_income,
            COUNT(*) as transaction_count,
            payment_method
         FROM payments
         WHERE payment_status = 'completed'
         ${start_date ? 'AND DATE(payment_date) >= :start_date' : ''}
         ${end_date ? 'AND DATE(payment_date) <= :end_date' : ''}
         GROUP BY DATE(payment_date), payment_method
         ORDER BY period DESC`,
        {
            replacements: { start_date, end_date },
            type: QueryTypes.SELECT
        }
    );
}

module.exports = {
    getDashboardStats,
    getIncomeReport,
    getExpenseReport,
    getProfitLossReport,
    getOccupancyReport,
    exportPDF,
    exportExcel
};