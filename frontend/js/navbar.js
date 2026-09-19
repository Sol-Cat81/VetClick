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
            max-width: 100%; /* Importante para que no se desborde */
            background: var(--secundario-fondo);
            border-radius: 5px;
            overflow: hidden;
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
                margin-top: 5px; /* Separación de los iconos de arriba */
            }
            /* 2. Aseguramos que los iconos se queden arriba a la derecha */
            .header-icons {
                order: 2; 
            }
        }
      </style>

      <!-- AGREGAMOS LA ETIQUETA HEADER FALTANTE -->
      <header>
        <div class="contenedor">
          <div class="menu">
            <i class="ph-thin ph-list" data-bs-toggle="offcanvas" data-bs-target="#offcanvasWithBothOptions" aria-controls="offcanvasWithBothOptions"></i>
            <a href="${ruta}index.html" class="logo">VetClick</a>
          </div>
          
          <form class="search-bar">
            <input type="text" placeholder="Buscar..." name="search" />
            <button type="submit"><i class="ph-bold ph-magnifying-glass"></i></button>
          </form>
          
          <div class="header-icons">
            <i class="ph-thin ph-shopping-cart"></i>
            <i class="ph-thin ph-heart"></i>
            <i class="ph-thin ph-user"></i>
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
          <ul>
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
    `;
  }
}

// Solo necesitas registrar el componente, eliminamos el eventListener de resize
customElements.define("mi-navbar", MiNavbar);

window.addEventListener("load", async () => {
  try {
    const response = await fetch("http://localhost:3000/api/productos/categorias");

    if (!response.ok) {
      throw new Error("Error al obtener categorías");
    }

    const data = await response.json();
    const categorias = data.categorias;
    const contenedores = document.querySelectorAll(".categoriasPadre");

    contenedores.forEach((contenedor) => {
      contenedor.innerHTML = "";

      categorias.forEach((categoriaPadre) => {
        if (categoriaPadre.subcategorias.length > 0) {
          let subCategorias = "";

          categoriaPadre.subcategorias.forEach((subCat) => {
            subCategorias += `
              <li class="subCategoria" data-id="${subCat.id_categoria}" data-padre="${subCat.categoria_padre}">
                ${subCat.nombre}
              </li>
            `;
          });

          contenedor.innerHTML += `
            <li>
              <details class="categoria-offcanvas">
                <summary data-id="${categoriaPadre.id_categoria}">
                  ${categoriaPadre.nombre}
                  <span class="sub-flecha"><i class="ph-thin ph-caret-down"></i></span>
                </summary>
                <ul>
                  ${subCategorias}
                </ul>
              </details>
            </li>
          `;
        } else {
          contenedor.innerHTML += `
            <li data-id="${categoriaPadre.id_categoria}">
              ${categoriaPadre.nombre}
            </li>
          `;
        }
      });
    });
  } catch (error) {
    console.error("Error de conexión:", error);
    alert("No se pudo conectar con el servidor de la veterinaria.");
  }
});