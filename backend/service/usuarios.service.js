const { Usuario } = require('./../models/usuarios.model')

async function traerInfoUsuario(idUsuario) {
    const usuario = await Usuario.traerUsuario(idUsuario);
    const cliente = await Usuario.traerCliente(idUsuario);
    if (usuario.length === 0) {
        throw new Error('Usuario no encontrado')
    }
    return { usuario: usuario[0], cliente: cliente[0] ?? null }
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

async function trerDirecciones(idUsuario) {
    return await Usuario.traerDireccion(idUsuario)
}

module.exports = {
    traerInfoUsuario,
    guardarCrearCliente,
    trerDirecciones,
    guardarImagenUsuario
}