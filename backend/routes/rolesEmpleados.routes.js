// Router para el catálogo de roles de empleados.
const express = require('express');
const router = express.Router();
const RolesEmpleadoService = require('../service/rolesEmpleados.service');

// GET /api/rol_empleados devuelve todos los roles.
router.get('/',RolesEmpleadoService.listarRolesEmpleados);

module.exports = router;