function cargarEmpleados() {
  fetch('http://localhost:3000/api/empleados')
    .then(res => {
      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const tbody = document.querySelector('#tablaEmpleados');
      if (!tbody) {
        throw new Error('No se encontró la tabla de empleados');
      }

      tbody.innerHTML = '';

      data.forEach(emp => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
        <td>${emp.id_empleado}</td>
        <td>
          <div class="empleado-info">
            <div class="avatar-empleado">${emp.nombre.charAt(0)}</div>
            <div>
              <strong>${emp.nombre} ${emp.apellido}</strong>
              <span>ID Empleado: ${emp.id_empleado}</span>
            </div>
          </div>
        </td>
        <td><span class="rol-empleado">${emp.rol}</span></td>
        <td>${emp.telefono}</td>
        <td>
          <div class="sucursal-empleado">
            <strong>${emp.sucursal}</strong>
          </div>
        </td>
        <td class="acciones-empleados">
          <button class="btn-ver-empleado">👁</button>
          <button class="btn-editar-empleado">✎</button>
          <button class="btn-eliminar-empleado">🗑</button>
        </td>
      `;
        tbody.appendChild(fila);
      });

      document.getElementById('empleadosRegistrados').textContent = data.length;
    })
    .catch(err => console.error('Error al cargar empleados:', err));
}