const conexion = require('../config/database');

const q = {
  productos: `SELECT p.id_producto, p.nombre, m.nombre AS marca, p.descripcion, p.descuento, p.activo, p.imagen_url
              FROM productos p
              JOIN marcas m ON m.id_marca = p.id_marca
              ORDER BY p.id_producto`,
  categorias: `SELECT c.id_categoria, c.nombre, p.nombre AS categoria_padre
               FROM categorias c
               LEFT JOIN categorias p ON p.id_categoria = c.categoria_padre
               ORDER BY c.id_categoria`,
  marcas: 'SELECT id_marca, nombre FROM marcas ORDER BY id_marca',
  variantes: `SELECT v.id_variante, p.nombre AS producto, v.precio, v.stock, va.nombre AS atributo
              FROM variantes v
              JOIN productos p ON p.id_producto = v.id_producto
              LEFT JOIN variantes_atributos vap ON vap.id_variante = v.id_variante
              LEFT JOIN valores_atributo va ON va.id_valor = vap.id_valor_atributo
              ORDER BY v.id_variante`
};

const CatalogoModel = {
  async buscarMarcaPorNombre(nombre) {
    const marcaNombre = String(nombre ?? '').trim();
    if (!marcaNombre) return 1;

    const [rows] = await conexion.query('SELECT id_marca FROM marcas WHERE nombre = ? LIMIT 1', [marcaNombre]);
    return rows[0]?.id_marca ?? 1;
  },

  async crearProducto(producto) {
    const nombre = String(producto.nombre ?? '').trim();
    const descripcion = producto.descripcion ? String(producto.descripcion).trim() : null;
    const activo = producto.activo === undefined ? true : Boolean(producto.activo);
    const descuento = Number(producto.descuento ?? 0);
    const idMarca = Number(producto.id_marca ?? (await this.buscarMarcaPorNombre(producto.marca)) ?? 1);

    const [resultado] = await conexion.query(
      `INSERT INTO productos (id_marca, nombre, descripcion, activo, descuento, imagen_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idMarca,
        nombre,
        descripcion,
        activo,
        descuento,
        producto.imagen_url || null
      ]
    );

    return resultado;
  }
};

Object.keys(q).forEach((key) => {
  CatalogoModel[key] = async () => {
    const [rows] = await conexion.query(q[key]);
    return rows;
  };
});

module.exports = CatalogoModel;
