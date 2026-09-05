const contenidoPrincipalmain = document.getElementById("contenido-principal-main");

const enlaces = document.querySelectorAll("[data-page]");


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
            });
    });
});