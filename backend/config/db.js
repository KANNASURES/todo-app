/* =============================================
   DATABASE CONNECTION — StudyFlow
   Uses mysql2 connection pool for performance
============================================= */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection POOL
// (Pool = multiple connections ready — faster than
//  creating a new connection for every request)
const pool = mysql.createPool({
    host:               process.env.DB_HOST,
    port:               process.env.DB_PORT,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    database:           process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit:    10,       // max 10 simultaneous connections
    queueLimit:         0,        // unlimited queue
    timezone:           'Z',      // UTC time
});

// Test the connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL connected successfully!');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Database: ${process.env.DB_NAME}`);
        connection.release(); // always release back to pool
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        console.error('   Check your .env DB credentials');
        process.exit(1); // stop the server if DB fails
    }
}

module.exports = { pool, testConnection };