// Objetos completos de cada registro, para que los modales de edicion los puedan
// leer sin depender del texto visible de la tabla.
const pedidosPorId = new Map();
const pagosPorId   = new Map();
const enviosPorId  = new Map();

function guardarEnRegistro(mapa, filas, campoId){
  mapa.clear();
  (filas || []).forEach(fila => mapa.set(String(fila[campoId]), fila));
}

async function cargarVentas(){
  const configuracion = [
    ['pedidos', 'ventas/pedidos', 'id_pedido', row => `<tr data-id="${escaparHtml(row.id_pedido)}"><td>#${escaparHtml(row.id_pedido)}</td><td>${escaparHtml(row.cliente)}</td><td>${escaparHtml(String(row.fecha || '').replace('T', ' '))}</td><td>${escaparHtml(row.estado)}</td><td>$${escaparHtml(row.subtotal)}</td><td>$${escaparHtml(row.costo_envio)}</td><td><strong>$${escaparHtml(row.total)}</strong></td></tr>`],
    ['pagos', 'ventas/pagos', 'id_pago', row => `<tr data-id="${escaparHtml(row.id_pago)}"><td>#${escaparHtml(row.id_pago)}</td><td>#${escaparHtml(row.id_pedido)}</td><td>${escaparHtml(row.metodo_pago)}</td><td>${escaparHtml(row.estado_pago)}</td></tr>`],
    ['envios', 'ventas/envios', 'id_envio', row => `<tr data-id="${escaparHtml(row.id_envio)}"><td>#${escaparHtml(row.id_envio)}</td><td>#${escaparHtml(row.id_pedido)}</td><td>${escaparHtml(row.tipo_entrega)}</td><td><span class="status ${row.estado === 'ENTREGADO' ? 'success' : 'warning'}">${escaparHtml(row.estado)}</span></td></tr>`]
  ];
  // El registro se guarda antes de pintar el tbody: enhanceAdminPanels usa el
  // data-id de la fila para abrir el modal del id correcto. El "#" de la primera
  // celda es solo decoracion; el id real siempre es el atributo data-id.
  const registros = { pedidos: pedidosPorId, pagos: pagosPorId, envios: enviosPorId };

  for(const [panel, endpoint, campoId, render] of configuracion){
    try{
      const table = document.querySelector(`#${panel}-table`);
      if(!table) continue;
      const rows = await obtenerDatos(endpoint);
      guardarEnRegistro(registros[panel], rows, campoId);
      table.querySelector('tbody').innerHTML = rows.map(render).join('');
    }catch(error){ InformarErrorCarga(endpoint, error); }
  }

  // Los botones Ver mas / Editar / Eliminar los genera enhanceAdminPanels al
  // mutar el tbody. Se invoca de forma explicita para no depender solo del
  // MutationObserver, igual que en catalogo_bd.js e inventario_bd.js.
  if (typeof enhanceAdminPanels === 'function') enhanceAdminPanels();
}

// De que columna del registro se toma cada campo visible del modal.
// 'pedido' no se registra a proposito: tiene detalle:true, asi que el backend
// rechaza su actualizacion. Prefijarlo haria que Editar dejara de ser solo
// lectura y el guardado rebotara con un error.
registrarFormulario('pago', {
  pedido_busqueda: 'id_pedido', metodo_pago: 'metodo_pago', estado_pago: 'estado_pago'
}, pagosPorId);

registrarFormulario('envío', {
  pedido_busqueda: 'id_pedido', tipo_entrega: 'tipo_entrega',
  direccion_busqueda: 'id_direccion', codigo_postal: 'codigo_postal',
  fecha_estimada: 'fecha_estimada', fecha_entrega: 'fecha_entrega', estado: 'estado'
}, enviosPorId);

// Envios: el codigo postal y las dos fechas salen de la tabla al modal de
// detalle, con el criterio de las fases anteriores: identidad y estado quedan.
detalleEntidades['envío'] = {
  titulo: 'Envío',
  registro: enviosPorId,
  campos: [
    { campo: 'id_envio', etiqueta: 'ID' },
    { campo: 'id_pedido', etiqueta: 'Pedido', relacion: 'pedidos' },
    { campo: 'tipo_entrega', etiqueta: 'Tipo',
      enumeracion: ['DOMICILIO', 'SUCURSAL', 'PROGRAMADO'],
      etiquetas: ['Domicilio', 'Sucursal', 'Programado'] },
    { campo: 'estado', etiqueta: 'Estado',
      enumeracion: ['EN_CAMINO', 'ENTREGADO'],
      etiquetas: ['En camino', 'Entregado'] },
    { campo: 'codigo_postal', etiqueta: 'C.P.' },
    { campo: 'fecha_estimada', etiqueta: 'Fecha estimada', fecha: true },
    { campo: 'fecha_entrega', etiqueta: 'Fecha de entrega', fecha: true }
  ]
};