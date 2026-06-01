const express = require('express');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const normalizeStatus = (status) => {
	const normalized = String(status || 'confirmed').toLowerCase();
	if (['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'].includes(normalized)) {
		return normalized;
	}
	return 'confirmed';
};

const makeReference = () => `BK${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const mapBooking = (booking) => ({
	id: booking.booking_id,
	booking_id: booking.booking_id,
	booking_reference: booking.booking_reference,
	bookingReference: booking.booking_reference,
	customer: {
		id: booking.customer_id,
		name: `${booking.first_name} ${booking.last_name}`.trim(),
		full_name: `${booking.first_name} ${booking.last_name}`.trim(),
		email: booking.email,
		phone: booking.phone
	},
	room: {
		id: booking.room_id,
		roomNumber: booking.room_number,
		room_number: booking.room_number,
		roomType: booking.room_type,
		room_type: booking.room_type
	},
	checkIn: booking.check_in_date,
	check_in_date: booking.check_in_date,
	checkOut: booking.check_out_date,
	check_out_date: booking.check_out_date,
	checkInTime: booking.check_in_time,
	check_in_time: booking.check_in_time,
	status: formatStatus(booking.booking_status),
	booking_status: booking.booking_status,
	totalNights: booking.total_nights,
	total_nights: booking.total_nights,
	totalAmount: Number(booking.total_amount),
	total_amount: Number(booking.total_amount),
	createdAt: booking.booking_date,
	created_at: booking.booking_date
});

const computeTotalNights = (checkInDate, checkOutDate) => {
	const start = new Date(checkInDate);
	const end = new Date(checkOutDate);
	const diffTime = end.getTime() - start.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Number.isFinite(diffDays) && diffDays > 0 ? diffDays : 0;
};

const formatStatus = (status) => {
	switch (status) {
		case 'confirmed': return 'Pending';
		case 'checked_in': return 'Checked-In';
		case 'checked_out': return 'Checked-Out';
		case 'cancelled': return 'Cancelled';
		case 'no_show': return 'No Show';
		default: return status ? status.replace(/_/g, ' ') : 'Pending';
	}
};

const loadBookingById = async (bookingId) => {
	const [booking] = await sequelize.query(
		`SELECT b.booking_id, b.booking_reference, b.check_in_date, b.check_out_date, b.check_in_time, b.booking_status,
			b.total_nights, b.total_amount, b.base_amount, b.tax_amount, b.discount_amount, b.booking_date,
			c.customer_id, c.first_name, c.last_name, c.email, c.phone,
			r.room_id, r.room_number, r.room_type, r.base_price_day, r.base_price_night
		 FROM bookings b
		 JOIN customers c ON b.customer_id = c.customer_id
		 JOIN rooms r ON b.room_id = r.room_id
		 WHERE b.booking_id = ?`,
		{ replacements: [bookingId], type: QueryTypes.SELECT }
	);

	return booking ? mapBooking(booking) : null;
};

router.get('/', protect, async (req, res) => {
	try {
		const bookings = await sequelize.query(
			`SELECT b.booking_id, b.booking_reference, b.check_in_date, b.check_out_date, b.check_in_time, b.booking_status,
					b.total_nights, b.total_amount, b.base_amount, b.tax_amount, b.discount_amount, b.booking_date,
					c.customer_id, c.first_name, c.last_name, c.email, c.phone,
					r.room_id, r.room_number, r.room_type, r.base_price_day, r.base_price_night
			 FROM bookings b
			 JOIN customers c ON b.customer_id = c.customer_id
			 JOIN rooms r ON b.room_id = r.room_id
			 ORDER BY b.booking_date DESC`,
			{ type: QueryTypes.SELECT }
		);

		res.json({ success: true, data: bookings.map(mapBooking) });
	} catch (error) {
		console.error('Error fetching bookings:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.post('/', protect, async (req, res) => {
	try {
		const customerId = Number.parseInt(req.body.customerId ?? req.body.customer_id, 10);
		const roomId = Number.parseInt(req.body.roomId ?? req.body.room_id, 10);
		const checkInDate = req.body.checkIn ?? req.body.check_in_date;
		const checkOutDate = req.body.checkOut ?? req.body.check_out_date;
		const checkInTime = req.body.checkInTime ?? req.body.check_in_time ?? '12:00';
		const specialRequests = req.body.specialRequests ?? req.body.special_requests ?? null;
		const bookingStatus = normalizeStatus(req.body.status ?? req.body.booking_status);

		if (!Number.isInteger(customerId) || !Number.isInteger(roomId) || !checkInDate || !checkOutDate) {
			return res.status(400).json({ success: false, message: 'Customer, room, and dates are required' });
		}

		const start = new Date(checkInDate);
		const end = new Date(checkOutDate);
		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
			return res.status(400).json({ success: false, message: 'Check-out date must be after check-in date' });
		}

		const [customer] = await sequelize.query(
			`SELECT customer_id FROM customers WHERE customer_id = ?`,
			{ replacements: [customerId], type: QueryTypes.SELECT }
		);
		if (!customer) {
			return res.status(404).json({ success: false, message: 'Customer not found' });
		}

		const [room] = await sequelize.query(
			`SELECT room_id, base_price_day, base_price_night, status FROM rooms WHERE room_id = ?`,
			{ replacements: [roomId], type: QueryTypes.SELECT }
		);
		if (!room) {
			return res.status(404).json({ success: false, message: 'Room not found' });
		}

		const totalNights = computeTotalNights(checkInDate, checkOutDate);
		if (!totalNights) {
			return res.status(400).json({ success: false, message: 'Invalid booking dates' });
		}

		const baseAmount = Number(room.base_price_night || room.base_price_day || 0) * totalNights;
		const taxAmount = 0;
		const discountAmount = 0;
		const totalAmount = baseAmount + taxAmount - discountAmount;
		const bookingReference = makeReference();

		await sequelize.query(
			`INSERT INTO bookings (
				booking_reference,
				customer_id,
				room_id,
				check_in_date,
				check_out_date,
				check_in_time,
				booking_status,
				total_nights,
				day_nights_count,
				base_amount,
				tax_amount,
				discount_amount,
				total_amount,
				created_by,
				special_requests
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			{
				replacements: [
					bookingReference,
					customerId,
					roomId,
					checkInDate,
					checkOutDate,
					checkInTime,
					bookingStatus,
					totalNights,
					null,
					baseAmount,
					taxAmount,
					discountAmount,
					totalAmount,
					req.user?.user_id || null,
					specialRequests
				]
			}
		);

		const createdBooking = await sequelize.query(
			`SELECT b.booking_id, b.booking_reference, b.check_in_date, b.check_out_date, b.check_in_time, b.booking_status,
				b.total_nights, b.total_amount, b.base_amount, b.tax_amount, b.discount_amount, b.booking_date,
				c.customer_id, c.first_name, c.last_name, c.email, c.phone,
				r.room_id, r.room_number, r.room_type, r.base_price_day, r.base_price_night
			 FROM bookings b
			 JOIN customers c ON b.customer_id = c.customer_id
			 JOIN rooms r ON b.room_id = r.room_id
			 WHERE b.booking_reference = ?`,
			{ replacements: [bookingReference], type: QueryTypes.SELECT }
		);

		res.status(201).json({ success: true, data: mapBooking(createdBooking[0]) });
	} catch (error) {
		console.error('Error creating booking:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.post('/:id/checkin', protect, async (req, res) => {
	try {
		const [booking] = await sequelize.query(
			`SELECT booking_id, booking_status FROM bookings WHERE booking_id = ?`,
			{ replacements: [req.params.id], type: QueryTypes.SELECT }
		);

		if (!booking) {
			return res.status(404).json({ success: false, message: 'Booking not found' });
		}

		await sequelize.query(
			`UPDATE bookings SET booking_status = 'checked_in' WHERE booking_id = ?`,
			{ replacements: [req.params.id] }
		);

		const updated = await loadBookingById(req.params.id);
		res.json({ success: true, data: updated });
	} catch (error) {
		console.error('Error checking in booking:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.post('/:id/checkout', protect, async (req, res) => {
	try {
		const [booking] = await sequelize.query(
			`SELECT booking_id, booking_status FROM bookings WHERE booking_id = ?`,
			{ replacements: [req.params.id], type: QueryTypes.SELECT }
		);

		if (!booking) {
			return res.status(404).json({ success: false, message: 'Booking not found' });
		}

		await sequelize.query(
			`UPDATE bookings SET booking_status = 'checked_out' WHERE booking_id = ?`,
			{ replacements: [req.params.id] }
		);

		const updated = await loadBookingById(req.params.id);
		res.json({ success: true, data: updated });
	} catch (error) {
		console.error('Error checking out booking:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

module.exports = router;