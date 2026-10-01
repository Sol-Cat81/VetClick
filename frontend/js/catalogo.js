// Obtiene el slider que controla el precio mínimo.
const minRange = document.getElementById("minRange");
// Obtiene el slider que controla el precio máximo.
const maxRange = document.getElementById("maxRange");

// Define el endpoint que devuelve productos agrupados con sus variantes.
const apiProductos = "http://127.0.0.1:3000/api/productos";
// Define el endpoint que devuelve el árbol de categorías.
const apiCategorias = "http://127.0.0.1:3000/api/productos/categorias";
// Define el endpoint que devuelve las marcas disponibles.
const apiMarcas = "http://127.0.0.1:3000/api/catalogo/marcas";

// Obtiene el campo numérico del precio mínimo.
const inputMinimo = document.getElementById("minimo");
// Obtiene el campo numérico del precio máximo.
const inputMaximo = document.getElementById("maximo");

// Obtiene el botón que abre el panel de filtros móvil.
const btnFiltros = document.querySelector(".menu-filtros");
// Obtiene el panel lateral de filtros.
const menuFiltros = document.querySelector(".filtros");
// Obtiene el control para cerrar el panel de filtros.
const cerrarMenu = document.querySelector(".cerrar");

// Obtiene el contenedor donde se insertan las cards.
const contenedorProductos = document.querySelector(".productos");
// Obtiene el contenedor reservado para los controles de página.
const contenedorPaginacion = document.getElementById("paginacion");
// Obtiene el contador de productos que coinciden con los filtros.
const contadorProductos = document.getElementById("contador-productos");

// Define una imagen alternativa cuando no hay una imagen válida.
const imagen404 = "https://assets.hellovector.com/product-images/b_5023.jpg";

// Conserva los datos y el estado de navegación del catálogo.
const estado = {
    productos: [],
    filtrados: [],
    categorias: [],
    pagina: 1,
    porPagina: 8,
    minimo: 0,
    maximo: 0,
    busqueda: ""
};

/* TOAST DE BOOSTRAP PARA REEMPLAZAR LOS ALERT */
function mostrarToast(mensaje, tipo = 'exito') {
  const toastElemento = document.getElementById('miToast');
  const toastCuerpo = document.getElementById('toast-mensaje');

  // 1. Limpiamos las clases de color previas
  toastElemento.classList.remove('text-bg-success', 'text-bg-danger');

  // 2. Asignamos el color dependiendo del tipo de mensaje
  if (tipo === 'error') {
    toastElemento.classList.add('text-bg-danger'); // Fondo rojo
  } else {
    toastElemento.classList.add('text-bg-success'); // Fondo verde
  }

  // 3. Insertamos el mensaje enviado
  toastCuerpo.textContent = mensaje;

  // 4. Usamos la API de Bootstrap para inicializar y mostrar el Toast
  const toast = new bootstrap.Toast(toastElemento, {
    delay: 3000 // Se ocultará solo después de 3 segundos (3000 ms)
  });
  toast.show();
}

// Convierte contenido recibido desde la API en texto seguro para HTML.
function escaparHTML(valor) {
    // Reemplaza los caracteres que pueden modificar el marcado de las cards.
    return String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// Calcula el precio efectivo de una variante con el descuento del producto.
function precioFinal(precio, descuento) {
    // Devuelve el precio con el porcentaje de descuento aplicado.
    return Number(precio) * (1 - (Number(descuento) || 0) / 100);
}

// Formatea los precios con las convenciones numéricas de Argentina.
function formatearNumero(numero) {

    // Elige cero decimales para importes enteros y dos para el resto.
    const decimales = numero % 1 === 0 ? 0 : 2;

    // Devuelve el valor con separadores de miles y decimales locales.
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    }).format(numero);
}

// Renderiza el precio original y, si existe, el precio con descuento.
function renderizarPrecio(precio, descuento) {

    // Calcula el importe final para mostrarlo al cliente.
    const precioConOferta = precioFinal(precio, descuento);

    // Muestra un único importe cuando no hay descuento.
    if (Number(descuento) <= 0) return `$${formatearNumero(Number(precio))}`;

    // Muestra el precio rebajado junto al precio original tachado.
    return `
    <span class="precio-nuevo">$${formatearNumero(precioConOferta)}</span>
    <span class="precio-anterior">$${formatearNumero(Number(precio))}</span>`;
}

// Construye la lista anidada de categorías con una casilla por opción.
function renderizarCategorias(categorias) {

    // Convierte cada categoría del nivel actual en una opción y sus hijas.
    return categorias.map((categoria) => {

        // Escapa el nombre de la categoría antes de insertarlo en el documento.
        const nombre = escaparHTML(categoria.nombre);

        // Renderiza recursivamente las subcategorías de la categoría actual.
        const hijas = renderizarCategorias(categoria.subcategorias || []);

        // Devuelve la casilla de la categoría con su lista anidada de hijas.
        return `
        <li class="opcion-filtro">
            <label>
                <input type="checkbox" class="filtro-categoria" value="${escaparHTML(categoria.id_categoria)}">
                <span>${nombre}</span>
            </label>${hijas ? `<ul>${hijas}</ul>` : ""}
        </li>`;
    }).join("");
}

// Inserta una casilla dinámica por cada marca devuelta por el servidor.
function renderizarMarcas(marcas) {
    // Obtiene la lista vacía reservada para las opciones de marca.
    const lista = document.getElementById("lista-marcas");
    // Dibuja las marcas escapando sus identificadores y nombres.
    lista.innerHTML = marcas.map((marca) => `
    <li class="opcion-filtro">
        <label>
            <input type="checkbox" class="filtro-marca" value="${escaparHTML(marca.id_marca)}">
            <span>${escaparHTML(marca.nombre)}</span>
        </label>
    </li>`).join("");
}

// Configura los límites iniciales usando precios reales de las variantes.
function configurarPrecios() {

    // Calcula el precio final de cada variante disponible.
    const precios = estado.productos.flatMap((producto) => producto.variantes.map((variante) => precioFinal(variante.precio, producto.descuento))).filter(Number.isFinite);

    // Usa cero si todavía no hay precios cargados.
    estado.minimo = precios.length ? Math.floor(Math.min(...precios)) : 0;

    // Determina el máximo real y lo conserva para los filtros.
    estado.maximo = precios.length ? Math.ceil(Math.max(...precios)) : 0;

    // Establece el límite mínimo del slider inferior.
    minRange.min = String(estado.minimo);

    // Establece el límite máximo del slider inferior.
    minRange.max = String(estado.maximo);

    // Establece el límite mínimo del slider superior.
    maxRange.min = String(estado.minimo);

    // Establece el límite máximo del slider superior.
    maxRange.max = String(estado.maximo);

    // Ajusta los sliders a importes enteros.
    minRange.step = "1";

    // Ajusta los sliders a importes enteros.
    maxRange.step = "1";

    // Inicializa el campo mínimo con el menor precio del catálogo.
    inputMinimo.value = String(estado.minimo);

    // Inicializa el campo máximo con el mayor precio del catálogo.
    inputMaximo.value = String(estado.maximo);

    // Inicializa el slider inferior en su valor mínimo.
    minRange.value = String(estado.minimo);

    // Inicializa el slider superior en su valor máximo.
    maxRange.value = String(estado.maximo);

    // Limita el campo numérico mínimo a precios existentes.
    inputMinimo.min = String(estado.minimo);

    // Limita el máximo que puede escribirse como precio mínimo.
    inputMinimo.max = String(estado.maximo);

    // Limita el mínimo que puede escribirse como precio máximo.
    inputMaximo.min = String(estado.minimo);

    // Limita el campo numérico máximo a precios existentes.
    inputMaximo.max = String(estado.maximo);

}

// Actualiza el estado de filtros cuando cambia un rango de precio.
function sincronizarPrecios(origen) {

    // Lee el precio mínimo actual o su límite inicial.
    let minimo = Number(inputMinimo.value || estado.minimo);

    // Lee el precio máximo actual o su límite inicial.
    let maximo = Number(inputMaximo.value || estado.maximo);

    // Evita que el valor mínimo quede por encima del máximo.
    if (minimo > maximo) origen === "minimo" ? maximo = minimo : minimo = maximo;

    // Mantiene el mínimo dentro del intervalo posible.
    minimo = Math.max(estado.minimo, Math.min(minimo, estado.maximo));

    // Mantiene el máximo dentro del intervalo posible.
    maximo = Math.max(estado.minimo, Math.min(maximo, estado.maximo));

    // Sincroniza el campo de texto con el mínimo corregido.
    inputMinimo.value = String(minimo);

    // Sincroniza el campo de texto con el máximo corregido.
    inputMaximo.value = String(maximo);

    // Sincroniza el slider inferior con el mínimo corregido.
    minRange.value = String(minimo);

    // Sincroniza el slider superior con el máximo corregido.
    maxRange.value = String(maximo);

    // Recalcula resultados y vuelve a la primera página.
    aplicarFiltros();
}

// Comprueba si el producto pasa las selecciones de categoría, marca y precio.
function coincideConFiltros(producto, categorias, marcas, minimo, maximo) {

    // Acepta categorías sin selección o una coincidencia con alguna categoría asignada.
    const coincideCategoria = !categorias.size || producto.categorias.some((categoria) => categorias.has(String(categoria.id)));

    // Acepta marcas sin selección o una coincidencia con la marca del producto.
    const coincideMarca = !marcas.size || marcas.has(String(producto.id_marca));

    // Acepta el producto si al menos una variante tiene precio efectivo en el rango.
    const coincidePrecio = producto.variantes.some((variante) => {
        const precio = precioFinal(variante.precio, producto.descuento);
        return precio >= minimo && precio <= maximo;
    });

    // Compara la búsqueda con el nombre y la descripción normalizados.
    const textoProducto = `${producto.nombre} ${producto.descripcion || ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
    const coincideBusqueda = !estado.busqueda || textoProducto.includes(estado.busqueda);

    // Exige que se cumplan simultáneamente todos los filtros activos.
    return coincideCategoria && coincideMarca && coincidePrecio && coincideBusqueda;
}

// Agrega a la selección las descendientes de cualquier categoría marcada.
function incluirDescendientesSeleccionados(categoria, seleccionadas, padreSeleccionado = false) {

    // Detecta si esta categoría o uno de sus padres fue seleccionado.
    const seleccionada = padreSeleccionado || seleccionadas.has(String(categoria.id_categoria));

    // Conserva el identificador cuando la categoría pertenece a la selección.
    if (seleccionada) seleccionadas.add(String(categoria.id_categoria));

    // Repite el recorrido para todos los niveles hijos.
    (categoria.subcategorias || []).forEach((hija) => incluirDescendientesSeleccionados(hija, seleccionadas, seleccionada));
}

// Aplica los filtros seleccionados y actualiza el catálogo mostrado.
function aplicarFiltros() {

    // Lee las casillas de categorías marcadas.
    const categorias = new Set(Array.from(document.querySelectorAll(".filtro-categoria:checked"), (casilla) => casilla.value));
    // Al marcar cualquier nivel incluye sus subcategorías descendientes.
    estado.categorias.forEach((categoria) => incluirDescendientesSeleccionados(categoria, categorias));

    // Lee las casillas de marcas marcadas.
    const marcas = new Set(Array.from(document.querySelectorAll(".filtro-marca:checked"), (casilla) => casilla.value));

    // Obtiene el mínimo seleccionado o usa el precio mínimo disponible.
    const minimo = Number(inputMinimo.value || estado.minimo);

    // Obtiene el máximo seleccionado o usa el precio máximo disponible.
    const maximo = Number(inputMaximo.value || estado.maximo);

    // Conserva los productos que cumplen todos los filtros activos.
    estado.filtrados = estado.productos.filter((producto) => coincideConFiltros(producto, categorias, marcas, minimo, maximo));

    // Reinicia a la primera página tras cambiar los filtros.
    estado.pagina = 1;

    // Dibuja las cards y los controles de paginación actualizados.
    renderizarPagina();
}

// Construye una card de producto con sus variantes disponibles.
function cargarCard(producto) {

    // Omite productos que no tienen variantes comprables.
    if (!producto.variantes.length) return "";

    // Selecciona inicialmente una variante que cumpla el rango de precio activo.
    const varianteInicial = producto.variantes.find((variante) => {
        const precio = precioFinal(variante.precio, producto.descuento);
        return precio >= Number(inputMinimo.value) && precio <= Number(inputMaximo.value);
    }) || producto.variantes[0];

    // Crea los botones de selección para todas las variantes del producto.
    const variantes = producto.variantes.map((variante) => `
    <button type="button"
        class="opcion${variante.id === varianteInicial.id ? " elegido" : ""}"
        data-id="${escaparHTML(variante.id)}"
        data-precio="${escaparHTML(variante.precio)}"
        data-stock="${escaparHTML(variante.stock)}"
        data-imagen="${escaparHTML(variante.imagen || "")}">
        ${escaparHTML(variante.atributo || "Disponible")}
    </button>`).join("");

    // Escoge la imagen del producto o la imagen de la variante elegida.
    const imagen = escaparHTML(producto.imagen || varianteInicial.imagen || imagen404);

    // Normaliza el porcentaje de descuento antes de insertarlo.
    const descuento = Number(producto.descuento) || 0;

    // Devuelve el marcado completo de la tarjeta de producto.
    return `
    <article class="card mx-auto" id="id-${escaparHTML(producto.id)}" data-descuento="${descuento}">
        <div class="imagen">
            <img src="${imagen}" class="card-img-top" onerror="this.onerror=null;this.src='${imagen404}';" alt="${escaparHTML(producto.nombre)}">
            ${descuento > 0 ? `<div class="desc">${descuento}%</div>` : ""}
        </div>
        <div class="cuerpo">
            <div class="card-body">
                <div class="card-title">${escaparHTML(producto.nombre)}</div>
                <div class="card-text">${variantes}</div>
            </div>
            <div class="card-pie">
                <div class="precio">${renderizarPrecio(Number(varianteInicial.precio), descuento)}</div>
                <button type="button" class="btn btn-comprar">Comprar</button>
            </div>
        </div>
    </article>`;
}

// Dibuja un máximo de ocho productos y los botones de navegación.
function renderizarPagina() {

    // Calcula cuántas páginas requieren los productos filtrados.
    const totalPaginas = Math.max(1, Math.ceil(estado.filtrados.length / estado.porPagina));

    // Corrige el índice si una reducción de resultados eliminó páginas.
    estado.pagina = Math.min(estado.pagina, totalPaginas);

    // Calcula el índice del primer producto visible.
    const inicio = (estado.pagina - 1) * estado.porPagina;

    // Extrae solo los ocho productos correspondientes a la página actual.
    const productosPagina = estado.filtrados.slice(inicio, inicio + estado.porPagina);

    // Inserta las cards o un aviso cuando los filtros no dan resultados.
    contenedorProductos.innerHTML = productosPagina.length ? productosPagina.map(cargarCard).join("") : '<p class="sin-resultados">No se encontraron productos con esos filtros.</p>';

    // Actualiza el número mostrado junto al título del listado.
    contadorProductos.textContent = String(estado.filtrados.length);

    // Oculta la navegación cuando todos los productos caben en una página.
    if (totalPaginas <= 1) {
        contenedorPaginacion.innerHTML = "";
        return;
    }

    // Crea un botón numérico por cada página existente.
    const paginas = Array.from({ length: totalPaginas },
        (_, indice) => `
        <li class="page-item${estado.pagina === indice + 1 ? " active" : ""}">
            <button type="button"
                class="page-link" data-pagina="${indice + 1}"
                aria-label="Ir a la página ${indice + 1}"${estado.pagina === indice + 1 ? ' aria-current="page"' : ""}>
            ${indice + 1}
            </button>
        </li>`).join("");

    // Inserta los controles anterior, numerados y siguiente.
    contenedorPaginacion.innerHTML = `
    <ul class="pagination justify-content-center mt-3">
        <li class="page-item${estado.pagina === 1 ? " disabled" : ""}">
            <button type="button" class="page-link" data-pagina="${estado.pagina - 1}">
                Anterior
            </button>
        </li>${paginas}
        <li class="page-item${estado.pagina === totalPaginas ? " disabled" : ""}">
            <button type="button" class="page-link" data-pagina="${estado.pagina + 1}">
                Siguiente
            </button>
        </li>
    </ul>`;
}

// Carga productos, categorías y marcas desde los endpoints del backend.
async function traerDatosCatalogo() {

    // Ejecuta las solicitudes simultáneamente para reducir el tiempo de espera.
    const respuestas = await Promise.all([fetch(apiProductos), fetch(apiCategorias), fetch(apiMarcas)]);

    // Informa un error si alguno de los endpoints devolvió un estado no exitoso.
    if (respuestas.some((respuesta) => !respuesta.ok)) throw new Error("No se pudieron cargar los datos del catálogo.");

    // Convierte las tres respuestas HTTP a objetos JavaScript.
    const [datosProductos, datosCategorias, marcas] = await Promise.all(respuestas.map((respuesta) => respuesta.json()));

    // Admite el objeto agrupado actual del endpoint y también una respuesta en array.
    estado.productos = (Array.isArray(datosProductos) ? datosProductos : Object.values(datosProductos || {})).map((producto) => ({ ...producto, categorias: producto.categorias || [], variantes: producto.variantes || [] }));

    // Conserva el árbol anidado que entrega el endpoint de categorías.
    estado.categorias = datosCategorias.categorias || datosCategorias;

    // Lee los términos de búsqueda y categoría enviados desde el navbar.
    const parametros = new URLSearchParams(window.location.search);
    // Normaliza la búsqueda para compararla sin distinguir mayúsculas ni tildes.
    estado.busqueda = (parametros.get("q") || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
    // Preselecciona la categoría elegida desde el menú lateral.
    const categoriaInicial = parametros.get("categoria");

    // Inserta las opciones de categoría generadas desde la base de datos.
    document.getElementById("lista-categorias").innerHTML = renderizarCategorias(estado.categorias);

    // Busca la casilla de la categoría recibida por URL, si todavía existe.
    const casillaInicial = Array.from(document.querySelectorAll(".filtro-categoria")).find((casilla) => casilla.value === categoriaInicial);

    // La marca sin disparar eventos antes de configurar los precios.
    if (casillaInicial) casillaInicial.checked = true;

    // Inserta las opciones de marca generadas desde la base de datos.
    renderizarMarcas(marcas);

    // Establece los límites del filtro de precio de acuerdo con el catálogo.
    configurarPrecios();

    // Muestra inicialmente todos los productos desde la primera página.
    aplicarFiltros();
}

// Envía al carrito la variante activa de una tarjeta de producto.
async function agregarAlCarrito(idProducto) {

    // Encuentra la tarjeta cuyo botón de compra fue pulsado.
    const tarjeta = document.getElementById(`id-${idProducto}`);

    // Toma el identificador de la variante marcada como seleccionada.
    const variante = Number(tarjeta.querySelector(".opcion.elegido")?.dataset.id);

    // Envía una unidad de esa variante al endpoint protegido del carrito.
    const respuesta = await fetch(`${apiProductos}/carrito/agregar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ variante, cantidad: 1 })
    });
    // Lee el mensaje devuelto por el backend.
    const resultado = await respuesta.json();

    // Informa el resultado de la operación al usuario.
    mostrarToast(respuesta.ok ? "Producto agregado al carrito." : resultado.mensaje || "No se pudo agregar el producto.", respuesta.ok ? 'exito' : 'error');
    // Actualiza el contador global del carrito cuando la operación tuvo éxito.
    if (respuesta.ok && typeof window.actualizarContadorCarrito === "function") window.actualizarContadorCarrito();
}

// Abre o cierra el panel lateral de filtros en pantallas pequeñas.
btnFiltros.addEventListener("click", () => menuFiltros.classList.toggle("filtro-activo"));

// Cierra el panel lateral cuando se pulsa su control de cierre.
cerrarMenu.addEventListener("click", () => menuFiltros.classList.remove("filtro-activo"));

// Recalcula resultados cuando se marca o desmarca categoría o marca.
menuFiltros.addEventListener("change", (evento) => {
    if (evento.target.matches(".filtro-categoria, .filtro-marca")) aplicarFiltros();
});

// Sincroniza los campos y filtra al mover el slider de precio mínimo.
minRange.addEventListener("input", () => {
    inputMinimo.value = minRange.value; sincronizarPrecios("minimo");
});

// Sincroniza los campos y filtra al mover el slider de precio máximo.
maxRange.addEventListener("input", () => {
    inputMaximo.value = maxRange.value; sincronizarPrecios("maximo");
});

// Aplica el rango al confirmar una edición del precio mínimo.
inputMinimo.addEventListener("change", () => sincronizarPrecios("minimo"));

// Aplica el rango al confirmar una edición del precio máximo.
inputMaximo.addEventListener("change", () => sincronizarPrecios("maximo"));

// Cambia de página sin recargar el listado desde la base de datos.
contenedorPaginacion.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-pagina]"); if (!boton || boton.closest(".disabled")) return; estado.pagina = Number(boton.dataset.pagina); renderizarPagina();
});

// Maneja la selección de variantes y el botón de compra con delegación de eventos.
contenedorProductos.addEventListener("click", (evento) => {
    const opcion = evento.target.closest(".opcion");

    if (opcion) {
        const tarjeta = opcion.closest(".card");
        tarjeta.querySelectorAll(".opcion").forEach((boton) => boton.classList.remove("elegido"));
        opcion.classList.add("elegido");
        tarjeta.querySelector(".precio").innerHTML = renderizarPrecio(Number(opcion.dataset.precio), Number(tarjeta.dataset.descuento) || 0);
        tarjeta.querySelector(".card-img-top").src = opcion.dataset.imagen || imagen404;
        return;
    }
    const botonCompra = evento.target.closest(".btn-comprar");
    if (botonCompra) agregarAlCarrito(botonCompra.closest(".card").id.replace("id-", ""));
});

// Solicita los datos una vez que el documento y sus controles están disponibles.
window.addEventListener("DOMContentLoaded", () =>
    traerDatosCatalogo().catch((error) => {
        console.error(error);
        contenedorProductos.innerHTML = '<p class="sin-resultados">No se pudo cargar el catálogo. Intenta nuevamente más tarde.</p>';
    }));
