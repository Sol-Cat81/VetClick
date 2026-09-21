async function cargarCatalogo(){
  const paneles = [
    ['productos', 'catalogo/productos', row => `<tr><td>${escaparHtml(row.id_producto)}</td><td>${escaparHtml(row.nombre)}</td><td>${escaparHtml(row.marca)}</td><td>${escaparHtml(row.descripcion)}</td><td>${escaparHtml(row.descuento)}%</td><td><span class="status ${row.activo ? 'success' : 'warning'}">${row.activo ? 'Activo' : 'Inactivo'}</span></td></tr>`],
    ['categorias', 'catalogo/categorias', row => `<tr><td>${escaparHtml(row.id_categoria)}</td><td>${escaparHtml(row.nombre)}</td><td>${escaparHtml(row.categoria_padre || '—')}</td></tr>`],
    ['marcas', 'catalogo/marcas', row => `<tr><td>${escaparHtml(row.id_marca)}</td><td>${escaparHtml(row.nombre)}</td></tr>`],
    ['variantes', 'catalogo/variantes', row => `<tr><td>${escaparHtml(row.id_variante)}</td><td>${escaparHtml(row.producto)}</td><td>$${escaparHtml(row.precio)}</td><td>${escaparHtml(row.stock)}</td><td>${escaparHtml(row.atributo || '—')}</td></tr>`]
  ];
  for(const [panel, endpoint, render] of paneles){
    try{
      const table = document.querySelector(`#${panel}-table`);
      if(!table) continue;
      const rows = await obtenerDatos(endpoint);
      table.querySelector('tbody').innerHTML = rows.map(render).join('');
    }catch(error){ informarErrorCarga(endpoint, error); }
  }
}
