const API_CARRITO = "http://127.0.0.1:3000/api/productos/carrito";
const IMAGEN_RESPALDO = "../assets/icons/LogoPrincipal.jpeg";
const formatoMoneda = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
});

const listaProductos = document.getElementById("lista-productos");
const estadoVacio = document.getElementById("carrito-vacio");
const contadorItems = document.getElementById("cantidad-items");
const totalProductos = document.getElementById("subtotal-compra");
const costoEnvio = document.getElementById("costo-envio");
const totalCompra = document.getElementById("total-compra");
const tipoEntrega = document.getElementById("tipo-entrega");
const botonConfirmar = document.getElementById("confirmar-compra");
const mensajeCompra = document.getElementById("mensaje-compra");
let productosCarrito = [];

// Calcula el precio unitario luego de aplicar el descuento porcentual del producto.
function precioFinal(producto) {
    const precio = Number(producto.precio) || 0;
    const descuento = Math.min(Math.max(Number(producto.descuento) || 0, 0), 100);
    return precio * (1 - descuento / 100);
}

// Construye la fila visual con identidad, variante, controles, precio y subtotal.
function crearProducto(producto) {
    const fila = document.createElement("article");
    fila.className = "producto-fila";

    const identidad = document.createElement("div");
    identidad.className = "producto-identidad";

    const imagen = document.createElement("img");
    imagen.className = "producto-imagen";
    imagen.src = producto.imagen_producto || producto.imagen_variante || IMAGEN_RESPALDO;
    imagen.alt = producto.nombre || "Producto para mascota";
    imagen.addEventListener("error", () => {
        imagen.src = IMAGEN_RESPALDO;
    }, { once: true });

    const descripcion = document.createElement("div");
    const nombre = document.createElement("h3");
    nombre.className = "producto-nombre";
    nombre.textContent = producto.nombre || "Producto";
    descripcion.append(nombre);

    if (producto.atributo) {
        const variante = document.createElement("p");
        variante.className = "producto-variante";
        variante.textContent = producto.atributo;
        descripcion.append(variante);
    }

    const eliminar = document.createElement("button");
    eliminar.className = "producto-eliminar";
    eliminar.type = "button";
    eliminar.dataset.action = "eliminar";
    eliminar.dataset.variante = producto.id_variante;
    eliminar.textContent = "Quitar";
    descripcion.append(eliminar);
    identidad.append(imagen, descripcion);

    const cantidad = document.createElement("div");
    cantidad.className = "control-cantidad";
    const disminuir = document.createElement("button");
    disminuir.type = "button";
    disminuir.dataset.action = "disminuir";
    disminuir.dataset.variante = producto.id_variante;
    disminuir.setAttribute("aria-label", `Disminuir cantidad de ${producto.nombre}`);
    disminuir.innerHTML = '<i class="ph ph-minus" aria-hidden="true"></i>';
    disminuir.disabled = Number(producto.cantidad) <= 1;
    const valor = document.createElement("output");
    valor.textContent = producto.cantidad;
    const aumentar = document.createElement("button");
    aumentar.type = "button";
    aumentar.dataset.action = "aumentar";
    aumentar.dataset.variante = producto.id_variante;
    aumentar.setAttribute("aria-label", `Aumentar cantidad de ${producto.nombre}`);
    aumentar.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i>';
    aumentar.disabled = Number.isFinite(Number(producto.stock)) && Number(producto.cantidad) >= Number(producto.stock);
    cantidad.append(disminuir, valor, aumentar);

    const precio = document.createElement("div");
    precio.className = "precio-unitario";
    precio.append(document.createTextNode(formatoMoneda.format(precioFinal(producto))));
    if (Number(producto.descuento) > 0) {
        const precioAnterior = document.createElement("span");
        precioAnterior.className = "precio-anterior";
        precioAnterior.textContent = formatoMoneda.format(Number(producto.precio) || 0);
        precio.append(precioAnterior);
    }

    const subtotal = document.createElement("strong");
    subtotal.className = "producto-subtotal";
    subtotal.textContent = formatoMoneda.format(precioFinal(producto) * Number(producto.cantidad));
    fila.append(identidad, cantidad, precio, subtotal);
    return fila;
}

// Actualiza unidades, subtotal, entrega y disponibilidad del botón de compra.
function actualizarTotales() {
    const subtotal = productosCarrito.reduce(
        (total, producto) => total + precioFinal(producto) * Number(producto.cantidad),
        0,
    );
    const esRetiro = tipoEntrega.value === "retiro";
    const unidades = productosCarrito.reduce((total, producto) => total + Number(producto.cantidad), 0);

    contadorItems.textContent = `(${unidades})`;
    totalProductos.textContent = formatoMoneda.format(subtotal);
    costoEnvio.textContent = productosCarrito.length === 0
        ? formatoMoneda.format(0)
        : esRetiro ? "Sin cargo" : "A calcular";
    totalCompra.textContent = formatoMoneda.format(subtotal);
    botonConfirmar.disabled = productosCarrito.length === 0;
}

// Limpia la lista y muestra el estado vacío con el mensaje correspondiente.
function mostrarVacio(mensaje) {
    listaProductos.replaceChildren();
    estadoVacio.hidden = false;
    const texto = estadoVacio.querySelector("p");
    texto.textContent = mensaje || "Encontrá algo para hacerle el día a tu mascota.";
    if (mensaje && mensaje.includes("Iniciá sesión")) {
        const enlace = document.createElement("a");
        enlace.className = "boton-primario";
        enlace.href = "../login.html";
        enlace.textContent = "Iniciar sesión";
        estadoVacio.append(enlace);
    }
}

// Consulta el carrito y representa sus productos o el estado vacío/de error.
async function cargarCarrito() {
    try {
        const respuesta = await fetch(API_CARRITO, { credentials: "include" });
        const datos = await respuesta.json();

        if (respuesta.status === 401) {
            productosCarrito = [];
            mostrarVacio("Iniciá sesión para consultar tu carrito.");
            actualizarTotales();
            return;
        }
        if (!respuesta.ok) throw new Error(datos.mensaje || "No se pudo cargar el carrito.");

        productosCarrito = Array.isArray(datos) ? datos : [];
        estadoVacio.hidden = productosCarrito.length > 0;
        listaProductos.replaceChildren(...productosCarrito.map(crearProducto));
        if (productosCarrito.length === 0) mostrarVacio();
        actualizarTotales();
    } catch (error) {
        productosCarrito = [];
        mostrarVacio("No pudimos conectar con el carrito. Probá de nuevo en unos minutos.");
        actualizarTotales();
    }
}

// Envía al backend el cambio de cantidad o la eliminación de una variante.
async function modificarCarrito(accion, idVariante) {
    const producto = productosCarrito.find((item) => Number(item.id_variante) === Number(idVariante));
    if (!producto) return;

    const opciones = {
        method: accion === "eliminar" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            id_variante: Number(idVariante),
            ...(accion === "aumentar" && { cantidad: Number(producto.cantidad) + 1 }),
            ...(accion === "disminuir" && { cantidad: Number(producto.cantidad) - 1 }),
        }),
    };

    try {
        const respuesta = await fetch(`${API_CARRITO}/${accion === "eliminar" ? "eliminar" : "cantidad"}`, opciones);
        if (!respuesta.ok) {
            const detalle = await respuesta.json().catch(() => ({}));
            throw new Error(detalle.mensaje || "No se pudo actualizar el carrito.");
        }
        mensajeCompra.textContent = "";
        await cargarCarrito();
        if (typeof window.actualizarContadorCarrito === 'function') {
            window.actualizarContadorCarrito();
        }
    } catch (error) {
        mensajeCompra.textContent = error.message;
    }
}

// Delega los clics de los controles según la acción y variante seleccionadas.
listaProductos.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-action]");
    if (boton) modificarCarrito(boton.dataset.action, boton.dataset.variante);
});

// Recalcula el resumen cuando cambia el tipo de entrega.
tipoEntrega.addEventListener("change", actualizarTotales);

// Evita enviar el formulario hasta que el flujo de compra esté implementado.
document.getElementById("form-compra").addEventListener("submit", (evento) => {
    evento.preventDefault();
    mensajeCompra.textContent = "Los datos están completos. La confirmación de compra todavía no está habilitada.";
});

cargarCarrito();