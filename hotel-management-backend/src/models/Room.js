const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
    room_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    room_number: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true
    },
    room_type: {
        type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'presidential'),
        allowNull: false
    },
    floor: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    bed_type: {
        type: DataTypes.ENUM('single', 'double', 'queen', 'king'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'reserved'),
        defaultValue: 'available'
    },
    base_price_day: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    base_price_night: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Room;