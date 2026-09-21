# Vet Click — Panel administrativo

Primera etapa: diseño visual y navegación sin backend.

## Estructura
- `index.html`: shell principal, sidebar, topbar y contenedor del contenido.
- `views/`: vistas HTML de cada módulo.
- `css/styles.css`: estilos globales.
- `js/app.js`: navegación por hash, carga de vistas, subnavegación, filtros, acciones CRUD visuales y modales reutilizables.

## Ejecutar
Como las vistas se cargan con `fetch()`, abre el proyecto con un servidor local (por ejemplo VS Code + Live Server) y entra en `index.html`.

## Datos
Las tablas muestran datos de demostración tomados del `bd.sql` proporcionado. No se muestran campos sensibles como `password_hash`.

## Acciones y modales
Cada panel administrativo incorpora un botón para agregar registros y acciones de editar/eliminar. Los registros que muestran
un estado también incluyen el botón para alternarlo. Los formularios se generan desde `js/app.js` leyendo los encabezados de
la tabla activa, por lo que el modal de historial, mascotas, productos, pedidos, etc. muestra sus propios campos. Actualmente
las acciones funcionan en modo demo y muestran confirmaciones, pero todavía deben persistirse mediante la API.

## Guía paso a paso para conectar una tabla con la API

El backend usa Express, MySQL y una separación por capas. Para conectar una nueva tabla del panel, sigue este orden:

### 1. Revisar la tabla y sus relaciones

1. Abre `backend/bd.sql`.
2. Identifica la tabla, su clave primaria, columnas obligatorias y claves foráneas.
3. Define qué columnas serán públicas en la tabla del admin. Nunca envíes `password_hash` ni otros datos sensibles.
4. Decide los nombres JSON que utilizará el frontend. Es preferible usar nombres consistentes como `id`, `nombre`, `estado`.

### 2. Crear el modelo

Crea `backend/models/<entidad>.model.js` y reutiliza la conexión de `backend/config/database.js`.
El modelo solo debe encargarse de consultar o modificar MySQL:

```js
const conexion = require('../config/database');

const EntidadModel = {
  obtenerTodos: async () => {
    const [rows] = await conexion.query(
      'SELECT id_entidad, nombre, activo FROM entidades ORDER BY id_entidad DESC'
    );
    return rows;
  },

  crear: async (datos) => {
    const [result] = await conexion.query(
      'INSERT INTO entidades (nombre, activo) VALUES (?, ?)',
      [datos.nombre, datos.activo ?? true]
    );
    return result.insertId;
  }
};

module.exports = EntidadModel;
```

Usa siempre parámetros `?`; no concatenes valores recibidos desde el navegador. Mantén el nombre de los métodos claro
(`obtenerTodos`, `obtenerPorId`, `crear`, `actualizar`, `eliminar`).

### 3. Crear el service

Crea `backend/services/<entidad>.service.js`. El service valida y normaliza los datos antes de llamar al modelo:

```js
const EntidadModel = require('../models/entidad.model');

const EntidadService = {
  listar: () => EntidadModel.obtenerTodos(),
  crear: async (datos) => {
    if (!datos.nombre?.trim()) {
      const error = new Error('El nombre es obligatorio');
      error.status = 400;
      throw error;
    }
    return EntidadModel.crear({
      nombre: datos.nombre.trim(),
      activo: Boolean(datos.activo)
    });
  }
};

module.exports = EntidadService;
```

El service es el lugar indicado para validar tipos, campos obligatorios, permisos y reglas de negocio. No pongas SQL en
las rutas.

### 4. Crear el controller

Crea `backend/controllers/<entidad>.controller.js`. El controller traduce la solicitud HTTP en una respuesta JSON:

```js
const EntidadService = require('../services/entidad.service');

const listar = async (req, res) => {
  try {
    res.json(await EntidadService.listar());
  } catch (error) {
    console.error('Error al listar entidades:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener los registros' });
  }
};

module.exports = { listar };
```

Agrega también handlers para `crear`, `actualizar`, `eliminar` y `cambiarEstado`. Devuelve `400` para datos inválidos,
`404` cuando no existe el registro y `500` solo para errores inesperados.

### 5. Crear las routes

Crea `backend/routes/<entidad>.routes.js`:

```js
const express = require('express');
const controller = require('../controllers/entidad.controller');

const router = express.Router();
router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.patch('/:id/estado', controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;
```

### 6. Registrar las routes en Express

En el archivo de arranque del backend, registra el router una sola vez:

```js
const entidadesRoutes = require('./routes/entidad.routes');
app.use('/api/entidades', entidadesRoutes);
```

Verifica que `express.json()` esté habilitado antes de las rutas y que CORS permita el origen del panel admin.

### 7. Conectar el frontend

1. Agrega el endpoint en `frontend/admin/js/conexion_html.js`.
2. Carga la lista después de `loadView()` o desde `cargarDatosDeVista()`.
3. Conserva en cada fila el ID real en un atributo `data-id`.
4. Al enviar el modal, convierte `FormData` a un objeto y usa `POST` para crear o `PUT` para editar.
5. Para eliminar usa `DELETE /api/entidades/:id`.
6. Para cambiar estado usa `PATCH /api/entidades/:id/estado`.
7. Después de una operación exitosa, vuelve a cargar la tabla y muestra `showToast()`.
8. Si la API falla, muestra el error al usuario y no simules un guardado exitoso.

### 8. Probar la integración

Prueba cada endpoint con Postman o `curl`, luego abre el panel con Live Server y verifica:

- Que el modal tenga los campos reales de la tabla.
- Que crear y editar validen campos obligatorios.
- Que eliminar pida confirmación.
- Que cambiar estado actualice el valor y su estilo.
- Que los errores de backend aparezcan como mensajes visibles.
