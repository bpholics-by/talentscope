/* ==========================================================
   CAREER TEST LAB
   COMBINED RESULT PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", function () {

    loadCombinedResult();

});


/* ==========================================================
   LOAD COMBINED RESULT
========================================================== */

function loadCombinedResult() {

    /* ------------------------------------------------------
       AMBIL DATA DARI URL
    ------------------------------------------------------ */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const projectId =
        params.get("projectId");

    const participantId =
        params.get("participantId");


    console.log("Project ID:", projectId);
    console.log("Participant ID:", participantId);


    /* ------------------------------------------------------
       VALIDASI
    ------------------------------------------------------ */

    if (!projectId || !participantId) {

        showCombinedMessage(
            "Data project atau peserta tidak ditemukan."
        );

        return;

    }


    /* ------------------------------------------------------
       AMBIL PROJECT DARI LOCAL STORAGE
    ------------------------------------------------------ */

    let projects = [];

    try {

        const raw =
            localStorage.getItem(
                "talentscope_projects"
            );

        projects =
            raw ? JSON.parse(raw) : [];

    } catch (error) {

        console.error(
            "Gagal membaca project:",
            error
        );

        showCombinedMessage(
            "Data project gagal dibaca."
        );

        return;

    }


    /* ------------------------------------------------------
       CARI PROJECT
    ------------------------------------------------------ */

    const project =
        projects.find(function (item) {

            return String(item.id) ===
                String(projectId);

        });


    if (!project) {

        showCombinedMessage(
            "Project tidak ditemukan."
        );

        return;

    }


    /* ------------------------------------------------------
       CARI PESERTA
    ------------------------------------------------------ */

    const participants =
        Array.isArray(project.participants)
            ? project.participants
            : [];


    const participant =
        participants.find(function (item) {

            return String(
                item.id ||
                item.participantId
            ) === String(participantId);

        });


    if (!participant) {

        showCombinedMessage(
            "Peserta tidak ditemukan."
        );

        return;

    }


    /* ------------------------------------------------------
       DATA PROJECT
    ------------------------------------------------------ */

    const projectName =
        project.projectName ||
        project.name ||
        project.project ||
        "-";


    const assessmentDate =
        project.startDate ||
        project.start ||
        "-";


    /* ------------------------------------------------------
       DATA PESERTA
    ------------------------------------------------------ */

    const participantName =
        participant.name ||
        participant.fullName ||
        "-";


    /* ------------------------------------------------------
       TAMPILKAN INFORMASI PESERTA
    ------------------------------------------------------ */

    const participantElement =
        document.getElementById(
            "participantName"
        );

    if (participantElement) {

        participantElement.textContent =
            participantName;

    }


    const projectElement =
        document.getElementById(
            "projectName"
        );

    if (projectElement) {

        projectElement.textContent =
            projectName;

    }


    const dateElement =
        document.getElementById(
            "assessmentDate"
        );

    if (dateElement) {

        dateElement.textContent =
            formatCombinedDate(
                assessmentDate
            );

    }


    /* ------------------------------------------------------
       AMBIL SEMUA ASSESSMENT
    ------------------------------------------------------ */

    const assessments =
        Array.isArray(project.assessments)
            ? project.assessments
            : (
                Array.isArray(project.assessment)
                    ? project.assessment
                    : []
            );


    /* ------------------------------------------------------
       RENDER COMBINED RESULT
    ------------------------------------------------------ */

    renderCombinedTests(
        assessments
    );

}


/* ==========================================================
   RENDER ALL TESTS
========================================================== */

function renderCombinedTests(
    assessments
) {

    const container =
        document.getElementById(
            "combinedResultContent"
        );

    if (!container) return;


    /* ------------------------------------------------------
       BELUM ADA TEST
    ------------------------------------------------------ */

    if (assessments.length === 0) {

        showCombinedMessage(
            "Belum ada assessment untuk project ini."
        );

        return;

    }


    /* ------------------------------------------------------
       RENDER TEST
    ------------------------------------------------------ */

    container.innerHTML = `

        <div class="combined-test-list">

            ${assessments.map(
                function (assessment, index) {

                    const testName =
                        typeof assessment === "string"
                            ? assessment
                            : (
                                assessment.name ||
                                assessment.title ||
                                assessment.assessmentName ||
                                assessment.code ||
                                `Assessment ${index + 1}`
                            );


                    return `

                        <div class="test-result-item">

                            <div class="test-result-info">

                                <div class="test-icon">

                                    <i class="fa-solid fa-file-lines"></i>

                                </div>

                                <div>

                                    <strong>
                                        ${testName}
                                    </strong>

                                    <span>
                                        Included in Combined Report
                                    </span>

                                </div>

                            </div>

                        </div>

                    `;

                }
            ).join("")}

        </div>


        <div class="empty-test">

            <i class="fa-solid fa-file-pdf"></i>

            <span>
                Laporan gabungan akan berisi
                seluruh hasil assessment peserta.
            </span>

        </div>

    `;

}


/* ==========================================================
   EMPTY / ERROR MESSAGE
========================================================== */

function showCombinedMessage(
    message
) {

    const container =
        document.getElementById(
            "combinedResultContent"
        );

    if (!container) return;


    container.innerHTML = `

        <div class="empty-test">

            <i class="fa-solid fa-circle-info"></i>

            <span>
                ${message}
            </span>

        </div>

    `;

}


/* ==========================================================
   FORMAT DATE
========================================================== */

function formatCombinedDate(date) {

    if (!date || date === "-") {

        return "-";

    }


    const d =
        new Date(
            date + "T00:00:00"
        );


    if (isNaN(d.getTime())) {

        return date;

    }


    return d.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}