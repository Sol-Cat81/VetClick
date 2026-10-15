const AdminModel = require('../models/admin.model');

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
      const resultado = await AdminModel.crear(req.params.entidad, req.body || {});
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
      await AdminModel.actualizar(req.params.entidad, id, req.body || {});
      res.json({ mensaje: 'Registro actualizado correctamente', id });
    } catch (error) {
      console.error(`Error al actualizar ${req.params.entidad}:`, error);
      res.status(error.status || 500).json({ mensaje: error.status ? error.message : 'No se pudo actualizar el registro' });
    }
  }
};
