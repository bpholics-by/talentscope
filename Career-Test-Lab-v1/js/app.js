
/* ==========================================================
   HEADER SEARCH
========================================================== */

const searchInput=document.querySelector(".header-search input");

if(searchInput){

    searchInput.addEventListener("focus",()=>{

        document.querySelector(".header-search")
            .style.borderColor="#2563EB";

    });

    searchInput.addEventListener("blur",()=>{

        document.querySelector(".header-search")
            .style.borderColor="#E2E8F0";

    });

}

