const CatalogoModel = require('../models/catalogo.model');

module.exports = {
  listarProductos: () => CatalogoModel.productos(),
  listarCategorias: () => CatalogoModel.categorias(),
  listarMarcas: () => CatalogoModel.marcas(),
  listarVariantes: () => CatalogoModel.variantes(),

  crearProducto: async (producto) => {
    const nombre = String(producto?.nombre ?? '').trim();
    if (!nombre) {
      const error = new Error('El nombre del producto es obligatorio');
      error.status = 400;
      throw error;
    }

    const marca = Number(producto?.id_marca ?? 1);
    if (!Number.isFinite(marca) || marca < 1) {
      const error = new Error('La marca del producto no es válida');
      error.status = 400;
      throw error;
    }

    return CatalogoModel.crearProducto({
      ...producto,
      nombre,
      id_marca: marca,
      activo: producto?.activo === undefined ? true : Boolean(producto.activo),
      descuento: Number(producto?.descuento ?? 0),
      imagen_url: producto?.imagen_url || null
    });
  }
};
