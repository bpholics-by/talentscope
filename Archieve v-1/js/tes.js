let nomor = 0;

let jawabanPeserta = [];

const pertanyaan = document.getElementById("pertanyaan");

const jawaban = document.getElementById("jawaban");

const nomorSoal = document.getElementById("nomor");

const progressBar = document.getElementById("progressBar");

const btnNext = document.getElementById("next");

const btnPrev = document.getElementById("prev");

function tampilSoal(){

const data = soalVerbal[nomor];

nomorSoal.innerHTML =
"Soal " + (nomor+1) +
" dari " +
soalVerbal.length;

pertanyaan.innerHTML =
data.pertanyaan;

jawaban.innerHTML="";

data.pilihan.forEach((item,index)=>{

const div=document.createElement("div");

div.className="option";

div.innerHTML=item;

if(jawabanPeserta[nomor]==index){

div.classList.add("selected");

}

div.onclick=()=>{

jawabanPeserta[nomor]=index;

tampilSoal();

};

jawaban.appendChild(div);

});

progressBar.style.width=
((nomor+1)/soalVerbal.length*100)+"%";

btnPrev.disabled=(nomor==0);

if(nomor==soalVerbal.length-1){

btnNext.innerHTML="Selesai";

}else{

btnNext.innerHTML="Berikutnya";

}

}

btnNext.onclick=()=>{

if(nomor<soalVerbal.length-1){

nomor++;

tampilSoal();

}else{

location.href="hasil.html";

}

};

btnPrev.onclick=()=>{

if(nomor>0){

nomor--;

tampilSoal();

}

};

tampilSoal();