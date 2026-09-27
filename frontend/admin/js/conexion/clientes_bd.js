let clientesDisponibles = null;
let solicitudClientes = null;

async function obtenerClientesCargados(){
  if (clientesDisponibles) return clientesDisponibles;

  if (!solicitudClientes) {
    solicitudClientes = obtenerDatos('clientes')
      .then(clientes => {
        clientesDisponibles = clientes;
        return clientes;
      })
      .catch(error => {
        solicitudClientes = null;
        throw error;
      });
  }

  return solicitudClientes;
}

function etiquetaPropietario(cliente){
  return `${cliente.nombre} ${cliente.apellido} (ID: ${cliente.id_cliente})`;
}

function actualizarSugerenciasPropietarios(clientes){
  const lista = document.querySelector('#propietarios-sugeridos');
  if (!lista) return;

  lista.innerHTML = clientes.map(cliente =>
    `<option value="${escaparHtml(etiquetaPropietario(cliente))}"></option>`
  ).join('');
}

function actualizarIdPropietario(input){
  const campoId = input.form.querySelector('[name="id_cliente"]');
  if (!campoId) return;

  const cliente = (clientesDisponibles || []).find(
    registro => etiquetaPropietario(registro) === input.value
  );
  campoId.value = cliente ? cliente.id_cliente : '';
}

document.addEventListener('focusin', async event => {
  const input = event.target.closest('[data-owner-autocomplete]');
  if (!input) return;

  try {
    actualizarSugerenciasPropietarios(await obtenerClientesCargados());
    actualizarIdPropietario(input);
  } catch (error) {
    informarErrorCarga('clientes para propietarios', error);
  }
});

document.addEventListener('input', event => {
  const input = event.target.closest('[data-owner-autocomplete]');
  if (input) actualizarIdPropietario(input);
});

document.addEventListener('change', event => {
  const input = event.target.closest('[data-owner-autocomplete]');
  if (input) actualizarIdPropietario(input);
});

async function cargarClientes(){
  try{
    const clientes = await obtenerClientesCargados();
    const tbody = document.querySelector('#clientes-table tbody');
    if(!tbody) return;

    actualizarSugerenciasPropietarios(clientes);
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
    id_usuario: Number(formularioCliente.querySelector('[name="id_usuario"]')?.value),
    telefono: formularioCliente.telefono.value.trim(),
    estado: formularioCliente.estado.value === '1' ? 1 : 0
  };
  if (!Number.isInteger(datos.id_usuario) || datos.id_usuario <= 0) {
    alert('Selecciona un usuario de las sugerencias.');
    formularioCliente.querySelector('[data-relation="usuarios"]')?.focus();
    return;
  }

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
    invalidarOpcionesRelaciones();
    clientesDisponibles = null;
    solicitudClientes = null;
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
  const idCliente = Number(formularioMascota.querySelector('[name="id_cliente"]')?.value);
  const idEspecie = Number(formularioMascota.querySelector('[name="id_especie"]')?.value);
  const idRaza = Number(formularioMascota.querySelector('[name="id_raza"]')?.value);
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    alert('Selecciona un propietario de la lista de sugerencias.');
    formularioMascota.querySelector('[name="propietario"]')?.focus();
    return;
  }
  if (!Number.isInteger(idEspecie) || idEspecie <= 0 || !Number.isInteger(idRaza) || idRaza <= 0) {
    alert('Selecciona una especie y una raza de las sugerencias.');
    return;
  }

  const sexo = formularioMascota.sexo?.value || 'MACHO';
  const peso = Number(formularioMascota.peso?.value || 0);

  const datos = {
    id_cliente: idCliente,
    nombre: nombreMascota,
    id_especie: idEspecie,
    id_raza: idRaza,
    sexo,
    fecha_nacimiento: formularioMascota.fecha_nacimiento?.value || null,
    peso
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
    invalidarOpcionesRelaciones();
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
