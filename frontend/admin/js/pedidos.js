/* =========================================
   DATOS DE EJEMPLO
========================================= */

const pedidos = {

    1: {

        numero: "#0001",

        cliente: "Martín Rodríguez",

        fecha: "09/09/2026",

        estado: "PREPARANDO"

    },


    2: {

        numero: "#0002",

        cliente: "Laura Gómez",

        fecha: "09/09/2026",

        estado: "PENDIENTE"

    },


    3: {

        numero: "#0003",

        cliente: "Juan Pérez",

        fecha: "08/09/2026",

        estado: "ENVIADO"

    }

};



/* =========================================
   ABRIR MODAL
========================================= */

function abrirModalPedido(idPedido) {

    const pedido = pedidos[idPedido];

    if (!pedido) {

        console.error("Pedido no encontrado");

        return;

    }


    document.getElementById("modalNumeroPedido").textContent =
        pedido.numero;


    document.getElementById("modalCliente").textContent =
        pedido.cliente;


    document.getElementById("modalFecha").textContent =
        pedido.fecha;


    document.getElementById("modalEstado").value =
        pedido.estado;


    document
        .getElementById("modalPedido")
        .classList
        .add("activo");


    /*
        Guardamos temporalmente el ID del pedido
        que estamos viendo.
    */

    document
        .getElementById("modalPedido")
        .dataset.idPedido = idPedido;

}



/* =========================================
   CERRAR MODAL
========================================= */

function cerrarModalPedido() {

    document
        .getElementById("modalPedido")
        .classList
        .remove("activo");

}



/* =========================================
   GUARDAR ESTADO
========================================= */

function guardarEstadoPedido() {

    const modal = document.getElementById("modalPedido");

    const idPedido = modal.dataset.idPedido;

    const nuevoEstado =
        document.getElementById("modalEstado").value;


    /*
        Por ahora solamente modificamos
        nuestro objeto JavaScript.
    */

    pedidos[idPedido].estado = nuevoEstado;


    console.log(
        "Pedido:",
        idPedido
    );


    console.log(
        "Nuevo estado:",
        nuevoEstado
    );


    alert(
        "Estado del pedido actualizado a: " +
        nuevoEstado
    );


    cerrarModalPedido();

}