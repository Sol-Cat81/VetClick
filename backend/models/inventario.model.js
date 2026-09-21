const conexion = require('../config/database');
module.exports = {
  stock: async () => {
    const [rows] = await conexion.query(`SELECT i.id_inventario,CONCAT(p.nombre,' · ',COALESCE(va.nombre,'')) AS producto,s.nombre AS sucursal,i.stock_actual,i.stock_minimo,CASE WHEN i.stock_actual<=i.stock_minimo THEN 'Bajo' ELSE 'Óptimo' END AS estado FROM inventario i JOIN variantes v ON v.id_variante=i.id_variante JOIN productos p ON p.id_producto=v.id_producto LEFT JOIN variantes_atributos vap ON vap.id_variante=v.id_variante LEFT JOIN valores_atributo va ON va.id_valor=vap.id_valor_atributo JOIN sucursales s ON s.id_sucursal=i.id_sucursal ORDER BY i.id_inventario`);
    return rows;
  },
  sucursales: async () => {
    const [rows] = await conexion.query('SELECT id_sucursal,nombre,direccion,localidad,horario,activo FROM sucursales ORDER BY id_sucursal');
    return rows;
  }
};
