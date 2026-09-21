const model = require('../models/personal.model');
module.exports = { listarEmpleados: model.empleados, listarVeterinarios: model.veterinarios, listarUsuarios: model.usuarios, listarRoles: model.roles, listarPermisos: model.permisos };
