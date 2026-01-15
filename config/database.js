const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'payroll_bowc',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection (non-blocking - app will start even if DB is not ready)
pool.getConnection()
    .then(connection => {
        console.log('✅ MySQL database connected');
        connection.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection error:', err.message);
        console.error('⚠️  App will continue to start, but database operations will fail until connection is established');
        console.error('💡 Check your DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, and DB_PORT environment variables');
    });

module.exports = pool;

