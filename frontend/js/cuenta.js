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
    // La foto viene en el mismo SELECT que el username y el email. Sin esto, la
    // de arriba se veria recien despues de guardar una foto nueva.
    fotoUsuario.src = info.usuario.img_usuario || FOTO_POR_DEFECTO
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