const { Usuario } = require('./../models/usuarios.model')

async function traerInfoUsuario(idUsuario) {
    const usuario = await Usuario.traerUsuario(idUsuario);
    const cliente = await Usuario.traerCliente(idUsuario);
    if (usuario.length === 0) {
        throw new Error('Usuario no encontrado')
    }
    return { usuario: usuario[0], cliente: cliente[0] ?? null }
}

async function traerInfoCliente(idUsuario) {
    const clientes = await Usuario.traerCliente(idUsuario)
    return clientes[0] ?? null
}

async function guardarCrearCliente(idUsuario, nombre, apellido, telefono, username) {
    if(!nombre || !apellido || !telefono){
        throw new Error('Todos los campos son obligatorios')
    }
    const actualizar = await Usuario.actulizarUsuario(idUsuario, username)
    const resultado = await Usuario.guardarCliente(idUsuario, nombre, apellido, telefono)
    if(!resultado || !actualizar){
        throw new Error('Error al guardar el cliente')
    }
    return resultado
}

async function guardarImagenUsuario(idUsuario,imagen){
    if(!imagen){
        throw new Error('la imagen es obligatoria')
    }
    const resultado = await Usuario.actualizarImagenUsuario(idUsuario, imagen)
    if(!resultado){
        throw new Error ('error al guardar la imagen del usuario')
    }
    return resultado
}

async function solicitarDirecciones(idUsuario) {
    return await Usuario.traerDireccion(idUsuario)
}

async function guardarDireccionCliente(id_cliente, tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia) {
    departamento = departamento || null
    piso = piso || null
    referencia = referencia || null
    return await Usuario.guardarDireccion(id_cliente, tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia)
}

async function actualizarDireccionCliente(id_direccion, id_cliente, tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia) {
    departamento = departamento || null
    piso = piso || null
    referencia = referencia || null
    return await Usuario.actualizarDireccion(id_direccion, id_cliente, tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia)
}

async function traerDireccion(idDireccion, idCliente) {
    return Usuario.traerDireccionEspecifica(idDireccion, idCliente)
}

async function eliminarDireccion(idDireccion, idCliente) {
    const resultado = await Usuario.eliminarDireccion(idDireccion, idCliente)
    if (!resultado) {
        throw new Error('No se pudo eliminar la dirección')
    }
    return resultado
}

async function solicitarMascotas(idCliente) {
    return await Usuario.traerMascotas(idCliente)
}

async function solicitarRazas() {
    return Usuario.traerRazas()
}

async function guardarMascota(idCliente, nombre, raza, sexo, fecha_nacimiento, peso, observaciones) {
    return Usuario.guardarMascota(idCliente, nombre, raza, sexo, fecha_nacimiento, peso, observaciones)
}

async function traerMascota(idMascota, idCliente) {
    return Usuario.traerMascota(idMascota, idCliente)
}

async function actualizarMascota(idMascota, idCliente, nombre, raza, sexo, fecha_nacimiento, peso, observaciones) {
    return Usuario.actualizarMascota(idMascota, idCliente, nombre, raza, sexo, fecha_nacimiento, peso, observaciones)
}

async function eliminarMascota(idMascota, idCliente) {
    return Usuario.eliminarMascota(idMascota, idCliente)
}

async function traerFichaMascota(idMascota, idCliente) {
    return Usuario.traerFichaMascota(idMascota, idCliente)
}

async function cancelarTurno(idTurno, idCliente) {
    return Usuario.cancelarTurno(idTurno, idCliente)
}

async function traerTurno(idTurno, idCliente) {
    return Usuario.traerTurno(idTurno, idCliente)
}

async function solicitarTurnos(idCliente) {
    return await Usuario.traerTurnosGeneral(idCliente)
}

async function solicitarPedidos(idCliente) {
    return await Usuario.traerCompras(idCliente)
}

async function solicitarHistorialMascota(idMascota, idCliente){
    return await Usuario.traerFichaMascota(idMascota, idCliente)
}

async function traerDetallePedido(idPedido, idCliente) {
    return Usuario.traerDetallePedido(idPedido, idCliente)
}

module.exports = {
    traerInfoUsuario,
    traerInfoCliente,
    guardarImagenUsuario,
    guardarCrearCliente,

    solicitarDirecciones,
    guardarDireccionCliente,
    actualizarDireccionCliente,
    traerDireccion,
    eliminarDireccion,

    solicitarMascotas,
    solicitarRazas,
    guardarMascota,
    traerMascota,
    actualizarMascota,
    eliminarMascota,
    traerFichaMascota,

    solicitarTurnos,
    cancelarTurno,
    traerTurno,
    solicitarPedidos,
    solicitarHistorialMascota,
    traerDetallePedido,
}