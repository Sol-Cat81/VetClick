const express = require('express');
const multer = require('multer');
const controller = require('../controllers/admin.controller');
const router = express.Router();

// Configuración de multer para imágenes de mascotas en adopción (copiada de catalogo.routes.js).
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

// Manejador de errores de multer: devuelve 400 JSON para que el frontend no reviente.
const manejarErrorUpload = (error, req, res, next) => {
  res.status(400).json({ mensaje: error.message || 'No se pudo procesar el archivo' });
};

router.get('/opciones', controller.opciones);

// Rutas ESPECÍFICAS para mascota en adopción (con subida de imagen).
// Deben ir ANTES de las genéricas /:entidad para que Express no las capture.
//
// Estas rutas no tienen el parámetro :entidad, así que se lo inyectamos:
// el controlador y el modelo trabajan siempre con el mismo nombre de entidad.
const entidadMascotaAdopcion = (req, res, next) => {
  req.params.entidad = 'mascotaAdopcion';
  next();
};

router.post('/mascotaAdopcion', entidadMascotaAdopcion, upload.single('img_masc_adop'), controller.crear);
router.put('/mascotaAdopcion/:id', entidadMascotaAdopcion, upload.single('img_masc_adop'), controller.actualizar);

// Rutas ESPECÍFICAS para sucursal (con subida de imagen). Mismo criterio que
// arriba: van antes de las genéricas /:entidad y reciben el :entidad inyectado.
const entidadSucursal = (req, res, next) => {
  req.params.entidad = 'sucursal';
  next();
};

router.post('/sucursal', entidadSucursal, upload.single('img_sucursal'), controller.crear);
router.put('/sucursal/:id', entidadSucursal, upload.single('img_sucursal'), controller.actualizar);

// Rutas genéricas del panel de administración.
router.post('/:entidad', controller.crear);
router.put('/:entidad/:id', controller.actualizar);
// Va despues de /:entidad/:id: si no, Express la tomaria como un PUT.
router.get('/:entidad/:id/dependientes', controller.dependientes);
router.post('/:entidad/:id/estado', controller.estado);
router.delete('/:entidad/:id', controller.eliminar);

// Va al final para atrapar los errores de multer de las rutas de arriba.
router.use(manejarErrorUpload);

module.exports = router;
