// Service de empleados: coordina HTTP y acceso a datos.
const EmpleadoModel = require('../models/empleados.model');

const EmpleadoService = {
    // Atiende GET /api/empleados.
    listarEmpleados: async (req, res)=>{
        try {
            const empleados = await EmpleadoModel.obtnerTodos();
            res.json(empleados);
        } catch (error) {
            console.error('Error al listar empleados:', error);
            res.status(500).json({error});
        }
    }
};

module.exports = EmpleadoService;