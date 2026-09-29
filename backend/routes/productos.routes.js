const express = require('express');
const router = express.Router();
const { solicitarProductosDestacados, solicitarCategorias } = require('./../controllers/produtos.controller')
const {solicitarCarrito, agregarCarrito, eliminarItemCarrito, actualizarCantidadCarrito, realizarCompra, traerCantidad} = require('./../controllers/carrito.controller')
const { authMiddleware } = require('./../middlewares/auth')

router.get('/destacados', solicitarProductosDestacados)
router.get('/categorias', solicitarCategorias)

router.get('/carrito', authMiddleware, solicitarCarrito)
router.post('/carrito/agregar', authMiddleware, agregarCarrito)
router.delete('/carrito/eliminar', authMiddleware, eliminarItemCarrito)
router.patch('/carrito/cantidad', authMiddleware, actualizarCantidadCarrito)
router.post('/carrito/checkout', authMiddleware, realizarCompra)
router.get('/carrito/cargar', authMiddleware, traerCantidad)

module.exports = router;