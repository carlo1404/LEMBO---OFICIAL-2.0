const express = require("express")
const router = express.Router()

// Valores exactos según los enums de Prisma
const validEstado = ["habilitado", "deshabilitado"]

function sanitizeUsuarioId(id) {
  if (id === undefined || id === null || id === '') return null
  const n = Number(id)
  return Number.isInteger(n) ? n : null
}

function sanitizeCultivoId(id) {
  if (id === undefined || id === null || id === '') return null
  const n = Number(id)
  return Number.isInteger(n) ? n : null
}

function sendError(res, status, message) {
  console.error("API Error:", message)
  return res.status(status).json({ error: message })
}

// Validar fechas
function validarFechas(periodo_inicio, periodo_final) {
  if (periodo_inicio && periodo_final) {
    const inicio = new Date(periodo_inicio)
    const final = new Date(periodo_final)
    if (inicio >= final) {
      return "La fecha de inicio debe ser anterior a la fecha final"
    }
  }
  return null
}

// GET todos los ciclos de cultivo
router.get("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(`
      SELECT c.*, 
             u.nombre as usuario_nombre,
             cult.nombre as cultivo_nombre
      FROM ciclo_cultivo c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN cultivos cult ON c.cultivo_id = cult.id
      ORDER BY c.fecha_creacion DESC
    `)
    res.json(rows)
  } catch (err) {
    console.error("GET /ciclo-cultivo ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET ciclo de cultivo por ID
router.get("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(`
      SELECT c.*, 
             u.nombre as usuario_nombre,
             cult.nombre as cultivo_nombre
      FROM ciclo_cultivo c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN cultivos cult ON c.cultivo_id = cult.id
      WHERE c.id = ?
    `, [req.params.id])
    
    if (!rows.length) return sendError(res, 404, "Ciclo de cultivo no encontrado")
    res.json(rows[0])
  } catch (err) {
    console.error("GET /ciclo-cultivo/:id ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// POST crear ciclo de cultivo
router.post("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const {
      nombre,
      descripcion,
      periodo_inicio,
      periodo_final,
      novedades,
      usuario_id,
      cultivo_id
    } = req.body

    console.log("POST /ciclo-cultivo body:", req.body)

    // Validaciones de campos requeridos
    if (!nombre) return sendError(res, 400, "nombre es requerido")
    if (!descripcion) return sendError(res, 400, "descripcion es requerida")
    if (!periodo_inicio) return sendError(res, 400, "periodo_inicio es requerido")
    if (!periodo_final) return sendError(res, 400, "periodo_final es requerido")

    // Validar longitud del nombre
    if (nombre.length > 100) {
      return sendError(res, 400, "nombre no puede exceder 100 caracteres")
    }

    // Validar fechas
    const errorFechas = validarFechas(periodo_inicio, periodo_final)
    if (errorFechas) {
      return sendError(res, 400, errorFechas)
    }

    const sanitizedUserId = sanitizeUsuarioId(usuario_id)
    const sanitizedCultivoId = sanitizeCultivoId(cultivo_id)

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

    // Validar cultivo si se proporciona
    if (sanitizedCultivoId !== null) {
      const [cultivoCheck] = await pool.execute(
        "SELECT id FROM cultivos WHERE id = ? AND estado = ?",
        [sanitizedCultivoId, "habilitado"]
      )
      if (!cultivoCheck.length) {
        return sendError(res, 400, "cultivo_id inválido o cultivo deshabilitado")
      }
    }

    // Insertar ciclo de cultivo
    const [result] = await pool.execute(`
      INSERT INTO ciclo_cultivo (nombre, descripcion, periodo_inicio, periodo_final, novedades, usuario_id, cultivo_id, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'habilitado')
    `, [nombre, descripcion, periodo_inicio, periodo_final, novedades, sanitizedUserId, sanitizedCultivoId])

    // Obtener ciclo creado con datos de usuario y cultivo
    const [rows] = await pool.execute(`
      SELECT c.*, 
             u.nombre as usuario_nombre,
             cult.nombre as cultivo_nombre
      FROM ciclo_cultivo c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN cultivos cult ON c.cultivo_id = cult.id
      WHERE c.id = ?
    `, [result.insertId])

    res.status(201).json(rows[0])
  } catch (err) {
    console.error("POST /ciclo-cultivo ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// PUT actualizar ciclo de cultivo
router.put("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const {
      nombre,
      descripcion,
      periodo_inicio,
      periodo_final,
      novedades,
      usuario_id,
      cultivo_id,
      estado
    } = req.body

    console.log("PUT /ciclo-cultivo body:", req.body)

    // Validaciones si se proporcionan
    if (nombre && nombre.length > 100) {
      return sendError(res, 400, "nombre no puede exceder 100 caracteres")
    }

    if (estado && !validEstado.includes(estado)) {
      return sendError(res, 400, `estado inválido. Valores permitidos: ${validEstado.join(", ")}`)
    }

    // Validar fechas si se proporcionan
    if (periodo_inicio || periodo_final) {
      // Obtener fechas actuales si solo se actualiza una
      const [current] = await pool.execute("SELECT periodo_inicio, periodo_final FROM ciclo_cultivo WHERE id = ?", [req.params.id])
      if (current.length) {
        const inicioFinal = periodo_inicio || current[0].periodo_inicio
        const finalFinal = periodo_final || current[0].periodo_final
        
        const errorFechas = validarFechas(inicioFinal, finalFinal)
        if (errorFechas) {
          return sendError(res, 400, errorFechas)
        }
      }
    }

    const sanitizedUserId = sanitizeUsuarioId(usuario_id)
    const sanitizedCultivoId = sanitizeCultivoId(cultivo_id)

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

    // Validar cultivo si se proporciona
    if (sanitizedCultivoId !== null) {
      const [cultivoCheck] = await pool.execute(
        "SELECT id FROM cultivos WHERE id = ? AND estado = ?",
        [sanitizedCultivoId, "habilitado"]
      )
      if (!cultivoCheck.length) {
        return sendError(res, 400, "cultivo_id inválido o cultivo deshabilitado")
      }
    }

    // Actualizar ciclo de cultivo
    const [result] = await pool.execute(`
      UPDATE ciclo_cultivo SET
        nombre = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        periodo_inicio = COALESCE(?, periodo_inicio),
        periodo_final = COALESCE(?, periodo_final),
        novedades = COALESCE(?, novedades),
        usuario_id = COALESCE(?, usuario_id),
        cultivo_id = COALESCE(?, cultivo_id),
        estado = COALESCE(?, estado)
      WHERE id = ?
    `, [nombre, descripcion, periodo_inicio, periodo_final, novedades, sanitizedUserId, sanitizedCultivoId, estado, req.params.id])

    if (!result.affectedRows) {
      return sendError(res, 404, "Ciclo de cultivo no encontrado")
    }

    // Obtener ciclo actualizado
    const [rows] = await pool.execute(`
      SELECT c.*, 
             u.nombre as usuario_nombre,
             cult.nombre as cultivo_nombre
      FROM ciclo_cultivo c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN cultivos cult ON c.cultivo_id = cult.id
      WHERE c.id = ?
    `, [req.params.id])

    res.json(rows[0])
  } catch (err) {
    console.error("PUT /ciclo-cultivo ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// DELETE eliminar ciclo de cultivo (físicamente)
router.delete("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    
    // Verificar si el ciclo está siendo usado en producciones
    const [prodCheck] = await pool.execute(
      "SELECT COUNT(*) as count FROM producciones WHERE ciclo_id = ?", 
      [req.params.id]
    )
    
    if (prodCheck[0].count > 0) {
      return sendError(res, 400, "No se puede eliminar: el ciclo está siendo usado en producciones")
    }

    const [result] = await pool.execute("DELETE FROM ciclo_cultivo WHERE id = ?", [req.params.id])

    if (!result.affectedRows) {
      return sendError(res, 404, "Ciclo de cultivo no encontrado")
    }

    res.json({ message: "Ciclo de cultivo eliminado permanentemente" })
  } catch (err) {
    console.error("DELETE /ciclo-cultivo ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET ciclos por estado
router.get("/estado/:estado", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { estado } = req.params

    if (!validEstado.includes(estado)) {
      return sendError(res, 400, `estado inválido. Valores permitidos: ${validEstado.join(", ")}`)
    }

    const [rows] = await pool.execute(`
      SELECT c.*, 
             u.nombre as usuario_nombre,
             cult.nombre as cultivo_nombre
      FROM ciclo_cultivo c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN cultivos cult ON c.cultivo_id = cult.id
      WHERE c.estado = ?
      ORDER BY c.fecha_creacion DESC
    `, [estado])

    res.json(rows)
  } catch (err) {
    console.error("GET /ciclo-cultivo/estado ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET ciclos por usuario
router.get("/usuario/:userId", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { userId } = req.params

    const [rows] = await pool.execute(`
      SELECT c.*, 
             u.nombre as usuario_nombre,
             cult.nombre as cultivo_nombre
      FROM ciclo_cultivo c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN cultivos cult ON c.cultivo_id = cult.id
      WHERE c.usuario_id = ?
      ORDER BY c.fecha_creacion DESC
    `, [userId])

    res.json(rows)
  } catch (err) {
    console.error("GET /ciclo-cultivo/usuario ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET ciclos por cultivo
router.get("/cultivo/:cultivoId", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { cultivoId } = req.params

    const [rows] = await pool.execute(`
      SELECT c.*, 
             u.nombre as usuario_nombre,
             cult.nombre as cultivo_nombre
      FROM ciclo_cultivo c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN cultivos cult ON c.cultivo_id = cult.id
      WHERE c.cultivo_id = ?
      ORDER BY c.fecha_creacion DESC
    `, [cultivoId])

    res.json(rows)
  } catch (err) {
    console.error("GET /ciclo-cultivo/cultivo ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET ciclos activos (dentro del período actual)
router.get("/activos/periodo", async (req, res) => {
  try {
    const { pool } = require("../server")
    const hoy = new Date().toISOString().split('T')[0]

    const [rows] = await pool.execute(`
      SELECT c.*, 
             u.nombre as usuario_nombre,
             cult.nombre as cultivo_nombre
      FROM ciclo_cultivo c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN cultivos cult ON c.cultivo_id = cult.id
      WHERE c.estado = 'habilitado' 
        AND c.periodo_inicio <= ? 
        AND c.periodo_final >= ?
      ORDER BY c.fecha_creacion DESC
    `, [hoy, hoy])

    res.json(rows)
  } catch (err) {
    console.error("GET /ciclo-cultivo/activos/periodo ERROR:", err)
    return sendError(res, 500, "Error interno del servidor")
  }
})

module.exports = router