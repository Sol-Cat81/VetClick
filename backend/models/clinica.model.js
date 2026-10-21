const conexion = require('../config/database');
const ClinicaModel = {
  obtenerTurnos: async () => {
    const [rows] = await conexion.query(`
      SELECT t.id_turno, t.id_cliente, t.id_mascota, t.id_servicio, t.id_sucursal,
             t.id_veterinario, t.fecha, t.hora, m.nombre AS mascota,
             CONCAT(c.nombre, ' ', c.apellido) AS cliente,
             s.nombre AS servicio, su.nombre AS sucursal,
             CONCAT(e.nombre, ' ', e.apellido) AS veterinario,
             t.motivo, t.estado, t.observaciones
      FROM turnos t JOIN mascota m ON m.id_mascota = t.id_mascota
      JOIN servicios s ON s.id_servicio = t.id_servicio
      LEFT JOIN clientes c ON c.id_cliente = t.id_cliente
      LEFT JOIN sucursales su ON su.id_sucursal = t.id_sucursal
      LEFT JOIN veterinarios v ON v.id_veterinario = t.id_veterinario
      LEFT JOIN empleados e ON e.id_empleado = v.id_empleado
      ORDER BY t.fecha, t.hora`);
    return rows;
  },
  obtenerHistorial: async () => {
    const [rows] = await conexion.query(`
      SELECT h.id_historial, h.id_mascota, h.id_veterinario, h.fecha, m.nombre AS paciente,
             CONCAT(e.nombre, ' ', e.apellido) AS veterinario,
             h.motivo, h.diagnostico, h.observacion
      FROM historial_medico h JOIN mascota m ON m.id_mascota = h.id_mascota
      JOIN veterinarios v ON v.id_veterinario = h.id_veterinario
      JOIN empleados e ON e.id_empleado = v.id_empleado
      ORDER BY h.fecha DESC, h.id_historial DESC`);
    return rows;
  },
  obtenerTratamientos: async () => {
    // Los LEFT JOIN mantienen el tratamiento visible aunque su historial o la
    // mascota se borren: antes solo se veia un id_historial suelto.
    const [rows] = await conexion.query(
      `SELECT tr.id_tratamiento, tr.id_historial, m.nombre AS paciente,
              h.fecha AS historial_fecha,
              tr.medicamento, tr.dosis, tr.frecuencia, tr.duracion
       FROM tratamientos tr
       LEFT JOIN historial_medico h ON h.id_historial = tr.id_historial
       LEFT JOIN mascota m ON m.id_mascota = h.id_mascota
       ORDER BY tr.id_tratamiento`
    );
    return rows;
  },
  obtenerVacunas: async () => {
    const [rows] = await conexion.query(`
      SELECT v.id_vacuna, v.id_mascota, v.id_veterinario, m.nombre AS paciente, v.nombre,
             v.fecha_aplicacion, v.fecha_proxima,
             CONCAT(e.nombre, ' ', e.apellido) AS veterinario
      FROM vacunas v JOIN mascota m ON m.id_mascota = v.id_mascota
      LEFT JOIN veterinarios vet ON vet.id_veterinario = v.id_veterinario
      LEFT JOIN empleados e ON e.id_empleado = vet.id_empleado
      ORDER BY v.id_vacuna`);
    return rows;
  },
  obtenerServicios: async () => {
    const [rows] = await conexion.query(`
      SELECT s.id_servicio, s.nombre, s.descripcion, s.id_categoria_servicio,
             c.nombre AS categoria, s.precio, s.activo
      FROM servicios s
      LEFT JOIN categorias_servicios c ON c.id_categoria_servicio = s.id_categoria_servicio
      ORDER BY s.id_servicio`);
    return rows;
  },
  obtenerCategoriasServicio: async () => {
    const [rows] = await conexion.query(
      'SELECT id_categoria_servicio, nombre FROM categorias_servicios ORDER BY id_categoria_servicio'
    );
    return rows;
  },
  // La fila del cliente, a partir del usuario del token. El salto es el mismo
  // que usa la solicitud de adopcion: el token trae id_usuario y la tabla
  // turnos pide id_cliente.
  obtenerClientePorUsuario: async (idUsuario) => {
    const [rows] = await conexion.query(
      'SELECT id_cliente, nombre, apellido, telefono FROM clientes WHERE id_usuario = ?',
      [idUsuario]
    );
    return rows[0] || null;
  },
  // La mascota con su raza y especie. La especie no es una columna de
  // mascota: se deduce de la raza (razas -> especies).
  obtenerMascotaParaTurno: async (idMascota) => {
    const [rows] = await conexion.query(
      `SELECT m.id_mascota, m.id_cliente, m.nombre, m.id_raza,
              ra.nombre AS raza, es.nombre AS especie
       FROM mascota m
       LEFT JOIN razas ra ON ra.id_raza = m.id_raza
       LEFT JOIN especies es ON es.id_especie = ra.id_especie
       WHERE m.id_mascota = ?`,
      [idMascota]
    );
    return rows[0] || null;
  },
  // El servicio tiene que estar activo: uno dado de baja no se agenda.
  obtenerServicio: async (idServicio) => {
    const [rows] = await conexion.query(
      'SELECT id_servicio, nombre, activo FROM servicios WHERE id_servicio = ?',
      [idServicio]
    );
    return rows[0] || null;
  },
  // El profesional, con la sucursal donde atiende. Permite validar que el
  // profesional elegido sea de la sucursal que el cliente eligio.
  obtenerVeterinarioParaTurno: async (idVeterinario) => {
    const [rows] = await conexion.query(
      `SELECT v.id_veterinario, v.id_empleado, e.id_sucursal,
              CONCAT(e.nombre, ' ', e.apellido) AS veterinario
       FROM veterinarios v
       LEFT JOIN empleados e ON e.id_empleado = v.id_empleado
       WHERE v.id_veterinario = ?`,
      [idVeterinario]
    );
    return rows[0] || null;
  },
  // Si el horario sigue libre. Entre que el cliente lo elige y confirma,
  // otro puede tomarlo: por eso se revalida antes de guardar el turno.
  horarioOcupado: async (fecha, hora, idSucursal, idVeterinario) => {
    const [rows] = await conexion.query(
      `SELECT id_turno FROM turnos
       WHERE fecha = ? AND hora = ? AND estado <> 'CANCELADO'
         AND (id_sucursal = ? OR id_veterinario = ?)
       LIMIT 1`,
      [fecha, hora, idSucursal, idVeterinario]
    );
    return rows.length > 0;
  },
  crearTurno: async (turno) => {
    // El estado lo pone el backend: el cliente agenda, no decide como queda.
    const [resultado] = await conexion.query(
      `INSERT INTO turnos (id_cliente, id_mascota, id_servicio, id_sucursal,
                          id_veterinario, fecha, hora, motivo, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
      [
        turno.id_cliente,
        turno.id_mascota,
        turno.id_servicio,
        turno.id_sucursal,
        turno.id_veterinario,
        turno.fecha,
        turno.hora,
        turno.motivo
      ]
    );
    return resultado;
  },
  // La sucursal con su horario de atencion. Es el texto que el panel muestra
  // ("Lun a Sab 09:00 a 20:00") y que el service parsea para saber que dias y
  // que franja atienden.
  obtenerSucursal: async (idSucursal) => {
    const [rows] = await conexion.query(
      'SELECT id_sucursal, nombre, horario FROM sucursales WHERE id_sucursal = ?',
      [idSucursal]
    );
    return rows[0] || null;
  },
  // Los horarios ya tomados para una fecha. Un turno cancelado no ocupa el
  // horario: el cliente lo libera para que otro lo pueda tomar.
  horariosOcupados: async (fecha, idSucursal, idVeterinario) => {
    const [rows] = await conexion.query(
      `SELECT hora FROM turnos
       WHERE fecha = ? AND estado <> 'CANCELADO'
         AND (id_sucursal = ? OR id_veterinario = ?)`,
      [fecha, idSucursal, idVeterinario]
    );
    // MySQL devuelve la hora como "09:00:00": se recorta a "09:00" para
    // compararla con los horarios que arma el service.
    return rows.map((fila) => String(fila.hora).slice(0, 5));
  }
};
module.exports = ClinicaModel;
