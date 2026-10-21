const conexion = require('../config/database');
module.exports = {
  stock: async () => {
    // id_inventario, id_variante e id_sucursal-travel en la respuesta: el panel
    // los usa como data-id de la fila y para prellenar el modal de edicion.
    // COALESCE en el CASE porque un stock_minimo NULL (filas viejas) hace que
    // la comparacion de NULL sea NULL y el estado caiga siempre en "Optimo".
    // CASE en la etiqueta porque id_valor_atributo es opcional: una variante sin
    // presentacion dejaba el separador colgando ("Producto · "). Un TRIM no
    // servia porque quita espacios, no el punto.
    const [rows] = await conexion.query(`SELECT i.id_inventario,i.id_variante,i.id_sucursal,CASE WHEN va.nombre IS NULL OR va.nombre='' THEN p.nombre ELSE CONCAT(p.nombre,' · ',va.nombre) END AS producto,s.nombre AS sucursal,i.stock_actual,i.stock_minimo,CASE WHEN i.stock_actual<=COALESCE(i.stock_minimo,0) THEN 'Bajo' ELSE 'Óptimo' END AS estado FROM inventario i JOIN variantes v ON v.id_variante=i.id_variante JOIN productos p ON p.id_producto=v.id_producto LEFT JOIN valores_atributo va ON va.id_valor=v.id_valor_atributo JOIN sucursales s ON s.id_sucursal=i.id_sucursal ORDER BY i.id_inventario`);
    return rows;
  },
  sucursales: async () => {
    const [rows] = await conexion.query('SELECT id_sucursal,nombre,direccion,localidad,telefono,horario,img_sucursal,activo FROM sucursales ORDER BY id_sucursal');
    return rows;
  }
};
