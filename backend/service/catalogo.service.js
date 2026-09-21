const model = require('../models/catalogo.model');
module.exports = {
  listarProductos: model.productos,
  listarCategorias: model.categorias,
  listarMarcas: model.marcas,
  listarVariantes: model.variantes
};
