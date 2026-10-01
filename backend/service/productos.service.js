const { Carrito } = require('./../models/productos.model')

// Obtiene el contenido; una lista vacía representa un carrito sin artículos.
async function traerCarrito(idUsuario) {
    return Carrito.traer(idUsuario)
}

// Elimina una variante concreta del carrito de un usuario.
async function eliminarItem(idUsuario, idVariante){
    const eliminar = await Carrito.eliminar(idUsuario, idVariante)
    return eliminar
}

// Cambia la cantidad solicitada; el modelo comprueba el stock disponible.
async function cambiarCantidad(idUsuario, idVariante, cantidad){
    return Carrito.actualizarCantidad(idUsuario, idVariante, cantidad)
}

// Valida los datos de alta y delega en el modelo la operación transaccional.
async function agregarItem(datos) {
    const idUsuario = datos.id;
    const idVariante = datos.variante
    const cantidad = datos.cantidad
    if (!Number.isInteger(Number(idVariante)) || Number(idVariante) <= 0 ||
        !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
        throw new Error('La variante o la cantidad no son válidas')
    }
    return Carrito.agregar(idUsuario, Number(idVariante), Number(cantidad))
}

async function cantidadCargada(dato) {
    return Carrito.cantidadCargada(dato)
}

async function traerTodosProductos(params) {
    
}

module.exports = { traerCarrito, eliminarItem, agregarItem, cambiarCantidad, cantidadCargada, traerTodosProductos }