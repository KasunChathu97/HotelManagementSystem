const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// Import all admin controllers
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Get all users
// @route   GET /api/v1/admin/users
router.get('/users', protect, isAdmin, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password_hash'] }
        });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Create new user
// @route   POST /api/v1/admin/users
router.post('/users', protect, isAdmin, async (req, res) => {
    try {
        const { username, email, full_name, name, role, password } = req.body;
        
        const user = await User.create({
            username,
            email,
            full_name: full_name || name,
            role,
            password_hash: password
        });
        
        await AuditLog.create({
            user_id: req.user.user_id,
            action: 'CREATE_USER',
            table_name: 'users',
            record_id: user.user_id,
            new_data: JSON.stringify({ username, email, role }),
            ip_address: req.ip
        });
        
        res.status(201).json({
            success: true,
            data: { id: user.user_id, username, email, full_name, role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Update user
// @route   PUT /api/v1/admin/users/:id
router.put('/users/:id', protect, isAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const oldData = { ...user.get() };
        const { username, email, full_name, name, role, password } = req.body;
        const updates = {
            username: username ?? user.username,
            email: email ?? user.email,
            full_name: full_name || name || user.full_name,
            role: role ?? user.role
        };

        if (password) {
            updates.password_hash = password;
        }

        await user.update(updates);
        
        await AuditLog.create({
            user_id: req.user.user_id,
            action: 'UPDATE_USER',
            table_name: 'users',
            record_id: user.user_id,
            old_data: JSON.stringify(oldData),
            new_data: JSON.stringify(updates),
            ip_address: req.ip
        });
        
        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        if (user.user_id === req.user.user_id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }
        
        await user.destroy();
        
        await AuditLog.create({
            user_id: req.user.user_id,
            action: 'DELETE_USER',
            table_name: 'users',
            record_id: user.user_id,
            ip_address: req.ip
        });
        
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Get audit logs
// @route   GET /api/v1/admin/audit-logs
router.get('/audit-logs', protect, isAdmin, async (req, res) => {
    try {
        const logs = await AuditLog.findAll({
            order: [['created_at', 'DESC']],
            limit: 100
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;