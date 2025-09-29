const express = require("express")
const router = express.Router()

// Valores válidos según enums de Prisma
const validTipoDocumento = ["ti", "cc", "ppt", "ce", "pep"]
const validRol = ["superadmin", "admin", "apoyo", "visitante"]
const validEstado = ["habilitado", "deshabilitado"]


function sendError(res, status, message) {
  console.error("API Error:", message)
  return res.status(status).json({ error: message })
}

// GET todos los usuarios (habilitados y deshabilitados)
router.get("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(
      "SELECT * FROM usuarios ORDER BY fecha_creacion DESC"
    )
    res.json(rows)
  } catch (error) {
    console.error("GET /usuarios ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// GET usuario por ID
router.get("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const [rows] = await pool.execute(
      "SELECT * FROM usuarios WHERE id = ?", 
      [req.params.id]
    )
    
    if (rows.length === 0) {
      return sendError(res, 404, "Usuario no encontrado")
    }
    
    res.json(rows[0])
  } catch (error) {
    console.error("GET /usuarios/:id ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// POST crear usuario
router.post("/", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { 
      tipo_documento, 
      numero_documento, 
      nombre, 
      telefono, 
      correo, 
      rol 
    } = req.body

    console.log("POST /usuarios body:", req.body)

    // Validaciones de campos requeridos
    if (!tipo_documento) return sendError(res, 400, "tipo_documento es requerido")
    if (!numero_documento) return sendError(res, 400, "numero_documento es requerido")
    if (!nombre) return sendError(res, 400, "nombre es requerido")
    if (!telefono) return sendError(res, 400, "telefono es requerido")
    if (!correo) return sendError(res, 400, "correo es requerido")
    if (!rol) return sendError(res, 400, "rol es requerido")

    // Validaciones de enums
    if (!validTipoDocumento.includes(tipo_documento)) {
      return sendError(res, 400, `tipo_documento inválido. Valores permitidos: ${validTipoDocumento.join(", ")}`)
    }
    if (!validRol.includes(rol)) {
      return sendError(res, 400, `rol inválido. Valores permitidos: ${validRol.join(", ")}`)
    }

    // Validar formato de correo básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(correo)) {
      return sendError(res, 400, "Formato de correo inválido")
    }

    // Verificar si ya existe usuario con ese documento o correo
    const [existing] = await pool.execute(
      "SELECT id FROM usuarios WHERE numero_documento = ? OR correo = ?", 
      [numero_documento, correo]
    )
    
    if (existing.length > 0) {
      return sendError(res, 400, "Ya existe un usuario con ese número de documento o correo")
    }

    // Insertar usuario
    const [result] = await pool.execute(`
      INSERT INTO usuarios (tipo_documento, numero_documento, nombre, telefono, correo, rol, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'habilitado')
    `, [tipo_documento, numero_documento, nombre, telefono, correo, rol])

    // Obtener usuario creado
    const [newUser] = await pool.execute(
      "SELECT * FROM usuarios WHERE id = ?", 
      [result.insertId]
    )
    
    res.status(201).json(newUser[0])
  } catch (error) {
    console.error("POST /usuarios ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// PUT actualizar usuario
router.put("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { 
      nombre, 
      telefono, 
      correo, 
      rol, 
      estado 
    } = req.body

    console.log("PUT /usuarios body:", req.body)

    // Validaciones de enums si se proporcionan
    if (rol && !validRol.includes(rol)) {
      return sendError(res, 400, `rol inválido. Valores permitidos: ${validRol.join(", ")}`)
    }
    if (estado && !validEstado.includes(estado)) {
      return sendError(res, 400, `estado inválido. Valores permitidos: ${validEstado.join(", ")}`)
    }

    // Validar formato de correo si se proporciona
    if (correo) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(correo)) {
        return sendError(res, 400, "Formato de correo inválido")
      }

      // Verificar que el correo no esté en uso por otro usuario
      const [existing] = await pool.execute(
        "SELECT id FROM usuarios WHERE correo = ? AND id != ?", 
        [correo, req.params.id]
      )
      if (existing.length > 0) {
        return sendError(res, 400, "El correo ya está en uso por otro usuario")
      }
    }

    // Actualizar usuario
    const [result] = await pool.execute(`
      UPDATE usuarios SET 
        nombre = COALESCE(?, nombre),
        telefono = COALESCE(?, telefono),
        correo = COALESCE(?, correo),
        rol = COALESCE(?, rol),
        estado = COALESCE(?, estado)
      WHERE id = ?
    `, [nombre, telefono, correo, rol, estado, req.params.id])

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Usuario no encontrado")
    }

    // Obtener usuario actualizado
    const [updated] = await pool.execute(
      "SELECT * FROM usuarios WHERE id = ?", 
      [req.params.id]
    )
    
    res.json(updated[0])
  } catch (error) {
    console.error("PUT /usuarios ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

// DELETE eliminar usuario (físicamente)
router.delete("/:id", async (req, res) => {
  try {
    const { pool } = require("../server")
    
    const [result] = await pool.execute(
      "DELETE FROM usuarios WHERE id = ?", 
      [req.params.id]
    )
    
    if (result.affectedRows === 0) {
      return sendError(res, 404, "Usuario no encontrado")
    }

    res.json({ message: "Usuario eliminado permanentemente" })
  } catch (error) {
    console.error("DELETE /usuarios ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})

router.post("/login", async (req, res) => {
  try {
    const { pool } = require("../server")
    const { correo, contraseña } = req.body

    console.log("POST /auth/login body:", { correo, contraseña: "***" })

    // Validaciones de campos requeridos
    if (!correo) return sendError(res, 400, "correo es requerido")
    if (!contraseña) return sendError(res, 400, "contraseña es requerida")

    // Validar formato de correo básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(correo)) {
      return sendError(res, 400, "Formato de correo inválido")
    }

    // Buscar usuario por correo
    const [rows] = await pool.execute(
      "SELECT * FROM usuarios WHERE correo = ? AND estado = 'habilitado'", 
      [correo]
    )
    
    if (rows.length === 0) {
      return sendError(res, 401, "Credenciales incorrectas o usuario deshabilitado")
    }

    const usuario = rows[0]

    // Verificar contraseña
    const isValidPassword = contraseña == usuario.contrasena
    
    if (!isValidPassword) {
      return sendError(res, 401, "Credenciales incorrectas")
    }

    // Respuesta exitosa sin incluir la contraseña
    const { contraseña: _, ...usuarioSinPassword } = usuario
    
    res.json({
      success: true,
      message: "Login exitoso",
      usuario: usuarioSinPassword
    })
    
  } catch (error) {
    console.error("POST /auth/login ERROR:", error)
    return sendError(res, 500, "Error interno del servidor")
  }
})
module.exports = router
