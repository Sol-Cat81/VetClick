// Router dedicado a las mascotas.
const express = require ('express');
const router = express.Router();
// Importamos la capa que consulta el modelo.
const MascotaService = require('../service/mascota.service')

// GET /api/mascotas devuelve las mascotas con su propietario.
router.get('/', MascotaService.listarMascotas);

module.exports = router;