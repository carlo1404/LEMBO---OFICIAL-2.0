// IMPORTANTE: Verificar autenticación ANTES de hacer cualquier cosa
(function() {
    console.log('Iniciando verificación de autenticación...')
    
    // Si authGuard existe y el usuario no está autenticado, no continuar
    if (window.authGuard && !window.authGuard.isAuthenticated()) {
      console.log('Usuario no autenticado, deteniendo carga de menú')
      return
    }
  })()
  
  fetch("/frontend/public/views/components/header.html")
      .then(response => response.text())
      .then(data => {
          document.getElementById("header-container").innerHTML = data;
  
          setTimeout(() => {
              const menuToggle = document.getElementById("menu-toggle");
              const navList = document.getElementById("nav-list");
  
              if (menuToggle && navList) {
                  menuToggle.addEventListener("click", function (event) {
                      event.stopPropagation();
                      navList.classList.toggle("active");
                  });
  
                  document.addEventListener("click", function (event) {
                      if (!navList.contains(event.target) && !menuToggle.contains(event.target)) {
                          navList.classList.remove("active");
                      }
                  });
              }
  
              // Manejar enlaces de cerrar sesión
              setupLogoutHandlers();
  
              // Inicializar gestión de roles después de cargar el header
              initializeRoleManagement();
          }, 100);
      })
      .catch(error => {
          console.error('Error cargando header:', error);
          if (window.authGuard && !window.authGuard.isAuthenticated()) {
              window.authGuard.redirectToLogin();
          }
      });
  
  document.addEventListener("DOMContentLoaded", function () {
      if (window.authGuard && !window.authGuard.isAuthenticated()) {
          return
      }
  
      const toggleButton = document.getElementById("menu-toggle");
      const navList = document.getElementById("nav-list");
  
      if (toggleButton && navList) {
          toggleButton.addEventListener("click", function () {
              navList.classList.toggle("active");
          });
      }
  
      setTimeout(initializeRoleManagement, 300);
  });
  
  function initializeRoleManagement() {
      console.log('Inicializando gestión de roles...')
      
      if (window.authGuard && window.authGuard.isAuthenticated() && typeof RoleManager !== 'undefined') {
          console.log('Creando RoleManager...')
          const roleManager = new RoleManager();
          roleManager.hideElementsByRole();
          roleManager.showCurrentRole();
      } else {
          console.log('No se puede inicializar RoleManager:', {
              authGuard: !!window.authGuard,
              authenticated: window.authGuard ? window.authGuard.isAuthenticated() : false,
              roleManagerDefined: typeof RoleManager !== 'undefined'
          })
      }
  }
  
  function setupLogoutHandlers() {
      const logoutLinks = document.querySelectorAll('a[href*="register.html"]');
      
      logoutLinks.forEach(link => {
          if (link.textContent.toLowerCase().includes('cerrar') || 
              link.textContent.toLowerCase().includes('salir') ||
              link.textContent.toLowerCase().includes('logout')) {
              
              link.addEventListener('click', function(e) {
                  e.preventDefault();
                  
                  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                      if (window.authGuard) {
                          window.authGuard.logout();
                      } else {
                          localStorage.removeItem("currentUser");
                          window.location.href = '/frontend/public/views/register.html';
                      }
                  }
              });
          }
      });
  }
  