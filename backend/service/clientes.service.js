const ClientesModel = require('../models/clientes.model');

module.exports = {
  listarClientes: () => ClientesModel.obtenerClientes(),
  listarMascotas: () => ClientesModel.obtenerMascotas(),
  listarDirecciones: () => ClientesModel.obtenerDirecciones()
};
