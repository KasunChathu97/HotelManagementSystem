const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const moment = require('moment');

const Booking = sequelize.define('Booking', {
    booking_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    booking_reference: {
        type: DataTypes.STRING(20),
        unique: true,
        defaultValue: () => {
            return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
        }
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    check_in_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    check_out_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    check_in_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    booking_status: {
        type: DataTypes.ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
        defaultValue: 'confirmed'
    },
    total_nights: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    day_nights_count: {
        type: DataTypes.JSON,
        allowNull: true
    },
    base_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    special_requests: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'bookings',
    timestamps: true,
    createdAt: 'booking_date',
    updatedAt: false
});

module.exports = Booking;