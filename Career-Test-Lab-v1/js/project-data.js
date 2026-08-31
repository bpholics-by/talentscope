/* ==========================================================
   Project Storage
========================================================== */

let projects = JSON.parse(localStorage.getItem('projects')) || [];

/* ==========================================================
   Load Project
========================================================== */

function loadProjects(){

    const data = localStorage.getItem("projects");

    if(data){

        projects = JSON.parse(data);

    }

}

/* ==========================================================
   Save Project
========================================================== */

function saveProjects(){

    localStorage.setItem(

        "projects",

        JSON.stringify(projects)

    );

}