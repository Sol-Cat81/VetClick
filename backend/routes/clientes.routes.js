const express = require('express');
const controller = require('../controllers/clientes.controller');

const router = express.Router();

router.get('/', controller.clientes);
router.post('/', controller.crearCliente);

router.get('/mascotas', controller.mascotas);
router.post('/mascotas', controller.crearMascotas);

router.get('/direcciones', controller.direcciones);
router.get('/especies', controller.especies);
router.get('/razas', controller.razas);
router.get('/mascotas-adopcion', controller.mascotasAdopcion);
router.get('/adopciones', controller.adopciones);

module.exports = router;
