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

    // Especie y raza llegan juntas desde el modal, asi que se validan en bloque.
    const tocaEspecie = datos.id_especie !== undefined && datos.id_especie !== '';
    const tocaRaza = datos.id_raza !== undefined && datos.id_raza !== '';

    if (tocaEspecie || tocaRaza) {
      const idEspecie = Number(datos.id_especie);
      const idRaza = Number(datos.id_raza);
      if (!Number.isInteger(idEspecie) || idEspecie <= 0 || !Number.isInteger(idRaza) || idRaza <= 0) {
        throw errorValidacion('Debe seleccionar una especie y una raza válidas');
      }
      limpio.id_especie = idEspecie;
      limpio.id_raza = idRaza;
      // Delegamos la coherencia al modelo, igual que en crearMascotas.
      await ClientesModel.validarRazaDeEspecie(idEspecie, idRaza);
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
