const service = require('../service/ventas.service');
const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) { console.error('Error al listar ventas:', error); res.status(500).json({ mensaje: 'No se pudieron cargar las ventas' }); }
};
// El detalle no usa `responder` porque necesita conservar el 404 del modelo:
// un "Ver mas" sobre un pedido inexistente tiene que decirlo, no devolver un
// error generico de servidor.
const detallePedido = async (req, res) => {
  const id = Number(req.params.id_pedido);
  // Sin esto, un id como "abc" llega como NaN a mysql2 y revienta con un 500
  // genérico en vez de un 400 que diga qué está mal.
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de pedido inválido' });
  }
  try {
    res.json(await service.listarDetallePedido(id));
  } catch (error) {
    console.error('Error al cargar el detalle del pedido:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo cargar el detalle del pedido'
    });
  }
};
module.exports = {
  pedidos: responder(service.listarPedidos),
  pagos: responder(service.listarPagos),
  envios: responder(service.listarEnvios),
  detallePedido
};
