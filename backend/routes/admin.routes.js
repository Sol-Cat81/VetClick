const express = require('express');
const controller = require('../controllers/admin.controller');
const router = express.Router();

router.get('/opciones', controller.opciones);
router.post('/:entidad', controller.crear);
router.put('/:entidad/:id', controller.actualizar);
// Va despues de /:entidad/:id: si no, Express la tomaria como un PUT.
router.get('/:entidad/:id/dependientes', controller.dependientes);
router.post('/:entidad/:id/estado', controller.estado);
router.delete('/:entidad/:id', controller.eliminar);

module.exports = router;
