const cloudinary = require('cloudinary').v2;
const service = require('../service/catalogo.service');

const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) { console.error('Error al listar catálogo:', error); res.status(500).json({ mensaje: 'No se pudo cargar el catálogo' }); }
};

const crearProducto = async (req, res) => {
  try {
    let imagenUrl = req.body?.imagen_url || null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        {
          folder: process.env.CLOUDINARY_FOLDER || 'VetClick',
          resource_type: 'image'
        }
      );
      imagenUrl = result.secure_url;
    }

    const resultado = await service.crearProducto({
      ...req.body,
      imagen_url: imagenUrl,
      activo: req.body?.activo === 'true' || req.body?.activo === true || req.body?.estado === 'Activo'
    });

    res.status(201).json({
      mensaje: 'Producto creado correctamente',
      id: resultado.insertId,
      imagen_url: imagenUrl
    });
  } catch (error) {
    console.error('Error al guardar producto:', error);
    const status = error.status || 500;
    res.status(status).json({
      mensaje: error.message || 'Error al guardar producto'
    });
  }
};

module.exports = {
  productos: responder(service.listarProductos),
  categorias: responder(service.listarCategorias),
  marcas: responder(service.listarMarcas),
  variantes: responder(service.listarVariantes),
  crearProducto
};


