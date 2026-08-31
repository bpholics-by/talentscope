/* ==========================================
   PROJECT MODAL
========================================== */

document.addEventListener("DOMContentLoaded",()=>{

const modal=document.getElementById("projectModal");

const open=document.querySelector(".page-header .btn-primary");

const close=document.getElementById("closeModal");

const cancel=document.getElementById("cancelProject");

if(open){

open.onclick=()=>{

modal.classList.add("show");

};

}

if(close){

close.onclick=()=>{

modal.classList.remove("show");

};

}

if(cancel){

cancel.onclick=()=>{

modal.classList.remove("show");

};

}

window.onclick=(e)=>{

if(e.target===modal){

modal.classList.remove("show");

}

};

});