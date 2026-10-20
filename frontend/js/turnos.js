// Reemplaza los caracteres que pueden modificar el marcado. Se usa en todo
// lo que se arma con innerHTML: sin esto, un nombre con "<" rompe la pagina.
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

const secciones = [...document.querySelectorAll(".turno-seccion")];
const indicadores = [...document.querySelectorAll("[data-step-indicator]")];
const siguiente = document.querySelector("#siguiente");
const anterior = document.querySelector("#anterior");
const mensaje = document.querySelector("#mensaje-turno");
const reserva = {
  sucursal: "",
  servicio: "",
  tipo: "",
  profesional: "",
  fecha: "",
  hora: "",
};
let pasoActual = 1;
let mesCalendario = new Date();

function mostrarPaso(paso) {
  pasoActual = paso;
  secciones.forEach((seccion) => {
    const activo = Number(seccion.dataset.step) === paso;
    seccion.hidden = !activo;
    seccion.classList.toggle("activa", activo);
  });
  indicadores.forEach((indicador) => {
    const numero = Number(indicador.dataset.stepIndicator);
    indicador.classList.toggle("paso-activo", numero === paso);
    indicador.classList.toggle("paso-completado", numero < paso);
  });
  anterior.hidden = paso === 1;
  siguiente.hidden = paso === 6;
  actualizarNavegacion();
  mensaje.textContent = "";
  actualizarResumen();
  window.scrollTo({
    top: document.querySelector(".turnos-main").offsetTop - 20,
    behavior: "smooth",
  });
}

function actualizarNavegacion() {
  siguiente.disabled = !pasoCompleto(pasoActual);
}

function pasoCompleto(paso) {
  if (paso === 1) return Boolean(reserva.sucursal);
  if (paso === 2) return Boolean(reserva.servicio);
  if (paso === 3) return Boolean(reserva.tipo);
  if (paso === 4) return Boolean(reserva.profesional);
  if (paso === 5) return Boolean(reserva.fecha && reserva.hora);
  return true;
}

function guardarSeleccion(campo, valor) {
  reserva[campo] = valor;
  const siguientePaso = pasoActual + 1;
  if (siguientePaso <= 6) mostrarPaso(siguientePaso);
}

function cargarTipos() {
  const opciones = {
    Veterinaria: [
      "Consulta general",
      "Control de salud",
      "Consulta dermatológica",
    ],
    Peluquería: ["Baño y secado", "Corte de pelo", "Corte de garras"],
    Vacunación: ["Plan de vacunación", "Refuerzo anual", "Desparasitación"],
    Estudios: ["Análisis clínico", "Ecografía", "Radiografía"],
  };
  document.querySelector("#tipo-servicio").innerHTML = opciones[
    reserva.servicio
  ]
    .map(
      (tipo) =>
        `<button class="tipo-opcion" data-action="type" data-value="${tipo}">${tipo}<i class="ph ph-arrow-right"></i></button>`,
    )
    .join("");
}

function formatoFecha(fecha) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
}

function fechaClave(fecha) {
  // Formato local, no toISOString(): ese pasa la fecha a UTC y en Argentina
  // (UTC-3) un dia a la tarde se convierte en el dia siguiente.
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function renderCalendario() {
  const calendario = document.querySelector("#calendario");
  const year = mesCalendario.getFullYear();
  const month = mesCalendario.getMonth();
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0).getDate();
  const inicio = (primerDia.getDay() + 6) % 7;
  const hoy = new Date();
  let dias = ["L", "M", "X", "J", "V", "S", "D"]
    .map((dia) => `<strong>${dia}</strong>`)
    .join("");
  for (let i = 0; i < inicio; i += 1) dias += "<span></span>";
  for (let dia = 1; dia <= ultimoDia; dia += 1) {
    const fecha = new Date(year, month, dia);
    const disponible =
      fecha >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) &&
      fecha.getDay() !== 0;
    const seleccionado = reserva.fecha === fechaClave(fecha);
    const esHoy = fechaClave(fecha) === fechaClave(hoy);
    dias += `<button class="dia-calendario ${disponible ? "disponible" : ""} ${seleccionado ? "seleccionado" : ""} ${esHoy ? "hoy" : ""}" data-date="${fechaClave(fecha)}" ${disponible ? "" : "disabled"}>${dia}</button>`;
  }
  calendario.innerHTML = `<div class="calendario-cabecera"><button type="button" data-month="prev" aria-label="Mes anterior">‹</button><span>${new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(primerDia)}</span><button type="button" data-month="next" aria-label="Mes siguiente">›</button></div><div class="calendario-dias">${dias}</div>`;
  calendario.querySelectorAll("[data-date]").forEach((dia) => {
    dia.addEventListener("click", () => {
      reserva.fecha = dia.dataset.date;
      reserva.hora = "";
      cargarHorarios(reserva.fecha);
      renderCalendario();
      actualizarNavegacion();
    });
  });
  calendario.querySelectorAll("[data-month]").forEach((boton) => {
    boton.addEventListener("click", () => {
      mesCalendario.setMonth(
        mesCalendario.getMonth() + (boton.dataset.month === "next" ? 1 : -1),
      );
      renderCalendario();
    });
  });
}

function cargarHorarios(fecha) {
  const horarios = ["09:00", "10:30", "12:00", "15:00", "16:30", "18:00"];
  const contenedorHorarios = document.querySelector("#horarios-disponibles");
  contenedorHorarios.innerHTML = horarios
    .map(
      (hora) =>
        `<button type="button" class="horario ${reserva.hora === hora ? "seleccionado" : ""}" data-time="${hora}">${hora}</button>`,
    )
    .join("");
  contenedorHorarios.dataset.date = fecha;
  contenedorHorarios.querySelectorAll(".horario").forEach((boton) => {
    boton.addEventListener("click", () => {
      reserva.hora = boton.dataset.time;
      contenedorHorarios
        .querySelectorAll(".horario")
        .forEach((opcion) =>
          opcion.classList.toggle("seleccionado", opcion === boton),
        );
      actualizarNavegacion();
      actualizarResumen();
    });
  });
}

function actualizarResumen() {
  const resumen = document.querySelector("#resumen-datos");
  const datos = [
    ["Sucursal", reserva.sucursal],
    ["Servicio", reserva.servicio],
    ["Atención", reserva.tipo],
    ["Profesional", reserva.profesional],
    [
      "Fecha",
      reserva.fecha
        ? formatoFecha(new Date(`${reserva.fecha}T12:00:00`))
        : "Pendiente",
    ],
    ["Hora", reserva.hora || "Pendiente"],
  ];
  resumen.innerHTML = datos
    .map(
      ([titulo, valor]) =>
        `<div><dt>${escaparHTML(titulo)}</dt><dd>${escaparHTML(valor || "Pendiente")}</dd></div>`,
    )
    .join("");
}

document.addEventListener("click", (evento) => {
  const accion = evento.target.closest("[data-action]");
  if (accion) {
    const acciones = {
      branch: "sucursal",
      service: "servicio",
      type: "tipo",
      vet: "profesional",
    };
    guardarSeleccion(acciones[accion.dataset.action], accion.dataset.value);
    if (accion.dataset.action === "service") cargarTipos();
    return;
  }
  const cambioMes = evento.target.closest("[data-month]");
  if (cambioMes) {
    mesCalendario.setMonth(
      mesCalendario.getMonth() + (cambioMes.dataset.month === "next" ? 1 : -1),
    );
    renderCalendario();
  }
});

siguiente.addEventListener("click", () => {
  if (!pasoCompleto(pasoActual)) {
    mensaje.textContent = "Completá esta selección para continuar.";
    return;
  }
  if (pasoActual === 2) cargarTipos();
  mostrarPaso(Math.min(pasoActual + 1, 6));
});

anterior.addEventListener("click", () =>
  mostrarPaso(Math.max(pasoActual - 1, 1)),
);

document.querySelector("#datos-form").addEventListener("submit", (evento) => {
  evento.preventDefault();

  // Sin fecha u hora, formatoFecha(new Date("T12:00:00")) tira RangeError
  // (Invalid time value) y deja la pagina con un error no controlado.
  if (!reserva.fecha || !reserva.hora) {
    mensaje.textContent = "Elegí una fecha y un horario antes de confirmar.";
    return;
  }

  const datos = new FormData(evento.currentTarget);
  const nombre = datos.get("nombre");
  const fechaLegible = formatoFecha(new Date(`${reserva.fecha}T12:00:00`));
  document.querySelector('.turno-seccion[data-step="6"]').innerHTML =
    `<div class="turno-confirmado"><p class="eyebrow">Reserva confirmada</p><h2>¡Te esperamos, ${escaparHTML(nombre)}!</h2><p>Tu turno para ${escaparHTML(reserva.sucursal)} quedó reservado para el ${escaparHTML(fechaLegible)} a las ${escaparHTML(reserva.hora)}.</p></div>`;
  document.querySelector(".turnos-navegacion").hidden = true;
});

renderCalendario();
mostrarPaso(1);
