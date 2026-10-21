const service = require('../service/clientes.service');
const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) {
    console.error('Error al listar datos de clientes:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener los registros' });
  }
};

const crearCliente = async (req, res) => {
  const idUsuario = Number(req.body?.id_usuario);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    return res.status(400).json({
      mensaje: 'Debe seleccionar un usuario válido'
    });
  }

  try {
    const resultado = await service.crearCliente({
      ...req.body,
      id_usuario: idUsuario
    });

    res.status(201).json({
      mensaje: 'cliente creado correctamente',
      id: resultado.insertId
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: 'Error al guardar cliente'
    });
  }
};

const crearMascotas = async(req, res)=>{
  const idCliente = Number(req.body?.id_cliente);
  const idRaza = Number(req.body?.id_raza);
  if (![idCliente, idRaza].every(id => Number.isInteger(id) && id > 0)) {
    return res.status(400).json({
      mensaje: 'Debe seleccionar un propietario y una raza válidos'
    });
  }
  const nombre = String(req.body?.nombre ?? '').trim();
  const sexo = String(req.body?.sexo ?? '').toUpperCase();
  const peso = Number(req.body?.peso ?? 0);
  if (!nombre || !['MACHO', 'HEMBRA'].includes(sexo) || !Number.isFinite(peso) || peso < 0) {
    return res.status(400).json({
      mensaje: 'Nombre, sexo y peso de la mascota deben ser válidos'
    });
  }

  try{
    const resultado = await service.crearMascotas({
      ...req.body,
      id_cliente: idCliente,
      id_raza: idRaza,
      nombre,
      sexo,
      peso
    });

    res.status(201).json({
      mensaje: 'mascota creadada correctamente',
      id: resultado.insertId
    });
  }catch(error){
    console.error(error);

    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo guardar la mascota'
    });
  }
};
const obtenerCliente = async (req, res) => {
  const id = Number(req.params.id_cliente);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de cliente inválido' });
  }

  try {
    res.json(await service.obtenerClientesPorId(id));
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo obtener el cliente'
    });
  }
};

const actualizarCliente = async (req, res) => {
  const id = Number(req.params.id_cliente);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de cliente inválido' });
  }

  try {
    await service.actualizarCliente(id, req.body || {});
    res.json({ mensaje: 'cliente actualizado correctamente', id_cliente: id });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo actualizar el cliente'
    });
  }
};

const solicitarAdopcion = async (req, res) => {
  // El usuario sale del token, nunca del body: el cliente no puede pedir una
  // adopcion en nombre de otro.
  const idUsuario = req.usuario.id;

  try {
    const resultado = await service.solicitarAdopcion(
      idUsuario,
      req.body?.id_mascota_adopcion,
      req.body?.observacion
    );

    res.status(201).json({
      mensaje: 'Tu solicitud de adopcion fue enviada. Te contactaremos pronto.',
      ...resultado
    });
  } catch (error) {
    console.error('Error al solicitar adopcion:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo enviar la solicitud de adopcion'
    });
  }
};

// Las mascotas del cliente logueado. El id del cliente sale del token: no se
// acepta uno por parametro, asi que nadie puede ver las mascotas de otro.
const misMascotas = async (req, res) => {
  try {
    const mascotas = await service.listarMisMascotas(req.usuario.id);
    res.json({ mascotas });
  } catch (error) {
    console.error('Error al obtener las mascotas del cliente:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudieron obtener tus mascotas'
    });
  }
};

// Alta de una mascota propia, desde la pagina de turnos. El cliente sale del
// token: nadie puede registrar una mascota a nombre de otro.
const crearMiMascota = async (req, res) => {
  try {
    const resultado = await service.crearMiMascota(req.usuario.id, req.body || {});
    res.status(201).json({
      mensaje: 'Mascota registrada correctamente',
      ...resultado
    });
  } catch (error) {
    console.error('Error al registrar la mascota:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo registrar la mascota'
    });
  }
};

const obtenerMascota = async (req, res) => {
  const id = Number(req.params.id_mascota);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de mascota inválido' });
  }

  try {
    res.json(await service.obtenerMascotaPorId(id));
  } catch (error) {
    console.error('Error al obtener mascota:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo obtener la mascota'
    });
  }
};

const actualizarMascota = async (req, res) => {
  const id = Number(req.params.id_mascota);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de mascota inválido' });
  }

  try {
    await service.actualizarMascota(id, req.body || {});
    res.json({ mensaje: 'mascota actualizada correctamente', id_mascota: id });
  } catch (error) {
    console.error('Error al actualizar mascota:', error);
    res.status(error.status || 500).json({
      mensaje: error.status ? error.message : 'No se pudo actualizar la mascota'
    });
  }
};

module.exports = {
  clientes: responder(service.listarClientes),
  mascotas: responder(service.listarMascotas),
  direcciones: responder(service.listarDirecciones),
  especies: responder(service.listarEspecies),
  razas: responder(service.listarRazas),
  mascotasAdopcion: responder(service.listarMascotasAdopcion),
  adopciones: responder(service.listarAdopciones),

  crearCliente,
  crearMascotas,
  misMascotas,
  crearMiMascota,
  solicitarAdopcion,

  obtenerCliente,
  actualizarCliente,

  obtenerMascota,
  actualizarMascota
};
