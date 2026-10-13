const conexion = require('../config/database');
module.exports = {
  pedidos: async () => {
    // DATE_FORMAT y no p.fecha directo: mysql2 convierte el DATETIME a UTC usando
    // la zona local y lo devuelve como "2026-01-15T13:30:00.000Z". Al cortarlo
    // con slice(0,16) el panel mostraba 13:30 cuando el dato es 10:30. Aqui se
    // devuelve el texto tal como esta guardado, que es lo que espera un
    // <input type="datetime-local">.
    const [rows] = await conexion.query(`SELECT p.id_pedido,CONCAT(c.nombre,' ',c.apellido) AS cliente,DATE_FORMAT(p.fecha,'%Y-%m-%dT%H:%i') AS fecha,p.estado,p.subtotal,p.costo_envio,p.total FROM pedidos p LEFT JOIN clientes c ON c.id_cliente=p.id_cliente ORDER BY p.id_pedido`);
    return rows;
  },
  pagos: async () => {
    const [rows] = await conexion.query('SELECT id_pago,id_pedido,metodo_pago,estado_pago FROM pagos ORDER BY id_pago');
    return rows;
  },
  envios: async () => {
    // id_direccion viaja en la respuesta para que el modal de edicion pueda
    // precargar la direccion. Las fechas van con DATE_FORMAT para no mostrar el
    // ISO crudo con hora.
    const [rows] = await conexion.query(`SELECT id_envio,id_pedido,id_direccion,tipo_entrega,codigo_postal,DATE_FORMAT(fecha_estimada,'%Y-%m-%d') AS fecha_estimada,DATE_FORMAT(fecha_entrega,'%Y-%m-%d') AS fecha_entrega,estado FROM envios ORDER BY id_envio`);
    return rows;
  }
};
