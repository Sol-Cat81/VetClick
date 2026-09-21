async function cargarPersonal() {
  const configuracion = [
    ['empleados', 'personal/empleados', row => `<tr><td>${escaparHtml(row.id_empleado)}</td><td><strong>${escaparHtml(row.nombre)} ${escaparHtml(row.apellido)}</strong></td><td>${escaparHtml(row.rol)}</td><td>${escaparHtml(row.telefono)}</td><td>${escaparHtml(row.sucursal)}</td></tr>`],
    ['veterinarios', 'personal/veterinarios', row => `<tr><td>${escaparHtml(row.id_veterinario)}</td><td>${escaparHtml(row.veterinario)}</td><td>${escaparHtml(row.especialidad)}</td><td>#${escaparHtml(row.id_empleado)}</td></tr>`],
    ['usuarios', 'personal/usuarios', row => `<tr><td>${escaparHtml(row.id_usuario)}</td><td>${escaparHtml(row.username)}</td><td>${escaparHtml(row.email)}</td><td>${escaparHtml(row.nombre)}</td><td><span class="status ${row.activo ? 'success' : 'warning'}">${row.activo ? 'Activo' : 'Inactivo'}</span></td></tr>`],
    ['roles', 'personal/roles', row => `<article class="card info-card"><h3>${escaparHtml(row.nombre)}</h3><div class="info-row"><span>ID del rol</span><b>${escaparHtml(row.id_rol_empleado)}</b></div></article>`]
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
    const permisos = await obtenerDatos('personal/permisos');
    const container = document.querySelector('#roles-list');
    if (container) container.insertAdjacentHTML('beforeend', `<article class="card info-card"><h3>Permisos definidos</h3>${permisos.map(permiso => `<div class="info-row"><span>${escaparHtml(permiso.id_permiso)}</span><b>${escaparHtml(permiso.nombre)}</b></div>`).join('')}</article>`);
  } catch (error) { informarErrorCarga('personal/permisos', error); }
}
