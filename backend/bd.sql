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

CREATE TABLE marcas (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE atributos (
    id_atributo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL
);

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    categoria_padre INT,

    FOREIGN KEY (categoria_padre)
        REFERENCES categorias(id_categoria)
        ON DELETE CASCADE
);

/* ====================================================
   2. TABLAS DE PRIMER NIVEL DE DEPENDENCIA
   ==================================================== */

CREATE TABLE valores_atributo (
    id_valor INT AUTO_INCREMENT PRIMARY KEY,
    id_atributo INT NOT NULL,
    nombre VARCHAR(20) NOT NULL,

    FOREIGN KEY (id_atributo)
        REFERENCES atributos(id_atributo)
);

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

/* ====================================================
   3. TABLAS DE SEGUNDO NIVEL DE DEPENDENCIA
   ==================================================== */

CREATE TABLE productos_categorias (
    id_categoria INT,
    id_producto INT,

    PRIMARY KEY (id_categoria, id_producto),

    FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria),

    FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
);

CREATE TABLE variantes (
    id_variante INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    imagen VARCHAR(200),

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

CREATE TABLE variantes_atributos (
    id_variante INT,
    id_valor_atributo INT,

    PRIMARY KEY (id_variante, id_valor_atributo),

    FOREIGN KEY (id_variante)
        REFERENCES variantes(id_variante),

    FOREIGN KEY (id_valor_atributo)
        REFERENCES valores_atributo(id_valor)
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

CREATE TABLE inventario (
    id_inventario INT AUTO_INCREMENT PRIMARY KEY,
    id_variante INT,
    id_sucursal INT,
    stock_actual INT,
    stock_minimo INT,

    FOREIGN KEY (id_variante) REFERENCES variantes(id_variante),
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

/*
=============================
INSERT + TRUNCATE 
=============================
TRUNCATE: PARA REINICIAR LOS CONTADORES DE LAS TABLAS 
*/
-- ====================================================
-- SCRIPT DE DATOS DE PRUEBA (INSERTS) - VETERINARIA
-- ====================================================

USE veterinaria;

-- Desactivar temporalmente revisiones de claves foráneas para carga limpia
SET FOREIGN_KEY_CHECKS = 0;

-- Limpieza preventiva de tablas
TRUNCATE TABLE envios;
TRUNCATE TABLE pagos;
TRUNCATE TABLE detalle_pedidos;
TRUNCATE TABLE turnos;
TRUNCATE TABLE vacunas;
TRUNCATE TABLE tratamientos;
TRUNCATE TABLE historial_medico;
TRUNCATE TABLE adopciones;
TRUNCATE TABLE pedidos;
TRUNCATE TABLE inventario;
TRUNCATE TABLE mascota;
TRUNCATE TABLE veterinarios;
TRUNCATE TABLE direcciones;
TRUNCATE TABLE variantes_atributos;
TRUNCATE TABLE empleados;
TRUNCATE TABLE clientes;
TRUNCATE TABLE variantes;
TRUNCATE TABLE productos_categorias;
TRUNCATE TABLE mascotas_adopcion;
TRUNCATE TABLE productos;
TRUNCATE TABLE servicios;
TRUNCATE TABLE razas;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE rol_permiso;
TRUNCATE TABLE valores_atributo;
TRUNCATE TABLE categorias;
TRUNCATE TABLE atributos;
TRUNCATE TABLE marcas;
TRUNCATE TABLE categorias_servicios;
TRUNCATE TABLE especies;
TRUNCATE TABLE rol_usuario;
TRUNCATE TABLE rol_empleados;
TRUNCATE TABLE permisos;
TRUNCATE TABLE sucursales;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================
-- 1. TABLAS INDEPENDIENTES
-- ====================================================

-- 1.1 Sucursales
INSERT INTO sucursales (id_sucursal, nombre, direccion, localidad, telefono, horario, activo) VALUES
(1, 'Sucursal Central - Palermo', 'Av. Santa Fe 3200', 'Buenos Aires', '011-4555-0101', 'Lun-Sáb 08:00-20:00', TRUE),
(2, 'Sucursal Belgrano', 'Av. Cabildo 1500', 'Buenos Aires', '011-4555-0102', 'Lun-Sáb 09:00-19:00', TRUE),
(3, 'Sucursal San Isidro', 'Av. Centenario 450', 'San Isidro', '011-4555-0103', 'Lun-Vie 09:00-18:00', TRUE);

-- 1.2 Permisos
INSERT INTO permisos (id_permiso, nombre, descripcion) VALUES
(1, 'VER_DASHBOARD', 'Acceso al panel principal de métricas'),
(2, 'GESTIONAR_CLIENTES', 'Crear, editar y eliminar datos de clientes'),
(3, 'GESTIONAR_HISTORIAL', 'Acceso a la historia clínica veterinaria'),
(4, 'VENTAS_POS', 'Realizar cobros y facturación de productos'),
(5, 'ADMIN_SISTEMA', 'Control total del sistema y configuración');

-- 1.3 Roles de Empleados
INSERT INTO rol_empleados (id_rol_empleado, nombre) VALUES
(1, 'Veterinario Principal'),
(2, 'Asistente Veterinario'),
(3, 'Peluquero Canino'),
(4, 'Cajero/Recepcionista'),
(5, 'Gerente de Sucursal');

-- 1.4 Roles de Usuario (Sistema)
INSERT INTO rol_usuario (id_rol_usuario, nombre) VALUES
(1, 'Administrador'),
(2, 'Empleado'),
(3, 'Cliente');

-- 1.5 Especies
INSERT INTO especies (id_especie, nombre) VALUES
(1, 'Perro'),
(2, 'Gato'),
(3, 'Ave'),
(4, 'Roedor');

-- 1.6 Categorías de Servicios
INSERT INTO categorias_servicios (id_categoria_servicio, nombre) VALUES
(1, 'Consultas Médicas'),
(2, 'Vacunación y Desparasitación'),
(3, 'Cirugía y Quirófano'),
(4, 'Estética y Peluquería'),
(5, 'Estudios Diagnósticos');

-- 1.7 Marcas
INSERT INTO marcas (id_marca, nombre) VALUES
(1, 'Royal Canin'),
(2, 'Pro Plan'),
(3, 'Eukanuba'),
(4, 'Bravecto'),
(5, 'Kong');

-- 1.8 Atributos
INSERT INTO atributos (id_atributo, nombre) VALUES
(1, 'Peso / Contenido'),
(2, 'Sabor'),
(3, 'Color'),
(4, 'Tamaño');

-- 1.9 Categorías (Jerárquicas)
INSERT INTO categorias (id_categoria, nombre, categoria_padre) VALUES
(1, 'Alimentos', NULL),
(2, 'Alimento Seco Perro', 1),
(3, 'Alimento Seco Gato', 1),
(4, 'Salud y Farmacia', NULL),
(5, 'Antiparasitarios', 4),
(6, 'Juguetes y Accesorios', NULL);

-- ====================================================
-- 2. TABLAS DE PRIMER NIVEL DE DEPENDENCIA
-- ====================================================

-- 2.1 Valores de Atributo
INSERT INTO valores_atributo (id_valor, id_atributo, nombre) VALUES
(1, 1, '3 kg'),
(2, 1, '7.5 kg'),
(3, 1, '15 kg'),
(4, 2, 'Pollo y Arroz'),
(5, 2, 'Salmón'),
(6, 3, 'Rojo'),
(7, 3, 'Azul'),
(8, 4, 'Pequeño'),
(9, 4, 'Grande');

-- 2.2 Rol - Permiso
INSERT INTO rol_permiso (id_rol_usuario, id_permiso) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), -- Admin tiene todos los permisos
(2, 1), (2, 2), (2, 3), (2, 4),        -- Empleado
(3, 1);                                 -- Cliente

-- 2.3 Usuarios
INSERT INTO usuarios (id_usuario, username, password_hash, email, id_rol_usuario, activo) VALUES
(1, 'admin', '$2b$10$e8R...hash_admin', 'admin@veterinaria.com', 1, TRUE),
(2, 'vet_carlos', '$2b$10$e8R...hash_carlos', 'carlos.gomez@veterinaria.com', 2, TRUE),
(3, 'vet_laura', '$2b$10$e8R...hash_laura', 'laura.martinez@veterinaria.com', 2, TRUE),
(4, 'cliente_juan', '$2b$10$e8R...hash_juan', 'juan.perez@gmail.com', 3, TRUE),
(5, 'cliente_maria', '$2b$10$e8R...hash_maria', 'maria.lopez@hotmail.com', 3, TRUE);

-- 2.4 Razas
INSERT INTO razas (id_raza, nombre, id_especie) VALUES
(1, 'Labrador Retriever', 1),
(2, 'Caniche Toy', 1),
(3, 'Bulldog Francés', 1),
(4, 'Siames', 2),
(5, 'Persa', 2),
(6, 'Mestizo', 1),
(7, 'Mestizo', 2);

-- 2.5 Servicios
INSERT INTO servicios (id_servicio, nombre, descripcion, id_categoria_servicio, precio, activo) VALUES
(1, 'Consulta General', 'Examen físico completo e historia clínica', 1, 15000.00, TRUE),
(2, 'Vacuna Antirrábica', 'Aplicación de dosis e informe oficial', 2, 8500.00, TRUE),
(3, 'Corte y Baño Canino completo', 'Baño, secado, deslanado y corte higiénico', 4, 12000.00, TRUE),
(4, 'Ecografía Abdominal', 'Estudio diagnóstico por imágenes', 5, 22000.00, TRUE),
(5, 'Castración / Esterilización', 'Cirugía ambulatoria programada', 3, 45000.00, TRUE);

-- 2.6 Productos
INSERT INTO productos (id_producto, id_marca, nombre, descripcion, activo, descuento) VALUES
(1, 1, 'Royal Canin Medium Adult', 'Alimento balanceado para perros adultos de raza mediana', TRUE, 10),
(2, 2, 'Pro Plan Sterilized Cat', 'Alimento para gatos castrados con fórmula urinary', TRUE, 0),
(3, 4, 'Bravecto Comprimido Masticable', 'Antiparasitario interno y externo efecto 12 semanas', TRUE, 5),
(4, 5, 'Kong Classic Juguete Interactivo', 'Juguete de caucho natural irrompible para morder', TRUE, 0);

-- 2.7 Mascotas en Adopción
INSERT INTO mascotas_adopcion (id_mascota_adopcion, nombre, id_especie, edad, sexo, descripcion, estado) VALUES
(1, 'Rocko', 1, '2 años', 'MACHO', 'Perro rescatado, muy sociable y entrenado.', 'EN_ADOPCION'),
(2, 'Luna', 2, '5 meses', 'HEMBRA', 'Gatita juguetona, desparasitada y vacunada.', 'EN_ADOPCION'),
(3, 'Milo', 1, '1 año', 'MACHO', 'Mestizo tamaño mediano, castrado.', 'ADOPTADO');

-- ====================================================
-- 3. TABLAS DE SEGUNDO NIVEL DE DEPENDENCIA
-- ====================================================

-- 3.1 Productos Categorías (M:N)
INSERT INTO productos_categorias (id_categoria, id_producto) VALUES
(1, 1), (2, 1),
(1, 2), (3, 2),
(4, 3), (5, 3),
(6, 4);

-- 3.2 Variantes de Producto
INSERT INTO variantes (id_variante, id_producto, precio, stock, imagen) VALUES
(1, 1, 35000.00, 20, 'royal_medium_3kg.jpg'),
(2, 1, 78000.00, 15, 'royal_medium_15kg.jpg'),
(3, 2, 28000.00, 10, 'proplan_cat_3kg.jpg'),
(4, 3, 22000.00, 30, 'bravecto_perro_med.jpg'),
(5, 4, 15000.00, 25, 'kong_classic_red.jpg');

-- 3.3 Clientes
INSERT INTO clientes (id_cliente, id_usuario, nombre, apellido, telefono, estado) VALUES
(1, 4, 'Juan', 'Pérez', '1144332211', TRUE),
(2, 5, 'María', 'López', '1155667788', TRUE),
(3, NULL, 'Carlos', 'Giménez', '1122334455', TRUE);

-- 3.4 Empleados
INSERT INTO empleados (id_empleado, id_usuario, id_rol_empleado, nombre, apellido, telefono, direccion, id_sucursal) VALUES
(1, 2, 1, 'Dr. Carlos', 'Gómez', '1199887766', 'Calle Falsa 123', 1),
(2, 3, 1, 'Dra. Laura', 'Martínez', '1188776655', 'Av. Siempreviva 742', 2),
(3, NULL, 4, 'Sofía', 'Rodríguez', '1177665544', 'Mitre 450', 1);

-- ====================================================
-- 4. TABLAS DE TERCER NIVEL DE DEPENDENCIA
-- ====================================================

-- 4.1 Variantes Atributos
INSERT INTO variantes_atributos (id_variante, id_valor_atributo) VALUES
(1, 1), -- 3 kg
(2, 3), -- 15 kg
(3, 1), -- 3 kg
(4, 8), -- Pequeño
(5, 6); -- Rojo

-- 4.2 Direcciones de Clientes
INSERT INTO direcciones (id_direccion, id_cliente, tipo_direccion, calle, numero, piso, departamento, localidad, provincia, codigo_postal, referencia) VALUES
(1, 1, 'DOMICILIO', 'Av. Corrientes', '2500', '4', 'B', 'Buenos Aires', 'CABA', 'C1046', 'Entre Paso y Larrea'),
(2, 2, 'DOMICILIO', 'Juramento', '1820', NULL, NULL, 'Buenos Aires', 'CABA', 'C1428', 'Frente a la plaza');

-- 4.3 Veterinarios
INSERT INTO veterinarios (id_veterinario, id_empleado, especialidad) VALUES
(1, 1, 'Cirugía General y Traumatología'),
(2, 2, 'Dermatología y Nutrición');

-- 4.4 Mascotas
INSERT INTO mascota (id_mascota, id_cliente, nombre, id_especie, id_raza, sexo, fecha_nacimiento, peso, observaciones) VALUES
(1, 1, 'Thor', 1, 1, 'MACHO', '2021-05-10', 28.50, 'Alérgico a la penicilina'),
(2, 1, 'Cleo', 2, 4, 'HEMBRA', '2022-09-15', 3.80, 'Gata castrada de interior'),
(3, 2, 'Toby', 1, 2, 'MACHO', '2020-01-20', 6.20, 'Atención especial al corte de uñas');

-- 4.5 Inventario por Sucursal
INSERT INTO inventario (id_inventario, id_variante, id_sucursal, stock_actual, stock_minimo) VALUES
(1, 1, 1, 10, 3),
(2, 1, 2, 5, 2),
(3, 2, 1, 8, 2),
(4, 3, 1, 6, 2),
(5, 4, 1, 15, 5);

-- 4.6 Pedidos
INSERT INTO pedidos (id_pedido, id_cliente, fecha, estado, subtotal, costo_envio, total) VALUES
(1, 1, '2026-03-01 10:30:00', 'ENTREGADO', 35000.00, 2500.00, 37500.00),
(2, 2, '2026-03-10 16:15:00', 'PREPARANDO', 22000.00, 0.00, 22000.00);

-- 4.7 Adopciones
INSERT INTO adopciones (id_adopcion, id_cliente, id_mascota_adopcion, fecha, estado, observacion) VALUES
(1, 2, 3, '2026-02-14', 'APROBADO', 'Adopción completada con seguimiento ambiental positivo.');

-- ====================================================
-- 5. TABLAS DE CUARTO Y QUINTO NIVEL (Operativas)
-- ====================================================

-- 5.1 Historial Médico
INSERT INTO historial_medico (id_historial, id_mascota, id_veterinario, fecha, motivo, diagnostico, observacion) VALUES
(1, 1, 1, '2026-01-15', 'Control anual y vacuna', 'Paciente saludable', 'Se sugiere control de peso en 6 meses'),
(2, 2, 2, '2026-02-02', 'Prurito en orejas', 'Otitis externa leve', 'Iniciar gotas óticas por 7 días');

-- 5.2 Tratamientos
INSERT INTO tratamientos (id_tratamiento, id_historial, medicamento, dosis, frecuencia, duracion) VALUES
(1, 2, 'Otomax Gotas Óticas', '4 gotas por oído', 'Cada 12 horas', '7 días');

-- 5.3 Vacunas
INSERT INTO vacunas (id_vacuna, id_mascota, nombre, fecha_aplicacion, fecha_proxima, id_veterinario) VALUES
(1, 1, 'Sextuple Canina', '2026-01-15', '2027-01-15', 1),
(2, 1, 'Antirrábica', '2026-01-15', '2027-01-15', 1);

-- 5.4 Turnos
INSERT INTO turnos (id_turno, id_cliente, id_mascota, id_servicio, id_sucursal, fecha, hora, motivo, estado, observaciones, fecha_creacion) VALUES
(1, 1, 1, 1, 1, '2026-03-20', '10:00:00', 'Chequeo general preventivo', 'CONFIRMADO', 'Cliente puntual', NOW()),
(2, 2, 3, 3, 2, '2026-03-22', '15:30:00', 'Peluquería y baño de temporada', 'PENDIENTE', NULL, NOW());

-- 5.5 Detalle de Pedidos
INSERT INTO detalle_pedidos (id_detalle_pedido, id_pedido, id_variante, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 1, 1, 35000.00, 35000.00),
(2, 2, 4, 1, 22000.00, 22000.00);

-- 5.6 Pagos
INSERT INTO pagos (id_pago, id_pedido, metodo_pago, estado_pago) VALUES
(1, 1, 'CREDITO', 'REALIZADO'),
(2, 2, 'TRANSFERENCIA', 'PENDIENTE');

-- 5.7 Envíos
INSERT INTO envios (id_envio, id_pedido, tipo_entrega, id_direccion, codigo_postal, fecha_estimada, fecha_entrega, estado) VALUES
(1, 1, 'DOMICILIO', 1, 'C1046', '2026-03-02', '2026-03-02', 'ENTREGADO'),
(2, 2, 'DOMICILIO', 2, 'C1428', '2026-03-12', NULL, 'EN_CAMINO');