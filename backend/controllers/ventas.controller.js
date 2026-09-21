const service = require('../service/ventas.service');
const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) { console.error('Error al listar ventas:', error); res.status(500).json({ mensaje: 'No se pudieron cargar las ventas' }); }
};
module.exports = { pedidos: responder(service.listarPedidos), pagos: responder(service.listarPagos), envios: responder(service.listarEnvios) };
