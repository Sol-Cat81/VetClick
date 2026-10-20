const ClientesModel = require('../models/clientes.model');

const errorValidacion = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

module.exports = {
  listarClientes: () => ClientesModel.obtenerClientes(),
  listarMascotas: () => ClientesModel.obtenerMascotas(),
  listarDirecciones: () => ClientesModel.obtenerDirecciones(),
  listarEspecies: () => ClientesModel.obtenerEspecies(),
  listarRazas: () => ClientesModel.obtenerRazas(),
  listarMascotasAdopcion: () => ClientesModel.obtenerMascotasAdopcion(),
  listarAdopciones: () => ClientesModel.obtenerAdopciones(),

  crearCliente: (data) => ClientesModel.crearCliente(data),
  crearMascotas: (data) => ClientesModel.crearMascotas(data),

  // Solicitud de adopcion que hace un cliente desde la pagina publica.
  // idUsuario sale del token (nunca del body): el cliente no puede pedir una
  // adopcion en nombre de otro.
  solicitarAdopcion: async (idUsuario, idMascotaAdopcion, motivo) => {
    const idMascota = Number(idMascotaAdopcion);
    if (!Number.isInteger(idMascota) || idMascota <= 0) {
      throw errorValidacion('La mascota no es valida');
    }

    // observacion es VARCHAR(120): se recorta el limite de la columna para no
    // dejar que MySQL rechace el INSERT con un error de longitud.
    const observacion = String(motivo ?? '').trim();
    if (!observacion) {
      throw errorValidacion('Contanos por que queres adoptar a esta mascota');
    }
    if (observacion.length > 120) {
      throw errorValidacion('El motivo no puede superar los 120 caracteres');
    }

    // Sin fila en clientes no hay id_cliente, y adopciones.id_cliente es
    // obligatorio: por eso se avisa antes de tocar la base.
    const cliente = await ClientesModel.obtenerClientePorUsuario(idUsuario);
    if (!cliente) {
      throw errorValidacion('Completa tu perfil de cliente para poder adoptar');
    }

    const mascota = await ClientesModel.obtenerMascotaAdopcionPorId(idMascota);
    if (!mascota) {
      throw errorValidacion('La mascota no existe', 404);
    }

    // La ficha tiene 3 estados: disponible, en tramite y adoptada. Solo se
    // puede pedir la de las disponibles, y el mensaje dice en que estado esta
    // para que el cliente entienda por que no puede seguir.
    const estadoMascota = String(mascota.estado).toUpperCase();
    if (estadoMascota === 'ADOPTADO') {
      throw errorValidacion('Esta mascota ya fue adoptada');
    }
    if (estadoMascota === 'EN_TRAMITE') {
      throw errorValidacion('Esta mascota tiene una adopcion en curso');
    }
    if (estadoMascota !== 'EN_ADOPCION') {
      throw errorValidacion('Esta mascota no esta disponible para adopcion');
    }

    if (await ClientesModel.existeAdopcionEnCurso(cliente.id_cliente, idMascota)) {
      throw errorValidacion('Ya enviaste tu solicitud para esta mascota');
    }

    const resultado = await ClientesModel.crearAdopcion({
      id_cliente: cliente.id_cliente,
      id_mascota_adopcion: idMascota,
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'EN_CURSO',
      observacion
    });

    return {
      id_adopcion: resultado.insertId,
      id_mascota_adopcion: idMascota,
      mascota: mascota.nombre,
      estado: 'EN_CURSO'
    };
  },

  obtenerClientesPorId: async (id)=>{
    const cliente = await ClientesModel.obtenerClientesPorId(id);
    if (!cliente) throw errorValidacion('El cliente no existe', 404);
    return cliente;
  },

  // El service es el único lugar donde se decide qué es válido.
  // Solo se procesan los campos que llegan: los ausentes no se pisan.
  actualizarCliente: async (id, datos) => {
    const limpio = {};

    if (datos.nombre !== undefined) {
      limpio.nombre = String(datos.nombre).trim();
      if (!limpio.nombre) throw errorValidacion('El nombre del cliente es obligatorio');
    }

    if (datos.apellido !== undefined) {
      limpio.apellido = String(datos.apellido).trim();
    }

    if (datos.telefono !== undefined) {
      const telefono = String(datos.telefono).trim();
      // La columna telefono es VARCHAR(12): si nos pasamos, MySQL corta o falla.
      if (telefono && !/^\d{1,12}$/.test(telefono)) {
        throw errorValidacion('El teléfono debe tener entre 1 y 12 dígitos');
      }
      limpio.telefono = telefono || null;
    }

    if (datos.estado !== undefined) {
      limpio.estado = (datos.estado === 1 || datos.estado === '1' || datos.estado === true) ? 1 : 0;
    }

    // id_usuario es opcional al editar: si no llega, no se toca la relación.
    if (datos.id_usuario !== undefined && datos.id_usuario !== '' && datos.id_usuario !== null) {
      const idUsuario = Number(datos.id_usuario);
      if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        throw errorValidacion('Debe seleccionar un usuario válido');
      }
      limpio.id_usuario = idUsuario;
    }

    if (!Object.keys(limpio).length) {
      throw errorValidacion('No se envió ningún campo para actualizar');
    }

    // Consultamos antes porque MySQL devuelve affectedRows = 0 cuando los valores
    // no cambian; sin esta comprobación un cliente intacto respondería "no existe".
    const existente = await ClientesModel.obtenerClientesPorId(id);
    if (!existente) throw errorValidacion('El cliente no existe', 404);

    const resultado = await ClientesModel.actualizarCliente(id, limpio);
    return { ...resultado, datos: limpio };
  },

  obtenerMascotaPorId: async (id) => {
    const mascota = await ClientesModel.obtenerMascotaPorId(id);
    if (!mascota) throw errorValidacion('La mascota no existe', 404);
    return mascota;
  },

  actualizarMascota: async (id, datos) => {
    const limpio = {};

    if (datos.id_cliente !== undefined && datos.id_cliente !== '') {
      const idCliente = Number(datos.id_cliente);
      if (!Number.isInteger(idCliente) || idCliente <= 0) {
        throw errorValidacion('Debe seleccionar un propietario válido');
      }
      limpio.id_cliente = idCliente;
    }

    if (datos.nombre !== undefined) {
      limpio.nombre = String(datos.nombre).trim();
      if (!limpio.nombre) throw errorValidacion('El nombre de la mascota es obligatorio');
    }

    // La mascota se identifica solo por su raza: la especie se deduce de ella.
    if (datos.id_raza !== undefined && datos.id_raza !== '') {
      const idRaza = Number(datos.id_raza);
      if (!Number.isInteger(idRaza) || idRaza <= 0) {
        throw errorValidacion('Debe seleccionar una raza válida');
      }
      limpio.id_raza = idRaza;
    }

    if (datos.sexo !== undefined && datos.sexo !== '') {
      const sexo = String(datos.sexo).toUpperCase();
      if (!['MACHO', 'HEMBRA'].includes(sexo)) {
        throw errorValidacion('El sexo debe ser MACHO o HEMBRA');
      }
      limpio.sexo = sexo;
    }

    if (datos.fecha_nacimiento !== undefined) {
      // Si el input date quedo vacio llega '' y no debe escribir NULL encima.
      limpio.fecha_nacimiento = datos.fecha_nacimiento || null;
    }

    if (datos.peso !== undefined) {
      const peso = Number(datos.peso);
      if (!Number.isFinite(peso) || peso < 0) {
        throw errorValidacion('El peso debe ser un número mayor o igual a cero');
      }
      limpio.peso = peso;
    }

    if (datos.observaciones !== undefined) {
      limpio.observaciones = String(datos.observaciones).trim();
    }

    if (!Object.keys(limpio).length) {
      throw errorValidacion('No se envió ningún campo para actualizar');
    }

    // Chequeo previo: MySQL devuelve affectedRows=0 cuando nada cambia.
    const existente = await ClientesModel.obtenerMascotaPorId(id);
    if (!existente) throw errorValidacion('La mascota no existe', 404);

    const resultado = await ClientesModel.actualizarMascota(id, limpio);
    return { ...resultado, datos: limpio };
  }
};
