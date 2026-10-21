const express = require('express');
const controller = require('../controllers/clinica.controller');
const { authMiddleware } = require('../middlewares/auth');
const router = express.Router();
router.get('/turnos', controller.turnos);
router.get('/historial', controller.historial);
router.get('/tratamientos', controller.tratamientos);
router.get('/vacunas', controller.vacunas);
router.get('/servicios', controller.servicios);
router.get('/categorias-servicios', controller.categoriasServicio);
// Horarios libres de una fecha, para la pagina publica de turnos.
router.get('/horarios-disponibles', controller.horariosDisponibles);
// Reservar un turno. Necesita sesion: el turno queda a nombre del cliente.
router.post('/turnos', authMiddleware, controller.crearTurno);
module.exports = router;
