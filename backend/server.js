const express = require("express");
const cors = require("cors");
require("dotenv").config();

const conexion = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensaje: "API de Veterinaria funcionando"
    });
});

const rutasUsuarios = require('./routes/usuarios.routes');
app.use('/api/usuarios', rutasUsuarios);

app.listen(process.env.PORT, () => {
    console.log(`Servidor funcionando en puerto http://localhost:${process.env.PORT}`);
});