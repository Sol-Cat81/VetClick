const service = require('../service/personal.service');
const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) { console.error('Error al listar personal:', error); res.status(500).json({ mensaje: 'No se pudo cargar personal y seguridad' }); }
};
module.exports = {
  empleados: responder(service.listarEmpleados),
  veterinarios: responder(service.listarVeterinarios),
  usuarios: responder(service.listarUsuarios),
  roles: responder(service.listarRoles),
  permisos: responder(service.listarPermisos)
};
