const express = require('express');
const router = express.Router();
const { solicitarProductosDestacados, solicitarCategorias } = require('./../controllers/produtos.controller')

router.get('/destacados', solicitarProductosDestacados)
router.get('/categorias', solicitarCategorias)

module.exports = router;