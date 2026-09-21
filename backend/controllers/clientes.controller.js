const service = require('../service/clientes.service');
const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) {
    console.error('Error al listar datos de clientes:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener los registros' });
  }
};
module.exports = {
  clientes: responder(service.listarClientes),
  mascotas: responder(service.listarMascotas),
  direcciones: responder(service.listarDirecciones)
};
