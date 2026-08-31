const peserta=JSON.parse(localStorage.getItem("peserta"));

if(!peserta){

    window.location.href="identitas.html";

}

document.getElementById("infoNama").textContent =
    peserta.nama || "-";

document.getElementById("infoNomor").textContent =
    peserta.nomor || "-";

document.getElementById("infoEmail").textContent =
    peserta.email || "-";

document.getElementById("infoPendidikan").textContent =
    peserta.pendidikan || "-";