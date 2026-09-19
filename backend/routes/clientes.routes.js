// Router separa las rutas de clientes del archivo principal.
const express = require ('express');
const router = express.Router();
// El router delega la lógica de negocio al service.
const ClientesService = require('../service/clientes.service');

// GET /api/clientes devuelve todos los clientes.
router.get('/',ClientesService.listarclientes);

module.exports = router;
