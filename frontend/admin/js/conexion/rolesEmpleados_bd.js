function cargarRolesEmpleados() {
    fetch('http://localhost:3000/api/rol_empleados')
        .then(res => {
            if (!res.ok) {
                throw new Error(`Error HTTP ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            const tbody = document.querySelector('#tablaRolesEmpleados');
            if (!tbody) {
                throw new Error('No se encontró la tabla de empleados');
            }

            tbody.innerHTML = '';

            data.forEach(rol => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${rol.id_rol_empleado}</td>
                    <td>
                      <div class="rol-info">
                        <div class="avatar-rol">${rol.nombre.charAt(0)}</div>
                        <div>
                          <strong>${rol.nombre}</strong>
                          <span>ID Rol: ${rol.id_rol_empleado}</span>
                        </div>
                      </div>
                    </td>
                    <td class="acciones-roles-empleados">
                      <button class="btn-ver-rol-empleado" title="Ver rol">👁</button>
                      <button class="btn-editar-rol-empleado" title="Editar rol">✎</button>
                      <button class="btn-eliminar-rol-empleado" title="Eliminar rol">🗑</button>
                    </td>
                `;
                tbody.appendChild(fila);
            });
            document.getElementById('rolesEmpleadosRegistrados').textContent = data.length;
        })
        .catch(err => console.error('Error al cargar roles de empleados:', err));
}