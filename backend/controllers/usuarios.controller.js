const jwt = require("jsonwebtoken");
// El controlador recibe HTTP y aplica las reglas de login/registro.
const db = require("./../config/database");
// bcrypt compara y genera hashes sin guardar contraseñas en texto plano.
const bcrypt = require("bcryptjs");

const cloudinary = require('cloudinary').v2;

const subirImagen = async (archivo, carpeta, nombrePublico) => {
  if (!archivo) return null;
  const resultado = await cloudinary.uploader.upload(
    `data:${archivo.mimetype};base64,${archivo.buffer.toString('base64')}`,
    {
      folder: carpeta,
      resource_type: 'image',
      public_id: nombrePublico || undefined,
      invalidate: Boolean(nombrePublico)
    }
  );
  return resultado.secure_url;
};

const carpetaUsuarios = () => process.env.CLOUDINARY_FOLDER_PERFILES_USUARIOS || 'VetClick/PerfilesUsuario';

const {
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
  traerDetallePedido
} = require("../service/usuarios.service");

// Comprueba email y contraseña y devuelve únicamente datos públicos del usuario.
const verificarUsuario = async (req, res) => {
  // Extraemos los campos enviados por el frontend.
  const { email, password } = req.body;

  try {
    // El signo ? evita concatenar datos del usuario dentro del SQL.
    const [usuarioSession] = await db.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email],
    );

    if (usuarioSession.length === 1) {
      // Tomamos el único registro encontrado.
      const usuarioEncontrado = usuarioSession[0];

      // Comparamos la contraseña recibida contra el hash almacenado.
      const contraseñaValida = await bcrypt.compare(
        password,
        usuarioEncontrado.password_hash || usuarioEncontrado.password,
      );

      if (!contraseñaValida) {
        // No revelamos si falló el email o la contraseña.
        return res
          .status(401)
          .json({ message: "El email o la contraseña es incorrecto." });
      }

      // ACCESS TOKEN Y REFRESH
      const token = jwt.sign(
        {
          id: usuarioEncontrado.id_usuario,
          usuario: usuarioEncontrado.username,
          rol: usuarioEncontrado.id_rol_usuario,
        },
        process.env.SECRETO_JWT_ACCESS,
        { expiresIn: "15m" },
      );
      const refresh = jwt.sign(
        {
          id: usuarioEncontrado.id_usuario,
        },
        process.env.SECRETO_JWT_REFRESH,
        {
          expiresIn: "7d",
        }
      );

      // GUARDAR TOKENS EN LAS COOKIES
      res.cookie("token_veterinaria", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Corrección aquí
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refresh_veterinaria", refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Corrección aquí
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "usuario validado",
        usuario: {
          id: usuarioEncontrado.id_usuario,
          name: usuarioEncontrado.username,
          rol: usuarioEncontrado.id_rol_usuario,
        },
      });
    } else if (usuarioSession.length > 1) {
      // La columna email debería ser única; más de un resultado indica un problema de datos.
      console.error("Error: Múltiples usuarios con el mismo email");
      res.status(500).json({ message: "Hubo un error en el servidor" });
    } else {
      return res
        .status(401)
        .json({ message: "El email o la contraseña es incorrecto." });
    }
  } catch (error) {
    // Registramos el detalle en backend y damos un message genérico al cliente.
    console.error("Error en el login:", error);
    res.status(500).json({ message: "Hubo un error en el servidor" });
  }
};

// Registra un usuario nuevo después de comprobar email y username repetidos.
const registrarUsuario = async (req, res) => {
  // Estos nombres corresponden al contrato actual del formulario de registro.
  const { usuario, gmail, password } = req.body;

  try {
    // Comprobamos duplicados antes de insertar.
    const [usuariosEncontrados] = await db.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [gmail],
    );
    const [nombreUsuarioEncontrados] = await db.query(
      "SELECT * FROM usuarios WHERE username = ?",
      [usuario],
    );

    if (usuariosEncontrados.length > 0) {
      return res.status(400).json({ message: "Este gmail ya esta registrado" });
    }

    if (nombreUsuarioEncontrados.length > 0) {
      return res
        .status(400)
        .json({ message: "Este nombre de usuario ya esta en uso" });
    }

    // Generamos un hash con coste 10; el texto original nunca se guarda.
    const hashPassword = await bcrypt.hash(password, 10);

    // Insertamos usando parámetros para evitar inyección SQL.
    const [nuevoUsuario] = await db.query(
      "INSERT INTO usuarios(username, email, password_hash, id_rol_usuario, img_usuario) VALUES (?, ?, ?, ?, ?);",
      [usuario, gmail, hashPassword, 4, "null"],
    );

    res.status(201).json({ message: "Registro exitoso, puede iniciar sesion" });
  } catch (error) {
    // Informamos el error en logs y no exponemos datos internos.
    console.error("Error en el registro:", error);
    res.status(500).json({ message: "Hubo un error en el servidor" });
  }
};

const detectarsession = async (req, res) => {
  // 1. Leer la cookie
  const token = req.cookies.token_veterinaria;

  if (!token) {
    return res.status(401).json({ message: "No hay token" });
  }

  try {
    // 2. Verificar y decodificar el token usando la clave secreta
    const decoded = jwt.verify(token, process.env.SECRETO_JWT_ACCESS);

    // 3. Acceder a la información guardada
    const id = decoded.id;
    const usuario = decoded.usuario
    const rol = decoded.rol;

    res.json({ message: "Acceso concedido", usuario: decoded });
  } catch (error) {
    // Si el token expiró o fue alterado, lanzará un error
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token_veterinaria');
  res.clearCookie('refresh_veterinaria');
  res.status(200).json({ message: "Sesión cerrada correctamente" });
};

const refreshToken = async (req, res) => {
  const refresh = req.cookies.refresh_veterinaria;

  if (!refresh) {
    return res.status(401).json({
      message: "No hay refresh token",
    });
  }

  try {
    const decoded = jwt.verify(
      refresh,
      process.env.SECRETO_JWT_REFRESH
    );

    const nuevoAccessToken = jwt.sign(
      {
        id: decoded.id,
      },
      process.env.SECRETO_JWT_ACCESS,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("token_veterinaria", nuevoAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Access token renovado",
    });

  } catch (error) {
    return res.status(401).json({
      message: "Refresh token inválido o expirado",
    });
  }
};

const guardarCliente = async (req, res) => {
  const idUsuario = req.usuario.id
  const { nombre, apellido, telefono, username } = req.body;

  const resultado = await guardarCrearCliente(idUsuario, nombre, apellido, telefono, username);

  if (resultado) {
    res.status(201).json({ message: "Cliente guardado correctamente" });
  } else {
    res.status(401).json({ message: "No se pudo guardar el cliente" })
  }
};

const deshboard = async (req, res) => {
  const idUsuario = req.usuario.id;
  const usuario = await traerInfoUsuario(idUsuario);
  const cliente = usuario.cliente;
  const [direcciones, mascotas, turnos, pedidos, razas] = cliente
    ? await Promise.all([
        solicitarDirecciones(cliente.id_cliente),
        solicitarMascotas(cliente.id_cliente),
        solicitarTurnos(cliente.id_cliente),
        solicitarPedidos(cliente.id_cliente),
        solicitarRazas()
      ])
    : [[], [], [], [], await solicitarRazas()];

  res.status(200).json({ usuario, direcciones, mascotas, turnos, pedidos, razas });
}

// Devuelve solo lo que necesita el formulario de envio del carrito.
const datosEnvio = async (req, res) => {
  try {
    const cliente = await traerInfoCliente(req.usuario.id);
    const direcciones = cliente ? await solicitarDirecciones(cliente.id_cliente) : [];
    return res.status(200).json({ cliente, direcciones });
  } catch (error) {
    console.error("Error al traer los datos de envio:", error);
    return res.status(500).json({ message: "No se pudieron cargar los datos de envio" });
  }
}

const validarDatosMascota = async (datos) => {
  const { nombre, raza, sexo, fecha_nacimiento, peso } = datos;
  const idRaza = Number(raza);
  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento || "") &&
    !Number.isNaN(Date.parse(`${fecha_nacimiento}T00:00:00`)) &&
    new Date(`${fecha_nacimiento}T00:00:00`) <= new Date();
  const razas = await solicitarRazas();
  const pesoValido = peso === "" || peso === null || peso === undefined ||
    (Number.isFinite(Number(peso)) && Number(peso) > 0 && Number(peso) <= 999.99);

  return Boolean(
    typeof nombre === "string" &&
    nombre.trim().length > 0 &&
    nombre.trim().length <= 50 &&
    Number.isInteger(idRaza) &&
    razas.some(item => item.id_raza === idRaza) &&
    ["MACHO", "HEMBRA"].includes(sexo) &&
    fechaValida &&
    pesoValido
  );
};

const guardarMascotaUsuario = async (req, res) => {
  const cliente = await traerInfoCliente(req.usuario.id);
  if (!cliente) {
    return res.status(404).json({ message: "Completa tus datos de cliente antes de registrar mascotas" });
  }
  if (!await validarDatosMascota(req.body)) {
    return res.status(400).json({ message: "Revisa los datos obligatorios de la mascota" });
  }

  try {
    await guardarMascota(
      cliente.id_cliente,
      req.body.nombre.trim(),
      Number(req.body.raza),
      req.body.sexo,
      req.body.fecha_nacimiento,
      req.body.peso || null,
      req.body.observaciones?.trim() || null
    );
    return res.status(201).json({ message: "Mascota registrada correctamente" });
  } catch (error) {
    console.error("Error al registrar la mascota:", error);
    return res.status(500).json({ message: "No se pudo registrar la mascota" });
  }
};

const actualizarMascotaUsuario = async (req, res) => {
  const cliente = await traerInfoCliente(req.usuario.id);
  if (!cliente) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }
  const idMascota = Number(req.params.id);
  if (!Number.isInteger(idMascota) || idMascota < 1) {
    return res.status(400).json({ message: "Identificador de mascota inválido" });
  }
  const mascota = await traerMascota(idMascota, cliente.id_cliente);
  if (!mascota) {
    return res.status(404).json({ message: "Mascota no encontrada" });
  }
  if (!await validarDatosMascota(req.body)) {
    return res.status(400).json({ message: "Revisa los datos obligatorios de la mascota" });
  }

  try {
    await actualizarMascota(
      idMascota,
      cliente.id_cliente,
      req.body.nombre.trim(),
      Number(req.body.raza),
      req.body.sexo,
      req.body.fecha_nacimiento,
      req.body.peso || null,
      req.body.observaciones?.trim() || null
    );
    return res.status(200).json({ message: "Mascota actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar la mascota:", error);
    return res.status(500).json({ message: "No se pudo actualizar la mascota" });
  }
};

const eliminarMascotaUsuario = async (req, res) => {
  const cliente = await traerInfoCliente(req.usuario.id);
  if (!cliente) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }
  const idMascota = Number(req.params.id);
  if (!Number.isInteger(idMascota) || idMascota < 1) {
    return res.status(400).json({ message: "Identificador de mascota inválido" });
  }
  try {
    const eliminado = await eliminarMascota(idMascota, cliente.id_cliente);
    if (!eliminado) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }
    return res.status(200).json({ message: "Mascota eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la mascota:", error);
    return res.status(500).json({ message: "No se pudo eliminar la mascota" });
  }
};

const fichaMascotaUsuario = async (req, res) => {
  const cliente = await traerInfoCliente(req.usuario.id);
  if (!cliente) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }
  const idMascota = Number(req.params.id);
  if (!Number.isInteger(idMascota) || idMascota < 1) {
    return res.status(400).json({ message: "Identificador de mascota inválido" });
  }
  const ficha = await traerFichaMascota(idMascota, cliente.id_cliente);
  if (!ficha) {
    return res.status(404).json({ message: "Mascota no encontrada" });
  }
  return res.status(200).json(ficha);
};

const cancelarTurnoUsuario = async (req, res) => {
  const cliente = await traerInfoCliente(req.usuario.id);
  if (!cliente) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }
  const idTurno = Number(req.params.id);
  if (!Number.isInteger(idTurno) || idTurno < 1) {
    return res.status(400).json({ message: "Identificador de turno inválido" });
  }
  const turno = await traerTurno(idTurno, cliente.id_cliente);
  if (!turno) {
    return res.status(404).json({ message: "Turno no encontrado" });
  }
  if (!["PENDIENTE", "CONFIRMADO"].includes(turno.estado)) {
    return res.status(409).json({ message: "Este turno no se puede cancelar" });
  }
  const cancelado = await cancelarTurno(idTurno, cliente.id_cliente);
  if (!cancelado) {
    return res.status(409).json({ message: "No se pudo cancelar el turno" });
  }
  return res.status(200).json({ message: "Turno cancelado correctamente" });
};

const detallePedidoUsuario = async (req, res) => {
  const cliente = await traerInfoCliente(req.usuario.id);
  if (!cliente) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }
  const idPedido = Number(req.params.id);
  if (!Number.isInteger(idPedido) || idPedido < 1) {
    return res.status(400).json({ message: "Identificador de compra inválido" });
  }
  const detalle = await traerDetallePedido(idPedido, cliente.id_cliente);
  if (!detalle) {
    return res.status(404).json({ message: "Compra no encontrada" });
  }
  return res.status(200).json(detalle);
};

const guardarDireccion = async (req, res) => {
  const idUsuario = req.usuario.id;
  const cliente = await traerInfoCliente(idUsuario);
  if (!cliente) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }
  const { tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia } = req.body;
  const resultado = await guardarDireccionCliente(cliente.id_cliente, tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia);
  if (resultado) {
    res.status(201).json({ message: "Dirección guardada correctamente" });
  } else {
    res.status(500).json({ message: "No se pudo guardar la dirección" });
  }
}

const traerDireccionEspecifica = async (req, res) => {
  const cliente = await traerInfoCliente(req.usuario.id);
  if (!cliente) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }
  const { id_direccion } = req.body;
  if (!Number.isInteger(Number(id_direccion)) || Number(id_direccion) < 1) {
    return res.status(400).json({ message: "Identificador de dirección inválido" });
  }
  const direccion = await traerDireccion(id_direccion, cliente.id_cliente);
  if (!direccion) {
    return res.status(404).json({ message: "Dirección no encontrada" });
  }
  res.status(200).json(direccion);
}

const actualizarDireccion = async (req, res) => {
  const cliente = await traerInfoCliente(req.usuario.id);
  if (!cliente) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  const idDireccion = Number(req.params.id);
  if (!Number.isInteger(idDireccion) || idDireccion < 1) {
    return res.status(400).json({ message: "Identificador de dirección inválido" });
  }

  const { tipo_direccion, calle, numero, provincia, localidad, codigo_postal, departamento, piso, referencia } = req.body;
  if (!tipo_direccion || !calle || !numero || !provincia || !localidad || !codigo_postal) {
    return res.status(400).json({ message: "Completa todos los campos obligatorios" });
  }

  const direccion = await traerDireccion(idDireccion, cliente.id_cliente);
  if (!direccion) {
    return res.status(404).json({ message: "Dirección no encontrada" });
  }

  const actualizado = await actualizarDireccionCliente(
    idDireccion,
    cliente.id_cliente,
    tipo_direccion,
    calle,
    numero,
    provincia,
    localidad,
    codigo_postal,
    departamento,
    piso,
    referencia
  );
  if (!actualizado) {
    return res.status(500).json({ message: "No se pudo actualizar la dirección" });
  }
  res.status(200).json({ message: "Dirección actualizada correctamente" });
}

const eliminarDireccionUsuario = async (req, res) => {
  const cliente = await traerInfoCliente(req.usuario.id);
  if (!cliente) {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  const idDireccion = Number(req.params.id);
  if (!Number.isInteger(idDireccion) || idDireccion < 1) {
    return res.status(400).json({ message: "Identificador de dirección inválido" });
  }

  const direccion = await traerDireccion(idDireccion, cliente.id_cliente);
  if (!direccion) {
    return res.status(404).json({ message: "Dirección no encontrada" });
  }

  const eliminado = await eliminarDireccion(idDireccion, cliente.id_cliente);
  if (!eliminado) {
    return res.status(500).json({ message: "No se pudo eliminar la dirección" });
  }
  res.status(200).json({ message: "Dirección eliminada correctamente" });
}



const cambiarFotoPerfil = async (req, res) => {
  const idUsuario = req.usuario.id;
  const archivo = req.file;

  if (!archivo) {
    return res.status(400).json({ message: 'no recibio ninguna imagen' });
  }

  const nombreArchivo = `${carpetaUsuarios()}/usuario_${idUsuario}`;

  try {
    const imagen = await subirImagen(archivo, carpetaUsuarios(), nombreArchivo);
    await guardarImagenUsuario(idUsuario, imagen);
    res.json({ message: 'foto actualizada correctamente', imagen });
  } catch (error) {
    console.error('error al cambiar la foto de perfil ', error);
    res.status(400).json({ mensaje: error.message || 'no se pudo guardar la foto' })
  }
}

module.exports = {
  verificarUsuario,
  registrarUsuario,
  detectarsession,
  logout,
  refreshToken,
  guardarCliente,
  deshboard,
  datosEnvio,
  guardarDireccion,
  traerDireccionEspecifica,
  actualizarDireccion,
  eliminarDireccionUsuario,
  guardarMascotaUsuario,
  actualizarMascotaUsuario,
  eliminarMascotaUsuario,
  fichaMascotaUsuario,
  cancelarTurnoUsuario,
  detallePedidoUsuario,
  cambiarFotoPerfil
};
