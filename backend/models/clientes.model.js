const conexion = require('../config/database');

const ClientesModel = {
  obtenerClientes: async () => {
    const [rows] = await conexion.query(
      'SELECT id_cliente, nombre, apellido, telefono, estado FROM clientes ORDER BY id_cliente'
    );
    return rows;
  },
  obtenerMascotas: async () => {
    const [rows] = await conexion.query(`
      SELECT m.id_mascota, m.nombre, es.nombre AS especie, ra.nombre AS raza,
             m.sexo, m.fecha_nacimiento, m.peso, c.nombre AS propietario
      FROM mascota m
      JOIN clientes c ON c.id_cliente = m.id_cliente
      JOIN especies es ON es.id_especie = m.id_especie
      JOIN razas ra ON ra.id_raza = m.id_raza
      ORDER BY m.id_mascota
    `);
    return rows;
  },
  obtenerDirecciones: async () => {
    const [rows] = await conexion.query(`
      SELECT d.id_direccion, c.nombre, d.tipo_direccion, d.calle,
             d.localidad, d.codigo_postal, d.referencia
      FROM direcciones d
      JOIN clientes c ON c.id_cliente = d.id_cliente
      ORDER BY d.id_direccion
    `);
    return rows;
  },
  crearCliente: async (cliente) => {
    const [resultado] = await conexion.query(`
    INSERT INTO clientes(id_usuario, nombre, apellido, telefono, estado) VALUES (?,?,?,?,?)
    `,
      [
      cliente.id_usuario,
      cliente.nombre,
        cliente.apellido,
        cliente.telefono,
        cliente.estado
      ]
    );

    return resultado;
  },
  crearMascotas: async (mascota) => {
    const [razas] = await conexion.query(
      'SELECT id_especie FROM razas WHERE id_raza = ?',
      [mascota.id_raza]
    );
    if (!razas.length || Number(razas[0].id_especie) !== Number(mascota.id_especie)) {
      const error = new Error('La raza seleccionada no pertenece a la especie elegida');
      error.status = 400;
      throw error;
    }

    const [resultado] = await conexion.query(`
      INSERT INTO mascota (id_cliente, nombre, id_especie, id_raza, sexo, fecha_nacimiento, peso, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        mascota.id_cliente,
        mascota.nombre,
        mascota.id_especie,
        mascota.id_raza,
        mascota.sexo ?? 'MACHO',
        mascota.fecha_nacimiento ?? new Date().toISOString().slice(0, 10),
        Number(mascota.peso ?? 0),
        mascota.observaciones ?? ''
      ]
    );
    return resultado;
  }
};

module.exports = ClientesModel;