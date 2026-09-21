const express = require('express');
const controller = require('../controllers/inventario.controller');
const router = express.Router();
router.get('/stock', controller.stock);
router.get('/sucursales', controller.sucursales);
module.exports = router;
