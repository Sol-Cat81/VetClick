// El controlador recibe HTTP y aplica las reglas de login/registro.
const { traerCarrito, eliminarItem, agregarItem, cambiarCantidad, cantidadCargada, crearPedido } = require('./../service/productos.service')
const { traerInfoCliente, traerDireccion } = require('./../service/usuarios.service')

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
// Confirma la compra: exige cliente registrado y dirección propia si el envío
// es a domicilio; el modelo registra todo en una sola transacción.
const realizarCompra = async(req, res) =>{
    try {
        const cliente = await traerInfoCliente(req.usuario.id)
        if (!cliente) {
            return res.status(404).json({mensaje: 'Completá tu registro en Mi cuenta para poder comprar'})
        }

        const tipoEntrega = String(req.body.tipo_entrega || '').toUpperCase()
        const idDireccion = Number(req.body.id_direccion)
        if (tipoEntrega === 'DOMICILIO' && Number.isInteger(idDireccion) && idDireccion > 0) {
            // Solo se comprueba que la dirección sea del cliente: si el id no
            // viene, el service devuelve el 400 con el mensaje de validación.
            const direccion = await traerDireccion(idDireccion, cliente.id_cliente)
            if (!direccion) {
                return res.status(404).json({mensaje: 'La dirección de entrega no es válida'})
            }
        }

        const pedido = await crearPedido(req.usuario.id, req.body)
        return res.status(201).json({mensaje: 'Compra registrada con éxito!', pedido})
    } catch (error) {
        const mensaje = error.message || 'No se pudo registrar la compra'
        if (mensaje === 'El carrito está vacío' ||
            mensaje === 'El tipo de entrega no es válido' ||
            mensaje === 'La forma de pago no es válida' ||
            mensaje === 'Seleccioná la dirección de entrega' ||
            mensaje === 'El código postal no es válido') {
            return res.status(400).json({mensaje})
        }
        if (mensaje.startsWith('No hay stock suficiente')) {
            return res.status(409).json({mensaje})
        }
        console.error('Error al registrar la compra:', error)
        return res.status(500).json({mensaje: 'No se pudo registrar la compra'})
    }
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