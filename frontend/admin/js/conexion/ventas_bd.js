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
  // El .status es lo que hace que enhanceAdminPanels() agregue el boton
  // "Cambiar estado". Antes solo envios lo tenia, asi que pedidos y pagos no
  // ofrecian la accion: la columna de estado era texto muerto.
  const claseEstado = valor => `status ${['ENTREGADO', 'REALIZADO'].includes(valor) ? 'success' : 'warning'}`;
  const configuracion = [
    ['pedidos', 'ventas/pedidos', 'id_pedido', row => `<tr data-id="${escaparHtml(row.id_pedido)}"><td>#${escaparHtml(row.id_pedido)}</td><td>${escaparHtml(row.cliente)}</td><td>${escaparHtml(String(row.fecha || '').replace('T', ' '))}</td><td><span class="${claseEstado(row.estado)}">${escaparHtml(row.estado)}</span></td><td>$${escaparHtml(row.subtotal)}</td><td>$${escaparHtml(row.costo_envio)}</td><td><strong>$${escaparHtml(row.total)}</strong></td></tr>`],
    ['pagos', 'ventas/pagos', 'id_pago', row => `<tr data-id="${escaparHtml(row.id_pago)}"><td>#${escaparHtml(row.id_pago)}</td><td>#${escaparHtml(row.id_pedido)}</td><td>${escaparHtml(row.metodo_pago)}</td><td><span class="${claseEstado(row.estado_pago)}">${escaparHtml(row.estado_pago)}</span></td></tr>`],
    ['envios', 'ventas/envios', 'id_envio', row => `<tr data-id="${escaparHtml(row.id_envio)}"><td>#${escaparHtml(row.id_envio)}</td><td>#${escaparHtml(row.id_pedido)}</td><td>${escaparHtml(row.tipo_entrega)}</td><td><span class="${claseEstado(row.estado)}">${escaparHtml(row.estado)}</span></td></tr>`]
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
  aplicarBloqueoBorradoVentas();
}

// Que filas no se pueden eliminar. Un pago REALIZADO y un envio ENTREGADO no se
// borran: no son un error de carga, son el comprobante de que paso. El motivo
// lo trae el backend en `bloqueado_por`; el frontend solo lo muestra, para que
// la regla no exista en dos lugares.
const bloqueosBorradoVentas = {
  'pedido': { registro: () => pedidosPorId, motivos: [] },
  'pago': { registro: () => pagosPorId, motivos: [{ campo: 'bloqueado_por' }] },
  'envío': { registro: () => enviosPorId, motivos: [{ campo: 'bloqueado_por' }] }
};

function aplicarBloqueoBorradoVentas() {
  Object.entries(bloqueosBorradoVentas).forEach(([entidad, { registro, motivos }]) => {
    const tabla = document.querySelector(`table[data-modal-entity="${entidad}"]`);
    if (!tabla) return;
    tabla.tBodies[0]?.querySelectorAll('tr').forEach(fila => {
      const boton = fila.querySelector('[data-row-action="delete"]');
      if (!boton) return;
      const filaRegistro = registro().get(String(fila.dataset.id));
      const razones = motivos
        .map(({ campo }) => filaRegistro?.[campo])
        .filter(Boolean);
      boton.disabled = razones.length > 0;

      boton.removeAttribute('title');
      let envoltorio = boton.parentElement;
      if (envoltorio?.classList.contains('bloqueo-borrado')) {
        envoltorio.removeAttribute('title');
      } else {
        envoltorio = document.createElement('span');
        envoltorio.className = 'bloqueo-borrado';
        boton.parentNode.insertBefore(envoltorio, boton);
        envoltorio.appendChild(boton);
      }
      envoltorio.title = razones.length
        ? `No se puede eliminar: ${razones.join(' y ')}`
        : 'Eliminar este registro';
    });
  });
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

// Pagos: sale sin tocar el backend. El listado ya trae los cuatro campos, asi
// que el esquema alcanza. Por eso tiene "Ver mas" mientras que antes no lo tenia.
detalleEntidades['pago'] = {
  titulo: 'Pago',
  registro: pagosPorId,
  campos: [
    { campo: 'id_pago', etiqueta: 'ID' },
    { campo: 'id_pedido', etiqueta: 'Pedido', relacion: 'pedidos' },
    { campo: 'metodo_pago', etiqueta: 'Método',
      enumeracion: ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'],
      etiquetas: ['Efectivo', 'Transferencia', 'Débito', 'Crédito'] },
    { campo: 'estado_pago', etiqueta: 'Estado',
      enumeracion: ['PENDIENTE', 'REALIZADO'],
      etiquetas: ['Pendiente', 'Realizado'] }
  ]
};

// Pedido: los campos planos salen del listado, pero las lineas, los pagos y el
// envio son tablas hijas. Se piden al abrir el modal con `carga`, no al listar.
//
// Que no tenga `registrarFormulario` es otra cosa y no se contradice con esto:
// ese registra el modal de Editar, que el backend rechaza para el pedido porque
// tiene detalle. Este es solo lectura.
detalleEntidades['pedido'] = {
  titulo: 'Pedido',
  registro: pedidosPorId,
  carga: 'ventas/pedidos/:id/detalle',
  campos: [
    { campo: 'id_pedido', etiqueta: 'ID' },
    { campo: 'cliente', etiqueta: 'Cliente' },
    { campo: 'fecha', etiqueta: 'Fecha', fecha: true },
    { campo: 'estado', etiqueta: 'Estado',
      enumeracion: ['PENDIENTE', 'PREPARANDO', 'ENVIADO', 'ENTREGADO'],
      etiquetas: ['Pendiente', 'Preparando', 'Enviado', 'Entregado'] },
    { campo: 'subtotal', etiqueta: 'Subtotal', prefijo: '$' },
    { campo: 'costo_envio', etiqueta: 'Costo de envío', prefijo: '$' },
    { campo: 'total', etiqueta: 'Total', prefijo: '$' }
  ],
  listas: [
    {
      titulo: 'Productos',
      campo: 'lineas',
      vacio: 'Este pedido no tiene líneas de detalle',
      columnas: [
        // El backend ya devuelve el producto y su presentacion juntos
        // ("Balanceado para perro adulto — Rojo"): en columnas separadas la
        // presentacion parece un dato suelto sin contexto.
        { campo: 'producto', etiqueta: 'Producto' },
        { campo: 'cantidad', etiqueta: 'Cant.' },
        { campo: 'precio_unitario', etiqueta: 'Precio', prefijo: '$' },
        { campo: 'subtotal', etiqueta: 'Subtotal', prefijo: '$' }
      ]
    },
    {
      titulo: 'Pagos',
      campo: 'pagos',
      vacio: 'Este pedido no tiene pagos registrados',
      columnas: [
        { campo: 'metodo_pago', etiqueta: 'Método',
          enumeracion: ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'],
          etiquetas: ['Efectivo', 'Transferencia', 'Débito', 'Crédito'] },
        { campo: 'estado_pago', etiqueta: 'Estado',
          enumeracion: ['PENDIENTE', 'REALIZADO'],
          etiquetas: ['Pendiente', 'Realizado'] }
      ]
    },
    {
      titulo: 'Envíos',
      campo: 'envios',
      vacio: 'Este pedido no tiene envíos registrados',
      columnas: [
        { campo: 'tipo_entrega', etiqueta: 'Tipo',
          enumeracion: ['DOMICILIO', 'SUCURSAL', 'PROGRAMADO'],
          etiquetas: ['Domicilio', 'Sucursal', 'Programado'] },
        { campo: 'estado', etiqueta: 'Estado',
          enumeracion: ['EN_CAMINO', 'ENTREGADO'],
          etiquetas: ['En camino', 'Entregado'] },
        { campo: 'fecha_estimada', etiqueta: 'Estimada', fecha: true },
        { campo: 'fecha_entrega', etiqueta: 'Entregada', fecha: true }
      ]
    }
  ]
};