// ==========================
// REFERENCIAS A ELEMENTOS DEL DOM
// ==========================

// Obtiene el botón que permite cambiar el tema (claro / oscuro)
const themeToggle = document.getElementById('themeToggle');

// Obtiene el ícono que indica el estado del tema (sol o luna)
const themeIcon = document.getElementById('themeIcon');

// Referencia directa al elemento <body>
const body = document.body;

// ==========================
// CARGA DEL TEMA GUARDADO
// ==========================

// Obtiene el tema almacenado previamente en el navegador
const savedTheme = localStorage.getItem('theme');

// Verifica si el tema guardado es oscuro
if (savedTheme === 'dark') {

    // Aplica la clase de modo oscuro al body
    body.classList.add('dark-mode');

    // Cambia el ícono a sol (indica que se puede volver a modo claro)
    themeIcon.textContent = '☀️';
}

// ==========================
// CAMBIO DE TEMA (TOGGLE)
// ==========================

// Escucha el evento click en el botón de cambio de tema
themeToggle.addEventListener('click', function() {

    // Alterna la clase dark-mode en el body
    body.classList.toggle('dark-mode');

    // Verifica si el modo oscuro quedó activo
    if (body.classList.contains('dark-mode')) {

        // Cambia el ícono a sol
        themeIcon.textContent = '☀️';

        // Guarda el estado oscuro en localStorage
        localStorage.setItem('theme', 'dark');

    } else {

        // Cambia el ícono a luna
        themeIcon.textContent = '🌙';

        // Guarda el estado claro en localStorage
        localStorage.setItem('theme', 'light');
    }
});
