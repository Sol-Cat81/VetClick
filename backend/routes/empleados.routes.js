// Router dedicado a los endpoints de empleados.
const express = require ('express');
const router = express.Router();
// El service coordina la petición y el modelo.
const EmpleadoService = require('../service/empleados.service');

// GET /api/empleados devuelve empleados con rol y sucursal.
router.get('/',EmpleadoService.listarEmpleados);

module.exports = router;