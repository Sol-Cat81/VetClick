const UsuarioModel = require ('../models/usuarios.model');

const UsuarioService = {
    listarUsuarios: async (req , res)=>{
        try{
            const usuarios = await UsuarioModel.obtnerTodos();
            res.json(usuarios);
        } catch (error){
            res.status(500).json({error});
        }
    }
};

module.exports = UsuarioService;