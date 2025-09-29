// sidebar.js
document.addEventListener('DOMContentLoaded', async function() {
    try {
      const resp = await fetch("/frontend/public/views/components/sidebar.html")
      const html = await resp.text()
      const container = document.getElementById('sidebar-container')
      container.innerHTML = html
        
      window.authGuard.init()
      if (!window.authGuard.isAuthenticated()) return
      const rm = new RoleManager()
  
      // Mostrar/ocultar items
      container.querySelectorAll('.sidebar__nav-item[data-role-permission]')
        .forEach(a => {
          a.style.display = rm.hasPermission(a.dataset.rolePermission)
            ? 'flex'
            : 'none'
        })
  
      // Logout
      container.querySelector('.sidebar__nav-item--end')
        .addEventListener('click', e => {
          e.preventDefault()
          window.authGuard.logout()
        })
  
      // Botones para visitantes
      if (rm.userRole === 'visitante') {
        document.querySelectorAll('.btn-create, .btn-edit, .btn-delete')
          .forEach(b => b.style.display = 'none')
      }
      // Mostrar todo para admin
      if (rm.userRole === 'admin') {
        document.querySelectorAll('.btn-create, .btn-edit, .btn-delete')
          .forEach(b => b.style.display = 'inline-block')
      }
  
    } catch (err) {
      console.error("Error cargando el sidebar:", err)
    }
  })
  