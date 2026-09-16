const swiper = new Swiper('.swiper-hero', {
  // Optional parameters
  direction: 'horizontal',
  loop: true,
  allowTouchMove: true,

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
    type: 'bullets',
    dynamicBullets: true,
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  effect: 'fade',
  fadeEffect: {
    crossFade: true
  }
});

const swiperBeneficios = new Swiper('.swiper-cards-beneficios', {
  slidesPerView: 'auto',
  spaceBetween: 20,
  watchOverflow: true,
  centerInsufficientSlides: true,
  direction: 'horizontal',
  allowTouchMove: true,
});

const swiperProductos = new Swiper('.swiper-productos', {
  slidesPerView: 'auto',
  spaceBetween: 20,
  centerInsufficientSlides: true,
  watchOverflow: true,
  direction: 'horizontal',
  pagination: {
    el: '.swiper-pagination',
    type: 'bullets',
    dynamicBullets: true,
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  }
});
const header = document.querySelector('header')
const busqueda = document.querySelector('.search-bar')
const contenedor = document.querySelector('.contenedor')

const contenedorProdDestacados = document.querySelector('.swiper-wrapper')

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

window.addEventListener('load', async() => {
    cerrarLoader()
    try {
      const solicitarDestacados = await fetch('http://localhost:3000/api/productos/destacados');

      const destacados = await solicitarDestacados.json();

      if(solicitarDestacados.ok){
        contenedorProdDestacados.innerHTML = ''

        destacados.forEach(prod => {
          contenedorProdDestacados.innerHTML = `
          <div class="swiper-slide">
                <div class="card-productos mx-auto">
                  <img
                    src="https://jumboargentina.vtexassets.com/arquivos/ids/760152/Alimento-Para-Perros-Pedigree-Cachorros-1-5-Kg-1-38587.jpg?v=638048145825670000"
                    class="card-img-top"
                    alt="..."
                  />
                  <div class="card-body">
                    <h5 class="card-title">Alimento para perro</h5>
                    <div class="card-text">
                      Some quick example text to build on the
                    </div>
                  </div>
                  <div class="card-pie">
                    <div class="precio">$29.99</div>
                    <button class="btn btn-comprar">Comprar</button>
                  </div>
                </div>
              </div>
          `
        });
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo conectar con el servidor de la veterinaria.");
    }
})
window.addEventListener('resize', reponsive)
