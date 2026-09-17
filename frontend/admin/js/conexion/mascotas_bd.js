function cargarMascotas(){
    fetch('http://localhost:3000/api/mascotas')
    .then(res =>{
        if(!res.ok){
            throw new Error(`Error HTTP ${res.status}`);
        }
        return res.json();
    })
    .then(data =>{
        const tbody = document.querySelector('#tablaMascotas');
        if(!tbody){
            throw new Error('no se encontro la tabla de empleados')
        }

        tbody.innerHTML = '';

        data.forEach(mascota => {
            const fila = document.createElement('tr');
            fila.innerHTML =  `
              <td>${mascota.id_mascota}</td>
              <td>
                <div class="mascota-info">
                  <div class="avatar-mascota">🐾</div>
                  <strong>${mascota.nombre}</strong>
                </div>
              </td>
              <td>${mascota.especie}</td>
              <td>${mascota.raza}</td>
              <td>${mascota.sexo}</td>
              <td>${mascota.fecha_nacimiento}</td>
              <td>${mascota.peso} kg</td>
              <td>
                <span class="propietario">${mascota.propietario}</span>
              </td>
              <td class="acciones-mascota">
                <button class="btn-ver-mascota" title="Ver ficha">👁</button>
                <button class="btn-editar-mascota" title="Editar mascota">✎</button>
                <button class="btn-eliminar-mascota" title="Eliminar mascota">🗑</button>
              </td>
            `;
            tbody.appendChild(fila);
        });
        document.getElementById('mascotasRegistradas').textContent = data.length;
    })
    .catch(err => console.error('error al cargar empleados', err));
}