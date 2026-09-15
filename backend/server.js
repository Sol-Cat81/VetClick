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

const empleadosRoutes = require('./routes/empleados.routes');
app.use('/api/empleados' , empleadosRoutes);

const rolesEmpleadosRoutes = require('./routes/rolesEmpleados.routes');
app.use('/api/rol_empleados' , rolesEmpleadosRoutes);   

const puerto = process.env.PORT || 3000;

app.listen(puerto, () => {
    console.log(`Servidor funcionando en puerto http://localhost:${puerto}`);
});