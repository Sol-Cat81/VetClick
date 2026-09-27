const conexion = require('../config/database');
const bcrypt = require('bcryptjs');

const consultasOpciones = {
  clientes: `SELECT id_cliente AS id, CONCAT(nombre, ' ', apellido, ' (ID: ', id_cliente, ')') AS etiqueta FROM clientes ORDER BY nombre, apellido`,
  mascotas: `SELECT id_mascota AS id, CONCAT(nombre, ' (ID: ', id_mascota, ')') AS etiqueta, id_cliente FROM mascota ORDER BY nombre`,
  especies: `SELECT id_especie AS id, CONCAT(nombre, ' (ID: ', id_especie, ')') AS etiqueta FROM especies ORDER BY nombre`,
  razas: `SELECT id_raza AS id, CONCAT(r.nombre, ' - ', COALESCE(e.nombre, 'Sin especie'), ' (ID: ', r.id_raza, ')') AS etiqueta, r.id_especie FROM razas r LEFT JOIN especies e ON e.id_especie = r.id_especie ORDER BY r.nombre`,
  servicios: `SELECT id_servicio AS id, CONCAT(nombre, ' (ID: ', id_servicio, ')') AS etiqueta FROM servicios WHERE activo = TRUE ORDER BY nombre`,
  sucursales: `SELECT id_sucursal AS id, CONCAT(nombre, ' (ID: ', id_sucursal, ')') AS etiqueta FROM sucursales ORDER BY nombre`,
  veterinarios: `SELECT v.id_veterinario AS id, CONCAT(e.nombre, ' ', e.apellido, ' (ID: ', v.id_veterinario, ')') AS etiqueta FROM veterinarios v JOIN empleados e ON e.id_empleado = v.id_empleado ORDER BY e.nombre, e.apellido`,
  historiales: `SELECT h.id_historial AS id, CONCAT(m.nombre, ' - ', h.fecha, ' (ID: ', h.id_historial, ')') AS etiqueta FROM historial_medico h JOIN mascota m ON m.id_mascota = h.id_mascota ORDER BY h.fecha DESC`,
  categorias: `SELECT id_categoria AS id, CONCAT(nombre, ' (ID: ', id_categoria, ')') AS etiqueta FROM categorias ORDER BY nombre`,
  marcas: `SELECT id_marca AS id, CONCAT(nombre, ' (ID: ', id_marca, ')') AS etiqueta FROM marcas ORDER BY nombre`,
  productos: `SELECT id_producto AS id, CONCAT(nombre, ' (ID: ', id_producto, ')') AS etiqueta FROM productos ORDER BY nombre`,
  variantes: `SELECT v.id_variante AS id, CONCAT(p.nombre, ' - variante ', v.id_variante, ' (ID: ', v.id_variante, ')') AS etiqueta, v.id_producto FROM variantes v JOIN productos p ON p.id_producto = v.id_producto ORDER BY p.nombre`,
  valoresAtributo: `SELECT va.id_valor AS id, CONCAT(a.nombre, ': ', va.nombre, ' (ID: ', va.id_valor, ')') AS etiqueta FROM valores_atributo va JOIN atributos a ON a.id_atributo = va.id_atributo ORDER BY a.nombre, va.nombre`,
  pedidos: `SELECT id_pedido AS id, CONCAT('Pedido ', id_pedido, ' (ID: ', id_pedido, ')') AS etiqueta FROM pedidos ORDER BY id_pedido DESC`,
  direcciones: `SELECT d.id_direccion AS id, CONCAT(c.nombre, ' ', c.apellido, ' - ', d.calle, ', ', d.localidad, ' (ID: ', d.id_direccion, ')') AS etiqueta, d.id_cliente FROM direcciones d JOIN clientes c ON c.id_cliente = d.id_cliente ORDER BY c.nombre`,
  rolesEmpleados: `SELECT id_rol_empleado AS id, CONCAT(nombre, ' (ID: ', id_rol_empleado, ')') AS etiqueta FROM rol_empleados ORDER BY nombre`,
  rolesUsuario: `SELECT id_rol_usuario AS id, CONCAT(nombre, ' (ID: ', id_rol_usuario, ')') AS etiqueta FROM rol_usuario ORDER BY nombre`,
  empleados: `SELECT e.id_empleado AS id, CONCAT(e.nombre, ' ', e.apellido, ' (ID: ', e.id_empleado, ')') AS etiqueta FROM empleados e ORDER BY e.nombre`,
  usuarios: `SELECT id_usuario AS id, CONCAT(username, ' (ID: ', id_usuario, ')') AS etiqueta FROM usuarios ORDER BY username`,
  categoriasServicios: `SELECT id_categoria_servicio AS id, CONCAT(nombre, ' (ID: ', id_categoria_servicio, ')') AS etiqueta FROM categorias_servicios ORDER BY nombre`,
  atributos: `SELECT id_atributo AS id, CONCAT(nombre, ' (ID: ', id_atributo, ')') AS etiqueta FROM atributos ORDER BY nombre`,
  mascotasAdopcion: `SELECT id_mascota_adopcion AS id, CONCAT(nombre, ' (ID: ', id_mascota_adopcion, ')') AS etiqueta FROM mascotas_adopcion ORDER BY nombre`,
  permisos: `SELECT id_permiso AS id, CONCAT(nombre, ' (ID: ', id_permiso, ')') AS etiqueta FROM permisos ORDER BY nombre`
};

const inserciones = {
  permiso: {
    tabla: 'permisos',
    campos: ['nombre', 'descripcion'],
    requeridos: ['nombre']
  },
  rolUsuario: {
    tabla: 'rol_usuario',
    campos: ['nombre'],
    requeridos: ['nombre']
  },
  rolPermiso: {
    tabla: 'rol_permiso',
    campos: ['id_rol_usuario', 'id_permiso'],
    requeridos: ['id_rol_usuario', 'id_permiso']
  },
  especie: {
    tabla: 'especies',
    campos: ['nombre'],
    requeridos: ['nombre']
  },
  categoriaServicio: {
    tabla: 'categorias_servicios',
    campos: ['nombre'],
    requeridos: ['nombre']
  },
  atributo: {
    tabla: 'atributos',
    campos: ['nombre'],
    requeridos: ['nombre']
  },
  valorAtributo: {
    tabla: 'valores_atributo',
    campos: ['id_atributo', 'nombre'],
    requeridos: ['id_atributo', 'nombre']
  },
  raza: {
    tabla: 'razas',
    campos: ['nombre', 'id_especie'],
    requeridos: ['nombre', 'id_especie']
  },
  servicio: {
    tabla: 'servicios',
    campos: ['nombre', 'descripcion', 'id_categoria_servicio', 'precio', 'activo'],
    requeridos: ['nombre']
  },
  mascotaAdopcion: {
    tabla: 'mascotas_adopcion',
    campos: ['nombre', 'id_especie', 'edad', 'sexo', 'descripcion', 'estado'],
    requeridos: ['nombre', 'sexo', 'estado']
  },
  productoCategoria: {
    tabla: 'productos_categorias',
    campos: ['id_categoria', 'id_producto'],
    requeridos: ['id_categoria', 'id_producto']
  },
  varianteAtributo: {
    tabla: 'variantes_atributos',
    campos: ['id_variante', 'id_valor_atributo'],
    requeridos: ['id_variante', 'id_valor_atributo']
  },
  detallePedido: {
    tabla: 'detalle_pedidos',
    campos: ['id_pedido', 'id_variante', 'cantidad', 'precio_unitario', 'subtotal'],
    requeridos: ['id_pedido', 'id_variante', 'cantidad', 'precio_unitario', 'subtotal']
  },
  adopcion: {
    tabla: 'adopciones',
    campos: ['id_cliente', 'id_mascota_adopcion', 'fecha', 'estado', 'observacion'],
    requeridos: ['id_cliente', 'id_mascota_adopcion', 'fecha']
  },
  direccion: {
    tabla: 'direcciones',
    campos: ['id_cliente', 'tipo_direccion', 'calle', 'numero', 'piso', 'departamento', 'localidad', 'provincia', 'codigo_postal', 'referencia'],
    requeridos: ['id_cliente', 'tipo_direccion', 'calle']
  },
  turno: {
    tabla: 'turnos',
    campos: ['id_cliente', 'id_mascota', 'id_servicio', 'id_sucursal', 'fecha', 'hora', 'motivo', 'estado', 'observaciones'],
    requeridos: ['id_mascota', 'id_servicio', 'fecha', 'hora']
  },
  historial: {
    tabla: 'historial_medico',
    campos: ['id_mascota', 'id_veterinario', 'fecha', 'motivo', 'diagnostico', 'observacion'],
    requeridos: ['id_mascota', 'id_veterinario']
  },
  tratamiento: {
    tabla: 'tratamientos',
    campos: ['id_historial', 'medicamento', 'dosis', 'frecuencia', 'duracion'],
    requeridos: ['id_historial', 'medicamento']
  },
  vacuna: {
    tabla: 'vacunas',
    campos: ['id_mascota', 'nombre', 'fecha_aplicacion', 'fecha_proxima', 'id_veterinario'],
    requeridos: ['id_mascota', 'nombre']
  },
  categoria: {
    tabla: 'categorias',
    campos: ['nombre', 'categoria_padre'],
    requeridos: ['nombre']
  },
  marca: {
    tabla: 'marcas',
    campos: ['nombre'],
    requeridos: ['nombre']
  },
  variante: {
    tabla: 'variantes',
    campos: ['id_producto', 'precio', 'stock'],
    requeridos: ['id_producto', 'precio'],
    atributo: true
  },
  pedido: {
    tabla: 'pedidos',
    campos: ['id_cliente', 'fecha', 'estado', 'subtotal', 'costo_envio', 'total'],
    requeridos: ['id_cliente', 'id_variante', 'cantidad'],
    detalle: true
  },
  pago: {
    tabla: 'pagos',
    campos: ['id_pedido', 'metodo_pago', 'estado_pago'],
    requeridos: ['id_pedido', 'metodo_pago']
  },
  envio: {
    tabla: 'envios',
    campos: ['id_pedido', 'tipo_entrega', 'id_direccion', 'codigo_postal', 'fecha_estimada', 'estado'],
    requeridos: ['id_pedido', 'tipo_entrega']
  },
  empleado: {
    tabla: 'empleados',
    campos: ['nombre', 'apellido', 'id_rol_empleado', 'telefono', 'direccion', 'id_sucursal', 'id_usuario'],
    requeridos: ['nombre', 'apellido', 'id_rol_empleado']
  },
  veterinario: {
    tabla: 'veterinarios',
    campos: ['id_empleado', 'especialidad'],
    requeridos: ['id_empleado']
  },
  rol: {
    tabla: 'rol_empleados',
    campos: ['nombre'],
    requeridos: ['nombre']
  },
  stock: {
    tabla: 'inventario',
    campos: ['id_variante', 'id_sucursal', 'stock_actual', 'stock_minimo'],
    requeridos: ['id_variante', 'id_sucursal', 'stock_actual']
  },
  sucursal: {
    tabla: 'sucursales',
    campos: ['nombre', 'direccion', 'localidad', 'telefono', 'horario', 'activo'],
    requeridos: ['nombre']
  }
};

const convertirBooleano = valor => valor === true || valor === 'true' || valor === '1';

const AdminModel = {
  async obtenerOpciones() {
    const entradas = await Promise.all(
      Object.entries(consultasOpciones).map(async ([clave, consulta]) => {
        const [rows] = await conexion.query(consulta);
        return [clave, rows];
      })
    );
    return Object.fromEntries(entradas);
  },

  async crear(entidad, datos) {
    datos = { ...datos };
    if (entidad === 'usuario') {
      const nombre = String(datos.username ?? '').trim();
      const email = String(datos.email ?? '').trim();
      const password = String(datos.password ?? '');
      const idRol = Number(datos.id_rol_usuario);
      if (!nombre || !email || password.length < 8 || !Number.isInteger(idRol) || idRol <= 0) {
        const error = new Error('Usuario, email, contraseña de al menos 8 caracteres y rol son obligatorios');
        error.status = 400;
        throw error;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const error = new Error('El email no tiene un formato válido');
        error.status = 400;
        throw error;
      }
      const hash = await bcrypt.hash(password, 10);
      const [resultado] = await conexion.query(
        'INSERT INTO usuarios (username, password_hash, email, id_rol_usuario, activo) VALUES (?, ?, ?, ?, ?)',
        [nombre, hash, email, idRol, datos.activo === undefined ? true : convertirBooleano(datos.activo)]
      );
      return resultado;
    }

    const configuracion = inserciones[entidad];
    if (!configuracion) {
      const error = new Error('No existe un formulario de creación para esta entidad');
      error.status = 404;
      throw error;
    }

    const valoresPorDefecto = {
      turno: { estado: 'PENDIENTE' },
      variante: { stock: 0 },
      pedido: { estado: 'PENDIENTE', costo_envio: 0 },
      pago: { estado_pago: 'PENDIENTE' },
      envio: { estado: 'EN_CAMINO' },
      sucursal: { activo: true },
      stock: { stock_minimo: 0 }
    };
    datos = { ...(valoresPorDefecto[entidad] || {}), ...datos };

    for (const campo of configuracion.requeridos) {
      const valor = datos[campo];
      if (valor === undefined || valor === null || String(valor).trim() === '') {
        const error = new Error(`El campo ${campo} es obligatorio`);
        error.status = 400;
        throw error;
      }
    }

    if (entidad === 'turno' && datos.id_cliente && datos.id_mascota) {
      const [mascotas] = await conexion.query(
        'SELECT id_cliente FROM mascota WHERE id_mascota = ?',
        [Number(datos.id_mascota)]
      );
      if (!mascotas.length || Number(mascotas[0].id_cliente) !== Number(datos.id_cliente)) {
        const error = new Error('El cliente seleccionado no es propietario de la mascota');
        error.status = 400;
        throw error;
      }
    }

    if (entidad === 'envio' && datos.id_direccion) {
      const [direcciones] = await conexion.query(
        `SELECT d.id_cliente FROM direcciones d
         JOIN pedidos p ON p.id_cliente = d.id_cliente
         WHERE d.id_direccion = ? AND p.id_pedido = ?`,
        [Number(datos.id_direccion), Number(datos.id_pedido)]
      );
      if (!direcciones.length) {
        const error = new Error('La dirección debe pertenecer al cliente del pedido');
        error.status = 400;
        throw error;
      }
    }

    const enumeraciones = {
      turno: { estado: ['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'FINALIZADO'] },
      pedido: { estado: ['PENDIENTE', 'PREPARANDO', 'ENVIADO', 'ENTREGADO'] },
      pago: {
        metodo_pago: ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'],
        estado_pago: ['PENDIENTE', 'REALIZADO']
      },
      envio: {
        tipo_entrega: ['DOMICILIO', 'SUCURSAL', 'PROGRAMADO'],
        estado: ['EN_CAMINO', 'ENTREGADO']
      }
    };
    for (const [campo, opciones] of Object.entries(enumeraciones[entidad] || {})) {
      if (datos[campo] && !opciones.includes(String(datos[campo]).toUpperCase())) {
        const error = new Error(`El valor de ${campo} no es válido`);
        error.status = 400;
        throw error;
      }
      if (datos[campo]) datos[campo] = String(datos[campo]).toUpperCase();
    }

    if (configuracion.atributo && datos.id_valor_atributo) {
      const idValor = Number(datos.id_valor_atributo);
      if (!Number.isInteger(idValor) || idValor <= 0) {
        const error = new Error('El atributo seleccionado no es válido');
        error.status = 400;
        throw error;
      }
      datos.id_valor_atributo = idValor;
    }

    const valores = configuracion.campos.map(campo => {
      const valor = datos[campo];
      if (valor === undefined || valor === '') return null;
      if (campo === 'activo') return convertirBooleano(valor);
      if (campo.startsWith('id_') || ['categoria_padre', 'cantidad'].includes(campo)) {
        const numero = Number(valor);
        if (!Number.isInteger(numero) || numero <= 0) {
          const error = new Error(`El campo ${campo} debe ser un entero positivo`);
          error.status = 400;
          throw error;
        }
        return numero;
      }
      if (['precio', 'stock', 'stock_actual', 'stock_minimo', 'subtotal', 'costo_envio', 'total'].includes(campo)) {
        const numero = Number(valor);
        if (!Number.isFinite(numero) || numero < 0
          || (['stock', 'stock_actual', 'stock_minimo'].includes(campo) && !Number.isInteger(numero))) {
          const error = new Error(`El campo ${campo} debe ser un entero no negativo o un importe válido`);
          error.status = 400;
          throw error;
        }
        return numero;
      }
      if (campo === 'fecha' && typeof valor === 'string' && valor.includes('T')) {
        return valor.replace('T', ' ');
      }
      return typeof valor === 'string' ? valor.trim() : valor;
    });
    const columnas = configuracion.campos.map(campo => `\`${campo}\``).join(', ');
    const placeholders = configuracion.campos.map(() => '?').join(', ');

    if (!configuracion.atributo && !configuracion.detalle) {
      const [resultado] = await conexion.query(
        `INSERT INTO \`${configuracion.tabla}\` (${columnas}) VALUES (${placeholders})`,
        valores
      );
      return resultado;
    }

    if (configuracion.atributo && !datos.id_valor_atributo) {
      const [resultado] = await conexion.query(
        `INSERT INTO \`${configuracion.tabla}\` (${columnas}) VALUES (${placeholders})`,
        valores
      );
      return resultado;
    }

    const conexionTransaccion = await conexion.getConnection();
    try {
      await conexionTransaccion.beginTransaction();
      let resultado;
      if (configuracion.detalle) {
        const idVariante = Number(datos.id_variante);
        if (!Number.isInteger(idVariante) || idVariante <= 0) {
          const error = new Error('Debe seleccionar una variante válida para el pedido');
          error.status = 400;
          throw error;
        }
        const [variantes] = await conexionTransaccion.query(
          'SELECT precio FROM variantes WHERE id_variante = ?',
          [idVariante]
        );
        if (!variantes.length) {
          const error = new Error('La variante seleccionada no existe');
          error.status = 400;
          throw error;
        }
        const cantidad = Number(datos.cantidad);
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          const error = new Error('La cantidad del pedido debe ser un entero mayor que cero');
          error.status = 400;
          throw error;
        }
        const precio = Number(variantes[0].precio);
        const subtotal = precio * cantidad;
        const indiceSubtotal = configuracion.campos.indexOf('subtotal');
        const indiceTotal = configuracion.campos.indexOf('total');
        const costoEnvio = Number(datos.costo_envio || 0);
        valores[indiceSubtotal] = subtotal;
        valores[indiceTotal] = subtotal + costoEnvio;
        const [pedido] = await conexionTransaccion.query(
          `INSERT INTO \`${configuracion.tabla}\` (${columnas}) VALUES (${placeholders})`,
          valores
        );
        resultado = pedido;
        await conexionTransaccion.query(
          `INSERT INTO detalle_pedidos (id_pedido, id_variante, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [pedido.insertId, idVariante, cantidad, precio, subtotal]
        );
      } else {
        const [variante] = await conexionTransaccion.query(
          `INSERT INTO \`${configuracion.tabla}\` (${columnas}) VALUES (${placeholders})`,
          valores
        );
        resultado = variante;
        await conexionTransaccion.query(
          'INSERT INTO variantes_atributos (id_variante, id_valor_atributo) VALUES (?, ?)',
          [variante.insertId, Number(datos.id_valor_atributo)]
        );
      }
      await conexionTransaccion.commit();
      return resultado;
    } catch (error) {
      await conexionTransaccion.rollback();
      throw error;
    } finally {
      conexionTransaccion.release();
    }
  }
};

module.exports = AdminModel;
