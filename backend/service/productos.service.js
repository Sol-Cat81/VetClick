const { Carrito, Productos } = require('./../models/productos.model')

// Obtiene el contenido; una lista vacía representa un carrito sin artículos.
async function traerCarrito(idUsuario) {
    return Carrito.traer(idUsuario)
}

// Elimina una variante concreta del carrito de un usuario.
async function eliminarItem(idUsuario, idVariante){
    const eliminar = await Carrito.eliminar(idUsuario, idVariante)
    return eliminar
}

// Cambia la cantidad solicitada; el modelo comprueba el stock disponible.
async function cambiarCantidad(idUsuario, idVariante, cantidad){
    return Carrito.actualizarCantidad(idUsuario, idVariante, cantidad)
}

// Valida los datos de alta y delega en el modelo la operación transaccional.
async function agregarItem(datos) {
    const idUsuario = datos.id;
    const idVariante = datos.variante
    const cantidad = datos.cantidad
    if (!Number.isInteger(Number(idVariante)) || Number(idVariante) <= 0 ||
        !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
        throw new Error('La variante o la cantidad no son válidas')
    }
    return Carrito.agregar(idUsuario, Number(idVariante), Number(cantidad))
}

async function cantidadCargada(dato) {
    return Carrito.cantidadCargada(dato)
}

// Agrupa filas planas (producto x variante x categoría) en objetos por producto.
// Se reutiliza tanto para el listado completo legacy como para la búsqueda paginada.
function agruparFilas(productos) {
    const ordenarProd = {};
    productos.forEach((producto) => {
      if (!ordenarProd[producto.id_producto]) {
        ordenarProd[producto.id_producto] = {
          id: producto.id_producto,
            id_marca: producto.id_marca,
            marca: producto.marca,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          descuento: producto.descuento,
          imagen: producto.imagen_producto,
            categorias: [],
          variantes: [],
        };
      }

      const productoAgrupado = ordenarProd[producto.id_producto];

      if (producto.id_categoria && !productoAgrupado.categorias.some(
        (categoria) => categoria.id === producto.id_categoria
      )) {
        productoAgrupado.categorias.push({
          id: producto.id_categoria,
          nombre: producto.categoria,
          categoria_padre: producto.categoria_padre,
        });
      }

      if (!productoAgrupado.variantes.some(
        (variante) => variante.id === producto.id_variante
      )) {
        productoAgrupado.variantes.push({
          id: producto.id_variante,
          id_atributo: producto.id_valor_atributo,
          precio: producto.precio,
          stock: producto.stock,
          atributo: producto.atributo_nombre
            ? `${producto.atributo_nombre}: ${producto.atributo}`
            : "Disponible",
        });
      }
    });

    return Object.values(ordenarProd);
}

// Convierte query params sueltos en lista de enteros positivos únicos.
// Acepta "1,2", ["1","2"] o [1,2]; ignora valores no numéricos.
function parsearIds(valor) {
    if (valor === undefined || valor === null || valor === '') return [];
    const lista = Array.isArray(valor) ? valor.flatMap((v) => String(v).split(',')) : String(valor).split(',');
    const ids = lista.map((v) => Number(String(v).trim())).filter((n) => Number.isInteger(n) && n > 0);
    return [...new Set(ids)];
}

async function traerTodosProductos() {
    const productos = await Productos.traer()
    return agruparFilas(productos).reduce((acc, p) => { acc[p.id] = { ...p, categorias: p.categorias, variantes: p.variantes }; return acc; }, {});
}

// Búsqueda paginada del catálogo: valida filtros del querystring y delega al
// modelo que resuelve todo en SQL (WHERE + COUNT + LIMIT/OFFSET).
// Devuelve { data, total, pagina, porPagina, totalPaginas } listo para el frontend.
async function buscarProductosCatalogo(filtros) {
    // Texto libre: se recorta y se limita para no mandar LIKE gigantes.
    const q = String(filtros?.q ?? '').trim().slice(0, 100) || null;
    const categorias = parsearIds(filtros?.categorias ?? filtros?.categoria);
    const marcas = parsearIds(filtros?.marcas ?? filtros?.marca);

    // Precios: solo se aceptan números finitos >= 0; si min > max se intercambian.
    let precioMin = filtros?.precioMin ?? filtros?.min ?? null;
    let precioMax = filtros?.precioMax ?? filtros?.max ?? null;
    precioMin = precioMin === '' || precioMin == null ? null : Number(precioMin);
    precioMax = precioMax === '' || precioMax == null ? null : Number(precioMax);
    if (precioMin != null && (!Number.isFinite(precioMin) || precioMin < 0)) precioMin = null;
    if (precioMax != null && (!Number.isFinite(precioMax) || precioMax < 0)) precioMax = null;
    if (precioMin != null && precioMax != null && precioMin > precioMax) {
        [precioMin, precioMax] = [precioMax, precioMin];
    }

    // Paginación: página >= 1, límite entre 1 y 50 (default 8 como la grilla actual).
    let page = Number.parseInt(filtros?.page ?? filtros?.pagina ?? 1, 10);
    let limit = Number.parseInt(filtros?.limit ?? filtros?.porPagina ?? 8, 10);
    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = 8;
    if (limit > 50) limit = 50;

    const { total, filas } = await Productos.buscarFiltrado({
        q, categorias, marcas, precioMin, precioMax, page, limit
    });

    return {
        data: agruparFilas(filas),
        total,
        pagina: page,
        porPagina: limit,
        totalPaginas: Math.max(1, Math.ceil(total / limit))
    };
}

// Rango de precios finales para calibrar sliders sin traer productos.
async function obtenerRangoPrecios() {
    return Productos.rangoPrecios();
}

async function obtenerCategoriasPadre() {
    return Productos.categoriasPadre();
}

async function obtenerMarcas() {
    return Productos.marcas();
}

module.exports = { 
  traerCarrito, 
  eliminarItem, 
  agregarItem, 
  cambiarCantidad, 
  cantidadCargada, 
  traerTodosProductos, 
  buscarProductosCatalogo, 
  obtenerRangoPrecios, 
  obtenerCategoriasPadre, 
  obtenerMarcas 
}