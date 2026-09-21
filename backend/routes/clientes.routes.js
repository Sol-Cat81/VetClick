const express = require('express');
const controller = require('../controllers/clientes.controller');

const router = express.Router();

router.get('/', controller.clientes);
router.get('/mascotas', controller.mascotas);
router.get('/direcciones', controller.direcciones);

module.exports = router;
