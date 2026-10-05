const express = require('express');
const router = express.Router();

const { 
    solicitarProductosDestacados, 
    solicitarCategorias, 
    traerProductos, 
    buscarProductos, 
    rangoPrecios,
    CategoriasPadre,
    Marcas 
} = require('./../controllers/produtos.controller')

const {
    solicitarCarrito, 
    agregarCarrito, 
    eliminarItemCarrito, 
    actualizarCantidadCarrito, 
    realizarCompra, 
    traerCantidad
} = require('./../controllers/carrito.controller')

const { authMiddleware } = require('./../middlewares/auth')

/* Rutas de productos destacados, categorías y marcas */
router.get('/destacados', solicitarProductosDestacados)
router.get('/categorias', solicitarCategorias)
router.get('/marcas', Marcas)
router.get('/categoriasPadre', CategoriasPadre)

/* Rutas de productos */
router.get('/buscar', buscarProductos)
router.get('/rango-precios', rangoPrecios)
router.get('/', traerProductos)

/* Rutas de carrito */
router.get('/carrito', authMiddleware, solicitarCarrito)
router.post('/carrito/agregar', authMiddleware, agregarCarrito)
router.delete('/carrito/eliminar', authMiddleware, eliminarItemCarrito)
router.patch('/carrito/cantidad', authMiddleware, actualizarCantidadCarrito)
router.post('/carrito/checkout', authMiddleware, realizarCompra)
router.get('/carrito/cargar', authMiddleware, traerCantidad)

module.exports = router;