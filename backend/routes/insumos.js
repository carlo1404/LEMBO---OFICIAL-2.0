const express = require("express")
const router = express.Router()

// Valores exactos según los enums de Prisma
const validTipoInsumo = [
  "Fertilizante", "Fungicida", "Pesticida", "Semilla", "Herramienta", 
  "Invernadero", "Manguera", "Malla protectora", "Aspersor", "Sustrato"
]

const validUnidadMedida = [
  "peso", "volumen", "superficie", "concentración", "litro", "kilo"
]

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

// GET todos los insumos (incluir deshabilitados para funcionalidad completa)
router.get("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(`
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      ORDER BY i.fecha_creacion DESC
    `)

    res.json(rows)
  } catch (error) {
    console.error("GET /insumos ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET solo insumos habilitados
router.get("/habilitados", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(`
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.estado = ? 
      ORDER BY i.fecha_creacion DESC
    `, ["habilitado"])

    res.json(rows)
  } catch (error) {
    console.error("GET /insumos/habilitados ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET insumo por ID
router.get("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(`
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.id = ?
    `, [req.params.id])

    if (rows.length === 0) {
      return sendError(res, 404, "Insumo no encontrado")
    }

    res.json(rows[0])
  } catch (error) {
    console.error("GET /insumos/:id ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// POST crear insumo
router.post("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { nombre, tipo, unidad_medida, valor, cantidad, descripcion, usuario_id, estado } = req.body

    console.log("POST /insumos body:", req.body)

    // Validaciones de campos requeridos
    if (!nombre) return sendError(res, 400, "nombre es requerido")
    if (!tipo) return sendError(res, 400, "tipo es requerido")
    if (!unidad_medida) return sendError(res, 400, "unidad_medida es requerida")
    if (valor === undefined || valor === null) return sendError(res, 400, "valor es requerido")
    if (cantidad === undefined || cantidad === null) return sendError(res, 400, "cantidad es requerida")

    // Validar longitudes
    if (nombre.length > 100) {
      return sendError(res, 400, "nombre no puede exceder 100 caracteres")
    }

    if (tipo.length > 50) {
      return sendError(res, 400, "tipo no puede exceder 50 caracteres")
    }

    // Validaciones de enums - usando los valores del frontend que coinciden con los del enum
    const tipoMapeado = {
      'Fertilizante': 'Fertilizante',
      'Fungicida': 'Fungicida', 
      'Pesticida': 'Pesticida',
      'Semilla': 'Semilla',
      'Herramienta': 'Herramienta',
      'Invernadero': 'Invernadero',
      'Manguera': 'Manguera',
      'Malla protectora': 'Malla protectora',
      'Aspersor': 'Aspersor',
      'Sustrato': 'Sustrato'
    }

    if (!tipoMapeado[tipo]) {
      return sendError(res, 400, `tipo inválido. Valores permitidos: ${Object.keys(tipoMapeado).join(", ")}`)
    }

    // Mapeo de unidades del frontend al enum de la BD
    const unidadMapeada = {
      'gramo': 'peso',
      'kilo': 'kilo', 
      'metro': 'superficie',
      'metro_cubico': 'volumen',
      'litro': 'litro',
      'unidad': 'concentración'
    }

    const unidadFinal = unidadMapeada[unidad_medida]
    if (!unidadFinal) {
      return sendError(res, 400, `unidad_medida inválida. Valores permitidos: ${Object.keys(unidadMapeada).join(", ")}`)
    }

    // Validaciones numéricas
    const valorFloat = parseFloat(valor)
    const cantidadInt = parseInt(cantidad)

    if (isNaN(valorFloat) || valorFloat < 0) {
      return sendError(res, 400, "valor debe ser un número positivo")
    }

    if (isNaN(cantidadInt) || cantidadInt < 0) {
      return sendError(res, 400, "cantidad debe ser un número entero positivo")
    }

    // Validar estado
    const estadoFinal = estado || 'habilitado'
    if (!validEstado.includes(estadoFinal)) {
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

    // Insertar insumo
    const [result] = await pool.execute(`
      INSERT INTO insumos (nombre, tipo, unidad_medida, valor, cantidad, descripcion, usuario_id, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [nombre, tipo, unidadFinal, valorFloat, cantidadInt, descripcion, sanitizedUserId, estadoFinal])

    // Obtener insumo creado con datos de usuario
    const [newInput] = await pool.execute(`
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.id = ?
    `, [result.insertId])

    res.status(201).json(newInput[0])
  } catch (error) {
    console.error("POST /insumos ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// PUT actualizar insumo
router.put("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { nombre, tipo, unidad_medida, valor, cantidad, descripcion, estado, usuario_id } = req.body

    console.log("PUT /insumos body:", req.body)

    // Validaciones si se proporcionan
    if (nombre && nombre.length > 100) {
      return sendError(res, 400, "nombre no puede exceder 100 caracteres")
    }

    if (tipo && tipo.length > 50) {
      return sendError(res, 400, "tipo no puede exceder 50 caracteres")
    }

    // Validar tipo si se proporciona
    if (tipo) {
      const tipoMapeado = {
        'Fertilizante': 'Fertilizante',
        'Fungicida': 'Fungicida', 
        'Pesticida': 'Pesticida',
        'Semilla': 'Semilla',
        'Herramienta': 'Herramienta',
        'Invernadero': 'Invernadero',
        'Manguera': 'Manguera',
        'Malla protectora': 'Malla protectora',
        'Aspersor': 'Aspersor',
        'Sustrato': 'Sustrato'
      }

      if (!tipoMapeado[tipo]) {
        return sendError(res, 400, `tipo inválido. Valores permitidos: ${Object.keys(tipoMapeado).join(", ")}`)
      }
    }

    // Validar unidad de medida si se proporciona
    let unidadFinal = unidad_medida
    if (unidad_medida) {
      const unidadMapeada = {
        'gramo': 'peso',
        'kilo': 'kilo', 
        'metro': 'superficie',
        'metro_cubico': 'volumen',
        'litro': 'litro',
        'unidad': 'concentración'
      }

      unidadFinal = unidadMapeada[unidad_medida]
      if (!unidadFinal) {
        return sendError(res, 400, `unidad_medida inválida. Valores permitidos: ${Object.keys(unidadMapeada).join(", ")}`)
      }
    }

    // Validaciones numéricas si se proporcionan
    let valorFloat = valor
    let cantidadInt = cantidad

    if (valor !== undefined && valor !== null) {
      valorFloat = parseFloat(valor)
      if (isNaN(valorFloat) || valorFloat < 0) {
        return sendError(res, 400, "valor debe ser un número positivo")
      }
    }

    if (cantidad !== undefined && cantidad !== null) {
      cantidadInt = parseInt(cantidad)
      if (isNaN(cantidadInt) || cantidadInt < 0) {
        return sendError(res, 400, "cantidad debe ser un número entero positivo")
      }
    }

    // Validar estado si se proporciona
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

    // Actualizar insumo
    const [result] = await pool.execute(`
      UPDATE insumos 
      SET nombre = COALESCE(?, nombre), 
          tipo = COALESCE(?, tipo), 
          unidad_medida = COALESCE(?, unidad_medida), 
          valor = COALESCE(?, valor), 
          cantidad = COALESCE(?, cantidad), 
          descripcion = COALESCE(?, descripcion),
          estado = COALESCE(?, estado),
          usuario_id = COALESCE(?, usuario_id)
      WHERE id = ?
    `, [nombre, tipo, unidadFinal, valorFloat, cantidadInt, descripcion, estado, sanitizedUserId, req.params.id])

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Insumo no encontrado")
    }

    // Obtener insumo actualizado
    const [updated] = await pool.execute(`
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.id = ?
    `, [req.params.id])

    res.json(updated[0])
  } catch (error) {
    console.error("PUT /insumos ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// POST consumir insumo (reducir cantidad)
router.post("/:id/consume", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { cantidad_consumida } = req.body

    if (!cantidad_consumida || cantidad_consumida <= 0) {
      return sendError(res, 400, "La cantidad consumida debe ser mayor a 0")
    }

    const cantidadConsumidaInt = parseInt(cantidad_consumida)
    if (isNaN(cantidadConsumidaInt)) {
      return sendError(res, 400, "La cantidad consumida debe ser un número entero")
    }

    // Iniciar transacción
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Obtener cantidad actual
      const [current] = await connection.execute(
        "SELECT cantidad, nombre FROM insumos WHERE id = ? AND estado = ? FOR UPDATE",
        [req.params.id, "habilitado"]
      )

      if (current.length === 0) {
        throw new Error("Insumo no encontrado o deshabilitado")
      }

      const currentQuantity = current[0].cantidad
      const nombreInsumo = current[0].nombre

      if (currentQuantity < cantidadConsumidaInt) {
        throw new Error(`Cantidad insuficiente para ${nombreInsumo}. Disponible: ${currentQuantity}, Solicitado: ${cantidadConsumidaInt}`)
      }

      const newQuantity = currentQuantity - cantidadConsumidaInt

      // Actualizar cantidad
      await connection.execute("UPDATE insumos SET cantidad = ? WHERE id = ?", [newQuantity, req.params.id])

      await connection.commit()

      // Obtener insumo actualizado
      const [updated] = await pool.execute(`
        SELECT i.*, u.nombre as usuario_nombre 
        FROM insumos i 
        LEFT JOIN usuarios u ON i.usuario_id = u.id 
        WHERE i.id = ?
      `, [req.params.id])

      res.json({
        message: "Insumo consumido exitosamente",
        cantidad_consumida: cantidadConsumidaInt,
        cantidad_restante: newQuantity,
        insumo: updated[0]
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("POST /insumos/:id/consume ERROR:", error)
    return sendError(res, 500, error.message)
  }
})

// DELETE eliminar insumo (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { pool } = require("../server");
    const insumoId = req.params.id;

    // Verificar asociaciones (ejemplo con tabla producciones)
    const [asociados] = await pool.execute(
      "SELECT COUNT(*) AS count FROM producciones WHERE JSON_CONTAINS(insumos_ids, JSON_QUOTE(?))",
      [insumoId]
    );

    if (asociados[0].count > 0) {
      return res.status(400).json({ error: "No se puede eliminar. El insumo está asociado a producciones." });
    }

    // Eliminar insumo
    const [result] = await pool.execute("DELETE FROM insumos WHERE id = ?", [insumoId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Insumo no encontrado" });
    }

    return res.json({ message: "Insumo eliminado exitosamente" });
  } catch (error) {
    console.error("DELETE /insumos ERROR:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});


// GET insumos por tipo
router.get("/tipo/:tipo", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { tipo } = req.params

    const tiposValidos = [
      "Fertilizante", "Fungicida", "Pesticida", "Semilla", "Herramienta", 
      "Invernadero", "Manguera", "Malla protectora", "Aspersor", "Sustrato"
    ]

    if (!tiposValidos.includes(tipo)) {
      return sendError(res, 400, `tipo inválido. Valores permitidos: ${tiposValidos.join(", ")}`)
    }

    const [rows] = await pool.execute(`
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.tipo = ?
      ORDER BY i.fecha_creacion DESC
    `, [tipo])

    res.json(rows)
  } catch (error) {
    console.error("GET /insumos/tipo ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET insumos por estado
router.get("/estado/:estado", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { estado } = req.params

    if (!validEstado.includes(estado)) {
      return sendError(res, 400, `estado inválido. Valores permitidos: ${validEstado.join(", ")}`)
    }

    const [rows] = await pool.execute(`
      SELECT i.*, u.nombre as usuario_nombre 
      FROM insumos i 
      LEFT JOIN usuarios u ON i.usuario_id = u.id 
      WHERE i.estado = ?
      ORDER BY i.fecha_creacion DESC
    `, [estado])

    res.json(rows)
  } catch (error) {
    console.error("GET /insumos/estado ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

module.exports = router