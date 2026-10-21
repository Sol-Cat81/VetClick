const service = require('../service/clinica.service');
const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) {
    console.error('Error al listar datos clínicos:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener los registros clínicos' });
  }
};
// Los horarios disponibles de una fecha. No usa el responder generico porque
// los parametros vienen de la query y hay que validarlos antes de buscar.
const horariosDisponibles = async (req, res) => {
  const fecha = String(req.query.fecha || '');
  const idSucursal = Number(req.query.id_sucursal);
  const idVeterinario = Number(req.query.id_veterinario) || 0;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ mensaje: 'La fecha no es válida' });
  }
  if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
    return res.status(400).json({ mensaje: 'La sucursal no es válida' });
  }

  try {
    res.json(
      await service.listarHorariosDisponibles(fecha, idSucursal, idVeterinario)
    );
  } catch (error) {
    console.error('Error al obtener los horarios disponibles:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudieron obtener los horarios',
    });
  }
};

// Agenda un turno. Necesita sesion porque el turno se guarda a nombre del
// cliente logueado: el id del cliente sale del token, nunca del body.
const crearTurno = async (req, res) => {
  try {
    const resultado = await service.crearTurno(req.usuario.id, req.body || {});
    res.status(201).json({
      mensaje: 'Turno reservado correctamente',
      ...resultado
    });
  } catch (error) {
    console.error('Error al reservar el turno:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo reservar el turno'
    });
  }
};

module.exports = {
  turnos: responder(service.listarTurnos),
  historial: responder(service.listarHistorial),
  tratamientos: responder(service.listarTratamientos),
  vacunas: responder(service.listarVacunas),
  servicios: responder(service.listarServicios),
  categoriasServicio: responder(service.listarCategoriasServicio),
  horariosDisponibles,
  crearTurno
};
