const express = require('express');
const controller = require('../controllers/clientes.controller');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.get('/', controller.clientes);
router.post('/', controller.crearCliente);

router.get('/mascotas', controller.mascotas);
router.post('/mascotas', controller.crearMascotas);

router.get('/direcciones', controller.direcciones);
router.get('/especies', controller.especies);
router.get('/razas', controller.razas);
router.get('/mascotas-adopcion', controller.mascotasAdopcion);
router.get('/adopciones', controller.adopciones);

// Solicitud de adopcion desde la pagina publica: necesita sesion porque la
// adopcion se guarda a nombre del cliente logueado. Va antes de /:id_cliente.
router.post('/adopciones', authMiddleware, controller.solicitarAdopcion);

// Mascotas del cliente logueado y alta de una propia. El id del cliente sale
// del token en los dos casos. Van antes de /mascotas/:id_mascota.
router.get('/mis-mascotas', authMiddleware, controller.misMascotas);
router.post('/mis-mascotas', authMiddleware, controller.crearMiMascota);

// Mascota tiene su propio id: va antes que /:id_cliente para que Express
// no interprete "mascotas" como un id de cliente.
router.get('/mascotas/:id_mascota', controller.obtenerMascota);
router.put('/mascotas/:id_mascota', controller.actualizarMascota);

// Van al final porque capturan cualquier /:id de la raíz.
router.get('/:id_cliente', controller.obtenerCliente);
router.put('/:id_cliente', controller.actualizarCliente);

module.exports = router;
