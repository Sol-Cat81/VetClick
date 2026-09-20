// Express crea el servidor HTTP y permite definir endpoints.
const express = require("express");
// CORS permite que el frontend local consulte la API desde otro origen.
const cors = require("cors");
// Carga variables como PORT y las credenciales de la base desde .env.
const cookieParser = require('cookie-parser');
require("dotenv").config();

// Importamos el pool para iniciar la conexión y comprobar su disponibilidad.
const conexion = require("./config/database");

// Creamos la aplicación Express.
const app = express();

// Permitimos solicitudes del frontend y cuerpos JSON en POST.
app.use(cors({
  origin: 'http://127.0.0.1:5500', // El origen exacto de tu frontend
  credentials: true                // Permite el intercambio de cookies/sesiones
}));
app.use(express.json());
app.use(cookieParser());

// Endpoint de comprobación: sirve para saber si la API está encendida.
app.get("/", (req, res) => {
    res.json({
        mensaje: "API de Veterinaria funcionando"
    });
});

// Cada router agrupa las operaciones de una tabla o módulo.
const rutasUsuarios = require('./routes/usuarios.routes');
app.use('/api/usuarios', rutasUsuarios);

const rutasProductos = require('./routes/productos.routes')
app.use('/api/productos', rutasProductos)

const empleadosRoutes = require('./routes/empleados.routes');
app.use('/api/empleados' , empleadosRoutes);

const rolesEmpleadosRoutes = require('./routes/rolesEmpleados.routes');
app.use('/api/rol_empleados' , rolesEmpleadosRoutes);   

const clientesRoutes = require('./routes/clientes.routes');
app.use('/api/clientes', clientesRoutes);

const mascotasRoutes = require('./routes/mascotas.routes');
app.use('/api/mascotas' , mascotasRoutes);

// Usamos el puerto configurado o 3000 durante el desarrollo.
const puerto = process.env.PORT || 3000;

// Iniciamos el servidor y mostramos la URL para probarlo.
app.listen(puerto, () => {
    console.log(`Servidor funcionando en puerto http://localhost:${puerto}`);
});