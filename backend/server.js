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

app.get("/api/productos", (req, res) => {

    const sql = "SELECT * FROM producto";

    conexion.query(sql, (error, resultados) => {

        if (error) {
            return res.status(500).json({
                error: "Error al obtener productos"
            });
        }

        res.json(resultados);
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Servidor funcionando en puerto http://localhost:${process.env.PORT}`);
});