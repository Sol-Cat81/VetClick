const express = require('express');
const router = express.Router();
const { solicitarProductosDestacados, solicitarCategorias } = require('./../controllers/produtos.controller')
const { verificarToken } = require('./../middlewares/auth')

router.get('/destacados', solicitarProductosDestacados)
router.get('/categorias', solicitarCategorias)

module.exports = router;