const express = require('express');
const controller = require('../controllers/catalogo.controller');
const router = express.Router();
router.get('/productos', controller.productos);
router.get('/categorias', controller.categorias);
router.get('/marcas', controller.marcas);
router.get('/variantes', controller.variantes);
module.exports = router;
