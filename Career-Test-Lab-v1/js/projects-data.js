// =========================================================
// TALENTSCOPE PROJECT DATA
// SOURCE OF TRUTH: SUPABASE
// =========================================================


// GLOBAL PROJECT STATE

let projects = [];


// =========================================================
// LOAD PROJECTS FROM SUPABASE
// =========================================================

async function loadProjectsFromSupabase() {

    try {

        console.log(
            "[PROJECTS] Loading projects from Supabase..."
        );


        projects =
            await DataService.getProjects();


        if (!Array.isArray(projects)) {

            console.warn(
                "[PROJECTS] Invalid data received from Supabase"
            );

            projects = [];

        }


        // =========================================
        // AMBIL JUMLAH PARTICIPANT PER PROJECT
        // (dari tabel relasi project_participants)
        // DAN GABUNGKAN KE SETIAP OBJECT PROJECT
        // =========================================

        try {

            const participantCounts =
                await DataService.getProjectParticipantCounts();

            projects.forEach(function(project) {

                project.participant_count =
                    participantCounts[project.id] || 0;

            });

        } catch (countError) {

            console.error(
                "[PROJECTS] Failed to load participant counts:",
                countError
            );

        }


        window.projects = projects;


        // =========================================
        // NOTIFY PROJECT RENDER DATA SUDAH SIAP
        // =========================================

        window.dispatchEvent(
            new CustomEvent(
                "projectsLoaded",
                {
                    detail: {
                        projects: projects
                    }
                }
            )
        );


        console.log(
            `[PROJECTS] Successfully loaded: ${projects.length} projects`
        );


        return projects;


    } catch (error) {

        console.error(
            "[PROJECTS] Failed to load projects from Supabase:",
            error
        );


        projects = [];

        window.projects = projects;


        return projects;

    }

}


// =========================================================
// UPDATE PROJECT STATISTICS
// =========================================================

function updateProjectStats() {


    // PASTIKAN projects SELALU ARRAY

    if (!Array.isArray(projects)) {

        projects = [];

    }


    /* =====================================================
       TOTAL PROJECTS
    ===================================================== */

    const total =
        projects.length;


    /* =====================================================
       RUNNING / ONGOING
    ===================================================== */

    const running =
        projects.filter(function(project) {

            const status =
                String(
                    project.status || ""
                )
                .trim()
                .toLowerCase();


            return (

                status === "running" ||
                status === "ongoing" ||
                status === "scheduled"

            );

        }).length;


    /* =====================================================
       COMPLETED
    ===================================================== */

    const completed =
        projects.filter(function(project) {

            return String(
                project.status || ""
            )
            .trim()
            .toLowerCase() === "completed";

        }).length;


    /* =====================================================
       UNIQUE CLIENTS
    ===================================================== */

    const clients =
        new Set(

            projects
                .map(function(project) {

                    return String(

                        project.company ||
                        project.organization ||
                        project.client ||
                        ""

                    ).trim();

                })
                .filter(function(company) {

                    return company !== "";

                })

        );


    /* =====================================================
       UPDATE HTML
    ===================================================== */

    const totalEl =
        document.getElementById("totalProjects");

    const runningEl =
        document.getElementById("runningProjects");

    const completedEl =
        document.getElementById("completedProjects");

    const clientsEl =
        document.getElementById("totalClients");


    if (totalEl) {

        totalEl.textContent = total;

    }


    if (runningEl) {

        runningEl.textContent = running;

    }


    if (completedEl) {

        completedEl.textContent = completed;

    }


    if (clientsEl) {

        clientsEl.textContent =
            clients.size;

    }


    console.log(
        "[PROJECTS] Statistics updated:",
        {
            total: total,
            running: running,
            completed: completed,
            clients: clients.size
        }
    );

}


// =========================================================
// INITIALIZE PROJECT DATA
// =========================================================

async function initializeProjects() {

    console.log(
        "[PROJECTS] Initializing project module..."
    );


    // LOAD DATA DARI SUPABASE

    await loadProjectsFromSupabase();


    // UPDATE STATISTICS

    updateProjectStats();


    console.log(
        "[PROJECTS] Project module initialized successfully"
    );

}


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(

    "DOMContentLoaded",

    async function() {

        await initializeProjects();

    }

);


// =========================================================
// GLOBAL ACCESS
// =========================================================

window.projects = projects;

window.loadProjectsFromSupabase =
    loadProjectsFromSupabase;

window.updateProjectStats =
    updateProjectStats;

window.initializeProjects =
    initializeProjects;


console.log(
    "[PROJECTS] projects-data.js loaded"
);