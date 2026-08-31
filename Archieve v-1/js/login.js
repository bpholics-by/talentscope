document.addEventListener("DOMContentLoaded",()=>{

    const form=document.querySelector("#loginForm");

    if(!form) return;

    form.addEventListener("submit",(e)=>{

        e.preventDefault();

        const username=document.querySelector("#username").value.trim();

        const password=document.querySelector("#password").value;

        if(Auth.login(username,password)){

            location.href="pages/dashboard.html";

        }else{

            alert("Username atau Password salah");

        }

    });

});