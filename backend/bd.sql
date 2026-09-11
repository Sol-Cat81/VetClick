CREATE DATABASE veterinaria;
USE veterinaria;

/* ====================================================
   1. TABLAS INDEPENDIENTES (Sin dependencias)
   ==================================================== */

CREATE TABLE sucursales (
    id_sucursal INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    direccion VARCHAR(80),
    localidad VARCHAR(80),
    telefono VARCHAR(80),
    horario VARCHAR(80),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE permisos (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),    
    descripcion VARCHAR(100)
);

CREATE TABLE rol_empleados (
    id_rol_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE rol_usuario (
    id_rol_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(25)
);

CREATE TABLE especies (
    id_especie INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(85)
);

CREATE TABLE categorias_servicios (
    id_categoria_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50)
);

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50)
);

CREATE TABLE marcas (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50)
);

/* ====================================================
   2. TABLAS DE PRIMER NIVEL DE DEPENDENCIA
   ==================================================== */

CREATE TABLE rol_permiso (
    id_rol_usuario INT NOT NULL,
    id_permiso INT NOT NULL,
    PRIMARY KEY (id_rol_usuario, id_permiso),
    
    FOREIGN KEY (id_rol_usuario) REFERENCES rol_usuario(id_rol_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE
);

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30),
    password_hash VARCHAR(255),
    email VARCHAR(100),
    id_rol_usuario INT,
    activo BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (id_rol_usuario) REFERENCES rol_usuario(id_rol_usuario)
);

CREATE TABLE razas (
    id_raza INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(85),
    id_especie INT,

    FOREIGN KEY (id_especie) REFERENCES especies(id_especie)
);

CREATE TABLE servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_categoria_servicio INT,
    precio DECIMAL(10,2),
    activo BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (id_categoria_servicio) REFERENCES categorias_servicios(id_categoria_servicio)
);

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    id_marca INT NOT NULL,
    preferencia ENUM('CACHORRO', 'ADULTO'),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    descuento INT,

    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    FOREIGN KEY (id_marca) REFERENCES marcas(id_marca)
);

CREATE TABLE mascotas_adopcion (
    id_mascota_adopcion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(85),
    id_especie INT,
    edad VARCHAR(20),
    sexo ENUM('MACHO', 'HEMBRA') NOT NULL,
    descripcion VARCHAR(120),
    estado ENUM('ADOPTADO', 'EN_ADOPCION'),

    FOREIGN KEY (id_especie) REFERENCES especies(id_especie)
);

/* ====================================================
   3. TABLAS DE SEGUNDO NIVEL DE DEPENDENCIA
   ==================================================== */

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    nombre VARCHAR(80),
    apellido VARCHAR(80),
    telefono VARCHAR(12),
    estado BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE empleados (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_rol_empleado INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    telefono VARCHAR(30),
    direccion VARCHAR(150),
    id_sucursal INT,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
    FOREIGN KEY (id_rol_empleado) REFERENCES rol_empleados(id_rol_empleado)
);

CREATE TABLE variante_producto (
    id_variante_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT,
    peso DECIMAL(10,2),
    precio DECIMAL(10,2),

    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

/* ====================================================
   4. TABLAS DE TERCER NIVEL DE DEPENDENCIA
   ==================================================== */

CREATE TABLE direcciones (
    id_direccion INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    tipo_direccion ENUM('DOMICILIO', 'COMERCIO') NOT NULL,
    calle VARCHAR(85),
    numero VARCHAR(85),
    piso VARCHAR(85),
    departamento VARCHAR(85),
    localidad VARCHAR(85),
    provincia VARCHAR(85),
    codigo_postal VARCHAR(10),
    referencia VARCHAR(100),

    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

CREATE TABLE veterinarios (
    id_veterinario INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT,
    especialidad VARCHAR(85),

    FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
);

CREATE TABLE mascota (
    id_mascota INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    id_especie INT NOT NULL,
    id_raza INT NOT NULL,
    sexo ENUM('MACHO', 'HEMBRA') NOT NULL,
    fecha_nacimiento DATE,
    peso DECIMAL(5,2),
    observaciones TEXT,

    FOREIGN KEY (id_raza) REFERENCES razas(id_raza),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_especie) REFERENCES especies(id_especie)
);

CREATE TABLE inventario (
    id_inventario INT AUTO_INCREMENT PRIMARY KEY,
    id_variante_producto INT,
    id_sucursal INT,
    stock_actual INT,
    stock_minimo INT,

    FOREIGN KEY (id_variante_producto) REFERENCES variante_producto(id_variante_producto),
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal)
);

CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    fecha DATETIME,
    estado ENUM('PENDIENTE', 'PREPARANDO', 'ENVIADO', 'ENTREGADO') DEFAULT 'PENDIENTE',
    subtotal DECIMAL(10,2),
    costo_envio DECIMAL(10,2),
    total DECIMAL(10,2),

    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

CREATE TABLE adopciones (
    id_adopcion INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_mascota_adopcion INT,
    fecha DATE,
    estado VARCHAR(85),
    observacion VARCHAR(120),

    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_mascota_adopcion) REFERENCES mascotas_adopcion(id_mascota_adopcion)
);

/* ====================================================
   5. TABLAS DE CUARTO Y QUINTO NIVEL (Operativas/Detalles)
   ==================================================== */

CREATE TABLE historial_medico (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT,
    id_veterinario INT,
    fecha DATE,
    motivo VARCHAR(85),
    diagnostico VARCHAR(120),
    observacion VARCHAR(85),

    FOREIGN KEY (id_mascota) REFERENCES mascota(id_mascota),
    FOREIGN KEY (id_veterinario) REFERENCES veterinarios(id_veterinario)
);

CREATE TABLE tratamientos (
    id_tratamiento INT AUTO_INCREMENT PRIMARY KEY,
    id_historial INT,
    medicamento VARCHAR(85),
    dosis VARCHAR(85),
    frecuencia VARCHAR(85),
    duracion VARCHAR(85),

    FOREIGN KEY (id_historial) REFERENCES historial_medico(id_historial)
);

CREATE TABLE vacunas (
    id_vacuna INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT,
    nombre VARCHAR(85),
    fecha_aplicacion DATE,
    fecha_proxima DATE,
    id_veterinario INT,

    FOREIGN KEY (id_mascota) REFERENCES mascota(id_mascota),
    FOREIGN KEY (id_veterinario) REFERENCES veterinarios(id_veterinario)
);

CREATE TABLE turnos (
    id_turno INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_mascota INT NOT NULL,
    id_servicio INT NOT NULL,
    id_sucursal INT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo TEXT,
    estado ENUM('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'FINALIZADO') DEFAULT 'PENDIENTE',
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_mascota) REFERENCES mascota(id_mascota),
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal)
);

CREATE TABLE detalle_pedidos (
    id_detalle_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    id_variante_producto INT,
    cantidad INT,
    precio_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2),

    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_variante_producto) REFERENCES variante_producto(id_variante_producto)
);

CREATE TABLE pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    metodo_pago ENUM('EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'),
    estado_pago ENUM('PENDIENTE', 'REALIZADO') DEFAULT 'PENDIENTE',

    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido)
);

CREATE TABLE envios (
    id_envio INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    tipo_entrega ENUM('DOMICILIO', 'SUCURSAL', 'PROGRAMADO') NOT NULL,
    id_direccion INT,
    codigo_postal VARCHAR(85),
    fecha_estimada DATE,
    fecha_entrega DATE,
    estado ENUM('EN_CAMINO', 'ENTREGADO'),

    FOREIGN KEY (id_direccion) REFERENCES direcciones(id_direccion),
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido)
);