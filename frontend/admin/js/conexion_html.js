// URL base del backend. Si el servidor cambia de puerto, se modifica solo aquí.
const API_BASE_URL = 'http://localhost:3000/api';

// Convierte valores recibidos desde la API en texto seguro para insertar en HTML.
// Así evitamos que un dato almacenado en la base se interprete como una etiqueta.
function escaparHtml(valor){
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Función común para consultar cualquier endpoint GET de la API.
async function obtenerDatos(endpoint){
  const respuesta = await fetch(`${API_BASE_URL}/${endpoint}`);
  if(!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status} en /${endpoint}`);
  return respuesta.json();
}

// Muestra un error con el endpoint que falló, sin ocultar silenciosamente el problema.
function informarErrorCarga(endpoint, error){
  console.error(`No se pudieron cargar los datos de ${endpoint}:`, error);
}

// Obtiene los clientes y reemplaza las filas de la tabla de clientes.
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

// Obtiene las mascotas y reemplaza las filas de la tabla de mascotas.
async function cargarMascotas(){
  try{
    const mascotas = await obtenerDatos('mascotas');
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

// Obtiene empleados, incluyendo el nombre del rol y de la sucursal.
async function cargarEmpleados(){
  try{
    const empleados = await obtenerDatos('empleados');
    const tbody = document.querySelector('#empleados-table tbody');
    if(!tbody) return;

    tbody.innerHTML = empleados.map(empleado => `
      <tr>
        <td>${escaparHtml(empleado.id_empleado)}</td>
        <td><strong>${escaparHtml(empleado.nombre)} ${escaparHtml(empleado.apellido)}</strong></td>
        <td>${escaparHtml(empleado.rol)}</td>
        <td>${escaparHtml(empleado.telefono)}</td>
        <td>${escaparHtml(empleado.sucursal)}</td>
      </tr>
    `).join('');
  }catch(error){
    informarErrorCarga('empleados', error);
  }
}

// Obtiene los usuarios sin pedir ni mostrar password_hash.
async function cargarUsuarios(){
  try{
    const usuarios = await obtenerDatos('usuarios');
    const tbody = document.querySelector('#usuarios-table tbody');
    if(!tbody) return;

    tbody.innerHTML = usuarios.map(usuario => `
      <tr>
        <td>${escaparHtml(usuario.id_usuario)}</td>
        <td>${escaparHtml(usuario.username)}</td>
        <td>${escaparHtml(usuario.email)}</td>
        <td>${escaparHtml(usuario.nombre)}</td>
        <td><span class="status ${usuario.activo ? 'success' : 'warning'}">
          ${usuario.activo ? 'Activo' : 'Inactivo'}
        </span></td>
      </tr>
    `).join('');
  }catch(error){
    informarErrorCarga('usuarios', error);
  }
}

// Obtiene los roles de empleados y los representa como tarjetas sencillas.
async function cargarRolesEmpleados(){
  try{
    const roles = await obtenerDatos('rol_empleados');
    const contenedor = document.querySelector('#roles-empleados-list');
    if(!contenedor) return;

    contenedor.innerHTML = roles.map(rol => `
      <article class="card info-card">
        <h3>${escaparHtml(rol.nombre)}</h3>
        <div class="info-row">
          <span>ID del rol</span>
          <b>${escaparHtml(rol.id_rol_empleado)}</b>
        </div>
      </article>
    `).join('');
  }catch(error){
    informarErrorCarga('rol_empleados', error);
  }
}
