const express = require('express');
const router = express.Router();
const { solicitarCarrito, agregarCarrito, eliminarItem, realizarCompra } = require('./../controllers/produtos.controller')
const { verificarToken } = require('./../middlewares/auth')

router.get('/carrito', verificarToken, solicitarCarrito)
router.post('/agregar', verificarToken, agregarCarrito)
router.delete('/eliminar', verificarToken, eliminarItem)
router.post('/carrito/checkout', verificarToken, realizarCompra)

module.exports = router;