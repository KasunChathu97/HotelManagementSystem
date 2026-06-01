const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    log_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    table_name: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    record_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    old_data: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    new_data: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
    }
}, {
    tableName: 'audit_log',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = AuditLog;