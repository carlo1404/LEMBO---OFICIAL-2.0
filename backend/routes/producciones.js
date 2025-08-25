const express = require("express")
const router = express.Router()

// Valores válidos según enums de Prisma
const validEstado = ["habilitado", "deshabilitado"]

function sendError(res, status, message) {
  console.error("API Error:", message)
  return res.status(status).json({ error: message })
}

// GET todas las producciones (habilitadas y deshabilitadas)
router.get("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(`
      SELECT p.*, 
             u.nombre as usuario_nombre,
             c.nombre as cultivo_nombre,
             cc.nombre as ciclo_nombre
      FROM producciones p 
      LEFT JOIN usuarios u ON p.usuario_id = u.id 
      LEFT JOIN cultivos c ON p.cultivo_id = c.id
      LEFT JOIN ciclo_cultivo cc ON p.ciclo_id = cc.id
      ORDER BY p.fecha_creacion DESC
    `)
    res.json(rows)
  } catch (error) {
    console.error("GET /producciones ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET producción por ID
router.get("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(`
      SELECT p.*, 
             u.nombre as usuario_nombre,
             c.nombre as cultivo_nombre,
             cc.nombre as ciclo_nombre
      FROM producciones p 
      LEFT JOIN usuarios u ON p.usuario_id = u.id 
      LEFT JOIN cultivos c ON p.cultivo_id = c.id
      LEFT JOIN ciclo_cultivo cc ON p.ciclo_id = cc.id
      WHERE p.id = ?
    `, [req.params.id])

    if (rows.length === 0) {
      return sendError(res, 404, "Producción no encontrada")
    }
    res.json(rows[0])
  } catch (error) {
    console.error("GET /producciones/:id ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// POST crear producción con consumo de insumos
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
    } = req.body

    console.log("POST /producciones body:", req.body)

    // Validaciones básicas
    if (!nombre) return sendError(res, 400, "nombre es requerido")
    if (!tipo) return sendError(res, 400, "tipo es requerido")
    if (!ubicacion) return sendError(res, 400, "ubicacion es requerida")
    if (!descripcion) return sendError(res, 400, "descripcion es requerida")

    // Validar fechas
    if (fecha_de_inicio && fecha_fin && new Date(fecha_de_inicio) >= new Date(fecha_fin)) {
      return sendError(res, 400, "La fecha de inicio debe ser anterior a la fecha de fin")
    }

    // Iniciar transacción
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Procesar consumo de insumos y calcular inversión
      let insumos_ids = null
      let inversionCalculada = 0
      const insumosConsumidos = []

      if (insumos_consumo && insumos_consumo.length > 0) {
        const consumedInputs = []

        for (const consumo of insumos_consumo) {
          // Verificar si el insumo existe y tiene cantidad suficiente
          const [inputCheck] = await connection.execute(
            "SELECT id, cantidad, nombre, valor FROM insumos WHERE id = ? AND estado = ? FOR UPDATE",
            [consumo.id, "habilitado"]
          )

          if (inputCheck.length === 0) {
            throw new Error(`Insumo con ID ${consumo.id} no encontrado o deshabilitado`)
          }

          const currentQuantity = inputCheck[0].cantidad
          const valorUnitario = parseFloat(inputCheck[0].valor)
          
          if (currentQuantity < consumo.cantidad) {
            throw new Error(
              `Cantidad insuficiente del insumo "${inputCheck[0].nombre}". Disponible: ${currentQuantity}, Requerido: ${consumo.cantidad}`
            )
          }

          // Calcular costo del insumo
          const costoInsumo = valorUnitario * consumo.cantidad
          inversionCalculada += costoInsumo

          // Consumir el insumo
          const newQuantity = currentQuantity - consumo.cantidad
          await connection.execute("UPDATE insumos SET cantidad = ? WHERE id = ?", [newQuantity, consumo.id])

          // Si la cantidad llega a 0, deshabilitar el insumo
          if (newQuantity === 0) {
            await connection.execute("UPDATE insumos SET estado = ? WHERE id = ?", ["deshabilitado", consumo.id])
          }

          consumedInputs.push(consumo.id)
          insumosConsumidos.push({
            id: consumo.id,
            nombre: inputCheck[0].nombre,
            cantidad_consumida: consumo.cantidad,
            valor_unitario: valorUnitario,
            costo_total: costoInsumo
          })
        }

        insumos_ids = JSON.stringify(consumedInputs)
      }

      // Calcular meta de ganancia (1.3 veces la inversión)
      const metaGanancia = inversionCalculada * 1.3

      // Procesar sensores_ids si se proporciona
      let sensores_ids_json = null
      if (sensores_ids && sensores_ids.length > 0) {
        // Validar que los sensores existan
        for (const sensorId of sensores_ids) {
          const [sensorCheck] = await connection.execute(
            "SELECT id FROM sensores WHERE id = ? AND estado = ?",
            [sensorId, "habilitado"]
          )
          if (sensorCheck.length === 0) {
            throw new Error(`Sensor con ID ${sensorId} no encontrado o deshabilitado`)
          }
        }
        sensores_ids_json = JSON.stringify(sensores_ids)
      }

      // Crear producción
      const [result] = await connection.execute(`
        INSERT INTO producciones (
          nombre, tipo, ubicacion, descripcion, usuario_id, cultivo_id, ciclo_id,
          insumos_ids, sensores_ids, fecha_de_inicio, fecha_fin, inversion, meta_ganancia, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'habilitado')
      `, [
        nombre,
        tipo,
        ubicacion,
        descripcion,
        usuario_id || null,
        cultivo_id || null,
        ciclo_id || null,
        insumos_ids,
        sensores_ids_json,
        fecha_de_inicio || null,
        fecha_fin || null,
        inversionCalculada,
        metaGanancia,
      ])

      await connection.commit()

      // Obtener la producción creada con datos relacionados
      const [newProduction] = await pool.execute(`
        SELECT p.*, 
               u.nombre as usuario_nombre,
               c.nombre as cultivo_nombre,
               cc.nombre as ciclo_nombre
        FROM producciones p 
        LEFT JOIN usuarios u ON p.usuario_id = u.id 
        LEFT JOIN cultivos c ON p.cultivo_id = c.id
        LEFT JOIN ciclo_cultivo cc ON p.ciclo_id = cc.id
        WHERE p.id = ?
      `, [result.insertId])

      res.status(201).json({
        message: "Producción creada exitosamente",
        insumos_consumidos: insumosConsumidos,
        inversion_calculada: inversionCalculada,
        meta_calculada: metaGanancia,
        produccion: newProduction[0],
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("POST /producciones ERROR:", error)
    return sendError(res, 500, error.message)
  }
})

// PUT actualizar producción (CORREGIDO)
router.put("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { 
      nombre, 
      tipo, 
      ubicacion, 
      descripcion, 
      fecha_de_inicio, 
      fecha_fin,
      estado 
    } = req.body

    console.log("PUT /producciones body:", req.body)
    console.log("PUT /producciones ID:", req.params.id)

    // Validaciones básicas
    if (nombre && nombre.length > 100) {
      return sendError(res, 400, "nombre no puede exceder 100 caracteres")
    }
    if (tipo && tipo.length > 50) {
      return sendError(res, 400, "tipo no puede exceder 50 caracteres")
    }
    if (ubicacion && ubicacion.length > 100) {
      return sendError(res, 400, "ubicacion no puede exceder 100 caracteres")
    }

    // Validar estado si se proporciona
    if (estado && !validEstado.includes(estado)) {
      return sendError(res, 400, `estado inválido. Valores permitidos: ${validEstado.join(", ")}`)
    }

    // Validar fechas
    if (fecha_de_inicio && fecha_fin && new Date(fecha_de_inicio) >= new Date(fecha_fin)) {
      return sendError(res, 400, "La fecha de inicio debe ser anterior a la fecha de fin")
    }

    // Verificar que la producción existe
    const [existingProd] = await pool.execute("SELECT id FROM producciones WHERE id = ?", [req.params.id])
    if (existingProd.length === 0) {
      return sendError(res, 404, "Producción no encontrada")
    }

    const [result] = await pool.execute(`
      UPDATE producciones 
      SET nombre = COALESCE(?, nombre),
          tipo = COALESCE(?, tipo),
          ubicacion = COALESCE(?, ubicacion),
          descripcion = COALESCE(?, descripcion),
          fecha_de_inicio = COALESCE(?, fecha_de_inicio),
          fecha_fin = COALESCE(?, fecha_fin),
          estado = COALESCE(?, estado)
      WHERE id = ?
    `, [
      nombre || null,
      tipo || null,
      ubicacion || null,
      descripcion || null,
      fecha_de_inicio || null,
      fecha_fin || null,
      estado || null,
      req.params.id,
    ])

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Producción no encontrada")
    }

    const [updated] = await pool.execute(`
      SELECT p.*, 
             u.nombre as usuario_nombre,
             c.nombre as cultivo_nombre,
             cc.nombre as ciclo_nombre
      FROM producciones p 
      LEFT JOIN usuarios u ON p.usuario_id = u.id 
      LEFT JOIN cultivos c ON p.cultivo_id = c.id
      LEFT JOIN ciclo_cultivo cc ON p.ciclo_id = cc.id
      WHERE p.id = ?
    `, [req.params.id])

    res.json(updated[0])
  } catch (error) {
    console.error("PUT /producciones ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// DELETE eliminar producción (físicamente)
router.delete("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")

    const [result] = await pool.execute("DELETE FROM producciones WHERE id = ?", [req.params.id])

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Producción no encontrada")
    }

    res.json({ message: "Producción eliminada permanentemente" })
  } catch (error) {
    console.error("DELETE /producciones ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET producción con detalles de insumos y sensores
router.get("/:id/detalles", async (req, res) => {
  try {
    const { pool } = require("../server")
    
    // Obtener producción
    const [produccion] = await pool.execute(`
      SELECT p.*, 
             u.nombre as usuario_nombre,
             c.nombre as cultivo_nombre,
             cc.nombre as ciclo_nombre
      FROM producciones p 
      LEFT JOIN usuarios u ON p.usuario_id = u.id 
      LEFT JOIN cultivos c ON p.cultivo_id = c.id
      LEFT JOIN ciclo_cultivo cc ON p.ciclo_id = cc.id
      WHERE p.id = ?
    `, [req.params.id])

    if (produccion.length === 0) {
      return sendError(res, 404, "Producción no encontrada")
    }

    const prod = produccion[0]
    
    // Obtener detalles de insumos si existen
    let insumos = []
    if (prod.insumos_ids) {
      try {
        const insumosIds = JSON.parse(prod.insumos_ids)
        if (insumosIds.length > 0) {
          const placeholders = insumosIds.map(() => '?').join(',')
          const [insumosData] = await pool.execute(
            `SELECT id, nombre, tipo, valor FROM insumos WHERE id IN (${placeholders})`,
            insumosIds
          )
          insumos = insumosData
        }
      } catch (e) {
        console.error("Error parsing insumos_ids:", e)
      }
    }

    // Obtener detalles de sensores si existen
    let sensores = []
    if (prod.sensores_ids) {
      try {
        const sensoresIds = JSON.parse(prod.sensores_ids)
        if (sensoresIds.length > 0) {
          const placeholders = sensoresIds.map(() => '?').join(',')
          const [sensoresData] = await pool.execute(
            `SELECT id, nombre_sensor, tipo_sensor FROM sensores WHERE id IN (${placeholders})`,
            sensoresIds
          )
          sensores = sensoresData
        }
      } catch (e) {
        console.error("Error parsing sensores_ids:", e)
      }
    }

    res.json({
      ...prod,
      insumos_detalles: insumos,
      sensores_detalles: sensores
    })
  } catch (error) {
    console.error("GET /producciones/:id/detalles ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

module.exports = router
