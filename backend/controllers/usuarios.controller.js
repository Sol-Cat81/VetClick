const db = require("./../config/database");
const bcrypt = require("bcryptjs");

const verificarUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [usuarioSession] = await db.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (usuarioSession.length === 1) {
      const usuarioEncontrado = usuarioSession[0];

      const contraseñaValida = await bcrypt.compare(
        password,
        usuarioEncontrado.password_hash || usuarioEncontrado.password 
      );

      if (!contraseñaValida) {
        return res
          .status(401)
          .json({ mensaje: "El email o la contraseña es incorrecto." });
      }

      res.status(201).json({
        mensaje: "usuario validado",
        usuario: {
          id: usuarioEncontrado.id_usuario,
          name: usuarioEncontrado.username,
          email: usuarioEncontrado.email,
          rol: usuarioEncontrado.id_rol_usuario,
        },
      });
    } else if (usuarioSession.length > 1) {
      console.error("Error: Múltiples usuarios con el mismo email");
      res.status(500).json({ mensaje: "Hubo un error en el servidor" });
    } else {
      return res
        .status(401)
        .json({ mensaje: "El email o la contraseña es incorrecto." });
    }
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ mensaje: "Hubo un error en el servidor" });
  }
};

const registrarUsuario = async (req, res) => {
  const { usuario, gmail, password } = req.body;

  try {
    const [usuariosEncontrados] = await db.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [gmail]
    );

    if (usuariosEncontrados.length > 0) {
      return res.status(400).json({ mensaje: "Este gmail ya esta registrado" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const [nuevoUsuario] = await db.query(
      "INSERT INTO usuarios(username, email, password_hash, id_rol_usuario) VALUES (?, ?, ?, ?)",
      [usuario, gmail, hashPassword, 2]
    );

    res
      .status(201)
      .json({ mensaje: "Registro exitoso, puede iniciar sesion" });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ mensaje: "Hubo un error en el servidor" });
  }
};

module.exports = { verificarUsuario, registrarUsuario };