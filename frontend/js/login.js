anime.timeline({
    easing: 'easeOutQuad'
})

.add({
    targets: '.login-container',
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 800
})

.add({
    targets: '.logo',
    opacity: [0, 1],
    scale: [0.7, 1],
    duration: 600
}, '-=400')

.add({
    targets: '.panel-bienvenida h1',
    opacity: [0, 1],
    translateY: [15, 0],
    duration: 500
}, '-=300')

.add({
    targets: '.descripcion',
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 400
}, '-=250')

.add({
    targets: '.mascotas',
    opacity: [0, 1],
    translateY: [25, 0],
    duration: 600
}, '-=200')

.add({
    targets: '.panel-login',
    opacity: [0, 1],
    translateX: [25, 0],
    duration: 600
}, '-=500');

anime({
    targets: '.icono-login',
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 700,
    delay: 500,
    easing: 'easeOutBack'
});

const password = document.getElementById('password');
const botonPassword =
    document.getElementById('mostrarPassword');

botonPassword.addEventListener('click', function () {
    if (password.type === 'password') {
        password.type = 'text';
        botonPassword.textContent = '🙈';
    } else {
        password.type = 'password';
        botonPassword.textContent = '👁';
    }

});

const inputs =
    document.querySelectorAll('.input-container input');


inputs.forEach(function(input) {

    input.addEventListener('focus', function() {

        anime({
            targets: input.parentElement,
            scale: [1, 1.01],
            duration: 200,
            easing: 'easeOutQuad'
        });
    });


    input.addEventListener('blur', function() {
        anime({
            targets: input.parentElement,
            scale: 1,
            duration: 200,
            easing: 'easeOutQuad'
        });

    });

});

const formulario =
    document.getElementById('formLogin');


formulario.addEventListener('submit', function(event) {
    event.preventDefault();
    anime({
        targets: '.btn-login',
        scale: [1, 0.97, 1],
        duration: 300,
        easing: 'easeInOutQuad'
    });
});