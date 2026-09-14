// ---------- Animación de entrada ----------

anime
  .timeline({
    easing: "easeOutQuad",
  })
  .add({
    targets: ".login-container",
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 800,
  })
  .add(
    {
      targets: ".logo",
      opacity: [0, 1],
      scale: [0.7, 1],
      duration: 600,
    },
    "-=400",
  )
  .add(
    {
      targets: ".panel-bienvenida h1",
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 500,
    },
    "-=300",
  )
  .add(
    {
      targets: ".descripcion",
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 400,
    },
    "-=250",
  )
  .add(
    {
      targets: ".panel-login",
      opacity: [0, 1],
      translateX: [25, 0],
      duration: 600,
    },
    "-=300",
  );

anime({
  targets: ".icono-login",
  scale: [0.8, 1],
  opacity: [0, 1],
  duration: 700,
  delay: 500,
  easing: "easeOutBack",
});

// ---------- Mostrar / ocultar contraseña ----------
// Un solo listener delegado sirve a los botones de ambos formularios.

const ICONO_OJO_ABIERTO =
  '<svg class="icono-ojo" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICONO_OJO_TACHADO =
  '<svg class="icono-ojo" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c7 0 10.5 7 10.5 7a13.8 13.8 0 0 1-3.1 4.1M6.3 6.9C3.6 8.8 1.5 12 1.5 12s3.5 7 10.5 7a10.4 10.4 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

document.querySelectorAll(".btn-password").forEach(function (boton) {
  boton.addEventListener("click", function () {
    const input = document.getElementById(boton.dataset.target);
    if (!input) return;

    const oculto = input.type === "password";
    input.type = oculto ? "text" : "password";
    boton.innerHTML = oculto ? ICONO_OJO_TACHADO : ICONO_OJO_ABIERTO;
    boton.setAttribute(
      "aria-label",
      oculto ? "Ocultar contraseña" : "Mostrar contraseña",
    );
  });
});

// ---------- Micro-interacción al enfocar un campo ----------

document.querySelectorAll(".input-container input").forEach(function (input) {
  input.addEventListener("focus", function () {
    anime({
      targets: input.parentElement,
      scale: [1, 1.01],
      duration: 200,
      easing: "easeOutQuad",
    });
  });

  input.addEventListener("blur", function () {
    anime({
      targets: input.parentElement,
      scale: 1,
      duration: 200,
      easing: "easeOutQuad",
    });
  });
});

// ---------- Alternar entre "Iniciar sesión" y "Crear cuenta" ----------

const panelLogin = document.getElementById("panelLogin");
const panelRegistro = document.getElementById("panelRegistro");
const irARegistro = document.getElementById("irARegistro");
const irALogin = document.getElementById("irALogin");

function mostrarPanel(panelAMostrar, panelAOcultar) {
  anime({
    targets: panelAOcultar,
    opacity: [1, 0],
    translateX: panelAOcultar === panelLogin ? [0, -20] : [0, 20],
    duration: 200,
    easing: "easeInQuad",
    complete: function () {
      panelAOcultar.hidden = true;
      panelAMostrar.hidden = false;
      anime({
        targets: panelAMostrar,
        opacity: [0, 1],
        translateX: panelAMostrar === panelLogin ? [-20, 0] : [20, 0],
        duration: 250,
        easing: "easeOutQuad",
      });
    },
  });
}

irARegistro.addEventListener("click", function () {
  mostrarPanel(panelRegistro, panelLogin);
});

irALogin.addEventListener("click", function () {
  mostrarPanel(panelLogin, panelRegistro);
});

/* INICIAR SESSION */
const formInicio = document.getElementById("formLogin");

formInicio.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const emailIniciar = document.getElementById("correo-session").value;
  const passwordInciar = document.getElementById("password-session").value;
  const alerta = document.getElementById("loginError");

  const usuario = {
    email: emailIniciar,
    password: passwordInciar,
  };

  try {
    const respuesta = await fetch(
      "http://localhost:3000/api/usuarios/iniciarsession",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Le avisa a Express que le mandamos un JSON
        },
        body: JSON.stringify(usuario),
      },
    );

    const confirmBackend = await respuesta.json();

    if (respuesta.ok) {
      alert(confirmBackend.mensaje);

      localStorage.setItem("usuario", JSON.stringify(confirmBackend.usuario));

      if (confirmBackend.usuario.rol === '1') {
        window.location.href = "./admin/index.html";
      } else {
        window.location.href = "./index.html";
      }
    } else {
      alerta.innerHTML = confirmBackend.mensaje;
    }
  } catch (error) {
    // Esto se ejecuta si el servidor está apagado o no hay internet
    console.error("Error de conexión:", error);
    alert("No se pudo conectar con el servidor de la veterinaria.");
  }
});

/* REGISTRAR USUARIO */
const formRegistro = document.getElementById("formRegistro");

formRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nombreUsuario = document.getElementById("nombre-usuario").value;
  const gmailUsuario = document.getElementById("correo-registro").value;
  const passwordUsuario = document.getElementById("password-registro").value;

  const registrarUsuario = {
    usuario: nombreUsuario,
    gmail: gmailUsuario,
    password: passwordUsuario,
  };

  try {
    const resgistrar = await fetch(
      "http://localhost:3000/api/usuarios/registrarUsuario",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrarUsuario),
      },
    );

    const confirmRegistro = await resgistrar.json();

    if (resgistrar.ok) {
      alert(confirmRegistro.mensaje);
      location.reload();
    } else {
      alert("Hubo un problemas: " + confirmRegistro.mensaje);
    }
  } catch (error) {
    console.error("Error de conexión:", error);
    alert("No se pudo conectar con el servidor de la veterinaria.");
  }
});
