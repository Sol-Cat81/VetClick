// Estados de la adopcion y de la ficha de la mascota.
//
// Son dos maquinas de estado distintas que se tocan en un solo punto, asi que
// el mapeo vive aca y no duplicado en cada modelo:
//
//   adopciones.estado            mascotas_adopcion.estado
//   ------------------            --------------------------
//   EN_CURSO      <---------->   EN_TRAMITE
//   COMPLETADA    <---------->   ADOPTADO
//   CANCELADA     <---------->   EN_ADOPCION
//
// La ficha dice si la mascota esta disponible para adoptar. El tramite dice
// como avanza la solicitud. Cuando un cliente pide adoptar, la mascota pasa a
// EN_TRAMITE y sale de la pagina publica: no se puede adoptar dos veces la
// misma mascota.
const ESTADO_MASCOTA_SEGUN_ADOPCION = {
  EN_CURSO: 'EN_TRAMITE',
  COMPLETADA: 'ADOPTADO',
  CANCELADA: 'EN_ADOPCION'
};

// Que estado de la ficha corresponde al estado del tramite. Devuelve null si
// el estado del tramite no tiene equivalente.
const estadoMascotaSegunAdopcion = (estadoAdopcion) =>
  ESTADO_MASCOTA_SEGUN_ADOPCION[String(estadoAdopcion ?? '').toUpperCase()] || null;

// Escribe el estado de la mascota. Devuelve false si no hay nada que
// sincronizar (estado de tramite desconocido o mascota invalida).
const sincronizarEstadoMascota = async (db, estadoAdopcion, idMascota) => {
  const estadoMascota = estadoMascotaSegunAdopcion(estadoAdopcion);
  if (!estadoMascota) return false;

  const id = Number(idMascota);
  if (!Number.isInteger(id) || id <= 0) return false;

  await db.query(
    'UPDATE mascotas_adopcion SET estado = ? WHERE id_mascota_adopcion = ?',
    [estadoMascota, id]
  );
  return true;
};

module.exports = {
  ESTADO_MASCOTA_SEGUN_ADOPCION,
  estadoMascotaSegunAdopcion,
  sincronizarEstadoMascota
};
