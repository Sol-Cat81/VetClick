// El controlador recibe HTTP y aplica las reglas de login/registro.
const db = require("./../config/database");
// bcrypt compara y genera hashes sin guardar contraseñas en texto plano.
const bcrypt = require("bcryptjs");

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
          .json({ mensaje: "El email o la contraseña es incorrecto." });
      }

      const token = jwt.sign(
        { id: usuarioEncontrado.id, rol: usuarioEncontrado.rol },
        process.env.SECRETO_JWT,
        { expiresIn: "2h" },
      );
      res.cookie("token_veterinaria", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 2 * 60 * 60 * 1000,
      });

      res.status(201).json({
        mensaje: "usuario validado",
        usuario: {
          id: usuarioEncontrado.id_usuario,
          name: usuarioEncontrado.username,
          rol: usuarioEncontrado.id_rol_usuario,
        },
      });
    } else if (usuarioSession.length > 1) {
      // La columna email debería ser única; más de un resultado indica un problema de datos.
      console.error("Error: Múltiples usuarios con el mismo email");
      res.status(500).json({ mensaje: "Hubo un error en el servidor" });
    } else {
      return res
        .status(401)
        .json({ mensaje: "El email o la contraseña es incorrecto." });
    }
  } catch (error) {
    // Registramos el detalle en backend y damos un mensaje genérico al cliente.
    console.error("Error en el login:", error);
    res.status(500).json({ mensaje: "Hubo un error en el servidor" });
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
      return res.status(400).json({ mensaje: "Este gmail ya esta registrado" });
    }

    if (nombreUsuarioEncontrados.length > 0) {
      return res
        .status(400)
        .json({ mensaje: "Este nombre de usuario ya esta en uso" });
    }

    // Generamos un hash con coste 10; el texto original nunca se guarda.
    const hashPassword = await bcrypt.hash(password, 10);

    // Insertamos usando parámetros para evitar inyección SQL.
    const [nuevoUsuario] = await db.query(
      "INSERT INTO usuarios(username, email, password_hash, id_rol_usuario) VALUES (?, ?, ?, ?)",
      [usuario, gmail, hashPassword, 2],
    );

    res.status(201).json({ mensaje: "Registro exitoso, puede iniciar sesion" });
  } catch (error) {
    // Informamos el error en logs y no exponemos datos internos.
    console.error("Error en el registro:", error);
    res.status(500).json({ mensaje: "Hubo un error en el servidor" });
  }
};

module.exports = { verificarUsuario, registrarUsuario };
