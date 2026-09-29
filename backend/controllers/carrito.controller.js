// El controlador recibe HTTP y aplica las reglas de login/registro.
const { traerCarrito, eliminarItem, agregarItem, cambiarCantidad, cantidadCargada } = require('./../service/productos.service')

// Devuelve los artículos del usuario autenticado, o una lista vacía.
const solicitarCarrito = async(req, res) =>{
    try {
        const info = req.usuario.id;
        const carrito = await traerCarrito(info)

        return res.status(200).json(carrito)
    } catch (error) {
        return res.status(500).json({mensaje: 'No se pudo conectar con el servidor'})
    }
}

// Agrega al carrito la variante y cantidad enviadas por el cliente.
const agregarCarrito = async(req, res) =>{
    try {
        const info = {
            id: req.usuario.id,
            variante: req.body.variante,
            cantidad: req.body.cantidad
        }
        const agregar = await agregarItem(info);

        return res.status(201).json({mensaje: 'Producto agregado con exito!'})
    } catch (error) {
        console.error(error)
        if (error.message === 'La variante o la cantidad no son válidas' ||
            error.message === 'La variante no existe' || error.message === 'No hay stock suficiente') {
            return res.status(400).json({mensaje: error.message})
        }
        return res.status(500).json('error interno')
    }
}

// Elimina del carrito la variante indicada en el cuerpo de la petición.
const eliminarItemCarrito = async(req, res) =>{
    try {
        const idVariante = Number(req.body.id_variante)
        if (!Number.isInteger(idVariante) || idVariante <= 0) {
            return res.status(400).json({mensaje: 'La variante no es válida'})
        }
        const eliminar = await eliminarItem(req.usuario.id, idVariante)
        if (!eliminar) return res.status(404).json({mensaje: 'El producto ya no está en el carrito'})
        return res.status(204).json({mensaje: 'Se ha eliminado correctamente'})
    } catch (error) {
        console.error(error)
        return res.status(500).json({mensaje: 'ERROR interno'})
    }
}

// Actualiza la cantidad solicitada, sin aceptar valores inválidos ni superar el stock.
const actualizarCantidadCarrito = async(req, res) =>{
    try {
        const idVariante = Number(req.body.id_variante)
        const cantidad = Number(req.body.cantidad)
        if (!Number.isInteger(idVariante) || idVariante <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
            return res.status(400).json({mensaje: 'La variante o la cantidad no son válidas'})
        }
        const actualizado = await cambiarCantidad(req.usuario.id, idVariante, cantidad)
        if (!actualizado) return res.status(400).json({mensaje: 'No hay stock suficiente o el producto ya no está en el carrito'})
        return res.status(200).json({mensaje: 'Cantidad actualizada'})
    } catch (error) {
        console.error(error)
        return res.status(500).json({mensaje: 'ERROR interno'})
    }
}
// Punto de entrada previsto para confirmar una compra; todavía no está implementado.
const realizarCompra = async(req, res) =>{
    
}

const traerCantidad = async(req, res) =>{
    try {
        const cant = await cantidadCargada(req.usuario.id)
        return res.status(200).json({cant})
    } catch (error) {
        console.error(error)
        return res.status(500).json({mensaje: 'Error interno'})
    }
}

module.exports = {solicitarCarrito, agregarCarrito, eliminarItemCarrito, actualizarCantidadCarrito, realizarCompra, traerCantidad}