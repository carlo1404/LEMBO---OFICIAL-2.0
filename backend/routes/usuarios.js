const express = require("express")
const router = express.Router()

// Get all users
router.get("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute("SELECT * FROM usuarios WHERE estado = ? ORDER BY fecha_creacion DESC", [
      "habilitado",
    ])
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute("SELECT * FROM usuarios WHERE id = ? AND estado = ?", [
      req.params.id,
      "habilitado",
    ])

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.json(rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new user
router.post("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { tipo_documento, numero_documento, nombre, telefono, correo, rol } = req.body

    // Check if user already exists
    const [existing] = await pool.execute("SELECT id FROM usuarios WHERE numero_documento = ? OR correo = ?", [
      numero_documento,
      correo,
    ])

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Usuario ya existe con ese documento o correo",
      })
    }

    const [result] = await pool.execute(
      `INSERT INTO usuarios (tipo_documento, numero_documento, nombre, telefono, correo, rol) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tipo_documento, numero_documento, nombre, telefono, correo, rol],
    )

    const [newUser] = await pool.execute("SELECT * FROM usuarios WHERE id = ?", [result.insertId])

    res.status(201).json(newUser[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user
router.put("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { nombre, telefono, correo, rol } = req.body

    const [result] = await pool.execute(
      `UPDATE usuarios SET nombre = ?, telefono = ?, correo = ?, rol = ? 
       WHERE id = ? AND estado = ?`,
      [nombre, telefono, correo, rol, req.params.id, "habilitado"],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    const [updated] = await pool.execute("SELECT * FROM usuarios WHERE id = ?", [req.params.id])

    res.json(updated[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Soft delete user
router.delete("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")

    const [result] = await pool.execute("UPDATE usuarios SET estado = ? WHERE id = ?", ["deshabilitado", req.params.id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.json({ message: "Usuario deshabilitado exitosamente" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
