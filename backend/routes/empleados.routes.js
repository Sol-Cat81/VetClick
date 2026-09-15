const express = require ('express');
const router = express.Router();
const EmpleadoService = require('../service/empleados.service');

router.get('/',EmpleadoService.listarEmpleados);

module.exports = router;