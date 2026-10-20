# Errores pendientes de resolución

---

## ERROR-001: Login roto — `SECRETO_JWT_ACCESS` y `SECRETO_JWT_REFRESH` no definidos

**Fecha detectado:** 2026-10-19  
**Severidad:** Crítica (bloquea autenticación completa)  
**Estado:** ✅ **RESUELTO** (2026-10-19) — el usuario agregó `SECRETO_JWT_ACCESS` y `SECRETO_JWT_REFRESH` al `.env`. Login verificado con `admin / 123456` → 200.

### Descripción
Al intentar iniciar sesión (`POST /api/usuarios/iniciarsession`), el servidor responde **500 Internal Server Error**. El log muestra:

```
Error en el login: Error: secretOrPrivateKey must have a value
    at module.exports [as sign] (jsonwebtoken/sign.js:111:20)
    at verificarUsuario (usuarios.controller.js:62:25)
```

La línea 62 de `usuarios.controller.js` firma el access token con `process.env.SECRETO_JWT_ACCESS`, y la línea 68 el refresh token con `process.env.SECRETO_JWT_REFRESH`. Ambas variables **no existen** en `backend/.env` ni en variables de entorno del sistema.

### Variables actuales en `.env` (12)
```
PORT
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
PORT (duplicado)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_FOLDER_PRODUCTO
CLOUDINARY_FOLDER_MARCA
CLOUDINARY_FOLDER_PERFILES_USUARIOS
CLOUDINARY_FOLDER_ADOPCIONES
```

Faltan:
- `SECRETO_JWT_ACCESS`
- `SECRETO_JWT_REFRESH`

### Impacto
- Ningún usuario puede iniciar sesión (ni admin ni clientes).
- El endpoint de foto de perfil (`/api/usuarios/perfil/foto`) requiere autenticación cookie, por lo que tampoco se puede probar completo.
- El registro (`/api/usuarios/registrarUsuario`) firma tokens también, así que fallará igual.

---

## ERROR-002: Clave de respuesta inconsistente en login/registro

**Fecha detectado:** 2026-10-19  
**Severidad:** Media (UX rota)  
**Estado:** Documentado, pendiente de corrección

### Descripción
El controlador responde con clave `message`:
```js
res.status(401).json({ message: "El email o la contraseña es incorrecto." });
res.status(200).json({ message: "usuario validado", ... });
res.status(201).json({ message: "Registro exitoso..." });
```

Pero `frontend/js/login.js` lee `confirmBackend.mensaje` en 4 sitios (líneas 196, 209, 265, 270). Resultado: `undefined` se pinta en el toast/alerta.

### Archivos afectados
- `frontend/js/login.js` (único consumidor de `iniciarsession` y `registrarUsuario`)

### Decisión de corrección
Cambiar las 4 lecturas en `login.js` de `.mensaje` a `.message`. Es menos riesgo que tocar ~10 respuestas del controlador usadas por otras partes.

---

## Plan de corrección (tarea aparte)

### Paso 1 — Generar secretos seguros ✅ HECHO
> El usuario ya agregó `SECRETO_JWT_ACCESS` y `SECRETO_JWT_REFRESH` al `.env`.
> Verificado: `POST /api/usuarios/iniciarsession` con `admin / 123456` → **200**.
> Con esto el ERROR-001 queda cerrado y el flujo de adopción (que requiere
> cookie) se pudo probar de punta a punta.

Valores de referencia (ejecutar dos veces, con valores **distintos**):
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Agregar a `backend/.env`:
```
SECRETO_JWT_ACCESS=<primer resultado>
SECRETO_JWT_REFRESH=<segundo resultado>
```
> Si son iguales, un refresh token serviría como access token (riesgo de seguridad).

### Paso 2 — Corregir `frontend/js/login.js`
Cambiar 4 ocurrencias:
- L196: `confirmBackend.mensaje` → `confirmBackend.message`
- L209: `confirmBackend.mensaje` → `confirmBackend.message`
- L265: `confirmRegistro.mensaje` → `confirmRegistro.message`
- L270: `confirmRegistro.mensaje` → `confirmRegistro.message`

### Paso 3 — Verificación completa
1. Levantar backend.
2. Login con `admin / 123456` → 200, cookie `token_veterinaria` seteada.
3. Probar contraseña incorrecta → 401 con mensaje legible (no "undefined").
4. Probar endpoint de foto (`/perfil/foto`) con los 3 casos:
   - Sin cookie → 401.
   - Archivo no imagen → 400 con `mensaje` del filtro multer.
   - Imagen > 5 MB → 400 con `mensaje` de límite.
   - Imagen válida → 200, URL Cloudinary, cache-busting `?v=timestamp`.
   - Segunda subida → reemplaza asset en Cloudinary (mismo `public_id`), no crea duplicado.

### Notas
- El usuario indicó que las credenciales del `.env` se compartirán después; **no inventar valores**.
- La corrección del ERROR-002 es independiente y puede hacerse antes o después.