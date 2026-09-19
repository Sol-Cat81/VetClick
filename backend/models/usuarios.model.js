// Pool de conexiones utilizado por este modelo.
const conexion = require('../config/database');

const UsuarioModel ={
    // Devuelve información pública del usuario y el nombre de su rol.
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