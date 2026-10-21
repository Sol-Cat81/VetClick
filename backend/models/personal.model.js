const conexion = require('../config/database');
// Las claves foraneas viajan en la respuesta para que el modal de edicion pueda
// precargar sus campos de relacion (rol, sucursal, usuario, empleado) escribiendo
// la etiqueta en el input y el id en el oculto. `password_hash` jamas se expone.
//
// Los `*_asociados` son conteos de filas hijas. No son un adorno: el panel los
// usa para deshabilitar el boton "Eliminar" en las filas que no se pueden
// borrar, y explicarle el motivo al usuario sin que haga un click de prueba.
module.exports = {
  empleados: async () => {
    const [rows] = await conexion.query(`SELECT e.id_empleado,e.nombre,e.apellido,e.telefono,e.direccion,e.id_rol_empleado,e.id_sucursal,e.id_usuario,r.nombre AS rol,s.nombre AS sucursal,(SELECT COUNT(*) FROM veterinarios v WHERE v.id_empleado=e.id_empleado) AS veterinarios_asociados FROM empleados e JOIN rol_empleados r ON r.id_rol_empleado=e.id_rol_empleado LEFT JOIN sucursales s ON s.id_sucursal=e.id_sucursal ORDER BY e.id_empleado`);
    return rows;
  },
  veterinarios: async () => {
    // LEFT JOIN, no JOIN: al desasociar un empleado la ficha tiene
    // id_empleado NULL y debe seguir apareciendo en la tabla. El nombre
    // concatenado se arma aca porque desde el WHERE no se puede.
    //
    // La sucursal se trae del empleado: cada veterinario atiende en una sola
    // sucursal, y la pagina de turnos filtra los profesionales por la
    // sucursal que el cliente elige.
    const [rows] = await conexion.query(`SELECT v.id_veterinario,CONCAT(e.nombre,' ',e.apellido) AS veterinario,v.especialidad,v.id_empleado,e.id_sucursal,s.nombre AS sucursal,(SELECT COUNT(*) FROM historial_medico h WHERE h.id_veterinario=v.id_veterinario) AS historiales_asociados,(SELECT COUNT(*) FROM vacunas va WHERE va.id_veterinario=v.id_veterinario) AS vacunas_asociadas FROM veterinarios v LEFT JOIN empleados e ON e.id_empleado=v.id_empleado LEFT JOIN sucursales s ON s.id_sucursal=e.id_sucursal ORDER BY v.id_veterinario`);
    return rows;
  },
  usuarios: async () => {
    const [rows] = await conexion.query(`SELECT u.id_usuario,u.username,u.email,u.id_rol_usuario,u.activo,r.nombre,(SELECT COUNT(*) FROM empleados e WHERE e.id_usuario=u.id_usuario) AS empleados_asociados,(SELECT COUNT(*) FROM clientes c WHERE c.id_usuario=u.id_usuario) AS clientes_asociados FROM usuarios u LEFT JOIN rol_usuario r ON r.id_rol_usuario=u.id_rol_usuario ORDER BY u.id_usuario`);
    return rows;
  },
  roles: async () => {
    const [rows] = await conexion.query('SELECT id_rol_empleado,nombre,(SELECT COUNT(*) FROM empleados e WHERE e.id_rol_empleado=rol_empleados.id_rol_empleado) AS empleados_asociados FROM rol_empleados ORDER BY id_rol_empleado');
    return rows;
  },
  rolesUsuario: async () => {
    const [rows] = await conexion.query('SELECT id_rol_usuario,nombre,(SELECT COUNT(*) FROM usuarios u WHERE u.id_rol_usuario=rol_usuario.id_rol_usuario) AS usuarios_asociados FROM rol_usuario ORDER BY id_rol_usuario');
    return rows;
  },
  permisos: async () => {
    const [rows] = await conexion.query('SELECT id_permiso,nombre,descripcion,(SELECT COUNT(*) FROM rol_permiso rp WHERE rp.id_permiso=permisos.id_permiso) AS permisos_asociados FROM permisos ORDER BY id_permiso');
    return rows;
  },
  rolPermisos: async () => {
    const [rows] = await conexion.query(`SELECT rp.id_rol_usuario,rp.id_permiso,r.nombre AS rol,p.nombre AS permiso FROM rol_permiso rp JOIN rol_usuario r ON r.id_rol_usuario=rp.id_rol_usuario JOIN permisos p ON p.id_permiso=rp.id_permiso ORDER BY rp.id_rol_usuario,rp.id_permiso`);
    return rows;
  }
};