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

    static async actualizarImagenUsuario(id_usuario, imagen) {
        try {
            const query = 'UPDATE usuarios SET img_usuario = ? WHERE id_usuario = ?'
            const [resultado] = await db.execute(query, [imagen, id_usuario])
            return true;
        } catch (error) {
            console.error('error al guardar la imagen del usuario: ', error)
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

    static async guardarDireccion(id_cliente, tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia) {
        try {
            const query = `INSERT INTO direcciones(id_cliente, tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
            await db.execute(query, [id_cliente, tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia])
            return true
        } catch (error) {
            console.error('Error al guardar la dirección:', error)
            return false
        }
    }

    static async actualizarDireccion(id_direccion, id_cliente, tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia) {
        try {
            const query = `UPDATE direcciones SET tipo_direccion = ?, calle = ?, numero = ?, provincia = ?, localidad = ?, codigo_postal = ?, departamento = ?, piso = ?, referencia = ? WHERE id_direccion = ? AND id_cliente = ?`
            await db.execute(query, [tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia, id_direccion, id_cliente])
            return true
        } catch (error) {
            console.error('Error al actualizar la dirección:', error)
            return false
        }
    }

    static async traerDireccionEspecifica(idDireccion, idCliente) {
        const query = 'SELECT * FROM direcciones WHERE id_direccion = ? AND id_cliente = ?;'
        const [resultado] = await db.execute(query, [idDireccion, idCliente])
        return resultado[0]
    }

    static async eliminarDireccion(idDireccion, idCliente) {
        const query = 'DELETE FROM direcciones WHERE id_direccion = ? AND id_cliente = ?;'
        const [resultado] = await db.execute(query, [idDireccion, idCliente])
        return resultado.affectedRows > 0
    }

    static async traerMascotas(idCliente) {
        const query = `
        SELECT
            m.id_mascota,
            m.id_raza,
            r.nombre AS raza,
            m.nombre,
            m.sexo,
            DATE_FORMAT(m.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
            m.peso,
            m.observaciones
        FROM mascota AS m
        INNER JOIN razas AS r ON m.id_raza = r.id_raza
        WHERE m.id_cliente = ?;
        `
        const [results] = await db.execute(query, [idCliente])
        return results
    }

    static async traerRazas() {
        const [razas] = await db.execute('SELECT id_raza, nombre FROM razas ORDER BY nombre')
        return razas
    }

    static async guardarMascota(id_cliente, nombre, raza, sexo, fecha_nacimiento, peso, observaciones) {
        try {
            const query = 'INSERT INTO mascota(id_cliente, nombre, id_raza, sexo, fecha_nacimiento, peso, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?);'
            await db.execute(query, [id_cliente, nombre, raza, sexo, fecha_nacimiento, peso, observaciones])
            return true
        } catch (error) {
            throw error
        }
    }

    static async traerMascota(idMascota, idCliente) {
        const query = `
            SELECT m.id_mascota, m.id_cliente, m.id_raza, r.nombre AS raza,
                   m.nombre, m.sexo,
                   DATE_FORMAT(m.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
                   m.peso, m.observaciones
            FROM mascota m
            INNER JOIN razas r ON r.id_raza = m.id_raza
            WHERE m.id_mascota = ? AND m.id_cliente = ?`
        const [resultado] = await db.execute(query, [idMascota, idCliente])
        return resultado[0]
    }

    static async actualizarMascota(idMascota, idCliente, nombre, raza, sexo, fecha_nacimiento, peso, observaciones) {
        try {
            const query = 'UPDATE mascota SET nombre = ?, id_raza = ?, sexo = ?, fecha_nacimiento = ?, peso = ?, observaciones = ? WHERE id_mascota = ? AND id_cliente = ?;'
            await db.execute(query, [nombre, raza, sexo, fecha_nacimiento, peso, observaciones, idMascota, idCliente])
            return true
        } catch (error) {
            throw error
        }
    }

    static async eliminarMascota(idMascota, idCliente) {
        const connection = await db.getConnection()
        try {
            await connection.beginTransaction()
            const [mascotas] = await connection.execute(
                'SELECT id_mascota FROM mascota WHERE id_mascota = ? AND id_cliente = ? FOR UPDATE',
                [idMascota, idCliente]
            )
            if (mascotas.length === 0) {
                await connection.rollback()
                return false
            }

            await connection.execute(
                `DELETE FROM tratamientos
                 WHERE id_historial IN (
                    SELECT id_historial FROM historial_medico WHERE id_mascota = ?
                 )`,
                [idMascota]
            )
            await connection.execute('DELETE FROM historial_medico WHERE id_mascota = ?', [idMascota])
            await connection.execute('DELETE FROM vacunas WHERE id_mascota = ?', [idMascota])
            await connection.execute('DELETE FROM turnos WHERE id_mascota = ?', [idMascota])
            await connection.execute('DELETE FROM mascota WHERE id_mascota = ? AND id_cliente = ?', [idMascota, idCliente])
            await connection.commit()
            return true
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    }

    static async traerTurnosGeneral(idCliente) {
        const query = `
        SELECT
            t.id_turno,
            DATE_FORMAT(t.fecha, '%Y-%m-%d') AS fecha,
            TIME_FORMAT(t.hora, '%H:%i') AS hora,
            t.motivo,
            t.estado,
            t.observaciones,
            m.id_mascota,
            m.nombre AS mascota,
            s.nombre AS sucursal,
            se.nombre AS servicio
        FROM turnos AS t
        LEFT JOIN sucursales AS s ON t.id_sucursal = s.id_sucursal
        INNER JOIN mascota AS m ON m.id_mascota = t.id_mascota
        INNER JOIN servicios AS se ON se.id_servicio = t.id_servicio
        WHERE t.id_cliente = ?
        ORDER BY t.fecha DESC, t.hora DESC;`
        const [turnos] = await db.execute(query, [idCliente])
        return turnos
    }

    static async traerCompras(idCliente) {
        const query = `SELECT id_pedido, DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') AS fecha,
                              estado, subtotal, costo_envio, total
                       FROM pedidos WHERE id_cliente = ? ORDER BY fecha DESC;`
        const [pedidos] = await db.execute(query, [idCliente])
        return pedidos
    }

    static async traerFichaMascota(idMascota, idCliente) {
        const [mascotas] = await db.execute(
            `SELECT m.id_mascota, m.id_raza, m.nombre, m.sexo, m.peso, m.observaciones,
                    DATE_FORMAT(m.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
                    r.nombre AS raza
             FROM mascota m
             INNER JOIN razas r ON r.id_raza = m.id_raza
             WHERE m.id_mascota = ? AND m.id_cliente = ?`,
            [idMascota, idCliente]
        )
        if (mascotas.length === 0) return null

        const [filas] = await db.execute(
            `SELECT h.id_historial, DATE_FORMAT(h.fecha, '%Y-%m-%d') AS fecha,
                    h.motivo, h.diagnostico, h.observacion,
                    CONCAT(e.nombre, ' ', e.apellido) AS veterinario,
                    tr.id_tratamiento, tr.medicamento, tr.dosis,
                    tr.frecuencia, tr.duracion
             FROM historial_medico h
             LEFT JOIN veterinarios v ON v.id_veterinario = h.id_veterinario
             LEFT JOIN empleados e ON e.id_empleado = v.id_empleado
             LEFT JOIN tratamientos tr ON tr.id_historial = h.id_historial
             WHERE h.id_mascota = ?
             ORDER BY h.fecha DESC, h.id_historial DESC, tr.id_tratamiento`,
            [idMascota]
        )

        const consultas = new Map()
        filas.forEach(fila => {
            if (!consultas.has(fila.id_historial)) {
                consultas.set(fila.id_historial, {
                    id_historial: fila.id_historial,
                    fecha: fila.fecha,
                    motivo: fila.motivo,
                    diagnostico: fila.diagnostico,
                    observacion: fila.observacion,
                    veterinario: fila.veterinario,
                    tratamientos: []
                })
            }
            if (fila.id_tratamiento !== null) {
                consultas.get(fila.id_historial).tratamientos.push({
                    medicamento: fila.medicamento,
                    dosis: fila.dosis,
                    frecuencia: fila.frecuencia,
                    duracion: fila.duracion
                })
            }
        })
        const [vacunas] = await db.execute(
            `SELECT nombre,
                    DATE_FORMAT(fecha_aplicacion, '%Y-%m-%d') AS fecha_aplicacion,
                    DATE_FORMAT(fecha_proxima, '%Y-%m-%d') AS fecha_proxima
             FROM vacunas
             WHERE id_mascota = ?
             ORDER BY fecha_aplicacion DESC, id_vacuna DESC`,
            [idMascota]
        )

        return { mascota: mascotas[0], historial: [...consultas.values()], vacunas }
    }

    static async cancelarTurno(idTurno, idCliente) {
        const [resultado] = await db.execute(
            `UPDATE turnos SET estado = 'CANCELADO'
             WHERE id_turno = ? AND id_cliente = ?
               AND estado IN ('PENDIENTE', 'CONFIRMADO')`,
            [idTurno, idCliente]
        )
        return resultado.affectedRows > 0
    }

    static async traerTurno(idTurno, idCliente) {
        const [turnos] = await db.execute(
            'SELECT id_turno, estado FROM turnos WHERE id_turno = ? AND id_cliente = ?',
            [idTurno, idCliente]
        )
        return turnos[0]
    }

    static async traerDetallePedido(idPedido, idCliente) {
        const [pedidos] = await db.execute(
            `SELECT p.id_pedido, DATE_FORMAT(p.fecha, '%Y-%m-%d %H:%i:%s') AS fecha,
                    p.estado, p.subtotal, p.costo_envio, p.total
             FROM pedidos p
             WHERE p.id_pedido = ? AND p.id_cliente = ?`,
            [idPedido, idCliente]
        )
        if (pedidos.length === 0) return null

        const [[pagos], [envios], [lineas]] = await Promise.all([
            db.execute(
                'SELECT metodo_pago, estado_pago FROM pagos WHERE id_pedido = ? ORDER BY id_pago',
                [idPedido]
            ),
            db.execute(
                `SELECT tipo_entrega, estado,
                        DATE_FORMAT(fecha_estimada, '%Y-%m-%d') AS fecha_estimada,
                        DATE_FORMAT(fecha_entrega, '%Y-%m-%d') AS fecha_entrega
                 FROM envios WHERE id_pedido = ? ORDER BY id_envio`,
                [idPedido]
            ),
            db.execute(
                `SELECT CASE WHEN va.nombre IS NULL THEN p.nombre
                             ELSE CONCAT(p.nombre, ' — ', va.nombre) END AS producto,
                        d.cantidad, d.precio_unitario, d.subtotal
                 FROM detalle_pedidos d
                 JOIN variantes v ON v.id_variante = d.id_variante
                 JOIN productos p ON p.id_producto = v.id_producto
                 LEFT JOIN valores_atributo va ON va.id_valor = v.id_valor_atributo
                 WHERE d.id_pedido = ? ORDER BY d.id_detalle_pedido`,
                [idPedido]
            )
        ])
        return { pedido: pedidos[0], pagos, envios, lineas }
    }

}

module.exports = { Usuario }