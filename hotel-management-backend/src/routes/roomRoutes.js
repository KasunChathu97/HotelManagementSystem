const express = require('express');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { protect } = require('../middleware/authMiddleware');
const Room = require('../models/Room');

const router = express.Router();

const toTitleCase = (value) => value
	? value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
	: value;

const normalizeRoomType = (value) => {
	const normalized = String(value || 'standard').toLowerCase();
	return ['standard', 'deluxe', 'suite', 'presidential'].includes(normalized) ? normalized : 'standard';
};

const normalizeBedType = (roomType, value) => {
	const normalized = String(value || '').toLowerCase();
	if (['single', 'double', 'queen', 'king'].includes(normalized)) {
		return normalized;
	}

	if (roomType === 'suite' || roomType === 'presidential') {
		return 'king';
	}

	if (roomType === 'deluxe') {
		return 'queen';
	}

	return 'double';
};

const normalizeStatus = (value) => {
	const normalized = String(value || 'available').toLowerCase();
	return ['available', 'occupied', 'maintenance', 'reserved'].includes(normalized) ? normalized : 'available';
};

const inferFloor = (roomNumber, explicitFloor) => {
	const parsedFloor = Number.parseInt(explicitFloor, 10);
	if (Number.isInteger(parsedFloor) && parsedFloor > 0) {
		return parsedFloor;
	}

	const digits = String(roomNumber || '').match(/\d+/);
	if (digits) {
		const inferred = Number.parseInt(digits[0].charAt(0), 10);
		if (Number.isInteger(inferred) && inferred > 0) {
			return inferred;
		}
	}

	return 1;
};

const mapRoom = (room) => ({
	id: room.room_id,
	room_id: room.room_id,
	roomNumber: room.room_number,
	room_number: room.room_number,
	roomType: toTitleCase(room.room_type),
	room_type: room.room_type,
	floor: room.floor,
	capacity: room.capacity,
	bedType: toTitleCase(room.bed_type),
	bed_type: room.bed_type,
	status: toTitleCase(room.status),
	live_status: toTitleCase(room.status),
	priceDay: Number(room.base_price_day),
	priceNight: Number(room.base_price_night),
	price_day: Number(room.base_price_day),
	price_night: Number(room.base_price_night),
	createdAt: room.created_at,
	created_at: room.created_at
});

router.get('/', protect, async (req, res) => {
	try {
		const rooms = await sequelize.query(
			`SELECT room_id, room_number, room_type, floor, capacity, bed_type, status, base_price_day, base_price_night
			 FROM rooms
			 ORDER BY room_number ASC`,
			{ type: QueryTypes.SELECT }
		);

		res.json({ success: true, data: rooms.map(mapRoom) });
	} catch (error) {
		console.error('Error fetching rooms:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.post('/', protect, async (req, res) => {
	try {
		const roomNumber = String(req.body.roomNumber || req.body.room_number || '').trim();
		if (!roomNumber) {
			return res.status(400).json({ success: false, message: 'Room number is required' });
		}

		const roomType = normalizeRoomType(req.body.roomType || req.body.room_type);
		const bedType = normalizeBedType(roomType, req.body.bedType || req.body.bed_type);
		const status = normalizeStatus(req.body.status || req.body.live_status);
		const floor = inferFloor(roomNumber, req.body.floor);
		const capacity = Number.parseInt(req.body.capacity, 10) || 1;
		const basePriceDay = Number.parseFloat(req.body.priceDay ?? req.body.price_day ?? req.body.base_price_day ?? 0);
		const basePriceNight = Number.parseFloat(req.body.priceNight ?? req.body.price_night ?? req.body.base_price_night ?? 0);

		const room = await Room.create({
			room_number: roomNumber,
			room_type: roomType,
			floor,
			capacity,
			bed_type: bedType,
			status,
			base_price_day: basePriceDay,
			base_price_night: basePriceNight
		});

		res.status(201).json({ success: true, data: mapRoom(room) });
	} catch (error) {
		console.error('Error creating room:', error);
		if (error.name === 'SequelizeUniqueConstraintError') {
			return res.status(409).json({ success: false, message: 'Room number already exists' });
		}
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.put('/:id', protect, async (req, res) => {
	try {
		const room = await Room.findByPk(req.params.id);
		if (!room) {
			return res.status(404).json({ success: false, message: 'Room not found' });
		}

		const roomNumber = req.body.roomNumber || req.body.room_number;
		if (roomNumber !== undefined) {
			const trimmedRoomNumber = String(roomNumber).trim();
			if (!trimmedRoomNumber) {
				return res.status(400).json({ success: false, message: 'Room number is required' });
			}
			room.room_number = trimmedRoomNumber;
		}

		if (req.body.roomType || req.body.room_type) {
			room.room_type = normalizeRoomType(req.body.roomType || req.body.room_type);
		}

		if (req.body.bedType || req.body.bed_type) {
			room.bed_type = normalizeBedType(room.room_type, req.body.bedType || req.body.bed_type);
		}

		if (req.body.status || req.body.live_status) {
			room.status = normalizeStatus(req.body.status || req.body.live_status);
		}

		if (req.body.floor !== undefined) {
			room.floor = inferFloor(room.room_number, req.body.floor);
		}

		if (req.body.capacity !== undefined) {
			room.capacity = Number.parseInt(req.body.capacity, 10) || room.capacity;
		}

		if (req.body.priceDay !== undefined || req.body.price_day !== undefined || req.body.base_price_day !== undefined) {
			room.base_price_day = Number.parseFloat(req.body.priceDay ?? req.body.price_day ?? req.body.base_price_day ?? room.base_price_day);
		}

		if (req.body.priceNight !== undefined || req.body.price_night !== undefined || req.body.base_price_night !== undefined) {
			room.base_price_night = Number.parseFloat(req.body.priceNight ?? req.body.price_night ?? req.body.base_price_night ?? room.base_price_night);
		}

		await room.save();
		res.json({ success: true, data: mapRoom(room) });
	} catch (error) {
		console.error('Error updating room:', error);
		if (error.name === 'SequelizeUniqueConstraintError') {
			return res.status(409).json({ success: false, message: 'Room number already exists' });
		}
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.delete('/:id', protect, async (req, res) => {
	try {
		const room = await Room.findByPk(req.params.id);
		if (!room) {
			return res.status(404).json({ success: false, message: 'Room not found' });
		}

		await room.destroy();
		res.json({ success: true, message: 'Room deleted successfully' });
	} catch (error) {
		console.error('Error deleting room:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

module.exports = router;