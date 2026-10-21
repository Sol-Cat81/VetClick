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
const contenedorSucursales = document.querySelector("#sucursales-grid");
const contenedorCategorias = document.querySelector("#categorias-grid");
const contenedorVeterinarios = document.querySelector("#profesionales-grid");

// Endpoints de la API.
const apiClientes = "http://127.0.0.1:3000/api/clientes";
const apiClinica = "http://127.0.0.1:3000/api/clinica";
const apiUsuarios = "http://127.0.0.1:3000/api/usuarios";

const reserva = {
  // Cada seleccion guarda el nombre (para mostrarlo) y el id (para guardarlo
  // en la tabla turnos cuando el backend este conectado).
  id_sucursal: "",
  sucursal: "",
  id_categoria_servicio: "",
  servicio: "",
  id_servicio: "",
  tipo: "",
  id_veterinario: "",
  profesional: "",
  fecha: "",
  hora: "",
};
let pasoActual = 1;
let mesCalendario = new Date();

// Si el visitante tiene sesion. Sin ella no se pueden pedir las mascotas
// propias, asi que el paso 06 avisa y la reserva se pide al confirmar.
let haySesion = false;

// Los servicios de la base, para poder filtrar por categoria sin volver a
// pedirlos cada vez que se elige una.
let serviciosDisponibles = [];

// Los veterinarios de la base, para poder filtrar por la sucursal elegida.
let veterinariosDisponibles = [];

// Las sucursales de la base, con los dias de la semana que atienden. El
// calendario usa esos dias para no ofrecer un dia que la sucursal esta
// cerrada.
let sucursalesDisponibles = [];

// Imagen por defecto para las sucursales que todavia no tienen foto en la base.
// Se reparten por posicion: una sucursal nueva toma la siguiente de la lista.
const IMAGENES_SUCURSAL = [
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1612531385446-f7e6d131a7f4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=900&q=80",
];

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

/* TOAST DE BOOTSTRAP PARA REEMPLAZAR LOS ALERT */
function mostrarToast(mensaje, tipo = "exito") {
  const toastElemento = document.getElementById("miToast");
  const toastCuerpo = document.getElementById("toast-mensaje");

  // 1. Limpiamos las clases de color previas
  toastElemento.classList.remove("text-bg-success", "text-bg-danger");

  // 2. Asignamos el color dependiendo del tipo de mensaje
  if (tipo === "error") {
    toastElemento.classList.add("text-bg-danger");
  } else {
    toastElemento.classList.add("text-bg-success");
  }

  // 3. Insertamos el mensaje enviado
  toastCuerpo.textContent = mensaje;

  // 4. Usamos la API de Bootstrap para inicializar y mostrar el Toast
  const toast = new bootstrap.Toast(toastElemento, { delay: 3500 });
  toast.show();
}

// Dibuja las sucursales que vienen de la base. Antes estaban escritas a mano
// en el HTML y no coincidian con los datos reales (VetClick Centro, Jardin).
async function cargarSucursales() {
  try {
    const respuesta = await fetch(
      "http://127.0.0.1:3000/api/inventario/sucursales",
    );
    if (!respuesta.ok) {
      throw new Error(`Error al obtener las sucursales (${respuesta.status})`);
    }
    const sucursales = await respuesta.json();

    // Solo las activas: no se puede reservar en una sucursal cerrada.
    const disponibles = (sucursales || []).filter((sucursal) => sucursal.activo);
    sucursalesDisponibles = disponibles;

    if (!disponibles.length) {
      contenedorSucursales.innerHTML =
        '<p class="estado-vacio">No hay sucursales disponibles en este momento.</p>';
      return;
    }

    contenedorSucursales.innerHTML = disponibles
      .map((sucursal, indice) => {
        const foto =
          sucursal.img_sucursal ||
          IMAGENES_SUCURSAL[indice % IMAGENES_SUCURSAL.length];
        const direccion = [sucursal.direccion, sucursal.localidad]
          .filter(Boolean)
          .join(", ");

        return `
          <article class="sucursal-card">
            <img src="${escaparHTML(foto)}" alt="Sucursal ${escaparHTML(sucursal.nombre)}"
              onerror="this.onerror=null;this.src='${IMAGENES_SUCURSAL[indice % IMAGENES_SUCURSAL.length]}';" />
            <div>
              <h3>${escaparHTML(sucursal.nombre)}</h3>
              <p><i class="ph ph-map-pin"></i> ${escaparHTML(direccion)}</p>
              <p><i class="ph ph-clock"></i> ${escaparHTML(sucursal.horario || "Horario a confirmar")}</p>
              <button class="boton-seleccionar" data-action="branch"
                data-id="${escaparHTML(sucursal.id_sucursal)}"
                data-value="${escaparHTML(sucursal.nombre)}">Seleccionar</button>
            </div>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error al obtener las sucursales:", error);
    contenedorSucursales.innerHTML =
      '<p class="estado-vacio">No se pudieron cargar las sucursales. Probá de nuevo en un momento.</p>';
    mostrarToast("No se pudieron cargar las sucursales", "error");
  }
}

// Dibuja el paso 02: las categorias de servicio de la base.
async function cargarCategorias() {
  try {
    const respuesta = await fetch(
      "http://127.0.0.1:3000/api/clinica/categorias-servicios",
    );
    if (!respuesta.ok) {
      throw new Error(`Error al obtener las categorías (${respuesta.status})`);
    }
    const categorias = await respuesta.json();

    contenedorCategorias.innerHTML = (categorias || [])
      .map(
        (categoria) => `
        <button class="opcion-card" data-action="service"
          data-id="${escaparHTML(categoria.id_categoria_servicio)}"
          data-value="${escaparHTML(categoria.nombre)}">
          <i class="ph ph-stethoscope"></i><strong>${escaparHTML(categoria.nombre)}</strong>
        </button>
      `,
      )
      .join("");
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    contenedorCategorias.innerHTML =
      '<p class="estado-vacio">No se pudieron cargar los servicios. Probá de nuevo en un momento.</p>';
    mostrarToast("No se pudieron cargar los servicios", "error");
  }
}

// Trae los servicios de la base y los guarda, para poder filtrar por
// categoria en el paso 03 sin volver a pedirlos.
async function cargarServicios() {
  try {
    const respuesta = await fetch("http://127.0.0.1:3000/api/clinica/servicios");
    if (!respuesta.ok) {
      throw new Error(`Error al obtener los servicios (${respuesta.status})`);
    }
    const servicios = await respuesta.json();
    // Solo los activos: un servicio dado de baja no se ofrece.
    serviciosDisponibles = (servicios || []).filter((servicio) => servicio.activo);
  } catch (error) {
    console.error("Error al obtener los servicios:", error);
    serviciosDisponibles = [];
    mostrarToast("No se pudieron cargar los servicios", "error");
  }
}

// El precio viene de MySQL como string ("8500.00"): se convierte a numero
// antes de formatearlo, si no Intl lo mostraria tal cual.
function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(precio) || 0);
}

// Dibuja el paso 03: los servicios de la categoria elegida.
function cargarTipos() {
  const idCategoria = Number(reserva.id_categoria_servicio);
  const servicios = serviciosDisponibles.filter(
    (servicio) => Number(servicio.id_categoria_servicio) === idCategoria,
  );

  const contenedor = document.querySelector("#tipo-servicio");

  if (!servicios.length) {
    contenedor.innerHTML =
      '<p class="estado-vacio">No hay servicios disponibles en esta categoría.</p>';
    return;
  }

  contenedor.innerHTML = servicios
    .map(
      (servicio) => `
      <button class="tipo-opcion" data-action="type"
        data-id="${escaparHTML(servicio.id_servicio)}"
        data-value="${escaparHTML(servicio.nombre)}">
        <span class="tipo-opcion-datos">
          <strong>${escaparHTML(servicio.nombre)}</strong>
          ${servicio.descripcion ? `<small>${escaparHTML(servicio.descripcion)}</small>` : ""}
        </span>
        <span class="tipo-opcion-precio">$${escaparHTML(formatearPrecio(servicio.precio))}</span>
      </button>
    `,
    )
    .join("");
}

// Trae los veterinarios de la base y los guarda, para poder filtrar por la
// sucursal elegida sin volver a pedirlos.
async function cargarVeterinarios() {
  try {
    const respuesta = await fetch(
      "http://127.0.0.1:3000/api/personal/veterinarios",
    );
    if (!respuesta.ok) {
      throw new Error(`Error al obtener los profesionales (${respuesta.status})`);
    }
    const veterinarios = await respuesta.json();
    veterinariosDisponibles = veterinarios || [];
    pintarVeterinarios();
  } catch (error) {
    console.error("Error al obtener los profesionales:", error);
    contenedorVeterinarios.innerHTML =
      '<p class="estado-vacio">No se pudieron cargar los profesionales. Probá de nuevo en un momento.</p>';
    mostrarToast("No se pudieron cargar los profesionales", "error");
  }
}

// Dibuja los profesionales de la sucursal elegida. Cada veterinario atiende en
// una sola sucursal, asi que la lista se filtra por la del paso 01.
function pintarVeterinarios() {
  const idSucursal = Number(reserva.id_sucursal);
  const disponibles = veterinariosDisponibles.filter(
    (vet) => Number(vet.id_sucursal) === idSucursal,
  );

  if (!disponibles.length) {
    contenedorVeterinarios.innerHTML =
      '<p class="estado-vacio">Esta sucursal no tiene profesionales disponibles. Elegí otra sucursal.</p>';
    return;
  }

  contenedorVeterinarios.innerHTML = disponibles
    .map(
      (vet) => `
      <button class="profesional-card" data-action="vet"
        data-id="${escaparHTML(vet.id_veterinario)}"
        data-value="${escaparHTML(vet.veterinario)}">
        <span class="avatar">${escaparHTML(iniciales(vet.veterinario))}</span>
        <strong>${escaparHTML(vet.veterinario)}</strong>
        <small>${escaparHTML(vet.especialidad || "—")}</small>
      </button>
    `,
    )
    .join("");
}

// Iniciales del nombre: "Lucia Fernandez" -> "LF".
function iniciales(nombre) {
  const partes = String(nombre || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!partes.length) return "?";
  const primera = partes[0][0] || "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primera + ultima).toUpperCase();
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

// Los dias de la semana que atiende la sucursal elegida. Si todavia no se
// eligio ninguna (o su horario no se pudo leer), se ofrecen todos: es
// preferible mostrar dias de mas que dejar la agenda vacia.
function diasDeAtencion() {
  const sucursal = sucursalesDisponibles.find(
    (item) => Number(item.id_sucursal) === Number(reserva.id_sucursal),
  );
  const dias = sucursal?.dias_atencion;
  return Array.isArray(dias) && dias.length ? dias : [0, 1, 2, 3, 4, 5, 6];
}

function renderCalendario() {
  const calendario = document.querySelector("#calendario");
  const year = mesCalendario.getFullYear();
  const month = mesCalendario.getMonth();
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0).getDate();
  const inicio = (primerDia.getDay() + 6) % 7;
  const hoy = new Date();
  const atencion = diasDeAtencion();
  let dias = ["L", "M", "X", "J", "V", "S", "D"]
    .map((dia) => `<strong>${dia}</strong>`)
    .join("");
  for (let i = 0; i < inicio; i += 1) dias += "<span></span>";
  for (let dia = 1; dia <= ultimoDia; dia += 1) {
    const fecha = new Date(year, month, dia);
    // Un dia es disponible si no esta pasado y la sucursal atiende ese dia de
    // la semana (la sucursal pueden ser "Lun a Vie" o "Mar a Dom").
    const disponible =
      fecha >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) &&
      atencion.includes(fecha.getDay());
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

// Pide los horarios libres de una fecha. El backend los arma con el horario de
// atencion de la sucursal y les saca los que ya tienen un turno.
async function cargarHorarios(fecha) {
  const contenedorHorarios = document.querySelector("#horarios-disponibles");
  contenedorHorarios.innerHTML =
    '<span class="estado-vacio">Buscando horarios...</span>';

  const parametros = new URLSearchParams({
    fecha,
    id_sucursal: reserva.id_sucursal,
    id_veterinario: reserva.id_veterinario,
  });

  try {
    const respuesta = await fetch(
      `http://127.0.0.1:3000/api/clinica/horarios-disponibles?${parametros}`,
    );
    if (!respuesta.ok) {
      throw new Error(`Error al obtener los horarios (${respuesta.status})`);
    }
    const { horarios } = await respuesta.json();

    if (!horarios || !horarios.length) {
      contenedorHorarios.innerHTML =
        '<span class="estado-vacio">No hay horarios disponibles para ese día.</span>';
      contenedorHorarios.dataset.date = fecha;
      return;
    }

    contenedorHorarios.innerHTML = horarios
      .map(
        (hora) =>
          `<button type="button" class="horario ${reserva.hora === hora ? "seleccionado" : ""}" data-time="${escaparHTML(hora)}">${escaparHTML(hora)}</button>`,
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
  } catch (error) {
    console.error("Error al obtener los horarios:", error);
    contenedorHorarios.innerHTML =
      '<span class="estado-vacio">No se pudieron cargar los horarios. Probá de nuevo en un momento.</span>';
    mostrarToast("No se pudieron cargar los horarios", "error");
  }
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
    const campo = acciones[accion.dataset.action];
    guardarSeleccion(campo, accion.dataset.value);
    // Cada seleccion guarda su id, para poder guardarlo en la tabla turnos
    // cuando el backend este conectado. Con el nombre no alcanza: dos
    // sucursales o dos servicios pueden llamarse igual.
    if (campo === "sucursal") {
      reserva.id_sucursal = Number(accion.dataset.id) || "";
      // Cambiar la sucursal cambia los profesionales disponibles: se repinta el
      // paso 04 y se limpia el que estaba elegido, que era de otra sucursal.
      // Sin esto se podria reservar en una sucursal con un profesional de otra.
      reserva.profesional = "";
      reserva.id_veterinario = "";
      pintarVeterinarios();
      // La fecha y la hora tambien dependen de la sucursal: cada una atiende
      // dias y franjas distintas, asi que se limpian y el calendario se
      // repinta con los dias de atencion de la nueva sucursal.
      reserva.fecha = "";
      reserva.hora = "";
      renderCalendario();
      const contenedorHorarios = document.querySelector("#horarios-disponibles");
      if (contenedorHorarios) {
        contenedorHorarios.innerHTML =
          '<span class="estado-vacio">Elegí una fecha para ver los horarios.</span>';
      }
    }
    if (campo === "servicio") {
      reserva.id_categoria_servicio = Number(accion.dataset.id) || "";
    }
    if (campo === "tipo") {
      reserva.id_servicio = Number(accion.dataset.id) || "";
    }
    if (campo === "profesional") {
      reserva.id_veterinario = Number(accion.dataset.id) || "";
      // Los horarios ocupados dependen del profesional: si ya se habia elegido
      // una fecha, se vuelven a pedir para el nuevo.
      if (reserva.fecha) cargarHorarios(reserva.fecha);
    }
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

// Las mascotas del cliente logueado, para el select del paso 06.
async function cargarMisMascotas() {
  const select = document.getElementById("selectMascota");
  if (!select) return;

  try {
    const respuesta = await fetch(`${apiClientes}/mis-mascotas`, {
      credentials: "include",
    });

    if (respuesta.status === 401) {
      // Sin sesion no hay mascotas propias: el select queda avisando y la
      // reserva se pide al confirmar.
      haySesion = false;
      select.innerHTML =
        '<option value="">Iniciá sesión para ver tus mascotas</option>';
      return;
    }
    if (!respuesta.ok) {
      throw new Error(`Error al obtener las mascotas (${respuesta.status})`);
    }

    haySesion = true;
    const { mascotas } = await respuesta.json();

    if (!mascotas || !mascotas.length) {
      select.innerHTML =
        '<option value="">No tenés mascotas registradas</option>';
      return;
    }

    select.innerHTML = mascotas
      .map(
        (mascota) => `
        <option value="${escaparHTML(mascota.id_mascota)}">
          ${escaparHTML(mascota.nombre)} (${escaparHTML(mascota.especie || "especie")}) - ${escaparHTML(mascota.raza || "sin raza")}
        </option>
      `,
      )
      .join("");
  } catch (error) {
    console.error("Error al obtener las mascotas:", error);
    select.innerHTML =
      '<option value="">No se pudieron cargar tus mascotas</option>';
  }
}

// Las razas, para el alta rapida de una mascota.
async function cargarRazas() {
  const select = document.getElementById("selectRaza");
  if (!select) return;
  try {
    const respuesta = await fetch(`${apiClientes}/razas`);
    if (!respuesta.ok) return;
    const razas = await respuesta.json();
    select.innerHTML = razas
      .map(
        (raza) => `<option value="${escaparHTML(raza.id_raza)}">${escaparHTML(raza.nombre)}</option>`,
      )
      .join("");
  } catch (error) {
    console.error("Error al obtener las razas:", error);
  }
}

// Registra una mascota propia y la deja elegida en el select.
async function guardarMascota() {
  const nombre = document.getElementById("inputNombreMascota").value.trim();
  const idRaza = Number(document.getElementById("selectRaza").value);
  const sexo = document.getElementById("selectSexo").value;

  if (!nombre) {
    mostrarToast("Escribí el nombre de la mascota", "error");
    return;
  }

  const boton = document.getElementById("guardarMascota");
  boton.disabled = true;

  try {
    const respuesta = await fetch(`${apiClientes}/mis-mascotas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ nombre, id_raza: idRaza, sexo }),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(cuerpo.mensaje || "No se pudo registrar la mascota");
    }

    mostrarToast(cuerpo.mensaje || "Mascota registrada", "exito");
    document.getElementById("altaMascota").hidden = true;
    document.getElementById("inputNombreMascota").value = "";
    await cargarMisMascotas();
    // La mascota nueva queda elegida: es la que el cliente acaba de registrar.
    const select = document.getElementById("selectMascota");
    if (select && cuerpo.id_mascota) select.value = String(cuerpo.id_mascota);
  } catch (error) {
    console.error("Error al registrar la mascota:", error);
    mostrarToast(error.message || "No se pudo registrar la mascota", "error");
  } finally {
    boton.disabled = false;
  }
}

// Los datos del turno, listos para mandarse al backend.
function armarDatosTurno() {
  return {
    id_mascota: Number(document.getElementById("selectMascota").value),
    id_servicio: Number(reserva.id_servicio),
    id_categoria_servicio: Number(reserva.id_categoria_servicio),
    id_sucursal: Number(reserva.id_sucursal),
    id_veterinario: Number(reserva.id_veterinario),
    fecha: reserva.fecha,
    hora: reserva.hora,
    motivo: document.getElementById("inputMotivo").value.trim(),
    // Los nombres y la categoria viajan con los ids: si la reserva queda
    // pendiente (el cliente va al login y vuelve), se pueden reponer sin
    // volver a buscar cada dato en la base.
    sucursal: reserva.sucursal,
    servicio: reserva.servicio,
    tipo: reserva.tipo,
    profesional: reserva.profesional,
  };
}

// Pinta la confirmacion con los datos que devolvio el backend.
function mostrarTurnoConfirmado(turno) {
  const fechaLegible = formatoFecha(new Date(`${turno.fecha}T12:00:00`));
  document.querySelector('.turno-seccion[data-step="6"]').innerHTML = `
    <div class="turno-confirmado">
      <p class="eyebrow">Reserva confirmada</p>
      <h2>¡Te esperamos!</h2>
      <p>
        Tu turno para <strong>${escaparHTML(turno.mascota)}</strong>
        (${escaparHTML(turno.especie || "")}) en <strong>${escaparHTML(turno.sucursal)}</strong>
        quedó reservado para el ${escaparHTML(fechaLegible)} a las ${escaparHTML(turno.hora)}.
      </p>
      <p>Te atiende ${escaparHTML(turno.veterinario || "el profesional elegido")} · ${escaparHTML(turno.servicio || "")}</p>
      <p class="turno-confirmado-nota">
        Estado de la reserva: ${escaparHTML(turno.estado || "PENDIENTE")}.
        Te contactamos para confirmar los detalles.
      </p>
    </div>
  `;
  document.querySelector(".turnos-navegacion").hidden = true;
}

document.querySelector("#datos-form").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  // Sin fecha u hora, formatoFecha(new Date("T12:00:00")) tira RangeError
  // (Invalid time value) y deja la pagina con un error no controlado.
  if (!reserva.fecha || !reserva.hora) {
    mensaje.textContent = "Elegí una fecha y un horario antes de confirmar.";
    return;
  }

  const motivo = document.getElementById("inputMotivo").value.trim();
  if (!motivo) {
    mostrarToast("Contanos el motivo de la consulta", "error");
    return;
  }

  const datos = armarDatosTurno();

  // Sin sesion no se puede elegir la mascota (las Mascotas del cliente se
  // piden con la cookie), pero el cliente no tiene por que perder lo que ya
  // eligio: se guarda la reserva y se lo manda al login, que lo devuelve aca.
  if (!haySesion) {
    localStorage.setItem("turno-pendiente", JSON.stringify(datos));
    window.location.href = "../login.html?volver=pages/turnos.html";
    return;
  }

  if (!datos.id_mascota) {
    mostrarToast("Elegí la mascota del turno", "error");
    return;
  }

  const boton = evento.currentTarget.querySelector('button[type="submit"]');
  boton.disabled = true;

  try {
    const respuesta = await fetch(`${apiClinica}/turnos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(datos),
    });

    // Si la sesion vencio entre medio, el backend responde 401: se guarda la
    // reserva y se manda al login en vez de perderla.
    if (respuesta.status === 401) {
      localStorage.setItem("turno-pendiente", JSON.stringify(datos));
      window.location.href = "../login.html?volver=pages/turnos.html";
      return;
    }

    const cuerpo = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(cuerpo.mensaje || "No se pudo reservar el turno");
    }

    localStorage.removeItem("turno-pendiente");
    mostrarTurnoConfirmado(cuerpo);
  } catch (error) {
    console.error("Error al reservar el turno:", error);
    mostrarToast(error.message || "No se pudo reservar el turno", "error");
  } finally {
    boton.disabled = false;
  }
});

// Abrir y cerrar el alta rapida de una mascota.
document.getElementById("agregarMascota").addEventListener("click", () => {
  const alta = document.getElementById("altaMascota");
  alta.hidden = !alta.hidden;
  if (!alta.hidden) document.getElementById("inputNombreMascota").focus();
});
document.getElementById("guardarMascota").addEventListener("click", guardarMascota);

// Recupera una reserva que quedo pendiente antes de ir al login. El login
// manda a index, asi que sin esto el cliente perderia todo lo que eligio.
async function recuperarReservaPendiente() {
  const pendiente = localStorage.getItem("turno-pendiente");
  if (!pendiente) return;

  let datos;
  try {
    datos = JSON.parse(pendiente);
  } catch (error) {
    localStorage.removeItem("turno-pendiente");
    return;
  }

  // Sin sesion todavia no se puede confirmar: se deja la reserva guardada.
  const comprobacion = await fetch(`${apiUsuarios}/verificarsession`, {
    credentials: "include",
  });
  if (!comprobacion.ok) return;

  localStorage.removeItem("turno-pendiente");

  // La pagina se recargó al volver del login: la reserva vuelve a_armarse con
  // los ids, para que el cliente vea lo que habia elegido y solo tenga que
  // confirmar.
  reserva.id_sucursal = String(datos.id_sucursal || "");
  reserva.id_categoria_servicio = String(datos.id_categoria_servicio || "");
  reserva.id_servicio = String(datos.id_servicio || "");
  reserva.id_veterinario = String(datos.id_veterinario || "");
  reserva.fecha = datos.fecha || "";
  reserva.hora = datos.hora || "";

  const sucursal = sucursalesDisponibles.find(
    (item) => Number(item.id_sucursal) === Number(datos.id_sucursal),
  );
  reserva.sucursal = sucursal?.nombre || datos.sucursal || "";
  const servicio = serviciosDisponibles.find(
    (item) => Number(item.id_servicio) === Number(datos.id_servicio),
  );
  reserva.tipo = servicio?.nombre || datos.tipo || "";
  reserva.servicio = servicio?.categoria || datos.servicio || "";
  const veterinario = veterinariosDisponibles.find(
    (item) => Number(item.id_veterinario) === Number(datos.id_veterinario),
  );
  reserva.profesional = veterinario?.veterinario || datos.profesional || "";

  const motivo = document.getElementById("inputMotivo");
  motivo.value = datos.motivo || "";

  // Se vuelve al paso 06 con todo lo elegido a la vista.
  renderCalendario();
  mostrarPaso(6);
  actualizarNavegacion();
  actualizarResumen();

  // Si la reserva ya traia mascota (el cliente la habia elegido con sesion),
  // se puede confirmar directo.
  if (!datos.id_mascota) {
    mostrarToast("Elegí tu mascota y confirmá el turno", "error");
    return;
  }

  try {
    const respuesta = await fetch(`${apiClinica}/turnos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));

    if (respuesta.ok) {
      mostrarTurnoConfirmado(cuerpo);
      mostrarToast("Tu turno quedó reservado", "exito");
    } else {
      mostrarToast(cuerpo.mensaje || "No se pudo reservar el turno", "error");
    }
  } catch (error) {
    console.error("Error al recuperar la reserva:", error);
    mostrarToast("No se pudo reservar el turno", "error");
  }
}


renderCalendario();
mostrarPaso(1);
cargarSucursales();
// Los servicios se cargan antes que las categorias: el paso 03 filtra de
// ellos, y hace falta que esten listos cuando el usuario elija una categoria.
cargarServicios().then(cargarCategorias);
// Los veterinarios tambien se filtran por la sucursal del paso 01.
cargarVeterinarios();
// El paso 06 necesita las mascotas del cliente y las razones del alta rapida.
cargarMisMascotas();
cargarRazas();
// Si el cliente volvio del login con una reserva a medio hacer, se termina
// sola: no pierde lo que eligio.
recuperarReservaPendiente();
