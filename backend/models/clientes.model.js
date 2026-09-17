const conexion = require('../config/database');

const ClienteModel = {
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