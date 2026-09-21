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
  }
};

module.exports = ClientesModel;
