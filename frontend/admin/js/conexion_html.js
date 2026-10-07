// Capa común para los archivos de conexión del panel administrativo.
const API_BASE_URL = 'http://localhost:3000/api';

function escaparHtml(valor){
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function truncarTexto (valor, max=40){
  const t = String (valor ?? '');
  return t.length > max ? t.slice(0,max)+'...':t;
};

async function obtenerDatos(endpoint){
  const respuesta = await fetch(`${API_BASE_URL}/${endpoint}`);
  if(!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status} en /${endpoint}`);
  return respuesta.json();
}

function informarErrorCarga(endpoint, error){
  console.error(`No se pudieron cargar los datos de ${endpoint}:`, error);
}

// Cada módulo de conexión registra aquí cómo se ve el detalle de sus entidades.
// app.js lo lee para pintar el botón "Ver más" y abrir el modal de detalle.
const detalleEntidades = {};

// Entidades cuyo modal se rellena leyendo de un registro en memoria.
// Las.catalog_bd.js y clinica_bd.js registran las suyas con registrarFormulario();
// app.js usa la función de abajo para abrir el modal ya completo.
const formulariosRelacionales = {};

function registrarFormulario(entity, columnas, registro){
  formulariosRelacionales[entity] = { columnas, registro };
}

function avisarRegistroFaltante(entidad, id){
  console.warn(`No se encontró ${entidad} en el registro local:`, id);
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

// Rellena un modal de edicion a partir del registro completo de la fila.
//
// El modal ya declara que campos son relaciones (data-relation) y cual es su
// campo oculto (data-relation-field), asi que una sola funcion sirve para todas
// las entidades: no hace falta un prellenador por entidad.
async function prepararFormularioRelacional(id, modal){
  const entidad = modal.dataset.entity;
  const definicion = formulariosRelacionales[entidad];
  const registro = definicion?.registro.get(String(id));

  if (!definicion || !registro){
    avisarRegistroFaltante(entidad, id);
    return;
  }

  const form = modal.querySelector('form');
  form.reset();
  const opciones = await opcionesParaEditar();

  form.querySelectorAll('[data-modal-field]').forEach(campo => {
    const columna = definicion.columnas[campo.name];
    if (!columna) return;                    // input de archivo o campo sin dato
    const bruto = registro[columna];

    if (campo.type === 'date'){
      // MySQL devuelve "2026-02-15T03:00:00.000Z"; input date espera "2026-02-15".
      campo.value = String(bruto ?? '').slice(0, 10);
      return;
    }

    if (campo.type === 'time'){
      // MySQL devuelve "09:00:00"; input time espera "09:00".
      campo.value = String(bruto ?? '').slice(0, 5);
      return;
    }

    if (campo.tagName === 'SELECT'){
      // Cada entidad usa su propio formato: el estado de un turno es
      // "PENDIENTE"/"CONFIRMADO", el de un producto "Activo"/"Inactivo" y el de
      // un servicio "true"/"false". Buscamos la opcion que represente el dato y,
      // si no hay coincidencia y el dato es 0/1, la que diga activo/inactivo.
      const items = [...campo.options];
      const directa = items.find(o => o.value === String(bruto)
        || o.text.trim().toLowerCase() === String(bruto).toLowerCase());
      if (!directa && /^[01]$/.test(String(bruto))){
        const etiquetada = items.find(o => /^(activo|inactivo)$/i.test(o.text.trim()));
        if (etiquetada) campo.value = etiquetada.value;
      }else{
        campo.value = String(bruto);
      }
      return;
    }

    const valor = bruto ?? '';
    if (campo.dataset.relation){
      campo.value = valor ? etiquetaDeRelacion(opciones, campo.dataset.relation, valor) : '';
      const oculto = form.querySelector(`[data-relation-value="${campo.dataset.relationField}"]`);
      if (oculto) oculto.value = bruto ?? '';
    } else {
      campo.value = valor;
    }
  });

  // Cargamos las sugerencias de los datalist para que se vean al hacer clic.
  try { await prepararRelaciones(form); } catch (error) { /* no es crítico */ }
}
