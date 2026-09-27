const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Buscamos el access token en la cookie
  const token = req.cookies.token_veterinaria;

  // Si no existe, no está autenticado
  if (!token) {
    return res.status(401).json({
      mensaje: "No estás autenticado",
    });
  }

  try {
    // Verificamos que el token sea válido
    const decoded = jwt.verify(
      token,
      process.env.SECRETO_JWT_ACCESS
    );

    // Guardamos los datos del usuario dentro de req
    req.usuario = decoded;

    // Permitimos continuar hacia el controlador
    next();

  } catch (error) {
    return res.status(401).json({
      mensaje: "Token inválido o expirado",
    });
  }
};

module.exports = { authMiddleware };