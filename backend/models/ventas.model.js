const conexion = require('../config/database');
// Los `*_asociados` son conteos de filas hijas: el panel los usa para que el
// modal diga cuanto se va a llevar un pedido. Los `bloqueado_por` son motivos
// literales del backend (pago realizado, envio entregado): el frontend solo los
// muestra, no decide. La regla vive en `borrados`, no en el listado.
module.exports = {
  pedidos: async () => {
    // DATE_FORMAT y no p.fecha directo: mysql2 convierte el DATETIME a UTC usando
    // la zona local y lo devuelve como "2026-01-15T13:30:00.000Z". Al cortarlo
    // con slice(0,16) el panel mostraba 13:30 cuando el dato es 10:30. Aqui se
    // devuelve el texto tal como esta guardado, que es lo que espera un
    // <input type="datetime-local">.
    const [rows] = await conexion.query(`SELECT p.id_pedido,CONCAT(c.nombre,' ',c.apellido) AS cliente,DATE_FORMAT(p.fecha,'%Y-%m-%dT%H:%i') AS fecha,p.estado,p.subtotal,p.costo_envio,p.total,(SELECT COUNT(*) FROM pagos pa WHERE pa.id_pedido=p.id_pedido) AS pagos_asociados,(SELECT COUNT(*) FROM envios e WHERE e.id_pedido=p.id_pedido) AS envios_asociados,(SELECT COUNT(*) FROM detalle_pedidos d WHERE d.id_pedido=p.id_pedido) AS detalles_asociados,(SELECT COUNT(*) FROM pagos pa WHERE pa.id_pedido=p.id_pedido AND pa.estado_pago='REALIZADO') AS pagos_realizados FROM pedidos p LEFT JOIN clientes c ON c.id_cliente=p.id_cliente ORDER BY p.id_pedido`);
    return rows;
  },
  pagos: async () => {
    const [rows] = await conexion.query("SELECT id_pago,id_pedido,metodo_pago,estado_pago,CASE WHEN estado_pago='REALIZADO' THEN 'el pago está realizado' END AS bloqueado_por FROM pagos ORDER BY id_pago");
    return rows;
  },
  envios: async () => {
    // id_direccion viaja en la respuesta para que el modal de edicion pueda
    // precargar la direccion. Las fechas van con DATE_FORMAT para no mostrar el
    // ISO crudo con hora.
    const [rows] = await conexion.query(`SELECT id_envio,id_pedido,id_direccion,tipo_entrega,codigo_postal,DATE_FORMAT(fecha_estimada,'%Y-%m-%d') AS fecha_estimada,DATE_FORMAT(fecha_entrega,'%Y-%m-%d') AS fecha_entrega,estado,CASE WHEN estado='ENTREGADO' THEN 'el envío está entregado' END AS bloqueado_por FROM envios ORDER BY id_envio`);
    return rows;
  },

  // Todo lo que cuelga de un pedido, para el modal de "Ver mas".
  //
  // Va aparte del listado a proposito: son cuatro consultas y solo hacen falta
  // cuando alguien abre el detalle. Si se metiera en `pedidos()` serian cuatro
  // consultas extra por cada fila de la tabla, para mostrar datos que casi
  // nadie mira.
  detallePedido: async (id) => {
    const [pedidos] = await conexion.query(
      `SELECT p.id_pedido,CONCAT(c.nombre,' ',c.apellido) AS cliente,
        DATE_FORMAT(p.fecha,'%Y-%m-%dT%H:%i') AS fecha,
        p.estado,p.subtotal,p.costo_envio,p.total
       FROM pedidos p LEFT JOIN clientes c ON c.id_cliente=p.id_cliente
       WHERE p.id_pedido = ?`,
      [id]
    );
    if (!pedidos.length) {
      const error = new Error('El registro no existe');
      error.status = 404;
      throw error;
    }

    // Las tres consultas siguientes se lanzo en paralelo: no dependen entre si
    // y son de lectura. Solo la primera puede fallar por "no existe", asi que va
    // antes y decide el 404.
    const [[pagos], [envios], [lineas]] = await Promise.all([
      conexion.query(
        'SELECT metodo_pago,estado_pago FROM pagos WHERE id_pedido = ? ORDER BY id_pago', [id]
      ),
      conexion.query(
        `SELECT tipo_entrega,estado,
          DATE_FORMAT(fecha_estimada,'%Y-%m-%d') AS fecha_estimada,
          DATE_FORMAT(fecha_entrega,'%Y-%m-%d') AS fecha_entrega
         FROM envios WHERE id_pedido = ? ORDER BY id_envio`, [id]
      ),
      // El nombre de la linea sale de dos saltos: la variante apunta al producto
      // y, si tiene, al valor del atributo que define su presentacion. "Rojo" o
      // "Mediana" son lo que Distinguen una variante de otra, asi que se
      // muestra: sin eso dos filas del mismo producto serian indistinguibles.
      // El texto se arma aca y no en el frontend, con un CASE porque
      // CONCAT devuelve NULL si alguno de sus pedazos es NULL.
      conexion.query(
        `SELECT CASE WHEN va.nombre IS NULL THEN p.nombre
              ELSE CONCAT(p.nombre, ' — ', va.nombre) END AS producto,
          d.cantidad,d.precio_unitario,d.subtotal
         FROM detalle_pedidos d
         JOIN variantes v ON v.id_variante = d.id_variante
         JOIN productos p ON p.id_producto = v.id_producto
         LEFT JOIN valores_atributo va ON va.id_valor = v.id_valor_atributo
         WHERE d.id_pedido = ? ORDER BY d.id_detalle_pedido`, [id]
      )
    ]);

    return { pedido: pedidos[0], pagos, envios, lineas };
  }
};
