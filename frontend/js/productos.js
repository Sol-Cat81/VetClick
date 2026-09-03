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