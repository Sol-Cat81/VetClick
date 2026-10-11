const contenedorOpcione = document.querySelector('.navegacion');
const contenido = document.querySelectorAll('section')
const abrirAside = document.querySelector('.abrir-aside');
const cerrarAside = document.querySelector('.cerrar-nav');
const aside = document.querySelector('#aside')

const navegarHistorial = document.querySelector('.filtrar-historial')
const contenidoHistorial = document.querySelectorAll('article')

contenedorOpcione.querySelectorAll('.opcion').forEach(opcion =>{
    opcion.addEventListener('click', (evento) =>{
        evento.preventDefault();
        const anterior = document.querySelector('.elegido')
        const elegido = evento.target.closest(".opcion")

        contenido.forEach(seccion =>{
            if(seccion.classList.contains('activo')) {seccion.classList.remove('activo')};
        })
        const mostrar = document.querySelector(`#${elegido.dataset.seccion}`)
        mostrar.classList.add('activo')

        anterior.classList.remove('elegido')
        anterior.classList.add('inactivo')

        elegido.classList.remove('inactivo')
        elegido.classList.add('elegido')
    })
})

abrirAside.addEventListener('click', () => {aside.classList.add('mostrar-aside'); console.log('hoola')})
cerrarAside.addEventListener('click', () => {aside.classList.remove('mostrar-aside')})

navegarHistorial.querySelectorAll('button').forEach(opcion =>{
    opcion.addEventListener('click', (evento) => {
        const anterior = document.querySelector('.filtro-activo')
        const elegido = evento.target.closest('.btn-filtro')

        contenidoHistorial.forEach(ar =>{
            if(ar.classList.contains('activo')){ar.classList.remove('activo')}
        })
        const mostrar = document.querySelector(`#${elegido.dataset.article}`)
        mostrar.classList.add('activo')
        anterior.classList.remove('filtro-activo')

        elegido.classList.add('filtro-activo')
    })
})