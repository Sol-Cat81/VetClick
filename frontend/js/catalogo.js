// Obtiene el slider que controla el precio mínimo.
const minRange = document.getElementById("minRange");
// Obtiene el slider que controla el precio máximo.
const maxRange = document.getElementById("maxRange");

// Endpoint base (se mantiene para agregar al carrito) y árbol de categorías.
const apiProductos = "http://127.0.0.1:3000/api/productos";
// Nuevo: endpoint que filtra y pagina en SQL. Recibe ?q=&categorias=&marcas=
// &precioMin=&precioMax=&page=&limit= y devuelve {data,total,pagina,totalPaginas}.
const apiBuscar = "http://127.0.0.1:3000/api/productos/buscar";
// Nuevo: endpoint que devuelve {minimo,maximo} con precios finales (con
// descuento) para calibrar los sliders sin descargar el catálogo.
const apiRango = "http://127.0.0.1:3000/api/productos/rango-precios";
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

// Estado de navegación: YA NO guarda todos los productos en memoria.
// Solo conserva la página actual, el total que informó el servidor y el rango
// global de precios. Cada cambio de filtro pide una página nueva al backend.
const estado = {
    productosPagina: [], // Solo los 8 productos de la página actual.
    total: 0,            // Total de coincidencias (COUNT DISTINCT en SQL).
    totalPaginas: 1,     // Para dibujar los botones Anterior/1..N/Siguiente.
    pagina: 1,
    porPagina: 8,
    minimo: 0,           // Mínimo global (endpoint /rango-precios).
    maximo: 0,           // Máximo global (endpoint /rango-precios).
    busqueda: "",        // Texto ?q= normalizado que llegó por URL.
    cargando: false
};

// Controla la petición en curso para cancelar la anterior si el usuario mueve
// filtros rápido (evita que una respuesta vieja pise a la nueva).
let controladorActual = null;
// Temporizador del debounce: espera que el usuario deje de mover el slider.
let temporizadorFiltros = null;

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

// Lee los filtros visibles (checkboxes + rango + búsqueda) y los devuelve
// en el formato que espera el endpoint /buscar.
function leerFiltros() {
    // Categorías y marcas tildadas: se mandan como "1,2,3".
    // Las subcategorías hijas las expande el SQL (CTE recursivo), acá no hace falta.
    const categorias = Array.from(document.querySelectorAll(".filtro-categoria:checked"), (c) => c.value);
    const marcas = Array.from(document.querySelectorAll(".filtro-marca:checked"), (c) => c.value);
    return {
        q: estado.busqueda || "",
        categorias: categorias.join(","),
        marcas: marcas.join(","),
        precioMin: inputMinimo.value,
        precioMax: inputMaximo.value
    };
}

// Arma la URL de búsqueda con filtros + paginación (?page=&limit=).
function construirQuery(pagina) {
    const f = leerFiltros();
    const params = new URLSearchParams();
    if (f.q) params.set("q", f.q);
    if (f.categorias) params.set("categorias", f.categorias);
    if (f.marcas) params.set("marcas", f.marcas);
    // Solo se envía el rango si el usuario lo achicó respecto al global;
    // si está en los extremos equivale a "sin filtro de precio".
    if (f.precioMin !== "" && Number(f.precioMin) > estado.minimo) params.set("precioMin", f.precioMin);
    if (f.precioMax !== "" && Number(f.precioMax) < estado.maximo) params.set("precioMax", f.precioMax);
    params.set("page", String(pagina));
    params.set("limit", String(estado.porPagina));
    return `${apiBuscar}?${params.toString()}`;
}

// Pide UNA página filtrada al backend y la dibuja.
// Usa AbortController: si llega otro pedido antes, cancela el anterior.
async function cargarPagina(pagina) {
    // Cancela la petición anterior que aún no respondió.
    if (controladorActual) controladorActual.abort();
    controladorActual = new AbortController();

    estado.cargando = true;
    estado.pagina = pagina;
    // Aviso de carga para que no parezca que la página se congeló.
    contenedorProductos.innerHTML = '<p class="sin-resultados">Cargando productos…</p>';

    try {
        const respuesta = await fetch(construirQuery(pagina), { signal: controladorActual.signal });
        if (!respuesta.ok) throw new Error("No se pudieron cargar los productos.");
        // El servidor ya aplicó WHERE + LIMIT/OFFSET y calculó el total.
        const { data, total, totalPaginas } = await respuesta.json();
        // Normaliza por si algún producto llega sin arrays (compatibilidad).
        estado.productosPagina = (Array.isArray(data) ? data : []).map((p) => ({
            ...p, categorias: p.categorias || [], variantes: p.variantes || []
        }));
        estado.total = Number(total || 0);
        estado.totalPaginas = Math.max(1, Number(totalPaginas || 1));
        renderizarPagina();
    } catch (error) {
        // AbortError es normal (filtro movido rápido): no se muestra como error.
        if (error?.name === "AbortError") return;
        console.error(error);
        contenedorProductos.innerHTML = '<p class="sin-resultados">No se pudo cargar el catálogo. Intenta nuevamente más tarde.</p>';
        contenedorPaginacion.innerHTML = "";
    } finally {
        estado.cargando = false;
    }
}

// Vuelve a la página 1 cada vez que cambia un filtro (categoría, marca,
// precio o búsqueda) y pide esa primera página al servidor.
function aplicarFiltros() {
    cargarPagina(1);
}

// Pide los filtros con debounce: espera 350ms sin cambios antes de consultar,
// así mover el slider no dispara decenas de peticiones SQL seguidas.
function aplicarFiltrosDebounced() {
    clearTimeout(temporizadorFiltros);
    temporizadorFiltros = setTimeout(() => aplicarFiltros(), 350);
}

// Configura los sliders con el rango GLOBAL que calcula SQL (MIN/MAX del
// precio final). Ya no se deduce de descargar todos los productos.
function configurarControlesRango(minimo, maximo) {
    estado.minimo = Number(minimo || 0);
    estado.maximo = Number(maximo || 0);
    // Si no hay productos, evita sliders rotos con max < min.
    if (estado.maximo <= estado.minimo) estado.maximo = estado.minimo + 1;

    for (const [control, valor] of [[minRange, estado.minimo], [maxRange, estado.maximo]]) {
        control.min = String(estado.minimo);
        control.max = String(estado.maximo);
        control.step = "1";
        control.value = String(valor);
    }
    for (const [control, valor] of [[inputMinimo, estado.minimo], [inputMaximo, estado.maximo]]) {
        control.min = String(estado.minimo);
        control.max = String(estado.maximo);
        control.value = String(valor);
    }
}

// Mantiene mínimo <= máximo y los valores dentro del rango global.
// No filtra directo: delega con debounce para no saturar al backend.
function sincronizarPrecios(origen) {
    // Lee el precio mínimo/máximo actual o su límite global.
    let minimo = Number(inputMinimo.value || estado.minimo);
    let maximo = Number(inputMaximo.value || estado.maximo);

    // Evita que el valor mínimo quede por encima del máximo.
    if (minimo > maximo) origen === "minimo" ? maximo = minimo : minimo = maximo;

    // Mantiene ambos dentro del intervalo posible.
    minimo = Math.max(estado.minimo, Math.min(minimo, estado.maximo));
    maximo = Math.max(estado.minimo, Math.min(maximo, estado.maximo));

    // Sincroniza campos numéricos y sliders con los valores corregidos.
    inputMinimo.value = String(minimo);
    inputMaximo.value = String(maximo);
    minRange.value = String(minimo);
    maxRange.value = String(maximo);

    // Pide la página 1 filtrada (con debounce por si arrastra el slider).
    aplicarFiltrosDebounced();
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
        data-stock="${escaparHTML(variante.stock)}">
        ${escaparHTML(variante.atributo || "Disponible")}
    </button>`).join("");

    // Escoge la imagen del producto o la imagen de la variante elegida.
    const imagen = escaparHTML(producto.imagen || imagen404);

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

// Dibuja la página actual que YA vino filtrada del servidor.
// No usa .slice(): el backend devolvió exactamente los 8 de esta página y el
// total para numerar los botones.
function renderizarPagina() {
    // Corrige el índice si una reducción de resultados eliminó páginas.
    estado.pagina = Math.min(Math.max(1, estado.pagina), estado.totalPaginas);

    // Inserta las cards o un aviso cuando los filtros no dan resultados.
    contenedorProductos.innerHTML = estado.productosPagina.length
        ? estado.productosPagina.map(cargarCard).join("")
        : '<p class="sin-resultados">No se encontraron productos con esos filtros.</p>';

    // Muestra el TOTAL real que calculó SQL (COUNT DISTINCT), no el largo local.
    contadorProductos.textContent = String(estado.total);

    // Oculta la navegación cuando todo cabe en una página.
    if (estado.totalPaginas <= 1) {
        contenedorPaginacion.innerHTML = "";
        return;
    }

    // Crea un botón numérico por cada página existente.
    const paginas = Array.from({ length: estado.totalPaginas },
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
        <li class="page-item${estado.pagina === estado.totalPaginas ? " disabled" : ""}">
            <button type="button" class="page-link" data-pagina="${estado.pagina + 1}">
                Siguiente
            </button>
        </li>
    </ul>`;
}

// Carga inicial: categorías + marcas + rango de precios en paralelo.
// Los PRODUCTOS ya no se traen todos: solo se pide la página 1 con filtros.
async function traerDatosCatalogo() {

    // Ejecuta las solicitudes de filtros simultáneamente para ir más rápido.
    const respuestas = await Promise.all([fetch(apiCategorias), fetch(apiMarcas), fetch(apiRango)]);

    // Informa un error si alguno de los endpoints devolvió un estado no exitoso.
    if (respuestas.some((respuesta) => !respuesta.ok)) throw new Error("No se pudieron cargar los datos del catálogo.");

    // Convierte las tres respuestas HTTP a objetos JavaScript.
    const [datosCategorias, marcas, rango] = await Promise.all(respuestas.map((respuesta) => respuesta.json()));

    // Calibra sliders con MIN/MAX calculados en SQL (sin descargar productos).
    configurarControlesRango(rango.minimo, rango.maximo);

    // Lee los términos de búsqueda y categoría enviados desde el navbar.
    const parametros = new URLSearchParams(window.location.search);
    // Normaliza la búsqueda para el LIKE del servidor (sin tildes ni mayúsculas
    // en el comparador local; el SQL usa LIKE parcial sobre nombre/descripción).
    estado.busqueda = (parametros.get("q") || "").trim();
    // Preselecciona la categoría elegida desde el menú lateral.
    const categoriaInicial = parametros.get("categoria");

    // Inserta las opciones de categoría generadas desde la base de datos.
    document.getElementById("lista-categorias").innerHTML = renderizarCategorias(datosCategorias.categorias || datosCategorias);

    // Busca la casilla de la categoría recibida por URL, si todavía existe.
    const casillaInicial = Array.from(document.querySelectorAll(".filtro-categoria")).find((casilla) => casilla.value === categoriaInicial);

    // La marca sin disparar eventos antes de pedir la primera página.
    if (casillaInicial) casillaInicial.checked = true;

    // Inserta las opciones de marca generadas desde la base de datos.
    renderizarMarcas(marcas);

    // Pide la primera página ya filtrada (respeta ?q= y ?categoria=).
    await cargarPagina(1);
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

// Cada tildado/destildado pide la página 1 al backend (los filtros viven en SQL).
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

// Cambia de página pidiendo esa página al backend (ya no es un slice local).
contenedorPaginacion.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-pagina]");
    if (!boton || boton.closest(".disabled")) return;
    const destino = Number(boton.dataset.pagina);
    if (!Number.isInteger(destino) || destino === estado.pagina) return;
    cargarPagina(destino);
});

// Maneja la selección de variantes y el botón de compra con delegación de eventos.
contenedorProductos.addEventListener("click", (evento) => {
    const opcion = evento.target.closest(".opcion");

    if (opcion) {
        const tarjeta = opcion.closest(".card");
        tarjeta.querySelectorAll(".opcion").forEach((boton) => boton.classList.remove("elegido"));
        opcion.classList.add("elegido");
        tarjeta.querySelector(".precio").innerHTML = renderizarPrecio(Number(opcion.dataset.precio), Number(tarjeta.dataset.descuento) || 0);
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
