const model = require('../models/personal.model');
module.exports = { listarEmpleados: model.empleados, listarVeterinarios: model.veterinarios, listarUsuarios: model.usuarios, listarRoles: model.roles, listarRolesUsuario: model.rolesUsuario, listarPermisos: model.permisos, listarRolPermisos: model.rolPermisos };
