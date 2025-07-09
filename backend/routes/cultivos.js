const express = require("express")
const router = express.Router()

// Get all crops
router.get("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(
      `
      SELECT c.*, u.nombre as usuario_nombre 
      FROM cultivos c 
      LEFT JOIN usuarios u ON c.usuario_id = u.id 
      WHERE c.estado = ? 
      ORDER BY c.fecha_creacion DESC
    `,
      ["habilitado"],
    )

    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get crop by ID
router.get("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(
      `
      SELECT c.*, u.nombre as usuario_nombre 
      FROM cultivos c 
      LEFT JOIN usuarios u ON c.usuario_id = u.id 
      WHERE c.id = ? AND c.estado = ?
    `,
      [req.params.id, "habilitado"],
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cultivo no encontrado" })
    }

    res.json(rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new crop
router.post("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { nombre, tipo, ubicacion, descripcion, usuario_id, tamano } = req.body

    const [result] = await pool.execute(
      `
      INSERT INTO cultivos (nombre, tipo, ubicacion, descripcion, usuario_id, tamano) 
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [nombre, tipo, ubicacion, descripcion, usuario_id, tamano],
    )

    const [newCrop] = await pool.execute(
      `
      SELECT c.*, u.nombre as usuario_nombre 
      FROM cultivos c 
      LEFT JOIN usuarios u ON c.usuario_id = u.id 
      WHERE c.id = ?
    `,
      [result.insertId],
    )

    res.status(201).json(newCrop[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update crop
router.put("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { nombre, tipo, ubicacion, descripcion, tamano } = req.body

    const [result] = await pool.execute(
      `
      UPDATE cultivos 
      SET nombre = ?, tipo = ?, ubicacion = ?, descripcion = ?, tamano = ? 
      WHERE id = ? AND estado = ?
    `,
      [nombre, tipo, ubicacion, descripcion, tamano, req.params.id, "habilitado"],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cultivo no encontrado" })
    }

    const [updated] = await pool.execute(
      `
      SELECT c.*, u.nombre as usuario_nombre 
      FROM cultivos c 
      LEFT JOIN usuarios u ON c.usuario_id = u.id 
      WHERE c.id = ?
    `,
      [req.params.id],
    )

    res.json(updated[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Soft delete crop
router.delete("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")

    const [result] = await pool.execute("UPDATE cultivos SET estado = ? WHERE id = ?", ["deshabilitado", req.params.id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cultivo no encontrado" })
    }

    res.json({ message: "Cultivo deshabilitado exitosamente" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
