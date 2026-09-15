const conexion = require('../config/database');

const EmpleadoModel = {
    obtnerTodos: async ()=>{
        const query = `
        SELECT e.id_empleado , e.nombre, e.apellido,e.telefono, r.nombre AS rol , s.nombre AS sucursal
        FROM empleados e
        JOIN rol_empleados r ON e.id_rol_empleado = r.id_rol_empleado
        JOIN sucursales s ON e.id_sucursal  = s.id_sucursal
        `;
        const [empleados] = await conexion.query(query);
        return empleados;
    }
};

module.exports = EmpleadoModel;