const CatalogoModel = require('../models/catalogo.model');

// Helpers de validación. Los comparten crear* y actualizar* para que un alta y
// una edición apliquen exactamente las mismas reglas.
const exigirTexto = (valor, mensaje) => {
  const texto = String(valor ?? '').trim();
  if (!texto) {
    const error = new Error(mensaje);
    error.status = 400;
    throw error;
  }
  return texto;
};

const exigirId = (valor, mensaje) => {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1) {
    const error = new Error(mensaje);
    error.status = 400;
    throw error;
  }
  return id;
};

const exigirDescuento = (valor) => {
  const descuento = Number(valor ?? 0);
  if (!Number.isInteger(descuento) || descuento < 0 || descuento > 100) {
    const error = new Error('El descuento debe ser un porcentaje entero entre 0 y 100');
    error.status = 400;
    throw error;
  }
  return descuento;
};

const errorValidacion = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

const aBooleano = valor => valor === true || valor === 'true';

module.exports = {
  listarProductos: () => CatalogoModel.productos(),
  listarCategorias: () => CatalogoModel.categorias(),
  listarMarcas: () => CatalogoModel.marcas(),
  listarVariantes: () => CatalogoModel.variantes(),
  listarAtributos: () => CatalogoModel.atributos(),
  listarValoresAtributo: () => CatalogoModel.valoresAtributo(),

  crearProducto: (producto) => CatalogoModel.crearProducto({
    ...producto,
    nombre: exigirTexto(producto?.nombre, 'El nombre del producto es obligatorio'),
    id_marca: exigirId(producto?.id_marca, 'La marca del producto no es válida'),
    id_categoria: exigirId(producto?.id_categoria, 'Debe seleccionar una categoría válida'),
    descuento: exigirDescuento(producto?.descuento),
    activo: producto?.activo === undefined ? true : aBooleano(producto.activo)
  }),

  actualizarProducto: async (id, producto) => {
    // Consultamos antes porque MySQL devuelve affectedRows = 0 cuando los
    // valores no cambian, y eso no significa que el producto no exista.
    const existente = await CatalogoModel.obtenerProductoPorId(id);
    if (!existente) throw errorValidacion('El producto no existe', 404);

    const limpio = {};
    if (producto?.nombre !== undefined) limpio.nombre = exigirTexto(producto.nombre, 'El nombre del producto es obligatorio');
    if (producto?.id_marca !== undefined) limpio.id_marca = exigirId(producto.id_marca, 'La marca del producto no es válida');
    if (producto?.id_categoria !== undefined) limpio.id_categoria = exigirId(producto.id_categoria, 'Debe seleccionar una categoría válida');
    if (producto?.descuento !== undefined) limpio.descuento = exigirDescuento(producto.descuento);
    if (producto?.descripcion !== undefined) limpio.descripcion = String(producto.descripcion).trim() || null;
    if (producto?.activo !== undefined) limpio.activo = aBooleano(producto.activo);
    // Si no se subio un archivo nuevo, la imagen no se toca.
    if (producto?.imagen) limpio.imagen = producto.imagen;

    if (!Object.keys(limpio).length) throw errorValidacion('No se envió ningún campo para actualizar');
    return CatalogoModel.actualizarProducto(id, limpio);
  },

  crearMarca: (marca) => CatalogoModel.crearMarca({
    nombre: exigirTexto(marca?.nombre, 'el nombre de la marca es obligatorio'),
    imagen: marca?.imagen || null
  }),

  actualizarMarca: async (id, marca) => {
    const existente = await CatalogoModel.obtenerMarcaPorId(id);
    if (!existente) throw errorValidacion('La marca no existe', 404);

    const limpio = {};
    if (marca?.nombre !== undefined) limpio.nombre = exigirTexto(marca.nombre, 'el nombre de la marca es obligatorio');
    // Igual que en producto: sin archivo nuevo se conserva la imagen actual.
    if (marca?.imagen) limpio.imagen_marca = marca.imagen;

    if (!Object.keys(limpio).length) throw errorValidacion('No se envió ningún campo para actualizar');
    return CatalogoModel.actualizarMarca(id, limpio);
  }
};
