const EmpleadoModel = require('../models/empleados.model');

const EmpleadoService = {
    listarEmpleados: async (req, res)=>{
        try {
            const empleados = await EmpleadoModel.obtnerTodos();
            res.json(empleados);
        } catch (error) {
            res.status(500).json({error});
        }
    }
};

module.exports = EmpleadoService;