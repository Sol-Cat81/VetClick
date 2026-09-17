const conexion = require ('../config/database');

const MascotasModel = {
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
        JOIN razas ra ON ra.id_especie = es.id_especie;
        `;
        const [mascotas] = await conexion.query(query);
        return mascotas;
    }
}
module.exports = MascotasModel;