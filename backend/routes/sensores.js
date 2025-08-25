const express = require("express")
const router = express.Router()

// Valores exactos según los enums de Prisma
const validTipoSensor = ["Sensor de contacto", "Sensor de distancia", "Sensores de luz"]
const validUnidadMedida = ["Temperatura", "Distancia", "Presión"]
const validTiempoEscaneo = ["Sensores lentos", "Sensores de velocidad media", "Sensores rápidos"]
const validEstado = ["habilitado", "deshabilitado"]

function sanitizeUsuarioId(id) {
  if (id === undefined || id === null || id === '') return null
  const n = Number(id)
  return Number.isInteger(n) ? n : null
}

function sendError(res, status, message) {
  console.error("API Error:", message)
  return res.status(status).json({ error: message })
}

// GET todos los sensores
router.get("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(`
      SELECT s.*, u.nombre as usuario_nombre 
      FROM sensores s 
      LEFT JOIN usuarios u ON s.usuario_id = u.id 
      ORDER BY s.fecha_creacion DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error("GET /sensores ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET sensor por ID
router.get("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(`
      SELECT s.*, u.nombre as usuario_nombre 
      FROM sensores s 
      LEFT JOIN usuarios u ON s.usuario_id = u.id 
      WHERE s.id = ?
    `, [req.params.id])

    if (!rows.length) return sendError(res, 404, "Sensor no encontrado")
    res.json(rows[0])
  } catch (err) {
    console.error("GET /sensores/:id ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// POST crear sensor
router.post("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const {
      tipo_sensor,
      nombre_sensor,
      unidad_medida,
      descripcion,
      tiempo_escaneo,
      usuario_id
    } = req.body

    console.log("POST /sensores body:", req.body)

    // Validaciones de campos requeridos
    if (!tipo_sensor) return sendError(res, 400, "tipo_sensor es requerido")
    if (!nombre_sensor) return sendError(res, 400, "nombre_sensor es requerido")
    if (!unidad_medida) return sendError(res, 400, "unidad_medida es requerida")
    if (!descripcion) return sendError(res, 400, "descripcion es requerida")
    if (!tiempo_escaneo) return sendError(res, 400, "tiempo_escaneo es requerido")

    // Validaciones de enums
    if (!validTipoSensor.includes(tipo_sensor)) {
      return sendError(res, 400, `tipo_sensor inválido. Valores permitidos: ${validTipoSensor.join(", ")}`)
    }
    if (!validUnidadMedida.includes(unidad_medida)) {
      return sendError(res, 400, `unidad_medida inválida. Valores permitidos: ${validUnidadMedida.join(", ")}`)
    }
    if (!validTiempoEscaneo.includes(tiempo_escaneo)) {
      return sendError(res, 400, `tiempo_escaneo inválido. Valores permitidos: ${validTiempoEscaneo.join(", ")}`)
    }

    const sanitizedUserId = sanitizeUsuarioId(usuario_id)

    // Validar usuario si se proporciona
    if (sanitizedUserId !== null) {
      const [userCheck] = await pool.execute(
        "SELECT id FROM usuarios WHERE id = ? AND estado = ?", 
        [sanitizedUserId, "habilitado"]
      )
      if (!userCheck.length) {
        return sendError(res, 400, "usuario_id inválido o usuario deshabilitado")
      }
    }

    // Insertar sensor
    const [result] = await pool.execute(`
      INSERT INTO sensores (tipo_sensor, nombre_sensor, unidad_medida, descripcion, tiempo_escaneo, usuario_id, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'habilitado')
    `, [tipo_sensor, nombre_sensor, unidad_medida, descripcion, tiempo_escaneo, sanitizedUserId])

    // Obtener sensor creado con datos de usuario
    const [rows] = await pool.execute(`
      SELECT s.*, u.nombre as usuario_nombre 
      FROM sensores s 
      LEFT JOIN usuarios u ON s.usuario_id = u.id 
      WHERE s.id = ?
    `, [result.insertId])

    res.status(201).json(rows[0])
  } catch (err) {
    console.error("POST /sensores ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// PUT actualizar sensor
router.put("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const {
      tipo_sensor,
      nombre_sensor,
      unidad_medida,
      descripcion,
      tiempo_escaneo,
      usuario_id,
      estado
    } = req.body

    console.log("PUT /sensores body:", req.body)

    // Validaciones de enums si se proporcionan
    if (tipo_sensor && !validTipoSensor.includes(tipo_sensor)) {
      return sendError(res, 400, `tipo_sensor inválido. Valores permitidos: ${validTipoSensor.join(", ")}`)
    }
    if (unidad_medida && !validUnidadMedida.includes(unidad_medida)) {
      return sendError(res, 400, `unidad_medida inválida. Valores permitidos: ${validUnidadMedida.join(", ")}`)
    }
    if (tiempo_escaneo && !validTiempoEscaneo.includes(tiempo_escaneo)) {
      return sendError(res, 400, `tiempo_escaneo inválido. Valores permitidos: ${validTiempoEscaneo.join(", ")}`)
    }
    if (estado && !validEstado.includes(estado)) {
      return sendError(res, 400, `estado inválido. Valores permitidos: ${validEstado.join(", ")}`)
    }

    const sanitizedUserId = sanitizeUsuarioId(usuario_id)

    // Validar usuario si se proporciona
    if (sanitizedUserId !== null) {
      const [userCheck] = await pool.execute(
        "SELECT id FROM usuarios WHERE id = ? AND estado = ?", 
        [sanitizedUserId, "habilitado"]
      )
      if (!userCheck.length) {
        return sendError(res, 400, "usuario_id inválido o usuario deshabilitado")
      }
    }

    // Actualizar sensor
    const [result] = await pool.execute(`
      UPDATE sensores SET
        tipo_sensor = COALESCE(?, tipo_sensor),
        nombre_sensor = COALESCE(?, nombre_sensor),
        unidad_medida = COALESCE(?, unidad_medida),
        descripcion = COALESCE(?, descripcion),
        tiempo_escaneo = COALESCE(?, tiempo_escaneo),
        usuario_id = COALESCE(?, usuario_id),
        estado = COALESCE(?, estado)
      WHERE id = ?
    `, [tipo_sensor, nombre_sensor, unidad_medida, descripcion, tiempo_escaneo, sanitizedUserId, estado, req.params.id])

    if (!result.affectedRows) {
      return sendError(res, 404, "Sensor no encontrado")
    }

    // Obtener sensor actualizado
    const [rows] = await pool.execute(`
      SELECT s.*, u.nombre as usuario_nombre 
      FROM sensores s 
      LEFT JOIN usuarios u ON s.usuario_id = u.id 
      WHERE s.id = ?
    `, [req.params.id])

    res.json(rows[0])
  } catch (err) {
    console.error("PUT /sensores ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// DELETE eliminar sensor (físicamente)
router.delete("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [result] = await pool.execute(`DELETE FROM sensores WHERE id = ?`, [req.params.id])
    
    if (!result.affectedRows) {
      return sendError(res, 404, "Sensor no encontrado")
    }

    res.json({ message: "Sensor eliminado permanentemente" })
  } catch (err) {
    console.error("DELETE /sensores ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET sensores por tipo
router.get("/tipo/:tipo", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { tipo } = req.params
    
    if (!validTipoSensor.includes(tipo)) {
      return sendError(res, 400, `tipo inválido. Valores permitidos: ${validTipoSensor.join(", ")}`)
    }

    const [rows] = await pool.execute(`
      SELECT s.*, u.nombre as usuario_nombre 
      FROM sensores s
      LEFT JOIN usuarios u ON s.usuario_id = u.id
      WHERE s.tipo_sensor = ?
      ORDER BY s.fecha_creacion DESC
    `, [tipo])

    res.json(rows)
  } catch (err) {
    console.error("GET /sensores/tipo ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET sensores por usuario
router.get("/usuario/:userId", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { userId } = req.params

    const [rows] = await pool.execute(`
      SELECT s.*, u.nombre as usuario_nombre 
      FROM sensores s
      LEFT JOIN usuarios u ON s.usuario_id = u.id
      WHERE s.usuario_id = ?
      ORDER BY s.fecha_creacion DESC
    `, [userId])

    res.json(rows)
  } catch (err) {
    console.error("GET /sensores/usuario ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

module.exports = router
