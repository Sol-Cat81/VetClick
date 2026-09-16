// routes/usuarios.js
const express = require('express');
const router = express.Router();
const UsuarioService = require('../service/usuarios.service')
const { verificarUsuario, registrarUsuario } = require('./../controllers/usuarios.controller');

// Cuando el frontend haga un POST a /api/usuarios/registro, ejecutará nuestro controlador
router.post('/iniciarsession', verificarUsuario);

router.post('/registrarusuario', registrarUsuario)

router.get('/', UsuarioService.listarUsuarios);

module.exports = router;