// IMPORTANTE: Verificar autenticación INMEDIATAMENTE
(function() {
    console.log('=== INICIANDO HOME.JS ===')
    console.log('AuthGuard disponible:', !!window.authGuard)
    
    if (window.authGuard) {
      const isAuth = window.authGuard.isAuthenticated()
      console.log('Usuario autenticado:', isAuth)
      
      if (!isAuth) {
        console.log('Usuario no autenticado, deteniendo carga de home.js')
        return
      }
    }
  })()
  
  document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM cargado en home.js')
      
      if (window.authGuard && !window.authGuard.isAuthenticated()) {
          console.log('Usuario no autenticado en DOMContentLoaded')
          return;
      }
  
      fetch("/frontend/public/views/components/header.html")
          .then(response => response.text())
          .then(data => {
              console.log('Header cargado exitosamente')
              document.querySelector('header').innerHTML = data;
              
              setTimeout(() => {
                  console.log('Inicializando roles desde home.js')
                  if (window.authGuard && window.authGuard.isAuthenticated() && typeof RoleManager !== 'undefined') {
                      const roleManager = new RoleManager();
                      roleManager.hideElementsByRole();
                      roleManager.showCurrentRole();
                  } else {
                      console.log('No se pudo inicializar RoleManager desde home.js')
                  }
              }, 300);
          })
          .catch(error => {
              console.error('Error al cargar el header:', error);
              if (window.authGuard && !window.authGuard.isAuthenticated()) {
                  window.authGuard.redirectToLogin();
              }
          });
  });
  