class AuthSystem {
  constructor() {
    this.apiUrl = "http://localhost:3000/api/usuarios"
    this.init()
  }

  init() {
    this.bindEvents()
    this.setupForm()
  }

  bindEvents() {
    // Solo evento de formulario login
    document.getElementById("loginForm").addEventListener("submit", (e) => this.handleLogin(e))
    // Validación en tiempo real
    this.setupRealTimeValidation()
  }

  setupForm() {
    const loginForm = document.getElementById("loginForm")
    const formTitle = document.getElementById("formTitle")
    loginForm.style.display = "block"
    formTitle.textContent = "Iniciar Sesión"
  }

  setupRealTimeValidation() {
    // Validación de correo
    const emailInputs = document.querySelectorAll('input[type="email"]')
    emailInputs.forEach((input) => {
      input.addEventListener("blur", () => this.validateEmail(input))
    })
  }

  validateEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(input.value)
    if (input.value && !isValid) {
      input.style.borderColor = "#FDC300"
      return false
    } else {
      input.style.borderColor = ""
      return true
    }
  }

  async handleLogin(e) {
    e.preventDefault()

    const correo = document.getElementById("loginEmail").value
    const contraseña = document.getElementById("loginPassword").value

    if (!this.validateEmail(document.getElementById("loginEmail"))) {
      this.showMessage("Por favor ingresa un correo válido", "error")
      return
    }

    if (!contraseña) {
      this.showMessage("Por favor ingresa tu contraseña", "error")
      return
    }

    try {
      this.showMessage("Verificando credenciales...", "info")

      const response = await fetch(`${this.apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ correo, contraseña })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const currentUser = localStorage.getItem("currentUser")
        // Guarda solo si no hay usuario guardado
        if (!currentUser) {
          localStorage.setItem(
            "currentUser",
            JSON.stringify({
              id: result.usuario.id,
              nombre: result.usuario.nombre,
              correo: result.usuario.correo,
              rol: result.usuario.rol,
            }),
          )
        }
        
        this.showMessage("¡Inicio de sesión exitoso!", "correcto")
        setTimeout(() => {
          this.showMessage(`Bienvenido, ${result.usuario.nombre}! Redirigiendo...`, "correcto")
          setTimeout(() => {
            window.location.href = "/frontend/public/views/home.html"
          }, 1500)
        }, 1000)
      } else {
        this.showMessage(result.error || "Credenciales incorrectas", "error")
      }
    } catch (error) {
      console.error("Error en login:", error)
      if (error.message.includes("404")) {
        this.showMessage(
          "Endpoint no encontrado. Verifica que la API esté en http://localhost:3000/api/usuarios/login",
          "error",
        )
      } else if (error.message.includes("Failed to fetch")) {
        this.showMessage(
          "No se puede conectar al servidor. Verifica que la API esté corriendo en el puerto 3000",
          "error",
        )
      } else {
        this.showMessage(`Error de conexión: ${error.message}`, "error")
      }
    }
  }

  showMessage(message, type) {
    const messageArea = document.getElementById("messageArea")
    messageArea.innerHTML = `<div class="${type}">${message}</div>`
    if (type === "info" || type === "correcto") {
      setTimeout(() => {
        messageArea.innerHTML = ""
      }, 5000)
    }
  }

  clearMessages() {
    document.getElementById("messageArea").innerHTML = ""
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AuthSystem()
})
