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

// multer corta el flujo si el archivo no es imagen o excede 5MB. Sin este
// manejador Express devuelve su pagina HTML de 500 y el frontend, que espera
// JSON, revienta al hacer respuesta.json() con un error incomprensible.
const manejarErrorUpload = (error, req, res, next) => {
  res.status(400).json({ mensaje: error.message || 'No se pudo procesar el archivo' });
};

router.post('/marcas', upload.single('imagen_marca'), controller.crearMarca);
router.put('/marcas/:id_marca', upload.single('imagen_marca'), controller.actualizarMarca);
router.get('/productos', controller.productos);
router.post('/productos', upload.single('imagen'), controller.crearProducto);
router.put('/productos/:id_producto', upload.single('imagen'), controller.actualizarProducto);
router.get('/categorias', controller.categorias);
router.get('/marcas', controller.marcas);
router.get('/variantes', controller.variantes);
router.get('/atributos', controller.atributos);
router.get('/valores-atributo', controller.valoresAtributo);

// Va al final para atrapar los errores de las rutas de arriba.
router.use(manejarErrorUpload);

module.exports = router;
