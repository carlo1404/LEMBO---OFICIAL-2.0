const express = require("express")
const router = express.Router()

// Get all productions
router.get("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(
      `
      SELECT p.*, 
             u.nombre as usuario_nombre,
             c.nombre as cultivo_nombre,
             cc.nombre as ciclo_nombre
      FROM producciones p 
      LEFT JOIN usuarios u ON p.usuario_id = u.id 
      LEFT JOIN cultivos c ON p.cultivo_id = c.id
      LEFT JOIN ciclo_cultivo cc ON p.ciclo_id = cc.id
      WHERE p.estado = ? 
      ORDER BY p.fecha_creacion DESC
    `,
      ["habilitado"],
    )

    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get production by ID
router.get("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(
      `
      SELECT p.*, 
             u.nombre as usuario_nombre,
             c.nombre as cultivo_nombre,
             cc.nombre as ciclo_nombre
      FROM producciones p 
      LEFT JOIN usuarios u ON p.usuario_id = u.id 
      LEFT JOIN cultivos c ON p.cultivo_id = c.id
      LEFT JOIN ciclo_cultivo cc ON p.ciclo_id = cc.id
      WHERE p.id = ? AND p.estado = ?
    `,
      [req.params.id, "habilitado"],
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: "Producción no encontrada" })
    }

    res.json(rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new production with input consumption
router.post("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const {
      nombre,
      tipo,
      ubicacion,
      descripcion,
      usuario_id,
      cultivo_id,
      ciclo_id,
      insumos_consumo, // Array of {id, cantidad}
      sensores_ids,
      fecha_de_inicio,
      fecha_fin,
      inversion,
      meta_ganancia,
    } = req.body

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Process input consumption if provided
      let insumos_ids = null
      if (insumos_consumo && insumos_consumo.length > 0) {
        const consumedInputs = []

        for (const consumo of insumos_consumo) {
          // Check if input exists and has enough quantity
          const [inputCheck] = await connection.execute(
            "SELECT id, cantidad, nombre FROM insumos WHERE id = ? AND estado = ? FOR UPDATE",
            [consumo.id, "habilitado"],
          )

          if (inputCheck.length === 0) {
            throw new Error(`Insumo con ID ${consumo.id} no encontrado`)
          }

          const currentQuantity = inputCheck[0].cantidad
          if (currentQuantity < consumo.cantidad) {
            throw new Error(
              `Cantidad insuficiente del insumo "${inputCheck[0].nombre}". Disponible: ${currentQuantity}, Requerido: ${consumo.cantidad}`,
            )
          }

          // Consume the input
          const newQuantity = currentQuantity - consumo.cantidad
          await connection.execute("UPDATE insumos SET cantidad = ? WHERE id = ?", [newQuantity, consumo.id])

          // If quantity reaches 0, disable the input
          if (newQuantity === 0) {
            await connection.execute("UPDATE insumos SET estado = ? WHERE id = ?", ["deshabilitado", consumo.id])
          }

          consumedInputs.push(consumo.id)
        }

        insumos_ids = JSON.stringify(consumedInputs)
      }

      // Create production
      const [result] = await connection.execute(
        `
        INSERT INTO producciones (
          nombre, tipo, ubicacion, descripcion, usuario_id, cultivo_id, ciclo_id,
          insumos_ids, sensores_ids, fecha_de_inicio, fecha_fin, inversion, meta_ganancia
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          nombre,
          tipo,
          ubicacion,
          descripcion,
          usuario_id,
          cultivo_id,
          ciclo_id,
          insumos_ids,
          sensores_ids,
          fecha_de_inicio,
          fecha_fin,
          inversion,
          meta_ganancia,
        ],
      )

      await connection.commit()

      // Get the created production with related data
      const [newProduction] = await pool.execute(
        `
        SELECT p.*, 
               u.nombre as usuario_nombre,
               c.nombre as cultivo_nombre,
               cc.nombre as ciclo_nombre
        FROM producciones p 
        LEFT JOIN usuarios u ON p.usuario_id = u.id 
        LEFT JOIN cultivos c ON p.cultivo_id = c.id
        LEFT JOIN ciclo_cultivo cc ON p.ciclo_id = cc.id
        WHERE p.id = ?
      `,
        [result.insertId],
      )

      res.status(201).json({
        message: "Producción creada exitosamente",
        insumos_consumidos: insumos_consumo || [],
        produccion: newProduction[0],
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

// Update production
router.put("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { nombre, tipo, ubicacion, descripcion, fecha_de_inicio, fecha_fin, inversion, meta_ganancia } = req.body

    const [result] = await pool.execute(
      `
      UPDATE producciones 
      SET nombre = ?, tipo = ?, ubicacion = ?, descripcion = ?, 
          fecha_de_inicio = ?, fecha_fin = ?, inversion = ?, meta_ganancia = ?
      WHERE id = ? AND estado = ?
    `,
      [
        nombre,
        tipo,
        ubicacion,
        descripcion,
        fecha_de_inicio,
        fecha_fin,
        inversion,
        meta_ganancia,
        req.params.id,
        "habilitado",
      ],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producción no encontrada" })
    }

    const [updated] = await pool.execute(
      `
      SELECT p.*, 
             u.nombre as usuario_nombre,
             c.nombre as cultivo_nombre,
             cc.nombre as ciclo_nombre
      FROM producciones p 
      LEFT JOIN usuarios u ON p.usuario_id = u.id 
      LEFT JOIN cultivos c ON p.cultivo_id = c.id
      LEFT JOIN ciclo_cultivo cc ON p.ciclo_id = cc.id
      WHERE p.id = ?
    `,
      [req.params.id],
    )

    res.json(updated[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Soft delete production
router.delete("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")

    const [result] = await pool.execute("UPDATE producciones SET estado = ? WHERE id = ?", [
      "deshabilitado",
      req.params.id,
    ])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producción no encontrada" })
    }

    res.json({ message: "Producción deshabilitada exitosamente" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
