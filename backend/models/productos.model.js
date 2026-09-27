const db = require('./../config/database')

class Carrito {
    static async traer(idUsuario){
        const query = 'SELECT * FROM carrito_items WHERE id_usuario = ?'
        const [ result ] = await db.execute(query, [ idUsuario ])
        return result
    }

    static async agregar(idUsuario, idVariante, cantidad){
        const query = 'INSERT INTO carrito_items(id_usuario, id_variante, cantidad) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)'
        const [ resultado ] = await db.execute(query, [ idUsuario, idVariante, cantidad || 1 ])
        return resultado.insertId
    }

    static async eliminar(idVariante){
        const query = 'DELETE FROM carrito_items WHERE id_variante = ?'
        const [ resultado ] = await db.execute(query, [ idVariante ])
        return resultado.affectedRows
    }

    static async borrar(idUsuario){
        const query = 'DELETE FROM carrito_items WHERE id_usuario = ?'
        const [ resultado ] = await db.execute(query, [ idUsuario ])
        return resultado.affectedRows
    }
}

module.exports = { Carrito }