const express = require('express');
const controller = require('../controllers/clinica.controller');
const router = express.Router();
router.get('/turnos', controller.turnos);
router.get('/historial', controller.historial);
router.get('/tratamientos', controller.tratamientos);
router.get('/vacunas', controller.vacunas);
module.exports = router;
