const express = require('express');
const router = express.Router();
const RolesEmpleadoService = require('../service/rolesEmpleados.service');

router.get('/',RolesEmpleadoService.listarRolesEmpleados);

module.exports = router;