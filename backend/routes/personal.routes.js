const express = require('express');
const controller = require('../controllers/personal.controller');
const router = express.Router();
router.get('/empleados', controller.empleados);
router.get('/veterinarios', controller.veterinarios);
router.get('/usuarios', controller.usuarios);
router.get('/roles', controller.roles);
router.get('/permisos', controller.permisos);
module.exports = router;
