const service = require('../service/clientes.service');
const responder = fn => async (req, res) => {
  try { res.json(await fn()); }
  catch (error) {
    console.error('Error al listar datos de clientes:', error);
    res.status(500).json({ mensaje: 'No se pudieron obtener los registros' });
  }
};

const crearCliente = async (req, res) => {
  try {
    const resultado = await service.crearCliente(req.body);

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
  try{
    const resultado = await service.crearMascotas(req.body);

    res.status(201).json({
      mensaje: 'mascota creadada correctamente',
      id: resultado.insertId
    });
  }catch(error){
    console.error(error);

    res.status(500).json({
      mensaje: 'error al guardad mascota'
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
