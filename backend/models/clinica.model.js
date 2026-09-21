const conexion = require('../config/database');
const ClinicaModel = {
  obtenerTurnos: async () => {
    const [rows] = await conexion.query(`
      SELECT t.id_turno, t.fecha, t.hora, m.nombre AS mascota,
             s.nombre AS servicio, su.nombre AS sucursal, t.estado
      FROM turnos t JOIN mascota m ON m.id_mascota = t.id_mascota
      JOIN servicios s ON s.id_servicio = t.id_servicio
      LEFT JOIN sucursales su ON su.id_sucursal = t.id_sucursal
      ORDER BY t.fecha, t.hora`);
    return rows;
  },
  obtenerHistorial: async () => {
    const [rows] = await conexion.query(`
      SELECT h.id_historial, h.fecha, m.nombre AS paciente,
             CONCAT(e.nombre, ' ', e.apellido) AS veterinario,
             h.motivo, h.diagnostico, h.observacion
      FROM historial_medico h JOIN mascota m ON m.id_mascota = h.id_mascota
      JOIN veterinarios v ON v.id_veterinario = h.id_veterinario
      JOIN empleados e ON e.id_empleado = v.id_empleado
      ORDER BY h.fecha DESC, h.id_historial DESC`);
    return rows;
  },
  obtenerTratamientos: async () => {
    const [rows] = await conexion.query(
      'SELECT id_tratamiento, id_historial, medicamento, dosis, frecuencia, duracion FROM tratamientos ORDER BY id_tratamiento'
    );
    return rows;
  },
  obtenerVacunas: async () => {
    const [rows] = await conexion.query(`
      SELECT v.id_vacuna, m.nombre AS paciente, v.nombre,
             v.fecha_aplicacion, v.fecha_proxima,
             CONCAT(e.nombre, ' ', e.apellido) AS veterinario
      FROM vacunas v JOIN mascota m ON m.id_mascota = v.id_mascota
      LEFT JOIN veterinarios vet ON vet.id_veterinario = v.id_veterinario
      LEFT JOIN empleados e ON e.id_empleado = vet.id_empleado
      ORDER BY v.id_vacuna`);
    return rows;
  }
};
module.exports = ClinicaModel;
