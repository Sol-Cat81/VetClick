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
    return await Usuario.traerCliente(idUsuario)
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

async function guardarDireccionCliente(id_cliente, tipo_direccion, calle, numero, ciudad, provincia, codigo_postal, departamento, piso, referencia) {
    return await Usuario.guardarDireccion(id_cliente, tipo_direccion, calle, numero, ciudad, provincia, codigo_postal, departamento, piso, referencia)
}

async function actualizarDireccionCliente(id_direccion, tipo_direccion, calle, numero, ciudad, provincia, codigo_postal, departamento, piso, referencia) {
    return await Usuario.actualizarDireccion(id_direccion, tipo_direccion, calle, numero, ciudad, provincia, codigo_postal, departamento, piso, referencia)
}

async function solicitarMascotas(idCliente) {
    return await Usuario.traerMascotas(idCliente)
}

async function solicitarTurnos(idCliente) {
    return await Usuario.traerTurnosGeneral(idCliente)
}

async function solicitarPedidos(idCliente) {
    return await Usuario.traerCompras(idCliente)
}

async function solicitarHistorialMascota(idMascota){
    return await Usuario.traerHistorial(idMascota)
}

module.exports = {
    traerInfoUsuario,
    traerInfoCliente,
    guardarImagenUsuario,
    guardarCrearCliente,

    solicitarDirecciones,
    guardarDireccionCliente,
    actualizarDireccionCliente,
    
    solicitarMascotas,
    solicitarTurnos,
    solicitarPedidos,
    solicitarHistorialMascota,
}