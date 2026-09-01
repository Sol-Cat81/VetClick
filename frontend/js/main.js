
// = = = = = VARIABLES = = = = =
const header = document.querySelector("header")


// = = = = = FUNCIONES = = = = =
function cerrarLoader(){
   let loader = document.querySelector('.loader');
   loader.style.display = 'none';
}



// = = = = = EVENTOS = = = = =
window.addEventListener('load', cerrarLoader);

window.addEventListener("scroll", () => {
    if(window.scrollY > 100){
        header.classList.add("scroll");
    }else{
        header.classList.remove("scroll");
    }
});

window.addEventListener('resize', () => {
    if(window.innerWidth < 700){
        header.innerHTML = `
        <i class="ph ph-list canva" data-bs-toggle="offcanvas" data-bs-target="#offcanvasScrolling" aria-controls="offcanvasScrolling"></i>

        <div class="offcanvas offcanvas-start" data-bs-scroll="true" data-bs-backdrop="false" tabindex="-1" id="offcanvasScrolling" aria-labelledby="offcanvasScrollingLabel">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title" id="offcanvasScrollingLabel">Menu</h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
                <ul>
                    <li><a href="#hero">Inicio</a></li>
                    <li><a href="pages/servicios.html">Servicios</a></li>
                    <li><a href="pages/productos.html">Productos</a></li>
                    <li><a href="pages/turnos.html">Turnos</a></li>
                </ul>
            </div>
        </div>
        <div class="logo">
            <a href="../index.html">VetClick</a>
        </div>
        <div class="usuario">
            <i class="ph-thin ph-user"></i>
            <i class="ph-thin ph-shopping-cart-simple"></i>
        </div>`
    }else{
        header.innerHTML = `
        <div class="logo">
            <a href="../index.html">VetClick</a>
        </div>
        <div class="usuario">
            <i class="ph-thin ph-user"></i>
            <i class="ph-thin ph-shopping-cart-simple"></i>
        </div>
        <nav>
            <ul>
                <li><a href="#hero">Inicio</a></li>
                <li><a href="pages/servicios.html">Servicios</a></li>
                <li><a href="pages/productos.html">Productos</a></li>
                <li><a href="pages/turnos.html">Turnos</a></li>
            </ul>
        </nav>`
    }
})