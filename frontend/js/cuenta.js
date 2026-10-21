const contenedorOpcione = document.querySelector('.navegacion');
const contenido = document.querySelectorAll('section')
const abrirAside = document.querySelector('.abrir-aside');
const cerrarAside = document.querySelector('.cerrar-nav');
const aside = document.querySelector('#aside')

const FOTO_POR_DEFECTO = '../assets/img/ChatGPT-Image.png';
const LIMITE_MEGABYTES = 5;
const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp'];

const btnCambiarFoto = document.getElementById('btnCambiarFoto');
const inputFotoUsuario = document.getElementById('inputFotoUsuario');
const modalFoto = document.getElementById('modalFoto');
const imagenRecorte = document.getElementById('imagenRecorte');
const guardarFoto = document.getElementById('guardarFoto');
const fotoUsuario = document.getElementById('fotoUsuario');
let recorte = null; 

const navegarHistorial = document.querySelector('.filtrar-historial')
const contenidoHistorial = document.querySelectorAll('article')

/* Form usuario */
const formUsuario = document.getElementById('formUsuario')
const formDireccion = document.getElementById('formAgregarDireccion')
const formMascota = document.getElementById('formAgregarMascota')
const modalDireccion = document.getElementById('modalDireccion')
const modalMascota = document.getElementById('modalMascota')
const modalDetalleCuenta = document.getElementById('modalDetalleCuenta')
const btnAgregarDireccion = document.querySelector('.agregar-direccion')
const btnAgregarMacota = document.querySelector('.agregar-mascota');
let idDireccionEnEdicion = null
let idMascotaEnEdicion = null;

const apiUsuario = 'http://127.0.0.1:3000/api/usuarios';
const refresh = "http://127.0.0.1:3000/api/usuarios/refresh"
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
let mascotasRegistradas = [];

/* acciones */

contenedorOpcione.querySelectorAll('.opcion').forEach(opcion => {
    opcion.addEventListener('click', (evento) => {
        evento.preventDefault();
        const anterior = document.querySelector('.elegido')
        const elegido = evento.target.closest(".opcion")

        contenido.forEach(seccion => {
            if (seccion.classList.contains('activo')) { seccion.classList.remove('activo') };
        })
        const mostrar = document.querySelector(`#${elegido.dataset.seccion}`)
        mostrar.classList.add('activo')

        anterior.classList.remove('elegido')
        anterior.classList.add('inactivo')

        elegido.classList.remove('inactivo')
        elegido.classList.add('elegido')
    })
})

abrirAside.addEventListener('click', () => { aside.classList.add('mostrar-aside'); console.log('hoola') })
cerrarAside.addEventListener('click', () => { aside.classList.remove('mostrar-aside') })

navegarHistorial.querySelectorAll('.btn-filtro[data-article]').forEach(opcion => {
    opcion.addEventListener('click', (evento) => {
        const anterior = document.querySelector('.filtro-activo')
        const elegido = evento.target.closest('.btn-filtro')

        contenidoHistorial.forEach(ar => {
            if (ar.classList.contains('activo')) { ar.classList.remove('activo') }
        })
        const mostrar = document.querySelector(`#${elegido.dataset.article}`)
        mostrar.classList.add('activo')
        anterior.classList.remove('filtro-activo')

        elegido.classList.add('filtro-activo')

        // Al volver a Compras, el filtro de mascotas vuelve a su titulo original.
        if (elegido.dataset.article === 'compras') {
            document.querySelector('.btn-filtro.dropdown-toggle')?.replaceChildren('Mascotas')
        }
    })
})

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
        delay: 3000 // Se ocultará solo después de 3 segundos (3000 ms)
    });

    toast.show();
}

async function renovarToken() {
    const respuesta = await fetch(refresh, {
        method: 'POST',
        credentials: 'include'
    });
    if (!respuesta.ok) {
        return false
    }
    return true
}

async function solicitudCuenta(url, opciones = {}) {
    const configuracion = { ...opciones, credentials: 'include' };
    let respuesta = await fetch(url, configuracion);
    if (respuesta.status === 401 && await renovarToken()) {
        respuesta = await fetch(url, configuracion);
    }
    return respuesta;
}

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caracter]);
}

function convertirFechaLocal(valor, incluirHora = false) {
    if (!valor) return null;
    const normalizada = String(valor).replace(' ', 'T');
    const fecha = new Date(normalizada.length === 10 ? `${normalizada}T12:00:00` : normalizada);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function fechaLegible(valor, incluirHora = false) {
    const fecha = convertirFechaLocal(valor, incluirHora);
    if (!fecha) return 'Fecha no disponible';
    const opciones = incluirHora
        ? { dateStyle: 'medium', timeStyle: 'short' }
        : { day: 'numeric', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('es-AR', opciones).format(fecha);
}

function mostrarDetalleCuenta(titulo, contenido) {
    modalDetalleCuenta.querySelector('.titulo-detalle-cuenta').textContent = titulo;
    modalDetalleCuenta.querySelector('.contenido-detalle-cuenta').innerHTML = contenido;
    modalDetalleCuenta.showModal();
}

const formatearNumero = (numero) => {
    const decimales = numero % 1 === 0 ? 0 : 2;

    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    }).format(numero);
}

function cargarFormUsuario(info) {
    const alertaUsu = document.querySelector('.alerta')
    if (info.cliente === null) {
        alertaUsu.innerHTML = 'Completa tu registro para poder realizar compras y solicitar turnos.'
        alertaUsu.classList.add('alertaActiva')
    } else {
        alertaUsu.classList.remove('alertaActiva')
    }
    document.querySelector('.usuario-head').innerHTML = `${info.usuario.username}`
    document.getElementById('username').value = info.usuario.username
    document.getElementById('gmail').value = info.usuario.email
    document.getElementById('nombre').value = info.cliente?.nombre ?? ''
    document.getElementById('apellido').value = info.cliente?.apellido ?? ''
    document.getElementById('telefono').value = info.cliente?.telefono ?? ''
    // La foto viene en el mismo SELECT que el username y el email. Sin esto, la
    // de arriba se veria recien despues de guardar una foto nueva.
    fotoUsuario.src = info.usuario.img_usuario || FOTO_POR_DEFECTO
}

function cargarDirecciones(direcciones) {
    const contenedorDirecciones = document.querySelector('.direcciones-contenedor')
    contenedorDirecciones.innerHTML = ''
    if (direcciones.length === 0) {
        contenedorDirecciones.innerHTML = '<p>No hay direcciones registradas.</p>'
    }
    direcciones.forEach(direccion => {
        const div = document.createElement('div')
        div.classList.add('col')
        div.innerHTML = `
            <div class="card" style="width: 18rem;">
                <div class="card-body">
                    <h5 class="card-title">${direccion.calle}, ${direccion.numero}</h5>
                    <h6 class="card-subtitle mb-2 text-body-secondary">
                        ${direccion.provincia},
                        ${direccion.localidad}
                    </h6>
                    <div class="card-text">
                        ${direccion.codigo_postal}
                    </div>
                    <button onclick="editarDireccion(${direccion.id_direccion})" class="card-link btn-editar-direccion">
                        <b><iclass="ph-bold ph-pencil-simple-line"></i> Editar</b>
                    </button>
                    <button onclick="eliminarDireccion(${direccion.id_direccion})" class="card-link btn-eliminar-direccion">Eliminar</button>
                </div>
            </div>`
        contenedorDirecciones.appendChild(div)
    })
}

async function eliminarDireccion(id) {
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar esta dirección?');
    if (!confirmacion) return;

    let respuesta = await fetch(`${apiUsuario}/eliminardireccion/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
        mostrarToast(resultado.message || resultado.mensaje || 'No se pudo eliminar la dirección.', 'error');
        return;
    }
    mostrarToast('Dirección eliminada correctamente.', 'success');
    // Recargar las direcciones para reflejar el cambio
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

async function editarDireccion(id) {
    try {
        let respuesta = await fetch(`${apiUsuario}/traerdireccion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ id_direccion: id })
        });

        if (respuesta.status === 401 && await renovarToken()) {
            respuesta = await fetch(`${apiUsuario}/traerdireccion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ id_direccion: id })
            });
        }

        const resultado = await respuesta.json();
        if (!respuesta.ok) {
            mostrarToast(resultado.message || resultado.mensaje || 'No se pudo cargar la dirección.', 'error');
            return;
        }

        idDireccionEnEdicion = id;
        document.getElementById('tituloModalDireccion').textContent = 'Editar direccion';
        document.getElementById('guardarDireccion').textContent = 'Guardar cambios';
        document.getElementById('tipoDireccion').value = resultado.tipo_direccion;
        document.getElementById('calle').value = resultado.calle ?? '';
        document.getElementById('numero').value = resultado.numero ?? '';
        document.getElementById('provincia').value = resultado.provincia ?? '';
        document.getElementById('localidad').value = resultado.localidad ?? '';
        document.getElementById('codigo').value = resultado.codigo_postal ?? '';
        document.getElementById('departamento').value = resultado.departamento ?? '';
        document.getElementById('piso').value = resultado.piso ?? '';
        document.getElementById('referencia').value = resultado.referencia ?? '';
        modalDireccion.showModal();
    } catch (error) {
        console.error('Error al cargar la dirección para editar:', error);
        mostrarToast('No se pudo cargar la dirección.', 'error');
    }
}

btnAgregarDireccion.addEventListener('click', () => {
    idDireccionEnEdicion = null;
    formDireccion.reset();
    document.getElementById('tituloModalDireccion').textContent = 'Nueva direccion';
    document.getElementById('guardarDireccion').textContent = 'Guardar';
    modalDireccion.showModal();
});

btnAgregarMacota.addEventListener('click', () => {
    idMascotaEnEdicion = null;
    formMascota.reset();
    document.getElementById('tituloModalMascota').textContent = 'Registrar nueva mascota';
    document.getElementById('guardarMascota').textContent = 'Guardar'
    modalMascota.showModal();
})

modalDireccion.addEventListener('close', () => {
    idDireccionEnEdicion = null;
    formDireccion.reset();
    document.getElementById('tituloModalDireccion').textContent = 'Nueva direccion';
    document.getElementById('guardarDireccion').textContent = 'Guardar';
});

modalMascota.addEventListener('close', () => {
    idMascotaEnEdicion = null;
    formMascota.reset();
    document.getElementById('tituloModalMascota').textContent = 'Registrar nueva mascota';
    document.getElementById('guardarMascota').textContent = 'Guardar'
});

function calcularEdadMascota(fechaNacimientoServidor) {
    const [year, month, day] = fechaNacimientoServidor.split('-').map(Number);
    const fechaNac = new Date(year, month - 1, day); // Meses en JS van de 0 a 11
    const hoy = new Date();

    // Validar si la fecha recibida es válida
    if (isNaN(fechaNac.getTime())) {
        return 'Fecha inválida';
    }
    // 1. Calcular diferencia base en años
    let anos = hoy.getFullYear() - fechaNac.getFullYear();
    let mesesDiferencia = hoy.getMonth() - fechaNac.getMonth();
    let diasDiferencia = hoy.getDate() - fechaNac.getDate();
    console.log(anos + " - " + mesesDiferencia + " - " + diasDiferencia)

    // Ajustar si aún no ha cumplido meses/años este período
    if (diasDiferencia < 0) {
        mesesDiferencia--;
    }
    if (mesesDiferencia < 0) {
        anos--;
        mesesDiferencia += 12;
    }
    // 2. Determinar si mostrar en meses o en años
    if (anos < 1) {
        // Total de meses para cachorro / mascota menor a 1 año
        const totalMeses = (hoy.getFullYear() - fechaNac.getFullYear()) * 12 + hoy.getMonth() - fechaNac.getMonth() + (diasDiferencia < 0 ? -1 : 0);

        if (totalMeses <= 0) {
            return 'Recién nacido';
        }
        return `${totalMeses} ${totalMeses === 1 ? 'mes' : 'meses'}`;
    }
    if (anos >= 1 && mesesDiferencia > 0) {
        return `${anos} ${anos === 1 ? 'año' : 'años'} y ${mesesDiferencia} ${mesesDiferencia === 1 ? 'mes' : 'meses'}`;
    }
    // Mascota de 1 año o más
    return `${anos} ${anos === 1 ? 'año' : 'años'}`;
}

function cargarMascotas(mascotas) {
    const contenedorMascotas = document.querySelector('.mascotas-contenedor');
    const dropdownMascotas = document.getElementById('dropdownMascotas');
    mascotasRegistradas = mascotas;
    contenedorMascotas.innerHTML = '';
    dropdownMascotas.innerHTML = '';
    if (mascotas.length === 0) {
        contenedorMascotas.innerHTML = '<p>No hay mascotas registradas.</p>';
        dropdownMascotas.innerHTML = '<li class="dropdown-item-text">No hay mascotas registradas.</li>';
    }
    mascotas.forEach(mascota => {
        const div = document.createElement('div');
        div.classList.add('col');
        div.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col col-10">
                            <div>
                                <i class="ph ph-dog avatar-mascota"></i>
                            </div>
                            <div class="card-resumen-mascota">
                                <h5 class="card-title">${escaparHTML(mascota.nombre)}</h5>
                                <h6 class="card-subtitle mb-2 text-body-secondary">
                                ${escaparHTML(mascota.raza)} · ${escaparHTML(calcularEdadMascota(mascota.fecha_nacimiento))}
                                </h6>
                            </div>
                        </div>
                        <div class="col col-2 text-end">
                            <button type="button" class="accion-icono" data-editar-mascota="${mascota.id_mascota}" aria-label="Editar ${escaparHTML(mascota.nombre)}">
                                <i class="ph ph-pencil-simple-line"></i>
                            </button>
                        </div>
                    </div>
                    <br>
                    <div class="acciones-mascota">
                        <button type="button" class="card-link btn-editar-direccion" data-ficha-mascota="${mascota.id_mascota}">
                            Ver ficha completa
                        </button>
                        <button type="button" class="btn-eliminar-direccion" data-eliminar-mascota="${mascota.id_mascota}">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>`
        contenedorMascotas.appendChild(div);
        const opcion = document.createElement('li');
        opcion.innerHTML = `<button type="button" class="dropdown-item" data-historial-mascota="${mascota.id_mascota}">${escaparHTML(mascota.nombre)}</button>`;
        dropdownMascotas.appendChild(opcion);
    });
}

function cargarTurnos(turnos) {
    const contenedorTunos = document.querySelector('.contenedor-turnos');
    contenedorTunos.innerHTML = '';
    if (turnos.length === 0) {
        contenedorTunos.innerHTML = '<p>No tenés turnos registrados.</p>';
    }
    turnos.forEach(turno => {
        const fecha = convertirFechaLocal(turno.fecha);
        const estado = String(turno.estado || '').toLowerCase();
        const puedeCancelar = ['PENDIENTE', 'CONFIRMADO'].includes(turno.estado);
        const div = document.createElement('div');
        div.classList.add('card');
        div.innerHTML = `
            <div class="avatar-fecha">
                <span class="med">${fecha ? MESES[fecha.getMonth()] : '--'}</span>
                <span class="dia">${fecha ? fecha.getDate() : '--'}</span>
            </div>
            <div class="resumen-turno">
                <h5 class="card-title motivo-turno">${escaparHTML(turno.motivo || turno.servicio || 'Consulta veterinaria')}</h5>
                <h6 class="card-subtitle mb-2 text-body-secondary">
                    <i class="ph ph-clock"></i>
                    <span class="fecha-turno">${fecha ? DIAS[fecha.getDay()] : ''}, ${escaparHTML(turno.hora || '')} hs</span>
                </h6>
                <h6 class="card-subtitle mb-2 text-body-secondary">
                    <i class="ph ph-storefront"></i>
                    <span>${escaparHTML(turno.mascota || '')} · ${escaparHTML(turno.sucursal || 'Sucursal no disponible')}</span>
                </h6>
                <span class="estado-turno">${escaparHTML(estado)}</span>
            </div>
            <div class="acciones-turno">
                <button type="button" class="detalle-turno" data-detalle-turno="${turno.id_turno}">Ver información</button>
                ${puedeCancelar ? `<button type="button" class="eliminar-turno" data-cancelar-turno="${turno.id_turno}">Cancelar</button>` : ''}
            </div>`
        contenedorTunos.appendChild(div);
    });
}

function cargarPedidos(pedidos) {
    const contenedorCompras = document.querySelector('.contenedorCompras');
    contenedorCompras.innerHTML = '';
    document.querySelector('.cabezal-compras span').textContent = pedidos.length;
    if (pedidos.length === 0) {
        contenedorCompras.innerHTML = '<p>Las compras que realices aparecerán aquí.</p>';
    }
    pedidos.forEach(pedido => {
        const div = document.createElement('div');
        div.classList.add('compra');
        div.innerHTML = `
            <div class="avatarCompra"><i class="ph ph-basket"></i></div>
            <div class="cabezalCompra">
                <span class="total-compra">$${formatearNumero(Number(pedido.total || 0))}</span>
                <span class="fecha-compra">${escaparHTML(fechaLegible(pedido.fecha, true))} · ${escaparHTML(pedido.estado || '')}</span>
            </div>
            <button type="button" class="vermas" data-detalle-compra="${pedido.id_pedido}" aria-label="Ver detalle de compra ${pedido.id_pedido}">
                <i class="ph-bold ph-caret-right"></i>
            </button>`;
        contenedorCompras.appendChild(div);
    });
}

function cargarRazas(razas) {
    const selector = document.getElementById('raza');
    selector.innerHTML = '<option value="">Seleccioná una raza</option>';
    razas.forEach(raza => {
        const opcion = document.createElement('option');
        opcion.value = raza.id_raza;
        opcion.textContent = raza.nombre;
        selector.appendChild(opcion);
    });
}

function formatoTratamientos(tratamientos) {
    if (!tratamientos.length) return '<p>No se indicó tratamiento para esta consulta.</p>';
    return `<ul class="lista-tratamientos">${tratamientos.map(tratamiento => `
        <li><strong>${escaparHTML(tratamiento.medicamento)}</strong>
            ${tratamiento.dosis ? ` · ${escaparHTML(tratamiento.dosis)}` : ''} 
            ${tratamiento.frecuencia ? ` · ${escaparHTML(tratamiento.frecuencia)}` : ''}
            ${tratamiento.duracion ? ` · ${escaparHTML(tratamiento.duracion)}` : ''}
        </li>`).join('')}</ul>`;
}

function contenidoVacunas(vacunas) {
    if (!vacunas || vacunas.length === 0) {
        return '<p>Esta mascota todavía no tiene vacunas registradas.</p>';
    }
    return `<ul class="lista-vacunas">${vacunas.map(vacuna => `
        <li><strong>${escaparHTML(vacuna.nombre)}</strong>
            ${vacuna.fecha_aplicacion ? ` · aplicada ${escaparHTML(fechaLegible(vacuna.fecha_aplicacion))}` : ''}
            ${vacuna.fecha_proxima ? ` · próxima ${escaparHTML(fechaLegible(vacuna.fecha_proxima))}` : ''}
        </li>`).join('')}</ul>`;
}

function contenidoHistorialMascota(ficha) {
    if (ficha.historial.length === 0) {
        return '<p>Esta mascota todavía no tiene consultas registradas.</p>';
    }
    return ficha.historial.map(consulta => `
        <article class="consulta-mascota">
            <h4>${escaparHTML(fechaLegible(consulta.fecha))}</h4>
            <p><strong>Motivo:</strong> ${escaparHTML(consulta.motivo || 'No especificado')}</p>
            <p><strong>Diagnóstico:</strong> ${escaparHTML(consulta.diagnostico || 'Sin diagnóstico registrado')}</p>
            <p><strong>Observaciones:</strong> ${escaparHTML(consulta.observacion || 'Sin observaciones')}</p>
            ${consulta.veterinario ? `<p><strong>Veterinario:</strong> ${escaparHTML(consulta.veterinario)}</p>` : ''}
            <h5>Tratamiento</h5>
            ${formatoTratamientos(consulta.tratamientos)}
        </article>
    `).join('');
}

async function cargarFichaMascota(idMascota) {
    const respuesta = await solicitudCuenta(`${apiUsuario}/mascotas/${idMascota}/ficha`);
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
        throw new Error(resultado.message || resultado.mensaje || 'No se pudo cargar la ficha de la mascota.');
    }
    return resultado;
}

async function verInfoMascota(idMascota) {
    try {
        const ficha = await cargarFichaMascota(idMascota);
        const mascota = ficha.mascota;
        const informacion = `
            <div class="datos-ficha-mascota">
                <p><strong>Raza:</strong> ${escaparHTML(mascota.raza)}</p>
                <p><strong>Sexo:</strong> ${escaparHTML(mascota.sexo)}</p>
                <p><strong>Fecha de nacimiento:</strong> ${escaparHTML(fechaLegible(mascota.fecha_nacimiento))}</p>
                <p><strong>Peso:</strong> ${mascota.peso ? `${escaparHTML(mascota.peso)} kg` : 'Sin registrar'}</p>
                <p><strong>Observaciones:</strong> ${escaparHTML(mascota.observaciones || 'Sin observaciones')}</p>
            </div>
            <h3>Historial médico</h3>
            ${contenidoHistorialMascota(ficha)}
            <div class="bloque-ficha">
                <h3>Vacunas</h3>
                ${contenidoVacunas(ficha.vacunas)}
            </div>`;
        mostrarDetalleCuenta(`Ficha de ${mascota.nombre}`, informacion);
    } catch (error) {
        console.error('Error al cargar la ficha de la mascota:', error);
        mostrarToast(error.message || 'No se pudo cargar la ficha de la mascota.', 'error');
    }
}

async function verHistorialMascota(idMascota) {
    const articulo = document.getElementById('mascota');
    const mascota = mascotasRegistradas.find(item => Number(item.id_mascota) === Number(idMascota));
    if (!mascota) return;
    articulo.innerHTML = '<p>Cargando historial médico...</p>';
    document.querySelector('.filtro-activo')?.classList.remove('filtro-activo');
    document.querySelector('[data-article="mascota"]')?.classList.add('filtro-activo');
    document.querySelectorAll('article.seccion-historial').forEach(item => item.classList.remove('activo'));
    articulo.classList.add('activo');
    try {
        const ficha = await cargarFichaMascota(idMascota);
        articulo.innerHTML = `
            <div class="cabezal-compras">Consultas de ${escaparHTML(ficha.mascota.nombre)}</div>
            ${contenidoHistorialMascota(ficha)}
            <div class="bloque-ficha">
                <div class="cabezal-compras">Vacunas</div>
                <div class="contenido-vacunas">${contenidoVacunas(ficha.vacunas)}</div>
            </div>`;
    } catch (error) {
        console.error('Error al cargar el historial médico:', error);
        articulo.innerHTML = `<p>${escaparHTML(error.message || 'No se pudo cargar el historial médico.')}</p>`;
    }
}

async function editarMascota(idMascota) {
    try {
        const ficha = await cargarFichaMascota(idMascota);
        const mascota = ficha.mascota;
        idMascotaEnEdicion = idMascota;
        document.getElementById('tituloModalMascota').textContent = `Editar a ${mascota.nombre}`;
        document.getElementById('guardarMascota').textContent = 'Guardar cambios';
        document.getElementById('nombreMascota').value = mascota.nombre;
        document.getElementById('raza').value = mascota.id_raza;
        document.getElementById(mascota.sexo === 'HEMBRA' ? 'hembra' : 'macho').checked = true;
        document.getElementById('fechaNac').value = mascota.fecha_nacimiento || '';
        document.getElementById('peso').value = mascota.peso ?? '';
        document.getElementById('observaciones').value = mascota.observaciones || '';
        modalMascota.showModal();
    } catch (error) {
        console.error('Error al cargar la mascota para editar:', error);
        mostrarToast(error.message || 'No se pudo cargar la mascota.', 'error');
    }
}

async function eliminarMascotaCuenta(idMascota) {
    const mascota = mascotasRegistradas.find(item => Number(item.id_mascota) === Number(idMascota));
    const nombre = mascota?.nombre || 'esta mascota';
    const confirmar = confirm(`¿Eliminar a ${nombre}? También se eliminarán su historial médico, tratamientos, vacunas y turnos asociados. Esta acción no se puede deshacer.`);
    if (!confirmar) return;
    try {
        const respuesta = await solicitudCuenta(`${apiUsuario}/mascotas/${idMascota}`, { method: 'DELETE' });
        const resultado = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(resultado.message || resultado.mensaje || 'No se pudo eliminar la mascota.');
        }
        mostrarToast('Mascota eliminada correctamente.');
        setTimeout(() => window.location.reload(), 900);
    } catch (error) {
        console.error('Error al eliminar la mascota:', error);
        mostrarToast(error.message || 'No se pudo eliminar la mascota.', 'error');
    }
}

async function cancelarTurnoCuenta(idTurno) {
    if (!confirm('¿Confirmás que querés cancelar este turno?')) return;
    try {
        const respuesta = await solicitudCuenta(`${apiUsuario}/turnos/${idTurno}/cancelar`, { method: 'PUT' });
        const resultado = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(resultado.message || resultado.mensaje || 'No se pudo cancelar el turno.');
        }
        mostrarToast('Turno cancelado correctamente.');
        setTimeout(() => window.location.reload(), 900);
    } catch (error) {
        console.error('Error al cancelar el turno:', error);
        mostrarToast(error.message || 'No se pudo cancelar el turno.', 'error');
    }
}

function verDetalleTurno(idTurno) {
    const turno = window.turnosCuenta?.find(item => Number(item.id_turno) === Number(idTurno));
    if (!turno) {
        mostrarToast('No se encontró la información de este turno.', 'error');
        return;
    }
    mostrarDetalleCuenta('Información del turno', `
        <p><strong>Fecha y hora:</strong> ${escaparHTML(fechaLegible(`${turno.fecha}T${turno.hora}`, true))}</p>
        <p><strong>Mascota:</strong> ${escaparHTML(turno.mascota)}</p>
        <p><strong>Servicio:</strong> ${escaparHTML(turno.servicio)}</p>
        <p><strong>Sucursal:</strong> ${escaparHTML(turno.sucursal || 'No disponible')}</p>
        <p><strong>Motivo:</strong> ${escaparHTML(turno.motivo || 'No especificado')}</p>
        <p><strong>Estado:</strong> ${escaparHTML(turno.estado)}</p>
        <p><strong>Observaciones:</strong> ${escaparHTML(turno.observaciones || 'Sin observaciones')}</p>
    `);
}

async function verDetalleCompra(idPedido) {
    try {
        const respuesta = await solicitudCuenta(`${apiUsuario}/pedidos/${idPedido}/detalle`);
        const resultado = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(resultado.message || resultado.mensaje || 'No se pudo cargar el detalle de la compra.');
        }
        const { pedido, pagos, envios, lineas } = resultado;
        const filas = lineas.length
            ? `<div class="lineas-compra">${lineas.map(linea => `
                <div class="linea-compra">
                    <span>${escaparHTML(linea.producto)} × ${escaparHTML(linea.cantidad)}</span>
                    <strong>$${formatearNumero(Number(linea.subtotal || 0))}</strong>
                </div>`).join('')}</div>`
            : '<p>La compra no tiene productos registrados.</p>';
        const pagoHtml = pagos.length
            ? pagos.map(pago => `<p><strong>Pago:</strong> ${escaparHTML(pago.metodo_pago)} · ${escaparHTML(pago.estado_pago)}</p>`).join('')
            : '<p><strong>Pago:</strong> Sin información de pago.</p>';
        const envioHtml = envios.length
            ? envios.map(envio => `<p><strong>Entrega:</strong> ${escaparHTML(envio.tipo_entrega)} · ${escaparHTML(envio.estado)}${envio.fecha_estimada ? ` · estimada ${escaparHTML(fechaLegible(envio.fecha_estimada))}` : ''}</p>`).join('')
            : '<p><strong>Entrega:</strong> Sin información de envío.</p>';
        mostrarDetalleCuenta(`Compra #${pedido.id_pedido}`, `
            <p><strong>Fecha:</strong> ${escaparHTML(fechaLegible(pedido.fecha, true))}</p>
            <p><strong>Estado:</strong> ${escaparHTML(pedido.estado)}</p>
            ${filas}${pagoHtml}${envioHtml}
            <hr>
            <p>Subtotal: $${formatearNumero(Number(pedido.subtotal || 0))}</p>
            <p>Envío: $${formatearNumero(Number(pedido.costo_envio || 0))}</p>
            <p class="total-detalle-compra"><strong>Total: $${formatearNumero(Number(pedido.total || 0))}</strong></p>
        `);
    } catch (error) {
        console.error('Error al cargar el detalle de la compra:', error);
        mostrarToast(error.message || 'No se pudo cargar el detalle de la compra.', 'error');
    }
}

document.querySelector('.mascotas-contenedor').addEventListener('click', evento => {
    const ficha = evento.target.closest('[data-ficha-mascota]');
    const editar = evento.target.closest('[data-editar-mascota]');
    const eliminar = evento.target.closest('[data-eliminar-mascota]');
    if (ficha) verInfoMascota(ficha.dataset.fichaMascota);
    if (editar) editarMascota(editar.dataset.editarMascota);
    if (eliminar) eliminarMascotaCuenta(eliminar.dataset.eliminarMascota);
});

document.getElementById('dropdownMascotas').addEventListener('click', evento => {
    const opcion = evento.target.closest('[data-historial-mascota]');
    if (!opcion) return;
    const mascota = mascotasRegistradas.find(item => Number(item.id_mascota) === Number(opcion.dataset.historialMascota));
    if (mascota) {
        document.querySelector('.btn-filtro.dropdown-toggle')?.replaceChildren(mascota.nombre);
    }
    verHistorialMascota(opcion.dataset.historialMascota);
});

document.querySelector('.contenedor-turnos').addEventListener('click', evento => {
    const detalle = evento.target.closest('[data-detalle-turno]');
    const cancelar = evento.target.closest('[data-cancelar-turno]');
    if (detalle) verDetalleTurno(detalle.dataset.detalleTurno);
    if (cancelar) cancelarTurnoCuenta(cancelar.dataset.cancelarTurno);
});

document.querySelector('.contenedorCompras').addEventListener('click', evento => {
    const detalle = evento.target.closest('[data-detalle-compra]');
    if (detalle) verDetalleCompra(detalle.dataset.detalleCompra);
});

// Cierre del modal de detalle: botones, Escape (nativo) y click fuera de la caja.
modalDetalleCuenta.addEventListener('click', evento => {
    const caja = modalDetalleCuenta.getBoundingClientRect();
    const fuera = evento.clientX < caja.left || evento.clientX > caja.right ||
        evento.clientY < caja.top || evento.clientY > caja.bottom;
    if (evento.target.closest('[data-cerrar-detalle]') || (evento.target === modalDetalleCuenta && fuera)) {
        modalDetalleCuenta.close();
    }
});

window.addEventListener('load', async () => {
    try {
        let deshboard = await solicitudCuenta(`${apiUsuario}/deshboard`, { method: 'GET' });

        const info = await deshboard.json()

        if (deshboard.ok) {
            cargarFormUsuario(info.usuario)
            cargarDirecciones(info.direcciones)
            cargarMascotas(info.mascotas)
            cargarRazas(info.razas)
            cargarTurnos(info.turnos)
            cargarPedidos(info.pedidos)
            window.turnosCuenta = info.turnos;
        } else if (deshboard.status === 401) {
            mostrarToast("Su sesión expiró, volvé a iniciar sesión.", 'error')
            setTimeout(() => {
                window.location.href = "./../login.html"
            }, 3000)
        } else {
            throw new Error(info.message || info.mensaje || 'No se pudieron cargar los datos de la cuenta.');
        }
    } catch (error) {
        console.error(error)
        mostrarToast(error.message || 'Hubo un problema con el servidor', 'error')
    }
})

formUsuario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const username = document.getElementById('username').value;
    const nombreUsuario = document.getElementById('nombre').value;
    const apellidoUsuario = document.getElementById('apellido').value;
    const telefono = document.getElementById('telefono').value;

    if (!username || !nombreUsuario || !apellidoUsuario || !telefono) {
        mostrarToast('Llena todos los campos correctamente!', 'error')
    }

    const datos = {
        username: username,
        nombre: nombreUsuario,
        apellido: apellidoUsuario,
        telefono: telefono,
    }
    try {
        let enviar = await fetch(`${apiUsuario}/guardarcliente`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(datos),
            },
        )
        if (enviar.status === 401) {
            if (renovarToken()) {
                enviar = await fetch(`${apiUsuario}/guardarcliente`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(datos),
                },)
            }
        }
        const confirmacion = await enviar.json()

        if (enviar.ok) {
            mostrarToast('Los cambios se han guardado.', 'exito')
            setTimeout(() => {
                window.location.reload();
            }, 3000)
        } else {
            mostrarToast(confirmacion.mensaje || 'Hubo un problema, intentelo de nuevo mas tarde.', 'error')
        }
    } catch (error) {
        console.log(error)
    }

})

formDireccion.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const tipoDireccion = document.getElementById('tipoDireccion').value;
    const calle = document.getElementById('calle').value;
    const numero = document.getElementById('numero').value;
    const provincia = document.getElementById('provincia').value;
    const localidad = document.getElementById('localidad').value;
    const codigoPostal = document.getElementById('codigo').value;
    const departamento = document.getElementById('departamento').value;
    const piso = document.getElementById('piso').value;
    const referencia = document.getElementById('referencia').value;

    if (!tipoDireccion || !calle || !numero || !provincia || !codigoPostal) {
        mostrarToast('Llena todos los campos obligatorios correctamente!', 'error')
        return;
    }

    const datos = {
        tipo_direccion: tipoDireccion,
        calle: calle,
        numero: numero,
        provincia: provincia,
        localidad: localidad,
        codigo_postal: codigoPostal,
        departamento: departamento,
        piso: piso,
        referencia: referencia,
    }
    const url = idDireccionEnEdicion
        ? `${apiUsuario}/actualizardireccion/${idDireccionEnEdicion}`
        : `${apiUsuario}/guardardireccion`;
    const opciones = {
        method: idDireccionEnEdicion ? 'PUT' : 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(datos),
    };

    try {
        let enviar = await fetch(url, opciones);
        if (enviar.status === 401 && await renovarToken()) {
            enviar = await fetch(url, opciones);
        }

        const confirmacion = await enviar.json();

        if (enviar.ok) {
            mostrarToast(idDireccionEnEdicion ? 'Dirección actualizada correctamente.' : 'Dirección guardada correctamente.', 'exito');
            modalDireccion.close();
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            mostrarToast(confirmacion.message || confirmacion.mensaje || 'Hubo un problema, intentelo de nuevo mas tarde.', 'error');
        }
    } catch (error) {
        console.error('Error al guardar la dirección:', error);
        mostrarToast('No se pudo guardar la dirección.', 'error');
    }
})

formMascota.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nombreMascota = document.getElementById('nombreMascota').value;
    const raza = document.getElementById('raza').value;
    const fechaNacimiento = document.getElementById('fechaNac').value;
    const peso = document.getElementById('peso').value;
    const detalles = document.getElementById('observaciones').value;
    const sexo = document.getElementById('hembra').checked ? 'HEMBRA'
        : document.getElementById('macho').checked ? 'MACHO' : '';

    if(!nombreMascota || !raza || !fechaNacimiento || !sexo){
        mostrarToast('Llena todos los campos obligatorios correctamente!', 'error')
        return;
    }

    const datos = {
        nombre: nombreMascota,
        raza: raza,
        sexo: sexo,
        fecha_nacimiento: fechaNacimiento,
        peso: peso,
        observaciones: detalles
    }

    const url = idMascotaEnEdicion
        ? `${apiUsuario}/mascotas/${idMascotaEnEdicion}`
        : `${apiUsuario}/mascotas`;
    const opciones = {
        method: idMascotaEnEdicion ? 'PUT' : 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(datos),
    };
    try {
        let enviar = await fetch(url, opciones);
        if (enviar.status === 401 && await renovarToken()) {
            enviar = await fetch(url, opciones);
        }

        const confirmacion = await enviar.json();

        if (enviar.ok) {
            mostrarToast(idMascotaEnEdicion ? 'Se guardaron los cambios correctamente.' : 'Mascota registrada correctamente.', 'exito');
            modalMascota.close();
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            mostrarToast(confirmacion.message || confirmacion.mensaje || 'Hubo un problema, intentelo de nuevo mas tarde.', 'error');
        }
    } catch (error) {
        console.error('Error al registrar la mascota:', error);
        mostrarToast('No se pudo registrar la mascota.', 'error');
    }
})

function abrirModalFoto(){
    modalFoto.classList.add('abierto');
    modalFoto.setAttribute('aria-hidden', 'false');
    guardarFoto.disabled = true;
}

function cerrarModalFoto(){
    if(recorte){
        recorte.destroy(); recorte = null;
    }
    modalFoto.classList.remove('abierto');
    modalFoto.setAttribute('aria-hidden', 'true');
    inputFotoUsuario.value = '';
}

btnCambiarFoto.addEventListener('click', () => inputFotoUsuario.click());
document.getElementById('cancelarFoto').addEventListener('click', cerrarModalFoto);
document.getElementById('cerrarModalFoto').addEventListener('click', cerrarModalFoto);
modalFoto.addEventListener('click', (evento) => {
    if (evento.target === modalFoto) cerrarModalFoto();
});

inputFotoUsuario.addEventListener('change', ()=>{
    const archivo = inputFotoUsuario.files[0];
    if(!archivo)return;

    const extensiones = TIPOS_ACEPTADOS.map(tipo => tipo.split('/')[1]);
    if(!TIPOS_ACEPTADOS.includes(archivo.type)){
        mostrarToast(`esa imagen no sirve pe usa ${extensiones.join(', ')}`, 'error');
        inputFotoUsuario.value = '';
        return;
    }
    if(archivo.size > LIMITE_MEGABYTES * 1024 * 1024){
        mostrarToast(`la imagen pesa ${(archivo.size / 1024 /1024).toFixed(1)} MB y el macximo es ${LIMITE_MEGABYTES} MB`, 'error');
        inputFotoUsuario.value = '';
        return;
    }

    const lector = new FileReader();
    lector.onload = () =>{
        imagenRecorte.src = lector.result;
        abrirModalFoto();
        if(recorte) recorte.destroy();
        recorte = new Cropper(imagenRecorte, {
            aspectRatio: 1,       // el avatar es un cuadrado de 80px
            viewMode: 1,
            autoCropArea: 1,
            dragMode: 'move',
            cropperMovable: false, // no se puede encoger el recorte por debajo
            cropperScalable: false,
            ready: () => { guardarFoto.disabled = false; }
        });
    };
    lector.readAsDataURL(archivo);
});

guardarFoto.addEventListener('click', async()=>{
    if(!recorte) return;
    guardarFoto.disabled = true;

    recorte.getCroppedCanvas().toBlob(async(blob)=>{
        if (!blob){guardarFoto.disabled = false; return;}

        const datos = new FormData();
        datos.append('imagen_usuario', blob, 'perfil.jpg');

        try{
            let enviar = await fetch(`${apiUsuario}/perfil/foto`,{
                method:'POST',
                credentials: 'include',
                body: datos
            });
            if (enviar.status === 401){
                if (renovarToken()){
                    enviar = await fetch(`${apiUsuario}/perfil/foto`,{
                        method: 'POST',
                        credentials: 'include',
                        body: datos
                    });
                }
            }
            const confirmacion = await enviar.json();
            if (enviar.ok){
                fotoUsuario.src = `${confirmacion.imagen}?v=${Date.now()}`;
                cerrarModalFoto();
                mostrarToast('foto actualizada', 'exito');
            }else{
                mostrarToast(confirmacion.mensaje || 'no se pudo guardar la foto', 'error');
                guardarFoto.disabled = false;
            }
        }catch (error){
            mostrarToast('hubo un problema con el servidor', 'error');
            guardarFoto.disabled = false;
        }
    },'image/jpeg', 0.9);
});