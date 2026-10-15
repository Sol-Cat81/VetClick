const db = require('./../config/database')

class Usuario {
    static async traerUsuarioEmail(email) {
        const query = `SELECT * FROM usuarios WHERE email = ?;`
        const [usuario] = await db.execute(query, [email])
        return usuario
    }

    static async traerUsuario(idUsuario) {
        const query = 'SELECT username, email FROM usuarios WHERE id_usuario = ?;'
        const [usuario] = await db.execute(query, [idUsuario])
        return usuario
    }

    static async actulizarUsuario(idUsuario, username) {
        try {
            const query = 'UPDATE usuarios SET username = ? WHERE id_usuario = ?'
            const [resultado] = await db.execute(query, [username, idUsuario])
            return true
        } catch (error) {
            console.error(error)
            return false
        }

    }

    static async traerCliente(id_usuario) {
        const query = 'SELECT * FROM clientes WHERE id_usuario = ?;'
        const [cliente] = await db.execute(query, [id_usuario])
        return cliente
    }

    static async guardarCliente(idUsuario, nombre, apellido, telefono) {
        try {
            const query = `INSERT INTO 
                clientes(id_usuario, nombre, apellido, telefono) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), apellido = VALUES(apellido), telefono = VALUES(telefono);`
            await db.execute(query, [idUsuario, nombre, apellido, telefono])
            return true
        } catch (error) {
            console.error('Error al guardar el cliente:', error)
            return false
        }

    }

    static async traerDireccion(idCliente) {
        const query = 'SELECT * FROM direcciones WHERE id_cliente = ?;'
        const [direcciones] = await db.execute(query, [idCliente])
        return direcciones
    }

    static async traerMascotas(idCliente){
    }
}

module.exports = { Usuario }