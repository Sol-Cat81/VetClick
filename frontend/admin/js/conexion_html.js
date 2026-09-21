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

async function obtenerDatos(endpoint){
  const respuesta = await fetch(`${API_BASE_URL}/${endpoint}`);
  if(!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status} en /${endpoint}`);
  return respuesta.json();
}

function informarErrorCarga(endpoint, error){
  console.error(`No se pudieron cargar los datos de ${endpoint}:`, error);
}
