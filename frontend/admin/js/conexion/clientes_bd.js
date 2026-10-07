// Guardamos el objeto completo de cada registro para poder rellenar los modales
// de edición y el detalle sin depender del texto visible de la tabla (las claves
// foráneas y los campos anidados no se muestran en pantalla).
const clientesPorId            = new Map();
const mascotasPorId            = new Map();
const direccionesPorId         = new Map();
const especiesPorId            = new Map();
const razasPorId               = new Map();
const adopcionesPorId          = new Map();
const mascotasAdopcionPorId    = new Map();

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

function guardarEnRegistro(mapa, filas, campoId){
  mapa.clear();
  (filas || []).forEach(fila => mapa.set(String(fila[campoId]), fila));
}

function guardarClientesEnRegistro(clientes){
  guardarEnRegistro(clientesPorId, clientes, 'id_cliente');
}

function invalidarClientesCargados(){
  clientesDisponibles = null;
  solicitudClientes = null;
  clientesPorId.clear();
  mascotasPorId.clear();
  direccionesPorId.clear();
  especiesPorId.clear();
  razasPorId.clear();
  adopcionesPorId.clear();
  mascotasAdopcionPorId.clear();
}

// Busca la etiqueta de un registro dentro de admin/opciones.
// Los inputs de relación son datalist: hay que escribir la etiqueta, no el id.
async function etiquetaDeRelacion(opciones, relacion, id){
  const registro = (opciones[relacion] || []).find(item => String(item.id) === String(id));
  return registro ? registro.etiqueta : '';
}

async function opcionesParaEditar(){
  try{
    return await obtenerOpcionesRelaciones();
  }catch(error){
    console.warn('No se pudieron cargar las relaciones para editar:', error);
    return {};
  }
}

function avisarRegistroFaltante(entidad, id){
  console.warn(`No se encontró ${entidad} en el registro local:`, id);
}

// Rellena el par input-texto / hidden-id de los datalist de relación.
async function asignarRelacion(opciones, form, nombreTexto, nombreId, relacion, id){
  const campoTexto = form.elements[nombreTexto];
  const campoId = form.elements[nombreId];
  if(!campoTexto || !campoId) return;
  campoId.value = id ?? '';
  campoTexto.value = id ? await etiquetaDeRelacion(opciones, relacion, id) : '';
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
    guardarClientesEnRegistro(clientes);
    tbody.innerHTML = clientes.map(cliente => `
      <tr data-id="${escaparHtml(cliente.id_cliente)}">
        <td>${escaparHtml(cliente.id_cliente)}</td>
        <td>${escaparHtml(cliente.nombre || '—')}</td>
        <td>${escaparHtml(cliente.apellido || '—')}</td>
        <td><span class="status ${cliente.estado ? 'success' : 'warning'}">
          ${cliente.estado ? 'Activo' : 'Inactivo'}
        </span></td>
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

  const modal = formularioCliente.closest('[data-admin-modal]');
  const idCliente = Number(formularioCliente.querySelector('[name="id_cliente"]')?.value || 0);
  const editando = modal?.dataset.action === 'edit' && idCliente > 0;

  const idUsuario = formularioCliente.querySelector('[name="id_usuario"]')?.value;
  const datos = {
    nombre: formularioCliente.nombre.value.trim(),
    apellido: formularioCliente.apellido.value.trim(),
    telefono: formularioCliente.telefono.value.trim(),
    estado: formularioCliente.estado.value === '1' ? 1 : 0
  };

  // Al crear el usuario es obligatorio; al editar solo lo mandamos si el datalist
  // quedó con algo escrito, para no romper la relación si el campo no se tocó.
  if (!editando || idUsuario){
    datos.id_usuario = Number(idUsuario || 0);
  }

  if (!datos.nombre || !datos.apellido){
    alert('El nombre y el apellido son obligatorios.');
    return;
  }
  if (!editando && (!Number.isInteger(datos.id_usuario) || datos.id_usuario <= 0)) {
    alert('Selecciona un usuario de las sugerencias.');
    formularioCliente.querySelector('[data-relation="usuarios"]')?.focus();
    return;
  }

  try{
    const respuesta = await fetch(
      editando ? `${API_BASE_URL}/clientes/${idCliente}` : `${API_BASE_URL}/clientes`,
      {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      }
    );

    // Leemos el cuerpo para mostrar el mensaje real del backend (400, 404, etc.).
    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(cuerpo.mensaje || 'No se pudo guardar el cliente');
    }

    if (editando){
      // Actualizamos el registro en memoria sin volver a pedir toda la lista.
      clientesPorId.set(String(idCliente), {
        ...(clientesPorId.get(String(idCliente)) || {}),
        ...datos,
        id_cliente: idCliente
      });
    }

    console.log(cuerpo);
    alert(editando ? 'Cliente actualizado correctamente' : 'Cliente guardado correctamente');
    formularioCliente.reset();
    closeAdminModal();
    // El próximo envío vuelve a ser un alta, no una edición.
    delete modal.dataset.action;
    delete modal.dataset.idRegistro;
    invalidarOpcionesRelaciones();
    invalidarClientesCargados();
    cargarClientes();
  } catch (error) {
    console.error(error);
    alert(error.message || 'No se pudo guardar el cliente');
  }
});

async function cargarMascotas(){
  try{
    const mascotas = await obtenerDatos('clientes/mascotas');
    const tbody = document.querySelector('#mascotas-table tbody');
    if(!tbody) return;

    guardarEnRegistro(mascotasPorId, mascotas, 'id_mascota');
    tbody.innerHTML = (mascotas || []).map(mascota => `
      <tr data-id="${escaparHtml(mascota.id_mascota)}">
        <td>${escaparHtml(mascota.id_mascota)}</td>
        <td><strong>${escaparHtml(mascota.nombre)}</strong></td>
        <td>${escaparHtml(mascota.especie || '—')}</td>
        <td>${escaparHtml(mascota.propietario || '—')}</td>
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

  const modal = formularioMascota.closest('[data-admin-modal]');
  const idMascota = Number(modal?.dataset.idRegistro || 0);
  const editando = modal?.dataset.action === 'edit' && idMascota > 0;

  const nombreMascota = formularioMascota.paciente?.value?.trim() || formularioMascota.nombre?.value?.trim();
  const idCliente = Number(formularioMascota.querySelector('[name="id_cliente"]')?.value);
  const idEspecie = Number(formularioMascota.querySelector('[name="id_especie"]')?.value);
  const idRaza = Number(formularioMascota.querySelector('[name="id_raza"]')?.value);

  if (!nombreMascota) {
    alert('El nombre del paciente es obligatorio.');
    return;
  }
  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    alert('Selecciona un propietario de la lista de sugerencias.');
    formularioMascota.querySelector('[name="propietario"]')?.focus();
    return;
  }
  if (!Number.isInteger(idEspecie) || idEspecie <= 0 || !Number.isInteger(idRaza) || idRaza <= 0) {
    alert('Selecciona una especie y una raza de las sugerencias.');
    return;
  }

  const datos = {
    id_cliente: idCliente,
    nombre: nombreMascota,
    id_especie: idEspecie,
    id_raza: idRaza,
    sexo: formularioMascota.sexo?.value || 'MACHO',
    fecha_nacimiento: formularioMascota.fecha_nacimiento?.value || null,
    peso: Number(formularioMascota.peso?.value || 0),
    observaciones: formularioMascota.observaciones?.value?.trim() || ''
  };

  const url = editando
    ? `${API_BASE_URL}/clientes/mascotas/${idMascota}`
    : `${API_BASE_URL}/clientes/mascotas`;

  try{
    const respuesta = await fetch(url, {
      method: editando ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    // Leemos el cuerpo para mostrar el mensaje real del backend.
    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(cuerpo.mensaje || 'No se pudo guardar la mascota');
    }

    console.log(cuerpo);
    alert(editando ? 'Mascota actualizada correctamente' : 'Mascota guardada correctamente');

    formularioMascota.reset();
    closeAdminModal();
    // El próximo envío vuelve a ser un alta, no una edición.
    delete modal.dataset.action;
    delete modal.dataset.idRegistro;
    delete modal.dataset.readonly;
    invalidarOpcionesRelaciones();
    invalidarClientesCargados();
    cargarDatosDeVista();
  } catch (error) {
    console.error(error);
    alert(error.message || 'No se pudo guardar la mascota');
  }
});

async function cargarDirecciones(){
  try{
    const direcciones = await obtenerDatos('clientes/direcciones');
    const tbody = document.querySelector('#direcciones-table tbody');
    if(!tbody) return;

    guardarEnRegistro(direccionesPorId, direcciones, 'id_direccion');
    tbody.innerHTML = direcciones.map(direccion => `
      <tr data-id="${escaparHtml(direccion.id_direccion)}">
        <td>${escaparHtml(direccion.id_direccion)}</td>
        <td>${escaparHtml(direccion.nombre || '—')}</td>
        <td>${escaparHtml(direccion.tipo_direccion || '—')}</td>
        <td>${escaparHtml([direccion.calle, direccion.numero].filter(Boolean).join(' '))}</td>
      </tr>
    `).join('');
  }catch(error){
    informarErrorCarga('direcciones', error);
  }
}

async function cargarEspecies(){
  try{
    const especies = await obtenerDatos('clientes/especies');
    const tbody = document.querySelector('#especies-table tbody');
    if(!tbody) return;
    guardarEnRegistro(especiesPorId, especies, 'id_especie');
    tbody.innerHTML = (especies || []).map(especie => `
      <tr data-id="${escaparHtml(especie.id_especie)}">
        <td>${escaparHtml(especie.id_especie)}</td>
        <td>${escaparHtml(especie.nombre)}</td>
      </tr>
    `).join('');
  }catch(error){
    informarErrorCarga('clientes/especies', error);
  }
}

async function cargarRazas(){
  try{
    const razas = await obtenerDatos('clientes/razas');
    const tbody = document.querySelector('#razas-table tbody');
    if(!tbody) return;
    guardarEnRegistro(razasPorId, razas, 'id_raza');
    tbody.innerHTML = (razas || []).map(raza => `
      <tr data-id="${escaparHtml(raza.id_raza)}">
        <td>${escaparHtml(raza.id_raza)}</td>
        <td>${escaparHtml(raza.nombre)}</td>
        <td>${escaparHtml(raza.especie || '—')}</td>
      </tr>
    `).join('');
  }catch(error){
    informarErrorCarga('clientes/razas', error);
  }
}

async function cargarMascotasAdopcion(){
  try{
    const mascotas = await obtenerDatos('clientes/mascotas-adopcion');
    const tbody = document.querySelector('#mascotas-adopcion-table tbody');
    if(!tbody) return;
    guardarEnRegistro(mascotasAdopcionPorId, mascotas, 'id_mascota_adopcion');
    tbody.innerHTML = (mascotas || []).map(mascota => `
      <tr data-id="${escaparHtml(mascota.id_mascota_adopcion)}">
        <td>${escaparHtml(mascota.id_mascota_adopcion)}</td>
        <td>${escaparHtml(mascota.nombre)}</td>
        <td>${escaparHtml(mascota.especie || '—')}</td>
        <td>${escaparHtml(mascota.edad || '—')}</td>
        <td><span class="status ${mascota.estado === 'ADOPTADO' ? 'success' : 'warning'}">${escaparHtml(mascota.estado || '—')}</span></td>
      </tr>
    `).join('');
  }catch(error){
    informarErrorCarga('clientes/mascotas-adopcion', error);
  }
}

async function cargarAdopciones(){
  try{
    const adopciones = await obtenerDatos('clientes/adopciones');
    const tbody = document.querySelector('#adopciones-table tbody');
    if(!tbody) return;
    guardarEnRegistro(adopcionesPorId, adopciones, 'id_adopcion');
    tbody.innerHTML = (adopciones || []).map(adopcion => `
      <tr data-id="${escaparHtml(adopcion.id_adopcion)}">
        <td>${escaparHtml(adopcion.id_adopcion)}</td>
        <td>${escaparHtml(adopcion.cliente || '—')}</td>
        <td>${escaparHtml(adopcion.mascota || '—')}</td>
        <td>${escaparHtml(String(adopcion.fecha || '').slice(0, 10))}</td>
        <td>${escaparHtml(adopcion.estado || '—')}</td>
      </tr>
    `).join('');
  }catch(error){
    InformarErrorCarga('clientes/adopciones', error);
  }
}

// La invoca app.js (openAdminModal) cuando el modal de cliente se abre en modo
// edición. Usa el registro en memoria y no el texto de las celdas porque
// id_usuario no se muestra en la tabla y el estado se ve como "Activo/Inactivo".
async function prepararFormularioCliente(idCliente, modal){
  const cliente = clientesPorId.get(String(idCliente));
  if(!cliente){
    console.warn('No se encontró el cliente en el registro local:', idCliente);
    return;
  }

  const form = modal.querySelector('form');

  form.reset();
  form.elements.id_cliente.value = cliente.id_cliente ?? '';
  form.elements.nombre.value     = cliente.nombre ?? '';
  form.elements.apellido.value   = cliente.apellido ?? '';
  form.elements.telefono.value   = cliente.telefono ?? '';
  form.elements.estado.value     = cliente.estado ? '1' : '0';

  const campoIdUsuario = form.elements.id_usuario;
  const campoUsuario   = form.elements.usuario_busqueda;
  campoIdUsuario.value = cliente.id_usuario ?? '';

  // El input de usuario es un datalist: hay que escribir la etiqueta exacta
  // (username) que genera admin/opciones, no el id numérico.
  if (cliente.id_usuario){
    try{
      const opciones = await obtenerOpcionesRelaciones();
      const usuario = (opciones.usuarios || []).find(
        registro => String(registro.id) === String(cliente.id_usuario)
      );
      campoUsuario.value = usuario ? usuario.etiqueta : '';
    }catch(error){
      console.warn('No se pudo precargar el usuario del cliente:', error);
    }
  }else{
    campoUsuario.value = '';
  }

  // Cargamos las sugerencias del datalist para que se vean al hacer clic.
  try{ await prepararRelaciones(form); }catch(error){ /* no es crítico */ }
}

async function prepararFormularioMascota(id, modal){
  const mascota = mascotasPorId.get(String(id));
  if(!mascota){ avisarRegistroFaltante('mascota', id); return; }

  const form = modal.querySelector('form');
  form.reset();
  form.elements.nombre.value             = mascota.nombre ?? '';
  form.elements.sexo.value               = mascota.sexo ?? '';
  form.elements.peso.value               = mascota.peso ?? '';
  // MySQL devuelve la fecha con hora; el input type=date solo necesita el día.
  form.elements.fecha_nacimiento.value   = String(mascota.fecha_nacimiento || '').slice(0, 10);
  form.elements.observaciones.value      = mascota.observaciones ?? '';

  const opciones = await opcionesParaEditar();
  await asignarRelacion(opciones, form, 'especie_busqueda', 'id_especie', 'especies', mascota.id_especie);
  // La raza va después de la especie porque su datalist se filtra por
  // data-relation-parent="id_especie": al revés se borraría sola.
  await asignarRelacion(opciones, form, 'raza_busqueda', 'id_raza', 'razas', mascota.id_raza);

  // El propietario NO usa admin/opciones: su datalist se arma con
  // etiquetaPropietario() a partir de la lista de clientes.
  try{
    const cliente = (await obtenerClientesCargados()).find(
      registro => String(registro.id_cliente) === String(mascota.id_cliente)
    );
    form.elements.id_cliente.value = mascota.id_cliente ?? '';
    form.elements.propietario.value = cliente ? etiquetaPropietario(cliente) : '';
  }catch(error){
    console.warn('No se pudo precargar el propietario de la mascota:', error);
  }

  try{ await prepararRelaciones(form); }catch(error){ /* no es crítico */ }
}

async function prepararFormularioDireccion(id, modal){
  const direccion = direccionesPorId.get(String(id));
  if(!direccion){ avisarRegistroFaltante('dirección', id); return; }

  const form = modal.querySelector('form');
  form.reset();
  form.elements.tipo_direccion.value  = direccion.tipo_direccion ?? '';
  form.elements.calle.value           = direccion.calle ?? '';
  form.elements.numero.value         = direccion.numero ?? '';
  form.elements.piso.value           = direccion.piso ?? '';
  form.elements.departamento.value   = direccion.departamento ?? '';
  form.elements.localidad.value      = direccion.localidad ?? '';
  form.elements.provincia.value      = direccion.provincia ?? '';
  form.elements.codigo_postal.value  = direccion.codigo_postal ?? '';
  form.elements.referencia.value     = direccion.referencia ?? '';

  const opciones = await opcionesParaEditar();
  await asignarRelacion(opciones, form, 'cliente_busqueda', 'id_cliente', 'clientes', direccion.id_cliente);

  try{ await prepararRelaciones(form); }catch(error){ /* no es crítico */ }
}

async function prepararFormularioEspecie(id, modal){
  const especie = especiesPorId.get(String(id));
  if(!especie){ avisarRegistroFaltante('especie', id); return; }

  const form = modal.querySelector('form');
  form.reset();
  form.elements.nombre.value = especie.nombre ?? '';
}

async function prepararFormularioRaza(id, modal){
  const raza = razasPorId.get(String(id));
  if(!raza){ avisarRegistroFaltante('raza', id); return; }

  const form = modal.querySelector('form');
  form.reset();
  form.elements.nombre.value = raza.nombre ?? '';

  const opciones = await opcionesParaEditar();
  await asignarRelacion(opciones, form, 'especie_busqueda', 'id_especie', 'especies', raza.id_especie);

  try{ await prepararRelaciones(form); }catch(error){ /* no es crítico */ }
}

async function prepararFormularioAdopcion(id, modal){
  const adopcion = adopcionesPorId.get(String(id));
  if(!adopcion){ avisarRegistroFaltante('adopción', id); return; }

  const form = modal.querySelector('form');
  form.reset();
  form.elements.fecha.value       = String(adopcion.fecha || '').slice(0, 10);
  form.elements.estado.value      = adopcion.estado ?? '';
  form.elements.observacion.value = adopcion.observacion ?? '';

  const opciones = await opcionesParaEditar();
  await asignarRelacion(opciones, form, 'cliente_busqueda', 'id_cliente', 'clientes', adopcion.id_cliente);
  await asignarRelacion(opciones, form, 'mascota_adopcion_busqueda', 'id_mascota_adopcion',
                        'mascotasAdopcion', adopcion.id_mascota_adopcion);

  try{ await prepararRelaciones(form); }catch(error){ /* no es crítico */ }
}

async function prepararFormularioMascotaAdopcion(id, modal){
  const mascota = mascotasAdopcionPorId.get(String(id));
  if(!mascota){ avisarRegistroFaltante('mascota en adopción', id); return; }

  const form = modal.querySelector('form');
  form.reset();
  form.elements.nombre.value      = mascota.nombre ?? '';
  form.elements.edad.value        = mascota.edad ?? '';
  form.elements.sexo.value        = mascota.sexo ?? '';
  form.elements.descripcion.value = mascota.descripcion ?? '';
  form.elements.estado.value      = mascota.estado ?? '';

  const opciones = await opcionesParaEditar();
  await asignarRelacion(opciones, form, 'especie_busqueda', 'id_especie', 'especies', mascota.id_especie);

  try{ await prepararRelaciones(form); }catch(error){ /* no es crítico */ }
}

// ===================================================================
// Detalle: qué se ve en la tabla y qué aparece en el modal "Ver más".
// Las claves foráneas y los textos largos quedan fuera de la tabla para
// que las filas no se deformen; acá se muestran completos.
// ===================================================================
detalleEntidades.cliente = {
  titulo: 'Cliente',
  registro: clientesPorId,
  campos: [
    { campo: 'id_cliente', etiqueta: 'ID' },
    { campo: 'nombre', etiqueta: 'Nombre' },
    { campo: 'apellido', etiqueta: 'Apellido' },
    { campo: 'telefono', etiqueta: 'Teléfono' },
    { campo: 'estado', etiqueta: 'Estado', booleano: ['Inactivo', 'Activo'] },
    { campo: 'id_usuario', etiqueta: 'Usuario asociado', relacion: 'usuarios' }
  ]
};

detalleEntidades.mascota = {
  titulo: 'Mascota',
  registro: mascotasPorId,
  campos: [
    { campo: 'id_mascota', etiqueta: 'ID' },
    { campo: 'nombre', etiqueta: 'Paciente' },
    { campo: 'propietario', etiqueta: 'Propietario' },
    { campo: 'especie', etiqueta: 'Especie' },
    { campo: 'raza', etiqueta: 'Raza' },
    { campo: 'sexo', etiqueta: 'Sexo', enumeracion: ['MACHO', 'HEMBRA'], etiquetas: ['Macho', 'Hembra'] },
    { campo: 'fecha_nacimiento', etiqueta: 'Nacimiento', fecha: true },
    { campo: 'peso', etiqueta: 'Peso', sufijo: ' kg' },
    { campo: 'observaciones', etiqueta: 'Observaciones', texto: true }
  ]
};

detalleEntidades['dirección'] = {
  titulo: 'Dirección',
  registro: direccionesPorId,
  campos: [
    { campo: 'id_direccion', etiqueta: 'ID' },
    { campo: 'nombre', etiqueta: 'Cliente' },
    { campo: 'tipo_direccion', etiqueta: 'Tipo', enumeracion: ['DOMICILIO', 'COMERCIO'], etiquetas: ['Domicilio', 'Comercio'] },
    { campo: 'calle', etiqueta: 'Calle' },
    { campo: 'numero', etiqueta: 'Número' },
    { campo: 'piso', etiqueta: 'Piso' },
    { campo: 'departamento', etiqueta: 'Departamento' },
    { campo: 'localidad', etiqueta: 'Localidad' },
    { campo: 'provincia', etiqueta: 'Provincia' },
    { campo: 'codigo_postal', etiqueta: 'C.P.' },
    { campo: 'referencia', etiqueta: 'Referencia', texto: true }
  ]
};

detalleEntidades.especie = {
  titulo: 'Especie',
  registro: especiesPorId,
  campos: [
    { campo: 'id_especie', etiqueta: 'ID' },
    { campo: 'nombre', etiqueta: 'Especie' }
  ]
};

detalleEntidades.raza = {
  titulo: 'Raza',
  registro: razasPorId,
  campos: [
    { campo: 'id_raza', etiqueta: 'ID' },
    { campo: 'nombre', etiqueta: 'Raza' },
    { campo: 'especie', etiqueta: 'Especie' }
  ]
};

detalleEntidades['adopción'] = {
  titulo: 'Adopción',
  registro: adopcionesPorId,
  campos: [
    { campo: 'id_adopcion', etiqueta: 'ID' },
    { campo: 'cliente', etiqueta: 'Cliente' },
    { campo: 'mascota', etiqueta: 'Mascota' },
    { campo: 'fecha', etiqueta: 'Fecha', fecha: true },
    { campo: 'estado', etiqueta: 'Estado' },
    { campo: 'observacion', etiqueta: 'Observación', texto: true }
  ]
};

detalleEntidades['mascota en adopción'] = {
  titulo: 'Mascota en adopción',
  registro: mascotasAdopcionPorId,
  campos: [
    { campo: 'id_mascota_adopcion', etiqueta: 'ID' },
    { campo: 'nombre', etiqueta: 'Nombre' },
    { campo: 'especie', etiqueta: 'Especie' },
    { campo: 'edad', etiqueta: 'Edad' },
    { campo: 'sexo', etiqueta: 'Sexo', enumeracion: ['MACHO', 'HEMBRA'], etiquetas: ['Macho', 'Hembra'] },
    { campo: 'descripcion', etiqueta: 'Descripción', texto: true },
    { campo: 'estado', etiqueta: 'Estado', enumeracion: ['EN_ADOPCION', 'ADOPTADO'], etiquetas: ['En adopción', 'Adoptado'] }
  ]
};

// ===================================================================
// Guardado de las entidades que usan el endpoint generico /api/admin.
// Cubre el alta (POST) y la edicion (PUT) con un solo manejador.
// ===================================================================
const ENTIDADES_ADMIN = {
  'dirección': 'direccion',
  'especie': 'especie',
  'raza': 'raza',
  'adopción': 'adopcion',
  'mascota en adopción': 'mascotaAdopcion'
};

document.addEventListener('submit', async (e) => {
  const form = e.target.closest('[data-admin-modal-form]');
  if (!form) return;

  const modal = form.closest('[data-admin-modal]');
  const nombreEntidad = ENTIDADES_ADMIN[modal?.dataset.entity];
  if (!nombreEntidad) return;

  e.preventDefault();

  const entidad = modal.dataset.entity;
  const idRegistro = Number(modal.dataset.idRegistro || 0);
  const editando = modal.dataset.action === 'edit' && idRegistro > 0;

  if (modal.dataset.action === 'edit' && !editando) {
    alert('No se pudo identificar el registro a actualizar.');
    return;
  }

  // Recargamos las sugerencias para que los hidden de relación queden resueltos.
  try {
    await prepararRelaciones(form);
  } catch (error) {
    console.warn('No se pudieron preparar las relaciones:', error);
  }

  const relacionVacia = [...form.querySelectorAll('[data-relation][required]')]
    .find(input => !form.querySelector(`[data-relation-value="${input.dataset.relationField}"]`)?.value);
  if (relacionVacia) {
    const etiqueta = relacionVacia.closest('label')?.firstChild?.textContent?.trim() || 'una opción';
    alert(`Selecciona ${etiqueta} de la lista.`);
    relacionVacia.focus();
    return;
  }

  // Los campos *_busqueda son solo el input visible del datalist: el id real
  // viaja en el hidden. El modelo ignora los campos que no declara.
  const datos = Object.fromEntries(new FormData(form));

  const url = editando
    ? `${API_BASE_URL}/admin/${nombreEntidad}/${idRegistro}`
    : `${API_BASE_URL}/admin/${encodeURIComponent(nombreEntidad)}`;

  try {
    const respuesta = await fetch(url, {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(cuerpo.mensaje || `No se pudo guardar ${entidad}`);
    }

    console.log(cuerpo);
    alert(editando
      ? `${entidad} actualizado correctamente`
      : `${entidad} guardado correctamente`);

    form.reset();
    closeAdminModal();
    delete modal.dataset.action;
    delete modal.dataset.idRegistro;
    delete modal.dataset.readonly;
    invalidarOpcionesRelaciones();
    invalidarClientesCargados();
    cargarDatosDeVista();
  } catch (error) {
    console.error(error);
    alert(error.message || `No se pudo guardar ${entidad}`);
  }
});
