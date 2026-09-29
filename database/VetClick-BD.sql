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
    id_especie INT,
    edad VARCHAR(20),
    sexo ENUM('MACHO', 'HEMBRA') NOT NULL,
    descripcion VARCHAR(120),
    estado ENUM('ADOPTADO', 'EN_ADOPCION'),

    FOREIGN KEY (id_especie) REFERENCES especies(id_especie)
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


CREATE TABLE carrito_items (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_variante INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_variante) REFERENCES variantes(id_variante) ON DELETE CASCADE,
    UNIQUE KEY usuario_producto_unico (id_usuario, id_variante)
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
   Solo se escriben: no se ejecutan. Van en el mismo
   orden de dependencias que la creacion de tablas.
   ==================================================== */

-- Tabla: sucursales
INSERT INTO sucursales (id_sucursal, nombre, direccion, localidad, telefono, horario, activo) VALUES
(1, 'Sucursal Centro', 'Av. Principal 100', 'Centro', '011-4444-100', 'Lun a Vie 09:00 a 18:00', TRUE),
(2, 'Sucursal Norte', 'Av. Norte 250', 'Norte', '011-4444-200', 'Lun a Sab 09:00 a 20:00', TRUE),
(3, 'Sucursal Sur', 'Calle Sur 45', 'Sur', '011-4444-300', 'Lun a Vie 08:00 a 17:00', FALSE);

-- Tabla: atributos
INSERT INTO atributos (id_atributo, nombre) VALUES
(1, 'Color'),
(2, 'Talla'),
(3, 'Sabor');

-- Tabla: permisos
INSERT INTO permisos (id_permiso, nombre, descripcion) VALUES
(1, 'gestionar_usuarios', 'Alta, baja y edicion de usuarios'),
(2, 'gestionar_ventas', 'Consulta y registro de pedidos'),
(3, 'gestionar_inventario', 'Ajuste de stock por sucursal');

-- Tabla: rol_empleados
INSERT INTO rol_empleados (id_rol_empleado, nombre) VALUES
(1, 'Administrador'),
(2, 'Veterinario'),
(3, 'Recepcionista');

-- Tabla: rol_usuario
INSERT INTO rol_usuario (id_rol_usuario, nombre) VALUES
(1, 'Administrador'),
(2, 'Vendedor'),
(3, 'Cliente');

-- Tabla: especies
INSERT INTO especies (id_especie, nombre) VALUES
(1, 'Perro'),
(2, 'Gato'),
(3, 'Ave');

-- Tabla: categorias_servicios
INSERT INTO categorias_servicios (id_categoria_servicio, nombre) VALUES
(1, 'Consultas'),
(2, 'Cirugias'),
(3, 'Estetica');

-- Tabla: categorias
INSERT INTO categorias (id_categoria, nombre, categoria_padre) VALUES
(1, 'Alimentos', NULL),
(2, 'Medicamentos', NULL),
(3, 'Lacteos', 1);

-- Tabla: marcas
INSERT INTO marcas (id_marca, imagen_marca, nombre) VALUES
(1, 'img/marca-1.png', 'Royal Canin'),
(2, 'img/marca-2.png', 'Purina'),
(3, 'img/marca-3.png', 'Hills');

-- Tabla: rol_permiso
INSERT INTO rol_permiso (id_rol_usuario, id_permiso) VALUES
(1, 1),
(1, 2),
(1, 3);

-- Tabla: usuarios
INSERT INTO usuarios (id_usuario, username, password_hash, email, id_rol_usuario, activo) VALUES
(1, 'admin', '$2a$10$ejemploHashDePassword0000000000000000000000000000', 'admin@vetclick.com', 1, TRUE),
(2, 'veterinario1', '$2a$10$ejemploHashDePassword0000000000000000000000000000', 'vet1@vetclick.com', 2, TRUE),
(3, 'cliente1', '$2a$10$ejemploHashDePassword0000000000000000000000000000', 'cliente1@vetclick.com', 3, TRUE);

-- Tabla: razas
INSERT INTO razas (id_raza, nombre, id_especie) VALUES
(1, 'Labrador', 1),
(2, 'Siames', 2),
(3, 'Canario', 3);

-- Tabla: servicios
INSERT INTO servicios (id_servicio, nombre, descripcion, id_categoria_servicio, precio, activo) VALUES
(1, 'Consulta general', 'Control clinico de rutina', 1, 15000.00, TRUE),
(2, 'Vacunacion', 'Aplicacion de vacuna', 1, 12000.00, TRUE),
(3, 'Bano y corte', 'Servicio de estetica canina', 3, 9000.00, TRUE);

-- Tabla: productos
INSERT INTO productos (id_producto, id_marca, nombre, descripcion, activo, descuento, imagen) VALUES
(1, 1, 'Balanceado para perro adulto', 'Presentacion 15 kg', TRUE, 0, 'img/producto-1.jpg'),
(2, 2, 'Antipulgas gato', 'Spot-on con 3 dosis', TRUE, 10, 'img/producto-2.jpg'),
(3, 3, 'Juguete para aves', 'Juguete de madera', FALSE, 0, NULL);

-- Tabla: mascotas_adopcion
INSERT INTO mascotas_adopcion (id_mascota_adopcion, nombre, id_especie, edad, sexo, descripcion, estado) VALUES
(1, 'Toby', 1, '2 anos', 'MACHO', 'Perro mestizo, sociable', 'EN_ADOPCION'),
(2, 'Mishi', 2, '1 anio', 'HEMBRA', 'Gata activa', 'EN_ADOPCION'),
(3, 'Loro', 3, '4 anos', 'MACHO', 'Ave de colores', 'ADOPTADO');

-- Tabla: valores_atributo
INSERT INTO valores_atributo (id_valor, id_atributo, nombre) VALUES
(1, 1, 'Rojo'),
(2, 2, 'Mediana'),
(3, 3, 'Pollo');

-- Tabla: variantes
INSERT INTO variantes (id_variante, id_producto, id_valor_atributo, precio) VALUES
(1, 1, 1, 25000.00),
(2, 2, 2, 30000.00),
(3, 3, 3, 45000.00);

-- Tabla: productos_categorias
INSERT INTO productos_categorias (id_categoria, id_producto) VALUES
(1, 1),
(2, 2),
(3, 3);

-- Tabla: clientes
INSERT INTO clientes (id_cliente, id_usuario, nombre, apellido, telefono, estado) VALUES
(1, 3, 'Juan', 'Perez', '011-4000-1111', TRUE),
(2, NULL, 'Maria', 'Gomez', '011-4000-2222', TRUE),
(3, NULL, 'Pedro', 'Lopez', '011-4000-3333', FALSE);

-- Tabla: empleados
INSERT INTO empleados (id_empleado, id_usuario, id_rol_empleado, nombre, apellido, telefono, direccion, id_sucursal) VALUES
(1, 1, 1, 'Ana', 'Gomez', '011-5000-1111', 'Av. Siempreviva 742', 1),
(2, 2, 2, 'Luis', 'Ruiz', '011-5000-2222', 'Calle Falsa 123', 1),
(3, NULL, 2, 'Marta', 'Lopez', '011-5000-3333', 'Av. Libertad 55', 2);

-- Tabla: carrito_items
INSERT INTO carrito_items (id_carrito, id_usuario, id_variante, cantidad) VALUES
(1, 1, 1, 2),
(2, 2, 2, 1),
(3, 3, 3, 1);

-- Tabla: direcciones
INSERT INTO direcciones (id_direccion, id_cliente, tipo_direccion, calle, numero, piso, departamento, localidad, provincia, codigo_postal, referencia) VALUES
(1, 1, 'DOMICILIO', 'Av. Siempreviva', '742', NULL, NULL, 'Centro', 'Buenos Aires', '1000', 'Casa baja'),
(2, 1, 'COMERCIO', 'Calle Comercio', '45', '2', 'A', 'Centro', 'Buenos Aires', '1001', 'Oficina'),
(3, 2, 'DOMICILIO', 'Calle Falsa', '123', NULL, NULL, 'Norte', 'Buenos Aires', '1002', 'Timbre rojo');

-- Tabla: veterinarios
INSERT INTO veterinarios (id_veterinario, id_empleado, especialidad) VALUES
(1, 1, 'Clinica general'),
(2, 2, 'Cirugia'),
(3, 3, 'Dermatologia');

-- Tabla: mascota
INSERT INTO mascota (id_mascota, id_cliente, nombre, id_especie, id_raza, sexo, fecha_nacimiento, peso, observaciones) VALUES
(1, 1, 'Firulais', 1, 1, 'MACHO', '2020-05-10', 25.50, 'Sin observaciones'),
(2, 1, 'Misu', 2, 2, 'HEMBRA', '2019-11-02', 4.20, NULL),
(3, 2, 'Rocky', 1, 1, 'MACHO', '2021-07-15', 18.00, 'Alergia a picaduras');

-- Tabla: pedidos
INSERT INTO pedidos (id_pedido, id_cliente, fecha, estado, subtotal, costo_envio, total) VALUES
(1, 1, '2026-01-15 10:30:00', 'PENDIENTE', 55000.00, 3000.00, 58000.00),
(2, 2, '2026-01-16 12:00:00', 'ENVIADO', 30000.00, 2500.00, 32500.00),
(3, 3, '2026-01-17 09:15:00', 'ENTREGADO', 45000.00, 3500.00, 48500.00);

-- Tabla: adopciones
INSERT INTO adopciones (id_adopcion, id_cliente, id_mascota_adopcion, fecha, estado, observacion) VALUES
(1, 1, 3, '2026-02-01', 'ADOPTADO', 'Adopcion confirmada'),
(2, 2, 1, '2026-02-05', 'EN ADOPCION', 'En proceso de conocimiento'),
(3, 3, 2, '2026-02-10', 'EN ADOPCION', 'Pendiente de visita');

-- Tabla: inventario
INSERT INTO inventario (id_inventario, id_variante, id_sucursal, stock_actual, stock_minimo) VALUES
(1, 1, 1, 10, 3),
(2, 2, 1, 5, 2),
(3, 3, 2, 0, 1);

-- Tabla: historial_medico
INSERT INTO historial_medico (id_historial, id_mascota, id_veterinario, fecha, motivo, diagnostico, observacion) VALUES
(1, 1, 1, '2026-01-10', 'Control anual', 'Sin novedades', 'Peso estable'),
(2, 2, 2, '2026-01-12', 'Vacunacion', 'Aplicada sin incidencias', 'Revisar en 30 dias'),
(3, 3, 3, '2026-01-14', 'Perdida de plumaje', 'Deficit nutricional', 'Ajustar dieta');

-- Tabla: tratamientos
INSERT INTO tratamientos (id_tratamiento, id_historial, medicamento, dosis, frecuencia, duracion) VALUES
(1, 1, 'Amoxicilina', '500 mg', 'Cada 12 horas', '7 dias'),
(2, 2, 'Antiparasitario', '1 comprimido', 'Unica dosis', '1 dia'),
(3, 3, 'Complejo vitaminico', '1 ml', 'Cada 24 horas', '14 dias');

-- Tabla: vacunas
INSERT INTO vacunas (id_vacuna, id_mascota, nombre, fecha_aplicacion, fecha_proxima, id_veterinario) VALUES
(1, 1, 'Antirrabica', '2026-01-20', '2027-01-20', 1),
(2, 2, 'Trivalente', '2026-01-21', '2027-01-21', 2),
(3, 3, 'Peste aviar', '2026-01-22', '2026-07-22', 3);

-- Tabla: turnos
INSERT INTO turnos (id_turno, id_cliente, id_mascota, id_servicio, id_sucursal, fecha, hora, motivo, estado, observaciones) VALUES
(1, 1, 1, 1, 1, '2026-02-15', '09:00:00', 'Control anual', 'CONFIRMADO', 'Primera consulta'),
(2, 1, 2, 2, 1, '2026-02-16', '10:30:00', 'Vacunacion', 'PENDIENTE', NULL),
(3, 2, 3, 3, 2, '2026-02-17', '15:00:00', 'Bano y corte', 'CANCELADO', 'Cliente dejo de asistir');

-- Tabla: detalle_pedidos
INSERT INTO detalle_pedidos (id_detalle_pedido, id_pedido, id_variante, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 2, 25000.00, 50000.00),
(2, 2, 2, 1, 30000.00, 30000.00),
(3, 3, 3, 1, 45000.00, 45000.00);

-- Tabla: pagos
INSERT INTO pagos (id_pago, id_pedido, metodo_pago, estado_pago) VALUES
(1, 1, 'EFECTIVO', 'REALIZADO'),
(2, 2, 'TRANSFERENCIA', 'REALIZADO'),
(3, 3, 'CREDITO', 'PENDIENTE');

-- Tabla: envios
INSERT INTO envios (id_envio, id_pedido, tipo_entrega, id_direccion, codigo_postal, fecha_estimada, fecha_entrega, estado) VALUES
(1, 1, 'DOMICILIO', 1, '1000', '2026-01-18', '2026-01-20', 'EN_CAMINO'),
(2, 2, 'SUCURSAL', 2, '1001', '2026-01-19', NULL, 'EN_CAMINO'),
(3, 3, 'PROGRAMADO', 3, '1002', '2026-01-20', '2026-01-21', 'ENTREGADO');
