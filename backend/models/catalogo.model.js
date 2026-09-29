const conexion = require('../config/database');

const q = {
  productos: `SELECT p.id_producto, p.nombre, m.nombre AS marca, p.descripcion, p.descuento, p.activo, p.imagen
              FROM productos p
              JOIN marcas m ON m.id_marca = p.id_marca
              ORDER BY p.id_producto`,
  categorias: `SELECT c.id_categoria, c.nombre, p.nombre AS categoria_padre
               FROM categorias c
               LEFT JOIN categorias p ON p.id_categoria = c.categoria_padre
               ORDER BY c.id_categoria`,
  marcas: 'SELECT id_marca, nombre ,imagen_marca FROM marcas ORDER BY id_marca',
  variantes: `SELECT v.id_variante, p.nombre AS producto, v.precio, va.nombre AS atributo
              FROM variantes v
              JOIN productos p ON p.id_producto = v.id_producto
              LEFT JOIN valores_atributo va ON va.id_valor = v.id_valor_atributo
              ORDER BY v.id_variante`,
  atributos: 'SELECT id_atributo, nombre FROM atributos ORDER BY id_atributo',
  valoresAtributo: `SELECT va.id_valor, va.id_atributo, a.nombre AS atributo, va.nombre
                    FROM valores_atributo va
                    LEFT JOIN atributos a ON a.id_atributo = va.id_atributo
                    ORDER BY va.id_valor`
};

const CatalogoModel = {
  async crearProducto(producto) {
    const nombre = String(producto.nombre ?? '').trim();
    const descripcion = producto.descripcion ? String(producto.descripcion).trim() : null;
    const activo = producto.activo === undefined ? true : Boolean(producto.activo);
    const descuento = Number(producto.descuento ?? 0);
    const idMarca = Number(producto.id_marca);

    const conexionTransaccion = await conexion.getConnection();
    try {
      await conexionTransaccion.beginTransaction();
      const [resultado] = await conexionTransaccion.query(
        `INSERT INTO productos (id_marca, nombre, descripcion, activo, descuento, imagen)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          idMarca,
          nombre,
          descripcion,
          activo,
          descuento,
          producto.imagen || null
        ]
      );
      await conexionTransaccion.query(
        'INSERT INTO productos_categorias (id_categoria, id_producto) VALUES (?, ?)',
        [Number(producto.id_categoria), resultado.insertId]
      );
      await conexionTransaccion.commit();
      return resultado;
    } catch (error) {
      await conexionTransaccion.rollback();
      throw error;
    } finally {
      conexionTransaccion.release();
    }
  }
};

Object.keys(q).forEach((key) => {
  CatalogoModel[key] = async () => {
    const [rows] = await conexion.query(q[key]);
    return rows;
  };
});

module.exports = CatalogoModel;
