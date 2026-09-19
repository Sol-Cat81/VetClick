// Service que expone el catálogo de roles para empleados.
const RolesEmpleadosModel = require('../models/rolesEmpleados.model');

const RolesEmpleadoService ={
    // Atiende GET /api/rol_empleados.
    listarRolesEmpleados: async (req , res)=>{
        try{
            const rol_empleados = await RolesEmpleadosModel.obtnerTodos();
            res.json(rol_empleados);
        }catch(error){
            console.error('Error al listar roles de empleados:', error);
            res.status(500).json({error});
        }
    }
};

module.exports = RolesEmpleadoService;