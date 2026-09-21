async function cargarInventario(){
  try{
    const stock = await obtenerDatos('inventario/stock');
    const tbody = document.querySelector('#stock-table tbody');
    if(tbody) tbody.innerHTML = stock.map(row => `<tr><td>${escaparHtml(row.producto)}</td><td>${escaparHtml(row.sucursal)}</td><td>${escaparHtml(row.stock_actual)}</td><td>${escaparHtml(row.stock_minimo)}</td><td><span class="status ${row.estado === 'Bajo' ? 'warning' : 'success'}">${escaparHtml(row.estado)}</span></td></tr>`).join('');
  }catch(error){ informarErrorCarga('inventario/stock', error); }
  try{
    const sucursales = await obtenerDatos('inventario/sucursales');
    const container = document.querySelector('#sucursales-list');
    if(container) container.innerHTML = sucursales.map(row => `<article class="card info-card"><h3>${escaparHtml(row.nombre)}</h3><div class="info-row"><span>Dirección</span><b>${escaparHtml(row.direccion)}</b></div><div class="info-row"><span>Localidad</span><b>${escaparHtml(row.localidad)}</b></div><div class="info-row"><span>Horario</span><b>${escaparHtml(row.horario)}</b></div><div class="info-row"><span>Estado</span><span class="status ${row.activo ? 'success' : 'warning'}">${row.activo ? 'Activa' : 'Inactiva'}</span></div></article>`).join('');
  }catch(error){ informarErrorCarga('inventario/sucursales', error); }
}
