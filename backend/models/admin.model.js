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
    clave: 'id_permiso',
    campos: ['nombre', 'descripcion'],
    requeridos: ['nombre']
  },
  rolUsuario: {
    tabla: 'rol_usuario',
    clave: 'id_rol_usuario',
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
    clave: 'id_especie',
    campos: ['nombre'],
    requeridos: ['nombre']
  },
  categoriaServicio: {
    tabla: 'categorias_servicios',
    clave: 'id_categoria_servicio',
    campos: ['nombre'],
    requeridos: ['nombre']
  },
  atributo: {
    tabla: 'atributos',
    clave: 'id_atributo',
    campos: ['nombre'],
    requeridos: ['nombre']
  },
  valorAtributo: {
    tabla: 'valores_atributo',
    clave: 'id_valor',
    campos: ['id_atributo', 'nombre'],
    requeridos: ['id_atributo', 'nombre']
  },
  raza: {
    tabla: 'razas',
    clave: 'id_raza',
    campos: ['nombre', 'id_especie'],
    requeridos: ['nombre', 'id_especie']
  },
  servicio: {
    tabla: 'servicios',
    clave: 'id_servicio',
    campos: ['nombre', 'descripcion', 'id_categoria_servicio', 'precio', 'activo'],
    requeridos: ['nombre']
  },
  mascotaAdopcion: {
    tabla: 'mascotas_adopcion',
    clave: 'id_mascota_adopcion',
    campos: ['nombre', 'id_especie', 'edad', 'sexo', 'descripcion', 'estado'],
    requeridos: ['nombre', 'sexo', 'estado']
  },
  productoCategoria: {
    tabla: 'productos_categorias',
    campos: ['id_categoria', 'id_producto'],
    requeridos: ['id_categoria', 'id_producto']
  },
  detallePedido: {
    tabla: 'detalle_pedidos',
    campos: ['id_pedido', 'id_variante', 'cantidad', 'precio_unitario', 'subtotal'],
    requeridos: ['id_pedido', 'id_variante', 'cantidad', 'precio_unitario', 'subtotal']
  },
  adopcion: {
    tabla: 'adopciones',
    clave: 'id_adopcion',
    campos: ['id_cliente', 'id_mascota_adopcion', 'fecha', 'estado', 'observacion'],
    requeridos: ['id_cliente', 'id_mascota_adopcion', 'fecha']
  },
  direccion: {
    tabla: 'direcciones',
    clave: 'id_direccion',
    campos: ['id_cliente', 'tipo_direccion', 'calle', 'numero', 'piso', 'departamento', 'localidad', 'provincia', 'codigo_postal', 'referencia'],
    requeridos: ['id_cliente', 'tipo_direccion', 'calle']
  },
  turno: {
    tabla: 'turnos',
    clave: 'id_turno',
    campos: ['id_cliente', 'id_mascota', 'id_servicio', 'id_sucursal', 'fecha', 'hora', 'motivo', 'estado', 'observaciones'],
    requeridos: ['id_mascota', 'id_servicio', 'fecha', 'hora']
  },
  historial: {
    tabla: 'historial_medico',
    clave: 'id_historial',
    campos: ['id_mascota', 'id_veterinario', 'fecha', 'motivo', 'diagnostico', 'observacion'],
    requeridos: ['id_mascota', 'id_veterinario']
  },
  tratamiento: {
    tabla: 'tratamientos',
    clave: 'id_tratamiento',
    campos: ['id_historial', 'medicamento', 'dosis', 'frecuencia', 'duracion'],
    requeridos: ['id_historial', 'medicamento']
  },
  vacuna: {
    tabla: 'vacunas',
    clave: 'id_vacuna',
    campos: ['id_mascota', 'nombre', 'fecha_aplicacion', 'fecha_proxima', 'id_veterinario'],
    requeridos: ['id_mascota', 'nombre']
  },
  categoria: {
    tabla: 'categorias',
    clave: 'id_categoria',
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
    clave: 'id_variante',
    campos: ['id_producto', 'precio', 'id_valor_atributo'],
    requeridos: ['id_producto', 'precio']
  },
  pedido: {
    tabla: 'pedidos',
    campos: ['id_cliente', 'fecha', 'estado', 'subtotal', 'costo_envio', 'total'],
    requeridos: ['id_cliente', 'id_variante', 'cantidad'],
    detalle: true
  },
  pago: {
    tabla: 'pagos',
    clave: 'id_pago',
    campos: ['id_pedido', 'metodo_pago', 'estado_pago'],
    requeridos: ['id_pedido', 'metodo_pago']
  },
  envio: {
    tabla: 'envios',
    clave: 'id_envio',
    campos: ['id_pedido', 'tipo_entrega', 'id_direccion', 'codigo_postal', 'fecha_estimada', 'fecha_entrega', 'estado'],
    requeridos: ['id_pedido', 'tipo_entrega']
  },
  empleado: {
    tabla: 'empleados',
    clave: 'id_empleado',
    campos: ['nombre', 'apellido', 'id_rol_empleado', 'telefono', 'direccion', 'id_sucursal', 'id_usuario'],
    requeridos: ['nombre', 'apellido', 'id_rol_empleado']
  },
  veterinario: {
    tabla: 'veterinarios',
    clave: 'id_veterinario',
    campos: ['id_empleado', 'especialidad'],
    requeridos: ['id_empleado']
  },
  rol: {
    tabla: 'rol_empleados',
    clave: 'id_rol_empleado',
    campos: ['nombre'],
    requeridos: ['nombre']
  },
  stock: {
    tabla: 'inventario',
    clave: 'id_inventario',
    campos: ['id_variante', 'id_sucursal', 'stock_actual', 'stock_minimo'],
    requeridos: ['id_variante', 'id_sucursal', 'stock_actual']
  },
  sucursal: {
    tabla: 'sucursales',
    clave: 'id_sucursal',
    campos: ['nombre', 'direccion', 'localidad', 'telefono', 'horario', 'activo'],
    requeridos: ['nombre']
  }
};

const convertirBooleano = valor => valor === true || valor === 'true' || valor === '1';

// Normaliza y valida un valor según su tipo de columna. La comparten crear() y
// actualizar() para que un INSERT y un PUT apliquen exactamente las mismas reglas.
const normalizarValor = (campo, valor) => {
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
};

// Tablas padre contra las que se valida cada clave foránea. La comparten
// crear() y actualizar() para que un INSERT y un PUT apliquen la misma regla.
const referencias = {
  empleado: [
    { campo: 'id_rol_empleado', tabla: 'rol_empleados', clave: 'id_rol_empleado' },
    { campo: 'id_sucursal', tabla: 'sucursales', clave: 'id_sucursal' },
    { campo: 'id_usuario', tabla: 'usuarios', clave: 'id_usuario' }
  ],
  veterinario: [{ campo: 'id_empleado', tabla: 'empleados', clave: 'id_empleado' }],
  usuario: [{ campo: 'id_rol_usuario', tabla: 'rol_usuario', clave: 'id_rol_usuario' }],
  raza: [{ campo: 'id_especie', tabla: 'especies', clave: 'id_especie' }],
  mascotaAdopcion: [{ campo: 'id_especie', tabla: 'especies', clave: 'id_especie' }],
  adopcion: [
    { campo: 'id_cliente', tabla: 'clientes', clave: 'id_cliente' },
    { campo: 'id_mascota_adopcion', tabla: 'mascotas_adopcion', clave: 'id_mascota_adopcion' }
  ],
  direccion: [{ campo: 'id_cliente', tabla: 'clientes', clave: 'id_cliente' }],
  variante: [
    { campo: 'id_producto', tabla: 'productos', clave: 'id_producto' },
    { campo: 'id_valor_atributo', tabla: 'valores_atributo', clave: 'id_valor' }
  ],
  stock: [
    { campo: 'id_variante', tabla: 'variantes', clave: 'id_variante' },
    { campo: 'id_sucursal', tabla: 'sucursales', clave: 'id_sucursal' }
  ],
  valorAtributo: [{ campo: 'id_atributo', tabla: 'atributos', clave: 'id_atributo' }],
  turno: [
    { campo: 'id_cliente', tabla: 'clientes', clave: 'id_cliente' },
    { campo: 'id_mascota', tabla: 'mascota', clave: 'id_mascota' },
    { campo: 'id_servicio', tabla: 'servicios', clave: 'id_servicio' },
    { campo: 'id_sucursal', tabla: 'sucursales', clave: 'id_sucursal' }
  ],
  historial: [
    { campo: 'id_mascota', tabla: 'mascota', clave: 'id_mascota' },
    { campo: 'id_veterinario', tabla: 'veterinarios', clave: 'id_veterinario' }
  ],
  tratamiento: [{ campo: 'id_historial', tabla: 'historial_medico', clave: 'id_historial' }],
  vacuna: [
    { campo: 'id_mascota', tabla: 'mascota', clave: 'id_mascota' },
    { campo: 'id_veterinario', tabla: 'veterinarios', clave: 'id_veterinario' }
  ],
  servicio: [{ campo: 'id_categoria_servicio', tabla: 'categorias_servicios', clave: 'id_categoria_servicio' }],
  pago: [{ campo: 'id_pedido', tabla: 'pedidos', clave: 'id_pedido' }],
  envio: [
    { campo: 'id_pedido', tabla: 'pedidos', clave: 'id_pedido' },
    { campo: 'id_direccion', tabla: 'direcciones', clave: 'id_direccion' }
  ]
};

// Comprueba que cada clave foránea enviada exista en su tabla padre.
// MySQL rechazaria el INSERT/UPDATE por FK, pero con un error 500 opaco:
// asi el mensaje es claro y el codigo de estado es 400.
const validarReferencias = async (entidad, datos) => {
  for (const ref of referencias[entidad] || []) {
    const valor = datos[ref.campo];
    if (valor === undefined || valor === null || valor === '') continue;

    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
      const error = new Error(`El campo ${ref.campo} debe ser un entero positivo`);
      error.status = 400;
      throw error;
    }

    const [filas] = await conexion.query(
      `SELECT 1 FROM \`${ref.tabla}\` WHERE \`${ref.clave}\` = ? LIMIT 1`,
      [id]
    );
    if (!filas.length) {
      const error = new Error(`El valor ${id} no existe en ${ref.tabla}`);
      error.status = 400;
      throw error;
    }
  }
};

// Los ENUM de MySQL no aceptan cualquier valor. Con STRICT_TRANS_TABLES (el modo
// por defecto en MySQL 8) un valor invalido revienta con un 500 sin explicar nada,
// asi que hay que validar antes de escribir. Se comparte entre crear() y
// actualizar() para que una edicion aplique las mismas reglas que un alta.
const ENUMERACIONES = {
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

// De las columnas ENUM de una entidad, cual es la que representa el estado por
// el que avanza el boton "Cambiar estado", con su tabla y su clave.
//
// No se puede deducir del objeto: en `pago` la primera clave de
// ENUMERACIONES es metodo_pago, y cambiar el metodo de pago no es cambiar el
// estado del pago. Tampoco se puede leer de `inserciones`, porque `pedido` no
// declara `clave` a proposito (tiene tabla hija) y aun asi su estado si avanza.
const ESTADOS = {
  turno: { tabla: 'turnos', clave: 'id_turno', campo: 'estado' },
  pedido: { tabla: 'pedidos', clave: 'id_pedido', campo: 'estado' },
  pago: { tabla: 'pagos', clave: 'id_pago', campo: 'estado_pago' },
  envio: { tabla: 'envios', clave: 'id_envio', campo: 'estado' }
};

const validarEnumeraciones = (entidad, datos) => {
  for (const [campo, opciones] of Object.entries(ENUMERACIONES[entidad] || {})) {
    if (datos[campo] && !opciones.includes(String(datos[campo]).toUpperCase())) {
      const error = new Error(`El valor de ${campo} no es válido`);
      error.status = 400;
      throw error;
    }
    if (datos[campo]) datos[campo] = String(datos[campo]).toUpperCase();
  }
};

// Reglas de negocio que no se pueden expresar con una clave foranea.
const validarCoherencia = async (entidad, datos, id) => {
  // rol_empleados.nombre es UNIQUE. MySQL rechazaria el INSERT/UPDATE con un 500
  // "Duplicate entry" que no dice qué campo choca; aca se traduce a un 400 claro.
  // El id solo llega al actualizar: hay que excluir el rol que se esta editando,
  // o se compararia consigo mismo y siempre daria conflicto.
  if (entidad === 'rol' && datos.nombre) {
    const [iguales] = await conexion.query(
      'SELECT 1 FROM rol_empleados WHERE nombre = ? AND (? IS NULL OR id_rol_empleado <> ?) LIMIT 1',
      [String(datos.nombre).trim(), id ?? null, id ?? 0]
    );
    if (iguales.length) {
      const error = new Error('Ya existe un rol de empleado con ese nombre');
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
};

// Todas las variantes de un producto deben usar el MISMO atributo. Si se mezclan
// ("Color: Rojo" + "Talla: Mediana") la tienda las muestra como botones sueltos
// y no queda claro de que dimension habla cada uno.
//
// idVariante llega solo al actualizar: hay que excluir la variante que se esta
// editando, o compararia consigo misma y siempre daria conflicto.
const validarPresentacionDeVariante = async (entidad, datos, idVariante) => {
  if (entidad !== 'variante' || !datos.id_producto) return;

  const [previas] = await conexion.query(
    `SELECT v.id_valor_atributo, va.id_atributo
     FROM variantes v
     LEFT JOIN valores_atributo va ON va.id_valor = v.id_valor_atributo
     WHERE v.id_producto = ? AND (? IS NULL OR v.id_variante <> ?)`,
    [Number(datos.id_producto), idVariante ?? null, idVariante ?? 0]
  );

  const conAtributo = previas.filter(v => v.id_atributo !== null);
  // El producto no tiene variantes todavia, o ninguna usa presentacion:
  // no hay nada que imponer.
  if (!conAtributo.length) return;

  const atributoUsado = Number(conAtributo[0].id_atributo);
  const valorNuevo = Number(datos.id_valor_atributo || 0);

  // Si llegamos aca es porque conAtributo.length > 0: el producto ya tiene
  // variantes con presentacion, asi que la nueva tambien debe usarla.
  if (!valorNuevo) {
    const error = new Error('Este producto ya tiene variantes con presentación. '
      + 'La nueva también debe usarla, o creá otro producto.');
    error.status = 400;
    throw error;
  }

  const [valores] = await conexion.query(
    'SELECT id_atributo FROM valores_atributo WHERE id_valor = ?', [valorNuevo]
  );
  const atributoNuevo = valores.length ? Number(valores[0].id_atributo) : null;

  if (atributoNuevo === atributoUsado) return;

  const [nombres] = await conexion.query(
    'SELECT (SELECT x.nombre FROM atributos x WHERE x.id_atributo = ?) AS usado, '
    + '       (SELECT y.nombre FROM atributos y WHERE y.id_atributo = ?) AS nuevo',
    [atributoUsado, atributoNuevo]
  );
  const error = new Error(
    `Las variantes de este producto usan la presentación "${nombres[0]?.usado ?? 'otra'}". `
    + `No podés agregar una de "${nombres[0]?.nuevo ?? 'otra'}". `
    + `Agregá una de "${nombres[0]?.usado ?? 'otra'}" o creá otro producto.`
  );
  error.status = 400;
  throw error;
};

// atributos.nombre y valores_atributo.nombre son VARCHAR(20). Sin esto, MySQL
// corta o falla y el cliente recibe un 500 sin explicar el motivo.
const limitarLongitud = {
  // Longitudes tomadas de database/VetClick-BD.sql.
  empleado: { nombre: 50, apellido: 50, telefono: 30, direccion: 150 },
  veterinario: { especialidad: 85 },
  usuario: { username: 30, email: 100 },
  rol: { nombre: 30 },
  rolUsuario: { nombre: 25 },
  permiso: { nombre: 50, descripcion: 100 },
  valorAtributo: { nombre: 20 },
  atributo: { nombre: 20 },
  // sucursales.nombre, direccion, localidad, telefono y horario son VARCHAR(80)
  // (database/VetClick-BD.sql). Sin esto, escribir de mas en cualquiera de ellas
  // devuelve un 500 de MySQL sin explicar nada.
  sucursal: { nombre: 80, direccion: 80, localidad: 80, telefono: 80, horario: 80 },
  historial: { motivo: 85, diagnostico: 120, observacion: 85 },
  tratamiento: { medicamento: 85, dosis: 85, frecuencia: 85, duracion: 85 },
  vacuna: { nombre: 85 },
  servicio: { nombre: 50 },
  categoriaServicio: { nombre: 50 }
};
// turnos.motivo y turnos.observaciones son TEXT: no tienen un limite fijo que
// validar, asi que no aparecen arriba.

const validarLongitudes = (entidad, datos) => {
  const limites = limitarLongitud[entidad];
  if (!limites) return;

  for (const [campo, maximo] of Object.entries(limites)) {
    const valor = datos[campo];
    if (valor === undefined || valor === null) continue;
    if (String(valor).trim().length > maximo) {
      const error = new Error(`El campo ${campo} admite máximo ${maximo} caracteres`);
      error.status = 400;
      throw error;
    }
  }
};

// ---------------------------------------------------------------------------
// Política de borrado por entidad.
// ---------------------------------------------------------------------------
//
// `bloqueantes`: tablas hijas que impiden borrar la fila. No se borran en cascada
// porque representan datos de negocio que no le pertenecen al padre (los
// historiales clínicos de un paciente, la cuenta de un cliente). Si hay alguna,
// el borrado se rechaza con un 400 que las nombra.
//
// `cascada`: tablas hijas que sí se borran con el padre. `cascada` es anidable:
// el recorrido es post-order, asi que un historial médico arrastra sus
// tratamientos antes de borrarse.
//
// La diferencia entre las dos listas no es tecnica sino de criterio, y por eso
// esta tabla es explicita y no se deduce del esquema: `rol_permiso` y
// `carrito_items` son las unicas tablas con ON DELETE CASCADE en la base, y
// ninguna de las dos decisiones de abajo podria tomarse solo con el esquema.
const borrados = {
  empleado: {
    tabla: 'empleados',
    clave: 'id_empleado',
    bloqueantes: [],
    // En vez de borrar la ficha del veterinario se le suelta la FK. El.historial
    // clinico pertenece al paciente, no a la persona que lo atendio: si Ana se
    // va de la clinica, Firulais se queda sin su control anual, y eso no lo
    // autorizo ni el usuario. La ficha sobrevive con su especialidad.
    // Funciona porque veterinarios.id_empleado admite NULL.
    desasociar: [{ tabla: 'veterinarios', columna: 'id_empleado', etiqueta: 'ficha de veterinario' }],
    cascada: []
  },
  veterinario: {
    tabla: 'veterinarios',
    clave: 'id_veterinario',
    bloqueantes: [],
    // Una ficha que ya quedo desasociada no se puede borrar: no hay a que
    // desasociarle nada y borrarla se lleva los historiales de sus pacientes
    // sin ningun beneficio. Solo se borran las fichas que siguen con empleado.
    requiere: [{ columna: 'id_empleado', etiqueta: 'empleado asociado' }],
    cascada: [
      {
        tabla: 'historial_medico',
        clave: 'id_historial',
        columna: 'id_veterinario',
        etiqueta: 'historial médico',
        cascada: [
          { tabla: 'tratamientos', clave: 'id_tratamiento', columna: 'id_historial', etiqueta: 'tratamiento' }
        ]
      },
      { tabla: 'vacunas', clave: 'id_vacuna', columna: 'id_veterinario', etiqueta: 'vacuna' }
    ]
  },
  usuario: {
    tabla: 'usuarios',
    clave: 'id_usuario',
    // Un usuario puede ser a la vez una cuenta interna y la de un cliente. En
    // cualquiera de los dos casos borrarlo se lleva datos que no son suyos.
    bloqueantes: [
      { tabla: 'clientes', columna: 'id_usuario', etiqueta: 'cliente' },
      { tabla: 'empleados', columna: 'id_usuario', etiqueta: 'empleado' }
    ],
    cascada: []
  },
  rol: {
    tabla: 'rol_empleados',
    clave: 'id_rol_empleado',
    bloqueantes: [],
    // empleados.id_rol_empleado es NOT NULL: un empleado esta obligado a tener
    // rol, asi que no hay desasociacion posible como con el veterinario. Hay
    // que darles otro rol antes de borrar este.
    reasignar: [{
      tabla: 'empleados',
      clave: 'id_empleado',
      columna: 'id_rol_empleado',
      etiqueta: 'empleado',
      etiquetaSql: "CONCAT(nombre, ' ', apellido)"
    }],
    cascada: []
  },
  // ------------------------------------------------------------------
  // Ventas
  // ------------------------------------------------------------------
  // Que se borre una venta no es lo mismo que se borre un empleado. Un pago
  // REALIZADO es evidencia contable y un envio ENTREGADO acredita que se entrego
  // el pedido: borrarlos es borrar el comprobante, no corregir un error de
  // carga. Por eso esos dos casos se bloquean y se deja pasar solo lo que
  // todavia esta en curso, que si es un error de carga reversible.
  pago: {
    tabla: 'pagos',
    clave: 'id_pago',
    bloqueantes: [],
    impideSi: [{ columna: 'estado_pago', valores: ['REALIZADO'], motivo: 'el pago está realizado' }],
    cascada: []
  },
  envio: {
    tabla: 'envios',
    clave: 'id_envio',
    bloqueantes: [],
    impideSi: [{ columna: 'estado', valores: ['ENTREGADO'], motivo: 'el envío está entregado' }],
    cascada: []
  },
  pedido: {
    tabla: 'pedidos',
    clave: 'id_pedido',
    bloqueantes: [],
    // A diferencia de los otros dos, el pedido no se bloquea: es el padre, y no
    // hay de que escaparle. El modal declara cuanto dinero y cuantas lineas se
    // van, y el usuario decide con esa informacion delante.
    cascada: [
      { tabla: 'pagos', clave: 'id_pago', columna: 'id_pedido', etiqueta: 'pago' },
      { tabla: 'envios', clave: 'id_envio', columna: 'id_pedido', etiqueta: 'envío' },
      { tabla: 'detalle_pedidos', clave: 'id_detalle_pedido', columna: 'id_pedido', etiqueta: 'línea de detalle' }
    ]
  },
  rolUsuario: {
    tabla: 'rol_usuario',
    clave: 'id_rol_usuario',
    bloqueantes: [{ tabla: 'usuarios', columna: 'id_rol_usuario', etiqueta: 'usuario' }],
    cascada: [{ tabla: 'rol_permiso', clave: 'id_permiso', columna: 'id_rol_usuario', etiqueta: 'asignación de permiso' }]
  },
  permiso: {
    tabla: 'permisos',
    clave: 'id_permiso',
    bloqueantes: [],
    cascada: [{ tabla: 'rol_permiso', clave: 'id_permiso', columna: 'id_permiso', etiqueta: 'asignación de permiso' }]
  }
};

// Cuantas filas hijas tiene una relacion y cuales son sus ids. Si el nodo
// declara `etiquetaSql`, tambien trae el texto de cada una: el modal de
// reasignacion necesita poder listar a quienes se van a ver afectados.
const idsDeHijos = async (nodo, idPadre, db) => {
  const [filas] = await db.query(
    `SELECT \`${nodo.clave}\` AS id${nodo.etiquetaSql ? `, ${nodo.etiquetaSql} AS nombre` : ''}
     FROM \`${nodo.tabla}\` WHERE \`${nodo.columna}\` = ?`,
    [idPadre]
  );
  return filas;
};

// Para los bloqueantes solo interesa cuanto hay, no cuales son.
const contarHijos = async (nodo, idPadre, db) => {
  const [filas] = await db.query(
    `SELECT COUNT(*) AS cantidad FROM \`${nodo.tabla}\` WHERE \`${nodo.columna}\` = ?`,
    [idPadre]
  );
  return Number(filas[0].cantidad);
};

// Un mismo tipo de hijo puede aparecer una vez por cada padre intermedio: el
// veterinario 1 tiene 2 historiales y cada uno con su tratamiento. El modal
// deberia decir "2 tratamientos", no dos renglones de 1.
const agruparPorEtiqueta = (pasos) => {
  const totales = new Map();
  for (const paso of pasos) {
    const actual = totales.get(paso.etiqueta) || 0;
    totales.set(paso.etiqueta, actual + paso.ids.length);
  }
  return [...totales].map(([etiqueta, cantidad]) => ({ etiqueta, cantidad }));
};

// Recorre el arbol de cascada en post-order: primero los nietos, despues el
// nodo. Ese es el unico orden valido porque las FK son NO ACTION: los
// tratamientos apuntan al historial, asi que hay que borrarlos antes que el.
//
// Cada paso guarda el id del PADRE (`idPadre`), que es por donde se borra: el
// filtro va sobre la columna FK de la tabla hija. Confundirlo con los ids de los
// hijos parece funcionar cuando hay un solo hijo cuyo id coincide con el del
// padre, que es exactamente lo que pasaba antes con rol_permiso.
const recopilarCascada = async (nodos, idPadre, db, pasos) => {
  for (const nodo of nodos || []) {
    const hijos = await idsDeHijos(nodo, idPadre, db);
    if (!hijos.length) continue;
    for (const { id } of hijos) await recopilarCascada(nodo.cascada, id, db, pasos);
    pasos.push({ ...nodo, idPadre, ids: hijos.map(hijo => hijo.id) });
  }
  return pasos;
};

// usuarios no esta en `inserciones` a proposito: su alta y su edicion no se
// comportan igual. El alta exige contraseña; la edicion NUNCA la escribe, asi
// que `password_hash` queda fuera de `camposUsuario` y un `password` que llegue
// en el body se ignora (no hay forma de tocarlo por API).
const camposUsuario = ['username', 'email', 'id_rol_usuario', 'activo'];

// Valida y normaliza el cuerpo de un usuario. La contraseña solo se valida en el
// alta: en la edicion se ignora, para que cambiar un email no requiera conocer
// ni recargar la clave actual.
const prepararUsuario = async (datos, { exigirPassword }) => {
  const nombre = String(datos.username ?? '').trim();
  const email = String(datos.email ?? '').trim();
  const password = String(datos.password ?? '');
  const idRol = Number(datos.id_rol_usuario);

  const completo = nombre && email && Number.isInteger(idRol) && idRol > 0;
  if (!completo || (exigirPassword && password.length < 8)) {
    const error = new Error(exigirPassword
      ? 'Usuario, email, contraseña de al menos 8 caracteres y rol son obligatorios'
      : 'Usuario, email y rol son obligatorios');
    error.status = 400;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('El email no tiene un formato válido');
    error.status = 400;
    throw error;
  }

  await validarReferencias('usuario', { id_rol_usuario: idRol });

  return {
    campos: {
      username: nombre,
      email,
      id_rol_usuario: idRol,
      activo: datos.activo === undefined ? true : convertirBooleano(datos.activo)
    },
    password
  };
};

// Verificamos existencia antes de escribir: MySQL devuelve affectedRows=0 cuando
// los valores no cambian, y eso no significa que el registro falte.
const existeRegistro = async (tabla, clave, id, db = conexion) => {
  const [filas] = await db.query(
    `SELECT 1 FROM \`${tabla}\` WHERE \`${clave}\` = ? LIMIT 1`,
    [id]
  );
  return filas.length > 0;
};

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
      const { campos, password } = await prepararUsuario(datos, { exigirPassword: true });
      const hash = await bcrypt.hash(password, 10);
      const [resultado] = await conexion.query(
        `INSERT INTO usuarios (username, password_hash, email, id_rol_usuario, activo)
         VALUES (?, ?, ?, ?, ?)`,
        [campos.username, hash, campos.email, campos.id_rol_usuario, campos.activo]
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
      pedido: { estado: 'PENDIENTE', costo_envio: 0 },
      pago: { estado_pago: 'PENDIENTE' },
      envio: { estado: 'EN_CAMINO' },
      sucursal: { activo: true },
      stock: { stock_minimo: 0 }
    };
    const defaults = valoresPorDefecto[entidad] || {};

    // Un default solo aplica si el campo NO llega con valor. El form siempre
    // manda todas las claves, asi que un campo opcional en blanco llega como
    // '' y pisaba el default: stock_minimo vacio se guardaba NULL, y el estado
    // del inventario comparaba contra NULL y siempre decia "Optimo".
    const aplicarDefault = (campo, valor) =>
      (valor === undefined || valor === '') && campo in defaults ? defaults[campo] : valor;
    datos = Object.fromEntries(
      Object.entries(datos).map(([campo, valor]) => [campo, aplicarDefault(campo, valor)])
    );
    for (const [campo, valor] of Object.entries(defaults)) {
      if (!(campo in datos)) datos[campo] = valor;
    }

    for (const campo of configuracion.requeridos) {
      const valor = datos[campo];
      if (valor === undefined || valor === null || String(valor).trim() === '') {
        const error = new Error(`El campo ${campo} es obligatorio`);
        error.status = 400;
        throw error;
      }
    }

    await validarCoherencia(entidad, datos, null);
    validarEnumeraciones(entidad, datos);

    const valores = configuracion.campos.map(campo =>
      normalizarValor(campo, campo in defaults ? aplicarDefault(campo, datos[campo]) : datos[campo])
    );
    await validarReferencias(entidad, datos);
    validarLongitudes(entidad, datos);
    await validarPresentacionDeVariante(entidad, datos, null);

    const columnas = configuracion.campos.map(campo => `\`${campo}\``).join(', ');
    const placeholders = configuracion.campos.map(() => '?').join(', ');

    if (!configuracion.detalle) {
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
      await conexionTransaccion.commit();
      return resultado;
    } catch (error) {
      await conexionTransaccion.rollback();
      throw error;
    } finally {
      conexionTransaccion.release();
    }
  },

  // Edición genérica de las entidades declaradas en `inserciones`.
  // Solo se tocan las columnas que figuran en configuracion.campos, y solo
  // las que llegaron en el body: lo que no viene no se pisa con NULL.
  async actualizar(entidad, id, datos) {
    // usuarios no está en `inserciones` y tiene su propio camino: la contraseña
    // queda fuera de la lista blanca, así que un PUT jamás toca el password_hash.
    if (entidad === 'usuario') {
      const { campos } = await prepararUsuario(datos, { exigirPassword: false });
      if (!await existeRegistro('usuarios', 'id_usuario', id)) {
        const error = new Error('El registro no existe');
        error.status = 404;
        throw error;
      }
      const columnas = camposUsuario.filter(campo => datos[campo] !== undefined);
      const sets = columnas.map(campo => `\`${campo}\` = ?`).join(', ');
      const valores = columnas.map(campo => normalizarValor(campo, campos[campo]));
      const [resultado] = await conexion.query(
        `UPDATE usuarios SET ${sets} WHERE id_usuario = ?`,
        [...valores, id]
      );
      return resultado;
    }

    const configuracion = inserciones[entidad];
    if (!configuracion) {
      const error = new Error('No existe un formulario de edición para esta entidad');
      error.status = 404;
      throw error;
    }

    // Los pedidos tienen tabla hija: su alta es transaccional y no aplica acá.
    if (configuracion.detalle) {
      const error = new Error('Esta entidad no admite actualización directa');
      error.status = 400;
      throw error;
    }

    if (!configuracion.clave) {
      const error = new Error('Esta entidad no tiene clave primaria declarada para editar');
      error.status = 400;
      throw error;
    }

    // En una edición los campos requeridos deben llegar con valor: es lo que
    // evita que un PUT deje la fila con su clave foránea en NULL.
    for (const campo of configuracion.requeridos) {
      const valor = datos[campo];
      if (valor === undefined || valor === null || String(valor).trim() === '') {
        const error = new Error(`El campo ${campo} es obligatorio`);
        error.status = 400;
        throw error;
      }
    }

    const columnas = configuracion.campos.filter(campo => datos[campo] !== undefined);
    if (!columnas.length) {
      const error = new Error('No se envió ningún campo para actualizar');
      error.status = 400;
      throw error;
    }

    const valores = columnas.map(campo => normalizarValor(campo, datos[campo]));
    const sets = columnas.map(campo => `\`${campo}\` = ?`).join(', ');

    await validarCoherencia(entidad, datos, id);
    validarEnumeraciones(entidad, datos);
    await validarReferencias(entidad, datos);
    validarLongitudes(entidad, datos);
    await validarPresentacionDeVariante(entidad, datos, id);

    // Verificamos existencia antes de escribir: MySQL devuelve affectedRows=0
    // cuando los valores no cambian, y eso no significa que el registro falte.
    if (!await existeRegistro(configuracion.tabla, configuracion.clave, id)) {
      const error = new Error('El registro no existe');
      error.status = 404;
      throw error;
    }

    const [resultado] = await conexion.query(
      `UPDATE \`${configuracion.tabla}\` SET ${sets} WHERE \`${configuracion.clave}\` = ?`,
      [...valores, id]
    );
    return resultado;
  },

  // Avanza el estado de un registro al siguiente valor de su ENUM.
  //
  // La lista vive solo aca, en el backend: el frontend no la duplica, pide el
  // cambio y usa el valor que vuelve. Antes el panel ciclaba el texto del
  // `.status` entre "Activo", "Pendiente" e "Inactivo", que para un pago o un
  // envio son valores que la columna no admite: si esa rotacion se hubiera
  // conectado, MySQL habria respondido 500.
  async avanzarEstado(entidad, id, opciones = {}) {
    const definicion = ESTADOS[entidad];
    const valores = definicion && ENUMERACIONES[entidad]?.[definicion.campo];
    if (!definicion || !valores) {
      const error = new Error('Esta sección todavía no tiene el cambio de estado conectado');
      error.status = 404;
      throw error;
    }
    const { tabla, clave, campo } = definicion;
    // Igual que eliminar(): sobre el pool por defecto, y sobre la conexion que
    // le pasen las pruebas, para que puedan correrlo dentro de un rollback.
    const db = opciones.conexion || conexion;

    const [filas] = await db.query(
      `SELECT \`${campo}\` AS estado FROM \`${tabla}\` WHERE \`${clave}\` = ? LIMIT 1`,
      [id]
    );
    if (!filas.length) {
      const error = new Error('El registro no existe');
      error.status = 404;
      throw error;
    }

    const actual = String(filas[0].estado ?? '').toUpperCase();
    const posicion = valores.indexOf(actual);
    // Un valor que no esta en la lista no se puede "avanzar": se cae al primero
    // y el UPDATE sigue siendo valido.
    const siguiente = valores[(posicion + 1) % valores.length];

    await db.query(
      `UPDATE \`${tabla}\` SET \`${campo}\` = ? WHERE \`${clave}\` = ?`,
      [siguiente, id]
    );

    return {
      mensaje: 'Estado actualizado correctamente',
      campo,
      anterior: actual,
      estado: siguiente,
      ultimo: posicion === valores.length - 1
    };
  },

  // Que se va a borrar junto con la fila: lo que la impide, lo que hay que
  // soltar antes y lo que arrastra. Lo consume el modal de confirmacion del
  // panel, y `eliminar()` vuelve a calcularlo para no confiar en lo que mando
  // el navegador.
  async planificarBorrado(entidad, id, db = conexion) {
    const configuracion = borrados[entidad];
    if (!configuracion) {
      const error = new Error('La eliminación todavía no está conectada para esta entidad');
      error.status = 404;
      throw error;
    }

    const [fila] = await db.query(
      `SELECT * FROM \`${configuracion.tabla}\` WHERE \`${configuracion.clave}\` = ? LIMIT 1`,
      [id]
    );
    if (!fila.length) {
      const error = new Error('El registro no existe');
      error.status = 404;
      throw error;
    }
    const registro = fila[0];

    // Requisitos de la propia fila: "no tiene empleado asociado".
    const sinRequisito = (configuracion.requiere || []).filter(({ columna }) =>
      registro[columna] === null || registro[columna] === undefined);

    // Valores de la propia fila que impiden el borrado: un pago REALIZADO es
    // evidencia contable, no un error de carga.
    const impiden = (configuracion.impideSi || [])
      .filter(({ columna, valores }) => valores.map(String).includes(String(registro[columna])))
      .map(({ motivo }) => motivo);

    const bloqueantes = [];
    for (const nodo of configuracion.bloqueantes) {
      const cantidad = await contarHijos(nodo, id, db);
      if (cantidad) bloqueantes.push({ etiqueta: nodo.etiqueta, cantidad });
    }

    const desasociar = [];
    for (const nodo of configuracion.desasociar || []) {
      const cantidad = await contarHijos(nodo, id, db);
      if (cantidad) desasociar.push({ etiqueta: nodo.etiqueta, cantidad });
    }

    // Los que hay que reasignar antes de poder borrar, con nombre y apellido:
    // el modal los lista para que la decision sea informada.
    const reasignar = [];
    for (const nodo of configuracion.reasignar || []) {
      const registros = await idsDeHijos(nodo, id, db);
      if (registros.length) {
        reasignar.push({
          etiqueta: nodo.etiqueta,
          cantidad: registros.length,
          ids: registros.map(filaHija => filaHija.id),
          registros: nodo.etiquetaSql
            ? registros.map(filaHija => ({ id: filaHija.id, nombre: filaHija.nombre }))
            : []
        });
      }
    }

    const cascada = agruparPorEtiqueta(await recopilarCascada(configuracion.cascada, id, db, []));

    return { bloqueantes, sinRequisito, impiden, desasociar, reasignar, cascada };
  },

  // Borrado. Todo el recorrido va en una transaccion: si algo falla a mitad de
  // camino, el rollback deja el historial clinico entero en vez de a medias.
  // `opciones.conexion` existe para que las pruebas puedan pasar su propia
  // transaccion y hacer rollback.
  async eliminar(entidad, id, opciones = {}, datos = {}) {
    const db = opciones.conexion || conexion;
    const plan = await this.planificarBorrado(entidad, id, db);
    const configuracion = borrados[entidad];

    if (plan.sinRequisito.length) {
      const detalle = plan.sinRequisito.map(({ etiqueta }) => etiqueta).join(' ni ');
      const error = new Error(`No se puede eliminar: no tiene ${detalle}`);
      error.status = 400;
      throw error;
    }

    if (plan.bloqueantes.length) {
      const detalle = plan.bloqueantes
        .map(({ etiqueta, cantidad }) => `${cantidad} ${etiqueta}${cantidad === 1 ? '' : 's'}`)
        .join(' y ');
      const plural = plan.bloqueantes.some(({ cantidad }) => cantidad !== 1);
      const error = new Error(`No se puede eliminar: tiene ${detalle} asociado${plural ? 's' : ''}`);
      error.status = 400;
      throw error;
    }

    if (plan.impiden.length) {
      const error = new Error(`No se puede eliminar: ${plan.impiden.join(' y ')}`);
      error.status = 400;
      throw error;
    }

    // Reasignar antes de borrar: el destino tiene que existir y ser otro.
    let destino = null;
    for (const pendiente of plan.reasignar) {
      const idDestino = Number(datos.id_rol_empleado_destino);
      if (!Number.isInteger(idDestino) || idDestino <= 0) {
        const error = new Error(
          `Este registro tiene ${pendiente.cantidad} ${pendiente.etiqueta}${pendiente.cantidad === 1 ? '' : 's'}: `
          + 'indicá a qué rol se reasignan antes de eliminar'
        );
        error.status = 400;
        throw error;
      }
      if (idDestino === Number(id)) {
        const error = new Error('El rol destino debe ser distinto del que se está eliminando');
        error.status = 400;
        throw error;
      }
      if (!await existeRegistro(configuracion.tabla, configuracion.clave, idDestino, db)) {
        const error = new Error('El rol destino no existe');
        error.status = 400;
        throw error;
      }
      destino = idDestino;
    }

    // Sobre el pool, la transaccion es nuestra. Sobre una conexion ajena la
    // transaccion es de quien la abrio, y no hay que cerrarla aca.
    const propia = !opciones.conexion;
    const ejecutora = propia ? await conexion.getConnection() : db;
    try {
      if (propia) await ejecutora.beginTransaction();

      // 1) Reasignar: los empleados con este rol reciben el nuevo.
      //    Se recorren los nodos de la configuracion, no los del plan: el plan
      //    es para el frontend y lleva solo etiqueta y cantidad, no las columnas.
      for (const nodo of configuracion.reasignar || []) {
        if (!await contarHijos(nodo, id, ejecutora)) continue;
        await ejecutora.query(
          `UPDATE \`${nodo.tabla}\` SET \`${nodo.columna}\` = ? WHERE \`${nodo.columna}\` = ?`,
          [destino, id]
        );
      }

      // 2) Desasociar: se suelta la FK en vez de borrar la fila hija.
      for (const nodo of configuracion.desasociar || []) {
        if (!await contarHijos(nodo, id, ejecutora)) continue;
        await ejecutora.query(
          `UPDATE \`${nodo.tabla}\` SET \`${nodo.columna}\` = NULL WHERE \`${nodo.columna}\` = ?`,
          [id]
        );
      }

      // 3) Cascada: los nietos primero, en post-order. El filtro va por el id
      //    del padre, que es lo que la columna FK de la tabla hija referencia.
      const pasos = await recopilarCascada(configuracion.cascada, id, ejecutora, []);
      for (const paso of pasos) {
        await ejecutora.query(
          `DELETE FROM \`${paso.tabla}\` WHERE \`${paso.columna}\` = ?`,
          [paso.idPadre]
        );
      }

      // 4) Y por ultimo, la fila.
      await ejecutora.query(
        `DELETE FROM \`${configuracion.tabla}\` WHERE \`${configuracion.clave}\` = ?`,
        [id]
      );

      if (propia) await ejecutora.commit();
      return {
        mensaje: 'Registro eliminado correctamente',
        bloqueantes: [],
        desasociar: plan.desasociar,
        reasignar: plan.reasignar.map(({ etiqueta, cantidad }) => ({ etiqueta, cantidad })),
        cascada: plan.cascada
      };
    } catch (error) {
      if (propia) await ejecutora.rollback();
      throw error;
    } finally {
      if (propia) ejecutora.release();
    }
  }
};

module.exports = AdminModel;
