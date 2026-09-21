const db = require('./../config/database');

class Carrito {
    // traemos los items del carrito
    static async traerCarrito(idUsuario) {
        const query = 'SELECT * FROM carrito_items WHERE id_usuario = ?;';
        const [respuesta] = await db.execute(query, [idUsuario]);
        return respuesta
    }

    static async borrarItem(idVariante) {
        const query = 'DELETE FROM carrito_items WHERE id_variante = ?;';
        const [ respuesta ] = await db.execute(query, [idVariante]);
        return respuesta.affectedRows
    }

    static async agregarItem(idUsuario, idVariante, cantidad){
        const query = 'INSERT INTO carrito_items VALUES ( ?, ?, ? );';
        const [ respuesta ] = await db.execute(query, [idUsuario, idVariante, cantidad]);
        return {id: respuesta.insertId, idUsuario}
    }

    static async borrarCarrito(idUsuario){
        const query = 'DELETE FROM carrito_items WHERE id_usuario = ?;';
        const [ respuesta ] = await db.execute(query, [idUsuario]);
        return respuesta.affectedRows
    }
}

module.exports = Carrito