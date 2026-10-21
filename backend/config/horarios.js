// El horario de atencion de la sucursal es texto libre: "Lun a Sab 09:00 a
// 20:00". Vive asi porque es lo que el panel muestra, pero para la pagina de
// turnos hay que saber que dias atiende y en que franja.
//
// El parseo esta aca, en un solo lugar, y solo se acepta un formato
// reconocible. Si el texto no se puede parsear, la sucursal no ofrece
// horarios: es preferible a mostrar una agenda inventada.
//
// Formato esperado: "<Dia> a <Dia> <HH:MM> a <HH:MM>".

// Los dias de la semana, con el numero que usa Date.getDay() (domingo = 0).
const DIAS_SEMANA = {
  dom: 0,
  lun: 1,
  mar: 2,
  mie: 3,
  jue: 4,
  vie: 5,
  sab: 6,
};

const parsearHorario = (texto) => {
  const patron = /^\s*([a-zA-Zñ]+)\s+a\s+([a-zA-Zñ]+)\s+(\d{1,2}):(\d{2})\s+a\s+(\d{1,2}):(\d{2})\s*$/;
  const coincide = patron.exec(String(texto || ""));
  if (!coincide) return null;

  const [, diaDesde, diaHasta, horaInicio, minutoInicio, horaFin, minutoFin] = coincide;

  const desde = DIAS_SEMANA[diaDesde.slice(0, 3).toLowerCase()];
  const hasta = DIAS_SEMANA[diaHasta.slice(0, 3).toLowerCase()];
  if (desde === undefined || hasta === undefined) return null;

  const inicio = Number(horaInicio) * 60 + Number(minutoInicio);
  const fin = Number(horaFin) * 60 + Number(minutoFin);
  if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin <= inicio) return null;

  return { desde, hasta, inicio, fin };
};

// Los dias de la semana que atiende la sucursal, como los numeros de
// Date.getDay(). Si el horario no se puede parsear, se devuelven todos: es
// preferible ofrecer dias de mas que dejar la agenda vacia.
const diasDeAtencion = (texto) => {
  const franja = parsearHorario(texto);
  if (!franja) return [0, 1, 2, 3, 4, 5, 6];

  // El rango puede dar la vuelta: "Mar a Dom" va del martes (2) al domingo
  // (0), y el domingo es 0. Un bucle normal de 2 a 0 no correria ninguna vez.
  const dias = [];
  let dia = franja.desde;
  for (let i = 0; i < 7; i += 1) {
    dias.push(dia);
    if (dia === franja.hasta) break;
    dia = (dia + 1) % 7;
  }
  return dias;
};

module.exports = { DIAS_SEMANA, parsearHorario, diasDeAtencion };
