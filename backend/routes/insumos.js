const express = require("express")
const router = express.Router()

// Get all inputs
router.get("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(
      `
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.estado = ? 
      ORDER BY i.fecha_creacion DESC
    `,
      ["habilitado"],
    )

    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get input by ID
router.get("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(
      `
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.id = ? AND i.estado = ?
    `,
      [req.params.id, "habilitado"],
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: "Insumo no encontrado" })
    }

    res.json(rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new input
router.post("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { nombre, tipo, unidad_medida, valor, cantidad, descripcion, usuario_id } = req.body

    const [result] = await pool.execute(
      `
      INSERT INTO insumos (nombre, tipo, unidad_medida, valor, cantidad, descripcion, usuario_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [nombre, tipo, unidad_medida, valor, cantidad, descripcion, usuario_id],
    )

    const [newInput] = await pool.execute(
      `
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.id = ?
    `,
      [result.insertId],
    )

    res.status(201).json(newInput[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update input
router.put("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { nombre, tipo, unidad_medida, valor, cantidad, descripcion } = req.body

    const [result] = await pool.execute(
      `
      UPDATE insumos 
      SET nombre = ?, tipo = ?, unidad_medida = ?, valor = ?, cantidad = ?, descripcion = ? 
      WHERE id = ? AND estado = ?
    `,
      [nombre, tipo, unidad_medida, valor, cantidad, descripcion, req.params.id, "habilitado"],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Insumo no encontrado" })
    }

    const [updated] = await pool.execute(
      `
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.id = ?
    `,
      [req.params.id],
    )

    res.json(updated[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Consume input (reduce quantity)
router.post("/:id/consume", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { cantidad_consumida } = req.body

    if (!cantidad_consumida || cantidad_consumida <= 0) {
      return res.status(400).json({
        error: "La cantidad consumida debe ser mayor a 0",
      })
    }

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Get current quantity
      const [current] = await connection.execute(
        "SELECT cantidad FROM insumos WHERE id = ? AND estado = ? FOR UPDATE",
        [req.params.id, "habilitado"],
      )

      if (current.length === 0) {
        throw new Error("Insumo no encontrado")
      }

      const currentQuantity = current[0].cantidad

      if (currentQuantity < cantidad_consumida) {
        throw new Error(`Cantidad insuficiente. Disponible: ${currentQuantity}`)
      }

      const newQuantity = currentQuantity - cantidad_consumida

      // Update quantity
      await connection.execute("UPDATE insumos SET cantidad = ? WHERE id = ?", [newQuantity, req.params.id])

      // If quantity reaches 0, optionally disable the input
      if (newQuantity === 0) {
        await connection.execute("UPDATE insumos SET estado = ? WHERE id = ?", ["deshabilitado", req.params.id])
      }

      await connection.commit()

      // Get updated input
      const [updated] = await pool.execute(
        `
        SELECT i.*, u.nombre as usuario_nombre 
        FROM insumos i 
        LEFT JOIN usuarios u ON i.usuario_id = u.id 
        WHERE i.id = ?
      `,
        [req.params.id],
      )

      res.json({
        message: "Insumo consumido exitosamente",
        cantidad_consumida,
        cantidad_restante: newQuantity,
        insumo: updated[0],
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Soft delete input
router.delete("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")

    const [result] = await pool.execute("UPDATE insumos SET estado = ? WHERE id = ?", ["deshabilitado", req.params.id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Insumo no encontrado" })
    }

    res.json({ message: "Insumo deshabilitado exitosamente" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
