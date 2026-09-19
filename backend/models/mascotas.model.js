// Importamos el pool de conexiones de la base de datos.
const conexion = require ('../config/database');

const MascotasModel = {
    // Consulta mascotas y resuelve los nombres de sus relaciones.
    obtnerTodos: async()=>{
        const query = `
        SELECT
        m.id_mascota,
        m.nombre AS nombre,
        es.nombre AS especie,
        ra.nombre AS raza ,
        m.sexo ,
        m.fecha_nacimiento,
        m.peso,cli.nombre AS propietario
        FROM mascota m
        JOIN clientes cli ON m.id_cliente = cli.id_cliente
        JOIN especies es ON m.id_especie = es.id_especie 
        JOIN razas ra ON ra.id_raza = m.id_raza;
        `;
        const [mascotas] = await conexion.query(query);
        return mascotas;
    }
}
module.exports = MascotasModel;