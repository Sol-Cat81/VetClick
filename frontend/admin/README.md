# Vet Click — Panel administrativo

Primera etapa: diseño visual y navegación sin backend.

## Estructura
- `index.html`: shell principal, sidebar, topbar y contenedor del contenido.
- `views/`: vistas HTML de cada módulo.
- `css/styles.css`: estilos globales.
- `js/app.js`: navegación por hash, carga de vistas, subnavegación, filtros, acciones CRUD visuales y apertura/cierre de modales.

## Ejecutar
Como las vistas se cargan con `fetch()`, abre el proyecto con un servidor local (por ejemplo VS Code + Live Server) y entra en `index.html`.

## Datos
Las tablas muestran datos de demostración tomados del `bd.sql` proporcionado. No se muestran campos sensibles como `password_hash`.

## Acciones y modales
Cada panel administrativo incorpora un botón para agregar registros y acciones de editar/eliminar. Los registros que muestran
un estado también incluyen el botón para alternarlo. Cada vista declara sus modales directamente en HTML mediante
`data-admin-modal`, con sus etiquetas, campos y validaciones visibles en el archivo correspondiente. `js/app.js` solo localiza
el modal, lo muestra, carga los valores de una fila al editar y procesa el evento de envío.

**Estado de las acciones:**

- **Crear** y **Editar**: persistidos contra la API en las secciones Clientes, Clinica, Catálogo, Inventario, Ventas y Personal y Seguridad.
- **Eliminar**: persistido en Personal y Seguridad, y en Ventas (con su propia regla: no se borra un pago `REALIZADO` ni un envío `ENTREGADO`). En las demás secciones avisa que todavía no está conectado, en vez de fingir que funciona.
- **Cambiar estado**: conectado solo en Ventas. En las demás secciones sigue siendo visual y **el ciclo es incorrecto**: rota el texto entre "Activo", "Pendiente" e "Inactivo", valores que columnas como `usuarios.activo` (un `tinyint`) no admiten.

Cuando una entidad no tiene prellenador de edición registrado con `registrarFormulario()`, el modal se rellena mapeando celdas
por índice y queda en solo lectura. Por eso hay que registrar el prellenador **y** su clave primaria en el backend antes de
declarar una entidad editable.

`detalleEntidades` es otra cosa y no se contradice con lo anterior: es el modal de **solo lectura** del botón "Ver más", y no
tiene nada que ver con que la entidad sea editable. El pedido es el ejemplo: no tiene `registrarFormulario` porque su
actualización va por tabla hija, y sí tiene detalle.

### El botón "Ver más" y los datos anidados

`abrirDetalle()` lee campos planos del registro en memoria. Cuando el esquema declara `carga`, pide lo que cuelga del registro
a un endpoint propio **solo al abrir el modal**, y `listas` declara los bloques que se renderizan como tabla:

```js
detalleEntidades['pedido'] = {
  titulo: 'Pedido', registro: pedidosPorId,
  carga: 'ventas/pedidos/:id/detalle',   // se pide al abrir, no al listar
  campos: [ /* info-rows, como antes */ ],
  listas: [ { titulo: 'Productos', campo: 'lineas', vacio: '…', columnas: [ /* mismo formato que campos */ ] } ]
};
```

Las columnas de una lista usan el mismo formato que los campos planos (`etiqueta`, `enumeracion`, `etiquetas`, `fecha`,
`prefijo`, `sufijo`) porque se resuelven con la misma función `valorDetalle()`. Un bloque sin filas muestra su texto `vacio`:
un pedido sin pagos es un dato, no un fallo de carga.

Lo que cuelga de un registro debe ir en un endpoint aparte. Meterlo en el listado son N consultas extra por fila, para
mostrar datos que casi nadie mira.

La contraseña de un usuario no se edita nunca: en el modal de edición el campo aparece deshabilitado y el backend ignora
cualquier `password` que llegue en un `PUT`.

## Conectar el borrado de una entidad

El "Eliminar" usa un modal de confirmación único, en `index.html`, que es reutilizable: todas las secciones comparten el mismo
`data-admin-modal="confirmar-borrado"`. No hace falta copiarlo en cada vista.

Para que una entidad se pueda eliminar desde el panel hay que declararla en la tabla `borrados` de `backend/models/admin.model.js`,
con estas listas:

- **`bloqueantes`**: tablas hijas que impiden el borrado. Si hay alguna, el `DELETE` responde 400 nombrándolas.
- **`cascada`**: tablas hijas que se borran con el padre. Es anidable y se recorre en post-order, porque las FK son `NO ACTION`
  y los nietos tienen que irse antes que los padres.
- **`desasociar`**: tablas hijas que **no** se borran: se les pone la FK en `NULL`. Para cuando la hija tiene un valor propio que
  sobrevivir (la ficha de un veterinario, con los historiales que atendió).
- **`reasignar`**: tablas hijas que tienen que mudarse a otro padre antes de borrar este. El destino lo elige el usuario en el
  modal, y el `DELETE` lo lleva en el body.
- **`requiere`**: condiciones de la fila **propia**, no de sus hijas. Impide borrar un registro que no tiene algo
  (`veterinarios.id_empleado`).
- **`impideSi`**: valores de la fila propia que impiden el borrado. Un pago `REALIZADO` y un envío `ENTREGADO` no se
  borran: no son un error de carga, son el comprobante de que pasó.

`bloqueantes`, `desasociar` y `cascada` son excluyentes en la práctica: cada tabla hija entra en una sola. La elección no es
técnica sino de criterio, y por eso la tabla es explícita y no se deduce del esquema: el historial clínico de un paciente
`NO` le pertenece al veterinario que lo atendió, así que se desasocia y no se borra; una asignación de permiso, en cambio,
no significa nada sin su permiso, así que se borra en cascada.

La lista de la tabla `<table>` debe llevar `data-modal-entity` con la **etiqueta de la interfaz** ("rol de usuario", no
`rolUsuario`): es lo que leen `enhanceAdminPanels()` y `aplicarBloqueoBorrado()`.

Si el backend no tiene política para la entidad, el `GET .../dependientes` responde 404 y el panel lo dice. Es el mecanismo que
permite que las secciones todavía sin borrar no finjan que lo hacen.

### Probar borrados sin perder datos

`backend/test_admin_borrado.js` corre 44 verificaciones del borrado y del cambio de estado. Cada sección abre **su propia
transacción** y termina en `ROLLBACK`, así que no deja rastro y las secciones no se ensucian entre sí. Ejecutar con
`node test_admin_borrado.js`.

Por eso los métodos `eliminar()` y `avanzarEstado()` aceptan `opciones.conexion`: sin eso escribirían sobre el pool y el
rollback del test no las alcanzaría, y el test commitearía cambios reales.

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
