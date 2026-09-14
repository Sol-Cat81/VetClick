/* =====================================================
   DATOS DE EJEMPLO
   Más adelante estos datos vendrán desde Node.js + MySQL
===================================================== */

const envios = {

    1: {
        idEnvio: "#0001",
        idPedido: "#0001",
        cliente: "Martín Rodríguez",
        tipoEntrega: "DOMICILIO",
        direccion: "Av. Belgrano 1250",
        codigoPostal: "4000",
        fechaEstimada: "10/09/2026",
        fechaEntrega: null,
        estado: "EN_CAMINO"
    },

    2: {
        idEnvio: "#0002",
        idPedido: "#0002",
        cliente: "Lucía Martínez",
        tipoEntrega: "SUCURSAL",
        direccion: "Retiro en sucursal",
        codigoPostal: "4000",
        fechaEstimada: "09/09/2026",
        fechaEntrega: "09/09/2026",
        estado: "ENTREGADO"
    },

    3: {
        idEnvio: "#0003",
        idPedido: "#0003",
        cliente: "Juan Pérez",
        tipoEntrega: "PROGRAMADO",
        direccion: "Calle San Martín 850",
        codigoPostal: "4000",
        fechaEstimada: "12/09/2026",
        fechaEntrega: null,
        estado: "EN_CAMINO"
    },

    4: {
        idEnvio: "#0004",
        idPedido: "#0004",
        cliente: "Carla Gómez",
        tipoEntrega: "DOMICILIO",
        direccion: "Calle Rivadavia 430",
        codigoPostal: "4000",
        fechaEstimada: "11/09/2026",
        fechaEntrega: null,
        estado: "EN_CAMINO"
    }

};


/* =====================================================
   ABRIR MODAL
===================================================== */

function abrirModalEnvio(idEnvio) {

    const envio = envios[idEnvio];

    if (!envio) {
        console.error("No se encontró el envío:", idEnvio);
        return;
    }


    const modal = document.getElementById("modalEnvio");

    if (!modal) {
        console.error("No se encontró el modal de envíos.");
        return;
    }


    /* ---------------------------------------------
       CARGAR INFORMACIÓN
    --------------------------------------------- */

    document.getElementById("modalEnvioId").textContent =
        `Envío ${envio.idEnvio}`;

    document.getElementById("modalEnvioPedido").textContent =
        envio.idPedido;

    document.getElementById("modalEnvioCliente").textContent =
        envio.cliente;

    document.getElementById("modalEnvioTipo").textContent =
        obtenerNombreTipoEntrega(envio.tipoEntrega);

    document.getElementById("modalEnvioCodigoPostal").textContent =
        envio.codigoPostal || "-";

    document.getElementById("modalEnvioDireccion").textContent =
        envio.direccion || "-";

    document.getElementById("modalEnvioFechaEstimada").textContent =
        formatearFecha(envio.fechaEstimada);

    document.getElementById("modalEnvioFechaEntrega").textContent =
        envio.fechaEntrega
            ? formatearFecha(envio.fechaEntrega)
            : "-";


    /* ---------------------------------------------
       CARGAR ESTADO
    --------------------------------------------- */

    const selectEstado = document.getElementById("estadoEnvioModal");

    if (selectEstado) {
        selectEstado.value = envio.estado;
    }


    /* ---------------------------------------------
       GUARDAR ID ACTUAL
    --------------------------------------------- */

    modal.dataset.idEnvio = idEnvio;


    /* ---------------------------------------------
       MOSTRAR MODAL
    --------------------------------------------- */

    modal.classList.add("activo");

    document.body.style.overflow = "hidden";
}


/* =====================================================
   CERRAR MODAL
===================================================== */

function cerrarModalEnvio() {

    const modal = document.getElementById("modalEnvio");

    if (!modal) {
        return;
    }

    modal.classList.remove("activo");

    document.body.style.overflow = "";
}


/* =====================================================
   EDITAR ENVÍO
===================================================== */

function editarEnvio(idEnvio) {

    abrirModalEnvio(idEnvio);

}


/* =====================================================
   GUARDAR ESTADO DEL ENVÍO
===================================================== */

function guardarEstadoEnvio() {

    const modal = document.getElementById("modalEnvio");

    if (!modal) {
        return;
    }


    const idEnvio = modal.dataset.idEnvio;

    const selectEstado =
        document.getElementById("estadoEnvioModal");


    if (!idEnvio || !selectEstado) {
        return;
    }


    const nuevoEstado = selectEstado.value;


    /* ---------------------------------------------
       ACTUALIZAR DATOS DE EJEMPLO
       Más adelante esto será una petición fetch()
       hacia Node.js
    --------------------------------------------- */

    envios[idEnvio].estado = nuevoEstado;


    /* ---------------------------------------------
       Si se marca como ENTREGADO,
       registramos la fecha actual.
    --------------------------------------------- */

    if (nuevoEstado === "ENTREGADO") {

        const hoy = new Date();

        envios[idEnvio].fechaEntrega =
            convertirFechaSQL(hoy);

    }


    /* ---------------------------------------------
       Si vuelve a EN_CAMINO,
       quitamos la fecha de entrega.
    --------------------------------------------- */

    if (nuevoEstado === "EN_CAMINO") {

        envios[idEnvio].fechaEntrega = null;

    }


    console.log(
        "Envío actualizado:",
        envios[idEnvio]
    );


    actualizarFilaEnvio(idEnvio);


    cerrarModalEnvio();


    /* ---------------------------------------------
       MENSAJE TEMPORAL
    --------------------------------------------- */

    mostrarMensaje(
        "El estado del envío fue actualizado correctamente."
    );
}


/* =====================================================
   ACTUALIZAR FILA DE LA TABLA
===================================================== */

function actualizarFilaEnvio(idEnvio) {

    const envio = envios[idEnvio];

    if (!envio) {
        return;
    }


    const filas =
        document.querySelectorAll(".tabla-envios tbody tr");


    filas.forEach(fila => {

        const boton =
            fila.querySelector(
                `[onclick="abrirModalEnvio(${idEnvio})"]`
            );


        if (!boton) {
            return;
        }


        /* ---------------------------------------------
           COLUMNA ESTADO
        --------------------------------------------- */

        const estado =
            fila.querySelector(".estado-envio");


        if (estado) {

            estado.textContent =
                obtenerNombreEstado(envio.estado);

            estado.className =
                "estado-envio " +
                obtenerClaseEstado(envio.estado);

        }


        /* ---------------------------------------------
           FECHA DE ENTREGA
           La columna correspondiente es la 7.
        --------------------------------------------- */

        const celdas = fila.querySelectorAll("td");

        if (celdas.length >= 7) {

            celdas[6].textContent =
                envio.fechaEntrega
                    ? formatearFecha(envio.fechaEntrega)
                    : "-";

        }

    });

}


/* =====================================================
   CONVERTIR TIPO DE ENTREGA
===================================================== */

function obtenerNombreTipoEntrega(tipo) {

    const tipos = {

        DOMICILIO: "Domicilio",

        SUCURSAL: "Sucursal",

        PROGRAMADO: "Programado"

    };

    return tipos[tipo] || tipo;

}


/* =====================================================
   CONVERTIR ESTADO
===================================================== */

function obtenerNombreEstado(estado) {

    const estados = {

        EN_CAMINO: "En camino",

        ENTREGADO: "Entregado"

    };

    return estados[estado] || estado;

}


/* =====================================================
   CLASE CSS DEL ESTADO
===================================================== */

function obtenerClaseEstado(estado) {

    const clases = {

        EN_CAMINO: "en-camino",

        ENTREGADO: "entregado"

    };

    return clases[estado] || "";

}


/* =====================================================
   FORMATEAR FECHA
===================================================== */

function formatearFecha(fecha) {

    if (!fecha) {
        return "-";
    }


    const partes = fecha.split("-");

    if (partes.length === 3) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }


    return fecha;

}


/* =====================================================
   CONVERTIR DATE DE JAVASCRIPT A YYYY-MM-DD
===================================================== */

function convertirFechaSQL(fecha) {

    const año = fecha.getFullYear();

    const mes = String(
        fecha.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        fecha.getDate()
    ).padStart(2, "0");


    return `${año}-${mes}-${dia}`;

}


/* =====================================================
   CERRAR MODAL AL HACER CLICK FUERA
===================================================== */

document.addEventListener("click", function (event) {

    const modal =
        document.getElementById("modalEnvio");


    if (!modal) {
        return;
    }


    if (event.target === modal) {

        cerrarModalEnvio();

    }

});


/* =====================================================
   CERRAR MODAL CON ESC
===================================================== */

document.addEventListener("keydown", function (event) {

    if (event.key !== "Escape") {
        return;
    }


    const modal =
        document.getElementById("modalEnvio");


    if (
        modal &&
        modal.classList.contains("activo")
    ) {

        cerrarModalEnvio();

    }

});


/* =====================================================
   BÚSQUEDA DE ENVÍOS
===================================================== */

document.addEventListener("input", function (event) {

    if (event.target.id !== "buscarEnvio") {
        return;
    }


    const texto =
        event.target.value
            .toLowerCase()
            .trim();


    const filas =
        document.querySelectorAll(
            "#tablaEnvios tr"
        );


    filas.forEach(fila => {

        const contenido =
            fila.textContent.toLowerCase();


        fila.style.display =
            contenido.includes(texto)
                ? ""
                : "none";

    });

});


/* =====================================================
   FILTRO POR TIPO DE ENTREGA
===================================================== */

document.addEventListener("change", function (event) {

    if (event.target.id !== "filtroTipoEntrega") {
        return;
    }


    aplicarFiltrosEnvios();

});


/* =====================================================
   FILTRO POR ESTADO
===================================================== */

document.addEventListener("change", function (event) {

    if (event.target.id !== "filtroEstadoEnvio") {
        return;
    }


    aplicarFiltrosEnvios();

});


/* =====================================================
   APLICAR FILTROS
===================================================== */

function aplicarFiltrosEnvios() {

    const filtroTipo =
        document.getElementById(
            "filtroTipoEntrega"
        )?.value || "";


    const filtroEstado =
        document.getElementById(
            "filtroEstadoEnvio"
        )?.value || "";


    const buscador =
        document.getElementById(
            "buscarEnvio"
        );


    const textoBusqueda =
        buscador
            ? buscador.value.toLowerCase().trim()
            : "";


    const filas =
        document.querySelectorAll(
            "#tablaEnvios tr"
        );


    filas.forEach(fila => {

        const contenido =
            fila.textContent.toLowerCase();


        const idEnvio =
            fila.querySelector("td")?.textContent
                .replace("#", "")
                .trim();


        const envio =
            envios[idEnvio];


        if (!envio) {
            return;
        }


        const coincideBusqueda =
            contenido.includes(textoBusqueda);


        const coincideTipo =
            !filtroTipo ||
            envio.tipoEntrega === filtroTipo;


        const coincideEstado =
            !filtroEstado ||
            envio.estado === filtroEstado;


        fila.style.display =
            coincideBusqueda &&
                coincideTipo &&
                coincideEstado
                ? ""
                : "none";

    });

}


/* =====================================================
   MENSAJE DE CONFIRMACIÓN
===================================================== */

function mostrarMensaje(mensaje) {

    const mensajeExistente =
        document.querySelector(
            ".mensaje-envio"
        );


    if (mensajeExistente) {
        mensajeExistente.remove();
    }


    const elemento =
        document.createElement("div");


    elemento.className =
        "mensaje-envio";


    elemento.textContent =
        mensaje;


    document.body.appendChild(elemento);


    setTimeout(() => {

        elemento.classList.add("visible");

    }, 10);


    setTimeout(() => {

        elemento.classList.remove("visible");

        setTimeout(() => {

            elemento.remove();

        }, 300);

    }, 2500);

}