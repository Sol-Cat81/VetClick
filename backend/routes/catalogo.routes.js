const express = require('express');
const multer = require('multer');
const controller = require('../controllers/catalogo.controller');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file && !file.mimetype.startsWith('image/')) {
      return cb(new Error('El archivo debe ser una imagen'));
    }
    cb(null, true);
  }
});

router.get('/productos', controller.productos);
router.post('/productos', upload.single('imagen'), controller.crearProducto);
router.get('/categorias', controller.categorias);
router.get('/marcas', controller.marcas);
router.get('/variantes', controller.variantes);

module.exports = router;
