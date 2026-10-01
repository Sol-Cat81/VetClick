const minRange = document.getElementById("minRange");
const maxRange = document.getElementById("maxRange");
const api = "http://127.0.0.1:3000/api/productos/destacados"

const minPrice = document.getElementById("minimo").value;
const maxPrice = document.getElementById("maximo").value;

const btnFiltros = document.querySelector('.menu-filtros')
const menuFiltros = document.querySelector('.filtros')
const cerrarMenu = document.querySelector('.cerrar')

btnFiltros.addEventListener("click", () => {menuFiltros.classList.toggle('filtro-activo')});
cerrarMenu.addEventListener("click", () => {menuFiltros.classList.remove('filtro-activo')});
