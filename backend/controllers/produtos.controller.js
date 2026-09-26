const db = require("./../config/database");

const solicitarProductosDestacados = async (req, res) => {
  try {
    const [destacados] = await db.query(`SELECT 
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.descuento,
            v.id_variante,
            va.id_valor_atributo,
            av.nombre AS atributo,
            v.precio,
            v.stock,
            p.imagen_url AS imagen_producto,
            v.imagen AS imagen_variante
            FROM productos AS p 
            INNER JOIN variantes AS v
            ON p.id_producto = v.id_producto 
            LEFT JOIN variantes_atributos AS va
            ON v.id_variante = va.id_variante
            LEFT JOIN valores_atributo AS av
            ON va.id_valor_atributo = av.id_valor
            WHERE p.activo = TRUE
            ORDER BY p.id_producto, v.id_variante
            `);

    const ordenarDest = {};

    destacados.forEach((producto) => {
      if (!ordenarDest[producto.id_producto]) {
        ordenarDest[producto.id_producto] = {
          id: producto.id_producto,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          descuento: producto.descuento,
          imagen: producto.imagen_producto || producto.imagen_variante,
          variantes: [],
        };
      }

      ordenarDest[producto.id_producto].variantes.push({
        id: producto.id_variante,
        id_atributo: producto.id_valor_atributo,
        precio: producto.precio,
        stock: producto.stock,
        atributo: producto.atributo || "Disponible",
        imagen: producto.imagen_variante,
      });
    });

    res.status(201).json(Object.values(ordenarDest));
  } catch (error) {
    console.error("Error al consultar productos: ", error);
    res.status(500).json({ mensaje: "Hubo un error en el servidor" });
  }
};

const solicitarCategorias = async (req, res) => {
  try {
    const [categorias] = await db.query(
      `SELECT id_categoria, nombre, categoria_padre FROM categorias;`,
    );
    // Supongamos que 'rows' es el resultado de tu consulta SQL
    function construirArbolCategorias(categorias) {
      const mapa = {};
      const arbol = [];

      // Primero, creamos un mapa con todos los elementos y les agregamos un array vacío de subcategorías
      categorias.forEach((row) => {
        mapa[row.id_categoria] = { ...row, subcategorias: [] };
      });

      // Luego, asignamos cada hijo a su padre
      categorias.forEach((row) => {
        if (row.categoria_padre !== null) {
          // Si tiene padre, lo metemos en el array de subcategorías del padre
          mapa[row.categoria_padre].subcategorias.push(mapa[row.id_categoria]);
        } else {
          // Si no tiene padre (es NULL), es una categoría principal (raíz)
          arbol.push(mapa[row.id_categoria]);
        }
      });

      return arbol;
    }

    const arbolCategorias = construirArbolCategorias(categorias)

    res.status(201).json({categorias: arbolCategorias});
  } catch (error) {
    console.error("Error al consultar categorias: ", error);
    res.status(500).json({ mensaje: "Hubo un error en el servidor" });
  }
};

module.exports = { solicitarProductosDestacados, solicitarCategorias };
