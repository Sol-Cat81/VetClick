// Endpoint de la seccion publica de adopciones.
const apiClientes = 'http://127.0.0.1:3000/api/clientes';
const apiUsuarios = 'http://127.0.0.1:3000/api/usuarios';

// Contenedor donde se insertan las cards de las mascotas.
const contenedorAdopciones = document.querySelector('.contenedor-adopciones');
// Aviso que se muestra cuando no hay ninguna mascota disponible.
const estadoVacio = document.getElementById('estadoVacio');
// Modal de adopcion.
const modalAdopcion = document.getElementById('modalAdopcion');
const formAdopcion = document.getElementById('formAdopcion');
const motivoAdopcion = document.getElementById('motivoAdopcion');
const contadorMotivo = document.getElementById('contadorMotivo');
const nombreMascotaModal = document.getElementById('nombreMascotaModal');
const enviarAdopcion = document.getElementById('enviarAdopcion');

// Imagen por defecto cuando la mascota no tiene una foto valida.
const imagenMascotaPorDefecto =
  'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80';

// La mascota que se esta adoptando. La guarda el modal mientras esta abierto.
let mascotaSeleccionada = null;
// Si el usuario ya tiene sesion. Se consulta una vez al cargar la pagina.
let haySesion = false;

/*==========================================

       = = = = = FUNCIONES = = = = =

============================================*/

function escaparHTML(valor) {
    // Reemplaza los caracteres que pueden modificar el marcado de las cards.
    return String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// La edad viene como texto libre ("6 meses", "1 ano"). Si no hay, no se muestra.
function formatearEdad(edad) {
    const limpio = String(edad ?? '').trim();
    return limpio || null;
}

function iconoSexo(sexo) {
    // Los iconos de sexo de Phosphor se llaman ph-gender-female / ph-gender-male.
    return String(sexo ?? '').toUpperCase() === 'HEMBRA' ? 'ph-gender-female' : 'ph-gender-male';
}

/* TOAST DE BOOSTRAP PARA REEMPLAZAR LOS ALERT */
function mostrarToast(mensaje, tipo = 'exito') {
    const toastElemento = document.getElementById('miToast');
    const toastCuerpo = document.getElementById('toast-mensaje');

    // 1. Limpiamos las clases de color previas
    toastElemento.classList.remove('text-bg-success', 'text-bg-danger');

    // 2. Asignamos el color dependiendo del tipo de mensaje
    if (tipo === 'error') {
        toastElemento.classList.add('text-bg-danger'); // Fondo rojo
    } else {
        toastElemento.classList.add('text-bg-success'); // Fondo verde
    }

    // 3. Insertamos el mensaje enviado
    toastCuerpo.textContent = mensaje;

    // 4. Usamos la API de Bootstrap para inicializar y mostrar el Toast
    const toast = new bootstrap.Toast(toastElemento, {
        delay: 3500 // Se ocultará solo después de 3.5 segundos
    });

    toast.show();
}

// Renueva el access token cuando venció. Devuelve true si renovó.
async function renovarToken() {
    try {
        const renovacion = await fetch(`${apiUsuarios}/refresh`, {
            method: 'POST',
            credentials: 'include'
        });
        return renovacion.ok;
    } catch (error) {
        console.error('No se pudo renovar el token:', error);
        return false;
    }
}

// Dibuja las cards de las mascotas en adopcion.
function renderizarMascotas(mascotas) {
    // Solo se muestran las que siguen disponibles. La ficha tiene 3 estados:
    // EN_ADOPCION (disponible), EN_TRAMITE (ya tiene una adopcion en curso) y
    // ADOPTADO (ya tiene hogar). El endpoint las devuelve todas porque el
    // panel las necesita, pero aca solo se ofrece la que se puede adoptar.
    const disponibles = (mascotas || []).filter(
        (mascota) => String(mascota.estado).toUpperCase() === 'EN_ADOPCION'
    );

    contenedorAdopciones.innerHTML = '';

    if (!disponibles.length) {
        estadoVacio.hidden = false;
        return;
    }

    estadoVacio.hidden = true;

    disponibles.forEach((mascota) => {
        const edad = formatearEdad(mascota.edad);
        const interesados = Number(mascota.interesados) || 0;
        const textoInteresados = interesados === 1
            ? '1 persona está interesada'
            : `${interesados} personas están interesadas`;

        const tarjeta = document.createElement('div');
        tarjeta.classList.add('col');
        tarjeta.innerHTML = `
          <div class="card-mascota">
            <div class="card-mascota-imagen">
              <img src="${escaparHTML(mascota.img_masc_adop) || imagenMascotaPorDefecto}"
                alt="Foto de ${escaparHTML(mascota.nombre)}"
                onerror="this.onerror=null;this.src='${imagenMascotaPorDefecto}';" />
              <span class="card-mascota-sexo">
                <i class="ph ${iconoSexo(mascota.sexo)}"></i>
                ${escaparHTML(mascota.sexo === 'HEMBRA' ? 'Hembra' : 'Macho')}
              </span>
            </div>
            <div class="card-mascota-cuerpo">
              <h3>${escaparHTML(mascota.nombre)}</h3>
              <div class="card-mascota-datos">
                ${mascota.raza ? `<span><i class="ph ph-paw-print"></i>${escaparHTML(mascota.raza)}</span>` : ''}
                ${mascota.especie ? `<span><i class="ph ph-tag"></i>${escaparHTML(mascota.especie)}</span>` : ''}
                ${edad ? `<span><i class="ph ph-cake"></i>${escaparHTML(edad)}</span>` : ''}
              </div>
              ${mascota.descripcion ? `<p class="card-mascota-descripcion">${escaparHTML(mascota.descripcion)}</p>` : ''}
              <div class="card-mascota-interesados">
                <i class="ph ph-heart"></i>
                ${textoInteresados}
              </div>
              <div class="card-mascota-pie">
                <button class="btn-adoptar" data-id="${escaparHTML(mascota.id_mascota_adopcion)}"
                  data-nombre="${escaparHTML(mascota.nombre)}">Adoptar</button>
              </div>
            </div>
          </div>
        `;
        contenedorAdopciones.appendChild(tarjeta);
    });

    // El boton de cada card abre el modal con esa mascota.
    contenedorAdopciones.querySelectorAll('.btn-adoptar').forEach((boton) => {
        boton.addEventListener('click', () => {
            if (!haySesion) {
                mostrarToast('Iniciá sesión para poder adoptar a una mascota', 'error');
                setTimeout(() => {
                    window.location.href = '../login.html';
                }, 2000);
                return;
            }
            abrirModalAdopcion(
                Number(boton.dataset.id),
                boton.dataset.nombre
            );
        });
    });
}

// Abre el modal con la mascota elegida y deja el motivo en blanco.
function abrirModalAdopcion(idMascota, nombre) {
    mascotaSeleccionada = idMascota;
    nombreMascotaModal.textContent = nombre;
    motivoAdopcion.value = '';
    contadorMotivo.textContent = '0';
    modalAdopcion.classList.add('abierto');
    modalAdopcion.setAttribute('aria-hidden', 'false');
    motivoAdopcion.focus();
}

// Cierra el modal y olvida la mascota seleccionada.
function cerrarModalAdopcion() {
    mascotaSeleccionada = null;
    modalAdopcion.classList.remove('abierto');
    modalAdopcion.setAttribute('aria-hidden', 'true');
    formAdopcion.reset();
    contadorMotivo.textContent = '0';
}

/*==========================================

         = = = = = EVENTOS = = = = =

============================================*/

// El contador del motivo: el limite de 120 es el de la columna observacion.
motivoAdopcion.addEventListener('input', () => {
    contadorMotivo.textContent = String(motivoAdopcion.value.length);
});

document.getElementById('cerrarModalAdopcion').addEventListener('click', cerrarModalAdopcion);
document.getElementById('cancelarAdopcion').addEventListener('click', cerrarModalAdopcion);

// Si se hace clic en el fondo oscuro, se cierra el modal.
modalAdopcion.addEventListener('click', (evento) => {
    if (evento.target === modalAdopcion) cerrarModalAdopcion();
});

// Envio de la solicitud de adopcion.
formAdopcion.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (!mascotaSeleccionada) return;

    const motivo = motivoAdopcion.value.trim();
    if (!motivo) {
        mostrarToast('Contanos por qué querés adoptar a esta mascota', 'error');
        return;
    }

    const datos = {
        id_mascota_adopcion: mascotaSeleccionada,
        observacion: motivo
    };

    enviarAdopcion.disabled = true;

    try {
        let enviar = await fetch(`${apiClientes}/adopciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(datos)
        });

        // El access token caduca a los 15 minutos: si venció, se renueva y se
        // reintenta una sola vez antes de pedir que inicie sesion de nuevo.
        if (enviar.status === 401) {
            if (await renovarToken()) {
                enviar = await fetch(`${apiClientes}/adopciones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(datos)
                });
            } else {
                haySesion = false;
                cerrarModalAdopcion();
                mostrarToast('Tu sesión expiró. Volvé a iniciar sesión.', 'error');
                setTimeout(() => {
                    window.location.href = '../login.html';
                }, 2500);
                return;
            }
        }

        const respuesta = await enviar.json().catch(() => ({}));

        if (enviar.ok) {
            cerrarModalAdopcion();
            mostrarToast(respuesta.mensaje || 'Tu solicitud fue enviada', 'exito');
            // Se recarga el listado para que el contador de interesados y los
            // estados queden al día.
            cargarMascotas();
        } else {
            mostrarToast(respuesta.mensaje || 'No se pudo enviar la solicitud', 'error');
        }
    } catch (error) {
        console.error('No se pudo enviar la solicitud:', error);
        mostrarToast('Hubo un problema con el servidor', 'error');
    } finally {
        enviarAdopcion.disabled = false;
    }
});

// Pide las mascotas al backend y las dibuja.
async function cargarMascotas() {
    try {
        const solicitar = await fetch(`${apiClientes}/mascotas-adopcion`);
        if (!solicitar.ok) {
            throw new Error(`Error al obtener las mascotas (${solicitar.status})`);
        }
        const mascotas = await solicitar.json();
        renderizarMascotas(mascotas);
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarToast('No se pudo conectar con el servidor.', 'error');
    }
}

// Consulta si el visitante tiene sesion, para saber si el boton de adoptar
// se habilita o manda al login.
async function verificarSesion() {
    try {
        let comprobar = await fetch(`${apiUsuarios}/verificarsession`, {
            method: 'GET',
            credentials: 'include'
        });

        if (comprobar.status === 401 && await renovarToken()) {
            comprobar = await fetch(`${apiUsuarios}/verificarsession`, {
                method: 'GET',
                credentials: 'include'
            });
        }

        haySesion = comprobar.ok;
    } catch (error) {
        console.warn('No se pudo verificar la sesión:', error);
        haySesion = false;
    }
}

window.addEventListener('load', async () => {
    await verificarSesion();
    await cargarMascotas();
});
