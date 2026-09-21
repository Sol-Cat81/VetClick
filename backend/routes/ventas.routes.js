const express = require('express');
const controller = require('../controllers/ventas.controller');
const router = express.Router();
router.get('/pedidos', controller.pedidos);
router.get('/pagos', controller.pagos);
router.get('/envios', controller.envios);
module.exports = router;
