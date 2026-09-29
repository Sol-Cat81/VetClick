async function cargarPersonal() {
  const configuracion = [
    ['empleados', 'personal/empleados', row => `<tr><td>${escaparHtml(row.id_empleado)}</td><td><strong>${escaparHtml(row.nombre)} ${escaparHtml(row.apellido)}</strong></td><td>${escaparHtml(row.rol)}</td><td>${escaparHtml(row.telefono)}</td><td>${escaparHtml(row.sucursal)}</td></tr>`],
    ['veterinarios', 'personal/veterinarios', row => `<tr><td>${escaparHtml(row.id_veterinario)}</td><td>${escaparHtml(row.veterinario)}</td><td>${escaparHtml(row.especialidad)}</td><td>#${escaparHtml(row.id_empleado)}</td></tr>`],
    ['usuarios', 'personal/usuarios', row => `<tr><td>${escaparHtml(row.id_usuario)}</td><td>${escaparHtml(row.username)}</td><td>${escaparHtml(row.email)}</td><td>${escaparHtml(row.nombre)}</td><td><span class="status ${row.activo ? 'success' : 'warning'}">${row.activo ? 'Activo' : 'Inactivo'}</span></td></tr>`],
    // Los roles de empleado se listan junto al formulario que los crea.
    ['roles-empleados', 'personal/roles', row => `<article class="card info-card" data-modal-entity="rol"><h3>${escaparHtml(row.nombre)}</h3><div class="info-row"><span>ID del rol</span><b>${escaparHtml(row.id_rol_empleado)}</b></div></article>`]
  ];
  for (const [panel, endpoint, render] of configuracion) {
    try {
      const target = document.querySelector(`#${panel}-table tbody`) || document.querySelector(`#${panel}-list`);
      if (!target) continue;
      const rows = await obtenerDatos(endpoint);
      target.innerHTML = rows.map(render).join('');
    } catch (error) { informarErrorCarga(endpoint, error); }
  }
  try {
    const [rolesUsuario, permisos] = await Promise.all([
      obtenerDatos('personal/rolesusuario'),
      obtenerDatos('personal/permisos')
    ]);
    // Se reemplaza el contenido completo: el panel se repinta en cada cambio de pestaña.
    const container = document.querySelector('#roles-list');
    if (container) {
      const tarjetasRoles = rolesUsuario.map(rol => `<article class="card info-card" data-modal-entity="rol de usuario" data-id="${escaparHtml(rol.id_rol_usuario)}"><h3>${escaparHtml(rol.nombre)}</h3><div class="info-row"><span>ID del rol</span><b>${escaparHtml(rol.id_rol_usuario)}</b></div></article>`).join('');
      const tarjetaPermisos = `<article class="card info-card" data-modal-entity="permiso"><h3>Permisos definidos</h3>${permisos.map(permiso => `<div class="info-row"><span>${escaparHtml(permiso.id_permiso)}</span><b>${escaparHtml(permiso.nombre)}</b><small>${escaparHtml(permiso.descripcion || '')}</small></div>`).join('')}</article>`;
      container.innerHTML = tarjetasRoles + tarjetaPermisos;
    }
    // Rellena las casillas del modal de rol con los permisos disponibles.
    const casillas = document.getElementById('rol-usuario-permisos');
    if (casillas) {
      casillas.innerHTML = permisos.map(permiso => `<label class="permiso-check"><input type="checkbox" data-permiso-check value="${escaparHtml(permiso.id_permiso)}"><span>${escaparHtml(permiso.nombre)}<small>${escaparHtml(permiso.descripcion || '')}</small></span></label>`).join('');
    }
  } catch (error) { informarErrorCarga('personal/rolesusuario', error); }
}
