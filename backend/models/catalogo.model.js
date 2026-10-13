const conexion = require('../config/database');

const q = {
  productos: `SELECT p.id_producto, p.id_marca, m.nombre AS marca, p.nombre,
                    p.descripcion, p.descuento, p.activo, p.imagen,
                    (SELECT pc.id_categoria FROM productos_categorias pc
                     WHERE pc.id_producto = p.id_producto
                     ORDER BY pc.id_categoria LIMIT 1) AS id_categoria
              FROM productos p
              JOIN marcas m ON m.id_marca = p.id_marca
              ORDER BY p.id_producto`,
  categorias: `SELECT c.id_categoria, c.nombre,
                      c.categoria_padre AS id_categoria_padre, p.nombre AS categoria_padre
               FROM categorias c
               LEFT JOIN categorias p ON p.id_categoria = c.categoria_padre
               ORDER BY c.id_categoria`,
  marcas: 'SELECT id_marca, nombre ,imagen_marca FROM marcas ORDER BY id_marca',
  variantes: `SELECT v.id_variante, v.id_producto, p.nombre AS producto, v.precio,
                     v.id_valor_atributo, va.nombre AS atributo, a.nombre AS atributo_nombre
              FROM variantes v
              JOIN productos p ON p.id_producto = v.id_producto
              LEFT JOIN valores_atributo va ON va.id_valor = v.id_valor_atributo
              LEFT JOIN atributos a ON a.id_atributo = va.id_atributo
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
  },
  async crearMarca(marca){
  const [resultado] = await conexion.query(
    'INSERT INTO marcas (nombre , imagen_marca) VALUES (?,?)',
    [marca.nombre , marca.imagen]
  );
  return resultado;
},

  async obtenerProductoPorId(id){
    const [rows] = await conexion.query(
      'SELECT id_producto, id_marca, nombre, descripcion, descuento, activo, imagen FROM productos WHERE id_producto = ?',
      [id]
    );
    return rows[0] || null;
  },

  // La imagen solo entra en el SET si se subio un archivo nuevo. Si no,
  // el producto conserva la que ya tenia.
  async actualizarProducto(id, datos){
    const permitidos = ['id_marca', 'nombre', 'descripcion', 'descuento', 'activo', 'imagen'];
    const columnas = permitidos.filter(campo => datos[campo] !== undefined);
    if (!columnas.length) return { affectedRows: 0 };

    const sets = columnas.map(campo => `\`${campo}\` = ?`).join(', ');
    const valores = columnas.map(campo => datos[campo]);

    const conexionTransaccion = await conexion.getConnection();
    try {
      await conexionTransaccion.beginTransaction();

      const [resultado] = await conexionTransaccion.query(
        `UPDATE productos SET ${sets} WHERE id_producto = ?`,
        [...valores, id]
      );

      // productos_categorias tiene PK compuesta (id_categoria, id_producto):
      // cambiar la categoria es borrar la fila y volver a insertarla.
      if (datos.id_categoria !== undefined){
        await conexionTransaccion.query(
          'DELETE FROM productos_categorias WHERE id_producto = ?', [id]
        );
        await conexionTransaccion.query(
          'INSERT INTO productos_categorias (id_categoria, id_producto) VALUES (?, ?)',
          [Number(datos.id_categoria), id]
        );
      }

      await conexionTransaccion.commit();
      return resultado;
    } catch (error) {
      await conexionTransaccion.rollback();
      throw error;
    } finally {
      conexionTransaccion.release();
    }
  },

  async obtenerMarcaPorId(id){
    const [rows] = await conexion.query(
      'SELECT id_marca, nombre, imagen_marca FROM marcas WHERE id_marca = ?', [id]
    );
    return rows[0] || null;
  },

  async actualizarMarca(id, datos){
    const permitidos = ['nombre', 'imagen_marca'];
    const columnas = permitidos.filter(campo => datos[campo] !== undefined);
    if (!columnas.length) return { affectedRows: 0 };

    const sets = columnas.map(campo => `\`${campo}\` = ?`).join(', ');
    const [resultado] = await conexion.query(
      `UPDATE marcas SET ${sets} WHERE id_marca = ?`,
      [...columnas.map(campo => datos[campo]), id]
    );
    return resultado;
  },
};

Object.keys(q).forEach((key) => {
  CatalogoModel[key] = async () => {
    const [rows] = await conexion.query(q[key]);
    return rows;
  };
});


module.exports = CatalogoModel;
