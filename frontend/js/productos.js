const swiper = new Swiper(".swiper-hero", {
  // Optional parameters
  direction: "horizontal",
  loop: true,
  allowTouchMove: true,

  // If we need pagination
  pagination: {
    el: ".swiper-pagination",
    type: "bullets",
    dynamicBullets: true,
  },

  // Navigation arrows
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  effect: "fade",
  fadeEffect: {
    crossFade: true,
  },
});

const swiperBeneficios = new Swiper(".swiper-cards-beneficios", {
  slidesPerView: "auto",
  spaceBetween: 20,
  watchOverflow: true,
  centerInsufficientSlides: true,
  direction: "horizontal",
  allowTouchMove: true,
});

const swiperProductos = new Swiper(".swiper-productos", {
  slidesPerView: "auto",
  loop: false,
  spaceBetween: 20,
  centerInsufficientSlides: true,
  watchOverflow: true,
  direction: "horizontal",
  pagination: {
    el: ".swiper-pagination",
    type: "bullets",
    dynamicBullets: true,
  },

  // Navigation arrows
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});

const contenedorProdDestacados = document.querySelector(
  ".productos-destacados",
);
const imagen404 =
  "https://assets.hellovector.com/product-images/b_5023.jpg";

/*==========================================

       = = = = = FUNCIONES = = = = =

============================================*/

const formatearNumero = (numero) => {
  // Si el número es entero (decimales igual a 0), no muestra decimales
  const decimales = numero % 1 === 0 ? 0 : 2;

  return new Intl.NumberFormat('es-AR', { // 'es-AR' o 'es-ES' usan punto para miles y coma para decimales
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(numero);
};

const calcularPrecioConDescuento = (precio, descuento) =>
  precio * (1 - descuento / 100);

const renderizarPrecio = (precio, descuento) => {
  const precioFinal = calcularPrecioConDescuento(precio, descuento);

  if (descuento <= 0) {
    return `$${formatearNumero(precio)}`;
  }

  return `
    <span class="precio-nuevo">$${formatearNumero(precioFinal)}</span>
    <span class="precio-anterior">$${formatearNumero(precio)}</span>
  `;
};

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
        delay: 3000 // Se ocultará solo después de 3 segundos (3000 ms)
    });
    
    toast.show();
}

/*==========================================

         = = = = = EVENTOS = = = = =
       
============================================*/

window.addEventListener("load", async () => {
  try {
    const solicitarDestacados = await fetch(
      "http://localhost:3000/api/productos/destacados",
    );

    if (!solicitarDestacados.ok) {
      throw new Error(
        `Error al obtener productos destacados (${solicitarDestacados.status})`,
      );
    }

    const destacados = await solicitarDestacados.json();

    contenedorProdDestacados.innerHTML = "";

    destacados
      .filter((prod) => prod.variantes.length > 0)
      .forEach((prod) => {
        const primeraVariante = prod.variantes[0];
        const descuento = Number(prod.descuento) || 0;
        const variantes = prod.variantes
          .map(
            (variante, indice) =>
              `<button type="button" class="opcion${
                indice === 0 ? " elegido" : ""
              }" data-id="${variante.id}" data-atributo="${variante.id_atributo ?? ""}" data-precio="${variante.precio}" data-stock="${variante.stock}" data-imagen="${variante.imagen || ""}">${variante.atributo || "Disponible"}</button>`,
          )
          .join("");

        contenedorProdDestacados.innerHTML += `
          <div class="swiper-slide">
                <div class="card-productos mx-auto" data-producto-id="${prod.id}" data-descuento="${descuento}">
                  <img
                    src="${prod.imagen || primeraVariante.imagen || imagen404}"
                    class="card-img-top"
                    onerror="this.onerror=null; this.src='${imagen404}';" 
                    alt="${prod.nombre}"
                  />
                  ${prod.descuento > 0 ? `<div class="desc">${prod.descuento}%</div>` : ""}
                  <div class="card-body">
                    <h6 class="card-title"><b>${prod.nombre}</b></h6>
                    <div class="card-text">
                    ${variantes}
                    </div>
                  </div>
                  <div class="card-pie">
                    <div class="precio">${renderizarPrecio(
                      Number(primeraVariante.precio),
                      descuento,
                    )}</div>
                    <button class="btn btn-comprar">Comprar</button>
                  </div>
                </div>
              </div>
          `;
      });

    contenedorProdDestacados.querySelectorAll(".card-productos").forEach((tarjeta) => {
        tarjeta.addEventListener("click", (evento) => {
          const opcion = evento.target.closest(".opcion");

          if (!opcion || !tarjeta.contains(opcion)) return;

          tarjeta.querySelectorAll(".opcion").forEach((variante) => {
            variante.classList.remove("elegido");
          });
          opcion.classList.add("elegido");

          tarjeta.querySelector(".precio").innerHTML = renderizarPrecio(
            Number(opcion.dataset.precio),
            Number(tarjeta.dataset.descuento) || 0,
          );

          const imagen = tarjeta.querySelector(".card-img-top");
          imagen.onerror = () => {
            imagen.onerror = null;
            imagen.src = imagen404;
          };
          imagen.src = opcion.dataset.imagen || prod.imagen || imagen404;
        });
    });

    swiperProductos.update();
  } catch (error) {
    console.error("Error de conexión:", error);
    mostrarToast('No se pudo conectar con el sevidor.', 'error');
  }
});
