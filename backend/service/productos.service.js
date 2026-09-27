const { Carrito } = require('./../models/productos.model')

async function traerCarrito(idUsuario) {
    const carrito = await Carrito.traer(idUsuario)

    if(carrito.length === 0){
        throw new Error('No hay items en el carrito')
    }
    return carrito
}

async function eliminarItem(idVariante){
    const eliminar = await Carrito.eliminar(idVariante)
    return eliminar
}

async function agregarItem(datos) {
    const idUsuario = datos.id;
    const idVariante = datos.variante
    const cantidad = datos.cantidad
    const agregar = await Carrito.agregar(idUsuario, idVariante, cantidad);
    if(!agregar){
        throw new Error('No se pudo agregar el item')
    }
    return agregar
}

module.exports = { traerCarrito, eliminarItem, agregarItem}