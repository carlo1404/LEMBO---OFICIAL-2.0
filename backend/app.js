const express = require("express")
const cors = require("cors")
require("dotenv").config()

// Import routes
const usuariosRoutes = require("./routes/usuarios")
const insumosRoutes = require("./routes/insumos")
const cultivosRoutes = require("./routes/cultivos")
const produccionesRoutes = require("./routes/producciones")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api/usuarios", usuariosRoutes)
app.use("/api/insumos", insumosRoutes)
app.use("/api/cultivos", cultivosRoutes)
app.use("/api/producciones", produccionesRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Agricultural Management API is running",
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  })
})

// Error handler
app.use((error, req, res, next) => {
  console.error("Error:", error)
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Agricultural Management API running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

module.exports = app
