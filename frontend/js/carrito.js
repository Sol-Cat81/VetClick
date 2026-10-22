const API_CARRITO = "http://127.0.0.1:3000/api/productos/carrito";
const API_USUARIOS = "http://127.0.0.1:3000/api/usuarios";
const API_CHECKOUT = `${API_CARRITO}/checkout`;
const IMAGEN_RESPALDO = "../assets/icons/LogoPrincipal.jpeg";
// El backend cobra el mismo importe fijo en todos los envíos a domicilio.
const COSTO_ENVIO_DOMICILIO = 1500;
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
const formCompra = document.getElementById("form-compra");
const campoDireccion = document.getElementById("campo-direccion");
const campoCodigoPostal = document.getElementById("campo-codigo-postal");
const selectDireccion = document.getElementById("select-direccion");
const sinDirecciones = document.getElementById("sin-direcciones");
const inputCodigoPostal = document.getElementById("codigo-postal");
const avisoRegistro = document.getElementById("aviso-registro");
const notaEnvio = document.querySelector(".nota-envio");
const modalResumen = document.getElementById("modal-resumen-compra");
const detalleModalResumen = document.getElementById("detalle-modal-resumen");
const pieModalResumen = document.getElementById("pie-modal-resumen");
const tituloModalResumen = document.getElementById("titulo-modal-resumen");
const subtituloModalResumen = document.getElementById("subtitulo-modal-resumen");
const iconoModalResumen = document.getElementById("icono-modal-resumen");

let productosCarrito = [];
// Datos del cliente y sus direcciones, cargados desde /api/usuarios/datosenvio.
let datosEnvio = { cargado: false, cliente: null, direcciones: [] };
let pedidoConfirmado = false;
let compraEnCurso = false;

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
    const hayProductos = productosCarrito.length > 0;
    // El envío solo se cobra con productos y cuando es a domicilio.
    const envio = hayProductos && !esRetiro ? COSTO_ENVIO_DOMICILIO : 0;

    contadorItems.textContent = `(${unidades})`;
    totalProductos.textContent = formatoMoneda.format(subtotal);
    costoEnvio.textContent = !hayProductos
        ? formatoMoneda.format(0)
        : esRetiro ? "Sin cargo" : formatoMoneda.format(COSTO_ENVIO_DOMICILIO);
    totalCompra.textContent = formatoMoneda.format(subtotal + envio);
    botonConfirmar.disabled = !hayProductos || !datosEnvio.cliente || pedidoConfirmado;
}

// Muestra u oculta los campos de dirección según el tipo de entrega elegido.
function aplicarEntrega() {
    const esRetiro = tipoEntrega.value === "retiro";
    const registrado = datosEnvio.cliente !== null;
    const hayDirecciones = datosEnvio.direcciones.length > 0;

    const mostrarSelect = !esRetiro && registrado && hayDirecciones;
    const mostrarBotonAlta = !esRetiro && registrado && !hayDirecciones;

    campoDireccion.hidden = !mostrarSelect;
    campoCodigoPostal.hidden = !mostrarSelect;
    sinDirecciones.hidden = !mostrarBotonAlta;

    selectDireccion.required = mostrarSelect;
    inputCodigoPostal.required = mostrarSelect;

    notaEnvio.textContent = esRetiro
        ? "Sin cargo si retirás el pedido en una sucursal."
        : `Envío fijo a domicilio: ${formatoMoneda.format(COSTO_ENVIO_DOMICILIO)}.`;
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

// Carga el cliente y sus direcciones para completar el formulario de envío.
async function cargarDatosEnvio() {
    try {
        const respuesta = await fetch(`${API_USUARIOS}/datosenvio`, { credentials: "include" });
        if (respuesta.status === 401) {
            datosEnvio = { cargado: true, cliente: null, direcciones: [], sinSesion: true };
        } else {
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.mensaje || datos.message || "No se pudieron cargar tus datos de envío.");
            datosEnvio = {
                cargado: true,
                cliente: datos.cliente ?? null,
                direcciones: Array.isArray(datos.direcciones) ? datos.direcciones : [],
            };
        }
    } catch (error) {
        datosEnvio = { cargado: true, cliente: null, direcciones: [], error: error.message };
    }
    aplicarDatosEnvio();
}

// Refleja en el formulario si el usuario pudo completar su registro.
function aplicarDatosEnvio() {
    avisoRegistro.hidden = true;
    avisoRegistro.replaceChildren();

    if (datosEnvio.error) {
        avisoRegistro.textContent = "No pudimos cargar tus datos de envío. Probá de nuevo en unos minutos.";
        avisoRegistro.hidden = false;
    } else if (datosEnvio.sinSesion) {
        mostrarAvisoRegistro("Iniciá sesión para poder comprar.", "../login.html", "Iniciar sesión");
    } else if (!datosEnvio.cliente) {
        mostrarAvisoRegistro(
            "Todavía no completaste tu registro como cliente.",
            "cuenta.html",
            "Completá mi registro",
        );
    } else {
        document.getElementById("nombre").value = datosEnvio.cliente.nombre ?? "";
        document.getElementById("apellido").value = datosEnvio.cliente.apellido ?? "";
        document.getElementById("telefono").value = datosEnvio.cliente.telefono ?? "";
        cargarDirecciones(datosEnvio.direcciones);
    }

    aplicarEntrega();
    actualizarTotales();
}

// Escribe el aviso de registro con un enlace a la página indicada.
function mostrarAvisoRegistro(texto, destino, textoEnlace) {
    avisoRegistro.textContent = `${texto} `;
    const enlace = document.createElement("a");
    enlace.href = destino;
    enlace.textContent = textoEnlace;
    avisoRegistro.append(enlace);
    avisoRegistro.hidden = false;
}

// Completa el select con las direcciones del cliente y su código postal.
function cargarDirecciones(direcciones) {
    const opciones = direcciones.map((direccion) => {
        const opcion = document.createElement("option");
        opcion.value = direccion.id_direccion;
        opcion.textContent = `${direccion.calle} ${direccion.numero}, ${direccion.localidad}${direccion.tipo ? ` (${direccion.tipo})` : ""}`;
        opcion.dataset.cp = direccion.codigo_postal || "";
        return opcion;
    });
    selectDireccion.replaceChildren(
        Object.assign(document.createElement("option"), { value: "", textContent: "Seleccioná una dirección" }),
        ...opciones,
    );
    inputCodigoPostal.value = "";
}

// Devuelve la dirección elegida del select o null si no hay ninguna.
function direccionSeleccionada() {
    const idDireccion = Number(selectDireccion.value);
    if (!idDireccion) return null;
    return datosEnvio.direcciones.find((item) => Number(item.id_direccion) === idDireccion) || null;
}

// Texto completo de la dirección, para mostrarlo en el resumen del pedido.
function textoDireccion(direccion) {
    return `${direccion.calle} ${direccion.numero}, ${direccion.localidad}, ${direccion.provincia} (CP ${direccion.codigo_postal})`;
}


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
tipoEntrega.addEventListener("change", () => {
    aplicarEntrega();
    actualizarTotales();
});

// Al elegir una dirección se completa el código postal que le corresponde.
selectDireccion.addEventListener("change", () => {
    const direccion = direccionSeleccionada();
    inputCodigoPostal.value = direccion ? (direccion.codigo_postal || "") : "";
});

// Etiquetas legibles de cada forma de pago para el resumen del pedido.
const ETIQUETAS_PAGO = {
    CREDITO: "Tarjeta de crédito",
    DEBITO: "Tarjeta de débito",
    TRANSFERENCIA: "Transferencia",
    EFECTIVO: "Efectivo",
};

// Escapa los textos que vienen del formulario antes de escribirlos con innerHTML.
function escaparHTML(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (caracter) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[caracter]);
}

// Valida el formulario y abre el modal con el resumen del pedido.
formCompra.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (botonConfirmar.disabled || pedidoConfirmado) return;

    const datos = new FormData(formCompra);
    const nombre = String(datos.get("nombre") || "").trim();
    const apellido = String(datos.get("apellido") || "").trim();
    const telefono = String(datos.get("telefono") || "").trim();
    const codigoPostal = String(datos.get("codigoPostal") || "").trim();
    const esRetiro = tipoEntrega.value === "retiro";

    mensajeCompra.textContent = "";
    if (!nombre || !apellido || !telefono) {
        mensajeCompra.textContent = "Completá el nombre, el apellido y el teléfono.";
        return;
    }

    const direccion = esRetiro ? null : direccionSeleccionada();
    if (!esRetiro) {
        if (datosEnvio.direcciones.length === 0) {
            mensajeCompra.textContent = "Registrá una dirección para enviar a domicilio.";
            return;
        }
        if (!direccion) {
            mensajeCompra.textContent = "Seleccioná la dirección de entrega.";
            return;
        }
        if (codigoPostal.length < 4 || codigoPostal.length > 10) {
            mensajeCompra.textContent = "Revisá el código postal: debe tener entre 4 y 10 caracteres.";
            return;
        }
    }

    mostrarResumen({ nombre, apellido, telefono, esRetiro, direccion, codigoPostal, metodoPago: String(datos.get("pago") || "").toUpperCase() });
});

// Escribe en el modal los datos del pedido, el envío y la forma de pago.
function mostrarResumen(pedido) {
    const subtotal = productosCarrito.reduce((total, producto) => total + precioFinal(producto) * Number(producto.cantidad), 0);
    const envio = pedido.esRetiro ? 0 : COSTO_ENVIO_DOMICILIO;
    const unidades = productosCarrito.reduce((total, producto) => total + Number(producto.cantidad), 0);

    iconoModalResumen.classList.remove("icono-exito");
    iconoModalResumen.innerHTML = '<i class="ph ph-clipboard-text" aria-hidden="true"></i>';
    tituloModalResumen.textContent = "Resumen del pedido";
    subtituloModalResumen.textContent = "Revisá los datos antes de confirmar la compra.";

    const lineasProductos = productosCarrito.map((producto) => `
        <li>
            <span class="detalle-producto">
                <strong>${escaparHTML(producto.nombre)}</strong>
                ${producto.atributo ? `<small>${escaparHTML(producto.atributo)}</small>` : ""}
                <small>${Number(producto.cantidad)} x ${formatoMoneda.format(precioFinal(producto))}</small>
            </span>
            <span class="detalle-importe">${formatoMoneda.format(precioFinal(producto) * Number(producto.cantidad))}</span>
        </li>`).join("");

    detalleModalResumen.innerHTML = `
        <section class="bloque-detalle">
            <h4><i class="ph ph-basket" aria-hidden="true"></i> Productos (${unidades})</h4>
            <ul class="lineas-detalle">${lineasProductos}</ul>
        </section>
        <section class="bloque-detalle">
            <h4><i class="ph ph-truck" aria-hidden="true"></i> Envío</h4>
            <ul class="lineas-detalle">
                <li><span>Entrega</span><span>${pedido.esRetiro ? "Retiro en sucursal" : "Envío a domicilio"}</span></li>
                ${pedido.direccion ? `<li class="fila-envio"><span>Dirección</span><span>${escaparHTML(textoDireccion(pedido.direccion))}</span></li>` : ""}
                ${pedido.esRetiro ? "" : `<li><span>Código postal</span><span>${escaparHTML(pedido.codigoPostal)}</span></li>`}
                <li><span>Costo de envío</span><span>${envio ? formatoMoneda.format(envio) : "Sin cargo"}</span></li>
            </ul>
        </section>
        <section class="bloque-detalle">
            <h4><i class="ph ph-user-circle" aria-hidden="true"></i> Contacto y pago</h4>
            <ul class="lineas-detalle">
                <li><span>Nombre</span><span>${escaparHTML(`${pedido.nombre} ${pedido.apellido}`)}</span></li>
                <li><span>Teléfono</span><span>${escaparHTML(pedido.telefono)}</span></li>
                <li><span>Forma de pago</span><span>${ETIQUETAS_PAGO[pedido.metodoPago] || escaparHTML(pedido.metodoPago)}</span></li>
            </ul>
        </section>
        <div class="totales-detalle">
            <div><span>Productos</span><strong>${formatoMoneda.format(subtotal)}</strong></div>
            <div><span>Envío</span><strong>${envio ? formatoMoneda.format(envio) : "Sin cargo"}</strong></div>
            <div class="total-detalle"><span>Total</span><strong>${formatoMoneda.format(subtotal + envio)}</strong></div>
        </div>`;

    restaurarPieModal();
    abrirModalResumen();
}

// Vuelve al pie con los botones de edición y de confirmación.
function restaurarPieModal() {
    pieModalResumen.innerHTML = `
        <button type="button" class="boton-secundario" data-cerrar-resumen>Seguir editando</button>
        <button type="button" class="boton-primario" id="terminar-compra">
            Terminar compra <i class="ph ph-check-circle" aria-hidden="true"></i>
        </button>`;
}

// Abre el modal de resumen; si el navegador no soporta <dialog>, lo muestra a mano.
function abrirModalResumen() {
    if (typeof modalResumen.showModal === "function") {
        if (!modalResumen.open) modalResumen.showModal();
    } else {
        modalResumen.setAttribute("open", "");
    }
}

// Registra el pedido en el backend y muestra la confirmación de la compra.
async function registrarCompra() {
    if (compraEnCurso || pedidoConfirmado) return;

    const datos = new FormData(formCompra);
    const esRetiro = tipoEntrega.value === "retiro";
    const direccion = esRetiro ? null : direccionSeleccionada();
    if (!esRetiro && !direccion) {
        modalResumen.close();
        mensajeCompra.textContent = "Seleccioná la dirección de entrega.";
        return;
    }

    compraEnCurso = true;
    // El pie se reconstruye en cada apertura, así que se busca el botón actual.
    const botonActual = pieModalResumen.querySelector("#terminar-compra");
    if (botonActual) {
        botonActual.disabled = true;
        botonActual.textContent = "Procesando...";
    }

    try {
        const respuesta = await fetch(API_CHECKOUT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                tipo_entrega: esRetiro ? "SUCURSAL" : "DOMICILIO",
                metodo_pago: String(datos.get("pago") || "").toUpperCase(),
                id_direccion: direccion ? Number(direccion.id_direccion) : null,
                codigo_postal: esRetiro ? null : String(datos.get("codigoPostal") || "").trim(),
            }),
        });
        const confirmacion = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(confirmacion.mensaje || "No se pudo registrar la compra.");

        vaciarCarritoLocal();
        mostrarExito(confirmacion.pedido || {});
    } catch (error) {
        mostrarErrorResumen(error.message);
    } finally {
        compraEnCurso = false;
        const botonFinal = pieModalResumen.querySelector("#terminar-compra");
        if (botonFinal) {
            botonFinal.disabled = false;
            botonFinal.innerHTML = 'Terminar compra <i class="ph ph-check-circle" aria-hidden="true"></i>';
        }
    }
}

// Cambia el modal a la pantalla de éxito con el número de pedido registrado.
function mostrarExito(pedido) {
    pedidoConfirmado = true;
    mensajeCompra.textContent = "";

    iconoModalResumen.classList.add("icono-exito");
    iconoModalResumen.innerHTML = '<i class="ph ph-check-circle" aria-hidden="true"></i>';
    tituloModalResumen.textContent = "¡Compra registrada!";
    subtituloResumen(pedido);
    detalleModalResumen.innerHTML = `
        <div class="exito-compra">
            <p>Tu pedido <strong>N° ${Number(pedido.id_pedido) || "-"}</strong> fue registrado correctamente.</p>
            <ul class="lineas-detalle">
                <li><span>Total abonado</span><span>${formatoMoneda.format(Number(pedido.total) || 0)}</span></li>
                <li><span>Estado del pedido</span><span>Pendiente de preparación</span></li>
            </ul>
            <p class="nota-exito">Te vamos a avisar cuando el pedido esté en camino.</p>
        </div>`;

    pieModalResumen.replaceChildren();
    const seguirComprando = document.createElement("a");
    seguirComprando.className = "boton-secundario";
    seguirComprando.href = "productos.html";
    seguirComprando.textContent = "Seguir comprando";
    const verCompras = document.createElement("a");
    verCompras.className = "boton-primario";
    verCompras.href = "cuenta.html";
    verCompras.textContent = "Ver mis compras";
    pieModalResumen.append(seguirComprando, verCompras);

    // El formulario y la lista ya cumplieron su función.
    formCompra.querySelectorAll("input, select, button").forEach((campo) => { campo.disabled = true; });
    actualizarTotales();
}

// Subtítulo del modal en modo éxito, con el identificador del pedido.
function subtituloResumen(pedido) {
    subtituloModalResumen.textContent = Number(pedido.id_pedido)
        ? `Pedido N° ${Number(pedido.id_pedido)} · ${formatoMoneda.format(Number(pedido.total) || 0)}`
        : "Gracias por tu compra.";
}

// Muestra el motivo del fallo dentro del modal para reintentar la compra.
function mostrarErrorResumen(texto) {
    let error = pieModalResumen.querySelector(".error-resumen");
    if (!error) {
        error = document.createElement("p");
        error.className = "error-resumen";
        pieModalResumen.prepend(error);
    }
    error.textContent = texto;
}

// Deja la vista de carrito vacía y actualiza el contador del navbar.
function vaciarCarritoLocal() {
    productosCarrito = [];
    listaProductos.replaceChildren();
    estadoVacio.hidden = false;
    const texto = estadoVacio.querySelector("p");
    texto.textContent = "Encontrá algo para hacerle el día a tu mascota.";
    const enlaceSesion = estadoVacio.querySelector("a");
    if (enlaceSesion) enlaceSesion.remove();
    actualizarTotales();
    if (typeof window.actualizarContadorCarrito === "function") {
        window.actualizarContadorCarrito();
    }
}

// Acciones del pie del modal: cerrar la revisión o terminar la compra.
pieModalResumen.addEventListener("click", (evento) => {
    if (evento.target.closest("[data-cerrar-resumen]")) {
        modalResumen.close();
        return;
    }
    if (evento.target.closest("#terminar-compra")) {
        registrarCompra();
    }
});

// Botón de cierre y clic fuera del modal para volver al formulario.
modalResumen.addEventListener("click", (evento) => {
    if (evento.target.closest("[data-cerrar-resumen]")) {
        modalResumen.close();
        return;
    }
    const caja = modalResumen.getBoundingClientRect();
    const dentro = evento.clientX >= caja.left && evento.clientX <= caja.right &&
        evento.clientY >= caja.top && evento.clientY <= caja.bottom;
    if (!dentro) modalResumen.close();
});

cargarCarrito();
cargarDatosEnvio();