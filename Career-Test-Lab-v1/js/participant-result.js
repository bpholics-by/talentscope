/* ==========================================================
   TALENTSCOPE
   PARTICIPANT RESULT PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", function () {

    loadParticipantResult();

});


/* ==========================================================
   LOAD PARTICIPANT RESULT
========================================================== */

function loadParticipantResult() {

    /* ------------------------------------------------------
       AMBIL ID DARI URL
    ------------------------------------------------------ */

    const params = new URLSearchParams(window.location.search);

const projectId = params.get("projectId");
const participantId = params.get("participantId");

console.log("=== PARTICIPANT RESULT DEBUG ===");
console.log("Project ID:", projectId);
console.log("Participant ID:", participantId);


       /* ------------------------------------------------------
       VALIDASI
    ------------------------------------------------------ */

    if (!projectId || !participantId) {

        alert(
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
            "Failed to load projects:",
            error
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

        alert(
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

        alert(
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
       TAMPILKAN INFORMASI
    ------------------------------------------------------ */

    const participantNameElement =
        document.getElementById(
            "participantName"
        );

    if (participantNameElement) {

        participantNameElement.textContent =
            participantName;

    }


    const projectNameElement =
        document.getElementById(
            "projectName"
        );

    if (projectNameElement) {

        projectNameElement.textContent =
            projectName;

    }


    const assessmentDateElement =
        document.getElementById(
            "assessmentDate"
        );

    if (assessmentDateElement) {

        assessmentDateElement.textContent =
            formatParticipantDate(
                assessmentDate
            );

    }


    /* ------------------------------------------------------
       TEST PESERTA
    ------------------------------------------------------ */

    renderParticipantTests(
        project,
        participant
    );

    setupCombinedResultButton(
    project.id,
    participant.id || participant.participantId
);

}

/* ==========================================================
   RENDER TEST
========================================================== */

function renderParticipantTests(
    project,
    participant
) {

    const testList =
        document.getElementById("testList");

    if (!testList) return;


    /* ------------------------------------------------------
       AMBIL ASSESSMENT PROJECT
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
       BELUM ADA TEST
    ------------------------------------------------------ */

    if (assessments.length === 0) {

        testList.innerHTML = `

            <div class="empty-test">

                <i class="fa-solid fa-circle-info"></i>

                <span>
                    Belum ada assessment
                    yang tersedia untuk project ini.
                </span>

            </div>

        `;

        return;

    }


    /* ------------------------------------------------------
       RENDER SETIAP TEST
    ------------------------------------------------------ */

    testList.innerHTML = "";


    assessments.forEach(function (
        assessment,
        index
    ) {

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


        testList.innerHTML += `

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
                            Assessment Result
                        </span>

                    </div>

                </div>


                <button
                    type="button"
                    class="test-view-btn"
                    onclick="
                        openSingleTestResult(
                            '${project.id}',
                            '${participant.id || participant.participantId}',
                            '${index}'
                        )
                    "
                >

                    <i class="fa-solid fa-eye"></i>

                    View Result

                </button>

            </div>

        `;

    });

}

    
/* ==========================================================
   VIEW SINGLE TEST RESULT
========================================================== */

function openSingleTestResult(
    projectId,
    participantId,
    assessmentIndex
) {

    const url =
        "test-result.html" +
        "?projectId=" +
        encodeURIComponent(projectId) +
        "&participantId=" +
        encodeURIComponent(participantId) +
        "&assessmentIndex=" +
        encodeURIComponent(assessmentIndex);

    window.open(
        url,
        "_blank"
    );

}

/* ==========================================================
   FORMAT DATE
========================================================== */

const formatParticipantDate = function (date) {

    if (!date || date === "-") {
        return "-";
    }

    const d = new Date(date + "T00:00:00");

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
};



    /* ==========================================================
   COMBINED RESULT
========================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const combinedButton =
        document.getElementById("combinedResultBtn");

    if (!combinedButton) return;


    combinedButton.addEventListener(
        "click",
        function () {

            const params =
                new URLSearchParams(
                    window.location.search
                );

            const projectId =
                params.get("projectId");

            const participantId =
                params.get("participantId");


            if (!projectId || !participantId) {

                alert(
                    "Data project atau peserta tidak ditemukan."
                );

                return;

            }


            const url =
                `combined-result.html?projectId=${encodeURIComponent(projectId)}&participantId=${encodeURIComponent(participantId)}`;


            window.open(
                url,
                "_blank"
            );

        }
    );

});