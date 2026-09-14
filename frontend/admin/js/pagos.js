/* =========================================
   DATOS DE PRUEBA
========================================= */

const pagos = {

    1: {

        idPago: "#0001",

        idPedido: "#0001",

        cliente: "Martín Rodríguez",

        fecha: "09/09/2026",

        total: "$27.000",

        subtotal: "$25.000",

        envio: "$2.000",

        estado: "REALIZADO"

    },


    2: {

        idPago: "#0002",

        idPedido: "#0002",

        cliente: "Laura Gómez",

        fecha: "09/09/2026",

        total: "$18.500",

        subtotal: "$18.500",

        envio: "$0",

        estado: "PENDIENTE"

    },


    3: {

        idPago: "#0003",

        idPedido: "#0003",

        cliente: "Juan Pérez",

        fecha: "08/09/2026",

        total: "$34.500",

        subtotal: "$32.000",

        envio: "$2.500",

        estado: "REALIZADO"

    }

};



/* =========================================
   ABRIR MODAL
========================================= */

function abrirModalPago(idPago) {

    const pago = pagos[idPago];


    if (!pago) {

        console.error("Pago no encontrado");

        return;

    }


    document.getElementById("modalIdPago").textContent =
        pago.idPago;


    document.getElementById("modalIdPedido").textContent =
        pago.idPedido;


    document.getElementById("modalCliente").textContent =
        pago.cliente;


    document.getElementById("modalFecha").textContent =
        pago.fecha;


    document.getElementById("modalTotal").textContent =
        pago.total;


    document.getElementById("modalEstadoPago").value =
        pago.estado;


    const modal =
        document.getElementById("modalPago");


    modal.dataset.idPago = idPago;


    modal.classList.add("activo");

}



/* =========================================
   CERRAR MODAL
========================================= */

function cerrarModalPago() {

    document
        .getElementById("modalPago")
        .classList
        .remove("activo");

}



/* =========================================
   GUARDAR ESTADO
========================================= */

function guardarEstadoPago() {

    const modal =
        document.getElementById("modalPago");


    const idPago =
        modal.dataset.idPago;


    const nuevoEstado =
        document.getElementById("modalEstadoPago").value;


    /*
        Por ahora modificamos
        solamente el objeto JavaScript.
    */

    pagos[idPago].estado = nuevoEstado;


    console.log(
        "ID pago:",
        idPago
    );


    console.log(
        "Nuevo estado:",
        nuevoEstado
    );


    alert(
        "Estado del pago actualizado a: " +
        nuevoEstado
    );


    cerrarModalPago();

}



/* =========================================
   BOTÓN EDITAR
========================================= */

function editarPago(idPago) {

    abrirModalPago(idPago);

}



/* =========================================
   CERRAR AL HACER CLICK
   FUERA DEL MODAL
========================================= */

document.addEventListener("click", function (event) {

    const modal = document.getElementById("modalPago");

    if (modal && event.target === modal) {
        cerrarModalPago();
    }
});