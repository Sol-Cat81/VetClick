async function cargarPersonal() {
  const configuracion = [
    ['empleados', 'personal/empleados', row => `<tr><td>${escaparHtml(row.id_empleado)}</td><td><strong>${escaparHtml(row.nombre)} ${escaparHtml(row.apellido)}</strong></td><td>${escaparHtml(row.rol)}</td><td>${escaparHtml(row.telefono)}</td><td>${escaparHtml(row.sucursal)}</td></tr>`],
    ['veterinarios', 'personal/veterinarios', row => `<tr><td>${escaparHtml(row.id_veterinario)}</td><td>${escaparHtml(row.veterinario)}</td><td>${escaparHtml(row.especialidad)}</td><td>#${escaparHtml(row.id_empleado)}</td></tr>`],
    ['usuarios', 'personal/usuarios', row => `<tr><td>${escaparHtml(row.id_usuario)}</td><td>${escaparHtml(row.username)}</td><td>${escaparHtml(row.email)}</td><td>${escaparHtml(row.nombre)}</td><td><span class="status ${row.activo ? 'success' : 'warning'}">${row.activo ? 'Activo' : 'Inactivo'}</span></td></tr>`],
    // Los roles de empleado se listan junto al formulario que los crea.
    ['roles-empleados', 'personal/roles', row => `<tr><td>${escaparHtml(row.id_rol_empleado)}</td><td><strong>${escaparHtml(row.nombre)}</strong></td></tr>`]
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
    const rolesTableBody = document.querySelector('#roles-usuario-table tbody');
    const permisosTableBody = document.querySelector('#permisos-table tbody');
    if (rolesTableBody) {
      rolesTableBody.innerHTML = rolesUsuario.map(rol => `<tr data-modal-entity="rol de usuario" data-id="${escaparHtml(rol.id_rol_usuario)}"><td>${escaparHtml(rol.id_rol_usuario)}</td><td><strong>${escaparHtml(rol.nombre)}</strong></td></tr>`).join('');
    }
    if (permisosTableBody) {
      permisosTableBody.innerHTML = (permisos || []).map(permiso => `<tr data-modal-entity="permiso" data-id="${escaparHtml(permiso.id_permiso)}"><td>${escaparHtml(permiso.id_permiso)}</td><td><strong>${escaparHtml(permiso.nombre)}</strong></td><td>${escaparHtml(permiso.descripcion || '')}</td></tr>`).join('');
    }
    // Rellena las casillas del modal de rol con los permisos disponibles.
    const casillas = document.getElementById('rol-usuario-permisos');
    if (casillas) {
      casillas.innerHTML = permisos.map(permiso => `<label class="permiso-check"><input type="checkbox" data-permiso-check value="${escaparHtml(permiso.id_permiso)}"><span>${escaparHtml(permiso.nombre)}<small>${escaparHtml(permiso.descripcion || '')}</small></span></label>`).join('');
    }
  } catch (error) { informarErrorCarga('personal/rolesusuario', error); }
  if (typeof enhanceAdminPanels === 'function') enhanceAdminPanels();
}
