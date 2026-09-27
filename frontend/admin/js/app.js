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

const entityLabels = {
  clientes: 'cliente',
  mascotas: 'mascota',
  direcciones: 'dirección',
  turnos: 'turno',
  historial: 'historial médico',
  tratamientos: 'tratamiento',
  vacunas: 'vacuna',
  productos: 'producto',
  categorias: 'categoría',
  marcas: 'marca',
  variantes: 'variante',
  stock: 'registro de stock',
  sucursales: 'sucursal',
  pedidos: 'pedido',
  pagos: 'pago',
  envios: 'envío',
  empleados: 'empleado',
  veterinarios: 'veterinario',
  usuarios: 'usuario',
  roles: 'rol'
};

let opcionesRelaciones = null;
let cargaOpcionesRelaciones = null;

async function obtenerOpcionesRelaciones() {
  if (opcionesRelaciones) return opcionesRelaciones;
  if (!cargaOpcionesRelaciones) {
    cargaOpcionesRelaciones = obtenerDatos('admin/opciones')
      .then(opciones => {
        opcionesRelaciones = opciones;
        return opciones;
      })
      .catch(error => {
        cargaOpcionesRelaciones = null;
        throw error;
      });
  }
  return cargaOpcionesRelaciones;
}

function invalidarOpcionesRelaciones() {
  opcionesRelaciones = null;
  cargaOpcionesRelaciones = null;
}

function relacionSeleccionada(input, opciones) {
  const campoId = input.form.querySelector(`[data-relation-value="${input.dataset.relationField}"]`);
  if (!campoId) return;
  const registros = opciones[input.dataset.relation] || [];
  const campoPadre = input.dataset.relationParent
    ? input.form.querySelector(`[data-relation-value="${input.dataset.relationParent}"]`)
    : null;
  const registro = registros.find(opcion => opcion.etiqueta === input.value
    && (!input.dataset.relationParent || String(opcion[input.dataset.relationParent]) === campoPadre?.value));
  campoId.value = registro ? registro.id : '';
  input.form.querySelectorAll(`[data-relation-parent="${input.dataset.relationField}"]`).forEach(dependiente => {
    const opcionesDependiente = opciones[dependiente.dataset.relation] || [];
    const lista = document.getElementById(dependiente.getAttribute('list'));
    if (lista) {
      lista.innerHTML = opcionesDependiente
        .filter(opcion => !campoId.value || String(opcion[input.dataset.relationField]) === String(campoId.value))
        .map(opcion => `<option value="${escaparHtml(opcion.etiqueta)}"></option>`)
        .join('');
    }
    const idDependiente = input.form.querySelector(`[data-relation-value="${dependiente.dataset.relationField}"]`);
    if (idDependiente && idDependiente.value
      && !opcionesDependiente.some(opcion => String(opcion.id) === idDependiente.value
        && String(opcion[input.dataset.relationField]) === String(campoId.value))) {
      dependiente.value = '';
      idDependiente.value = '';
    }
  });
}

async function prepararRelaciones(form) {
  const campos = [...form.querySelectorAll('[data-relation]')];
  if (!campos.length) return;
  const opciones = await obtenerOpcionesRelaciones();
  campos.forEach(input => {
    const lista = document.getElementById(input.getAttribute('list'));
    if (lista) {
      let registros = opciones[input.dataset.relation] || [];
      if (input.dataset.relationParent) {
        const idPadre = form.querySelector(`[data-relation-value="${input.dataset.relationParent}"]`)?.value;
        registros = registros.filter(registro => !idPadre
          || String(registro[input.dataset.relationParent]) === String(idPadre));
      }
      lista.innerHTML = registros.map(opcion =>
        `<option value="${escaparHtml(opcion.etiqueta)}"></option>`
      ).join('');
    }
    relacionSeleccionada(input, opciones);
  });
}

// Muestra un mensaje temporal en la parte inferior de la pantalla.
function showToast(message) {
  // Cambiamos el texto del elemento visual.
  toast.textContent = message;
  // La clase show hace visible el mensaje mediante CSS.
  toast.classList.add('show');
  // Si ya había un temporizador, lo cancelamos para reiniciar la cuenta.
  clearTimeout(showToast.timer);
  // Ocultamos el mensaje después de 2,4 segundos.
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// Marca visualmente en el menú la sección que está abierta.
function activateNav(view) {
  // Recorremos todos los enlaces del menú lateral.
  document.querySelectorAll('.nav-item').forEach(item => {
    // Solo el enlace cuyo data-view coincide queda activo.
    item.classList.toggle('active', item.dataset.view === view);
  });
}

// Descarga una vista HTML y la inserta en #app-content.
async function loadView(view) {
  // Si la vista no existe, usamos el dashboard como alternativa segura.
  const file = viewFiles[view] || viewFiles.dashboard;
  try {
    // fetch solicita el archivo al servidor local.
    const response = await fetch(file);
    // Una respuesta HTTP 404/500 no lanza una excepción automáticamente.
    if (!response.ok) throw new Error('No se pudo cargar la vista');
    // Convertimos la respuesta HTTP en texto HTML.
    appContent.innerHTML = await response.text();
    // Actualizamos el enlace activo del menú.
    activateNav(view);
    // Conectamos botones, filtros y datos después de insertar el HTML.
    initView();
  } catch (error) {
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
function initView() {
  // Busca la barra secundaria existente en algunas vistas.
  const subnav = document.querySelector('.subnav');
  if (subnav) {
    // Estos botones cambian entre paneles sin descargar otro archivo.
    const buttons = subnav.querySelectorAll('button[data-section]');
    const panels = document.querySelectorAll('[data-panel]');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        // Quitamos el estado activo de todos los botones.
        buttons.forEach(b => b.classList.remove('active'));
        // Activamos el botón seleccionado.
        button.classList.add('active');
        // Mostramos solo el panel cuyo data-panel coincide.
        panels.forEach(panel => {
          panel.hidden = panel.dataset.panel !== button.dataset.section;
        });
        // Al cambiar de panel volvemos a enlazar sus datos si corresponde.
        cargarDatosDeVista();
      });
    });
  }

  // Una vista puede tener varios buscadores, por ejemplo clientes y direcciones.
  document.querySelectorAll('[data-table-filter]').forEach(search => {
    // El valor del atributo indica qué tabla debe filtrar.
    const tableSelector = search.dataset.tableFilter;
    const table = tableSelector ? document.querySelector(tableSelector) : null;
    // Si la tabla no existe, informamos el problema y no registramos un evento inválido.
    if (!table) {
      console.error(`No se encontró la tabla indicada por: ${tableSelector}`);
      return;
    }
    search.addEventListener('input', () => {
      // Normalizamos el texto para que la búsqueda no dependa de mayúsculas.
      const term = search.value.toLowerCase().trim();
      table.querySelectorAll('tbody tr').forEach(row => {
        // Ocultamos las filas que no contienen el texto buscado.
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
    });
  });

  enhanceAdminPanels();

  // Carga los registros de la API cuando la vista ya está en el DOM.
  cargarDatosDeVista();
}

function getEntityLabel(panel) {
  return entityLabels[panel.dataset.panel] || 'elemento';
}

function enhanceAdminPanels() {
  document.querySelectorAll('[data-panel]').forEach(panel => {
    const entity = getEntityLabel(panel);
    const existingButton = panel.querySelector('.toolbar .btn');

    if (existingButton) {
      existingButton.dataset.modalAction = 'create';
      existingButton.dataset.modalEntity = entity;
      existingButton.dataset.modalPanel = panel.dataset.panel;
      existingButton.removeAttribute('data-toast');
    } else if (!panel.querySelector('.toolbar') && panel.querySelector('table, .detail-grid')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar admin-toolbar';
      toolbar.innerHTML = `<span class="panel-caption">Gestionar registros de ${entity}</span>
        <button class="btn btn-primary" type="button" data-modal-action="create" data-modal-entity="${entity}" data-modal-panel="${panel.dataset.panel}">＋ Añadir ${entity}</button>`;
      panel.prepend(toolbar);
    }

    panel.querySelectorAll('table').forEach(table => {
      const head = table.tHead && table.tHead.rows[0];
      if (!head) return;
      const hasActions = [...head.cells].some(cell => cell.textContent.trim().toLowerCase() === 'acciones');
      if (!hasActions) {
        const th = document.createElement('th');
        th.textContent = 'Acciones';
        head.appendChild(th);
      }
      table.tBodies[0]?.querySelectorAll('tr').forEach(row => {
        if (row.querySelector('[data-row-action]')) return;
        const id = row.cells[0]?.textContent.trim() || '';
        const hasStatus = row.querySelector('.status');
        const hasActionColumn = head.cells[head.cells.length - 1]?.textContent.trim().toLowerCase() === 'acciones';
        const actions = hasActionColumn && row.cells.length === head.cells.length
          ? row.cells[row.cells.length - 1]
          : document.createElement('td');
        actions.className = 'row-actions';
        actions.innerHTML = `<button class="btn btn-secondary btn-small" type="button" data-row-action="edit" data-entity="${entity}" data-id="${id}" data-modal-panel="${panel.dataset.panel}">Editar</button>
          <button class="btn btn-danger btn-small" type="button" data-row-action="delete" data-entity="${entity}" data-id="${id}">Eliminar</button>
          ${hasStatus ? `<button class="btn btn-secondary btn-small" type="button" data-row-action="status" data-entity="${entity}" data-id="${id}">Cambiar estado</button>` : ''}`;
        if (actions.parentElement !== row) row.appendChild(actions);
      });
    });

    panel.querySelectorAll('.info-card').forEach(card => {
      if (card.querySelector('[data-row-action]')) return;
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      actions.innerHTML = `<button class="btn btn-secondary btn-small" type="button" data-row-action="edit" data-entity="${entity}">Editar</button>
        <button class="btn btn-danger btn-small" type="button" data-row-action="delete" data-entity="${entity}">Eliminar</button>
        ${card.querySelector('.status') ? `<button class="btn btn-secondary btn-small" type="button" data-row-action="status" data-entity="${entity}">Cambiar estado</button>` : ''}`;
      card.appendChild(actions);
    });
  });
}

function openAdminModal(action, entity, row, panel) {
  const modal = panel?.querySelector(`[data-admin-modal="${entity}"]`)
    || document.querySelector(`[data-admin-modal="${entity}"]`);
  if (!modal) {
    console.error(`No se encontró el modal HTML para: ${entity}`);
    return;
  }
  const title = modal.querySelector('[data-modal-title]');
  if (title) title.textContent = `${action === 'edit' ? 'Editar' : 'Agregar'} ${entity}`;
  modal.dataset.entity = entity;
  modal.dataset.action = action;

  if (row) {
    const values = [...row.cells].map(cell => cell.textContent.trim());
    modal.querySelectorAll('[data-modal-field]').forEach((field, index) => {
      const value = values[index + 1] || '';
      field.value = value;
    });
  }
  modal.classList.add('show');
  modal.querySelector('input, textarea, select')?.focus();
}

function closeAdminModal() {
  document.querySelectorAll('[data-admin-modal].show').forEach(modal => modal.classList.remove('show'));
}

document.addEventListener('focusin', async event => {
  const input = event.target.closest('[data-relation]');
  if (!input) return;
  try {
    await prepararRelaciones(input.form);
  } catch (error) {
    informarErrorCarga('opciones de relaciones', error);
  }
});

document.addEventListener('input', event => {
  const input = event.target.closest('[data-relation]');
  if (input && opcionesRelaciones) relacionSeleccionada(input, opcionesRelaciones);
});

document.addEventListener('change', event => {
  const input = event.target.closest('[data-relation]');
  if (input && opcionesRelaciones) relacionSeleccionada(input, opcionesRelaciones);
});

function cycleStatus(status) {
  const values = ['Activo', 'Pendiente', 'Inactivo'];
  const next = values[(values.indexOf(status.textContent.trim()) + 1) % values.length];
  status.textContent = next;
  status.className = `status ${next === 'Activo' ? 'success' : next === 'Pendiente' ? 'warning' : 'danger'}`;
  showToast(`Estado cambiado a ${next}`);
}

// Decide qué endpoints debe cargar según las tablas presentes en la vista actual.
function cargarDatosDeVista() {
  if (document.querySelector('[data-panel="clientes"]')) {
    cargarClientes();
    cargarMascotas();
    cargarDirecciones();
  }
  if (document.querySelector('[data-panel="productos"]')) cargarCatalogo();
  if (document.querySelector('[data-panel="stock"]')) cargarInventario();
  if (document.querySelector('[data-panel="pedidos"]')) cargarVentas();
  if (document.querySelector('[data-panel="empleados"]')) cargarPersonal();
  if (document.querySelector('[data-panel="turnos"]')) {
    cargarTurnos();
    cargarHistorialMedico();
    cargarTratamientos();
    cargarVacunas();
  }
}

// Cada enlace actualiza el hash sin recargar toda la página.
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    // Evitamos que el navegador salte a un ancla tradicional.
    e.preventDefault();
    // Leemos la vista desde el atributo data-view del enlace.
    const view = item.dataset.view;
    // Guardamos la vista en el historial para que atrás/adelante funcione.
    history.pushState({ view }, '', `#${view}`);
    // Descargamos y mostramos la vista solicitada.
    loadView(view);
  });
});

// Reacciona cuando el usuario usa los botones atrás o adelante del navegador.
window.addEventListener('popstate', () => {
  loadView(location.hash.replace('#', '') || 'dashboard');
});

appContent.addEventListener('click', event => {
  const modalButton = event.target.closest('[data-modal-action]');
  if (modalButton) {
    openAdminModal(modalButton.dataset.modalAction, modalButton.dataset.modalEntity, null, modalButton.closest('[data-panel]'));
    return;
  }
  const rowButton = event.target.closest('[data-row-action]');
  if (rowButton) {
    const row = rowButton.closest('tr, .info-card');
    if (rowButton.dataset.rowAction === 'delete') {
      row?.remove();
      showToast(`${rowButton.dataset.entity} eliminado`);
    } else if (rowButton.dataset.rowAction === 'status') {
      const status = row?.querySelector('.status');
      if (status) cycleStatus(status);
    } else {
      openAdminModal('edit', rowButton.dataset.entity, row, rowButton.closest('[data-panel]'));
    }
    return;
  }
  const button = event.target.closest('[data-toast]');
  if (button) showToast(button.dataset.toast);
});

new MutationObserver(() => enhanceAdminPanels()).observe(appContent, {
  childList: true,
  subtree: true
});

document.addEventListener('click', event => {
  if (event.target.closest('[data-modal-close]') || event.target.matches('[data-admin-modal]')) closeAdminModal();
});

document.addEventListener('submit', async event => {
  const form = event.target.closest('[data-admin-modal-form]');
  if (!form) return;

  const modal = form.closest('[data-admin-modal]');

  if (modal?.dataset.entity === 'cliente'
    || modal?.dataset.entity === 'mascota') return;

  event.preventDefault();

  const entity = modal.dataset.entity;
  const entidades = {
    'dirección': 'direccion',
    'categoría': 'categoria',
    'envío': 'envio',
    'historial médico': 'historial',
    'registro de stock': 'stock',
    venta: 'pedido'
  };
  const nombreEntidad = entidades[entity] || entity;
  try {
    await prepararRelaciones(form);
  } catch (error) {
    informarErrorCarga('opciones de relaciones', error);
    alert('No se pudieron cargar las opciones para relacionar los registros.');
    return;
  }
  const relacionRequeridaSinSeleccion = [...form.querySelectorAll('[data-relation][required]')]
    .find(input => !form.querySelector(`[data-relation-value="${input.dataset.relationField}"]`)?.value);
  if (relacionRequeridaSinSeleccion) {
    alert(`Selecciona ${relacionRequeridaSinSeleccion.closest('label')?.firstChild.textContent.trim() || 'una opción'} de la lista.`);
    relacionRequeridaSinSeleccion.focus();
    return;
  }

  const endpoint = nombreEntidad === 'producto'
    ? 'catalogo/productos'
    : `admin/${encodeURIComponent(nombreEntidad)}`;
  const esProducto = nombreEntidad === 'producto';
  const datos = esProducto ? new FormData(form) : Object.fromEntries(new FormData(form));

  if (esProducto) {
    datos.append('nombre', form.elements.namedItem('producto').value.trim());
    datos.append('activo', form.elements.namedItem('estado').value === 'Activo' ? 'true' : 'false');
    const archivo = form.querySelector('input[type="file"]')?.files?.[0];
    if (archivo) datos.set('imagen', archivo);
  }

  fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'POST',
    ...(esProducto ? {} : { headers: { 'Content-Type': 'application/json' } }),
    body: esProducto ? datos : JSON.stringify(datos)
  })
    .then(async respuesta => {
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo guardar el registro');
      form.reset();
      invalidarOpcionesRelaciones();
      closeAdminModal();
      showToast(`${entity} guardado correctamente`);
      cargarDatosDeVista();
    })
    .catch(error => {
      console.error(`No se pudo guardar ${entity}:`, error);
      alert(error.message || `No se pudo guardar ${entity}`);
    });
});

// El cierre de sesión todavía es visual; aquí se conectará la autenticación real.
document.getElementById('logoutBtn').addEventListener('click', () => {
  showToast('Cierre de sesión preparado para conectar con Node.js');
});

// Carga la vista inicial indicada en la URL o el dashboard si no hay hash.
loadView(location.hash.replace('#', '') || 'dashboard');
