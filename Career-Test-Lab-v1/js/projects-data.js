let projects = [];

try {

    projects =
        JSON.parse(
            localStorage.getItem(
                "talentscope_projects"
            )
        ) || [];

} catch (error) {

    console.error(
        "Failed to load talentscope_projects:",
        error
    );

    projects = [];

}

/* =========================================================
   UPDATE PROJECT STATISTICS FROM LOCAL STORAGE
========================================================= */

function updateProjectStats() {

    let projectData = [];

    try {

        projectData =
            JSON.parse(
                localStorage.getItem(
                    "talentscope_projects"
                )
            ) || [];

    } catch (error) {

        projectData = [];

    }


    if (!Array.isArray(projectData)) {

        projectData = [];

    }


    /* TOTAL PROJECTS */

    const total =
        projectData.length;


    /* RUNNING / ONGOING */

    const running =
        projectData.filter(function(project) {

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


    /* COMPLETED */

    const completed =
        projectData.filter(function(project) {

            return String(
                project.status || ""
            )
            .trim()
            .toLowerCase() === "completed";

        }).length;


    /* UNIQUE CLIENTS */

    const clients =
        new Set(
            projectData
                .map(function(project) {

                    return String(
                        project.company ||
                        project.organization ||
                        ""
                    ).trim();

                })
                .filter(function(company) {

                    return company !== "";

                })
        );


    /* UPDATE HTML */

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

        clientsEl.textContent = clients.size;

    }

}


/* =========================================================
   RUN STATISTICS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateProjectStats();

    }
);