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

document.addEventListener('submit', async (e)=>{
  const formularioCliente = e.target.closest('[data-admin-modal="cliente"] form');
  if (!formularioCliente) return;

  e.preventDefault();

  const datos = {
    nombre: formularioCliente.nombre.value.trim(),
    apellido: formularioCliente.apellido.value.trim(),
    telefono: formularioCliente.telefono.value.trim(),
    estado: formularioCliente.estado.value === 'Activo' ? 1 : 0
  };

  try{
    const respuesta = await fetch('http://localhost:3000/api/clientes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    if (!respuesta.ok) {
      throw new Error('error al guardar');
    }

    const resultado = await respuesta.json();
    console.log(resultado);
    alert('Cliente guardado correctamente');
    formularioCliente.reset();
    cargarClientes();
  } catch (error) {
    console.error(error);
    alert('No se pudo guardar el cliente');
  }
});

async function cargarMascotas(){
  try{
    const mascotas = await obtenerDatos('clientes/mascotas');
    const tbody = document.querySelector('#mascotas-table tbody');
    if(!tbody) return;

    tbody.innerHTML = (mascotas || []).map(mascota => `
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

document.addEventListener('submit', async (e)=>{
  const formularioMascota = e.target.closest('[data-admin-modal="mascota"] form');
  if (!formularioMascota) return;

  e.preventDefault();

  const nombreMascota = formularioMascota.paciente?.value?.trim() || formularioMascota.nombre?.value?.trim();
  const propietario = formularioMascota.propietario?.value?.trim() || '';
  const sexo = formularioMascota.sexo?.value || 'MACHO';
  const peso = Number(formularioMascota.peso?.value || 0);

  const datos = {
    id_cliente: 1,
    nombre: nombreMascota,
    id_especie: 1,
    id_raza: 1,
    sexo,
    fecha_nacimiento: new Date().toISOString().slice(0, 10),
    peso,
    observaciones: propietario ? `Propietario: ${propietario}` : ''
  };

  try{
    const respuesta = await fetch('http://localhost:3000/api/clientes/mascotas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    if (!respuesta.ok) {
      throw new Error('error al guardar');
    }

    const resultado = await respuesta.json();
    console.log(resultado);
    alert('Mascota guardada correctamente');
    formularioMascota.reset();
    cargarMascotas();
  } catch (error) {
    console.error(error);
    alert('No se pudo guardar la mascota');
  }
});

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
