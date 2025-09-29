class AuthGuard {
    constructor() {
        this.loginPath = '/frontend/public/views/register.html'
        this.publicRoutes = [
            '/frontend/public/views/register.html',
            '/register.html',
            '/',
            '/index.html'
        ]

        // Ejecutar verificación inmediatamente
        this.checkAuthImmediate()
    }

    // Verificar autenticación inmediata
    checkAuthImmediate() {
        if (!this.isPublicRoute() && !this.isAuthenticated()) {
            console.log('Usuario no autenticado detectado, redirigiendo...')
            this.redirectToLogin()
            return false
        }
        return true
    }

    // Verificar si el usuario está logueado
    isAuthenticated() {
        const currentUser = localStorage.getItem("currentUser")
        if (!currentUser) {
            console.log('No hay currentUser en localStorage')

            return false
        }
        try {
            const user = JSON.parse(currentUser)
            const isValid = user && user.id && user.correo && user.rol
            return isValid
        } catch (error) {
            console.error('Error parsing user data:', error)
            localStorage.removeItem("currentUser")
            return false
        }
    }

    // Verificar si la ruta actual es pública
    isPublicRoute() {
        const currentPath = window.location.pathname
        const isPublic = this.publicRoutes.some(route =>
            currentPath.includes(route) || currentPath === route
        )
        return isPublic
    }

    // Obtener información del usuario actual
    getCurrentUser() {
        const currentUser = localStorage.getItem("currentUser")
        if (currentUser) {
            try {
                return JSON.parse(currentUser)
            } catch (error) {
                console.error('Error parsing user data:', error)
                return null
            }
        }
        return null
    }

    // Redirigir al login
    redirectToLogin() {
        console.log('Redirigiendo al login...')
        localStorage.removeItem("currentUser")
        window.location.replace(this.loginPath)
    }

    // Cerrar sesión
    logout() {
        localStorage.removeItem("currentUser")
        window.location.replace(this.loginPath)
    }

    // Inicializar el guard en la página
    init() {
        console.log('Inicializando AuthGuard...')

        // Verificar inmediatamente
        if (!this.checkAuthImmediate()) {
            return false
        }

        // Manejar eventos de storage
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentUser' && e.newValue === null) {
                this.redirectToLogin()
            }
        })

        return true
    }
}

// Crear y inicializar inmediatamente
window.authGuard = new AuthGuard()
