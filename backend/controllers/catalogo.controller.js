const cloudinary = require('cloudinary').v2;
const service = require('../service/catalogo.service');

const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) { console.error('Error al listar catálogo:', error); res.status(500).json({ mensaje: 'No se pudo cargar el catálogo' }); }
};

// Sube la imagen a Cloudinary y devuelve la URL. Sin archivo devuelve null,
// que es la señal de "conservar la imagen actual".
const subirImagen = async (archivo, carpeta) => {
  if (!archivo) return null;
  const resultado = await cloudinary.uploader.upload(
    `data:${archivo.mimetype};base64,${archivo.buffer.toString('base64')}`,
    { folder: carpeta, resource_type: 'image' }
  );
  return resultado.secure_url;
};

const carpetaProducto = () => process.env.CLOUDINARY_FOLDER_PRODUCTO || 'VetClick/Productos';
const carpetaMarca = () => process.env.CLOUDINARY_FOLDER_MARCA || 'VetClick/Marcas';

const crearProducto = async (req, res) => {
  try {
    const imagen = await subirImagen(req.file, carpetaProducto());
    const resultado = await service.crearProducto({
      ...req.body,
      imagen,
      activo: req.body?.activo === 'true' || req.body?.activo === true || req.body?.estado === 'Activo'
    });

    res.status(201).json({
      mensaje: 'Producto creado correctamente',
      id: resultado.insertId,
      imagen
    });
  } catch (error) {
    console.error('Error al guardar producto:', error);
    res.status(error.status || 500).json({
      mensaje: error.message || 'Error al guardar producto'
    });
  }
};

const actualizarProducto = async (req, res) => {
  const id = Number(req.params.id_producto);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de producto inválido' });
  }
  try {
    const imagen = await subirImagen(req.file, carpetaProducto());
    await service.actualizarProducto(id, { ...req.body, imagen });
    res.json({ mensaje: 'Producto actualizado correctamente', id_producto: id });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo actualizar el producto'
    });
  }
};

const crearMarca = async (req, res) => {
  try {
    const imagen = await subirImagen(req.file, carpetaMarca());
    const resultado = await service.crearMarca({ nombre: req.body?.nombre, imagen });
    res.status(201).json({ mensaje: 'marca creada correctamente', id: resultado.insertId, imagen });
  } catch (error) {
    console.error('Error al guardar marca:', error);
    // error.message, no error.mensaje: los Error de JS no tienen esa propiedad,
    // por eso el mensaje real de la validación se perdia.
    res.status(error.status || 500).json({ mensaje: error.message || 'error al guardar marca' });
  }
};

const actualizarMarca = async (req, res) => {
  const id = Number(req.params.id_marca);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de marca inválido' });
  }
  try {
    const imagen = await subirImagen(req.file, carpetaMarca());
    await service.actualizarMarca(id, { nombre: req.body?.nombre, imagen });
    res.json({ mensaje: 'Marca actualizada correctamente', id_marca: id });
  } catch (error) {
    console.error('Error al actualizar marca:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo actualizar la marca'
    });
  }
};

module.exports = {
  productos: responder(service.listarProductos),
  categorias: responder(service.listarCategorias),
  marcas: responder(service.listarMarcas),
  variantes: responder(service.listarVariantes),
  atributos: responder(service.listarAtributos),
  valoresAtributo: responder(service.listarValoresAtributo),
  crearProducto,
  actualizarProducto,
  crearMarca,
  actualizarMarca
};
