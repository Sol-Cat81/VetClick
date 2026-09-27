const express = require('express');
const router = express.Router();
const { solicitarProductosDestacados, solicitarCategorias } = require('./../controllers/produtos.controller')
const {solicitarCarrito, agregarCarrito, eliminarItemCarrito, realizarCompra} = require('./../controllers/carrito.controller')
const { authMiddleware } = require('./../middlewares/auth')

router.get('/destacados', solicitarProductosDestacados)
router.get('/categorias', solicitarCategorias)

router.get('/carrito', authMiddleware, solicitarCarrito)
router.post('/carrito/agregar', authMiddleware, agregarCarrito)
router.delete('/carrito/eliminar', authMiddleware, eliminarItemCarrito)
router.post('/carrito/checkout', authMiddleware, realizarCompra)

module.exports = router;