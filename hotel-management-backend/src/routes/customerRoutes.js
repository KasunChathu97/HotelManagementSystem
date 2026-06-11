const express = require('express');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { protect } = require('../middleware/authMiddleware');
const { uploadIdImages } = require('../middleware/uploadMiddleware');

const router = express.Router();

const splitName = (value) => {
	const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return { firstName: '', lastName: '' };
	}

	return {
		firstName: parts[0],
		lastName: parts.slice(1).join(' ')
	};
};

const mapCustomer = (customer) => ({
	id: customer.customer_id,
	_id: customer.customer_id,
	customer_id: customer.customer_id,
	name: `${customer.first_name} ${customer.last_name}`.trim(),
	full_name: `${customer.first_name} ${customer.last_name}`.trim(),
	first_name: customer.first_name,
	last_name: customer.last_name,
	email: customer.email,
	phone: customer.phone,
	address: customer.address,
	id_type: customer.id_type,
	id_number: customer.id_number,
	id_front_image: customer.id_front_image,
	id_back_image: customer.id_back_image,
	nationality: customer.nationality,
	createdAt: customer.created_at,
	created_at: customer.created_at
});

router.get('/', protect, async (req, res) => {
	try {
		const customers = await sequelize.query(
			`SELECT customer_id, first_name, last_name, email, phone, address, id_type, id_number, nationality, id_front_image, id_back_image, created_at
			 FROM customers
			 ORDER BY customer_id ASC`,
			{ type: QueryTypes.SELECT }
		);

		res.json({ success: true, data: customers.map(mapCustomer) });
	} catch (error) {
		console.error('Error fetching customers:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

router.post('/', protect, (req, res) => {
	uploadIdImages(req, res, async (err) => {
		if (err) {
			return res.status(400).json({ success: false, message: err.message });
		}

		try {
			const rawName = req.body.name || req.body.full_name || req.body.first_name || '';
			const { firstName, lastName } = splitName(rawName);
			const email = String(req.body.email || '').trim();
			const phone = String(req.body.phone || '').trim();
			const address = req.body.address ? String(req.body.address).trim() : null;
			const id_number = req.body.id_number ? String(req.body.id_number).trim() : '';

			if (!firstName || !email || !phone || !id_number) {
				return res.status(400).json({ success: false, message: 'Name, email, phone, and ID Number are required' });
			}

			const id_front_image = req.files?.['id_front_image']?.[0] ? `/uploads/${req.files['id_front_image'][0].filename}` : null;
			const id_back_image = req.files?.['id_back_image']?.[0] ? `/uploads/${req.files['id_back_image'][0].filename}` : null;

			const insertResult = await sequelize.query(
				`INSERT INTO customers (first_name, last_name, email, phone, address, id_type, id_number, nationality, id_front_image, id_back_image)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				{
					replacements: [
						firstName,
						lastName,
						email,
						phone,
						address,
						req.body.id_type || 'national_id',
						id_number,
						req.body.nationality || null,
						id_front_image,
						id_back_image
					]
				}
			);

			const customerId = insertResult?.[0]?.insertId || insertResult?.[0] || insertResult?.insertId;
			const [rows] = await sequelize.query(
				`SELECT customer_id, first_name, last_name, email, phone, address, id_type, id_number, nationality, id_front_image, id_back_image, created_at
				 FROM customers
				 WHERE customer_id = ?`,
				{ replacements: [customerId], type: QueryTypes.SELECT }
			);

			res.status(201).json({ success: true, data: mapCustomer(rows) });
		} catch (error) {
			console.error('Error creating customer:', error);
			if (error.name === 'SequelizeUniqueConstraintError' || error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
				return res.status(400).json({ success: false, message: 'A guest with this ID Type and ID Number is already registered.' });
			}
			res.status(500).json({ success: false, message: 'Server error' });
		}
	});
});

router.put('/:id', protect, (req, res) => {
	uploadIdImages(req, res, async (err) => {
		if (err) {
			return res.status(400).json({ success: false, message: err.message });
		}

		try {
			const customer = await sequelize.query(
				`SELECT customer_id, first_name, last_name, email, phone, address, id_type, id_number, nationality, id_front_image, id_back_image, created_at
				 FROM customers
				 WHERE customer_id = ?`,
				{ replacements: [req.params.id], type: QueryTypes.SELECT }
			);

			if (!customer.length) {
				return res.status(404).json({ success: false, message: 'Customer not found' });
			}

			const existing = customer[0];
			const rawName = req.body.name || req.body.full_name || `${existing.first_name} ${existing.last_name}`;
			const { firstName, lastName } = splitName(rawName);
			const email = String(req.body.email ?? existing.email).trim();
			const phone = String(req.body.phone ?? existing.phone).trim();
			const address = req.body.address !== undefined ? String(req.body.address).trim() : existing.address;
			const id_number = req.body.id_number !== undefined ? String(req.body.id_number).trim() : existing.id_number;

			const id_front_image = req.files?.['id_front_image']?.[0] ? `/uploads/${req.files['id_front_image'][0].filename}` : existing.id_front_image;
			const id_back_image = req.files?.['id_back_image']?.[0] ? `/uploads/${req.files['id_back_image'][0].filename}` : existing.id_back_image;

			await sequelize.query(
				`UPDATE customers
				 SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, id_type = ?, id_number = ?, nationality = ?, id_front_image = ?, id_back_image = ?
				 WHERE customer_id = ?`,
				{
					replacements: [
						firstName || existing.first_name,
						lastName || existing.last_name,
						email,
						phone,
						address,
						req.body.id_type || existing.id_type || 'national_id',
						id_number,
						req.body.nationality !== undefined ? req.body.nationality : existing.nationality,
						id_front_image,
						id_back_image,
						req.params.id
					]
				}
			);

			const updated = await sequelize.query(
				`SELECT customer_id, first_name, last_name, email, phone, address, id_type, id_number, nationality, id_front_image, id_back_image, created_at
				 FROM customers
				 WHERE customer_id = ?`,
				{ replacements: [req.params.id], type: QueryTypes.SELECT }
			);

			res.json({ success: true, data: mapCustomer(updated[0]) });
		} catch (error) {
			console.error('Error updating customer:', error);
			if (error.name === 'SequelizeUniqueConstraintError' || error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
				return res.status(400).json({ success: false, message: 'A guest with this ID Type and ID Number is already registered.' });
			}
			res.status(500).json({ success: false, message: 'Server error' });
		}
	});
});

router.delete('/:id', protect, async (req, res) => {
	try {
		const deleted = await sequelize.query(
			`DELETE FROM customers WHERE customer_id = ?`,
			{ replacements: [req.params.id] }
		);

		const affected = deleted?.[1]?.affectedRows || deleted?.[0]?.affectedRows || deleted?.affectedRows || 0;
		if (!affected) {
			return res.status(404).json({ success: false, message: 'Customer not found' });
		}

		res.json({ success: true, message: 'Customer deleted successfully' });
	} catch (error) {
		console.error('Error deleting customer:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

module.exports = router;