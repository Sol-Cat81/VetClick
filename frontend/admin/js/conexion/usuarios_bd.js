function cargarUsuarios() {
    fetch('http://localhost:3000/api/usuarios')
        .then(res => {
            if (!res.ok) {
                throw new Error(`error HTTP ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            const tbody = document.querySelector('#tablaUsuarios');
            if (!tbody) {
                throw new Error('no se encontro tabla de usuario');
            }

            tbody.innerHTML = '';

            data.forEach(usur => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                  <td>${usur.id_usuario}</td>
                  <td>
                    <div class="usuario-info">
                      <div class="avatar-usuario">${usur.username.charAt(0).toUpperCase()}</div>
                      <div>
                        <strong>${usur.username}</strong>
                        <span>ID Usuario: ${usur.id_usuario}</span>
                      </div>
                    </div>
                  </td>
                  <td>${usur.email}</td>
                  <td>
                    <span class="rol-usuario">${usur.nombre}</span>
                  </td>
                  <td>
                    <span class="estado-usuario ${usur.activo ? 'estado-activo' : 'estado-inactivo'}">
                      ${usur.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td class="acciones-usuarios">
                    <button class="btn-ver-usuario" title="Ver usuario">👁</button>
                    <button class="btn-editar-usuario" title="Editar usuario">✎</button>
                    <button class="btn-eliminar-usuario" title="Eliminar usuario">🗑</button>
                  </td>
                `;
                tbody.appendChild(fila);
            });
            document.getElementById('usuariosRegistrados').textContent = data.length
        })
        .catch(err => console.error('error al cargar usuario', err));
}