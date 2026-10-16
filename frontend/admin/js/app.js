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

// Traduce la etiqueta que ve el usuario ("rol de usuario") al nombre de la
// entidad en la API ("rolUsuario"). Lo usan el alta/edición y el borrado.
const entidadApi = {
  'dirección': 'direccion',
  'categoría': 'categoria',
  'categoría de servicio': 'categoriaServicio',
  'valor de atributo': 'valorAtributo',
  'adopción': 'adopcion',
  'mascota en adopción': 'mascotaAdopcion',
  'rol de usuario': 'rolUsuario',
  'envío': 'envio',
  'historial médico': 'historial',
  'registro de stock': 'stock',
  venta: 'pedido'
};

// Que lista de `admin/opciones` ofrece el selector de destinos cuando el borrado
// pide reasignar, y como se llama esa fila en los textos del modal. El backend
// usa las mismas dos piezas (`destinoEtiqueta` en `borrados`), asi que el nombre
// del campo que viaja en el DELETE sale de `confirmarBorrado()`.
const DESTINOS_REASIGNACION = {
  rol: { opciones: 'rolesEmpleados', etiqueta: 'rol', campo: 'id_rol_empleado_destino' },
  sucursal: { opciones: 'sucursales', etiqueta: 'sucursal', campo: 'id_sucursal_destino' }
};

const entityLabels = {
  clientes: 'cliente',
  mascotas: 'mascota',
  direcciones: 'dirección',
  especies: 'especie',
  razas: 'raza',
  adopciones: 'adopción',
  turnos: 'turno',
  historial: 'historial médico',
  tratamientos: 'tratamiento',
  vacunas: 'vacuna',
  servicios: 'servicio',
  productos: 'producto',
  categorias: 'categoría',
  marcas: 'marca',
  variantes: 'variante',
  atributos: 'atributo',
  stock: 'registro de stock',
  sucursales: 'sucursal',
  pedidos: 'pedido',
  pagos: 'pago',
  envios: 'envío',
  empleados: 'empleado',
  veterinarios: 'veterinario',
  usuarios: 'usuario',
  roles: 'rol',
  permisos: 'permiso'
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
      // Un panel puede declarar varios botones de entidades distintas en el HTML:
      // solo completamos los atributos que falten y respetamos los ya escritos.
      if (!existingButton.dataset.modalAction) existingButton.dataset.modalAction = 'create';
      if (!existingButton.dataset.modalEntity) existingButton.dataset.modalEntity = entity;
      if (!existingButton.dataset.modalPanel) existingButton.dataset.modalPanel = panel.dataset.panel;
      existingButton.removeAttribute('data-toast');
    } else if (!panel.querySelector('.toolbar') && panel.querySelector('table, .detail-grid')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'toolbar admin-toolbar';
      toolbar.innerHTML = `<span class="panel-caption">Gestionar registros de ${entity}</span>
        <button class="btn btn-primary" type="button" data-modal-action="create" data-modal-entity="${entity}" data-modal-panel="${panel.dataset.panel}">＋ Añadir ${entity}</button>`;
      panel.prepend(toolbar);
    }

    panel.querySelectorAll('table, .info-card').forEach(item => {
      // Cada tabla puede declarar su propia entidad cuando un panel agrupa varias.
      const entidadItem = item.dataset.modalEntity || entity;
      if (item.tagName === 'TABLE') {
        const head = item.tHead && item.tHead.rows[0];
        if (!head) return;
        const hasActions = [...head.cells].some(cell => cell.textContent.trim().toLowerCase() === 'acciones');
        if (!hasActions) {
          const th = document.createElement('th');
          th.textContent = 'Acciones';
          head.appendChild(th);
        }
        item.tBodies[0]?.querySelectorAll('tr').forEach(row => {
          if (row.querySelector('[data-row-action]')) return;
          const id = row.dataset?.id || row.cells[0]?.textContent.trim() || '';
          // Una tabla puede declarar data-sin-estado cuando su .status no es un
          // campo con estados (en inventario es "Bajo"/"Óptimo"): sin el opt-out
          // aparecia un "Cambiar estado" que cycleaba Activo/Pendiente/Inactivo
          // y se perderia en la proxima carga.
          const tieneEstado = !item.hasAttribute('data-sin-estado');
          const hasStatus = tieneEstado && Boolean(row.querySelector('.status'));
          // data-sin-borrado oculta el boton de eliminar cuando el registro no
          // se borra sino que se ajusta: el stock de una sucursal se modifica
          // desde Editar, y el backend no tiene politica de borrado para esa
          // tabla, asi que el boton solo podria llevar a un error.
          const tieneBorrado = !item.hasAttribute('data-sin-borrado');
          const tieneDetalle = Boolean(detalleEntidades[entidadItem]);
          const hasActionColumn = head.cells[head.cells.length - 1]?.textContent.trim().toLowerCase() === 'acciones';
          const actions = hasActionColumn && row.cells.length === head.cells.length
            ? row.cells[row.cells.length - 1]
            : document.createElement('td');
          actions.className = 'row-actions';
          actions.innerHTML = `${tieneDetalle ? `<button class="btn btn-secondary btn-small" type="button" data-row-action="detail" data-entity="${entidadItem}" data-id="${id}">Ver más</button>` : ''}
            <button class="btn btn-secondary btn-small" type="button" data-row-action="edit" data-entity="${entidadItem}" data-id="${id}" data-modal-panel="${panel.dataset.panel}">Editar</button>
            ${tieneBorrado ? `<button class="btn btn-danger btn-small" type="button" data-row-action="delete" data-entity="${entidadItem}" data-id="${id}">Eliminar</button>` : ''}
            ${hasStatus ? `<button class="btn btn-secondary btn-small" type="button" data-row-action="status" data-entity="${entidadItem}" data-id="${id}">Cambiar estado</button>` : ''}`;
          if (actions.parentElement !== row) row.appendChild(actions);
        });
        return;
      }

      if (item.querySelector('[data-row-action]')) return;
      const conEstado = !item.hasAttribute('data-sin-estado') && Boolean(item.querySelector('.status'));
      // Mismo opt-out que en las tablas: la tarjeta se puede dejar sin boton de
      // eliminar declarando data-sin-borrado.
      const conBorrado = !item.hasAttribute('data-sin-borrado');
      // El id vive en la tarjeta (data-id), no en el boton. Hay que copiarlo a
      // los botones: el manejador de eliminar lo lee del boton, y sin el la
      // accion se corta con "falta el identificador del registro". Editar no
      // lo sufria porque lee el id de la tarjeta, no del boton.
      const id = item.dataset?.id || '';
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      actions.innerHTML = `<button class="btn btn-secondary btn-small" type="button" data-row-action="edit" data-entity="${entidadItem}" data-id="${escaparHtml(id)}">Editar</button>
        ${conBorrado ? `<button class="btn btn-danger btn-small" type="button" data-row-action="delete" data-entity="${entidadItem}" data-id="${escaparHtml(id)}">Eliminar</button>` : ''}
        ${conEstado ? `<button class="btn btn-secondary btn-small" type="button" data-row-action="status" data-entity="${entidadItem}" data-id="${escaparHtml(id)}">Cambiar estado</button>` : ''}`;
      item.appendChild(actions);
    });
  });
}

// Entidades que saben rellenarse solas al editar y persistir el cambio.
// Si una entidad no está acá, se sigue usando el mapeo por índice de celda
// que deja el modal en modo solo lectura.
function obtenerPrellenadorEdicion(entity){
  const prellenadores = {
    'cliente': prepararFormularioCliente,
    'mascota': prepararFormularioMascota,
    'dirección': prepararFormularioDireccion,
    'especie': prepararFormularioEspecie,
    'raza': prepararFormularioRaza,
    'adopción': prepararFormularioAdopcion,
    'mascota en adopción': prepararFormularioMascotaAdopcion,
    // Catálogo y clínica comparten un solo prellenador: cada módulo registró sus
    // entidades con registrarFormulario() desde conexion_html.js.
    'producto': prepararFormularioRelacional,
    'marca': prepararFormularioRelacional,
    'categoría': prepararFormularioRelacional,
    'variante': prepararFormularioRelacional,
    'registro de stock': prepararFormularioRelacional,
    'sucursal': prepararFormularioRelacional,
    'atributo': prepararFormularioRelacional,
    'valor de atributo': prepararFormularioRelacional,
    'turno': prepararFormularioRelacional,
    'historial médico': prepararFormularioRelacional,
    'tratamiento': prepararFormularioRelacional,
    'vacuna': prepararFormularioRelacional,
    'servicio': prepararFormularioRelacional,
    'categoría de servicio': prepararFormularioRelacional,
    'pago': prepararFormularioRelacional,
    'envío': prepararFormularioRelacional,
    // Personal y seguridad: sin esto, "Editar" caía en el mapeo por índice de
    // celda y mezclaba los datos (el nombre completo iba al campo nombre y el
    // texto de los botones al último input). personal_bd.js registra las suyas.
    'empleado': prepararFormularioRelacional,
    'veterinario': prepararFormularioRelacional,
    'usuario': prepararFormularioRelacional,
    'rol': prepararFormularioRelacional,
    'permiso': prepararFormularioRelacional,
    'rol de usuario': prepararFormularioRelacional
  };
  const prellenador = prellenadores[entity];
  return typeof prellenador === 'function' ? prellenador : null;
}

// Prepara el valor de un campo del modal de detalle: vacío, fecha, enumeración,
// etiqueta de relación o el valor crudo.
function valorDetalle(campo, registro, opciones){
  const bruto = registro[campo.campo];

  if (bruto === null || bruto === undefined || bruto === '') return '—';

  if (campo.relacion){
    return etiquetaDeRelacion(opciones, campo.relacion, bruto) || '—';
  }
  if (campo.booleano){
    return Number(bruto) ? campo.booleano[1] : campo.booleano[0];
  }
  if (campo.enumeracion){
    const indice = campo.enumeracion.indexOf(String(bruto));
    return indice >= 0 ? campo.etiquetas[indice] : bruto;
  }
  if (campo.fecha){
    return String(bruto).slice(0, 10);
  }
  if (campo.hora){
    // MySQL devuelve "09:00:00"; en el detalle se muestra como "09:00".
    return String(bruto).slice(0, 5);
  }
  // `prefijo` existe para los importes: "$55000.00" se lee de una, "55000.00"
  // a secas no. Se aplica solo al valor crudo, porque en un ENUM o una fecha
  // un "$" delante no significaria nada.
  return (campo.prefijo || '') + bruto + (campo.sufijo || '');
}

// Un bloque con tabla dentro del modal de detalle: las lineas de un pedido, sus
// pagos, sus envios. Las columnas tienen la misma forma que los campos planos
// (etiqueta, enumeracion, fecha...), asi que se resuelven con valorDetalle() y
// un ENUM se muestra como "Realizado" y no como "REALIZADO".
function detalleDeListas(listas, carga, opciones){
  return (listas || []).map(lista => {
    const filas = carga[lista.campo] || [];
    const celdas = lista.columnas
      .map(columna => `<th>${escaparHtml(columna.etiqueta)}</th>`)
      .join('');
    const cuerpo = filas.length
      ? filas.map(fila => `<tr>${lista.columnas
        .map(columna => `<td>${escaparHtml(valorDetalle(columna, fila, opciones))}</td>`)
        .join('')}</tr>`).join('')
      // Un bloque vacio tambien es informacion: un pedido sin pagos registrados
      // es un dato, no un fallo de carga.
      : `<tr class="detalle-vacio"><td colspan="${lista.columnas.length}">${
        escaparHtml(lista.vacio || 'Sin registros')}</td></tr>`;

    return `<section class="detalle-bloque">
      <h4>${escaparHtml(lista.titulo)} <em>${filas.length}</em></h4>
      <div class="table-wrap">
        <table class="detalle-tabla">
          <thead><tr>${celdas}</tr></thead>
          <tbody>${cuerpo}</tbody>
        </table>
      </div>
    </section>`;
  }).join('');
}

async function abrirDetalle(entity, row){
  const esquema = detalleEntidades[entity];
  if (!esquema || !row){
    console.warn('No hay detalle definido para:', entity);
    return;
  }

  const id = row.dataset?.id || row.cells?.[0]?.textContent.trim() || '';
  const registro = esquema.registro?.get(String(id));
  if (!registro){
    console.warn('No se encontró el registro local:', entity, id);
    return;
  }

  const modal = document.getElementById('modal-detalle');
  const contenedor = modal.querySelector('[data-detalle-campos]');

  // Los datos anidados no vienen en el listado: se piden solo si el esquema
  // declara de donde. Un pedido muestra sus lineas, pagos y envios, que son
  // tablas hijas y no tiene sentido cargarlas para cada fila de la tabla.
  let carga = {};
  if (esquema.carga){
    try {
      carga = await obtenerDatos(esquema.carga.replace(':id', id)) || {};
    } catch (error) {
      // El modal se abre igual con los campos planos: perder las listas anidadas
      // es una molestia, pero no un motivo para no mostrar el pedido.
      informarErrorCarga(esquema.carga, error);
    }
  }

  // Una sola llamada a admin/opciones cubre todas las relaciones del esquema.
  const necesitaOpciones = esquema.campos.some(campo => campo.relacion)
    || (esquema.listas || []).some(lista => lista.columnas.some(columna => columna.relacion));
  const opciones = necesitaOpciones ? await opcionesParaEditar() : {};

  // El endpoint puede traer campos frescos: se mezclan sobre el registro del
  // listado para que el detalle no dependa de cuando se cargo la tabla.
  const completo = { ...registro, ...(carga.pedido || {}) };

  modal.querySelector('[data-detalle-titulo]').textContent = `${esquema.titulo} #${id}`;
  contenedor.innerHTML = esquema.campos.map(campo => `
    <div class="info-row${campo.texto ? ' detalle-texto' : ''}">
      <span>${escaparHtml(campo.etiqueta)}</span>
      <strong>${escaparHtml(valorDetalle(campo, completo, opciones))}</strong>
    </div>
  `).join('');

  modal.querySelector('[data-detalle-listas]').innerHTML = detalleDeListas(esquema.listas, carga, opciones);

  modal.classList.add('show');
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

  bloquearPasswordEnEdicion(modal, action === 'edit');

  if (!row) {
    // Un modal se reutiliza para altas y ediciones. Si el registro anterior se
    // editó y se cerró sin guardar, sus valores quedaban en el formulario de
    // alta y se dablan de alta registros copiados sin querer.
    modal.querySelector('form')?.reset();
    delete modal.dataset.readonly;
    delete modal.dataset.idRegistro;
  } else {
    const prellenador = obtenerPrellenadorEdicion(entity);

    if (prellenador) {
      // El id real viene del data-id de la fila; si no está, usamos la 1ra columna.
      const idRegistro = row.dataset?.id || row.cells?.[0]?.textContent.trim() || '';
      modal.dataset.idRegistro = idRegistro;
      // Sin readonly: esta entidad ya sabe guardar el UPDATE.
      delete modal.dataset.readonly;
      prellenador(idRegistro, modal);
    } else {
      // Las tablas traen una fila con celdas; las tarjetas (.info-card) no tienen cells.
      const values = row.cells ? [...row.cells].map(cell => cell.textContent.trim()) : [];
      const campos = modal.querySelectorAll('[data-modal-field]');
      if (values.length) {
        // Mapeo por índice de celda. Solo para entidades sin prellenador: se
        // rellena lo visible y el modal queda en solo lectura.
        campos.forEach((field, index) => { field.value = values[index + 1] || ''; });
      } else {
        // En tarjetas el nombre principal se lee del título h3.
        const nombre = row.querySelector('h3')?.textContent.trim();
        const descripcion = row.querySelector('small')?.textContent.trim();
        campos.forEach(field => {
          if (field.name === 'nombre' && nombre) field.value = nombre;
          if (field.name === 'descripcion' && descripcion) field.value = descripcion;
        });
      }
      // Solo visualización: no se permite actualizar desde este modal.
      modal.dataset.readonly = 'true';
    }
  }

  precargarPermisosDeRol(entity, action, row);

  modal.classList.add('show');
  modal.querySelector('input, textarea, select')?.focus();
}

// La contraseña de un usuario nunca se modifica desde el panel: solo se fija al
// darlo de alta. En edición el input queda deshabilitado (un input disabled no
// entra al FormData, así que ni siquiera viaja en el PUT) y se lo reemplaza por
// un aviso. El backend además la ignora: `password_hash` no está en la lista
// blanca de columnas que puede escribir un UPDATE.
function bloquearPasswordEnEdicion(modal, editando) {
  const password = modal.querySelector('input[name="password"]');
  if (!password) return;
  password.disabled = editando;
  password.required = !editando;
  password.value = '';
  if (editando) {
    password.placeholder = 'No se puede modificar desde el panel';
    password.title = 'La contraseña solo se define al crear el usuario.';
  } else {
    password.removeAttribute('placeholder');
    password.removeAttribute('title');
  }
  const aviso = modal.querySelector('[data-password-edit-notice]');
  if (aviso) aviso.hidden = !editando;
}

// Marca los permisos ya asignados cuando se abre el modal de un rol de usuario.
function precargarPermisosDeRol(entity, action, row) {
  const contenedor = document.getElementById('rol-usuario-permisos');
  if (!contenedor || entity !== 'rol de usuario') return;
  const casillas = [...contenedor.querySelectorAll('input[data-permiso-check]')];
  // En edición las casillas son solo informativas: no se reenvían (no hay forma
  // de quitar permisos todavía), así que se muestran bloqueadas.
  casillas.forEach(casilla => {
    casilla.checked = false;
    casilla.disabled = action === 'edit';
  });
  const idRol = row?.dataset?.id;
  if (action !== 'edit' || !idRol) return;
  obtenerDatos('personal/rolpermiso')
    .then(asignaciones => {
      asignaciones
        .filter(asignacion => String(asignacion.id_rol_usuario) === String(idRol))
        .forEach(asignacion => {
          const casilla = casillas.find(item => String(item.value) === String(asignacion.id_permiso));
          if (casilla) casilla.checked = true;
        });
    })
    .catch(error => console.warn('No se pudieron cargar los permisos del rol:', error));
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

// Entidades cuyo boton "Cambiar estado" ya llama a la API. Se listan una por una
// a proposito: conectarlas todas de golpe seria tocar seis secciones, y las
// demas siguen con el ciclo visual de antes.
const ENTIDADES_CON_ESTADO = new Set(['pedido', 'pago', 'envio']);

// El ciclo visual de siempre. Solo se usa para las entidades que todavia no
// estan conectadas; rota el texto del .status sin tocar la base.
//
// Ojo: para ventas esta rotacion seria incorrecta. La columna de un pago es
// ENUM('PENDIENTE','REALIZADO') y la de un envio ENUM('EN_CAMINO','ENTREGADO'),
// asi que un "Pendiente" o un "Activo" no se podrian ni guardar.
function cycleStatus(status) {
  const values = ['Activo', 'Pendiente', 'Inactivo'];
  const next = values[(values.indexOf(status.textContent.trim()) + 1) % values.length];
  status.textContent = next;
  status.className = `status ${next === 'Activo' ? 'success' : next === 'Pendiente' ? 'warning' : 'danger'}`;
  showToast(`Estado cambiado a ${next}`);
}

// Avanza el estado contra la API. El backend decide cual es el siguiente valor
// valido y lo devuelve; el panel solo lo pinta. Asi la lista de estados vive en
// un solo lado y no puede desincronizarse.
async function avanzarEstado(entity, id, fila) {
  if (!id) {
    showToast('No se puede cambiar el estado: falta el identificador');
    return;
  }
  const nombreEntidad = entidadApi[entity] || entity;
  const boton = document.querySelector(`[data-id="${CSS.escape(String(id))}"] [data-row-action="status"]`)
    || fila?.querySelector('[data-row-action="status"]');
  if (boton) boton.disabled = true;

  try {
    const respuesta = await fetch(
      `${API_BASE_URL}/admin/${encodeURIComponent(nombreEntidad)}/${encodeURIComponent(id)}/estado`,
      { method: 'POST' }
    );
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.mensaje || 'No se pudo cambiar el estado');

    // Volvemos a pedir los datos en vez de retocar la fila a mano: el listado
    // vuelve a pintar la fila con su clase de estado correcta y no queda
    // desincronizado con la base.
    cargarDatosDeVista();
    showToast(`${entity}: ${cuerpo.anterior} → ${cuerpo.estado}${cuerpo.ultimo ? ' (vuelve al primero)' : ''}`);
  } catch (error) {
    console.error(`No se pudo cambiar el estado de ${entity}:`, error);
    showToast(error.message || `No se pudo cambiar el estado de ${entity}`);
    if (boton) boton.disabled = false;
  }
}

// Decide qué endpoints debe cargar según las tablas presentes en la vista actual.
function cargarDatosDeVista() {
  if (document.querySelector('[data-panel="clientes"]')) {
    cargarClientes();
    cargarMascotas();
    cargarDirecciones();
  }
  if (document.querySelector('[data-panel="especies"]')) {
    cargarEspecies();
    cargarRazas();
  }
  if (document.querySelector('[data-panel="adopciones"]')) {
    cargarAdopciones();
    cargarMascotasAdopcion();
  }
  if (document.querySelector('[data-panel="productos"]')) cargarCatalogo();
  if (document.querySelector('[data-panel="atributos"]')) cargarAtributos();
  if (document.querySelector('[data-panel="stock"]')) cargarInventario();
  if (document.querySelector('[data-panel="pedidos"]')) cargarVentas();
  if (document.querySelector('[data-panel="empleados"]')) cargarPersonal();
  if (document.querySelector('[data-panel="servicios"]')) {cargarServicios(); cargarCategoriasServicio();};
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

// ------------------------------------------------------------------
// Borrado de un registro.
// ------------------------------------------------------------------
// Antes esto era un simulacro: `row.remove()` sacaba la fila del DOM y un
// toast anunciaba un borrado que nunca ocurria. Ahora consulta que se va a
// llevar, pide confirmacion y recien ahi llama al DELETE.
//
// La confirmacion es obligatoria siempre, y muestra la cantidad exacta de
// filas hijas: pedirle a alguien que confirme "se va a eliminar en cascada"
// sin decirle cuantas filas son es pedirle que confirme a ciegas.
let borradoPendiente = null;

const pluralizar = (etiqueta, cantidad) => `${cantidad} ${etiqueta}${cantidad === 1 ? '' : 's'}`;

// Se guarda la peticion en `borradoPendiente` y se muestra el modal. El click
// en "Sí, eliminar" la retoma desde confirmarBorrado().
async function abrirConfirmacionBorrado({ entity, id, plan, fila }) {
  const modal = document.querySelector('[data-admin-modal="confirmar-borrado"]');
  if (!modal) {
    console.error('No se encontró el modal de confirmación de borrado');
    return;
  }
  borradoPendiente = { entity, id, destino: null };

  const descripcion = fila ? textoDeFila(fila) : '';
  modal.querySelector('[data-confirmar-titulo]').textContent = `Eliminar ${entity}`;
  modal.querySelector('[data-confirmar-mensaje]').textContent = descripcion
    ? `Se eliminará ${descripcion}.`
    : `Se eliminará el registro #${id} de ${entity}.`;

  // 1) Lo que se borra de verdad.
  const bloque = modal.querySelector('[data-confirmar-cascada]');
  const lista = modal.querySelector('[data-confirmar-lista]');
  const items = plan.cascada || [];
  bloque.hidden = items.length === 0;
  lista.innerHTML = items
    .map(item => `<li>${escaparHtml(pluralizar(item.etiqueta, item.cantidad))}</li>`)
    .join('');

  // 2) Lo que se suelta pero sobrevive. Own block, own wording: desasociar no
  //    es borrar, y decirlo con la misma lista roja seria mentir.
  const bloqueDesasociar = modal.querySelector('[data-confirmar-desasociar]');
  const listaDesasociar = modal.querySelector('[data-confirmar-lista-desasociar]');
  const sueltos = plan.desasociar || [];
  bloqueDesasociar.hidden = sueltos.length === 0;
  listaDesasociar.innerHTML = sueltos
    .map(item => `<li>${escaparHtml(pluralizar(item.etiqueta, item.cantidad))} sobrevivirá${item.cantidad === 1 ? '' : 'n'}, con su historial intacto</li>`)
    .join('');

  // 3) Lo que hay que resolver antes de poder borrar.
  await prepararReasignacion(modal, entity, id, plan);

  modal.classList.add('show');
  const destino = modal.querySelector('[data-confirmar-destino]');
  if (!modal.querySelector('[data-confirmar-reasignar]').hidden && destino?.options.length) destino.focus();
  else modal.querySelector('[data-confirmar-aceptar]')?.focus();
}

// Arma el bloque de reasignacion: lista a quienes afecta y obliga a elegir
// destino. Sin destino elegido el boton rojo no se habilita, porque el backend
// lo rechaza igual: es la misma regla, aplicada antes de pedirle nada al usuario.
async function prepararReasignacion(modal, entity, id, plan) {
  const bloque = modal.querySelector('[data-confirmar-reasignar]');
  const pendientes = plan.reasignar || [];
  bloque.hidden = pendientes.length === 0;
  const boton = modal.querySelector('[data-confirmar-aceptar]');
  const error = modal.querySelector('[data-confirmar-destino-error]');
  const select = modal.querySelector('[data-confirmar-destino]');

  if (!pendientes.length) {
    boton.disabled = false;
    error.hidden = true;
    return;
  }

  const total = pendientes.reduce((suma, item) => suma + item.cantidad, 0);
  modal.querySelector('[data-confirmar-reasignar-titulo]').textContent =
    `${total} ${total === 1 ? 'registro se' : 'registros se'} reasignará${total === 1 ? '' : 'n'} antes de borrar:`;

  const nombres = pendientes.flatMap(item => item.registros.map(f => f.nombre)).filter(Boolean);
  modal.querySelector('[data-confirmar-lista-reasignar]').innerHTML = nombres.length
    ? nombres.map(nombre => `<li>${escaparHtml(nombre)}</li>`).join('')
    : `<li>${total} ${total === 1 ? 'registro' : 'registros'} sin detalle</li>`;

  // Los destinos posibles vienen de las opciones de relacion que ya se usan
  // para los datalist. Cada entidad reasignadora dice cual es su lista: un rol
  // de empleado se reasigna a otro rol, una sucursal a otra sucursal.
  const nombreEntidad = entidadApi[entity] || entity;
  const configuracion = DESTINOS_REASIGNACION[nombreEntidad];
  const nombreDestino = configuracion?.etiqueta || 'rol';
  const articulo = /^[aeiou]/.test(nombreDestino) ? 'una' : 'un';

  select.innerHTML = `<option value="">Elegí ${articulo} ${nombreDestino}…</option>`;
  const tituloDestino = modal.querySelector('[data-confirmar-destino-etiqueta]');
  if (tituloDestino) tituloDestino.textContent = `Reasignar a ${articulo} ${nombreDestino}`;

  let destinos = [];
  try {
    const opciones = await obtenerOpcionesRelaciones();
    destinos = ((configuracion?.opciones ? opciones[configuracion.opciones] : null) || [])
      .filter(opcion => String(opcion.id) !== String(id));
  } catch (error) {
    informarErrorCarga(`opciones de ${nombreDestino}s`, error);
  }
  select.insertAdjacentHTML('beforeend', destinos
    .map(opcion => `<option value="${escaparHtml(opcion.id)}">${escaparHtml(opcion.etiqueta)}</option>`)
    .join(''));

  if (!destinos.length) {
    error.hidden = false;
    error.textContent =
      `No hay ${articulo === 'una' ? 'otra' : 'otro'} ${nombreDestino} al que reasignar. `
      + 'No se puede eliminar este registro.';
    boton.disabled = true;
  } else {
    error.hidden = true;
    boton.disabled = true;   // sigue deshabilitado hasta que se elija
  }
  select.onchange = () => {
    borradoPendiente.destino = select.value || null;
    boton.disabled = !select.value;
  };
}

// Un texto legible de la fila, para que el modal diga a quien se esta borrando.
// Se descartan la celda de acciones y las que solo traen el id.
function textoDeFila(fila) {
  if (!fila?.cells) return '';
  const celdas = [...fila.cells]
    .filter(celda => !celda.querySelector('[data-row-action]'))
    .map(celda => celda.textContent.trim())
    .filter(texto => texto && !/^#?\d+$/.test(texto));
  return celdas.slice(0, 2).join(' — ');
}

async function solicitarBorrado(entity, id, fila) {
  // El id llega en el boton (las tablas y las tarjetas lo copian desde su
  // data-id). Sin el no hay forma de saber que registro es: sigue siendo una
  // red de seguridad, no el camino normal.
  if (!id) {
    showToast('No se puede eliminar: falta el identificador del registro');
    return;
  }

  const nombreEntidad = entidadApi[entity] || entity;
  let plan;
  try {
    const respuesta = await fetch(
      `${API_BASE_URL}/admin/${encodeURIComponent(nombreEntidad)}/${encodeURIComponent(id)}/dependientes`
    );
    const cuerpo = await respuesta.json();
    // Sin politica de borrado, la seccion todavia no esta conectada. Decirlo
    // es mejor que el viejo toast mentiroso de "eliminado".
    if (!respuesta.ok) throw new Error(cuerpo.mensaje || 'La eliminación no está disponible');
    plan = cuerpo;
  } catch (error) {
    showToast(error.message || 'No se pudo consultar el registro');
    return;
  }

  if (plan.bloqueantes?.length) {
    showToast(`No se puede eliminar: tiene ${plan.bloqueantes.map(b => pluralizar(b.etiqueta, b.cantidad)).join(' y ')} asociado${plan.bloqueantes.some(b => b.cantidad !== 1) ? 's' : ''}`);
    return;
  }

  // Requisito de la propia fila: una ficha de veterinario ya desasociada no se
  // puede borrar. El boton deberia venir deshabilitado, pero si alguien llega
  // por otra via el motivo se dice igual.
  if (plan.sinRequisito?.length) {
    showToast(`No se puede eliminar: no tiene ${plan.sinRequisito.map(r => r.etiqueta).join(' ni ')}`);
    return;
  }

  // Un pago REALIZADO o un envio ENTREGADO no se borran: no son un error de
  // carga, son el comprobante.
  if (plan.impiden?.length) {
    showToast(`No se puede eliminar: ${plan.impiden.join(' y ')}`);
    return;
  }

  await abrirConfirmacionBorrado({ entity, id, plan, fila });
}

async function confirmarBorrado() {
  if (!borradoPendiente) return;
  const { entity, id, destino } = borradoPendiente;
  const nombreEntidad = entidadApi[entity] || entity;
  // El backend lee el destino con el nombre que declara la entidad: un rol y
  // una sucursal no viajan en el mismo campo del cuerpo.
  const campoDestino = DESTINOS_REASIGNACION[nombreEntidad]?.campo
    || 'id_rol_empleado_destino';
  const boton = document.querySelector('[data-confirmar-aceptar]');
  boton.disabled = true;

  try {
    const respuesta = await fetch(
      `${API_BASE_URL}/admin/${encodeURIComponent(nombreEntidad)}/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        // Solo viaja si la entidad reasigna. El backend lo ignora en el resto.
        body: destino ? JSON.stringify({ [campoDestino]: Number(destino) }) : undefined
      }
    );
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.mensaje || 'No se pudo eliminar el registro');

    showToast(resumenBorrado(entity, cuerpo));
    // Las listas de relaciones (roles, sucursales, usuarios) tambien cambiaron.
    invalidarOpcionesRelaciones();
    cargarDatosDeVista();
  } catch (error) {
    console.error(`No se pudo eliminar ${entity}:`, error);
    showToast(error.message || `No se pudo eliminar ${entity}`);
  } finally {
    boton.disabled = false;
    borradoPendiente = null;
    closeAdminModal();
  }
}

// El toast dice que paso de verdad, incluidas las filas que sobrevivieron:
// si solo se anunciara "eliminado", el usuario no sabria que su ficha de
// veterinario quedo huerfana ni que sus empleados cambiaron de rol.
function resumenBorrado(entity, cuerpo) {
  const partes = [`${entity} eliminado`];
  (cuerpo.reasignar || []).forEach(item =>
    partes.push(`${pluralizar(item.etiqueta, item.cantidad)} reasignado${item.cantidad === 1 ? '' : 's'}`));
  (cuerpo.cascada || []).forEach(item =>
    partes.push(`${pluralizar(item.etiqueta, item.cantidad)} eliminado${item.cantidad === 1 ? '' : 's'}`));
  (cuerpo.desasociar || []).forEach(item =>
    partes.push(`${pluralizar(item.etiqueta, item.cantidad)} conservado${item.cantidad === 1 ? '' : 's'}`));
  return partes.join(', ');
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-confirmar-aceptar]')) {
    event.preventDefault();
    confirmarBorrado();
  }
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
    if (rowButton.dataset.rowAction === 'detail') {
      abrirDetalle(rowButton.dataset.entity, row);
    } else if (rowButton.dataset.rowAction === 'delete') {
      solicitarBorrado(rowButton.dataset.entity, rowButton.dataset.id, row);
    } else if (rowButton.dataset.rowAction === 'status') {
      const entity = rowButton.dataset.entity;
      const nombreEntidad = entidadApi[entity] || entity;
      if (ENTIDADES_CON_ESTADO.has(nombreEntidad)) {
        avanzarEstado(entity, rowButton.dataset.id, row);
      } else {
        const status = row?.querySelector('.status');
        if (status) cycleStatus(status);
      }
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

// Algunos formularios declaran registros hijos con casillas (p. ej. los permisos
// que recibirá un rol de usuario). Tras crear el registro padre se envían aquí.
//
// Solo en el alta: al editar un rol ya existe cada fila de rol_permiso, y un POST
// sobre la PK compuesta (id_rol_usuario, id_permiso) vuelve con 500 por duplicado.
// Tampoco podemos quitar permisos desde acá porque no hay DELETE todavía, así que
// en edición solo se actualiza el nombre del rol y se avisa.
async function asignarRegistrosRelacionados(form, resultado, editando) {
  const entidadHija = form.dataset.assignEntity;
  if (!entidadHija || !resultado?.id || editando) return 0;
  const campoPadre = form.dataset.assignParent || 'id';
  const campoHijo = form.dataset.assignField || 'id';
  const marcados = [...form.querySelectorAll('[data-permiso-check]:checked')].map(casilla => casilla.value);
  let fallidas = 0;
  for (const valor of marcados) {
    try {
      const respuesta = await fetch(`${API_BASE_URL}/admin/${encodeURIComponent(entidadHija)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campoPadre]: resultado.id, [campoHijo]: valor })
      });
      if (!respuesta.ok) fallidas += 1;
    } catch (error) {
      console.error(`No se pudo guardar la asignación de ${entidadHija}:`, error);
      fallidas += 1;
    }
  }
  return fallidas;
}

document.addEventListener('submit', async event => {
  const form = event.target.closest('[data-admin-modal-form]');
  if (!form) return;

  // El mini-modal de alta rapida de presentacion tiene su propio manejador en
  // conexion/catalogo_bd.js. No es un [data-admin-modal-form], asi que igual
  // retornamos arriba; lo dejamos explicito para que ningun handler futuro lo
  // intercepte y termine cerrando el modal de variante.
  if (event.target.closest('[data-form-alta-valor]')) return;

  const modal = form.closest('[data-admin-modal]');

  // Estas entidades tienen su propio manejador de submit en
  // conexion/clientes_bd.js. Sin este return, este handler genérico correría
  // después, haría preventDefault y cerraría el modal antes de que responda la API.
  const entidadesConSubmitPropio = [
    'cliente', 'mascota', 'dirección', 'especie', 'raza',
    'adopción', 'mascota en adopción'
  ];
  if (entidadesConSubmitPropio.includes(modal?.dataset.entity)) return;

  // Las entidades con prellenador no vienen en readonly, asi que llegan hasta
  // aca y se guardan. Las que no lo tienen se cierran sin enviar nada.
  if (modal?.dataset.readonly === 'true') {
    event.preventDefault();
    closeAdminModal();
    return;
  }

  event.preventDefault();

  const entity = modal.dataset.entity;
  const nombreEntidad = entidadApi[entity] || entity;
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
  const esProducto = nombreEntidad === 'producto';
  const esMarca = nombreEntidad === 'marca'
  const endpoint = esProducto
    ? 'catalogo/productos'
    :esMarca
    ?'catalogo/marcas'
    : `admin/${encodeURIComponent(nombreEntidad)}`;
  const esArchivo = esProducto || esMarca;
  const datos = esArchivo ? new FormData(form) : Object.fromEntries(new FormData(form));

  if (esProducto) {
    datos.append('nombre', form.elements.namedItem('producto').value.trim());
    datos.append('activo', form.elements.namedItem('estado').value === 'Activo' ? 'true' : 'false');
    const archivo = form.querySelector('input[type="file"]')?.files?.[0];
    if (archivo) datos.set('imagen', archivo);
  }

  // En modo edicion el id viaja en la URL y el metodo es PUT.
  const editando = modal.dataset.action === 'edit' && modal.dataset.idRegistro;
  const url = editando
    ? `${API_BASE_URL}/${endpoint}/${modal.dataset.idRegistro}`
    : `${API_BASE_URL}/${endpoint}`;

  fetch(url, {
    method: editando ? 'PUT' : 'POST',
    ...(esArchivo ? {} : { headers: { 'Content-Type': 'application/json' } }),
    body: esArchivo ? datos : JSON.stringify(datos)
  })
    .then(async respuesta => {
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo guardar el registro');
      const asignacionesFallidas = await asignarRegistrosRelacionados(form, resultado, editando);
      form.reset();
      invalidarOpcionesRelaciones();
      closeAdminModal();
      delete modal.dataset.action;
      delete modal.dataset.idRegistro;
      // En un PUT solo se actualizó el nombre: los permisos del rol no se
      // reenvían, así que hay que decirlo en vez de prometer un guardado total.
      const avisoPermisos = editando && form.dataset.assignEntity
        ? ' (los permisos no se modifican al editar)'
        : '';
      showToast(asignacionesFallidas
        ? `${entity} guardado, pero ${asignacionesFallidas} permiso(s) no se pudieron asignar`
        : `${entity} ${editando ? 'actualizado' : 'guardado'} correctamente${avisoPermisos}`);
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
