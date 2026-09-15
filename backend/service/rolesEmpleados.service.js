const RolesEmpleadosModel = require('../models/rolesEmpleados.model');
const { listarEmpleados } = require('./empleados.service');

const RolesEmpleadoService ={
    listarRolesEmpleados: async (req , res)=>{
        try{
            const rol_empleados = await RolesEmpleadosModel.obtnerTodos();
            res.json(rol_empleados);
        }catch(error){
            res.status(500).json({error});
        }
    }
};

module.exports = RolesEmpleadoService;