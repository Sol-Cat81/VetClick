async function cargarVentas(){
  const configuracion = [
    ['pedidos', 'ventas/pedidos', row => `<tr><td>#${escaparHtml(row.id_pedido)}</td><td>${escaparHtml(row.cliente)}</td><td>${escaparHtml(row.fecha)}</td><td>${escaparHtml(row.estado)}</td><td>$${escaparHtml(row.subtotal)}</td><td>$${escaparHtml(row.costo_envio)}</td><td><strong>$${escaparHtml(row.total)}</strong></td></tr>`],
    ['pagos', 'ventas/pagos', row => `<tr><td>#${escaparHtml(row.id_pago)}</td><td>#${escaparHtml(row.id_pedido)}</td><td>${escaparHtml(row.metodo_pago)}</td><td>${escaparHtml(row.estado_pago)}</td></tr>`],
    ['envios', 'ventas/envios', row => `<tr><td>#${escaparHtml(row.id_envio)}</td><td>#${escaparHtml(row.id_pedido)}</td><td>${escaparHtml(row.tipo_entrega)}</td><td>${escaparHtml(row.codigo_postal)}</td><td>${escaparHtml(row.fecha_estimada)}</td><td>${escaparHtml(row.estado)}</td></tr>`]
  ];
  for(const [panel, endpoint, render] of configuracion){
    try{
      const table = document.querySelector(`#${panel}-table`);
      if(!table) continue;
      const rows = await obtenerDatos(endpoint);
      table.querySelector('tbody').innerHTML = rows.map(render).join('');
    }catch(error){ informarErrorCarga(endpoint, error); }
  }
}
