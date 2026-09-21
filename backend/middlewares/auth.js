const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.cookies.token_veterinaria;

    if (!token) {
        return res.status(401).json({ mensaje: "Acceso denegado. Inicia sesión." });
    }
    try {
        const verificado = jwt.verify(token, process.env.SECRETO_JWT);
        req.usuario = verificado;
        next();
    } catch (error) {
        res.status(403).json({ mensaje: "La sesión ha expirado." });
    }
};

module.exports = verificarToken;