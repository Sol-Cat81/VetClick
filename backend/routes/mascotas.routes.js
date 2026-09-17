const express = require ('express');
const router = express.Router();
const MascotaService = require('../service/mascota.service')

router.get('/', MascotaService.listarMascotas);

module.exports = router;