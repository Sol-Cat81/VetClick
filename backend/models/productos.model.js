const db = require('./../config/database')

class Carrito {
    // Devuelve los productos del usuario usando las columnas y relaciones del esquema VetClick.
    static async traer(idUsuario) {
        const query = `SELECT ci.id_variante,
                    ci.cantidad,
                    p.nombre,
                    COALESCE((
                        SELECT SUM(i.stock_actual)
                        FROM inventario AS i
                        WHERE i.id_variante = v.id_variante
                    ), 0) AS stock,
                    p.imagen AS imagen_producto,
                    v.precio,
                    p.descuento,
                    va.nombre AS atributo,
                    a.nombre AS atributo_nombre
                    FROM carrito_items AS ci
                    JOIN variantes AS v
                    ON v.id_variante = ci.id_variante
                    JOIN productos AS p
                    ON p.id_producto = v.id_producto
                    LEFT JOIN valores_atributo AS va
                    ON va.id_valor = v.id_valor_atributo
                    LEFT JOIN atributos AS a
                    ON a.id_atributo = va.id_atributo
	                WHERE ci.id_usuario = ?;`
        const [result] = await db.execute(query, [idUsuario])
        return result
    }

    // Agrega unidades solo si la variante existe y el total no supera su stock.
    static async agregar(idUsuario, idVariante, cantidad) {
        const conexion = await db.getConnection()
        try {
            await conexion.beginTransaction()
            const [variantes] = await conexion.execute(
                'SELECT id_variante FROM variantes WHERE id_variante = ? FOR UPDATE',
                [idVariante],
            )
            if (variantes.length === 0) throw new Error('La variante no existe')

            const [inventario] = await conexion.execute(
                `SELECT stock_actual
                 FROM inventario
                 WHERE id_variante = ?
                 FOR UPDATE`,
                [idVariante],
            )
            const stockDisponible = inventario.reduce(
                (total, fila) => total + Number(fila.stock_actual || 0),
                0,
            )

            const [items] = await conexion.execute(
                'SELECT cantidad FROM carrito_items WHERE id_usuario = ? AND id_variante = ?',
                [idUsuario, idVariante],
            )
            const cantidadActual = items.length ? Number(items[0].cantidad) : 0
            if (cantidadActual + cantidad > stockDisponible) {
                throw new Error('No hay stock suficiente')
            }

            await conexion.execute(
                `INSERT INTO carrito_items (id_usuario, id_variante, cantidad)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad)`,
                [idUsuario, idVariante, cantidadActual + cantidad],
            )
            await conexion.commit()
            return true
        } catch (error) {
            await conexion.rollback()
            throw error
        } finally {
            conexion.release()
        }
    }

    // Quita del carrito del usuario la variante indicada.
    static async eliminar(idUsuario, idVariante) {
        const query = 'DELETE FROM carrito_items WHERE id_usuario = ? AND id_variante = ?'
        const [resultado] = await db.execute(query, [idUsuario, idVariante])
        return resultado.affectedRows
    }

    // Cambia la cantidad únicamente cuando no supera las unidades disponibles.
    static async actualizarCantidad(idUsuario, idVariante, cantidad) {
        const query = `UPDATE carrito_items ci
                       SET ci.cantidad = ?
                       WHERE ci.id_usuario = ? AND ci.id_variante = ?
                       AND ? <= (
                           SELECT COALESCE(SUM(i.stock_actual), 0)
                           FROM inventario AS i
                           WHERE i.id_variante = ci.id_variante
                       )`
        const [resultado] = await db.execute(query, [cantidad, idUsuario, idVariante, cantidad])
        return resultado.affectedRows
    }

    // Vacía todos los artículos del carrito de un usuario.
    static async borrar(idUsuario) {
        const query = 'DELETE FROM carrito_items WHERE id_usuario = ?'
        const [resultado] = await db.execute(query, [idUsuario])
        return resultado.affectedRows
    }

    static async cantidadCargada(idUsuario){
        const query = 'SELECT SUM(cantidad) AS total FROM carrito_items WHERE id_usuario = ?'
        const [ resultado ] = await db.execute(query, [idUsuario])
        return resultado[0].total
    }
}

class Productos{
    static async traerDestacados(){
        const query = `SELECT p.id_producto,
	          p.nombre,
	          p.descripcion,
	          p.descuento,
	          v.id_variante,
	          v.id_valor_atributo,
	          va.nombre AS atributo,
              a.nombre AS atributo_nombre,
	          v.precio,
              COALESCE((
                SELECT SUM(i.stock_actual)
                FROM inventario AS i
                WHERE i.id_variante = v.id_variante
              ), 0) AS stock,
	          p.imagen AS imagen_producto
                FROM productos AS p 
                INNER JOIN variantes AS v
                ON p.id_producto = v.id_producto 
                LEFT JOIN valores_atributo AS va
                ON v.id_valor_atributo = va.id_valor
                LEFT JOIN atributos AS a
                ON a.id_atributo = va.id_atributo
                WHERE p.activo = TRUE
                ORDER BY p.id_producto, v.id_variante;`
        const [ resultado ] = await db.execute(query)
        return resultado
        }
    static async traer(){
        const query = `
            SELECT
            p.id_producto,
              p.id_marca,
              m.nombre AS marca,
	          p.nombre,
	          p.descripcion,
	          p.descuento,
              pc.id_categoria,
              c.nombre AS categoria,
              c.categoria_padre,
	          v.id_variante,
	          v.id_valor_atributo,
	          va.nombre AS atributo,
              a.nombre AS atributo_nombre,
	          v.precio,
	          COALESCE((
	            SELECT SUM(i.stock_actual)
	            FROM inventario AS i
	            WHERE i.id_variante = v.id_variante
	          ), 0) AS stock,
	          p.imagen AS imagen_producto
            FROM productos AS p 
            INNER JOIN marcas AS m
            ON p.id_marca = m.id_marca
            INNER JOIN variantes AS v
            ON p.id_producto = v.id_producto 
            LEFT JOIN productos_categorias AS pc
            ON p.id_producto = pc.id_producto
            LEFT JOIN categorias AS c
            ON pc.id_categoria = c.id_categoria
            LEFT JOIN valores_atributo AS va
            ON v.id_valor_atributo = va.id_valor
            LEFT JOIN atributos AS a
            ON a.id_atributo = va.id_atributo
            WHERE p.activo = TRUE
            ORDER BY p.id_producto, v.id_variante;`
        const [ resultado ] = await db.execute(query)
        return resultado
    }

    static async categoriasPadre(){
        const query = 'SELECT id_categoria, nombre, categoria_padre FROM categorias WHERE categoria_padre IS NULL ORDER BY nombre;'
        const [ resultado ] = await db.execute(query)
        return resultado
    }

    static async marcas(){
        const query = 'SELECT id_marca, nombre, imagen_marca FROM marcas ORDER BY nombre;'
        const [ resultado ] = await db.execute(query)
        return resultado
    }

    // Busca productos con filtros aplicados en SQL y paginación por página.
    // Devuelve { total, filas }: total = cant. de productos distintos que cumplen
    // los filtros, filas = detalle (producto x variante x categoría) solo de la
    // página pedida. Así el frontend no descarga todo el catálogo.
    static async buscarFiltrado({ q, categorias = [], marcas = [], precioMin, precioMax, page = 1, limit = 8 }) {
        // Lista de condiciones del WHERE y sus valores (placeholders "?").
        // Usar placeholders evita inyección SQL: nunca se concatena input directo.
        const condiciones = ['p.activo = TRUE'];
        const params = [];
        // Parámetros exclusivos del CTE recursivo de categorías (van primero).
        let cte = '';
        let cteParams = [];

        // Filtro de texto: busca en nombre o descripción con LIKE parcial.
        if (q) {
            condiciones.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)');
            const patron = `%${q}%`;
            params.push(patron, patron);
        }

        // Filtro de marcas: IN dinámico con un "?" por cada id.
        if (marcas.length) {
            const marcadores = marcas.map(() => '?').join(',');
            condiciones.push(`p.id_marca IN (${marcadores})`);
            params.push(...marcas);
        }

        // Filtro de categorías incluyendo subcategorías hijas en SQL.
        // El CTE "subcats" parte de las elegidas y baja por categoria_padre,
        // entonces tildar "Alimentos" también trae "Lácteos" sin lógica en frontend.
        if (categorias.length) {
            const marcadores = categorias.map(() => '?').join(',');
            cte = `WITH RECURSIVE subcats(id_categoria) AS (
                SELECT id_categoria FROM categorias WHERE id_categoria IN (${marcadores})
                UNION ALL
                SELECT c.id_categoria FROM categorias c
                INNER JOIN subcats s ON c.categoria_padre = s.id_categoria
            ) `;
            cteParams = [...categorias];
            condiciones.push(`EXISTS (
                SELECT 1 FROM productos_categorias pc
                WHERE pc.id_producto = p.id_producto
                AND pc.id_categoria IN (SELECT id_categoria FROM subcats)
            )`);
        }

        // Filtro de precio sobre el precio FINAL (con descuento aplicado).
        // Se usa EXISTS: el producto pasa si AL MENOS UNA variante cae en el rango,
        // misma regla que antes se calculaba en el navegador.
        const formulaPrecio = '(v2.precio * (1 - p.descuento / 100))';
        if (precioMin != null && precioMax != null) {
            condiciones.push(`EXISTS (SELECT 1 FROM variantes v2 WHERE v2.id_producto = p.id_producto AND ${formulaPrecio} BETWEEN ? AND ?)`);
            params.push(precioMin, precioMax);
        } else if (precioMin != null) {
            condiciones.push(`EXISTS (SELECT 1 FROM variantes v2 WHERE v2.id_producto = p.id_producto AND ${formulaPrecio} >= ?)`);
            params.push(precioMin);
        } else if (precioMax != null) {
            condiciones.push(`EXISTS (SELECT 1 FROM variantes v2 WHERE v2.id_producto = p.id_producto AND ${formulaPrecio} <= ?)`);
            params.push(precioMax);
        }

        const whereSql = `WHERE ${condiciones.join(' AND ')}`;

        // 1) Total de productos distintos: sirve para dibujar la paginación.
        const [conteo] = await db.execute(
            `${cte}SELECT COUNT(DISTINCT p.id_producto) AS total FROM productos p ${whereSql}`,
            [...cteParams, ...params]
        );
        const total = Number(conteo[0]?.total || 0);
        if (total === 0) return { total: 0, filas: [] };

        // 2) Ids de la página pedida. Se pagina por PRODUCTO (no por fila
        // variante x categoría) para no cortar variantes a la mitad.
        // LIMIT/OFFSET se interpolan como enteros ya validados (no vienen de SQL).
        const offset = (page - 1) * limit;
        const [ids] = await db.execute(
            `${cte}SELECT DISTINCT p.id_producto FROM productos p ${whereSql} ORDER BY p.id_producto LIMIT ${limit} OFFSET ${offset}`,
            [...cteParams, ...params]
        );
        if (!ids.length) return { total, filas: [] };
        const marcadoresIds = ids.map(() => '?').join(',');
        const valoresIds = ids.map((f) => f.id_producto);

        // 3) Detalle completo solo de esos ids (mismas columnas que traer()).
        const [filas] = await db.execute(
            `SELECT p.id_producto, p.id_marca, m.nombre AS marca,
              p.nombre, p.descripcion, p.descuento,
              pc.id_categoria, c.nombre AS categoria, c.categoria_padre,
              v.id_variante, v.id_valor_atributo, va.nombre AS atributo,
              a.nombre AS atributo_nombre, v.precio,
              COALESCE((SELECT SUM(i.stock_actual) FROM inventario AS i
                WHERE i.id_variante = v.id_variante), 0) AS stock,
              p.imagen AS imagen_producto
            FROM productos AS p
            INNER JOIN marcas AS m ON p.id_marca = m.id_marca
            INNER JOIN variantes AS v ON p.id_producto = v.id_producto
            LEFT JOIN productos_categorias AS pc ON p.id_producto = pc.id_producto
            LEFT JOIN categorias AS c ON pc.id_categoria = c.id_categoria
            LEFT JOIN valores_atributo AS va ON v.id_valor_atributo = va.id_valor
            LEFT JOIN atributos AS a ON a.id_atributo = va.id_atributo
            WHERE p.id_producto IN (${marcadoresIds})
            ORDER BY p.id_producto, v.id_variante`,
            valoresIds
        );
        return { total, filas };
    }

    // Rango global de precios finales: el frontend lo usa para calibrar los
    // sliders min/max sin descargar todos los productos.
    static async rangoPrecios() {
        const [filas] = await db.execute(
            `SELECT
              MIN(v.precio * (1 - p.descuento / 100)) AS minimo,
              MAX(v.precio * (1 - p.descuento / 100)) AS maximo
            FROM productos AS p
            INNER JOIN variantes AS v ON p.id_producto = v.id_producto
            WHERE p.activo = TRUE`
        );
        return {
            minimo: Math.floor(Number(filas[0]?.minimo || 0)),
            maximo: Math.ceil(Number(filas[0]?.maximo || 0))
        };
    }
}

module.exports = { Carrito, Productos }