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

  solicitarMascotas,
  solicitarTurnos,
  solicitarPedidos,
  solicitarHistorialMascota
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
      [usuario, gmail, hashPassword, 3, "null"],
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
  const usuario = await traerInfoUsuario(idUsuario)
  const direcciones = await solicitarDirecciones(idUsuario)
  const mascotas = await solicitarMascotas(idUsuario)
  const turnos = await solicitarTurnos(idUsuario)
  const pedidos = await solicitarPedidos(idUsuario)
  
  res.status(200).json({ usuario, direcciones, mascotas, turnos, pedidos })
}

const guardarDireccion = async (req, res) => {
  const idUsuario = req.usuario.id;
  const direcciones = await trerDirecciones(idUsuario);
  if (!direcciones) {
    res.status(404).json({ mensaje: "No hay direcciones registradas" })
  } else {
    res.status(201).json(direcciones)
  }
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
  guardarDireccion,
  cambiarFotoPerfil
};
