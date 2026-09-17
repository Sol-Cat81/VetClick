function cargarClientes(){
    fetch ('http://localhost:3000/api/clientes')
    .then(res =>{
        if (!res.ok){
            throw new Error (`Error HTTP ${res.status}`);
        }
        return res.json();
    })
    .then(data =>{
        const tbody = document.querySelector('#tablaClientes');
        if(!tbody){
            throw new Error ('no se encontro la tabla clientes')
        }

        tbody.innerHTML = '';

        data.forEach(cliente => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
              <td>${cliente.id_cliente}</td>
              <td>${cliente.nombre}</td>
              <td>${cliente.apellido}</td>
              <td>${cliente.email}</td>
              <td>${cliente.telefono}</td>
              <td>
                <span class="estado ${cliente.activo ? 'activo' : 'inactivo'}">
                  ${cliente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td class="acciones">
                <button class="btn-editar" title="Editar cliente">✎</button>
                <button class="btn-eliminar" title="Eliminar cliente">🗑</button>
                <button class="btn-mascotas" title="Ver mascotas">🐾 Mascotas</button>
              </td>
            `;
            tbody.appendChild(fila);
        });
        document.getElementById('clientesRegistrados').textContent = data.length;
    })
    .catch(err => console.error('error al cargar empleados:' , err));
}