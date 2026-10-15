const contenedorOpcione = document.querySelector('.navegacion');
const contenido = document.querySelectorAll('section')
const abrirAside = document.querySelector('.abrir-aside');
const cerrarAside = document.querySelector('.cerrar-nav');
const aside = document.querySelector('#aside')

const navegarHistorial = document.querySelector('.filtrar-historial')
const contenidoHistorial = document.querySelectorAll('article')

/* Form usuario */
const formUsuario = document.getElementById('formUsuario')

const apiUsuario = 'http://127.0.0.1:3000/api/usuarios';
const refresh = "http://127.0.0.1:3000/api/usuarios/refresh"

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

window.addEventListener('load', async () => {
    try {
        let reqUsu = await fetch(`${apiUsuario}/traeruser`, { method: 'GET', credentials: 'include' })

        if (reqUsu.status === 401) {
            if (renovarToken()) {
                reqUsu = await fetch(`${apiUsuario}/traeruser`, { credentials: 'include' })
            } else {
                mostrarToast("Su sesion a expirado, vuelva a iniciar sesion.", 'error')
                setTimeout(() => {
                    window.location.href = "./../login.html"
                }, 3000)
            }
        }
        const info = await reqUsu.json()

        if (reqUsu.ok) {
            cargarFormUsuario(info.info)
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