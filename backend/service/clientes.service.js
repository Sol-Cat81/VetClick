const ClientesModel = require('../models/clientes.model');

module.exports = {
  listarClientes: () => ClientesModel.obtenerClientes(),
  listarMascotas: () => ClientesModel.obtenerMascotas(),
  listarDirecciones: () => ClientesModel.obtenerDirecciones(),
  listarEspecies: () => ClientesModel.obtenerEspecies(),
  listarRazas: () => ClientesModel.obtenerRazas(),
  listarMascotasAdopcion: () => ClientesModel.obtenerMascotasAdopcion(),
  listarAdopciones: () => ClientesModel.obtenerAdopciones(),

  crearCliente: (data) => ClientesModel.crearCliente(data),
  crearMascotas: (data) => ClientesModel.crearMascotas(data),
};
