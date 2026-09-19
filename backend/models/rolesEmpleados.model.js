// Pool compartido para ejecutar consultas sin abrir una conexión manual cada vez.
const conexion = require('../config/database');

const RolesEmpleadosModel ={
    // Devuelve el catálogo de roles asignables a empleados.
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