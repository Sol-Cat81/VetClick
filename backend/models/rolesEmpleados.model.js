const conexion = require('../config/database');

const RolesEmpleadosModel ={
    obtnerTodos: async()=>{
        const query = `
        SELECT id_rol_empleado, nombre
        FROM rol_empleados;
        `;
        const [rol_empleados] = await conexion.query(query);
        return rol_empleados;
    }
};

module.exports = RolesEmpleadosModel;