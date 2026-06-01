const express = require('express');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const normalizePaymentMethod = (value) => {
	const normalized = String(value || 'cash').toLowerCase();
	switch (normalized) {
		case 'cash':
			return 'cash';
		case 'card':
		case 'credit card':
		case 'credit_card':
			return 'credit_card';
		case 'debit card':
		case 'debit_card':
			return 'debit_card';
		case 'bank transfer':
		case 'bank_transfer':
			return 'bank_transfer';
		case 'mobile money':
		case 'online':
			return 'online';
		default:
			return 'cash';
	}
};

const makeReference = () => `PAY${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const mapPayment = (payment) => ({
	id: payment.payment_id,
	payment_id: payment.payment_id,
	booking_id: payment.booking_id,
	booking: {
		id: payment.booking_reference || payment.booking_id,
		room: { roomNumber: payment.room_number, room_number: payment.room_number }
	},
	customer: {
		name: `${payment.first_name || ''} ${payment.last_name || ''}`.trim(),
		full_name: `${payment.first_name || ''} ${payment.last_name || ''}`.trim()
	},
	amount: Number(payment.amount),
	paymentMethod: payment.payment_method,
	payment_method: payment.payment_method,
	paymentStatus: payment.payment_status,
	payment_status: payment.payment_status,
	remarks: payment.notes,
	notes: payment.notes,
	createdAt: payment.payment_date,
	created_at: payment.payment_date
});

router.get('/', protect, async (req, res) => {
	try {
		const payments = await sequelize.query(
			`SELECT p.payment_id, p.booking_id, p.payment_date, p.amount, p.payment_method, p.payment_status, p.notes,
					b.booking_reference, r.room_number, c.first_name, c.last_name
			 FROM payments p
			 LEFT JOIN bookings b ON p.booking_id = b.booking_id
			 LEFT JOIN customers c ON b.customer_id = c.customer_id
			 LEFT JOIN rooms r ON b.room_id = r.room_id
			 ORDER BY p.payment_date DESC`,
			{ type: QueryTypes.SELECT }
		);

		res.json({ success: true, data: payments.map(mapPayment) });
	} catch (error) {
		console.error('Error fetching payments:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.post('/', protect, async (req, res) => {
	try {
		const bookingId = Number.parseInt(req.body.bookingId ?? req.body.booking_id, 10);
		if (!Number.isInteger(bookingId)) {
			return res.status(400).json({ success: false, message: 'Booking is required' });
		}

		const [booking] = await sequelize.query(
			`SELECT b.booking_id, b.booking_reference, b.total_amount, b.customer_id, b.room_id,
				c.first_name, c.last_name, r.room_number
			 FROM bookings b
			 LEFT JOIN customers c ON b.customer_id = c.customer_id
			 LEFT JOIN rooms r ON b.room_id = r.room_id
			 WHERE b.booking_id = ?`,
			{ replacements: [bookingId], type: QueryTypes.SELECT }
		);

		if (!booking) {
			return res.status(404).json({ success: false, message: 'Booking not found' });
		}

		const rawAmount = req.body.amount;
		const amount = rawAmount === undefined || rawAmount === null || rawAmount === ''
			? Number(booking.total_amount || 0)
			: Number.parseFloat(rawAmount);
		if (!Number.isFinite(amount) || amount < 0) {
			return res.status(400).json({ success: false, message: 'Amount must be a valid number' });
		}

		const paymentMethod = normalizePaymentMethod(req.body.paymentMethod ?? req.body.payment_method);
		const notes = req.body.remarks ?? req.body.notes ?? null;
		const paymentReference = makeReference();

		await sequelize.query(
			`INSERT INTO payments (
				booking_id,
				payment_reference,
				amount,
				payment_method,
				payment_status,
				notes,
				received_by
			) VALUES (:bookingId, :paymentReference, :amount, :paymentMethod, :paymentStatus, :notes, :receivedBy)`,
			{
				replacements: {
					bookingId,
					paymentReference,
					amount,
					paymentMethod,
					paymentStatus: 'completed',
					notes,
					receivedBy: req.user?.user_id || null
				}
			}
		);

		const createdPayments = await sequelize.query(
			`SELECT p.payment_id, p.booking_id, p.payment_date, p.amount, p.payment_method, p.payment_status, p.notes,
				b.booking_reference, r.room_number, c.first_name, c.last_name
			 FROM payments p
			 LEFT JOIN bookings b ON p.booking_id = b.booking_id
			 LEFT JOIN customers c ON b.customer_id = c.customer_id
			 LEFT JOIN rooms r ON b.room_id = r.room_id
			 WHERE p.payment_reference = ?`,
			{ replacements: [paymentReference], type: QueryTypes.SELECT }
		);

		res.status(201).json({ success: true, data: mapPayment(createdPayments[0]) });
	} catch (error) {
		console.error('Error creating payment:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

module.exports = router;