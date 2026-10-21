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
    img_sucursal TEXT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE atributos (
    id_atributo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL
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
    nombre VARCHAR(50) NOT NULL,
    categoria_padre INT,

    FOREIGN KEY (categoria_padre)
        REFERENCES categorias(id_categoria)
        ON DELETE CASCADE
);

CREATE TABLE marcas (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    imagen_marca TEXT,
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
    img_usuario TEXT,

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
    id_marca INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    descuento INT DEFAULT 0,
    imagen VARCHAR(200),

    FOREIGN KEY (id_marca)
        REFERENCES marcas(id_marca)
);

CREATE TABLE mascotas_adopcion (
    id_mascota_adopcion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(85),
    id_raza INT,
    edad VARCHAR(20),
    sexo ENUM('MACHO', 'HEMBRA') NOT NULL,
    descripcion VARCHAR(120),
    estado ENUM('EN_ADOPCION','EN_TRAMITE','ADOPTADO'),
    img_masc_adop TEXT,

    FOREIGN KEY (id_raza) REFERENCES razas(id_raza)
);

CREATE TABLE valores_atributo (
    id_valor INT AUTO_INCREMENT PRIMARY KEY,
    id_atributo INT NOT NULL,
    nombre VARCHAR(20) NOT NULL,

    FOREIGN KEY (id_atributo)
        REFERENCES atributos(id_atributo)
);


/* ====================================================
   3. TABLAS DE SEGUNDO NIVEL DE DEPENDENCIA
   ==================================================== */

CREATE TABLE variantes (
    id_variante INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_valor_atributo INT,
    precio DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto),
        
	FOREIGN KEY (id_valor_atributo)
        REFERENCES valores_atributo(id_valor)
);

CREATE TABLE productos_categorias (
    id_categoria INT,
    id_producto INT,

    PRIMARY KEY (id_categoria, id_producto),

    FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria),

    FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
);

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

/* ====================================================
   4. TABLAS DE TERCER NIVEL DE DEPENDENCIA
   ==================================================== */

CREATE TABLE carrito_items (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_variante INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_variante) REFERENCES variantes(id_variante) ON DELETE CASCADE,
    UNIQUE KEY usuario_producto_unico (id_usuario, id_variante) -- Evita filas duplicadas para el mismo ítem
);

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
    id_raza INT NOT NULL,
    sexo ENUM('MACHO', 'HEMBRA') NOT NULL,
    fecha_nacimiento DATE,
    peso DECIMAL(5,2),
    observaciones TEXT,

    FOREIGN KEY (id_raza) REFERENCES razas(id_raza),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
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

CREATE TABLE inventario (
    id_inventario INT AUTO_INCREMENT PRIMARY KEY,
    id_variante INT,
    id_sucursal INT,
    stock_actual INT,
    stock_minimo INT,

    FOREIGN KEY (id_variante) REFERENCES variantes(id_variante),
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal)
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
    id_veterinario INT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo TEXT,
    estado ENUM('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'FINALIZADO') DEFAULT 'PENDIENTE',
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_mascota) REFERENCES mascota(id_mascota),
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal),
    FOREIGN KEY (id_veterinario) REFERENCES veterinarios(id_veterinario)
);

CREATE TABLE detalle_pedidos (
    id_detalle_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    id_variante INT,
    cantidad INT,
    precio_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2),

    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_variante) REFERENCES variantes(id_variante)
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


/* ====================================================
   REINICIO DE DATOS (TRUNCATE)
   Borra las filas de todas las tablas y reinicia los
   contadores AUTO_INCREMENT. No toca estructura ni
   atributos. FOREIGN_KEY_CHECKS = 0 evita el error
   de tablas referenciadas por llaves foraneas.
   ==================================================== */

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE envios;
TRUNCATE TABLE pagos;
TRUNCATE TABLE detalle_pedidos;
TRUNCATE TABLE turnos;
TRUNCATE TABLE vacunas;
TRUNCATE TABLE tratamientos;
TRUNCATE TABLE historial_medico;
TRUNCATE TABLE inventario;
TRUNCATE TABLE adopciones;
TRUNCATE TABLE pedidos;
TRUNCATE TABLE mascota;
TRUNCATE TABLE veterinarios;
TRUNCATE TABLE direcciones;
TRUNCATE TABLE carrito_items;
TRUNCATE TABLE empleados;
TRUNCATE TABLE clientes;
TRUNCATE TABLE productos_categorias;
TRUNCATE TABLE variantes;
TRUNCATE TABLE valores_atributo;
TRUNCATE TABLE mascotas_adopcion;
TRUNCATE TABLE productos;
TRUNCATE TABLE servicios;
TRUNCATE TABLE razas;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE rol_permiso;
TRUNCATE TABLE marcas;
TRUNCATE TABLE categorias;
TRUNCATE TABLE categorias_servicios;
TRUNCATE TABLE especies;
TRUNCATE TABLE rol_usuario;
TRUNCATE TABLE rol_empleados;
TRUNCATE TABLE permisos;
TRUNCATE TABLE atributos;
TRUNCATE TABLE sucursales;

SET FOREIGN_KEY_CHECKS = 1;

/* ====================================================
   DATOS DE EJEMPLO (3 filas por tabla)
   Se ejecutan al final del script, en el mismo orden
   de dependencias que la creacion de tablas.

   Los IDs foreign KEY van escritos a mano (1, 2, 3)
   porque el bloque TRUNCATE de arriba reinicia los
   AUTO_INCREMENT en 1.

   Usuario de ejemplo: admin / 123456
   (hash bcrypt real, coste 10, para que el login
   funcione desde el primer arranque)
   ==================================================== */

START TRANSACTION;

/* ---------- NIVEL 1: TABLAS INDEPENDIENTES ---------- */

-- 3 sucursales
INSERT INTO sucursales (id_sucursal, nombre, direccion, localidad, telefono, horario, activo) VALUES
(1, 'VetClick Central', 'Av. Corrientes 1450', 'CABA',       '01143210001', 'Lun a Sab 09:00 a 20:00', TRUE),
(2, 'VetClick Norte',   'Av. Cabildo 2345',    'CABA',       '01143210002', 'Lun a Vie 09:00 a 19:00', TRUE),
(3, 'VetClick Sur',     'Ruta 8 km 12',        'Avellaneda', '01143210003', 'Mar a Dom 10:00 a 18:00', TRUE);

-- 3 atributos de producto (base de las variantes)
INSERT INTO atributos (id_atributo, nombre) VALUES
(1, 'Talla'),
(2, 'Color'),
(3, 'Peso');

-- 3 permisos
INSERT INTO permisos (id_permiso, nombre, descripcion) VALUES
(1, 'gestionar_usuarios',   'Crear, editar y dar de baja usuarios'),
(2, 'gestionar_productos',  'Administrar el catalogo de productos y stock'),
(3, 'gestionar_clinica',    'Administrar turnos, historial medico y adopciones');

-- 3 roles de empleado
INSERT INTO rol_empleados (id_rol_empleado, nombre) VALUES
(1, 'ADMINISTRADOR'),
(2, 'VETERINARIO'),
(3, 'RECEPCIONISTA');

-- 3 roles de usuario
INSERT INTO rol_usuario (id_rol_usuario, nombre) VALUES
(1, 'ADMIN'),
(2, 'VETERINARIO'),
(3, 'CLIENTE');

-- 3 especies
INSERT INTO especies (id_especie, nombre) VALUES
(1, 'Perro'),
(2, 'Gato'),
(3, 'Conejo');

-- 3 categorias de servicio
INSERT INTO categorias_servicios (id_categoria_servicio, nombre) VALUES
(1, 'Consultas'),
(2, 'Estetica'),
(3, 'Vacunacion');

-- 3 categorias (la tercera cuelga de la primera)
INSERT INTO categorias (id_categoria, nombre, categoria_padre) VALUES
(1, 'Alimentos', NULL),
(2, 'Juguetes', NULL),
(3, 'Accesorios', 1);

-- 3 marcas
INSERT INTO marcas (id_marca, nombre, imagen_marca) VALUES
(1, 'Royal Canin', 'img/marca-1.png'),
(2, 'Pedigree',    'img/marca-2.png'),
(3, 'Ferplast',    'img/marca-3.png');

/* ---------- NIVEL 2: PRIMER NIVEL DE DEPENDENCIA ---------- */

-- 3 asignaciones de permisos al rol ADMIN
INSERT INTO rol_permiso (id_rol_usuario, id_permiso) VALUES
(1, 1),
(1, 2),
(1, 3);

-- 3 usuarios (la contraseña de los tres es 123456)
INSERT INTO usuarios (id_usuario, username, password_hash, email, id_rol_usuario, activo , img_usuario) VALUES
(1, 'admin',    '$2b$10$LzcCUhPfyNvZPPmBD40pjuFKzrasAAG5bo1Ux2K2vg8RdHmMYLP2G', 'admin@vetclick.com', 1, TRUE , "https:fotochida"),
(2, 'vetlucia', '$2b$10$LzcCUhPfyNvZPPmBD40pjuFKzrasAAG5bo1Ux2K2vg8RdHmMYLP2G', 'lucia@vetclick.com', 2, TRUE , "https:fotochida"),
(3, 'carlos',   '$2b$10$LzcCUhPfyNvZPPmBD40pjuFKzrasAAG5bo1Ux2K2vg8RdHmMYLP2G', 'carlos@email.com',   3, TRUE , "https:fotochida");

-- 3 razas (una por especie)
INSERT INTO razas (id_raza, nombre, id_especie) VALUES
(1, 'Golden Retriever', 1),
(2, 'Siames',           2),
(3, 'Rex',              3);

-- 3 servicios
INSERT INTO servicios (id_servicio, nombre, descripcion, id_categoria_servicio, precio, activo) VALUES
(1, 'Consulta veterinaria', 'Evaluacion clinica general de la mascota', 1,  8500.00, TRUE),
(2, 'Corte de pelo',        'Corte, banado y secado en grooming',      2,  6000.00, TRUE),
(3, 'Vacunacion anual',     'Aplicacion de vacuna polivalente',         3,  5000.00, TRUE);

-- 3 productos
INSERT INTO productos (id_producto, id_marca, nombre, descripcion, activo, descuento, imagen) VALUES
(1, 1, 'Alimento balanceado para perros adultos', 'Racion de 15 kg de croquetas de pollo', TRUE, 10, 'img/producto-1.jpg'),
(2, 2, 'Alimento para gatitos',                 'Racion de 3 kg sabor pescado',         TRUE,  0, 'img/producto-2.jpg'),
(3, 3, 'Juguete interactivo para perros',       'Pelota de goma resistente',            TRUE, 15, 'img/producto-3.jpg');

SELECT * FROM mascotas_adopcion;
-- 3 mascotas en adopcion
INSERT INTO mascotas_adopcion (id_mascota_adopcion, nombre, id_raza, edad, sexo, descripcion, estado , img_masc_adop) VALUES
(1, 'Luna', 1, '2 anos',  'HEMBRA', 'Cachorra mestiza, muy sociable', 'ADOPTADO', 'https:fotochida'),
(2, 'Toto', 2, '6 meses', 'MACHO',  'Gatito tricolor en buen estado', 'EN_ADOPCION', 'https:fotochida'),
(3, 'Nube', 3, '1 ano',   'HEMBRA', 'Coneja blanca de pelo largo',    'EN_ADOPCION', 'https:fotochida');

-- 3 valores de atributo
INSERT INTO valores_atributo (id_valor, id_atributo, nombre) VALUES
(1, 1, 'Chico'),
(2, 2, 'Marron'),
(3, 3, '15 kg');

/* ---------- NIVEL 3: SEGUNDO NIVEL DE DEPENDENCIA ---------- */

-- 3 variantes (una por producto)
INSERT INTO variantes (id_variante, id_producto, id_valor_atributo, precio) VALUES
(1, 1, 1, 12500.00),
(2, 2, 2,  9800.00),
(3, 3, 3,  4500.00);

-- 3 filas puente producto <-> categoria
INSERT INTO productos_categorias (id_categoria, id_producto) VALUES
(1, 1),
(2, 3),
(3, 1);

-- 3 clientes (el primero con usuario, los otros dos como registrados)
INSERT INTO clientes (id_cliente, id_usuario, nombre, apellido, telefono, estado) VALUES
(1, 3,    'Carlos', 'Gomez', '01140001111', TRUE),
(2, NULL, 'Maria',  'Lopez', '01140002222', TRUE),
(3, NULL, 'Javier', 'Rios',  '01140003333', FALSE);

-- 3 empleados repartidos en distintas sucursales
INSERT INTO empleados (id_empleado, id_usuario, id_rol_empleado, nombre, apellido, telefono, direccion, id_sucursal) VALUES
(1, 1,    1, 'Lucia',  'Fernandez', '01143210001', 'Av. Corrientes 1450', 1),
(2, 2,    2, 'Diego',  'Sosa',      '01143210002', 'Av. Cabildo 2345',    2),
(3, NULL, 3, 'Carla',  'Mendez',    '01143210003', 'Ruta 8 km 12',        3);

-- 3 items de carrito
INSERT INTO carrito_items (id_carrito, id_usuario, id_variante, cantidad) VALUES
(1, 3, 1, 1),
(2, 3, 3, 2),
(3, 2, 2, 1);

/* ---------- NIVEL 4: TERCER NIVEL DE DEPENDENCIA ---------- */

-- 3 direcciones
INSERT INTO direcciones (id_direccion, id_cliente, tipo_direccion, calle, numero, piso, departamento, localidad, provincia, codigo_postal, referencia) VALUES
(1, 1, 'DOMICILIO', 'Av. Santa Fe',   '3250', '3',   'B',   'CABA',       'Buenos Aires', 'C1425', 'Timbre 4B'),
(2, 1, 'COMERCIO',  'Av. 9 de Julio', '880',  NULL, NULL,   'CABA',       'Buenos Aires', 'C1070', 'Local al lado de la panaderia'),
(3, 2, 'DOMICILIO', 'Calle 12',       '145',  NULL, 'A',   'Avellaneda', 'Buenos Aires', 'B1870', NULL);

-- 3 veterinarios
INSERT INTO veterinarios (id_veterinario, id_empleado, especialidad) VALUES
(1, 2, 'Clinica general y dermatologia'),
(2, 1, 'Odontologia veterinaria'),
(3, 3, 'Nutricion y dieta');

-- 3 mascotas de clientes (el perro registra 2, el gato 1)
INSERT INTO mascota (id_mascota, id_cliente, nombre, id_raza, sexo, fecha_nacimiento, peso, observaciones) VALUES
(1, 1, 'Toby', 1, 'MACHO',  '2021-05-14', 32.50, 'Alergico a ciertos alimentos'),
(2, 2, 'Mia',  2, 'HEMBRA', '2023-01-09',  4.20, 'Esterilizada'),
(3, 1, 'Roco', 1, 'MACHO',  '2019-11-02', 28.00, 'En seguimiento por displasia');

-- 3 pedidos en distintos estados
INSERT INTO pedidos (id_pedido, id_cliente, fecha, estado, subtotal, costo_envio, total) VALUES
(1, 1, '2025-03-10 11:24:00', 'ENTREGADO', 12500.00, 1500.00, 14000.00),
(2, 2, '2025-04-02 18:05:00', 'ENVIADO',    9800.00, 1500.00, 11300.00),
(3, 3, '2025-04-15 09:47:00', 'PENDIENTE',  9000.00,    0.00,  9000.00);

-- 3 adopciones (una completada, dos en curso)
INSERT INTO adopciones (id_adopcion, id_cliente, id_mascota_adopcion, fecha, estado, observacion) VALUES
(1, 1, 1, '2024-12-01', 'COMPLETADA', 'Adopcion aprobada tras entrevista'),
(2, 2, 2, '2025-04-18', 'EN_CURSO',    'Falta verificar documentacion'),
(3, 3, 3, '2025-04-20', 'EN_CURSO',    'Entrevista programada para el viernes');

-- 3 registros de inventario (el ultimo por debajo del minimo)
INSERT INTO inventario (id_inventario, id_variante, id_sucursal, stock_actual, stock_minimo) VALUES
(1, 1, 1, 40, 10),
(2, 2, 2, 25,  8),
(3, 3, 3,  6, 10);

/* ---------- NIVEL 5: TABLAS OPERATIVAS Y DE DETALLE ---------- */

-- 3 entradas de historial medico
INSERT INTO historial_medico (id_historial, id_mascota, id_veterinario, fecha, motivo, diagnostico, observacion) VALUES
(1, 1, 1, '2025-02-03', 'Control anual',         'Salud general correcta', 'Recomendado el proximo control en 12 meses'),
(2, 3, 1, '2025-03-22', 'Dificultad para andar', 'Displasia de cadera leve', 'Derivar a radiografia si empeora'),
(3, 2, 2, '2025-04-01', 'Dientes sucios',        'Tartaro dental grado I', 'Profilaxis recomendada');

-- 3 tratamientos (uno por historial)
INSERT INTO tratamientos (id_tratamiento, id_historial, medicamento, dosis, frecuencia, duracion) VALUES
(1, 1, 'Antiparasitario',   '1 comprimido', 'Diaria',      '30 dias'),
(2, 2, 'Condroprotector',   '5 mg',         'Cada 12 hrs', '60 dias'),
(3, 3, 'Suplemento dental', '1 pastilla',   'Diaria',      '15 dias');

-- 3 filas de vacunas
INSERT INTO vacunas (id_vacuna, id_mascota, nombre, fecha_aplicacion, fecha_proxima, id_veterinario) VALUES
(1, 1, 'Polivalente anual', '2025-02-03', '2026-02-03', 1),
(2, 3, 'Rabia',             '2025-03-22', '2026-03-22', 1),
(3, 2, 'Triple viral',      '2025-04-01', '2026-04-01', 2);

-- 3 turnos
INSERT INTO turnos (id_turno, id_cliente, id_mascota, id_servicio, id_sucursal, id_veterinario, fecha, hora, motivo, estado, observaciones, fecha_creacion) VALUES
(1, 1, 1, 1, 1, 1, '2025-04-25', '10:00:00', 'Control anual',    'CONFIRMADO', 'Traer cartulina de vacunas', '2025-04-20 10:00:00'),
(2, 2, 2, 3, 2, 2, '2025-04-26', '16:30:00', 'Aplicacion de vacuna', 'PENDIENTE', NULL,                           '2025-04-21 12:15:00'),
(3, 1, 3, 2, 3, 1, '2025-04-20', '09:00:00', 'Corte de pelo',    'FINALIZADO', 'Sin incidencias',              '2025-04-19 09:30:00');

-- 3 lineas de detalle de pedido
INSERT INTO detalle_pedidos (id_detalle_pedido, id_pedido, id_variante, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 1, 12500.00, 12500.00),
(2, 2, 2, 1,  9800.00,  9800.00),
(3, 3, 3, 2,  4500.00,  9000.00);

-- 3 pagos
INSERT INTO pagos (id_pago, id_pedido, metodo_pago, estado_pago) VALUES
(1, 1, 'EFECTIVO',      'REALIZADO'),
(2, 2, 'TRANSFERENCIA', 'REALIZADO'),
(3, 3, 'DEBITO',        'PENDIENTE');

-- 3 envios
INSERT INTO envios (id_envio, id_pedido, tipo_entrega, id_direccion, codigo_postal, fecha_estimada, fecha_entrega, estado) VALUES
(1, 1, 'DOMICILIO', 1,    'C1425', '2025-03-12', '2025-03-12', 'ENTREGADO'),
(2, 2, 'DOMICILIO', 3,    'B1870', '2025-04-04', NULL,         'EN_CAMINO'),
(3, 3, 'SUCURSAL',   NULL, NULL,    NULL,        NULL,         NULL);

COMMIT;

/* ====================================================
   COMPROBACION FINAL
   Debe devolver 3 filas en cada tabla.
   ==================================================== */

SELECT 'sucursales' AS tabla, COUNT(*) AS filas FROM sucursales
UNION ALL SELECT 'atributos',             COUNT(*) FROM atributos
UNION ALL SELECT 'permisos',              COUNT(*) FROM permisos
UNION ALL SELECT 'rol_empleados',         COUNT(*) FROM rol_empleados
UNION ALL SELECT 'rol_usuario',           COUNT(*) FROM rol_usuario
UNION ALL SELECT 'especies',              COUNT(*) FROM especies
UNION ALL SELECT 'categorias_servicios',  COUNT(*) FROM categorias_servicios
UNION ALL SELECT 'categorias',            COUNT(*) FROM categorias
UNION ALL SELECT 'marcas',                COUNT(*) FROM marcas
UNION ALL SELECT 'rol_permiso',           COUNT(*) FROM rol_permiso
UNION ALL SELECT 'usuarios',              COUNT(*) FROM usuarios
UNION ALL SELECT 'razas',                 COUNT(*) FROM razas
UNION ALL SELECT 'servicios',             COUNT(*) FROM servicios
UNION ALL SELECT 'productos',             COUNT(*) FROM productos
UNION ALL SELECT 'mascotas_adopcion',     COUNT(*) FROM mascotas_adopcion
UNION ALL SELECT 'valores_atributo',      COUNT(*) FROM valores_atributo
UNION ALL SELECT 'variantes',             COUNT(*) FROM variantes
UNION ALL SELECT 'productos_categorias',  COUNT(*) FROM productos_categorias
UNION ALL SELECT 'clientes',              COUNT(*) FROM clientes
UNION ALL SELECT 'empleados',             COUNT(*) FROM empleados
UNION ALL SELECT 'carrito_items',         COUNT(*) FROM carrito_items
UNION ALL SELECT 'direcciones',           COUNT(*) FROM direcciones
UNION ALL SELECT 'veterinarios',          COUNT(*) FROM veterinarios
UNION ALL SELECT 'mascota',               COUNT(*) FROM mascota
UNION ALL SELECT 'pedidos',               COUNT(*) FROM pedidos
UNION ALL SELECT 'adopciones',            COUNT(*) FROM adopciones
UNION ALL SELECT 'inventario',            COUNT(*) FROM inventario
UNION ALL SELECT 'historial_medico',      COUNT(*) FROM historial_medico
UNION ALL SELECT 'tratamientos',          COUNT(*) FROM tratamientos
UNION ALL SELECT 'vacunas',               COUNT(*) FROM vacunas
UNION ALL SELECT 'turnos',                COUNT(*) FROM turnos
UNION ALL SELECT 'detalle_pedidos',       COUNT(*) FROM detalle_pedidos
UNION ALL SELECT 'pagos',                 COUNT(*) FROM pagos
UNION ALL SELECT 'envios',                COUNT(*) FROM envios;
