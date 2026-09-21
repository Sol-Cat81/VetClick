const model = require('../models/ventas.model');
module.exports = { listarPedidos: model.pedidos, listarPagos: model.pagos, listarEnvios: model.envios };
