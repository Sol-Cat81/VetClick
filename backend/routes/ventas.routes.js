const express = require('express');
const controller = require('../controllers/ventas.controller');
const router = express.Router();
router.get('/pedidos', controller.pedidos);
// Antes de /pedidos/:id_pedido, si algún día se agrega esa ruta, para que no se
// la coma como un GET de listado.
router.get('/pedidos/:id_pedido/detalle', controller.detallePedido);
router.get('/pagos', controller.pagos);
router.get('/envios', controller.envios);
module.exports = router;
