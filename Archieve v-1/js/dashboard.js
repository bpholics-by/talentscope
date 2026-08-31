/* ==========================================
   LOAD PARTICIPANT DATA
========================================== */

const peserta = JSON.parse(localStorage.getItem("peserta"));

if(!peserta){

    window.location.href="identitas.html";

}

// ======================================
// CAREER TEST LAB
// Dashboard JavaScript
// ======================================

// Ambil data peserta
let namaPeserta = localStorage.getItem("namaPeserta");

if (namaPeserta == null || namaPeserta == "") {
    namaPeserta = "Peserta";
}

// Tampilkan nama
const namaElement = document.getElementById("namaPeserta");

if (namaElement) {
    namaElement.innerHTML = namaPeserta;
}

// ======================================
// Progress
// ======================================

let progress = Number(localStorage.getItem("progress"));

if (isNaN(progress)) {
    progress = 25;
}

const progressBar = document.getElementById("progressBar");
const progressValue = document.getElementById("progressValue");

if (progressBar) {
    progressBar.style.width = progress + "%";
}

if (progressValue) {
    progressValue.innerHTML = progress + "%";
}

// ======================================
// Animasi Progress
// ======================================

if (progressBar) {

    progressBar.style.width = "0%";

    setTimeout(function () {

        progressBar.style.transition = "1.2s";

        progressBar.style.width = progress + "%";

    }, 300);

}

// ======================================
// Greeting
// ======================================

const jam = new Date().getHours();

let salam = "Selamat Datang";

if (jam >= 5 && jam < 11) {
    salam = "Selamat Pagi";
}

if (jam >= 11 && jam < 15) {
    salam = "Selamat Siang";
}

if (jam >= 15 && jam < 18) {
    salam = "Selamat Sore";
}

if (jam >= 18) {
    salam = "Selamat Malam";
}

const judul = document.querySelector(".header p");

if (judul) {
    judul.innerHTML = salam + ", semoga sukses mengerjakan assessment.";
}

// ======================================
// Efek Hover Card
// ======================================

const cards = document.querySelectorAll(".card");

cards.forEach(function(card){

    card.addEventListener("mouseenter", function(){

        this.style.transform = "translateY(-8px) scale(1.02)";

    });

    card.addEventListener("mouseleave", function(){

        this.style.transform = "translateY(0px)";

    });

});

// ======================================
// Console
// ======================================

console.log("Career Test Lab Dashboard Loaded");

/* ==========================================
   UPDATE DASHBOARD
========================================== */

const namaPeserta = document.getElementById("namaPeserta");

const avatar = document.getElementById("avatar");

if(namaPeserta){

    namaPeserta.textContent = peserta.nama;

}

if(avatar){

    avatar.textContent =
        peserta.nama.charAt(0).toUpperCase();

}s