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

async function traerTodosProductos() {
    const productos = await Productos.traer()
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
          imagen: producto.imagen_producto || producto.imagen_variante,
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
          atributo: producto.atributo || "Disponible",
          imagen: producto.imagen_variante,
        });
      }
    });

    return ordenarProd
}

module.exports = { traerCarrito, eliminarItem, agregarItem, cambiarCantidad, cantidadCargada, traerTodosProductos }