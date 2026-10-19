const db = require('./../config/database')

class Usuario {
    static async traerUsuarioEmail(email) {
        const query = `SELECT * FROM usuarios WHERE email = ?;`
        const [usuario] = await db.execute(query, [email])
        return usuario
    }

    static async traerUsuario(idUsuario) {
        const query = 'SELECT username, email , img_usuario FROM usuarios WHERE id_usuario = ?;'
        const [usuario] = await db.execute(query, [idUsuario])
        return usuario
    }

    static async actualizarUsuario(idUsuario, username) {
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

    static async actualizarImagenUsuario(id_usuario , imagen){
        try{
            const query = 'UPDATE usuarios SET img_usuario = ? WHERE id_usuario = ?'
            const [resultado] = await db.execute(query, [imagen,id_usuario])
            return true;
        }catch (error){
            console.error('error al guardar la imagen del usuario: ' , error)
            return false;
        }
    };

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

    static async guardarDireccion(id_cliente, tipo_direccion, calle, numero, ciudad, provincia, codigo_postal, departamento, piso, referencia) {
        try {
            const query = `INSERT INTO direcciones(id_cliente, tipo_direccion, calle, numero, localidad, provincia, codigo_postal, departamento, piso, referencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            await db.execute(query, [id_cliente, tipo_direccion, calle, numero, ciudad, provincia, codigo_postal, departamento, piso, referencia])
            return true
        } catch (error) {
            console.error('Error al guardar la dirección:', error)
            return false
        }
    }

    static async actualizarDireccion(id_direccion, tipo_direccion, calle, numero, ciudad, provincia, codigo_postal) {
        try {
            const query = `UPDATE direcciones SET tipo_direccion = ?, calle = ?, numero = ?, localidad = ?, provincia = ?, codigo_postal = ? WHERE id_direccion = ?`
            await db.execute(query, [tipo_direccion, calle, numero, ciudad, provincia, codigo_postal, id_direccion])
            return true
        } catch (error) {
            console.error('Error al actualizar la dirección:', error)
            return false
        }
    }

    static async traerMascotas(idCliente){
        const query = `
        SELECT
            m.id_mascota,
            r.nombre AS raza,
            m.nombre,
            m.sexo,
            m.fecha_nacimiento,
            m.peso,
            m.observaciones
        FROM mascota AS m INNER JOIN
        razas AS r ON m.id_raza = r.id_raza
        WHERE m.id_cliente = ?;
        `
        const [ results ] = await db.execute(query, [ idCliente ])
        return results
    }

    static async traerTurnosGeneral(idCliente){
        const query = `
        SELECT
            t.id_turno,
            t.fecha,
            t.hora,
            t.motivo,
            s.nombre
        FROM turnos AS t INNER JOIN  sucursales AS s
        ON t.id_sucursal = s.id_sucursal
        WHERE t.id_cliente = ?;`
        const [ turnos ] = await db.execute(query, [ idCliente ])
        return turnos
    }

    static async traerCompras(idCliente){
        const query = 'SELECT * FROM pedidos WHERE id_cliente = ?;'
        const [ pedidos ] = await db.execute(query, [ idCliente ])
        return pedidos
    }

    static async traerHistorial(idMascota){
        const query = 'SELECT * FROM historial_medico WHERE id_mascota = ?;'
        const [ historial ] = await db.execute(query, [ idMascota ])
        return historial
    }

}

module.exports = { Usuario }