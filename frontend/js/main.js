
// = = = = = VARIABLES = = = = =
const header = document.querySelector("header")

// = = = = = FUNCIONES = = = = =
// JavaScript


// = = = = = EVENTOS = = = = =
window.addEventListener("scroll", () => {
    if(window.scrollY > 100){
        header.classList.add("scroll");
    }else{
        header.classList.remove("scroll");
    }
});