// Relaciona cada nombre usado en el hash de la URL con su archivo HTML.
// Por ejemplo, #clientes carga views/clientes.html dentro del contenedor principal.
const viewFiles = {
  dashboard: 'views/dashboard.html',
  clientes: 'views/clientes.html',
  clinica: 'views/clinica.html',
  catalogo: 'views/catalogo.html',
  inventario: 'views/inventario.html',
  ventas: 'views/ventas.html',
  personal: 'views/personal.html'
};

// Guardamos referencias a elementos que existen directamente en index.html.
const appContent = document.getElementById('app-content');
const toast = document.getElementById('toast');

// Muestra un mensaje temporal en la parte inferior de la pantalla.
function showToast(message){
  // Cambiamos el texto del elemento visual.
  toast.textContent = message;
  // La clase show hace visible el mensaje mediante CSS.
  toast.classList.add('show');
  // Si ya había un temporizador, lo cancelamos para reiniciar la cuenta.
  clearTimeout(showToast.timer);
  // Ocultamos el mensaje después de 2,4 segundos.
  showToast.timer = setTimeout(()=>toast.classList.remove('show'), 2400);
}

// Marca visualmente en el menú la sección que está abierta.
function activateNav(view){
  // Recorremos todos los enlaces del menú lateral.
  document.querySelectorAll('.nav-item').forEach(item=>{
    // Solo el enlace cuyo data-view coincide queda activo.
    item.classList.toggle('active', item.dataset.view === view);
  });
}

// Descarga una vista HTML y la inserta en #app-content.
async function loadView(view){
  // Si la vista no existe, usamos el dashboard como alternativa segura.
  const file = viewFiles[view] || viewFiles.dashboard;
  try{
    // fetch solicita el archivo al servidor local.
    const response = await fetch(file);
    // Una respuesta HTTP 404/500 no lanza una excepción automáticamente.
    if(!response.ok) throw new Error('No se pudo cargar la vista');
    // Convertimos la respuesta HTTP en texto HTML.
    appContent.innerHTML = await response.text();
    // Actualizamos el enlace activo del menú.
    activateNav(view);
    // Conectamos botones, filtros y datos después de insertar el HTML.
    initView();
  }catch(error){
    // Mostramos un mensaje entendible si falla la descarga o la inicialización.
    appContent.innerHTML = `
      <section class="card" style="padding:32px">
        <h2>No se pudo cargar esta sección</h2>
        <p style="color:var(--muted)">Si estás abriendo index.html directamente con file://, usa un servidor local (por ejemplo Live Server) para permitir fetch de las vistas.</p>
      </section>`;
    // Dejamos el detalle técnico disponible en la consola para depuración.
    console.error(error);
  }
}

// Inicializa los controles de la vista que acaba de cargarse.
function initView(){
  // Busca la barra secundaria existente en algunas vistas.
  const subnav = document.querySelector('.subnav');
  if(subnav){
    // Estos botones cambian entre paneles sin descargar otro archivo.
    const buttons = subnav.querySelectorAll('button[data-section]');
    const panels = document.querySelectorAll('[data-panel]');
    buttons.forEach(button=>{
      button.addEventListener('click', ()=>{
        // Quitamos el estado activo de todos los botones.
        buttons.forEach(b=>b.classList.remove('active'));
        // Activamos el botón seleccionado.
        button.classList.add('active');
        // Mostramos solo el panel cuyo data-panel coincide.
        panels.forEach(panel=>{
          panel.hidden = panel.dataset.panel !== button.dataset.section;
        });
        // Al cambiar de panel volvemos a enlazar sus datos si corresponde.
        cargarDatosDeVista();
      });
    });
  }

  // Una vista puede tener varios buscadores, por ejemplo clientes y direcciones.
  document.querySelectorAll('[data-table-filter]').forEach(search=>{
    // El valor del atributo indica qué tabla debe filtrar.
    const tableSelector = search.dataset.tableFilter;
    const table = tableSelector ? document.querySelector(tableSelector) : null;
    // Si la tabla no existe, informamos el problema y no registramos un evento inválido.
    if(!table){
      console.error(`No se encontró la tabla indicada por: ${tableSelector}`);
      return;
    }
    search.addEventListener('input', ()=>{
      // Normalizamos el texto para que la búsqueda no dependa de mayúsculas.
      const term = search.value.toLowerCase().trim();
      table.querySelectorAll('tbody tr').forEach(row=>{
        // Ocultamos las filas que no contienen el texto buscado.
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
    });
  });

  // Carga los registros de la API cuando la vista ya está en el DOM.
  cargarDatosDeVista();
}

// Decide qué endpoints debe cargar según las tablas presentes en la vista actual.
function cargarDatosDeVista(){
  if(document.querySelector('#clientes-table')) cargarClientes();
  if(document.querySelector('#mascotas-table')) cargarMascotas();
  if(document.querySelector('#empleados-table')) cargarEmpleados();
  if(document.querySelector('#usuarios-table')) cargarUsuarios();
  if(document.querySelector('#roles-empleados-list')) cargarRolesEmpleados();
}

// Cada enlace actualiza el hash sin recargar toda la página.
document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click', e=>{
    // Evitamos que el navegador salte a un ancla tradicional.
    e.preventDefault();
    // Leemos la vista desde el atributo data-view del enlace.
    const view = item.dataset.view;
    // Guardamos la vista en el historial para que atrás/adelante funcione.
    history.pushState({view}, '', `#${view}`);
    // Descargamos y mostramos la vista solicitada.
    loadView(view);
  });
});

// Reacciona cuando el usuario usa los botones atrás o adelante del navegador.
window.addEventListener('popstate', ()=>{
  loadView(location.hash.replace('#','') || 'dashboard');

  // Delegación de eventos: también cubre botones que conexion_html.js crea después.
  appContent.addEventListener('click', event=>{
    const button = event.target.closest('[data-toast]');
    if(button) showToast(button.dataset.toast);
  });
});

// El cierre de sesión todavía es visual; aquí se conectará la autenticación real.
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  showToast('Cierre de sesión preparado para conectar con Node.js');
});

// Carga la vista inicial indicada en la URL o el dashboard si no hay hash.
loadView(location.hash.replace('#','') || 'dashboard');
