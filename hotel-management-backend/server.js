const app = require('./src/app');
const { initializeDatabase } = require('./src/config/database');
const User = require('./src/models/User');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Create default admin user if not exists
const createDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({
            where: { username: 'admin' }
        });
        
        if (!adminExists) {
            await User.create({
                username: 'admin',
                email: process.env.ADMIN_EMAIL || 'admin@hotel.com',
                password_hash: process.env.ADMIN_PASSWORD || 'Admin@123456',
                full_name: 'System Administrator',
                role: 'admin',
                is_active: true
            });
            console.log('Default admin user created successfully');
        } else {
            adminExists.email = process.env.ADMIN_EMAIL || adminExists.email;
            adminExists.full_name = adminExists.full_name || 'System Administrator';
            adminExists.role = 'admin';
            adminExists.is_active = true;
            adminExists.password_hash = process.env.ADMIN_PASSWORD || 'Admin@123456';
            await adminExists.save();
            console.log('Default admin user refreshed successfully');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
};

// Initialize database and start server
const startServer = async () => {
    try {
        await initializeDatabase();
        await createDefaultAdmin();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV}`);
            console.log(`🔗 API URL: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();