const ClinicaModel = require('../models/clinica.model');
module.exports = {
  listarTurnos: () => ClinicaModel.obtenerTurnos(),
  listarHistorial: () => ClinicaModel.obtenerHistorial(),
  listarTratamientos: () => ClinicaModel.obtenerTratamientos(),
  listarVacunas: () => ClinicaModel.obtenerVacunas(),
  listarServicios: () => ClinicaModel.obtenerServicios(),
  listarCategoriasServicio: () => ClinicaModel.obtenerCategoriasServicio()
};
