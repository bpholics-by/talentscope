/* ==========================================================
   PROJECT DATA SERVICE
   SUPABASE VERSION
========================================================== */


/* ==========================================================
   PROJECT STATE
========================================================== */

let projects = [];


/* ==========================================================
   LOAD PROJECTS FROM SUPABASE
========================================================== */

async function loadProjects() {

    try {

        console.log(
            "[PROJECT DATA] Loading projects from Supabase..."
        );


        projects =
            await DataService.getProjects();


        if (!Array.isArray(projects)) {

            console.warn(
                "[PROJECT DATA] Invalid project data"
            );

            projects = [];

        }


        console.log(
            `[PROJECT DATA] Loaded ${projects.length} projects`
        );


        /* ==================================================
           ISI JUMLAH PESERTA PER PROJECT
           ==================================================
           Tabel `projects` tidak punya kolom participant
           count, jadi diambil terpisah dari
           `project_participants` lalu digabungkan di sini.

           Dibungkus try/catch sendiri supaya kalau query
           ini gagal, projects yang sudah berhasil dimuat
           TETAP tampil (cuma kolom Participants jadi 0),
           bukan bikin seluruh loadProjects() gagal.
        ================================================== */

        try {

            const participantCounts =
                await DataService.getProjectParticipantCounts();

            projects.forEach(function (project) {

                if (!project || !project.id) {
                    return;
                }

                project.participant_count =
                    participantCounts[project.id] || 0;

            });

            console.log(
                "[PROJECT DATA] Participant counts merged into projects"
            );

        } catch (countError) {

            console.error(
                "[PROJECT DATA] Failed to load participant counts:",
                countError
            );

        }


        return projects;


    } catch (error) {

        console.error(
            "[PROJECT DATA] Failed to load projects:",
            error
        );


        projects = [];


        return projects;

    }

}


/* ==========================================================
   SAVE PROJECTS
========================================================== */

async function saveProjects() {

    console.warn(
        "[PROJECT DATA] saveProjects() called."
    );


    console.warn(
        "[PROJECT DATA] Bulk save disabled. Use create/update project functions."
    );


    return projects;

}