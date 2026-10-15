// Prueba del borrado: bloqueos, cascada, desasociacion y reasignacion.
//
// Cada seccion corre en SU PROPIA transaccion y termina en ROLLBACK, asi que
// (a) no se toca la base y (b) las secciones no se ensucian entre si. Con una
// sola transaccion compartida, borrar un empleado en una seccion cambiaba el
// numero de afectados de la seccion siguiente y los conteos dan falsos positivos.
//
// Ejecutar con: node test_admin_borrado.js
const conexion = require('./config/database');
const AdminModel = require('./models/admin.model');

let fallos = 0;

const verificar = (condicion, descripcion) => {
  console.log(`${condicion ? '  OK  ' : ' FALLA'} ${descripcion}`);
  if (!condicion) fallos += 1;
};

const contar = async (db, tabla, columna, valor) => {
  const [filas] = await db.query(
    `SELECT COUNT(*) AS n FROM \`${tabla}\` WHERE ${columna ? `\`${columna}\` = ?` : '1=1'}`,
    columna ? [valor] : []
  );
  return Number(filas[0].n);
};

// Abre una transaccion, la revierte y libera la conexion. Devuelve lo que
// devuelva la seccion, para que cada una pueda afirmar sobre su propio estado.
const enTransaccion = async seccion => {
  const db = await conexion.getConnection();
  try {
    await db.beginTransaction();
    return await seccion(db);
  } finally {
    await db.rollback().catch(() => {});
    db.release();
  }
};

(async () => {
  console.log('Cada seccion corre en su propia transaccion y se revierte al final.\n');

  // ------------------------------------------------------------- 1. plan
  await enTransaccion(async db => {
    console.log('1) Que bloquea, que desasocia y que arrastra');
    const planVet = await AdminModel.planificarBorrado('veterinario', 1, db);
    console.log('   veterinario 1 ->', JSON.stringify(planVet));
    verificar(planVet.bloqueantes.length === 0, 'un veterinario con empleado no esta bloqueado');
    verificar(planVet.sinRequisito.length === 0, 'una ficha con empleado se puede borrar');
    verificar(planVet.cascada.some(p => p.etiqueta === 'historial médico'), 'arrastra historiales');
    verificar(planVet.cascada.some(p => p.etiqueta === 'vacuna'), 'arrastra vacunas');
    console.log('   orden:', planVet.cascada.map(p => p.etiqueta).join(' -> '));

    const planEmp = await AdminModel.planificarBorrado('empleado', 1, db);
    console.log('   empleado 1 ->', JSON.stringify(planEmp));
    verificar(planEmp.desasociar.length === 1, 'un empleado desasocia su ficha de veterinario');
    verificar(planEmp.cascada.length === 0, 'un empleado NO se lleva historiales clinicos');

    const planRol = await AdminModel.planificarBorrado('rol', 2, db);
    console.log('   rol 2 ->', JSON.stringify(planRol.reasignar));
    verificar(planRol.bloqueantes.length === 0, 'un rol con empleados ya no esta bloqueado');
    verificar(planRol.reasignar.length === 1 && planRol.reasignar[0].cantidad > 0, 'exige reasignar');
    verificar(planRol.reasignar[0].registros.length > 0 && !!planRol.reasignar[0].registros[0].nombre,
      'trae el nombre de los afectados para el modal');

    const planUsu = await AdminModel.planificarBorrado('usuario', 1, db);
    verificar(planUsu.bloqueantes.length === 2, 'un usuario con cliente y empleado bloquea por los dos');
  });

  // ------------------------------------------------------------ 2. errores
  await enTransaccion(async db => {
    console.log('\n2) Casos de error');
    const esperar400 = async (descripcion, accion, frase) => {
      try {
        await accion();
        verificar(false, descripcion);
      } catch (error) {
        verificar(error.status === 400 && error.message.includes(frase),
          `${descripcion}: "${error.message}"`);
      }
    };
    await esperar400('reasignar sin destino',
      () => AdminModel.eliminar('rol', 2, { conexion: db }), 'indicá a qué rol');
    await esperar400('destino inexistente',
      () => AdminModel.eliminar('rol', 2, { conexion: db }, { id_rol_empleado_destino: 999 }), 'no existe');
    await esperar400('destino igual al origen',
      () => AdminModel.eliminar('rol', 2, { conexion: db }, { id_rol_empleado_destino: 2 }), 'distinto');
    const esperarStatus = async (descripcion, estado, accion, frase) => {
      try {
        await accion();
        verificar(false, descripcion);
      } catch (error) {
        verificar(error.status === estado && error.message.includes(frase),
          `${descripcion}: "${error.message}"`);
      }
    };
    await esperarStatus('id inexistente', 404,
      () => AdminModel.eliminar('veterinario', 99999, { conexion: db }), 'no existe');
    await esperarStatus('entidad sin politica', 404,
      () => AdminModel.eliminar('cliente', 1, { conexion: db }), 'no está conectada');
  });

  // ------------------------------------------------------------- 3. cascada
  await enTransaccion(async db => {
    console.log('\n3) Borrado en cascada');
    const antes = {
      historiales: await contar(db, 'historial_medico', 'id_veterinario', 1),
      tratamientos: await contar(db, 'tratamientos'),
      vacunas: await contar(db, 'vacunas', 'id_veterinario', 1),
      veterinarios: await contar(db, 'veterinarios')
    };
    await AdminModel.eliminar('veterinario', 1, { conexion: db });
    verificar(await contar(db, 'veterinarios', 'id_veterinario', 1) === 0, 'el veterinario se borro');
    verificar(await contar(db, 'historial_medico', 'id_veterinario', 1) === 0, 'sus historiales se borraron');
    verificar(await contar(db, 'vacunas', 'id_veterinario', 1) === 0, 'sus vacunas se borraron');
    verificar(await contar(db, 'tratamientos') < antes.tratamientos, 'sus tratamientos se borraron');
    verificar(await contar(db, 'veterinarios') === antes.veterinarios - 1, 'los demas veterinarios siguen');
  });

  // ---------------------------------------------------------- 4. desasociar
  await enTransaccion(async db => {
    console.log('\n4) Desasociar: el empleado se va, la ficha y el historial quedan');
    // Se busca un empleado que ademas sea veterinario, para poder afirmar sobre
    // la ficha y sobre el historial clinico que tiene debajo.
    const [[pareja]] = await db.query(
      `SELECT v.id_veterinario, v.id_empleado FROM veterinarios v
       WHERE v.id_empleado IS NOT NULL ORDER BY v.id_veterinario LIMIT 1`
    );
    const VET = pareja.id_veterinario;
    const EMPLEADO = pareja.id_empleado;
    const historiales = await contar(db, 'historial_medico', 'id_veterinario', VET);
    const vacunas = await contar(db, 'vacunas', 'id_veterinario', VET);
    const tratamientos = await contar(db, 'tratamientos');
    console.log(`   empleado ${EMPLEADO} / veterinario ${VET}`);

    await AdminModel.eliminar('empleado', EMPLEADO, { conexion: db });

    verificar(await contar(db, 'empleados', 'id_empleado', EMPLEADO) === 0, 'el empleado se borro');
    verificar(await contar(db, 'veterinarios', 'id_veterinario', VET) === 1, 'la ficha SIGUE existiendo');
    const [ficha] = await db.query('SELECT id_empleado FROM veterinarios WHERE id_veterinario = ?', [VET]);
    verificar(ficha[0].id_empleado === null, 'la ficha quedo con id_empleado NULL');
    verificar(await contar(db, 'historial_medico', 'id_veterinario', VET) === historiales,
      'los historiales clinicos intactos');
    verificar(await contar(db, 'vacunas', 'id_veterinario', VET) === vacunas, 'las vacunas intactas');
    verificar(await contar(db, 'tratamientos') === tratamientos, 'los tratamientos intactos');

    try {
      await AdminModel.eliminar('veterinario', VET, { conexion: db });
      verificar(false, 'una ficha desasociada no deberia poder borrarse');
    } catch (error) {
      verificar(error.status === 400, `ficha desasociada bloqueada: "${error.message}"`);
    }
  });

  // ----------------------------------------------------------- 5. reasignar
  await enTransaccion(async db => {
    console.log('\n5) Reasignar: los empleados reciben otro rol antes de borrar');
    const [[conEmpleados]] = await db.query(
      `SELECT r.id_rol_empleado, (SELECT COUNT(*) FROM empleados e
        WHERE e.id_rol_empleado = r.id_rol_empleado) AS total
       FROM rol_empleados r HAVING total > 0 ORDER BY r.id_rol_empleado LIMIT 1`
    );
    const [otros] = await db.query(
      `SELECT id_rol_empleado FROM rol_empleados WHERE id_rol_empleado <> ? LIMIT 1`,
      [conEmpleados.id_rol_empleado]
    );
    if (!conEmpleados || !otros.length) {
      console.log('   (hace falta un rol con empleados y al menos un segundo rol; se omite)');
      return;
    }
    const ORIGEN = conEmpleados.id_rol_empleado;
    const DESTINO = otros[0].id_rol_empleado;
    const plan = await AdminModel.planificarBorrado('rol', ORIGEN, db);
    const afectados = plan.reasignar[0].registros;
    const antesDestino = await contar(db, 'empleados', 'id_rol_empleado', DESTINO);
    console.log(`   rol ${ORIGEN} -> ${DESTINO}; se reasignan: ${afectados.map(r => r.nombre).join(', ')}`);

    await AdminModel.eliminar('rol', ORIGEN, { conexion: db }, { id_rol_empleado_destino: DESTINO });

    verificar(await contar(db, 'rol_empleados', 'id_rol_empleado', ORIGEN) === 0, 'el rol viejo se borro');
    verificar(await contar(db, 'empleados', 'id_rol_empleado', ORIGEN) === 0, 'nadie quedo con el rol borrado');
    verificar(await contar(db, 'empleados', 'id_rol_empleado', DESTINO) === antesDestino + plan.reasignar[0].cantidad,
      'todos los empleados quedaron en el rol destino');
  });

  // ------------------------------------------- 6. rol sin empleados, directo
  await enTransaccion(async db => {
    console.log('\n6) Un rol sin empleados se borra sin preguntar destino');
    const [libres] = await db.query(
      `SELECT r.id_rol_empleado FROM rol_empleados r
       WHERE NOT EXISTS (SELECT 1 FROM empleados e WHERE e.id_rol_empleado = r.id_rol_empleado)
       ORDER BY r.id_rol_empleado LIMIT 1`
    );
    if (!libres.length) {
      console.log('   (no hay roles sin empleados en esta base)');
      return;
    }
    await AdminModel.eliminar('rol', libres[0].id_rol_empleado, { conexion: db });
    verificar(await contar(db, 'rol_empleados', 'id_rol_empleado', libres[0].id_rol_empleado) === 0,
      `el rol ${libres[0].id_rol_empleado} se borro sin necesidad de destino`);
  });

  // ------------------------------------- 6b. cascada con varios hijos
  await enTransaccion(async db => {
    console.log('\n6b) Cascada con VARIOS hijos: el filtro va por el id del padre');
    // Este caso es el que destapo un bug: el DELETE por cascada filtraba
    // `columna IN (ids de los hijos)`. Con un solo hijo, cuyo id coincidia con
    // el del padre, pasaba la prueba sin avisar. Con varios, los ids no
    // coinciden y no borrava nada.
    const [[conVarios]] = await db.query(
      `SELECT r.id_rol_usuario, COUNT(*) AS total
       FROM rol_usuario r JOIN rol_permiso rp ON rp.id_rol_usuario = r.id_rol_usuario
       WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.id_rol_usuario = r.id_rol_usuario)
       GROUP BY r.id_rol_usuario HAVING total > 1 ORDER BY r.id_rol_usuario LIMIT 1`
    );
    if (!conVarios) {
      console.log('   (ningun rol libre tiene mas de un permiso asignado; se omite)');
      return;
    }
    const ROL = conVarios.id_rol_usuario;
    const [permisos] = await db.query('SELECT id_permiso FROM rol_permiso WHERE id_rol_usuario = ?', [ROL]);
    console.log(`   rol ${ROL} tiene ${permisos.length} permisos: ${permisos.map(p => p.id_permiso).join(', ')}`);
    console.log(`   (con el filtro sobre los hijos habria buscado id_rol_usuario IN (${permisos.map(p => p.id_permiso).join(', ')})`);

    const plan = await AdminModel.planificarBorrado('rolUsuario', ROL, db);
    await AdminModel.eliminar('rolUsuario', ROL, { conexion: db });

    verificar(plan.cascada[0].cantidad === permisos.length, 'el plan anuncia todos los hijos');
    verificar(await contar(db, 'rol_permiso', 'id_rol_usuario', ROL) === 0,
      `se borraron las ${permisos.length} asignaciones, no 0`);
    verificar(await contar(db, 'rol_usuario', 'id_rol_usuario', ROL) === 0, 'el rol se borro');
  });

  // -------------------------------------------------------- 7. atomicidad
  await enTransaccion(async db => {
    console.log('\n7) Atomicidad: si un paso falla, no queda nada a medias');
    // Un savepoint y no un rollback a secas: el rollback revertiria toda la
    // transaccion y la comparacion daria un falso positivo.
    const [[objetivo]] = await db.query(
      `SELECT v.id_veterinario FROM veterinarios v
       WHERE v.id_empleado IS NOT NULL
         AND EXISTS (SELECT 1 FROM historial_medico h WHERE h.id_veterinario = v.id_veterinario)
       ORDER BY v.id_veterinario LIMIT 1`
    );
    if (!objetivo) {
      console.log('   (no hay veterinario con historial para la prueba)');
      return;
    }
    const VET = objetivo.id_veterinario;
    await db.query('SAVEPOINT antes_de_fallar');
    const antes = {
      historiales: await contar(db, 'historial_medico', 'id_veterinario', VET),
      tratamientos: await contar(db, 'tratamientos'),
      vacunas: await contar(db, 'vacunas', 'id_veterinario', VET)
    };
    // Los historiales y tratamientos ya se habrian borrado cuando explota.
    const dbRoto = new Proxy(db, {
      get(objetivoReal, propiedad) {
        if (propiedad !== 'query') return objetivoReal[propiedad];
        return async (sql, params) => {
          if (/DELETE FROM `vacunas`/.test(sql)) throw new Error('fallo simulado');
          return objetivoReal.query(sql, params);
        };
      }
    });
    try {
      await AdminModel.eliminar('veterinario', VET, { conexion: dbRoto });
      verificar(false, 'debia fallar');
    } catch (error) {
      verificar(error.message === 'fallo simulado', `fallo propagado: "${error.message}"`);
    }
    await db.query('ROLLBACK TO SAVEPOINT antes_de_fallar');
    verificar(await contar(db, 'historial_medico', 'id_veterinario', VET) === antes.historiales,
      'los historiales quedaron intactos');
    verificar(await contar(db, 'tratamientos') === antes.tratamientos, 'los tratamientos quedaron intactos');
    verificar(await contar(db, 'vacunas', 'id_veterinario', VET) === antes.vacunas, 'las vacunas quedaron intactas');
    verificar(await contar(db, 'veterinarios', 'id_veterinario', VET) === 1, 'el veterinario sigue en pie');
  });

  // ---------------------------------------------------- 8. ventas
  await enTransaccion(async db => {
    console.log('\n8) Ventas: lo realizado y lo entregado no se borran');
    const [[pagoRealizado]] = await db.query("SELECT id_pago FROM pagos WHERE estado_pago = 'REALIZADO' ORDER BY id_pago LIMIT 1");
    if (pagoRealizado) {
      try {
        await AdminModel.eliminar('pago', pagoRealizado.id_pago, { conexion: db });
        verificar(false, 'un pago REALIZADO no deberia poder borrarse');
      } catch (error) {
        verificar(error.status === 400 && /realizado/.test(error.message),
          `pago realizado bloqueado: "${error.message}"`);
      }
    }
    const [[pagoPendiente]] = await db.query("SELECT id_pago FROM pagos WHERE estado_pago = 'PENDIENTE' ORDER BY id_pago LIMIT 1");
    if (pagoPendiente) {
      await AdminModel.eliminar('pago', pagoPendiente.id_pago, { conexion: db });
      verificar(await contar(db, 'pagos', 'id_pago', pagoPendiente.id_pago) === 0,
        'un pago PENDIENTE si se puede borrar: es un error de carga, no un comprobante');
    }
    const [[envioEntregado]] = await db.query("SELECT id_envio FROM envios WHERE estado = 'ENTREGADO' ORDER BY id_envio LIMIT 1");
    if (envioEntregado) {
      try {
        await AdminModel.eliminar('envio', envioEntregado.id_envio, { conexion: db });
        verificar(false, 'un envio ENTREGADO no deberia poder borrarse');
      } catch (error) {
        verificar(error.status === 400 && /entregado/.test(error.message),
          `envio entregado bloqueado: "${error.message}"`);
      }
    }
  });

  await enTransaccion(async db => {
    console.log('\n8b) Un pedido arrastra sus pagos, envios y lineas de detalle');
    const [[pedido]] = await db.query('SELECT id_pedido FROM pedidos ORDER BY id_pedido LIMIT 1');
    const ID = pedido.id_pedido;
    const antes = {
      pagos: await contar(db, 'pagos', 'id_pedido', ID),
      envios: await contar(db, 'envios', 'id_pedido', ID),
      detalles: await contar(db, 'detalle_pedidos', 'id_pedido', ID)
    };
    await AdminModel.eliminar('pedido', ID, { conexion: db });
    verificar(await contar(db, 'pedidos', 'id_pedido', ID) === 0, 'el pedido se borro');
    verificar(await contar(db, 'pagos', 'id_pedido', ID) === 0, `sus ${antes.pagos} pagos se borraron`);
    verificar(await contar(db, 'envios', 'id_pedido', ID) === 0, `sus ${antes.envios} envios se borraron`);
    verificar(await contar(db, 'detalle_pedidos', 'id_pedido', ID) === 0,
      `sus ${antes.detalles} lineas de detalle se borraron`);
  });

  await enTransaccion(async db => {
    console.log('\n8c) El estado avanza al siguiente valor valido de su ENUM');
    const casos = [
      ['pago', 'pagos', 'id_pago', 'estado_pago', 'REALIZADO'],
      ['envio', 'envios', 'id_envio', 'estado', 'ENTREGADO'],
      ['pedido', 'pedidos', 'id_pedido', 'estado', 'PENDIENTE']
    ];
    for (const [entidad, tabla, clave, campo, esperado] of casos) {
      const [[fila]] = await db.query(
        `SELECT \`${clave}\` AS id, \`${campo}\` AS estado FROM \`${tabla}\`
         WHERE \`${campo}\` = ? ORDER BY \`${clave}\` LIMIT 1`, [esperado]
      );
      if (!fila) { console.log(`   (no hay ${entidad} en ${esperado})`); continue; }
      const r = await AdminModel.avanzarEstado(entidad, fila.id, { conexion: db });
      verificar(r.anterior === esperado && r.estado !== esperado,
        `${entidad} ${fila.id}: ${esperado} -> ${r.estado}`);
      const [comprobacion] = await db.query(
        `SELECT \`${campo}\` AS estado FROM \`${tabla}\` WHERE \`${clave}\` = ?`, [fila.id]
      );
      verificar(comprobacion[0].estado === r.estado, `${entidad} ${fila.id} quedo persistido como ${r.estado}`);
    }
  });

  conexion.end();
  console.log(`\n${fallos === 0 ? 'TODO OK' : fallos + ' FALLOS'} — la base quedo como estaba`);
  process.exit(fallos === 0 ? 0 : 1);
})();