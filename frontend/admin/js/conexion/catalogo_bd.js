async function cargarCatalogo() {
  const paneles = [
    ['productos', 'catalogo/productos', row => `
      <tr>
        <td>${escaparHtml(row.id_producto)}</td>
        <td>${escaparHtml(row.nombre)}</td>
        <td>${escaparHtml(row.marca)}</td>
        <td>${escaparHtml(row.descripcion)}</td>
        <td>${escaparHtml(row.descuento)}%</td>
        <td><span class="status ${row.activo ? 'success' : 'warning'}">${row.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td>${escaparHtml(row.imagen || 'Sin imagen')}</td>
      </tr>
    `],
    ['categorias', 'catalogo/categorias', row => `<tr><td>${escaparHtml(row.id_categoria)}</td><td>${escaparHtml(row.nombre)}</td><td>${escaparHtml(row.categoria_padre || '—')}</td></tr>`],
    ['marcas', 'catalogo/marcas', row => `<tr><td>${escaparHtml(row.id_marca)}</td><td>${escaparHtml(row.nombre)}</td><td>${escaparHtml(row.imagen_marca)}</td></tr>`],
    ['variantes', 'catalogo/variantes', row => `<tr><td>${escaparHtml(row.id_variante)}</td><td>${escaparHtml(row.producto)}</td><td>$${escaparHtml(row.precio)}</td><td>${escaparHtml(row.atributo || '—')}</td></tr>`]
  ];

  for (const [panel, endpoint, render] of paneles) {
    try {
      const table = document.querySelector(`#${panel}-table`);
      if (!table) continue;
      const rows = await obtenerDatos(endpoint);
      table.querySelector('tbody').innerHTML = rows.map(render).join('');
    } catch (error) {
      informarErrorCarga(endpoint, error);
    }
  }
}

async function cargarAtributos() {
  try {
    const atributos = await obtenerDatos('catalogo/atributos');
    const tbody = document.querySelector('#atributos-table tbody');
    if (tbody) tbody.innerHTML = (atributos || []).map(row => `<tr><td>${escaparHtml(row.id_atributo)}</td><td>${escaparHtml(row.nombre)}</td></tr>`).join('');
  } catch (error) { informarErrorCarga('catalogo/atributos', error); }
  try {
    const valores = await obtenerDatos('catalogo/valores-atributo');
    const tbody = document.querySelector('#valores-atributo-table tbody');
    if (tbody) tbody.innerHTML = (valores || []).map(row => `<tr><td>${escaparHtml(row.id_valor)}</td><td>${escaparHtml(row.atributo || '—')}</td><td>${escaparHtml(row.nombre)}</td></tr>`).join('');
  } catch (error) { informarErrorCarga('catalogo/valores-atributo', error); }
}
