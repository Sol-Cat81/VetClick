// El controlador recibe HTTP y aplica las reglas de login/registro.
const { traerCarrito, eliminarItem, agregarItem } = require('./../service/productos.service')
const solicitarCarrito = async(req, res) =>{
    try {
        const info = req.usuario.id;
        const carrito = await traerCarrito(info)

        return res.status(200).json(carrito)
    } catch (error) {
        if(error.messaje === 'No hay items en el carrito'){
            return res.status(200).json({mensaje: 'El carrito aun no existe'})
        }
        return res.status(500).json({mensaje: 'No se pudo conectar con el servidor'})
    }
}
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
        return res.status(500).json('error interno')
    }
}
const eliminarItemCarrito = async(req, res) =>{
    try {
        const info = req.body
        const eliminar = await eliminarItem(info)
        return res.status(204).json({mensaje: 'Se ha eliminado correctamente'})
    } catch (error) {
        console.error(error)
        return res.status(500).json({mensaje: 'ERROR interno'})
    }
}
const realizarCompra = async(req, res) =>{
    
}

module.exports = {solicitarCarrito, agregarCarrito, eliminarItemCarrito, realizarCompra}