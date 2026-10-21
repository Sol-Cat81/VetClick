// Objetos completos de cada registro, para que el modal de edicion los pueda
// leer sin depender del texto visible de la tabla o de la tarjeta.
const stockPorId = new Map();
const sucursalesPorId = new Map();

// La foto de la sucursal en la tarjeta del panel, para que el admin vea si
// tiene foto antes de editarla. Sin foto, un aviso de que no tiene.
function miniaturaSucursal(url){
  const esUrl = typeof url === 'string' && /^https?:\/\//i.test(url);
  if(!esUrl) return '<p class="sucursal-sin-foto">Sin foto</p>';
  return `<img class="sucursal-miniatura" src="${escaparHtml(url)}" alt="Foto de la sucursal"
    onerror="this.outerHTML='<p class=&quot;sucursal-sin-foto&quot;>Sin foto</p>'">`;
}

async function cargarInventario(){
  try{
    const stock = await obtenerDatos('inventario/stock');
    const tbody = document.querySelector('#stock-table tbody');
    // El registro se guarda antes de pintar el tbody: enhanceAdminPanels usa el
    // data-id de la fila para abrir el modal de edicion del id correcto.
    guardarEnRegistro(stockPorId, stock, 'id_inventario');
    if(tbody) tbody.innerHTML = stock.map(row => `<tr data-id="${escaparHtml(row.id_inventario)}"><td>${escaparHtml(row.producto)}</td><td>${escaparHtml(row.sucursal)}</td><td>${escaparHtml(row.stock_actual)}</td><td>${escaparHtml(row.stock_minimo)}</td><td><span class="status ${row.estado === 'Bajo' ? 'warning' : 'success'}">${escaparHtml(row.estado)}</span></td></tr>`).join('');
  }catch(error){ InformarErrorCarga('inventario/stock', error); }
  try{
    const sucursales = await obtenerDatos('inventario/sucursales');
    const container = document.querySelector('#sucursales-list');
    guardarEnRegistro(sucursalesPorId, sucursales, 'id_sucursal');
    if(container) container.innerHTML = sucursales.map(row => `<article class="card info-card" data-id="${escaparHtml(row.id_sucursal)}">${miniaturaSucursal(row.img_sucursal)}<h3>${escaparHtml(row.nombre)}</h3><div class="info-row"><span>Dirección</span><b>${escaparHtml(row.direccion)}</b></div><div class="info-row"><span>Teléfono</span><b>${escaparHtml(row.telefono || '—')}</b></div><div class="info-row"><span>Localidad</span><b>${escaparHtml(row.localidad)}</b></div><div class="info-row"><span>Horario</span><b>${escaparHtml(row.horario)}</b></div><div class="info-row"><span>Estado</span><span class="status ${row.activo ? 'success' : 'warning'}">${row.activo ? 'Activa' : 'Inactiva'}</span></div></article>`).join('');
  }catch(error){ InformarErrorCarga('inventario/sucursales', error); }
}

// Sin esto el modal de stock y el de sucursal se abren en solo lectura: el
// handler generico de app.js no encuentra un prellenador y mapea los campos
// por indice de celda, que en estas tablas no corresponde a ninguna columna.
registrarFormulario('registro de stock', {
  variante_busqueda: 'id_variante', sucursal_busqueda: 'id_sucursal',
  stock_actual: 'stock_actual', stock_minimo: 'stock_minimo'
}, stockPorId);

registrarFormulario('sucursal', {
  nombre: 'nombre', direccion: 'direccion', localidad: 'localidad',
  telefono: 'telefono', horario: 'horario', activo: 'activo'
}, sucursalesPorId);