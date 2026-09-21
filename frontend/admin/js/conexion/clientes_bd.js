async function cargarClientes(){
  try{
    const clientes = await obtenerDatos('clientes');
    const tbody = document.querySelector('#clientes-table tbody');
    if(!tbody) return;

    tbody.innerHTML = clientes.map(cliente => `
      <tr>
        <td>${escaparHtml(cliente.id_cliente)}</td>
        <td>${escaparHtml(cliente.nombre)}</td>
        <td>${escaparHtml(cliente.apellido)}</td>
        <td>${escaparHtml(cliente.telefono)}</td>
        <td><span class="status ${cliente.estado ? 'success' : 'warning'}">
          ${cliente.estado ? 'Activo' : 'Inactivo'}
        </span></td>
        <td><button class="btn btn-secondary" data-toast="Editar cliente #${escaparHtml(cliente.id_cliente)}">Editar</button></td>
      </tr>
    `).join('');
  }catch(error){
    informarErrorCarga('clientes', error);
  }
}

async function cargarMascotas(){
  try{
    const mascotas = await obtenerDatos('clientes/mascotas');
    const tbody = document.querySelector('#mascotas-table tbody');
    if(!tbody) return;

    tbody.innerHTML = mascotas.map(mascota => `
      <tr>
        <td>${escaparHtml(mascota.id_mascota)}</td>
        <td><strong>${escaparHtml(mascota.nombre)}</strong></td>
        <td>${escaparHtml(mascota.propietario)}</td>
        <td>${escaparHtml(mascota.especie)}</td>
        <td>${escaparHtml(mascota.raza)}</td>
        <td>${escaparHtml(mascota.sexo)}</td>
        <td>${escaparHtml(mascota.peso)} kg</td>
      </tr>
    `).join('');
  }catch(error){
    informarErrorCarga('mascotas', error);
  }
}

async function cargarDirecciones(){
  try{
    const direcciones = await obtenerDatos('clientes/direcciones');
    const tbody = document.querySelector('#direcciones-table tbody');
    if(!tbody) return;

    tbody.innerHTML = direcciones.map(direccion => `
      <tr>
        <td>${escaparHtml(direccion.id_direccion)}</td>
        <td>${escaparHtml(direccion.nombre)}</td>
        <td>${escaparHtml(direccion.tipo_direccion)}</td>
        <td>${escaparHtml(direccion.calle)}</td>
        <td>${escaparHtml(direccion.localidad)}</td>
        <td>${escaparHtml(direccion.codigo_postal)}</td>
        <td>${escaparHtml(direccion.referencia)}</td>
      </tr>
    `).join('');
  }catch(error){
    informarErrorCarga('direcciones', error);
  }
}
