const conexion = require('../config/database');
module.exports = {
  pedidos: async () => {
    const [rows] = await conexion.query(`SELECT p.id_pedido,CONCAT(c.nombre,' ',c.apellido) AS cliente,p.fecha,p.estado,p.subtotal,p.costo_envio,p.total FROM pedidos p LEFT JOIN clientes c ON c.id_cliente=p.id_cliente ORDER BY p.id_pedido`);
    return rows;
  },
  pagos: async () => {
    const [rows] = await conexion.query('SELECT id_pago,id_pedido,metodo_pago,estado_pago FROM pagos ORDER BY id_pago');
    return rows;
  },
  envios: async () => {
    const [rows] = await conexion.query('SELECT id_envio,id_pedido,tipo_entrega,codigo_postal,fecha_estimada,estado FROM envios ORDER BY id_envio');
    return rows;
  }
};
