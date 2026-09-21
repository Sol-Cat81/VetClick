const service = require('../service/catalogo.service');
const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) { console.error('Error al listar catálogo:', error); res.status(500).json({ mensaje: 'No se pudo cargar el catálogo' }); }
};
module.exports = {
  productos: responder(service.listarProductos),
  categorias: responder(service.listarCategorias),
  marcas: responder(service.listarMarcas),
  variantes: responder(service.listarVariantes)
};
