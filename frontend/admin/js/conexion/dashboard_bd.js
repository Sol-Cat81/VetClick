// Datos del dashboard. Cada bloque se carga por su cuenta y falla solo: si un
// endpoint no responde, ese bloque queda con "—" y el resto se sigue viendo.
// Nunca con Promise.all, que tumba el panel entero si uno falla.
async function pedir(endpoint){
  try{
    return await obtenerDatos(endpoint);
  }catch(error){
    informarErrorCarga(endpoint, error);
    return null;
  }
}

// Escribe un valor en una tarjeta, distinguiendo "no hay datos" de "no vino".
function pintarDato(selector, valor, sufijo = ''){
  const destino = document.querySelector(selector);
  if(!destino) return;
  destino.textContent = valor === null || valor === undefined ? '—' : valor + sufijo;
}

function pintarNota(selector, texto){
  const destino = document.querySelector(selector);
  if(destino) destino.textContent = texto;
}

function nombreCompleto(persona){
  return [persona.nombre, persona.apellido].filter(Boolean).join(' ').trim();
}

async function cargarVentasDelPanel(){
  const pedidos = await pedir('ventas/pedidos');
  if(pedidos === null){
    pintarDato('[data-dash="ventas-total"]', null);
    pintarNota('[data-dash="ventas-nota"]', 'No se pudieron leer los pedidos');
    return;
  }

  const total = pedidos.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0);
  const formato = new Intl.NumberFormat('es-AR', {maximumFractionDigits: 0});
  pintarDato('[data-dash="ventas-total"]', '$' + formato.format(total));
  pintarNota('[data-dash="ventas-nota"]',
    pedidos.length === 1 ? '1 pedido registrado' : pedidos.length + ' pedidos registrados');
}

async function cargarTurnosPendientes(){
  const turnos = await pedir('clinica/turnos');
  if(turnos === null){
    pintarDato('[data-dash="pendientes"]', null);
    pintarNota('[data-dash="pendientes-nota"]', 'No se pudieron leer los turnos');
    return;
  }

  // Un turno "pendiente" es el que sigue en PENDIENTE: no se ha confirmado ni
  // cancelado. Los CANCELADO y FINALIZADO ya no esperan a nadie.
  const pendientes = turnos.filter(turno => String(turno.estado || '').toUpperCase() === 'PENDIENTE');
  pintarDato('[data-dash="pendientes"]', pendientes.length);
  pintarNota('[data-dash="pendientes-nota"]',
    pendientes.length === 1 ? '1 sin confirmar' : pendientes.length + ' sin confirmar');

  const tbody = document.querySelector('[data-dash="tabla-turnos"]');
  if(!tbody) return;

  if(!pendientes.length){
    tbody.innerHTML = `<tr><td colspan="4" class="detalle-vacio">No hay turnos pendientes</td></tr>`;
    return;
  }

  tbody.innerHTML = pendientes.map(turno => `
    <tr>
      <td><strong>${escaparHtml(String(turno.hora || '').slice(0, 5))}</strong>
        <br><small>${escaparHtml(String(turno.fecha || '').slice(0, 10))}</small></td>
      <td><strong>${escaparHtml(turno.mascota || '—')}</strong>
        <br><small>${escaparHtml(turno.cliente || 'Sin dueño')}</small></td>
      <td>${escaparHtml(turno.servicio || '—')}</td>
      <td><span class="status warning">Pendiente</span></td>
    </tr>
  `).join('');
}

async function cargarClientesDelPanel(){
  const clientes = await pedir('clientes');
  if(clientes === null){
    pintarDato('[data-dash="clientes"]', null);
    pintarNota('[data-dash="clientes-nota"]', 'No se pudieron leer los clientes');
    return;
  }
  pintarDato('[data-dash="clientes"]', clientes.length);
  pintarNota('[data-dash="clientes-nota"]', 'Registrados en el sistema');
}

async function cargarPersonalDelPanel(){
  const empleados = await pedir('personal/empleados');
  const contenedor = document.querySelector('[data-dash="personal"]');
  const encabezado = document.querySelector('[data-dash="personal-total"]');
  if(empleados === null){
    if(encabezado) encabezado.textContent = 'No disponible';
    if(contenedor) contenedor.innerHTML = `<div class="detalle-vacio">No se pudo leer el personal</div>`;
    return;
  }

  if(encabezado){
    encabezado.textContent = empleados.length === 1
      ? '1 activo' : empleados.length + ' activos';
  }
  if(!contenedor) return;

  if(!empleados.length){
    contenedor.innerHTML = `<div class="detalle-vacio">No hay personal cargado</div>`;
    return;
  }

  contenedor.innerHTML = empleados.map(empleado => `
    <div class="info-row">
      <b>${escaparHtml(nombreCompleto(empleado))}</b>
      <span>${escaparHtml([empleado.rol, empleado.sucursal].filter(Boolean).join(' · ') || '—')}</span>
    </div>
  `).join('');
}

async function cargarAlertasDelPanel(){
  const stock = await pedir('inventario/stock');
  if(stock === null){
    pintarDato('[data-dash="alertas"]', null);
    pintarNota('[data-dash="alertas-nota"]', 'No se pudo leer el inventario');
    return;
  }

  // El endpoint ya calcula el estado con el mismo criterio que la seccion de
  // inventario: "Bajo" cuando stock_actual <= stock_minimo (con COALESCE para
  // los minimos NULL). Aca se usa ese veredicto y no una cuenta nueva, para
  // que el panel y la tabla de inventario no puedan contradecirse.
  const bajos = stock.filter(fila => fila.estado === 'Bajo');
  const ok = stock.length - bajos.length;

  pintarDato('[data-dash="alertas"]', bajos.length);
  pintarNota('[data-dash="alertas-nota"]',
    bajos.length === 1 ? 'Requiere revisión' : bajos.length + ' requieren revisión');

  const contenedor = document.querySelector('[data-dash="alertas-lista"]');
  if(!contenedor) return;

  const avisos = bajos.slice(0, 4).map(fila => `
    <div class="alert danger"><b>!</b>
      <div><strong>${escaparHtml(truncarTexto(fila.producto || 'Producto', 28))}</strong>
        <small>${escaparHtml(fila.sucursal || 'Sucursal')}: ${escaparHtml(fila.stock_actual)} de ${escaparHtml(fila.stock_minimo ?? '—')}</small></div>
    </div>
  `).join('');

  contenedor.innerHTML = avisos
    + `<div class="alert success"><b>✓</b>
         <div><strong>Stock correcto</strong>
           <small>${escaparHtml(ok === 1 ? '1 producto dentro del minimo' : ok + ' productos dentro del minimo')}</small></div>
       </div>`;
}

// La fecha del encabezado estaba escrita a mano y se quedaba vieja.
function pintarFechaDeHoy(){
  const destino = document.querySelector('[data-dash="fecha"]');
  if(!destino) return;
  const hoy = new Date();
  destino.textContent = 'Hoy, ' + hoy.toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

async function cargarDashboard(){
  pintarFechaDeHoy();
  // Las cinco en paralelo. Cada una se banca su propio fallo.
  await Promise.all([
    cargarVentasDelPanel(),
    cargarTurnosPendientes(),
    cargarClientesDelPanel(),
    cargarPersonalDelPanel(),
    cargarAlertasDelPanel()
  ]);
}