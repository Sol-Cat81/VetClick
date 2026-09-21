const service = require('../service/inventario.service');
const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) { console.error('Error al listar inventario:', error); res.status(500).json({ mensaje: 'No se pudo cargar el inventario' }); }
};
module.exports = { stock: responder(service.listarStock), sucursales: responder(service.listarSucursales) };
