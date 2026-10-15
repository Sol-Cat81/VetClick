// Objetos completos de cada registro, para que los modales de edicion los puedan
// leer sin depender del texto visible de la tabla. Sin esto, abrir "Editar" cae
// en el mapeo por indice de celda de app.js y los valores quedan mezclados.
const empleadosPorId    = new Map();
const veterinariosPorId  = new Map();
const usuariosPorId      = new Map();
const rolesEmpleadosPorId = new Map();
const rolesUsuarioPorId  = new Map();
const permisosPorId      = new Map();

function guardarEnRegistro(mapa, filas, campoId){
  mapa.clear();
  (filas || []).forEach(fila => mapa.set(String(fila[campoId]), fila));
}

async function cargarPersonal() {
  // Cada panel declara su tabla, su endpoint y de que columna sale el id.
  // El id viaja en data-id: sin el, enhanceAdminPanels() lo adivina por la
  // primera celda y el modal no encuentra el registro que debe precargar.
  const configuracion = [
    ['empleados', 'personal/empleados', 'id_empleado', empleadosPorId, row => `<tr data-id="${escaparHtml(row.id_empleado)}"><td>${escaparHtml(row.id_empleado)}</td><td><strong>${escaparHtml(row.nombre)} ${escaparHtml(row.apellido)}</strong></td><td>${escaparHtml(row.rol)}</td><td>${escaparHtml(row.telefono)}</td><td>${escaparHtml(row.sucursal)}</td></tr>`],
    ['veterinarios', 'personal/veterinarios', 'id_veterinario', veterinariosPorId, row => `<tr data-id="${escaparHtml(row.id_veterinario)}"><td>${escaparHtml(row.id_veterinario)}</td><td>${escaparHtml(row.veterinario || '(sin empleado asociado)')}</td><td>${escaparHtml(row.especialidad)}</td><td>${row.id_empleado ? `#${escaparHtml(row.id_empleado)}` : '—'}</td></tr>`],
    ['usuarios', 'personal/usuarios', 'id_usuario', usuariosPorId, row => `<tr data-id="${escaparHtml(row.id_usuario)}"><td>${escaparHtml(row.id_usuario)}</td><td>${escaparHtml(row.username)}</td><td>${escaparHtml(row.email)}</td><td>${escaparHtml(row.nombre)}</td><td><span class="status ${row.activo ? 'success' : 'warning'}">${row.activo ? 'Activo' : 'Inactivo'}</span></td></tr>`],
    // Los roles de empleado se listan junto al formulario que los crea.
    ['roles-empleados', 'personal/roles', 'id_rol_empleado', rolesEmpleadosPorId, row => `<tr data-id="${escaparHtml(row.id_rol_empleado)}"><td>${escaparHtml(row.id_rol_empleado)}</td><td><strong>${escaparHtml(row.nombre)}</strong></td></tr>`]
  ];
  for (const [panel, endpoint, campoId, registro, render] of configuracion) {
    try {
      const target = document.querySelector(`#${panel}-table tbody`) || document.querySelector(`#${panel}-list`);
      if (!target) continue;
      const rows = await obtenerDatos(endpoint);
      guardarEnRegistro(registro, rows, campoId);
      target.innerHTML = rows.map(render).join('');
    } catch (error) { informarErrorCarga(endpoint, error); }
  }
  try {
    const [rolesUsuario, permisos] = await Promise.all([
      obtenerDatos('personal/rolesusuario'),
      obtenerDatos('personal/permisos')
    ]);
    guardarEnRegistro(rolesUsuarioPorId, rolesUsuario, 'id_rol_usuario');
    guardarEnRegistro(permisosPorId, permisos, 'id_permiso');
    // Se reemplaza el contenido completo: el panel se repinta en cada cambio de pestaña.
    const rolesTableBody = document.querySelector('#roles-usuario-table tbody');
    const permisosTableBody = document.querySelector('#permisos-table tbody');
    if (rolesTableBody) {
      rolesTableBody.innerHTML = (rolesUsuario || []).map(rol => `<tr data-modal-entity="rol de usuario" data-id="${escaparHtml(rol.id_rol_usuario)}"><td>${escaparHtml(rol.id_rol_usuario)}</td><td><strong>${escaparHtml(rol.nombre)}</strong></td></tr>`).join('');
    }
    if (permisosTableBody) {
      permisosTableBody.innerHTML = (permisos || []).map(permiso => `<tr data-modal-entity="permiso" data-id="${escaparHtml(permiso.id_permiso)}"><td>${escaparHtml(permiso.id_permiso)}</td><td><strong>${escaparHtml(permiso.nombre)}</strong></td><td>${escaparHtml(permiso.descripcion || '')}</td></tr>`).join('');
    }
    // Rellena las casillas del modal de rol con los permisos disponibles.
    const casillas = document.getElementById('rol-usuario-permisos');
    if (casillas) {
      casillas.innerHTML = (permisos || []).map(permiso => `<label class="permiso-check"><input type="checkbox" data-permiso-check value="${escaparHtml(permiso.id_permiso)}"><span>${escaparHtml(permiso.nombre)}<small>${escaparHtml(permiso.descripcion || '')}</small></span></label>`).join('');
    }
  } catch (error) { informarErrorCarga('personal/rolesusuario', error); }
  if (typeof enhanceAdminPanels === 'function') enhanceAdminPanels();
  aplicarBloqueoBorrado();
}

// Que filas no se pueden eliminar, y por que. Los conteos llegan en el listado
// (`*_asociados`); enhanceAdminPanels() dibuja los botones pero es sincronico y
// no tiene esos datos, asi que el bloqueo se aplica despues, sobre el DOM ya
// montado. Se vuelve a aplicar en cada recarga, con lo que un borrado exitoso
// recalcula el estado de toda la tabla.
//
// Las claves son las ETIQUETAS de la UI, que es lo que declaran las tablas en
// data-modal-entity y lo que pone enhanceAdminPanels() en data-entity. El
// nombre de la API ("rolUsuario") no sirve aca: no aparece en ningun atributo
// del DOM.
//
// `requisitos`: condiciones de la propia fila, no de sus hijas. Es lo que
// impide borrar la ficha de un veterinario que ya quedo desasociada.
//
// `empleado` y `rol` no aparecen en bloqueantes: ya no se bloquean. Al empleado
// se le desasocia la ficha de veterinario, y al rol se le reasignan sus
// empleados en el modal.
//
// La fuente de verdad sigue siendo el backend: esto solo evita el click. Si
// alguien borra por otra via, el DELETE vuelve a responder 400 y el toast
// muestra el motivo.
const bloqueosBorrado = {
  'veterinario': {
    registro: () => veterinariosPorId,
    bloqueantes: [],
    requisitos: [{ campo: 'id_empleado', etiqueta: 'empleado asociado' }]
  },
  'usuario': {
    registro: () => usuariosPorId,
    bloqueantes: [
      { campo: 'empleados_asociados', etiqueta: 'empleado' },
      { campo: 'clientes_asociados', etiqueta: 'cliente' }
    ],
    requisitos: []
  },
  'rol': {
    registro: () => rolesEmpleadosPorId,
    bloqueantes: [],
    requisitos: [],
    // Aviso, no bloqueo: el modal va a pedir a que rol se reasignan.
    pista: 'Reasignará sus empleados a otro rol antes de borrar'
  },
  'rol de usuario': {
    registro: () => rolesUsuarioPorId,
    bloqueantes: [{ campo: 'usuarios_asociados', etiqueta: 'usuario' }],
    requisitos: []
  }
};

function aplicarBloqueoBorrado() {
  Object.entries(bloqueosBorrado).forEach(([entidad, config]) => {
    const { registro: mapa, bloqueantes, requisitos, pista } = config;
    const tabla = document.querySelector(`table[data-modal-entity="${entidad}"]`);
    if (!tabla) return;
    tabla.tBodies[0]?.querySelectorAll('tr').forEach(fila => {
      const boton = fila.querySelector('[data-row-action="delete"]');
      if (!boton) return;
      const filaRegistro = mapa().get(String(fila.dataset.id));

      const motivos = bloqueantes
        .map(({ campo, etiqueta }) => ({ etiqueta, cantidad: Number(filaRegistro?.[campo] || 0) }))
        .filter(({ cantidad }) => cantidad > 0)
        .map(({ etiqueta, cantidad }) => `tiene ${cantidad} ${etiqueta}${cantidad === 1 ? '' : 's'} asociado${cantidad === 1 ? '' : 's'}`);

      // Un requisito incumplido (id_empleado NULL) no tiene cantidad que
      // mostrar: se informa el nombre de lo que falta.
      const faltantes = (requisitos || [])
        .filter(({ campo }) => filaRegistro?.[campo] === null || filaRegistro?.[campo] === undefined)
        .map(({ etiqueta }) => `no tiene ${etiqueta}`);

      boton.disabled = motivos.length > 0 || faltantes.length > 0;
      const motivo = [...motivos, ...faltantes].join(' y ');

      // Un <button disabled> no dispara eventos, asi que su propio title no se
      // ve en ningun navegador. El motivo va en un envoltorio que si lo muestra.
      boton.removeAttribute('title');
      let envoltorio = boton.parentElement;
      if (envoltorio?.classList.contains('bloqueo-borrado')) {
        envoltorio.removeAttribute('title');
      } else {
        envoltorio = document.createElement('span');
        envoltorio.className = 'bloqueo-borrado';
        boton.parentNode.insertBefore(envoltorio, boton);
        envoltorio.appendChild(boton);
      }
      envoltorio.title = boton.disabled
        ? `No se puede eliminar: ${motivo}`
        : (pista || 'Eliminar este registro');
    });
  });
}

// ===================================================================
// De que columna del registro sale cada campo visible del modal.
// Los campos que no aparecen (la contraseña, que nunca se edita) se dejan vacios.
// ===================================================================
registrarFormulario('empleado', {
  nombre: 'nombre', apellido: 'apellido', telefono: 'telefono', direccion: 'direccion',
  rol_busqueda: 'id_rol_empleado', sucursal_busqueda: 'id_sucursal', usuario_busqueda: 'id_usuario'
}, empleadosPorId);

registrarFormulario('veterinario', {
  especialidad: 'especialidad', empleado_busqueda: 'id_empleado'
}, veterinariosPorId);

registrarFormulario('usuario', {
  username: 'username', email: 'email', rol_busqueda: 'id_rol_usuario', activo: 'activo'
}, usuariosPorId);

registrarFormulario('rol', { nombre: 'nombre' }, rolesEmpleadosPorId);

registrarFormulario('rol de usuario', { nombre: 'nombre' }, rolesUsuarioPorId);

registrarFormulario('permiso', { nombre: 'nombre', descripcion: 'descripcion' }, permisosPorId);