class MiNavbar extends HTMLElement {
  connectedCallback() {
    const ruta = this.getAttribute("ruta-base") || "";

    this.innerHTML = `
      <style>
        /* BARRA DE NAVEGACION */
        header {
            background-color: var(--elem-importantes);
            color: var(--secundario-fondo);
            padding: 10px 20px;
            position: sticky;
            z-index: 1000;
            top: 0px;
            width: 100%;
            box-sizing: border-box;
        }
        
        header .contenedor {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 1200px;
            margin: 0px auto;
            gap: 10px; 
        }
        
        header a {
            color: var(--secundario-fondo);
            text-decoration: none;
        }
        
        .menu {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .menu i {
            font-size: 25px;
            transition: all 0.3s ease-in-out;
            cursor: pointer;
        }
        
        .menu i:hover, .header-icons i:hover {
            color: var(--elem-secun);
        }
        
        .header-icons i:hover {
            transform: scale(1.3);
        }

        .logo {
            font-family: 'titulo';
            font-size: 2.5rem;
        }

        .search-bar {
            display: flex;
            align-items: center;
            width: 500px;
            max-width: 100%;
            background: var(--secundario-fondo);
            border-radius: 5px;
          position: relative;
            /* Le damos un orden por defecto */
            order: 2; 
        }

        .search-bar input {
            flex: 1;
            border: none;
            background: transparent;
            padding: 5px 10px;
            font-size: 16px;
            outline: none;
            min-width: 0; /* Evita que el input rompa el flexbox en pantallas chicas */
        }

        .search-bar button {
            background: var(--secundario-fondo);
            border: 2px solid var(--elem-secun);
            border-radius: 0px 5px 5px 0px;
            padding: 2px 10px;
            font-size: 20px;
            cursor: pointer;
            color: var(--elem-secun);
        }

        .search-bar button:hover {
            background: var(--elem-secun);
            color: var(--secundario-fondo);
            border: 1px solid var(--elem-secun);
        }

        .search-suggestions {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 1200;
          max-height: 280px;
          overflow-y: auto;
          background: var(--secundario-fondo);
          border: 1px solid #d4dddd;
          border-radius: 5px;
          box-shadow: 0 6px 16px #0002;
        }

        .search-suggestions[hidden] { display: none; }

        .search-suggestion {
          display: block;
          padding: 10px 12px;
          color: var(--texto, #263238);
          text-decoration: none;
          letter-spacing: 0;
        }

        .search-suggestion:hover,
        .search-suggestion[aria-selected="true"] {
          background: #e8f3f2;
          color: var(--elem-importantes);
        }

        .search-suggestions-empty {
          padding: 10px 12px;
          color: #5f6b6b;
        }

        .categoriasPadre .categoria-link {
          display: block;
          padding: 7px 10px;
          color: var(--secundario-fondo);
          text-decoration: none;
        }

        .categoriasPadre .categoria-link:hover {
          color: var(--elem-secun);
          background: #60a5ba49;
        }

        .categoriasPadre ul {
          padding-left: 14px;
        }
        
        .header-icons {
            letter-spacing: 10px;
            font-size: 20px;
            /* Le damos un orden por defecto */
            order: 3;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .header-icons i {
            transition: all 0.3s ease-in-out;
            cursor: pointer;
        }
        #usarioSession{
            letter-spacing: 0px;
        }

        /* Barra lateral */
        .offcanvas {
            background-color: #155f7569;
            backdrop-filter: blur(10px);
            color: var(--secundario-fondo);
            }
        .offcanvas-body {
            padding: 0px 40px;
            }
        .offcanvas .ofcanvas-nav {
            padding: 10px 10px;
            transition: all 0.3s ease-in-out;
            width: 100%;
            border-radius: 5px;
            display: block;
            }
        .desplegar-categoria summary:first-child {
            padding: 10px;
            transition: all 0.3s ease-in-out;
            display: block;
            border-radius: 5px;
            cursor: pointer;
            }
        .offcanvas .ofcanvas-nav:hover,
            details summary:hover {
            font-weight: bold;
            transform: scale(1.04);
            background-color: #60a5ba49;
            }
        .offcanvas-body li, a, details, summary {
            list-style: none;
            text-decoration: none;
            color: var(--secundario-fondo);
            }
        .offcanvas ul {
            margin: 0;
            padding: 0%;
            }
        .categoria-offcanvas {
            padding: 5px;
            cursor: pointer;
            }
        .flecha, .sub-flecha {
            font-size: 13px;
            display: inline-block;
            transition: transform 0.2s;
            }
        details ul li {
            padding-left: 15px;
            margin-top: 5px;
            }
        .categoria-offcanvas ul li:hover {
            color: var(--elem-secun);
            font-weight: bold;
            transform: scale(1.04);
            cursor: pointer;
            }
        .categoria-offcanvas[open] .sub-flecha, .desplegar-categoria[open] .flecha {
            transform: rotate(180deg);
            }
        .logo-offcanvas img {
            width: 70px;
            margin-left: -10px;
            }
        .logo-offcanvas {
            font-size: 1.8rem;
            font-family: "titulo";
            align-content: center;
            display: flex;
            align-items: center;
            }
        .offcanvas-footer {
            padding: 0px 0px 10px 30px;
            }
        .offcanvas-correo {
            margin-top: 10px;
            }
            .contenedor-carrito {
              position: relative;
              display: inline-flex;
              align-items: center;
          }
        .badge-carrito {
              position: absolute;
              top: -6px;
              right: -10px;
              background-color: var(--secundario-fondo);
              color: var(--elem-importantes);
              font-size: 11px;
              font-weight: bold;
              border-radius: 50%;
              padding: 2px;
              line-height: 1;
              letter-spacing: 1px;
              width: fit-content;
              text-align: center;
          }

          .d-none {
              display: none !important;
          }
        /* =========================================
           MEDIA QUERIES
           ========================================= */
        @media (max-width: 990px) {
            .search-bar { width: 40%; }
        }

        @media (max-width: 600px) {
            /* 1. Mandamos la barra de búsqueda al final */
            .search-bar {
                order: 4; 
                width: 100%; 
            }
            /* 2. Aseguramos que los iconos se queden arriba a la derecha */
            .header-icons {
                order: 2; 
            }
            .logo {
            font-size: 2rem;
        }
            .search-bar input {
            padding: 2px 10px;
            font-size: 12px;
        }
            .search-bar button {
            padding: 2px 10px;
            font-size: 15px;
            aling-items: center;
        }
        }
      </style>

      <header>
        <div class="contenedor">
          <div class="menu">
            <i class="ph-thin ph-list" data-bs-toggle="offcanvas" data-bs-target="#offcanvasWithBothOptions" aria-controls="offcanvasWithBothOptions"></i>
            <a href="${ruta}index.html" class="logo">VetClick</a>
          </div>
          
          <form class="search-bar" role="search" autocomplete="off">
            <input type="search" placeholder="Buscar productos..." name="search" aria-label="Buscar productos" aria-autocomplete="list" aria-controls="search-suggestions" aria-expanded="false" />
            <button type="submit" aria-label="Buscar"><i class="ph-bold ph-magnifying-glass"></i></button>
            <div class="search-suggestions" id="search-suggestions" role="listbox" hidden></div>
          </form>
          
          <div class="header-icons">
            <a href="${ruta}pages/carrito.html" aria-label="Ver carrito" class="contenedor-carrito">
            <i class="ph-thin ph-shopping-cart"></i>
            <span id="contador-carrito" class="badge-carrito d-none">0</span>
            </a>
            <a href="${ruta}login.html" id="usarioSession"><i class="ph-thin ph-user"></i></a>
          </div>
        </div>
      </header>

      <!-- Offcanvas (Menú lateral) -->
      <div class="offcanvas offcanvas-start" data-bs-scroll="true" tabindex="-1" id="offcanvasWithBothOptions" aria-labelledby="offcanvasWithBothOptionsLabel">
        <div class="offcanvas-header">
          <h5 class="offcanvas-title" id="offcanvasWithBothOptionsLabel">Menu</h5>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
          <ul class="navegacion">
            <li><a href="${ruta}index.html" class="ofcanvas-nav">Inicio</a></li>
            <li><a href="${ruta}pages/servicios.html" class="ofcanvas-nav">Servicios</a></li>
            <li><a href="${ruta}pages/turnos.html" class="ofcanvas-nav">Turnos</a></li>
            <li><a href="${ruta}pages/productos.html" class="ofcanvas-nav">Productos</a></li>
          </ul>
          
          <details class="desplegar-categoria">
            <summary>Categorias <span class="flecha"><i class="ph-thin ph-caret-down"></i></span></summary>
            <ul class="categoriasPadre">
            </ul>
          </details>
        </div>
        
        <div class="offcanvas-footer">
          <div class="logo-offcanvas">
            <img src="${ruta}assets/icons/ChatGPT-Image-Logo.png" alt="Logo VetClick" />
            <span>VetClick</span>
          </div>
          <div class="offcanvas-correo">vetclick2026@gmail.com</div>
        </div>
      </div>

      <div class="toast-container position-fixed botton-0 end-0 p-3" style="z-index: 2000;">
        <div id="miToast" class="toast align-items-center border-0" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body" id="toast-mensaje">
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      </div>

    `;

    const formularioBusqueda = this.querySelector(".search-bar");
    const entradaBusqueda = formularioBusqueda.querySelector('input[name="search"]');
    const sugerenciasBusqueda = formularioBusqueda.querySelector(".search-suggestions");
    let solicitudProductos;
    let indiceSugerenciaActiva = -1;

    const crearRutaCatalogo = (parametros) => {
      const consulta = new URLSearchParams(parametros);
      return `${ruta}pages/catalogo.html?${consulta.toString()}`;
    };

    const normalizarTexto = (texto) => texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");

    const obtenerProductosBusqueda = () => {
      solicitudProductos ||= fetch("http://127.0.0.1:3000/api/productos")
        .then((respuesta) => {
          if (!respuesta.ok) throw new Error("No se pudieron cargar las sugerencias.");
          return respuesta.json();
        })
        .then((productos) => Array.isArray(productos) ? productos : Object.values(productos || {}));
      return solicitudProductos;
    };

    const ocultarSugerencias = () => {
      sugerenciasBusqueda.hidden = true;
      sugerenciasBusqueda.replaceChildren();
      entradaBusqueda.setAttribute("aria-expanded", "false");
      indiceSugerenciaActiva = -1;
    };

    const mostrarSugerencias = async () => {
      const termino = entradaBusqueda.value.trim();
      if (!termino) {
        ocultarSugerencias();
        return;
      }

      try {
        const productos = await obtenerProductosBusqueda();
        if (entradaBusqueda.value.trim() !== termino) return;
        const consulta = normalizarTexto(termino);
        const coincidencias = productos
          .filter((producto) => normalizarTexto(`${producto.nombre} ${producto.descripcion || ""}`).includes(consulta))
          .slice(0, 6);

        sugerenciasBusqueda.replaceChildren();
        if (!coincidencias.length) {
          const mensaje = document.createElement("div");
          mensaje.className = "search-suggestions-empty";
          mensaje.textContent = "Sin sugerencias";
          sugerenciasBusqueda.append(mensaje);
        } else {
          coincidencias.forEach((producto) => {
            const sugerencia = document.createElement("a");
            sugerencia.className = "search-suggestion";
            sugerencia.setAttribute("role", "option");
            sugerencia.setAttribute("aria-selected", "false");
            sugerencia.href = crearRutaCatalogo({ q: producto.nombre });
            sugerencia.textContent = producto.nombre;
            sugerenciasBusqueda.append(sugerencia);
          });
        }

        sugerenciasBusqueda.hidden = false;
        entradaBusqueda.setAttribute("aria-expanded", "true");
        indiceSugerenciaActiva = -1;
      } catch (error) {
        console.error("Error al cargar sugerencias:", error);
        ocultarSugerencias();
      }
    };

    formularioBusqueda.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const termino = entradaBusqueda.value.trim();
      if (!termino) return;
      window.location.href = crearRutaCatalogo({ q: termino });
    });

    entradaBusqueda.addEventListener("input", mostrarSugerencias);
    entradaBusqueda.addEventListener("focus", mostrarSugerencias);
    entradaBusqueda.addEventListener("keydown", (evento) => {
      const opciones = Array.from(sugerenciasBusqueda.querySelectorAll(".search-suggestion"));
      if (evento.key === "Escape") {
        ocultarSugerencias();
        return;
      }
      if (!opciones.length) return;

      if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
        evento.preventDefault();
        const direccion = evento.key === "ArrowDown" ? 1 : -1;
        indiceSugerenciaActiva = indiceSugerenciaActiva < 0 && direccion < 0
          ? opciones.length - 1
          : (indiceSugerenciaActiva + direccion + opciones.length) % opciones.length;
        opciones.forEach((opcion, indice) => opcion.setAttribute("aria-selected", String(indice === indiceSugerenciaActiva)));
      } else if (evento.key === "Enter" && indiceSugerenciaActiva >= 0) {
        evento.preventDefault();
        window.location.href = opciones[indiceSugerenciaActiva].href;
      }
    });

    document.addEventListener("click", (evento) => {
      if (!this.contains(evento.target)) ocultarSugerencias();
    });
  }
}

customElements.define("mi-navbar", MiNavbar);

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

window.addEventListener("load", async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:3000/api/productos/categorias",
    );

    if (!response.ok) {
      throw new Error("Error al obtener categorías");
    }

    const data = await response.json();
    const categorias = data.categorias;
    const contenedores = document.querySelectorAll(".categoriasPadre");

    const rutaBaseCatalogo = document.querySelector("mi-navbar")?.getAttribute("ruta-base") || "";

    const crearElementoCategoria = (categoria) => {
      const elemento = document.createElement("li");
      const enlace = document.createElement("a");
      const parametros = new URLSearchParams({ categoria: categoria.id_categoria });
      enlace.className = "categoria-link";
      enlace.href = `${rutaBaseCatalogo}pages/catalogo.html?${parametros.toString()}`;
      enlace.textContent = categoria.nombre;
      elemento.append(enlace);

      if (categoria.subcategorias?.length) {
        const hijas = document.createElement("ul");
        categoria.subcategorias.forEach((hija) => hijas.append(crearElementoCategoria(hija)));
        elemento.append(hijas);
      }

      return elemento;
    };

    contenedores.forEach((contenedor) => {
      contenedor.replaceChildren(...categorias.map(crearElementoCategoria));
    });

    let confirmaSession = await fetch(
      "http://127.0.0.1:3000/api/usuarios/verificarsession",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    const controlUsuario = document.getElementById("usarioSession");
    const offCanvas = document.querySelector(".navegacion");

    if (confirmaSession.status === 401) {
      const refresh = await fetch(
        "http://127.0.0.1:3000/api/usuarios/refresh",
        {
          method: "POST",
          credentials: "include"
        }
      );

      if (!refresh.ok) {
        return;
      }

      // Ya tenemos un nuevo access token.
      confirmaSession = await fetch("http://127.0.0.1:3000/api/usuarios/verificarsession", {
        credentials: "include"
      })
    }
    const session = await confirmaSession.json();

    if (confirmaSession.ok) {
      controlUsuario.innerHTML = ``;
      offCanvas.innerHTML += `
      <li><a href="#" class="ofcanvas-nav">Mi cuenta</a></li>
      <li onclick="cerrarSession()" class="ofcanvas-nav">Cerrar Sesion</li>
      `
      actualizarContadorCarrito();
    } else {
      console.log("no hay session");
      return;
    }
  } catch (error) {
    console.error("Error de conexión:", error);
    mostrarToast('No se pudo conectar con el sevidor.', 'error');
  }
});

async function cerrarSession() {
  try {
    const cerrarSession = await fetch('http://127.0.0.1:3000/api/usuarios/logout', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    const cerrado = await cerrarSession.json();
    if (cerrarSession.ok) {
      mostrarToast(cerrado.mensaje || 'Sesión cerrada con éxito.', 'exito');

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } else {
      mostrarToast('No se pudo cerrar sesión.', 'error');
    }
  } catch (error) {
    console.error("Error de conexión:", error);
    mostrarToast('No se pudo conectar con el servidor.', 'error');
  }
}

async function leerRespuestaJson(respuesta) {
  const contenido = await respuesta.text();

  try {
    return contenido ? JSON.parse(contenido) : {};
  } catch {
    throw new Error(
      `El servidor devolvió una respuesta no válida (${respuesta.status})`,
    );
  }
}

// Función global para actualizar el número del carrito desde cualquier parte
async function actualizarContadorCarrito() {
  const contador = document.getElementById("contador-carrito");
  if (!contador) return;

  try {
    const response = await fetch("http://127.0.0.1:3000/api/productos/carrito/cargar", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      const total = Number(data.cant) || 0;

      if (total > 0) {
        contador.textContent = total;
        contador.classList.remove("d-none");
      } else {
        contador.classList.add("d-none");
      }
    } else {
      contador.classList.add("d-none");
    }
  } catch (error) {
    console.error("Error al obtener cantidad del carrito:", error);
    contador.classList.add("d-none");
  }
}

window.actualizarContadorCarrito = actualizarContadorCarrito;
// tipo como q no me funciona los botos de acciones del admin