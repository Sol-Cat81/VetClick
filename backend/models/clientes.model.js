// El modelo usa el pool compartido para consultar MySQL.
const conexion = require('../config/database');

const ClienteModel = {
    // Obtiene los campos públicos que necesita la tabla de clientes.
    obtnerTodos: async()=>{
        const query = `
        SELECT cli.id_cliente , cli.nombre , cli.apellido , cli.telefono , cli.estado 
        FROM clientes cli;
        `;
        const [clientes] = await conexion.query(query);
        return clientes;
    }
};

module.exports = ClienteModel;