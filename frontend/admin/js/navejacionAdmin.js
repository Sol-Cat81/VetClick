const contenidoPrincipalmain = document.getElementById("contenido-principal-main");

const enlaces = document.querySelectorAll("[data-page]");

// Cada vista registra aquí su inicialización específica, evitando una cadena
// creciente de condiciones al agregar nuevas secciones.
const inicializadoresVistas = {
    "empleados.html": () => cargarEmpleados(),
    "rolesEmpleados.html": () => cargarRolesEmpleados(),
    "usuarios.html": ()=>cargarUsuarios(),
    "clientes.html": ()=> cargarClientes(),
    "mascotas.html": ()=>cargarMascotas(),
    "turnos.html": () => {
        if (typeof window.inicializarTurnosUI === "function") {
            window.inicializarTurnosUI();
        }
    }
};


// ========================================
// CARGAR DASHBOARD AL ENTRAR AL ADMIN
// ========================================

fetch("views/dashboard.html")
    .then(respuesta => respuesta.text())
    .then(contenido => {
        contenidoPrincipalmain.innerHTML = contenido;
    });


// ========================================
// NAVEGACIÓN DEL MENÚ
// ========================================

enlaces.forEach(enlace => {
    enlace.addEventListener("click", function(evento) {
        evento.preventDefault();

        const pagina = this.dataset.page;

        fetch(`views/${pagina}`)
            .then(respuesta => respuesta.text())
            .then(contenido => {
                contenidoPrincipalmain.innerHTML = contenido;

                const inicializarVista = inicializadoresVistas[pagina];
                if (inicializarVista) {
                    inicializarVista();
                }
            });
    });
});