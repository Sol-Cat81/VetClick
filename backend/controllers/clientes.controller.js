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
  const idEspecie = Number(req.body?.id_especie);
  const idRaza = Number(req.body?.id_raza);
  if (![idCliente, idEspecie, idRaza].every(id => Number.isInteger(id) && id > 0)) {
    return res.status(400).json({
      mensaje: 'Debe seleccionar un propietario, una especie y una raza válidos'
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
      id_especie: idEspecie,
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
module.exports = {
  clientes: responder(service.listarClientes),
  mascotas: responder(service.listarMascotas),
  direcciones: responder(service.listarDirecciones),

  crearCliente,
  crearMascotas
};
