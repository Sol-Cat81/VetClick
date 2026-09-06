const header = document.querySelector('header')
const busqueda = document.querySelector('.search-bar')
const contenedor = document.querySelector('.contenedor')

/*==========================================

       = = = = = FUNCIONES = = = = =

============================================*/
function cerrarLoader(){
   let loader = document.querySelector('.loader');
   loader.style.display = 'none';
}
const reponsive = () => {
  if(window.innerWidth < 600){
    header.appendChild(busqueda)
  }else{
    contenedor.appendChild(busqueda)
  }
}
reponsive()

/*==========================================

         = = = = = EVENTOS = = = = =
       
============================================*/

window.addEventListener('load', () => {
    cerrarLoader()
})
window.addEventListener('resize', reponsive)