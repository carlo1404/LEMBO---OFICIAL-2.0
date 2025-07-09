const express = require("express")
const mysql = require("mysql2/promise")
const cors = require("cors")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "agricultural_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

const pool = mysql.createPool(dbConfig)

// Test database connection
app.get("/health", async (req, res) => {
  try {
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    res.json({ status: "OK", message: "Database connected successfully" })
  } catch (error) {
    res.status(500).json({ status: "ERROR", message: error.message })
  }
})

// Error handler middleware
const errorHandler = (error, req, res, next) => {
  console.error(error)
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  })
}

app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = { app, pool }
