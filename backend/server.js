const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 4400,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sistema_gestion_agricola",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// Test database connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Please ensure MySQL is running and the database "sistema_gestion_agricola" exists');
    console.error('📋 Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password ? '[SET]' : '[EMPTY]'
    });
  });

module.exports = { pool };