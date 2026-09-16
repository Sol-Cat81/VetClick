const conexion = require('../config/database');
const { obtnerTodos } = require('./empleados.model');

const UsuarioModel ={
    obtnerTodos: async ()=>{
        const query =`
    SELECT u.id_usuario , u.username , u.email , u.activo, ru.nombre 
	FROM usuarios u 
	JOIN rol_usuario ru ON u.id_rol_usuario = ru.id_rol_usuario;
    `;
    const [usuarios] = await conexion.query(query);
    return usuarios;
    }
};

module.exports = UsuarioModel;