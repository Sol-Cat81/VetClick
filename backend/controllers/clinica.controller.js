const service = require('../service/clinica.service');
const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) {
    console.error('Error al listar datos clínicos:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener los registros clínicos' });
  }
};
module.exports = {
  turnos: responder(service.listarTurnos),
  historial: responder(service.listarHistorial),
  tratamientos: responder(service.listarTratamientos),
  vacunas: responder(service.listarVacunas)
};
