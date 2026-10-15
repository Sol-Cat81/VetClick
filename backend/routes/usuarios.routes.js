// Router para login, registro y listado de usuarios.
const express = require('express');
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
    traerClienteUsuario,
    traerDireccionesCliente
} = require('./../controllers/usuarios.controller');

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
router.get('/traeruser', authMiddleware, traerClienteUsuario)
router.get('/direcciones', authMiddleware, traerDireccionesCliente)

module.exports = router;