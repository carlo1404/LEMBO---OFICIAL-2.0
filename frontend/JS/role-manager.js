class RoleManager {
    constructor() {
        // Verificar autenticación antes de inicializar roles
        if (!window.authGuard || !window.authGuard.isAuthenticated()) {
            console.log('Usuario no autenticado para gestión de roles')
            return
        }

        this.userRole = this.getCurrentUserRole()
        this.permissions = this.initializePermissions()
        console.log('RoleManager inicializado:', { userRole: this.userRole, permissions: this.permissions[this.userRole] })
    }

    getCurrentUserRole() {
        const user = window.authGuard ? window.authGuard.getCurrentUser() : null
        if (user && user.rol) {
            console.log('Rol del usuario:', user.rol)
            return user.rol
        }
        return 'visitante'
    }

    initializePermissions() {
        return {
            superadmin: {
                canViewUsers: true,
                canCreateUsers: true,
                canEditUsers: true,
                canDeleteUsers: true,
                canViewSensores: false,
                canManageSensores: false,
                canViewCiclos: false,
                canViewCultivos: false,
                canViewInsumos: false,
                canViewProduccion: false
            },
            admin: {
                canViewUsers: true,
                canCreateUsers: false,
                canEditUsers: true,
                canDeleteUsers: false,
                canViewSensores: true,
                canManageSensores: true,
                canViewCiclos: true,
                canViewCultivos: true,
                canViewInsumos: true,
                canViewProduccion: true
            },
            apoyo: {
                canViewUsers: false,
                canCreateUsers: false,
                canEditUsers: false,
                canDeleteUsers: false,
                canViewSensores: true,   
                canManageSensores: true,  
                canViewCiclos: false,
                canViewCultivos: false,
                canViewInsumos: false,
                canViewProduccion: false
            },
            visitante: {
                canViewUsers: false,
                canCreateUsers: false,
                canEditUsers: false,
                canDeleteUsers: false,
                canViewSensores: true,
                canManageSensores: false,
                canViewCiclos: true,
                canViewCultivos: true,
                canViewInsumos: false,
                canViewProduccion: false
            }
        }
    }

    hasPermission(permission) {
        const hasIt = this.permissions[this.userRole] && this.permissions[this.userRole][permission]
        console.log(`Verificando permiso ${permission} para ${this.userRole}:`, hasIt)
        return hasIt
    }

    hideElementsByRole() {
        // No proceder si no hay usuario autenticado
        if (!window.authGuard || !window.authGuard.isAuthenticated()) {
            console.log('No hay usuario autenticado, no se pueden ocultar elementos')
            return
        }

        console.log('Ocultando elementos según rol:', this.userRole)

        // Esperar un poco para asegurar que el DOM esté cargado
        setTimeout(() => {
            this.processHeaderNavigation()
            this.processSidebarNavigation()
        }, 200)
    }
    processHeaderNavigation() {
        const navLinks = document.querySelectorAll('#nav-list .nav__link')
        navLinks.forEach(link => {
            const href = link.getAttribute('href')
            let hide = false

            if (href.includes('ciclo_cultivo') || href.includes('ciclo-cultivo')) {
                if (!this.hasPermission('canViewCiclos')) hide = true
            }
            else if (href.includes('cultivos.html')) {
                if (!this.hasPermission('canViewCultivos')) hide = true
            }
            else if (href.includes('usuarios')) {
                if (!this.hasPermission('canViewUsers')) hide = true
            }
            else if (href.includes('insumo')) {
                if (!this.hasPermission('canViewInsumos')) hide = true
            }
            else if (href.includes('sensor')) {
                if (!this.hasPermission('canViewSensores')) hide = true
            }
            else if (href.includes('produccion')) {
                if (!this.hasPermission('canViewProduccion')) hide = true
            }

            link.parentElement.style.display = hide ? 'none' : 'block'
        })
    }
    processSidebarNavigation() {
        const items = document.querySelectorAll('.sidebar__nav-icons .sidebar__nav-item')
        items.forEach(link => {
            const href = link.getAttribute('href')
            let hide = false

            if (href.includes('insumo')) {
                if (!this.hasPermission('canViewInsumos')) hide = true
            }
            else if (href.includes('sensor')) {
                if (!this.hasPermission('canViewSensores')) hide = true
            }
            else if (href.includes('cultivos.html')) {
                if (!this.hasPermission('canViewCultivos')) hide = true
            }
            else if (href.includes('ciclo_cultivo')) {
                if (!this.hasPermission('canViewCiclos')) hide = true
            }
            else if (href.includes('usuarios')) {
                if (!this.hasPermission('canViewUsers')) hide = true
            }
            else if (href.includes('produccion')) {
                if (!this.hasPermission('canViewProduccion')) hide = true
            }

            link.style.display = hide ? 'none' : 'block'
        })
    }

    // Método para debug - mostrar rol actual
    showCurrentRole() {
        if (!window.authGuard || !window.authGuard.isAuthenticated()) {
            console.log('No hay usuario autenticado')
            return
        }

        console.log(`=== INFORMACIÓN DE ROL ===`)
        console.log(`Rol actual: ${this.userRole}`)
        console.log('Permisos:', this.permissions[this.userRole])
        console.log(`========================`)
    }
}

// Exportar para uso global
window.RoleManager = RoleManager
