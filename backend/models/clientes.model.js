const conexion = require('../config/database');
const { sincronizarEstadoMascota } = require('../config/adopciones');

const ClientesModel = {
  obtenerClientes: async () => {
    const [rows] = await conexion.query(
      'SELECT id_cliente, id_usuario, nombre, apellido, telefono, estado FROM clientes ORDER BY id_cliente'
    );
    return rows;
  },
  obtenerMascotas: async () => {
    const [rows] = await conexion.query(`
      SELECT m.id_mascota, m.id_cliente, m.nombre,
             ra.nombre AS raza, es.nombre AS especie,
             m.id_raza, m.sexo, m.fecha_nacimiento, m.peso,
             m.observaciones, c.nombre AS propietario
      FROM mascota m
      JOIN clientes c ON c.id_cliente = m.id_cliente
      JOIN razas ra ON ra.id_raza = m.id_raza
      LEFT JOIN especies es ON es.id_especie = ra.id_especie
      ORDER BY m.id_mascota
    `);
    return rows;
  },
  obtenerDirecciones: async () => {
    const [rows] = await conexion.query(`
      SELECT d.id_direccion, d.id_cliente, c.nombre, d.tipo_direccion, d.calle,
             d.numero, d.piso, d.departamento, d.localidad, d.provincia,
             d.codigo_postal, d.referencia
      FROM direcciones d
      JOIN clientes c ON c.id_cliente = d.id_cliente
      ORDER BY d.id_direccion
    `);
    return rows;
  },
  obtenerEspecies: async () => {
    const [rows] = await conexion.query(
      'SELECT id_especie, nombre FROM especies ORDER BY id_especie'
    );
    return rows;
  },
  obtenerRazas: async () => {
    const [rows] = await conexion.query(`
      SELECT r.id_raza, r.nombre, r.id_especie, e.nombre AS especie
      FROM razas r
      LEFT JOIN especies e ON e.id_especie = r.id_especie
      ORDER BY r.id_raza
    `);
    return rows;
  },
  obtenerMascotasAdopcion: async () => {
    const [rows] = await conexion.query(`
      SELECT m.id_mascota_adopcion, m.nombre, m.id_raza,
             ra.nombre AS raza, es.nombre AS especie,
             m.edad, m.sexo, m.descripcion, m.estado, m.img_masc_adop,
             (SELECT COUNT(*) FROM adopciones a
               WHERE a.id_mascota_adopcion = m.id_mascota_adopcion
                 AND a.estado = 'EN_CURSO') AS interesados
      FROM mascotas_adopcion m
      LEFT JOIN razas ra ON ra.id_raza = m.id_raza
      LEFT JOIN especies es ON es.id_especie = ra.id_especie
      ORDER BY m.id_mascota_adopcion
    `);
    return rows;
  },
  obtenerAdopciones: async () => {
    const [rows] = await conexion.query(`
      SELECT a.id_adopcion, a.id_cliente,
             CONCAT(c.nombre, ' ', c.apellido) AS cliente,
             a.id_mascota_adopcion, ma.nombre AS mascota,
             a.fecha, a.estado, a.observacion
      FROM adopciones a
      LEFT JOIN clientes c ON c.id_cliente = a.id_cliente
      LEFT JOIN mascotas_adopcion ma ON ma.id_mascota_adopcion = a.id_mascota_adopcion
      ORDER BY a.id_adopcion
    `);
    return rows;
  },
  // El cliente se identifica por su usuario: es el salto que hace el token
  // (que trae id_usuario) para llegar al id_cliente que pide la tabla
  // adopciones. Devuelve null si el usuario todavia no completo su perfil.
  obtenerClientePorUsuario: async (idUsuario) => {
    const [rows] = await conexion.query(
      'SELECT id_cliente FROM clientes WHERE id_usuario = ?',
      [idUsuario]
    );
    return rows[0] || null;
  },
  obtenerMascotaAdopcionPorId: async (id) => {
    const [rows] = await conexion.query(
      'SELECT id_mascota_adopcion, nombre, estado FROM mascotas_adopcion WHERE id_mascota_adopcion = ?',
      [id]
    );
    return rows[0] || null;
  },
  // Una misma persona no puede tener dos solicitudes en curso para la misma
  // mascota: el segundo POST debe avisarle, no duplicar la fila.
  existeAdopcionEnCurso: async (idCliente, idMascotaAdopcion) => {
    const [rows] = await conexion.query(
      `SELECT id_adopcion FROM adopciones
       WHERE id_cliente = ? AND id_mascota_adopcion = ? AND estado = 'EN_CURSO'
       LIMIT 1`,
      [idCliente, idMascotaAdopcion]
    );
    return rows.length > 0;
  },
  // Registrar la solicitud y mover la ficha de la mascota a EN_TRAMITE, para
  // que deje de ofrecerse en la pagina publica. Va en transaccion: si la
  // actualizacion de la mascota fallara, tampoco puede quedar la solicitud.
  crearAdopcion: async (adopcion) => {
    const transaccion = await conexion.getConnection();
    try {
      await transaccion.beginTransaction();

      const [resultado] = await transaccion.query(`
        INSERT INTO adopciones (id_cliente, id_mascota_adopcion, fecha, estado, observacion)
        VALUES (?, ?, ?, ?, ?)`,
        [
          adopcion.id_cliente,
          adopcion.id_mascota_adopcion,
          adopcion.fecha,
          adopcion.estado,
          adopcion.observacion
        ]
      );

      await sincronizarEstadoMascota(
        transaccion,
        adopcion.estado,
        adopcion.id_mascota_adopcion
      );

      await transaccion.commit();
      return resultado;
    } catch (error) {
      await transaccion.rollback();
      throw error;
    } finally {
      transaccion.release();
    }
  },
  crearCliente: async (cliente) => {
    const [resultado] = await conexion.query(`
    INSERT INTO clientes(id_usuario, nombre, apellido, telefono, estado) VALUES (?,?,?,?,?)
    `,
      [
      cliente.id_usuario,
      cliente.nombre,
        cliente.apellido,
        cliente.telefono,
        cliente.estado
      ]
    );

    return resultado;
  },
  // La mascota se identifica solo por su raza: la especie se deduce de la
  // raza (razas -> especies) y no se escribe. Por eso no hay que validar que
  // "la raza pertenezca a la especie elegida": ya no hay una especie elegida.
  crearMascotas: async (mascota) => {
    const [resultado] = await conexion.query(`
      INSERT INTO mascota (id_cliente, nombre, id_raza, sexo, fecha_nacimiento, peso, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        mascota.id_cliente,
        mascota.nombre,
        mascota.id_raza,
        mascota.sexo ?? 'MACHO',
        mascota.fecha_nacimiento ?? new Date().toISOString().slice(0, 10),
        Number(mascota.peso ?? 0),
        mascota.observaciones ?? ''
      ]
    );
    return resultado;
  },

  obtenerClientesPorId: async (id)=>{
    const [rows] = await conexion.query(
      'SELECT id_cliente, id_usuario , nombre , apellido , telefono , estado FROM clientes WHERE id_cliente = ?',
      [id]
    ); 
    return rows [0] || null;
  },

  actualizarCliente: async (id, datos) =>{
    const permitidos = ['id_usuario', 'nombre', 'apellido', 'telefono', 'estado'];

    const columnas = permitidos.filter (campo =>datos[campo] !== undefined);

    if(!columnas.length){
      return {affectedRows: 0 , columnas};
    }

    const sets = columnas.map(campo=> `\`${campo}\`=?`).join(', ');
    const valores = columnas.map(campo => datos[campo]);

    const [resultado] = await conexion.query(
      `UPDATE clientes SET ${sets}  WHERE id_cliente = ?`,
      [...valores, id]
    );
    return {...resultado, columnas};
  },

  obtenerMascotaPorId: async (id) => {
    const [rows] = await conexion.query(
      `SELECT m.id_mascota, m.id_cliente, m.nombre, m.id_raza, m.sexo,
              m.fecha_nacimiento, m.peso, m.observaciones
       FROM mascota m
       WHERE m.id_mascota = ?`,
      [id]
    );
    return rows[0] || null;
  },

  actualizarMascota: async (id, datos) => {
    const permitidos = ['id_cliente', 'nombre', 'id_raza', 'sexo',
                        'fecha_nacimiento', 'peso', 'observaciones'];
    const columnas = permitidos.filter(campo => datos[campo] !== undefined);

    if (!columnas.length) {
      return { affectedRows: 0, columnas };
    }

    const sets = columnas.map(campo => `\`${campo}\` = ?`).join(', ');
    const valores = columnas.map(campo => datos[campo]);

    const [resultado] = await conexion.query(
      `UPDATE mascota SET ${sets} WHERE id_mascota = ?`,
      [...valores, id]
    );
    return { ...resultado, columnas };
  }
};

module.exports = ClientesModel;