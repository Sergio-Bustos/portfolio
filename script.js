/* =====================================================
   NAVEGACIÓN LIMPIA - SIN HASH NI NOMBRES DE ARCHIVO
===================================================== */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // LIMPIAR HASH AUTOMÁTICAMENTE AL CARGAR
    // ========================================
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        const target = document.getElementById(targetId);
        
        if (target) {
            // Hacer scroll a la sección
            setTimeout(() => {
                target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
        
        // SIEMPRE limpiar el hash, encuentre o no la sección
        setTimeout(() => {
            history.replaceState(null, null, window.location.pathname);
        }, 150);
    }
    
    // ========================================
    // NAVEGACIÓN INTERNA SIN HASH
    // ========================================
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    
    internalLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            
            if (target) {
                target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
            
            // Limpiar URL
            history.replaceState(null, null, window.location.pathname);
        });
    });
    
});