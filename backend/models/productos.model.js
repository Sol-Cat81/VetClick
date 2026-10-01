const db = require('./../config/database')

class Carrito {
    // Devuelve los productos del usuario usando las columnas y relaciones del esquema VetClick.
    static async traer(idUsuario) {
        const query = `SELECT ci.id_variante,
                    ci.cantidad,
                    p.nombre,
                    v.stock,
                    p.imagen AS imagen_producto,
                    v.precio,
                    p.descuento,
                    va.nombre AS atributo
                    FROM carrito_items AS ci
                    JOIN variantes AS v
                    ON v.id_variante = ci.id_variante
                    JOIN productos AS p
                    ON p.id_producto = v.id_producto
                    LEFT JOIN valores_atributo AS va
                    ON va.id_valor = v.id_valor_atributo
	                WHERE ci.id_usuario = 1;`
        const [result] = await db.execute(query, [idUsuario])
        return result
    }

    // Agrega unidades solo si la variante existe y el total no supera su stock.
    static async agregar(idUsuario, idVariante, cantidad) {
        const conexion = await db.getConnection()
        try {
            await conexion.beginTransaction()
            const [variantes] = await conexion.execute(
                'SELECT stock FROM variantes WHERE id_variante = ? FOR UPDATE',
                [idVariante],
            )
            if (variantes.length === 0) throw new Error('La variante no existe')

            const [items] = await conexion.execute(
                'SELECT cantidad FROM carrito_items WHERE id_usuario = ? AND id_variante = ?',
                [idUsuario, idVariante],
            )
            const cantidadActual = items.length ? Number(items[0].cantidad) : 0
            if (cantidadActual + cantidad > Number(variantes[0].stock)) {
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
                       JOIN variantes v ON v.id_variante = ci.id_variante
                       SET ci.cantidad = ?
                       WHERE ci.id_usuario = ? AND ci.id_variante = ? AND ? <= v.stock`
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
	          v.precio,
	          v.stock,
	          p.imagen AS imagen_producto
                FROM productos AS p 
                INNER JOIN variantes AS v
                ON p.id_producto = v.id_producto 
                LEFT JOIN valores_atributo AS va
                ON v.id_valor_atributo = va.id_valor
                WHERE p.activo = TRUE
                ORDER BY p.id_producto, v.id_variante;`
        const [ resultado ] = await db.execute(query)
        return resultado
        }
    static async traer(){
        const query = `
            SELECT p.id_producto,
	          p.nombre,
	          p.descripcion,
	          p.descuento,
	          v.id_variante,
	          v.id_valor_atributo,
	          va.nombre AS atributo,
	          v.precio,
	          v.stock,
	          p.imagen AS imagen_producto
            FROM productos AS p 
            INNER JOIN variantes AS v
            ON p.id_producto = v.id_producto 
            LEFT JOIN valores_atributo AS va
            ON v.id_valor_atributo = va.id_valor
            WHERE p.activo = TRUE
            ORDER BY p.id_producto, v.id_variante;`
        const [ resultado ] = await db.execute(query)
        return resultado
    }
}

module.exports = { Carrito, Productos }