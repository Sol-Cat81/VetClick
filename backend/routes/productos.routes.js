const express = require('express');
const router = express.Router();
const { solicitarProductosDestacados } = require('./../controllers/produtos.controller')

router.get('/destacados', solicitarProductosDestacados)

module.exports = router;