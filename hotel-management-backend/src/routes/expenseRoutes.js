const express = require('express');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const normalizeExpenseType = (value) => {
	const normalized = String(value || 'other').toLowerCase();
	switch (normalized) {
		case 'utilities':
			return 'utilities';
		case 'supplies':
			return 'supplies';
		case 'maintenance':
			return 'maintenance';
		case 'marketing':
			return 'marketing';
		case 'salary':
			return 'salary';
		case 'tax':
			return 'tax';
		case 'insurance':
			return 'insurance';
		default:
			return 'other';
	}
};

const makeReference = () => `EXP${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const mapExpense = (expense) => ({
	id: expense.expense_id,
	expense_id: expense.expense_id,
	expenseReference: expense.expense_reference,
	expense_reference: expense.expense_reference,
	category: expense.category || expense.expense_type,
	expenseType: expense.expense_type,
	expense_type: expense.expense_type,
	amount: Number(expense.amount),
	remarks: expense.description,
	description: expense.description,
	vendor_name: expense.vendor_name,
	invoice_number: expense.invoice_number,
	payment_method: expense.payment_method,
	createdAt: expense.created_at || expense.expense_date,
	created_at: expense.created_at || expense.expense_date
});

router.get('/', protect, async (req, res) => {
	try {
		const expenses = await sequelize.query(
			`SELECT expense_id, expense_reference, expense_type, category, amount, expense_date, description, vendor_name, invoice_number, payment_method, created_at
			 FROM expenses
			 ORDER BY expense_date DESC, expense_id DESC`,
			{ type: QueryTypes.SELECT }
		);

		res.json({ success: true, data: expenses.map(mapExpense) });
	} catch (error) {
		console.error('Error fetching expenses:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.post('/', protect, async (req, res) => {
	try {
		const amount = Number.parseFloat(req.body.amount);
		if (!Number.isFinite(amount) || amount < 0) {
			return res.status(400).json({ success: false, message: 'Amount must be a valid number' });
		}

		const expenseType = normalizeExpenseType(req.body.category ?? req.body.expenseType ?? req.body.expense_type);
		const category = req.body.category ? String(req.body.category).trim() : null;
		const description = req.body.remarks ?? req.body.description ?? null;
		const expenseReference = makeReference();

		await sequelize.query(
			`INSERT INTO expenses (
				expense_reference,
				expense_type,
				category,
				amount,
				expense_date,
				description,
				payment_method,
				created_by
			) VALUES (:expenseReference, :expenseType, :category, :amount, CURRENT_DATE(), :description, :paymentMethod, :createdBy)`,
			{
				replacements: {
					expenseReference,
					expenseType,
					category,
					amount,
					description,
					paymentMethod: req.body.payment_method || 'cash',
					createdBy: req.user?.user_id || null
				}
			}
		);

		const createdExpenses = await sequelize.query(
			`SELECT expense_id, expense_reference, expense_type, category, amount, expense_date, description, vendor_name, invoice_number, payment_method, created_at
			 FROM expenses
			 WHERE expense_reference = ?`,
			{ replacements: [expenseReference], type: QueryTypes.SELECT }
		);

		res.status(201).json({ success: true, data: mapExpense(createdExpenses[0]) });
	} catch (error) {
		console.error('Error creating expense:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

module.exports = router;