# Vet Click — Panel administrativo

Primera etapa: diseño visual y navegación sin backend.

## Estructura
- `index.html`: shell principal, sidebar, topbar y contenedor del contenido.
- `views/`: vistas HTML de cada módulo.
- `css/styles.css`: estilos globales.
- `js/app.js`: navegación por hash, carga de vistas, subnavegación, filtros y mensajes demo.

## Ejecutar
Como las vistas se cargan con `fetch()`, abre el proyecto con un servidor local (por ejemplo VS Code + Live Server) y entra en `index.html`.

## Datos
Las tablas muestran datos de demostración tomados del `bd.sql` proporcionado. No se muestran campos sensibles como `password_hash`.

## Próxima etapa
Conectar estas vistas con Node.js/Express y las consultas SQL, sustituyendo los datos estáticos por respuestas de la API.
