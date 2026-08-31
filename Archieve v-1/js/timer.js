let waktu = 600;

const timer =
document.getElementById("timer");

function hitung(){

let menit =
Math.floor(waktu/60);

let detik =
waktu%60;

if(menit<10){

menit="0"+menit;

}

if(detik<10){

detik="0"+detik;

}

timer.innerHTML=
menit+":"+detik;

waktu--;

if(waktu<0){

location.href="hasil.html";

}

}

setInterval(hitung,1000);