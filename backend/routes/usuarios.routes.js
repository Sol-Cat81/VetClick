// Router para login, registro y listado de usuarios.
const express = require('express');
const multer = require ('multer');
const router = express.Router();
const UsuarioService = require('../service/personal.service')
const { authMiddleware } = require('./../middlewares/auth')
const { 
    verificarUsuario, 
    registrarUsuario, 
    detectarsession, 
    logout, 
    refreshToken, 
    guardarCliente,
    deshboard,
    guardarDireccion,
    traerDireccionEspecifica,
    cambiarFotoPerfil
} = require('./../controllers/usuarios.controller');

const upload = multer({
    storage: multer.memoryStorage(),
    limits:{
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req , file , cb)=>{
        if(file && !file.mimetype.startsWith('image/')){
            return cb(new Error('el  archivo debe ser una imagen '));
        }
        cb (null, true);
    }
});

const manejarErrorUpload = (error, req, res, next) => {
  res.status(400).json({ mensaje: error.message || 'No se pudo procesar el archivo' });
};

router.post('/perfil/foto', authMiddleware,upload.single('imagen_usuario'),cambiarFotoPerfil);

// El controlador valida las credenciales recibidas en el cuerpo JSON.
router.post('/iniciarsession', verificarUsuario);

// El controlador crea usuarios nuevos después de validar sus datos.
router.post('/registrarusuario', registrarUsuario)

// GET /api/usuarios devuelve datos públicos, nunca contraseñas.
router.get('/', UsuarioService.listarUsuarios);

router.get('/verificarsession', detectarsession)

router.get('/logout', logout)

router.post("/refresh", refreshToken);

/* rutas configuracion cuenta */

router.post('/guardarcliente', authMiddleware, guardarCliente)
router.get('/deshboard', authMiddleware, deshboard)
router.post('/guardardireccion', authMiddleware, guardarDireccion)
router.get('/traerdireccion', authMiddleware, traerDireccionEspecifica)

module.exports = router;