// Objetos completos de cada registro, para poder rellenar los modales de
// edicion sin depender del texto visible de la tabla.
const productosPorId        = new Map();
const categoriasPorId       = new Map();
const marcasPorId           = new Map();
const variantesPorId        = new Map();
const atributosPorId        = new Map();
const valoresAtributoPorId  = new Map();

function guardarEnRegistro(mapa, filas, campoId){
  mapa.clear();
  (filas || []).forEach(fila => mapa.set(String(fila[campoId]), fila));
}

function invalidarCatalogoCargado(){
  productosPorId.clear();
  categoriasPorId.clear();
  marcasPorId.clear();
  variantesPorId.clear();
  atributosPorId.clear();
  valoresAtributoPorId.clear();
}

async function cargarCatalogo() {
  const paneles = [
    ['productos', 'catalogo/productos', row => `
      <tr data-id="${escaparHtml(row.id_producto)}">
        <td>${escaparHtml(row.id_producto)}</td>
        <td>${escaparHtml(row.nombre)}</td>
        <td>${escaparHtml(row.marca)}</td>
        <td>${escaparHtml(row.descripcion)}</td>
        <td>${escaparHtml((row.descuento))}%</td>
        <td><span class="status ${row.activo ? 'success' : 'warning'}">${row.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td>${escaparHtml(truncarTexto(row.imagen || 'Sin imagen',18))}</td>
      </tr>
    `],
    ['categorias', 'catalogo/categorias', row => `<tr data-id="${escaparHtml(row.id_categoria)}"><td>${escaparHtml(row.id_categoria)}</td><td>${escaparHtml(row.nombre)}</td><td>${escaparHtml(row.categoria_padre || '—')}</td></tr>`],
    ['marcas', 'catalogo/marcas', row => `<tr data-id="${escaparHtml(row.id_marca)}"><td>${escaparHtml(row.id_marca)}</td><td>${escaparHtml(row.nombre)}</td><td>${escaparHtml(truncarTexto(row.imagen_marca || 'sin imagen', 18))}</td></tr>`],
    ['variantes', 'catalogo/variantes', row => `<tr data-id="${escaparHtml(row.id_variante)}"><td>${escaparHtml(row.id_variante)}</td><td>${escaparHtml(row.producto)}</td><td>$${escaparHtml(row.precio)}</td><td>${escaparHtml([row.atributo_nombre, row.atributo].filter(Boolean).join(': ') || '—')}</td></tr>`]
  ];

  const registros = {
    productos: [productosPorId, 'id_producto'],
    categorias: [categoriasPorId, 'id_categoria'],
    marcas: [marcasPorId, 'id_marca'],
    variantes: [variantesPorId, 'id_variante']
  };

  for (const [panel, endpoint, render] of paneles) {
    try {
      const table = document.querySelector(`#${panel}-table`);
      if (!table) continue;
      const rows = await obtenerDatos(endpoint);
      if (registros[panel]) guardarEnRegistro(registros[panel][0], rows, registros[panel][1]);
      table.querySelector('tbody').innerHTML = rows.map(render).join('');
    } catch (error) {
      informarErrorCarga(endpoint, error);
    }
  }
  // Los botones Editar los genera enhanceAdminPanels al mutar el tbody.
  // Se invoca de forma explícita para no depender solo del MutationObserver.
  if (typeof enhanceAdminPanels === 'function') enhanceAdminPanels();
}

async function cargarAtributos() {
  try {
    const atributos = await obtenerDatos('catalogo/atributos');
    const tbody = document.querySelector('#atributos-table tbody');
    guardarEnRegistro(atributosPorId, atributos, 'id_atributo');
    if (tbody) tbody.innerHTML = (atributos || []).map(row => `<tr data-id="${escaparHtml(row.id_atributo)}"><td>${escaparHtml(row.id_atributo)}</td><td>${escaparHtml(row.nombre)}</td></tr>`).join('');
  } catch (error) { InformarErrorCarga('catalogo/atributos', error); }
  try {
    const valores = await obtenerDatos('catalogo/valores-atributo');
    const tbody = document.querySelector('#valores-atributo-table tbody');
    if (tbody) tbody.innerHTML = (valores || []).map(row => `<tr data-id="${escaparHtml(row.id_valor)}"><td>${escaparHtml(row.id_valor)}</td><td>${escaparHtml(row.atributo || '—')}</td><td>${escaparHtml(row.nombre)}</td></tr>`).join('');
  } catch (error) { informarErrorCarga('catalogo/valores-atributo', error); }
}

// De que columna del registro se toma cada campo visible del modal.
// Los campos que no aparecen aqui (los inputs de archivo) se dejan como estan.
const columnasPorEntidad = {
  'producto':          { producto: 'nombre', marca_busqueda: 'id_marca', categoria_busqueda: 'id_categoria',
                         descripcion: 'descripcion', descuento: 'descuento', estado: 'activo' },
  'marca':             { nombre: 'nombre' },
  'categoría':         { nombre: 'nombre', categoria_padre_busqueda: 'categoria_padre' },
  'variante':          { producto_busqueda: 'id_producto', precio: 'precio', atributo_busqueda: 'id_valor_atributo' },
  'atributo':          { nombre: 'nombre' },
  'valor de atributo': { atributo_busqueda: 'id_atributo', nombre: 'nombre' }
};

const registrosPorEntidad = {
  'producto': productosPorId,
  'marca': marcasPorId,
  'categoría': categoriasPorId,
  'variante': variantesPorId,
  'atributo': atributosPorId,
  'valor de atributo': valoresAtributoPorId
};

// La invoca app.js al abrir un modal de catalogo en modo edicion.
// Una sola funcion para las seis entidades: el modal ya declara que campos son
// relaciones (data-relation) y cual es su campo oculto (data-relation-field),
// asi que no hace falta un prellenador por entidad.
async function prepararFormularioCatalogo(id, modal){
  const entidad = modal.dataset.entity;
  const columnas = columnasPorEntidad[entidad];
  const registro = registrosPorEntidad[entidad]?.get(String(id));
  if (!columnas || !registro){
    avisarRegistroFaltante(entidad, id);
    return;
  }

  const form = modal.querySelector('form');
  form.reset();
  const opciones = await opcionesParaEditar();

  form.querySelectorAll('[data-modal-field]').forEach(campo => {
    const columna = columnas[campo.name];
    if (!columna) return;

    let valor = registro[columna] ?? '';
    if (campo.type === 'date') valor = String(valor).slice(0, 10);
    // El estado de producto llega como 0/1 desde MySQL y el select ofrece
    // "Activo"/"Inactivo".
    if (campo.tagName === 'SELECT' && /^[01]$/.test(String(valor))){
      valor = Number(valor) ? 'Activo' : 'Inactivo';
    }

    if (campo.dataset.relation){
      campo.value = valor ? etiquetaDeRelacion(opciones, campo.dataset.relation, valor) : '';
      const oculto = form.querySelector(`[data-relation-value="${campo.dataset.relationField}"]`);
      if (oculto) oculto.value = registro[columna] ?? '';
    } else {
      campo.value = valor;
    }
  });

  try { await prepararRelaciones(form); } catch (error) { /* no es critico */ }
}

// Crea una presentacion (atributo + valor) desde el modal de variante, sin
// salir de la vista. Reutiliza los endpoints que ya existen:
// POST /api/admin/atributo y POST /api/admin/valorAtributo.
async function guardarNuevaPresentacion(){
  const mini = document.getElementById('modal-alta-valor');
  const form = mini.querySelector('[data-form-alta-valor]');
  const texto = form.atributo_busqueda.value.trim();
  const valor = form.valor.value.trim();

  if (!texto || !valor) return;

  try {
    await prepararRelaciones(form);

    let idAtributo = Number(form.querySelector('[name="id_atributo"]').value) || 0;
    let nombreAtributo = texto;

    if (idAtributo){
      // Eligio un atributo de la lista: solo hay que crear el valor.
      const opciones = await opcionesParaEditar();
      const encontrado = (opciones.atributos || []).find(o => String(o.id) === String(idAtributo));
      // admin/opciones devuelve "Color (ID: 1)"; el datalist quiere "Color: Rojo".
      if (encontrado) nombreAtributo = encontrado.etiqueta.replace(/\s*\(ID:\s*\d+\)\s*$/, '');
    } else {
      // Escribio un atributo que no existe: lo creamos primero.
      const respuesta = await fetch(`${API_BASE_URL}/admin/atributo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: texto })
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.mensaje || 'No se pudo crear el atributo');
      idAtributo = cuerpo.id;
      invalidarOpcionesRelaciones();
    }

    const respuestaValor = await fetch(`${API_BASE_URL}/admin/valorAtributo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_atributo: idAtributo, nombre: valor })
    });
    const cuerpoValor = await respuestaValor.json();
    if (!respuestaValor.ok) throw new Error(cuerpoValor.mensaje || 'No se pudo crear el valor');

    const nuevaEtiqueta = `${nombreAtributo}: ${valor}`;

    // Agregamos la opcion al datalist del modal de variante sin recargar nada.
    const lista = document.getElementById('variante-atributos');
    if (lista) lista.insertAdjacentHTML('beforeend', `<option value="${escaparHtml(nuevaEtiqueta)}"></option>`);
    invalidarOpcionesRelaciones();

    // Dejamos la presentacion nueva ya seleccionada en el modal de variante.
    const modalVariante = document.querySelector('[data-admin-modal="variante"]');
    modalVariante.querySelector('[name="atributo_busqueda"]').value = nuevaEtiqueta;
    modalVariante.querySelector('[name="id_valor_atributo"]').value = cuerpoValor.id;

    form.reset();
    mini.classList.remove('show');
    modalVariante.querySelector('[name="atributo_busqueda"]').focus();
    showToast(`Presentación "${nuevaEtiqueta}" creada`);
  } catch (error) {
    console.error(error);
    alert(error.message || 'No se pudo crear la presentación');
  }
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-abrir-alta-valor]')) {
    const mini = document.getElementById('modal-alta-valor');
    const form = mini.querySelector('[data-form-alta-valor]');
    form.reset();
    mini.classList.add('show');
    prepararRelaciones(form).catch(() => {});
    form.atributo_busqueda.focus();
    return;
  }
  // Cerramos solo este mini-modal: closeAdminModal() cerraria tambien el de variante.
  if (event.target.closest('[data-cerrar-alta-valor]') || event.target.matches('#modal-alta-valor')) {
    document.getElementById('modal-alta-valor').classList.remove('show');
    return;
  }
  if (event.target.matches('[data-form-alta-valor]')) {
    event.preventDefault();
    guardarNuevaPresentacion();
  }
});
