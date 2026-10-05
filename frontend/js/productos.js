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

const contenedorProdDestacados = document.querySelector(".productos-destacados",);
const contenedorCategorias = document.querySelector(".contenedor-categorias");
const contenedorMarcas = document.querySelector(".contenedor-marcas");
const categorias404 = "../assets/icons/bookmark.svg";
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

const calcularPrecioConDescuento = (precio, descuento) => precio * (1 - descuento / 100);

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

// Envía al carrito la variante seleccionada y muestra el resultado de la API.
async function agregarAlCarrito(idProducto){
  const productoSelect = document.querySelector(`#id-${idProducto}`)
  const varianteSelect = productoSelect.querySelector('.elegido')
  const variante = Number(varianteSelect.dataset.id)
  let cantidad = 1

  const enviar = await fetch('http://127.0.0.1:3000/api/productos/carrito/agregar',{
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({variante, cantidad})
  })

  const respuesta = await enviar.json();

  if(enviar.ok){
    mostrarToast('Producto agreagado al carrito!', 'exito');
    if (typeof window.actualizarContadorCarrito === 'function') {
    window.actualizarContadorCarrito();
  }
  }else{
    mostrarToast(respuesta.mensaje || 'No se pudo agregar al carrito :(', 'error')
  }
}

function cargarCategorias(categorias){
  categorias.forEach((categoria) => {
    const parametros = new URLSearchParams({ categoria: categoria.id_categoria });
    const cardCategoria = document.createElement("div");
    cardCategoria.classList.add("col");
    cardCategoria.innerHTML = `
      <div class="card-categorias mx-auto" data-id="${categoria.id_categoria}" onclick="window.location.href='catalogo.html?${parametros.toString()}'">
        <img src="${categoria.imagen || categorias404}" alt="..." />
        <div class="card-body">
          <div class="card-title">${categoria.nombre}</div>
        </div>
      </div>
    `;
    contenedorCategorias.appendChild(cardCategoria);
  });
}

function cargarMarcas(marcas){
  marcas.forEach((marca) => {
    const cardMarca = document.createElement("div");
    const parametros = new URLSearchParams({ categoria: marca.id_marca });
    cardMarca.classList.add("col");
    cardMarca.innerHTML = `
      <div class="card-marcas mx-auto" onclick="window.location.href='catalogo.html?${parametros.toString()}'">
        <img src="${marca.imagen || imagen404}" alt="..." />
        <div class="card-body">
          <div class="card-title">${marca.nombre}</div>
        </div>
      </div>
    `;
    contenedorMarcas.appendChild(cardMarca);
  });
}

/*==========================================

         = = = = = EVENTOS = = = = =
       
============================================*/

window.addEventListener("load", async () => {
  try {
    const solicitarCategorias = await fetch(
      "http://127.0.0.1:3000/api/productos/categoriasPadre"
    );
    const categorias = await solicitarCategorias.json();

    cargarCategorias(categorias);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    mostrarToast('No se pudo conectar con el sevidor.', 'error');
  }
  
  try {
    const solicitarMarcas = await fetch(
      "http://127.0.0.1:3000/api/productos/marcas"
    );
    const marcas = await solicitarMarcas.json();

    cargarMarcas(marcas);
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    mostrarToast('No se pudo conectar con el sevidor.', 'error');
  }

  try {
    const solicitarDestacados = await fetch(
      "http://127.0.0.1:3000/api/productos/destacados",
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
              }" data-id="${variante.id}" data-atributo="${variante.id_atributo ?? ""}" data-precio="${variante.precio}" data-stock="${variante.stock}">${variante.atributo || "Disponible"}</button>`,
          )
          .join("");

        contenedorProdDestacados.innerHTML += `
          <div class="swiper-slide">
                <div class="card-productos mx-auto" id="id-${prod.id}" data-descuento="${descuento}">
                  <img
                    src="${prod.imagen || imagen404}"
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
                    <button class="btn btn-comprar" onclick="agregarAlCarrito(${prod.id})">Comprar</button>
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

        });
    });

    swiperProductos.update();
  } catch (error) {
    console.error("Error de conexión:", error);
    mostrarToast('No se pudo conectar con el sevidor.', 'error');
  }
});
