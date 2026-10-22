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
   INSERT DE TABLAS
   Carga minima de datos de prueba (10 registros por
   tabla como minimo) con los IDs explicitos para que
   todas las claves foraneas apunten a filas existentes.
   El orden de los INSERT respeta la jerarquia de
   dependencias: primero las tablas libres, despues las
   que las referencian y al final las operativas.
   ==================================================== */

START TRANSACTION;

/* ---------- 1. Tablas independientes ---------- */

INSERT INTO sucursales (id_sucursal, nombre, direccion, localidad, telefono, horario, img_sucursal, activo) VALUES
(1, 'VetClick Centro', 'Av. Corrientes 1200', 'CABA', '011-4321-0001', 'Lun a Sab 09:00 a 20:00', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/sucursales/sucursal_centro.jpg', TRUE),
(2, 'VetClick Norte', 'Av. Cabildo 2450', 'CABA', '011-4321-0002', 'Lun a Sab 09:00 a 20:00', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/sucursales/sucursal_norte.jpg', TRUE),
(3, 'VetClick Sur', 'Av. Rivadavia 880', 'CABA', '011-4321-0003', 'Lun a Vie 10:00 a 21:00', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/sucursales/sucursal_sur.jpg', TRUE),
(4, 'VetClick Este', 'Av. Callao 3300', 'CABA', '011-4321-0004', 'Mie a Dom 10:00 a 19:00', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/sucursales/sucursal_este.jpg', TRUE),
(5, 'VetClick Oeste', 'Av. Rivadavia 11200', 'CABA', '011-4321-0005', 'Lun a Sab 09:00 a 20:00', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/sucursales/sucursal_oeste.jpg', TRUE),
(6, 'VetClick Villa Urquiza', 'Av. Beauchamp 2100', 'CABA', '011-4321-0006', 'Lun a Sab 10:00 a 19:00', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/sucursales/sucursal_villa_urquiza.jpg', TRUE),
(7, 'VetClick Palermo', 'Av. Santa Fe 1900', 'CABA', '011-4321-0007', 'Lun a Dom 09:00 a 21:00', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/sucursales/sucursal_palermo.jpg', TRUE),
(8, 'VetClick Belgrano', 'Av. Cabildo 2100', 'CABA', '011-4321-0008', 'Lun a Sab 09:00 a 20:00', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/sucursales/sucursal_belgrano.jpg', TRUE),
(9, 'VetClick San Isidro', 'Av. Centenario 450', 'San Isidro', '011-4321-0009', 'Lun a Sab 09:00 a 19:00', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/sucursales/sucursal_san_isidro.jpg', TRUE),
(10, 'VetClick Vicente Lopez', 'Av. del Libertador 1500', 'Vicente Lopez', '011-4321-0010', 'Lun a Vie 10:00 a 20:00', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/sucursales/sucursal_vicente_lopez.jpg', TRUE);

INSERT INTO atributos (id_atributo, nombre) VALUES
(1, 'Talla'),
(2, 'Color'),
(3, 'Sabor'),
(4, 'Peso'),
(5, 'Material'),
(6, 'Presentacion'),
(7, 'Capacidad'),
(8, 'Tipo'),
(9, 'Origen'),
(10, 'Genero');

INSERT INTO permisos (id_permiso, nombre, descripcion) VALUES
(1, 'ver_usuarios', 'Ver el listado de usuarios del sistema'),
(2, 'crear_usuarios', 'Crear nuevos usuarios'),
(3, 'editar_usuarios', 'Editar los datos de los usuarios'),
(4, 'eliminar_usuarios', 'Eliminar usuarios del sistema'),
(5, 'ver_productos', 'Ver el catalogo de productos y variantes'),
(6, 'crear_productos', 'Crear productos, variantes y categorias'),
(7, 'editar_productos', 'Editar productos y categorias del catalogo'),
(8, 'ver_ventas', 'Ver pedidos, pagos y envios'),
(9, 'gestionar_clinica', 'Gestionar mascotas, turnos e historiales medicos'),
(10, 'gestionar_inventario', 'Gestionar el stock de las sucursales');

INSERT INTO rol_usuario (id_rol_usuario, nombre) VALUES
(1, 'ADMINISTRADOR'),
(2, 'VETERINARIO'),
(3, 'RECEPCIONISTA'),
(4, 'CLIENTE'),
(5, 'SUPERVISOR'),
(6, 'ENFERMERO'),
(7, 'FARMACEUTICO'),
(8, 'GERENTE'),
(9, 'PRACTICANTE'),
(10, 'INVITADO');

INSERT INTO rol_empleados (id_rol_empleado, nombre) VALUES
(1, 'VETERINARIO'),
(2, 'RECEPCIONISTA'),
(3, 'ADMINISTRADOR'),
(4, 'AUXILIAR_CLINICA'),
(5, 'CIRUJANO'),
(6, 'PELUQUERO'),
(7, 'FARMACEUTICO'),
(8, 'LABORATORISTA'),
(9, 'SUPERVISOR'),
(10, 'MANTENIMIENTO');

INSERT INTO especies (id_especie, nombre) VALUES
(1, 'Perro'),
(2, 'Gato'),
(3, 'Conejo'),
(4, 'Hamster'),
(5, 'Raton'),
(6, 'Ave'),
(7, 'Reptil'),
(8, 'Pez'),
(9, 'Cabra'),
(10, 'Oveja');

INSERT INTO categorias_servicios (id_categoria_servicio, nombre) VALUES
(1, 'Consulta General'),
(2, 'Vacunacion'),
(3, 'Desparasitacion'),
(4, 'Cirugia'),
(5, 'Estetica y Peluqueria'),
(6, 'Analisis Clinicos'),
(7, 'Radiografia'),
(8, 'Ecografia'),
(9, 'Fisioterapia'),
(10, 'Hospitalizacion');

INSERT INTO categorias (id_categoria, nombre, categoria_padre) VALUES
(1, 'Alimentos', NULL),
(2, 'Medicamentos', NULL),
(3, 'Accesorios', NULL),
(4, 'Alimento Para Perro', 1),
(5, 'Alimento Para Gato', 1),
(6, 'Antiparasitarios', 2),
(7, 'Antibioticos', 2),
(8, 'Collares y Correas', 3),
(9, 'Juguetes', 3),
(10, 'Higiene y Cuidado', 3);

INSERT INTO marcas (id_marca, imagen_marca, nombre) VALUES
(1, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Marcas/royal_canin.jpg', 'Royal Canin'),
(2, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Marcas/hills.jpg', 'Hills'),
(3, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Marcas/pedigree.jpg', 'Pedigree'),
(4, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Marcas/whiskas.jpg', 'Whiskas'),
(5, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Marcas/purina.jpg', 'Purina Pro Plan'),
(6, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Marcas/bayer.jpg', 'Bayer'),
(7, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Marcas/zoetis.jpg', 'Zoetis'),
(8, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Marcas/virbac.jpg', 'Virbac'),
(9, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Marcas/eukanuba.jpg', 'Eukanuba'),
(10, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Marcas/friskies.jpg', 'Friskies');

/* ---------- 2. Primer nivel de dependencia ---------- */

INSERT INTO rol_permiso (id_rol_usuario, id_permiso) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
(2, 5), (2, 7), (2, 9), (2, 10),
(3, 5), (3, 8);

INSERT INTO usuarios (id_usuario, username, password_hash, email, id_rol_usuario, activo, img_usuario) VALUES
(1, 'admin', '$2b$10$6b9VW3.fiIxKT67qDXPz8OAK2YqAydYQvsx2iE7KqKsrbm6VDp.Bm', 'admin@vetclick.com', 1, TRUE, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/PerfilesUsuario/admin.jpg'),
(2, 'carlos.ruiz', '$2b$10$hIUCGekPUzeX90e7Aez1MOmPtWxGnwDM8tM0Rh8ylxVGrh8jTPEx6', 'carlos.ruiz@vetclick.com', 4, TRUE, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/PerfilesUsuario/carlos_ruiz.jpg'),
(3, 'maria.gomez', '$2b$10$hIUCGekPUzeX90e7Aez1MOmPtWxGnwDM8tM0Rh8ylxVGrh8jTPEx6', 'maria.gomez@vetclick.com', 4, TRUE, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/PerfilesUsuario/maria_gomez.jpg'),
(4, 'juan.perez', '$2b$10$hIUCGekPUzeX90e7Aez1MOmPtWxGnwDM8tM0Rh8ylxVGrh8jTPEx6', 'juan.perez@vetclick.com', 4, TRUE, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/PerfilesUsuario/juan_perez.jpg'),
(5, 'ana.lopez', '$2b$10$hIUCGekPUzeX90e7Aez1MOmPtWxGnwDM8tM0Rh8ylxVGrh8jTPEx6', 'ana.lopez@vetclick.com', 4, TRUE, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/PerfilesUsuario/ana_lopez.jpg'),
(6, 'luis.sanchez', '$2b$10$hIUCGekPUzeX90e7Aez1MOmPtWxGnwDM8tM0Rh8ylxVGrh8jTPEx6', 'luis.sanchez@vetclick.com', 4, TRUE, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/PerfilesUsuario/luis_sanchez.jpg'),
(7, 'dr.mendoza', '$2b$10$kRCDkZJZM.S/rUa5ieElX.35F.3vHri7XI03RD92imMxgqeYAla.S', 'carla.mendoza@vetclick.com', 2, TRUE, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/PerfilesUsuario/dr_mendoza.jpg'),
(8, 'dr.sosa', '$2b$10$kRCDkZJZM.S/rUa5ieElX.35F.3vHri7XI03RD92imMxgqeYAla.S', 'diego.sosa@vetclick.com', 2, TRUE, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/PerfilesUsuario/dr_sosa.jpg'),
(9, 'recepcion', '$2b$10$L054UP6.eflQhfglM2hVcecDbs2KfNHqhdl/Et0FYNbGJsNPI7ERe', 'recepcion@vetclick.com', 3, TRUE, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/PerfilesUsuario/recepcion.jpg'),
(10, 'supervisor', '$2b$10$L054UP6.eflQhfglM2hVcecDbs2KfNHqhdl/Et0FYNbGJsNPI7ERe', 'supervisor@vetclick.com', 5, TRUE, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/PerfilesUsuario/supervisor.jpg');

INSERT INTO razas (id_raza, nombre, id_especie) VALUES
(1, 'Labrador Retriever', 1),
(2, 'Golden Retriever', 1),
(3, 'Poodle', 1),
(4, 'Siames', 2),
(5, 'Persa', 2),
(6, 'Holandes', 3),
(7, 'Hamster Sirio', 4),
(8, 'Raton Blanco', 5),
(9, 'Cloro', 6),
(10, 'Iguana Verde', 7);

INSERT INTO servicios (id_servicio, nombre, descripcion, id_categoria_servicio, precio, activo) VALUES
(1, 'Consulta General', 'Revision clinica completa del paciente', 1, 8500.00, TRUE),
(2, 'Vacunacion Annual', 'Aplicacion de la vacuna anualPreventiva', 2, 6500.00, TRUE),
(3, 'Desparasitacion', 'Tratamiento antiparasitario interno y externo', 3, 7200.00, TRUE),
(4, 'Cirugia de Esterilizacion', 'Esterilizacion quirurgica con internacion', 4, 45000.00, TRUE),
(5, 'Peluqueria Canina', 'Corte de pelo, bathed y limpieza de oidos', 5, 9500.00, TRUE),
(6, 'Analisis de Sangre', 'Hemograma y bioquimica basica', 6, 12000.00, TRUE),
(7, 'Radiografia Simple', 'Placa radiografica de torax o abdomen', 7, 9800.00, TRUE),
(8, 'Ecografia Abdominal', 'Ecografia de abdomen completo', 8, 18500.00, TRUE),
(9, 'Fisioterapia Kinesica', 'Sesion de rehabilitacion para perros y gatos', 9, 8000.00, TRUE),
(10, 'Internacion Hospitalaria', 'Dia de internacion con monitorizacion', 10, 22000.00, TRUE);

INSERT INTO productos (id_producto, id_marca, nombre, descripcion, activo, descuento, imagen) VALUES
(1, 1, 'Alimento Premium Perro Adulto', 'Crocetas para perros adultos de todas las razas, 15 kg', TRUE, 10, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Productos/alimento_perro_adulto.jpg'),
(2, 2, 'Alimento Gato Adulto', 'Alimento seco para gatos adultos, control de peso, 3 kg', TRUE, 0, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Productos/alimento_gato_adulto.jpg'),
(3, 3, 'Croquetas para Cachorro', 'Alimento para puppies de 2 a 12 meses, 3 kg', TRUE, 15, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Productos/croquetas_cachorro.jpg'),
(4, 4, 'Alimento Humedo para Gato', 'Sobrecitos de pato y atun para gatos, 85 g', TRUE, 0, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Productos/alimento_humedo_gato.jpg'),
(5, 5, 'Pro Plan Sensitive', 'Alimento para gatos con sensibilidad digestiva, 2.5 kg', TRUE, 5, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Productos/pro_plan_sensitive.jpg'),
(6, 6, 'Antiparasitario Suspension', 'Suspension oral antiparasitaria para perros y gatos, 10 ml', TRUE, 0, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Productos/antiparasitario_suspension.jpg'),
(7, 7, 'Antibiotico Amoxicilina', 'Comprimidos de amoxicilina 500 mg, 12 unidades', TRUE, 0, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Productos/antibiotico_amoxicilina.jpg'),
(8, 8, 'Vitaminas Multiespecificas', 'Complemento vitamico para perros y gatos, 60 comprimidos', TRUE, 20, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Productos/vitaminas_multiespecificas.jpg'),
(9, 9, 'Alimento para Cachorros', 'Alimento de alta energia para cachorros de raza grande, 12 kg', TRUE, 0, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Productos/alimento_cachorros.jpg'),
(10, 10, 'Snack para Gato', 'Snacks de salvado y pollo para gatos, 100 g', TRUE, 0, 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/Productos/snack_gato.jpg');

INSERT INTO mascotas_adopcion (id_mascota_adopcion, nombre, id_raza, edad, sexo, descripcion, estado, img_masc_adop) VALUES
(1, 'Firulais', 1, '2 anos', 'MACHO', 'Perro mestizo de gran caracter, buena salud y muy sociable', 'EN_ADOPCION', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/adopciones/firulais.jpg'),
(2, 'Luna', 5, '1 ano', 'HEMBRA', 'Gata gris de pelo largo, tranquila y yaichageada', 'EN_ADOPCION', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/adopciones/luna.jpg'),
(3, 'Toto', 3, '8 meses', 'MACHO', 'Cachorro poodle lively, muy cariñoso con los ninos', 'EN_TRAMITE', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/adopciones/toto.jpg'),
(4, 'Nube', 4, '3 anos', 'HEMBRA', 'Gata siames de pelo corto, requiere adopcion responsable', 'EN_ADOPCION', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/adopciones/nube.jpg'),
(5, 'Pepito', 7, '5 meses', 'MACHO', 'Hamster de pelo largo, muy activo y curioso', 'EN_ADOPCION', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/adopciones/pepito.jpg'),
(6, 'Canela', 2, '4 anos', 'HEMBRA', 'Golden retriever sterling, lista para adoption familiar', 'EN_TRAMITE', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/adopciones/canela.jpg'),
(7, 'Roco', 6, '2 anos', 'MACHO', 'Conejo Dutch de manchas, tranquilo y de interior', 'EN_ADOPCION', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/adopciones/roco.jpg'),
(8, 'Mango', 9, '6 meses', 'MACHO', 'Cloro Very hablador, necesita socializacion', 'EN_ADOPCION', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/adopciones/mango.jpg'),
(9, 'Rita', 8, '3 meses', 'HEMBRA', 'Rata blanca de pelo suave, criada a mano', 'EN_TRAMITE', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/adopciones/rita.jpg'),
(10, 'Chama', 10, '1 ano', 'HEMBRA', 'Iguana verde de temperamento docil, ya aclimatada', 'EN_ADOPCION', 'https://res.cloudinary.com/ebk49m6m/image/upload/VetClick/adopciones/chama.jpg');

INSERT INTO valores_atributo (id_valor, id_atributo, nombre) VALUES
(1, 1, 'Chica'),
(2, 1, 'Mediana'),
(3, 1, 'Grande'),
(4, 2, 'Negro'),
(5, 2, 'Blanco'),
(6, 2, 'Marron'),
(7, 3, 'Carne'),
(8, 3, 'Pollo'),
(9, 3, 'Pescado'),
(10, 7, '1 L'),
(11, 7, '5 L');

/* ---------- 3. Segundo nivel de dependencia ---------- */

INSERT INTO variantes (id_variante, id_producto, id_valor_atributo, precio) VALUES
(1, 1, 1, 12000.00),
(2, 1, 2, 15000.00),
(3, 2, 1, 9500.00),
(4, 3, 3, 18000.00),
(5, 4, 4, 3500.00),
(6, 5, 5, 4200.00),
(7, 6, 7, 7800.00),
(8, 7, 8, 12500.00),
(9, 8, 9, 6500.00),
(10, 9, 10, 2400.00);

INSERT INTO productos_categorias (id_categoria, id_producto) VALUES
(1, 1),
(1, 3),
(1, 9),
(1, 4),
(2, 6),
(2, 7),
(2, 8),
(3, 5),
(3, 2),
(4, 1),
(4, 3),
(4, 9);

INSERT INTO clientes (id_cliente, id_usuario, nombre, apellido, telefono, estado) VALUES
(1, 2, 'Carlos', 'Ruiz', '0115551001', TRUE),
(2, 3, 'Maria', 'Gomez', '0115551002', TRUE),
(3, 4, 'Juan', 'Perez', '0115551003', FALSE),
(4, 5, 'Ana', 'Lopez', '0115551004', TRUE),
(5, 6, 'Luis', 'Sanchez', '0115551005', FALSE),
(6, NULL, 'Marta', 'Diaz', '0115551006', TRUE),
(7, NULL, 'Diego', 'Ramirez', '0115551007', FALSE),
(8, NULL, 'Rocio', 'Moreno', '0115551008', TRUE),
(9, NULL, 'Federico', 'Ortiz', '0115551009', FALSE),
(10, NULL, 'Valeria', 'Castro', '0115551010', TRUE);

INSERT INTO empleados (id_empleado, id_usuario, id_rol_empleado, nombre, apellido, telefono, direccion, id_sucursal) VALUES
(1, 7, 1, 'Carla', 'Mendoza', '011-6666-2001', 'Calle 100 250', 1),
(2, 8, 1, 'Diego', 'Sosa', '011-6666-2002', 'Calle 200 350', 2),
(3, NULL, 1, 'Paula', 'Nunez', '011-6666-2003', 'Calle 300 450', 1),
(4, NULL, 1, 'Martin', 'Diaz', '011-6666-2004', 'Calle 400 550', 3),
(5, NULL, 1, 'Sofia', 'Vidal', '011-6666-2005', 'Calle 500 650', 2),
(6, NULL, 1, 'Nico', 'Ferrari', '011-6666-2006', 'Calle 600 750', 4),
(7, NULL, 1, 'Tomas', 'Rios', '011-6666-2007', 'Calle 700 850', 5),
(8, NULL, 1, 'Julieta', 'Paz', '011-6666-2008', 'Calle 800 950', 1),
(9, NULL, 5, 'Emilio', 'Bruno', '011-6666-2009', 'Calle 900 1050', 2),
(10, NULL, 4, 'Lucia', 'Vera', '011-6666-2010', 'Calle 1000 1150', 3),
(11, 9, 2, 'Rosa', 'Ibarra', '011-6666-2011', 'Calle 1100 1250', 1),
(12, 10, 9, 'Hector', 'Arias', '011-6666-2012', 'Calle 1200 1350', 4);

/* ---------- 4. Tercer nivel de dependencia ---------- */

INSERT INTO carrito_items (id_carrito, id_usuario, id_variante, cantidad) VALUES
(1, 2, 1, 2),
(2, 2, 3, 1),
(3, 3, 2, 1),
(4, 4, 4, 3),
(5, 5, 5, 2),
(6, 6, 6, 1),
(7, 2, 7, 1),
(8, 3, 8, 2),
(9, 4, 9, 1),
(10, 5, 10, 2);

INSERT INTO direcciones (id_direccion, id_cliente, tipo_direccion, calle, numero, piso, departamento, localidad, provincia, codigo_postal, referencia) VALUES
(1, 1, 'DOMICILIO', 'Av. Corrientes', '1200', '3', 'A', 'CABA', 'Buenos Aires', 'C1002', 'Timbre 3A'),
(2, 2, 'DOMICILIO', 'Av. Santa Fe', '1900', '5', 'B', 'CABA', 'Buenos Aires', 'C1125', 'Frontera con Parque'),
(3, 3, 'COMERCIO', 'Calle 50', '320', '1', 'Local 4', 'CABA', 'Buenos Aires', 'C1003', 'Mostrador a la calle'),
(4, 4, 'DOMICILIO', 'Av. Cabildo', '2450', '7', 'C', 'CABA', 'Buenos Aires', 'C1425', 'Porton negro'),
(5, 5, 'DOMICILIO', 'Av. Rivadavia', '880', '2', 'D', 'CABA', 'Buenos Aires', 'C1027', 'Al lado del kiosco'),
(6, 6, 'DOMICILIO', 'Av. Callao', '3300', '9', 'A', 'CABA', 'Buenos Aires', 'C1429', 'Depto con balcon'),
(7, 7, 'COMERCIO', 'Av. Centenario', '450', 'PB', '9', 'San Isidro', 'Buenos Aires', 'B1642', 'Galeria comercial'),
(8, 8, 'DOMICILIO', 'Av. del Libertador', '1500', '4', 'A', 'Vicente Lopez', 'Buenos Aires', 'B1638', 'Edificio de ladrillo'),
(9, 9, 'DOMICILIO', 'Calle 100', '250', '1', 'C', 'CABA', 'Buenos Aires', 'C1043', 'Zona de casas bajas'),
(10, 10, 'DOMICILIO', 'Calle 200', '350', '6', 'B', 'CABA', 'Buenos Aires', 'C1029', 'Esquina con semaforo');

INSERT INTO veterinarios (id_veterinario, id_empleado, especialidad) VALUES
(1, 1, 'Medicina Interna'),
(2, 2, 'Cirugia General'),
(3, 3, 'Dermatologia'),
(4, 4, 'Cardiologia'),
(5, 5, 'Odontologia'),
(6, 6, 'Traumatologia'),
(7, 7, 'Nutricion Animal'),
(8, 8, 'Obstetricia'),
(9, 9, 'Cirugia de Urgencia'),
(10, 10, 'Analisis Clinico');

INSERT INTO mascota (id_mascota, id_cliente, nombre, id_raza, sexo, fecha_nacimiento, peso, observaciones) VALUES
(1, 1, 'Roco', 1, 'MACHO', '2021-05-14', 32.50, 'Cumple con el plan de vacunas al dia'),
(2, 2, 'Mia', 4, 'HEMBRA', '2022-01-20', 4.10, 'Alergica a ciertos alimentos, control de peso'),
(3, 3, 'Toby', 2, 'MACHO', '2019-09-08', 28.00, 'Artrosis en articulation posterior'),
(4, 4, 'Nina', 5, 'HEMBRA', '2023-03-02', 3.20, 'Raspado recurrente en orejas'),
(5, 5, 'Simba', 3, 'MACHO', '2024-02-11', 8.70, 'Cachorro en crecimiento, control de desparasitacion'),
(6, 6, 'Luna', 3, 'HEMBRA', '2020-11-30', 6.90, 'Alergia estacional, antihistaminico estacional'),
(7, 7, 'Pipo', 6, 'MACHO', '2023-06-18', 1.80, 'Desparasitacion trimestral'),
(8, 8, 'Kiwi', 7, 'MACHO', '2025-01-09', 0.15, 'En observado por muda de pelo'),
(9, 9, 'Chispa', 8, 'HEMBRA', '2025-04-22', 0.08, 'Recien destetada'),
(10, 10, 'Roca', 10, 'MACHO', '2024-07-15', 0.90, 'Terrario en casa, UVB 10h');

INSERT INTO pedidos (id_pedido, id_cliente, fecha, estado, subtotal, costo_envio, total) VALUES
(1, 1, '2026-09-05 10:15:00', 'ENTREGADO', 27000.00, 3500.00, 30500.00),
(2, 2, '2026-09-08 18:40:00', 'ENTREGADO', 9500.00, 2500.00, 12000.00),
(3, 3, '2026-09-12 09:05:00', 'ENTREGADO', 18000.00, 3500.00, 21500.00),
(4, 4, '2026-09-18 14:20:00', 'ENVIADO', 7000.00, 2500.00, 9500.00),
(5, 5, '2026-09-25 11:30:00', 'ENVIADO', 4200.00, 3000.00, 7200.00),
(6, 6, '2026-10-01 16:45:00', 'PREPARANDO', 15600.00, 3500.00, 19100.00),
(7, 7, '2026-10-04 12:10:00', 'PREPARANDO', 7800.00, 2500.00, 10300.00),
(8, 8, '2026-10-09 17:25:00', 'PENDIENTE', 25000.00, 3500.00, 28500.00),
(9, 9, '2026-10-13 09:55:00', 'PENDIENTE', 6500.00, 3000.00, 9500.00),
(10, 10, '2026-10-17 19:35:00', 'PENDIENTE', 2400.00, 2500.00, 4900.00);

INSERT INTO adopciones (id_adopcion, id_cliente, id_mascota_adopcion, fecha, estado, observacion) VALUES
(1, 1, 1, '2026-09-10', 'APROBADA', 'El adoptante quedo a la espera del resultado del estudio'),
(2, 2, 2, '2026-09-14', 'EN_PROCESO', 'Falta la comprovacion de vivienda'),
(3, 3, 3, '2026-09-20', 'COMPLETADA', 'Entrega a la nueva familia'),
(4, 4, 4, '2026-09-28', 'APROBADA', 'Adopcion responsable con seguimiento a 30 dias'),
(5, 5, 5, '2026-10-02', 'EN_PROCESO', 'Solicito segunda visita a la mascotita'),
(6, 6, 6, '2026-10-06', 'EN_PROCESO', 'En espera de la documentacion'),
(7, 7, 7, '2026-10-10', 'APROBADA', 'Se coordina la entrega para el fin de semana'),
(8, 8, 8, '2026-10-15', 'EN_PROCESO', 'Revisada la socializacion previa'),
(9, 9, 9, '2026-10-19', 'APROBADA', 'Adopcion concretada para la nina'),
(10, 10, 10, '2026-10-21', 'APROBADA', 'Requisitos de terrario verificados');

INSERT INTO inventario (id_inventario, id_variante, id_sucursal, stock_actual, stock_minimo) VALUES
(1, 1, 1, 42, 10),
(2, 2, 2, 28, 8),
(3, 3, 1, 15, 10),
(4, 4, 3, 60, 20),
(5, 5, 2, 34, 12),
(6, 6, 4, 9, 10),
(7, 7, 1, 25, 8),
(8, 8, 5, 17, 5),
(9, 9, 6, 40, 15),
(10, 10, 7, 22, 10);

/* ---------- 5. Cuarto y quinto nivel (operativas) ---------- */

INSERT INTO historial_medico (id_historial, id_mascota, id_veterinario, fecha, motivo, diagnostico, observacion) VALUES
(1, 1, 1, '2026-02-10', 'Control anual', 'Salud general optima', 'Proxima consulta en 12 meses'),
(2, 2, 3, '2026-02-18', 'Alergia alimentaria', 'Dermatitis por sensibilidad digestiva', 'Se indica dieta hipoalergenica'),
(3, 3, 4, '2026-03-05', 'Cojera en pata trasera', 'Artrosis de cadera', 'Analgesicos y fisioterapia'),
(4, 4, 3, '2026-03-22', 'Raspado de orejas', 'Otitis externa por levaduras', 'Gotas y limpieza semanal'),
(5, 5, 7, '2026-04-08', 'Control de crecimiento', 'Peso dentro del rango', 'Seguir con alimento formulado para cachorro'),
(6, 6, 5, '2026-04-19', 'Dientes con sarro', 'Gingivitis leve', 'Profilaxis dental en 6 meses'),
(7, 7, 1, '2026-05-14', 'Desparasitacion', 'Parasitos internos', 'Repetir en 3 meses'),
(8, 8, 10, '2026-06-01', 'Consulta de rutina', 'Muda de pelo estacional', 'CEPILLO semanal'),
(9, 9, 10, '2026-07-11', 'Primera consulta', 'Crecimiento normal', 'Vacunacion a los 2 meses'),
(10, 10, 6, '2026-08-03', 'Control depiel', 'Piel sana, sin retenu', 'Iluminacion UVB correcta');

INSERT INTO tratamientos (id_tratamiento, id_historial, medicamento, dosis, frecuencia, duracion) VALUES
(1, 1, 'Desparasitario mensual', '1 comprimido', 'Cada 30 dias', '6 meses'),
(2, 2, 'Dieta hipoalergenica', 'Alimento prescrito', 'Diaria', 'Indefinida'),
(3, 3, 'Meloxicam', '0.5 mg/kg', 'Cada 24 horas', '15 dias'),
(4, 3, 'Condroprotector', '1 comprimido', 'Cada 24 horas', '3 meses'),
(5, 4, 'Gotas oticas', '5 gotas', 'Cada 12 horas', '10 dias'),
(6, 5, 'Complemento de calcio', '1 comprimido', 'Cada 24 horas', '3 meses'),
(7, 6, 'Cepillado dental', 'Pasta dental', 'Cada 3 dias', '6 meses'),
(8, 7, 'Pipeta antiparasitaria', '1 pipeta', 'Cada 30 dias', '4 meses'),
(9, 8, 'Suplemento de biotina', '1 comprimido', 'Cada 24 horas', '2 meses'),
(10, 10, 'Vitamina A', '5000 UI', 'Cada 7 dias', '3 meses');

INSERT INTO vacunas (id_vacuna, id_mascota, nombre, fecha_aplicacion, fecha_proxima, id_veterinario) VALUES
(1, 1, 'Rabia', '2026-02-10', '2027-02-10', 1),
(2, 1, 'Quintuple', '2026-02-10', '2027-02-10', 1),
(3, 2, 'Triple Viral', '2026-02-18', '2027-02-18', 3),
(4, 3, 'Rabia', '2026-03-05', '2027-03-05', 4),
(5, 4, 'Leptospirosis', '2026-03-22', '2027-03-22', 3),
(6, 5, 'Quintuple', '2026-04-08', '2027-04-08', 7),
(7, 6, 'Rabia', '2026-04-19', '2027-04-19', 5),
(8, 7, 'Mixomatosis', '2026-05-14', '2027-05-14', 1),
(9, 8, 'Parvovirus', '2026-06-01', '2027-06-01', 10),
(10, 10, 'Mixomatosis', '2026-08-03', '2027-08-03', 6);

INSERT INTO turnos (id_turno, id_cliente, id_mascota, id_servicio, id_sucursal, id_veterinario, fecha, hora, motivo, estado, observaciones) VALUES
(1, 1, 1, 1, 1, 1, '2026-10-22', '09:00:00', 'Control anual del paciente', 'CONFIRMADO', 'Traer cartilla de vacunas'),
(2, 2, 2, 2, 2, 3, '2026-10-22', '10:30:00', 'Aplicacion de vacuna anual', 'CONFIRMADO', NULL),
(3, 3, 3, 9, 3, 4, '2026-10-23', '11:00:00', 'Sesion de fisioterapia por artrosis', 'PENDIENTE', 'Confirmar con la dueña'),
(4, 4, 4, 3, 1, 3, '2026-10-23', '12:30:00', 'Desparasitacion trimestral', 'CONFIRMADO', NULL),
(5, 5, 5, 1, 2, 7, '2026-10-24', '09:30:00', 'Control de crecimiento del cachorro', 'PENDIENTE', NULL),
(6, 6, 6, 5, 4, 5, '2026-10-24', '14:00:00', 'Peluqueria y profilaxis dental', 'CONFIRMADO', 'Ayuno de 8 horas'),
(7, 7, 7, 1, 1, 1, '2026-10-25', '10:00:00', 'Consulta de control del conejo', 'PENDIENTE', NULL),
(8, 8, 8, 6, 6, 10, '2026-10-26', '15:30:00', 'Analisis de sangre de control', 'CONFIRMADO', 'En ayunas'),
(9, 9, 9, 1, 7, 10, '2026-10-27', '11:30:00', 'Segunda consulta de la rata', 'PENDIENTE', NULL),
(10, 10, 10, 8, 8, 6, '2026-10-28', '16:00:00', 'Ecografia de control', 'CONFIRMADO', 'Traer radiografia previa');

INSERT INTO detalle_pedidos (id_detalle_pedido, id_pedido, id_variante, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 2, 12000.00, 24000.00),
(2, 1, 3, 1, 3000.00, 3000.00),
(3, 2, 3, 1, 9500.00, 9500.00),
(4, 3, 4, 1, 18000.00, 18000.00),
(5, 4, 5, 2, 3500.00, 7000.00),
(6, 5, 6, 1, 4200.00, 4200.00),
(7, 6, 7, 2, 7800.00, 15600.00),
(8, 7, 7, 1, 7800.00, 7800.00),
(9, 8, 8, 2, 12500.00, 25000.00),
(10, 9, 9, 1, 6500.00, 6500.00);

INSERT INTO pagos (id_pago, id_pedido, metodo_pago, estado_pago) VALUES
(1, 1, 'CREDITO', 'REALIZADO'),
(2, 2, 'DEBITO', 'REALIZADO'),
(3, 3, 'TRANSFERENCIA', 'REALIZADO'),
(4, 4, 'CREDITO', 'REALIZADO'),
(5, 5, 'EFECTIVO', 'REALIZADO'),
(6, 6, 'DEBITO', 'PENDIENTE'),
(7, 7, 'TRANSFERENCIA', 'PENDIENTE'),
(8, 8, 'CREDITO', 'PENDIENTE'),
(9, 9, 'EFECTIVO', 'PENDIENTE'),
(10, 10, 'DEBITO', 'PENDIENTE');

INSERT INTO envios (id_envio, id_pedido, tipo_entrega, id_direccion, codigo_postal, fecha_estimada, fecha_entrega, estado) VALUES
(1, 1, 'DOMICILIO', 1, 'C1002', '2026-09-08', '2026-09-07', 'ENTREGADO'),
(2, 2, 'SUCURSAL', NULL, 'C1125', '2026-09-11', '2026-09-10', 'ENTREGADO'),
(3, 3, 'DOMICILIO', 3, 'C1003', '2026-09-15', '2026-09-14', 'ENTREGADO'),
(4, 4, 'DOMICILIO', 4, 'C1425', '2026-09-21', NULL, 'EN_CAMINO'),
(5, 5, 'PROGRAMADO', 5, 'C1027', '2026-09-28', NULL, 'EN_CAMINO'),
(6, 6, 'DOMICILIO', 6, 'C1429', '2026-10-04', NULL, 'EN_CAMINO'),
(7, 7, 'SUCURSAL', NULL, 'B1642', '2026-10-07', NULL, 'EN_CAMINO'),
(8, 8, 'DOMICILIO', 8, 'B1638', '2026-10-13', NULL, 'EN_CAMINO'),
(9, 9, 'DOMICILIO', 9, 'C1043', '2026-10-16', NULL, 'EN_CAMINO'),
(10, 10, 'SUCURSAL', NULL, 'C1029', '2026-10-20', NULL, 'EN_CAMINO');

COMMIT;

/* ====================================================
   REINICIO DE CLAVES E IDs
   Los contadores AUTO_INCREMENT quedan alineados con el
   ultimo ID insertado para que los proximos inserts
   automaticos no choquen con las claves foraneas ya
   sembradas.
   ==================================================== */

ALTER TABLE sucursales AUTO_INCREMENT = 11;
ALTER TABLE atributos AUTO_INCREMENT = 11;
ALTER TABLE permisos AUTO_INCREMENT = 11;
ALTER TABLE rol_empleados AUTO_INCREMENT = 11;
ALTER TABLE rol_usuario AUTO_INCREMENT = 11;
ALTER TABLE especies AUTO_INCREMENT = 11;
ALTER TABLE categorias_servicios AUTO_INCREMENT = 11;
ALTER TABLE categorias AUTO_INCREMENT = 11;
ALTER TABLE marcas AUTO_INCREMENT = 11;
ALTER TABLE rol_permiso AUTO_INCREMENT = 17;
ALTER TABLE usuarios AUTO_INCREMENT = 11;
ALTER TABLE razas AUTO_INCREMENT = 11;
ALTER TABLE servicios AUTO_INCREMENT = 11;
ALTER TABLE productos AUTO_INCREMENT = 11;
ALTER TABLE mascotas_adopcion AUTO_INCREMENT = 11;
ALTER TABLE valores_atributo AUTO_INCREMENT = 12;
ALTER TABLE variantes AUTO_INCREMENT = 11;
ALTER TABLE clientes AUTO_INCREMENT = 11;
ALTER TABLE empleados AUTO_INCREMENT = 13;
ALTER TABLE carrito_items AUTO_INCREMENT = 11;
ALTER TABLE direcciones AUTO_INCREMENT = 11;
ALTER TABLE veterinarios AUTO_INCREMENT = 11;
ALTER TABLE mascota AUTO_INCREMENT = 11;
ALTER TABLE pedidos AUTO_INCREMENT = 11;
ALTER TABLE adopciones AUTO_INCREMENT = 11;
ALTER TABLE inventario AUTO_INCREMENT = 11;
ALTER TABLE historial_medico AUTO_INCREMENT = 11;
ALTER TABLE tratamientos AUTO_INCREMENT = 11;
ALTER TABLE vacunas AUTO_INCREMENT = 11;
ALTER TABLE turnos AUTO_INCREMENT = 11;
ALTER TABLE detalle_pedidos AUTO_INCREMENT = 11;
ALTER TABLE pagos AUTO_INCREMENT = 11;
ALTER TABLE envios AUTO_INCREMENT = 11;

/* ====================================================
   COMPROBACION FINAL
   Debe devolver 10 filas por tabla como minimo.
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
