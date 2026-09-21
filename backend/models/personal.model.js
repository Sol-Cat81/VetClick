const conexion = require('../config/database');
module.exports = {
  empleados: async () => {
    const [rows] = await conexion.query(`SELECT e.id_empleado,e.nombre,e.apellido,e.telefono,r.nombre AS rol,s.nombre AS sucursal FROM empleados e JOIN rol_empleados r ON r.id_rol_empleado=e.id_rol_empleado LEFT JOIN sucursales s ON s.id_sucursal=e.id_sucursal ORDER BY e.id_empleado`);
    return rows;
  },
  veterinarios: async () => {
    const [rows] = await conexion.query(`SELECT v.id_veterinario,CONCAT(e.nombre,' ',e.apellido) AS veterinario,v.especialidad,v.id_empleado FROM veterinarios v JOIN empleados e ON e.id_empleado=v.id_empleado ORDER BY v.id_veterinario`);
    return rows;
  },
  usuarios: async () => {
    const [rows] = await conexion.query(`SELECT u.id_usuario,u.username,u.email,r.nombre,u.activo FROM usuarios u LEFT JOIN rol_usuario r ON r.id_rol_usuario=u.id_rol_usuario ORDER BY u.id_usuario`);
    return rows;
  },
  roles: async () => {
    const [rows] = await conexion.query('SELECT id_rol_empleado,nombre FROM rol_empleados ORDER BY id_rol_empleado');
    return rows;
  },
  permisos: async () => {
    const [rows] = await conexion.query('SELECT id_permiso,nombre,descripcion FROM permisos ORDER BY id_permiso');
    return rows;
  }
};
