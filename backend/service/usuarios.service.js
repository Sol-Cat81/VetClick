// Service de usuarios: mantiene las rutas libres de consultas SQL.
const UsuarioModel = require ('../models/usuarios.model');

const UsuarioService = {
    // Atiende GET /api/usuarios.
    listarUsuarios: async (req , res)=>{
        try{
            const usuarios = await UsuarioModel.obtnerTodos();
            res.json(usuarios);
        } catch (error){
            console.error('Error al listar usuarios:', error);
            res.status(500).json({error});
        }
    }
};

module.exports = UsuarioService;