const express = require ('express');
const router = express.Router();
const ClientesService = require('../service/clientes.service');

router.get('/',ClientesService.listarclientes);

module.exports = router;
