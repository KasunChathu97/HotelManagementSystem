const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user exists
        const user = await User.findOne({
            where: { username }
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }
        
        // Check password
        const isPasswordValid = await user.validatePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Update last login
        await user.update({ last_login: new Date() });
        
        // Log login activity
        await AuditLog.create({
            user_id: user.user_id,
            action: 'LOGIN',
            table_name: 'users',
            ip_address: req.ip,
            new_data: JSON.stringify({ username: user.username })
        });
        
        // Generate token
        const token = generateToken(user.user_id);
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.user_id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                },
                token
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

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.user_id, {
            attributes: { exclude: ['password_hash'] }
        });
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findByPk(req.user.user_id);
        
        // Check current password
        const isPasswordValid = await user.validatePassword(currentPassword);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Update password
        user.password_hash = newPassword;
        await user.save();
        
        // Log password change
        await AuditLog.create({
            user_id: req.user.user_id,
            action: 'CHANGE_PASSWORD',
            table_name: 'users',
            ip_address: req.ip
        });
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Logout
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        await AuditLog.create({
            user_id: req.user.user_id,
            action: 'LOGOUT',
            table_name: 'users',
            ip_address: req.ip
        });
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    login,
    getMe,
    changePassword,
    logout
};