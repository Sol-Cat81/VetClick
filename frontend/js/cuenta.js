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

const apiUsuario = 'http://127.0.0.1:3000/api/usuarios';
const refresh = "http://127.0.0.1:3000/api/usuarios/refresh"
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/* acciones */
const btnAgregarDireccion = document.querySelector('.agregar-direccion')

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

navegarHistorial.querySelectorAll('button').forEach(opcion => {
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
    const actu = await fetch(refresh, {
        method: 'POST',
        credentials: 'include'
    })
    if (!actu.ok) {
        return false
    }
    return true
}

const formatearNumero = (numero) => {
    const decimales = numero % 1 === 0 ? 0 : 2;

    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    }).format(numero);
}

function contenidoModal(contenido, acciones) {
    const contenidoModal = document.querySelector('.contenidoModal')
    const pieModal = document.querySelector('.pieModal')
    contenidoModal.innerHTML = ""
    contenidoModal.innerHTML = contenido;
    pieModal.innerHTML = ""
    pieModal.innerHTML = acciones;
    document.getElementById('modalSimple').showModal();
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

function eliminarDireccion(id) {
    console.log('direccion Borrada, ', id)
}

function editarDireccion(id) {
    const modalDireccion = document.querySelector('#modalDireccion');

    const infoDireccion = await fetch(a)
    console.log('direccion editada, ', id)
}

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
    const contenedorMascotas = document.querySelector('.mascotas-contenedor')
    contenedorMascotas.innerHTML = ''
    if (mascotas.length === 0) {
        contenedorMascotas.innerHTML = '<p>No hay mascotas registradas.</p>'
    }
    mascotas.forEach(mascota => {
        const div = document.createElement('div')
        div.classList.add('col')
        div.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col col-10">
                            <div>
                                <i class="ph ph-dog avatar-mascota"></i>
                            </div>
                            <div class="card-resumen-mascota">
                                <h5 class="card-title">${mascota.nombre}</h5>
                                <h6 class="card-subtitle mb-2 text-body-secondary">
                                ${mascota.raza} · ${calcularEdadMascota(mascota.fecha_nacimiento)}
                                </h6>
                            </div>
                        </div>
                        <div class="col col-2 text-end">
                            <i class="ph ph-pencil-simple-line" onclick="editarMascota(${mascota.id_mascota})"></i>
                        </div>
                    </div>
                    <br>
                    <button class="card-link btn-editar-direccion" onclick="verInfoMascota(${mascota.id_mascota})">
                        <b><i class="ph-bold ph-pencil-simple-line"></i>
                        Ver ficha completa >
                        </b>
                    </button>
                </div>
            </div>`
        contenedorMascotas.appendChild(div)
    })
}

function cargarTurnos(turnos) {
    const contenedorTunos = document.querySelector('.contenedor-turnos')
    contenedorTunos.innerHTML = ''
    if (turnos.length === 0) {
        contenedorTunos.innerHTML = '<p>Los turnos que tengas agendados apareceran aqui.</p>'
    }
    turnos.forEach(turno => {
        const horas = turno.hora.getHours().toString().padStart(2, '0');
        const minutos = turno.hora.getMinutes().toString().padStart(2, '0');
        const div = document.createElement('div')
        div.classList.add('card')
        div.innerHTML = `
            <div class="avatar-fecha">
                <span class="med">${MESES[turno.fecha.getMonth()]}</span>
                <span class="dia">${turno.fecha.getDate()}</span>
            </div>
            <div class="resumen-turno">
                <h5 class="card-title motivo-turno">${turno.motivo}</h5>
                <h6 class="card-subtitle mb-2 text-body-secondary">
                    <i class="ph ph-clock"></i>
                    <span class="fecha-turno">${DIAS[turno.fecha.getDay()]}, ${horas}:${minutos}hs</span>
                </h6>
                <h6 class="card-subtitle mb-2 text-body-secondary">
                    <i class="ph ph-storefront"></i>
                    <span class="veterinaria-turno">${turno.nombre}</span>
                </h6>
            </div>
            <div class="acciones-turno">
                <button class="detalle-turno" onclick="detalleTurno(${turno.id_turno})">Ver mas</button>
                <button class="eliminar-turno">Cancelar</button>
            </div>`
        contenedorTunos.appendChild(div)
    })
}

function cargarPedidos(pedidos) {
    const contenedorCompras = document.querySelector('.contenedorCompras')
    contenedorCompras.innerHTML = ''
    if (pedidos.length === 0) {
        contenedorCompras.innerHTML = '<p>Los pedidos/compras que realices apareceran aqui.</p>'
    }
    pedidos.forEach(pedido => {
        const div = document.createElement('div')
        div.classList.add('compra')
        div.innerHTML = `
            <div class="avatarCompra"><i class="ph ph-basket"></i></div>
            <div class="cabezalCompra">
                <span class="total-compra">${formatearNumero(Number(pedido.total))}</span>
                <span class="fecha-compra">${pedido.fecha.getDate} ${MESES[pedido.fecha.getMonth]} ${pedido.fecha.getFullYear}</span>
            </div>
            <div class="vermas" onclick="detalleCompra(${pedido.id_pedido})"><i class="ph-bold ph-caret-right"></i></div>`
        contenedorCompras.appendChild(div)
    })
}

window.addEventListener('load', async () => {
    try {
        let deshboard = await fetch(`${apiUsuario}/deshboard`, { method: 'GET', credentials: 'include' })

        if (deshboard.status === 401) {
            if (renovarToken()) {
                deshboard = await fetch(`${apiUsuario}/traeruser`, { credentials: 'include' })
            } else {
                mostrarToast("Su sesion a expirado, vuelva a iniciar sesion.", 'error')
                setTimeout(() => {
                    window.location.href = "./../login.html"
                }, 3000)
            }
        }
        const info = await deshboard.json()

        if (deshboard.ok) {
            cargarFormUsuario(info.usuario)
            cargarDirecciones(info.direcciones)
            cargarMascotas(info.mascotas)
            cargarTurnos(info.turnos)
            cargarPedidos(info.pedidos)
            console.log(info)
        }
    } catch (error) {
        console.log(error)
        mostrarToast('Hubo un problema con el servidor', 'error')
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