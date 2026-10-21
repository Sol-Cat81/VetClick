const ClinicaModel = require('../models/clinica.model');
const { parsearHorario } = require('../config/horarios');

const errorValidacion = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

// Arma la lista de horarios del dia, en intervalos de 30 minutos dentro de la
// franja de atencion de la sucursal.
const horariosDeLaFranja = (franja, diaSemana) => {
  // El rango de dias puede dar la vuelta ("Mar a Dom" va del martes al
  // domingo, que es 0), asi que la comparacion no es un simple "entre".
  const atiende = diaSemana >= franja.desde
    ? diaSemana <= franja.hasta
    : diaSemana <= franja.hasta || diaSemana >= franja.desde;
  if (!atiende) return [];

  const horarios = [];
  for (let minuto = franja.inicio; minuto < franja.fin; minuto += 30) {
    const hora = String(Math.floor(minuto / 60)).padStart(2, "0");
    const resto = String(minuto % 60).padStart(2, "0");
    horarios.push(`${hora}:${resto}`);
  }
  return horarios;
};

module.exports = {
  listarTurnos: () => ClinicaModel.obtenerTurnos(),
  listarHistorial: () => ClinicaModel.obtenerHistorial(),
  listarTratamientos: () => ClinicaModel.obtenerTratamientos(),
  listarVacunas: () => ClinicaModel.obtenerVacunas(),
  listarServicios: () => ClinicaModel.obtenerServicios(),
  listarCategoriasServicio: () => ClinicaModel.obtenerCategoriasServicio(),

  // Los horarios que el cliente puede elegir para una fecha: los que la
  // sucursal atiende ese dia, menos los que ya tienen un turno.
  listarHorariosDisponibles: async (fecha, idSucursal, idVeterinario) => {
    const sucursal = await ClinicaModel.obtenerSucursal(idSucursal);
    if (!sucursal) throw errorValidacion('La sucursal no existe', 404);

    const franja = parsearHorario(sucursal.horario);
    if (!franja) {
      // El horario de la sucursal esta mal escrito: no se inventa una agenda.
      return { horarios: [], sucursal: sucursal.nombre };
    }

    const diaSemana = new Date(`${fecha}T12:00:00`).getDay();
    const posibles = horariosDeLaFranja(franja, diaSemana);

    const ocupados = await ClinicaModel.horariosOcupados(
      fecha,
      idSucursal,
      idVeterinario,
    );

    return {
      horarios: posibles.filter((hora) => !ocupados.includes(hora)),
      sucursal: sucursal.nombre,
    };
  },

  // Agenda un turno. El cliente sale del token (nunca del body): el turno se
  // guarda a nombre de quien esta logueado.
  crearTurno: async (idUsuario, datos) => {
    const idCliente = await ClinicaModel.obtenerClientePorUsuario(idUsuario);
    if (!idCliente) {
      throw errorValidacion('Completa tu perfil de cliente para reservar un turno');
    }

    const idMascota = Number(datos.id_mascota);
    const idServicio = Number(datos.id_servicio);
    const idSucursal = Number(datos.id_sucursal);
    const idVeterinario = Number(datos.id_veterinario);

    if (![idMascota, idServicio, idSucursal, idVeterinario].every((id) => Number.isInteger(id) && id > 0)) {
      throw errorValidacion('Falta completar some de los datos del turno');
    }

    // La mascota tiene que ser del cliente: no se agenda para la de otro.
    const mascota = await ClinicaModel.obtenerMascotaParaTurno(idMascota);
    if (!mascota) throw errorValidacion('La mascota no existe', 404);
    if (Number(mascota.id_cliente) !== Number(idCliente.id_cliente)) {
      throw errorValidacion('Esa mascota no es tuya');
    }

    const servicio = await ClinicaModel.obtenerServicio(idServicio);
    if (!servicio || !servicio.activo) {
      throw errorValidacion('El servicio no es valido');
    }

    const sucursal = await ClinicaModel.obtenerSucursal(idSucursal);
    if (!sucursal) throw errorValidacion('La sucursal no es valida');

    const veterinario = await ClinicaModel.obtenerVeterinarioParaTurno(idVeterinario);
    if (!veterinario) throw errorValidacion('El profesional no es valido');
    // Cada profesional atiende en una sola sucursal: no se puede reservar en
    // una sucursal con alguien que trabaja en otra.
    if (Number(veterinario.id_sucursal) !== idSucursal) {
      throw errorValidacion('Ese profesional no atiende en la sucursal elegida');
    }

    const fecha = String(datos.fecha || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw errorValidacion('La fecha no es valida');
    }
    // La fecha se compara en UTC para que el dia no cambie por la zona horaria.
    const hoy = new Date().toISOString().slice(0, 10);
    if (fecha < hoy) {
      throw errorValidacion('No se puede reservar en una fecha pasada');
    }

    const hora = String(datos.hora || '');
    if (!/^\d{2}:\d{2}$/.test(hora)) {
      throw errorValidacion('La hora no es valida');
    }

    // El motivo es lo que le sirve al panel para preparar la consulta: sin el
    // el turno no dice nada.
    const motivo = String(datos.motivo || '').trim();
    if (!motivo) {
      throw errorValidacion('Contanos el motivo de la consulta');
    }
    if (motivo.length > 65535) {
      throw errorValidacion('El motivo es demasiado largo');
    }

    // El horario se revalida: entre que el cliente lo elige y confirma, otro
    // puede tomarlo.
    if (await ClinicaModel.horarioOcupado(fecha, hora, idSucursal, idVeterinario)) {
      throw errorValidacion('Ese horario ya no esta disponible');
    }

    const resultado = await ClinicaModel.crearTurno({
      id_cliente: idCliente.id_cliente,
      id_mascota: idMascota,
      id_servicio: idServicio,
      id_sucursal: idSucursal,
      id_veterinario: idVeterinario,
      fecha,
      hora,
      motivo
    });

    return {
      id_turno: resultado.insertId,
      fecha,
      hora,
      estado: 'PENDIENTE',
      mascota: mascota.nombre,
      especie: mascota.especie,
      servicio: servicio.nombre,
      sucursal: sucursal.nombre,
      veterinario: veterinario.veterinario
    };
  },
};
