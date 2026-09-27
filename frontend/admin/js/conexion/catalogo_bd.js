async function cargarCatalogo(){
  const paneles = [
    ['productos', 'catalogo/productos', row => `
      <tr>
        <td>${escaparHtml(row.id_producto)}</td>
        <td>${escaparHtml(row.nombre)}</td>
        <td>${escaparHtml(row.marca)}</td>
        <td>${escaparHtml(row.descripcion)}</td>
        <td>${escaparHtml(row.descuento)}%</td>
        <td><span class="status ${row.activo ? 'success' : 'warning'}">${row.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td>${escaparHtml(row.imagen_url || 'Sin imagen')}</td>
      </tr>
    `],
    ['categorias', 'catalogo/categorias', row => `<tr><td>${escaparHtml(row.id_categoria)}</td><td>${escaparHtml(row.nombre)}</td><td>${escaparHtml(row.categoria_padre || '—')}</td></tr>`],
    ['marcas', 'catalogo/marcas', row => `<tr><td>${escaparHtml(row.id_marca)}</td><td>${escaparHtml(row.nombre)}</td></tr>`],
    ['variantes', 'catalogo/variantes', row => `<tr><td>${escaparHtml(row.id_variante)}</td><td>${escaparHtml(row.producto)}</td><td>$${escaparHtml(row.precio)}</td><td>${escaparHtml(row.stock)}</td><td>${escaparHtml(row.atributo || '—')}</td></tr>`]
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

const formularioProducto = document.querySelector('[data-admin-modal="producto"] form');
if (formularioProducto) {
  formularioProducto.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData();
    const archivo = formularioProducto.querySelector('input[type="file"]')?.files?.[0];

    formData.append('nombre', formularioProducto.producto.value.trim());
    formData.append('marca', formularioProducto.marca.value.trim() || 'Genérica');
    formData.append('descripcion', formularioProducto.descripcion.value.trim());
    formData.append('descuento', Number(formularioProducto.descuento.value || 0));
    formData.append('activo', formularioProducto.estado.value === 'Activo');

    if (archivo) {
      formData.append('imagen', archivo);
    }

    try {
      const respuesta = await fetch('http://localhost:3000/api/catalogo/productos', {
        method: 'POST',
        body: formData
      });

      if (!respuesta.ok) {
        const errorBody = await respuesta.json().catch(() => ({}));
        throw new Error(errorBody.mensaje || 'Error al guardar producto');
      }

      const resultado = await respuesta.json();
      console.log(resultado);
      alert('Producto guardado correctamente');
      formularioProducto.reset();
      cargarCatalogo();
    } catch (error) {
      console.error(error);
      alert(error.message || 'No se pudo guardar el producto');
    }
  });
}
