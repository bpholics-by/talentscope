const form = document.getElementById("identityForm");

const nama = document.getElementById("nama");

const nomor = document.getElementById("nomorPeserta");

const namaError = document.getElementById("namaError");

const nomorError = document.getElementById("nomorError");

form.addEventListener("submit", function(e){

    e.preventDefault();

    let valid = true;

    // Reset
    nama.classList.remove("is-invalid","is-valid");
    nomor.classList.remove("is-invalid","is-valid");

    namaError.textContent = "";
    nomorError.textContent = "";

    // Nama
    if(nama.value.trim()===""){

        nama.classList.add("is-invalid");

        namaError.textContent = "Nama lengkap wajib diisi.";

        valid = false;

    }else{

        nama.classList.add("is-valid");

    }

    // Nomor Peserta
    if(nomor.value.trim()===""){

        nomor.classList.add("is-invalid");

        nomorError.textContent = "Nomor peserta wajib diisi.";

        valid = false;

    }else{

        nomor.classList.add("is-valid");

    }

    if(valid){

    const peserta={

        nama:nama.value.trim(),

        nomor:nomor.value.trim(),

        email:document.getElementById("email").value.trim(),

        gender:document.getElementById("gender").value,

        pendidikan:document.getElementById("pendidikan").value

    };

    localStorage.setItem(
        "peserta",
        JSON.stringify(peserta)
    );

    window.location.href="petunjuk.html";

}

});