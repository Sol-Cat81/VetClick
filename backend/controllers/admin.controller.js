const AdminModel = require('../models/admin.model');
const cloudinary = require('cloudinary').v2;

// Sube la imagen a Cloudinary y devuelve la URL. Sin archivo devuelve null.
const subirImagen = async (archivo, carpeta) => {
  if (!archivo) return null;
  const resultado = await cloudinary.uploader.upload(
    `data:${archivo.mimetype};base64,${archivo.buffer.toString('base64')}`,
    { folder: carpeta, resource_type: 'image' }
  );
  return resultado.secure_url;
};

const carpetaAdopcion = () => process.env.CLOUDINARY_FOLDER_ADOPCIONES || 'VetClick/adopciones';

module.exports = {
  opciones: async (req, res) => {
    try {
      res.json(await AdminModel.obtenerOpciones());
    } catch (error) {
      console.error('Error al cargar opciones administrativas:', error);
      res.status(500).json({ mensaje: 'No se pudieron cargar las opciones de relación' });
    }
  },
  crear: async (req, res) => {
    try {
      const entidad = req.params.entidad;
      const datos = { ...(req.body || {}) };
      if (entidad === 'mascotaAdopcion' && req.file) {
        datos.img_masc_adop = await subirImagen(req.file, carpetaAdopcion());
      }
      const resultado = await AdminModel.crear(entidad, datos);
      res.status(201).json({ mensaje: 'Registro creado correctamente', id: resultado.insertId });
    } catch (error) {
      console.error(`Error al crear ${req.params.entidad}:`, error);
      res.status(error.status || 500).json({ mensaje: error.status ? error.message : 'No se pudo crear el registro' });
    }
  },
  actualizar: async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: 'ID de registro inválido' });
    }
    try {
      const entidad = req.params.entidad;
      const datos = { ...(req.body || {}) };
      if (entidad === 'mascotaAdopcion' && req.file) {
        datos.img_masc_adop = await subirImagen(req.file, carpetaAdopcion());
      }
      await AdminModel.actualizar(entidad, id, datos);
      res.json({ mensaje: 'Registro actualizado correctamente', id });
    } catch (error) {
      console.error(`Error al actualizar ${req.params.entidad}:`, error);
      res.status(error.status || 500).json({ mensaje: error.status ? error.message : 'No se pudo actualizar el registro' });
    }
  },
  // Que impide borrar la fila y que se arrastraria en cascada. Lo consulta el
  // panel antes de mostrar la confirmacion, para no pedirle al usuario que
  // confirme algo sin decirle el detalle exacto de lo que se lleva.
  dependientes: async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: 'ID de registro inválido' });
    }
    try {
      res.json(await AdminModel.planificarBorrado(req.params.entidad, id));
    } catch (error) {
      console.error(`Error al consultar dependientes de ${req.params.entidad}:`, error);
      res.status(error.status || 500).json({ mensaje: error.status ? error.message : 'No se pudo consultar el registro' });
    }
  },
  eliminar: async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: 'ID de registro inválido' });
    }
    try {
      // El body lleva el destino de la reasignacion cuando la entidad la pide
      // (un rol de empleado tiene que indicar a donde van sus empleados).
      res.json(await AdminModel.eliminar(req.params.entidad, id, {}, req.body || {}));
    } catch (error) {
      console.error(`Error al eliminar ${req.params.entidad}:`, error);
      res.status(error.status || 500).json({ mensaje: error.status ? error.message : 'No se pudo eliminar el registro' });
    }
  },
  // Avanza el estado al siguiente valor valido. No recibe el valor: lo decide el
  // backend desde la lista ENUM, para que el frontend no tenga su propia copia
  // de los estados y las dos no se desincronicen.
  estado: async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: 'ID de registro inválido' });
    }
    try {
      res.json(await AdminModel.avanzarEstado(req.params.entidad, id));
    } catch (error) {
      console.error(`Error al cambiar el estado de ${req.params.entidad}:`, error);
      res.status(error.status || 500).json({ mensaje: error.status ? error.message : 'No se pudo cambiar el estado' });
    }
  }
};
