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

    const marca = Number(producto?.id_marca);
    if (!Number.isInteger(marca) || marca < 1) {
      const error = new Error('La marca del producto no es válida');
      error.status = 400;
      throw error;
    }

    const categoria = Number(producto?.id_categoria);
    if (!Number.isInteger(categoria) || categoria < 1) {
      const error = new Error('Debe seleccionar una categoría válida');
      error.status = 400;
      throw error;
    }

    const descuento = Number(producto?.descuento ?? 0);
    if (!Number.isInteger(descuento) || descuento < 0 || descuento > 100) {
      const error = new Error('El descuento debe ser un porcentaje entero entre 0 y 100');
      error.status = 400;
      throw error;
    }

    return CatalogoModel.crearProducto({
      ...producto,
      nombre,
      id_marca: marca,
      id_categoria: categoria,
      activo: producto?.activo === undefined ? true : Boolean(producto.activo),
      descuento,
      imagen_url: producto?.imagen_url || null
    });
  }
};
