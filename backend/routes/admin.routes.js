const express = require('express');
const controller = require('../controllers/admin.controller');
const router = express.Router();

router.get('/opciones', controller.opciones);
router.post('/:entidad', controller.crear);
router.put('/:entidad/:id', controller.actualizar);

module.exports = router;
