/* ==========================================================
   TALENTSCOPE
   RESULT PAGE
   ----------------------------------------------------------
   DATA SOURCE:
   localStorage -> talentscope_projects

   STRUKTUR PROJECT:
   project
      ├── id
      ├── projectName / name
      ├── startDate / start
      ├── participants[]
      │     ├── id
      │     ├── name / fullName
      │     └── ...
      └── assessments[]

   CATATAN:
   - TIDAK ADA DATA DUMMY
   - TIDAK MEMBUAT SCORE 0
   - SCORE "-" jika hasil tes belum tersedia
========================================================== */


/* ==========================================================
   GLOBAL STATE
========================================================== */

let resultRows = [];

let currentPage = 1;

let rowsPerPage = 10;

let searchKeyword = "";


/* ==========================================================
   DOM READY
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initResultPage();

    }
);


/* ==========================================================
   INITIALIZE RESULT PAGE
========================================================== */

function initResultPage() {

    loadCurrentProjectResults();

    setupSearch();

    setupRowsPerPage();

}


/* ==========================================================
   GET PROJECT ID
========================================================== */

function getProjectId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("id");

}


/* ==========================================================
   GET PROJECTS
========================================================== */

function getProjectsFromStorage() {

    try {

        const raw =
            localStorage.getItem(
                "talentscope_projects"
            );


        if (!raw) {

            return [];

        }


        const data =
            JSON.parse(raw);


        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "Gagal membaca talentscope_projects:",
            error
        );

        return [];

    }

}


/* ==========================================================
   LOAD CURRENT PROJECT
========================================================== */

function loadCurrentProjectResults() {

    const table =
        document.getElementById(
            "resultTable"
        );


    if (!table) {

        return;

    }


    const projectId =
        getProjectId();


    /* ------------------------------------------------------
       PROJECT ID TIDAK ADA
    ------------------------------------------------------ */

    if (!projectId) {

        renderEmptyResult(
            "Project tidak dipilih",
            "Silakan buka halaman hasil dari project yang sesuai."
        );

        updateResultCount(0);

        clearResultMatrix();

        return;

    }


    /* ------------------------------------------------------
       LOAD PROJECT
    ------------------------------------------------------ */

    const projects =
        getProjectsFromStorage();


    /* ------------------------------------------------------
       CARI PROJECT
    ------------------------------------------------------ */

    const project =
        projects.find(
            function (item) {

                return String(item.id) ===
                    String(projectId);

            }
        );


    /* ------------------------------------------------------
       PROJECT TIDAK DITEMUKAN
    ------------------------------------------------------ */

    if (!project) {

        renderEmptyResult(
            "Project tidak ditemukan",
            "Project yang dipilih tidak tersedia pada data TalentScope."
        );

        updateResultCount(0);

        clearResultMatrix();

        return;

    }


    /* ------------------------------------------------------
       NORMALISASI PESERTA
    ------------------------------------------------------ */

    const participants =
        Array.isArray(
            project.participants
        )
            ? project.participants
            : [];


    /* ------------------------------------------------------
       PROJECT DATA
    ------------------------------------------------------ */

    const projectName =
        project.projectName ||
        project.name ||
        project.project ||
        "-";


    const assessmentDate =
        project.startDate ||
        project.start ||
        project.assessmentDate ||
        project.date ||
        "-";


    /* ------------------------------------------------------
       BUILD RESULT ROWS
    ------------------------------------------------------ */

    resultRows =
        participants.map(
            function (participant) {

                return {

                    projectId:
                        project.id,

                    projectName:
                        projectName,

                    assessmentDate:
                        assessmentDate,

                    participantId:
                        participant.id ||
                        participant.participantId ||
                        participant.employeeId ||
                        "",

                    participantName:
                        participant.name ||
                        participant.fullName ||
                        participant.participantName ||
                        "-",

                    participant:
                        participant

                };

            }
        );


    /* ------------------------------------------------------
       RESET
    ------------------------------------------------------ */

    currentPage = 1;


    /* ------------------------------------------------------
       RENDER
    ------------------------------------------------------ */

    renderResults();


    /*
       Matrix juga mengambil peserta
       dari project yang sama.
    */

    renderResultMatrix(
        resultRows
    );

}


/* ==========================================================
   RENDER RESULT TABLE
========================================================== */

function renderResults() {

    const table =
        document.getElementById(
            "resultTable"
        );


    if (!table) {

        return;

    }


    /* ------------------------------------------------------
       FILTER SEARCH
    ------------------------------------------------------ */

    const filtered =
        resultRows.filter(
            function (row) {

                if (!searchKeyword) {

                    return true;

                }


                return String(
                    row.participantName
                )
                    .toLowerCase()
                    .includes(
                        searchKeyword.toLowerCase()
                    );

            }
        );


    /* ------------------------------------------------------
       EMPTY
    ------------------------------------------------------ */

    if (
        filtered.length === 0
    ) {

        renderEmptyResult(

            searchKeyword
                ? "Peserta tidak ditemukan"
                : "Belum ada peserta",

            searchKeyword
                ? "Coba gunakan nama peserta yang berbeda."
                : "Belum ada peserta yang terdaftar pada project ini."

        );


        updateResultCount(0);

        return;

    }


    /* ------------------------------------------------------
       PAGINATION
    ------------------------------------------------------ */

    const total =
        filtered.length;


    const totalPages =
        Math.ceil(
            total /
            rowsPerPage
        );


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;

    }


    const start =
        (
            currentPage - 1
        ) *
        rowsPerPage;


    const end =
        start +
        rowsPerPage;


    const visibleRows =
        filtered.slice(
            start,
            end
        );


    /* ------------------------------------------------------
       RENDER
    ------------------------------------------------------ */

    table.innerHTML =
        visibleRows
            .map(
                function (row) {

                    return createResultRow(
                        row
                    );

                }
            )
            .join("");


    /* ------------------------------------------------------
       FOOTER
    ------------------------------------------------------ */

    updateResultCount(
        total,
        start,
        Math.min(
            end,
            total
        )
    );

}


/* ==========================================================
   CREATE RESULT ROW
========================================================== */

function createResultRow(row) {

    const projectName =
        escapeHTML(
            row.projectName
        );


    const participantName =
        escapeHTML(
            row.participantName
        );


    const participantId =
        escapeHTML(
            row.participantId
        );


    const projectId =
        escapeHTML(
            row.projectId
        );


    return `

        <tr
            data-name="${participantName}"
        >

            <td class="project-name">

                ${projectName}

            </td>


            <td class="assessment-date">

                ${formatResultDate(
                    row.assessmentDate
                )}

            </td>


            <td class="participant-name">

                ${participantName}

            </td>


            <td>

                <button
                    class="result-btn"
                    type="button"
                    onclick="
                        openParticipantResult(
                            '${projectId}',
                            '${participantId}'
                        )
                    "
                >

                    <i
                        class="fa-solid fa-file-lines"
                    ></i>

                    Hasil Tes

                </button>

            </td>

        </tr>

    `;

}


/* ==========================================================
   SEARCH
========================================================== */

function setupSearch() {

    const search =
        document.getElementById(
            "participantSearch"
        );


    if (!search) {

        return;

    }


    search.addEventListener(
        "input",
        function () {

            searchKeyword =
                this.value.trim();


            currentPage = 1;


            renderResults();

        }
    );

}


/* ==========================================================
   ROWS PER PAGE
========================================================== */

function setupRowsPerPage() {

    const select =
        document.getElementById(
            "rowsPerPage"
        );


    if (!select) {

        return;

    }


    select.addEventListener(
        "change",
        function () {

            rowsPerPage =
                parseInt(
                    this.value,
                    10
                );


            if (
                !rowsPerPage ||
                rowsPerPage < 1
            ) {

                rowsPerPage = 10;

            }


            currentPage = 1;


            renderResults();

        }
    );

}


/* ==========================================================
   UPDATE RESULT COUNT
========================================================== */

function updateResultCount(
    total,
    start,
    end
) {

    const count =
        document.getElementById(
            "resultCount"
        );


    if (!count) {

        return;

    }


    if (
        !total ||
        total <= 0
    ) {

        count.textContent =
            "Showing 0–0 of 0 results";

        return;

    }


    count.textContent =
        `Showing ${start + 1}–${end} of ${total} results`;

}


/* ==========================================================
   EMPTY RESULT
========================================================== */

function renderEmptyResult(
    title,
    description
) {

    const table =
        document.getElementById(
            "resultTable"
        );


    if (!table) {

        return;

    }


    table.innerHTML = `

        <tr>

            <td
                colspan="4"
                style="
                    padding:60px 25px;
                    text-align:center;
                "
            >

                <div class="empty-result">

                    <div
                        class="empty-result-icon"
                    >

                        <i
                            class="fa-solid fa-chart-column"
                        ></i>

                    </div>


                    <strong>

                        ${escapeHTML(
                            title
                        )}

                    </strong>


                    <span>

                        ${escapeHTML(
                            description
                        )}

                    </span>

                </div>

            </td>

        </tr>

    `;

}


/* ==========================================================
   RESULT MATRIX
========================================================== */

function renderResultMatrix(rows) {

    const matrixTable =
        document.getElementById(
            "resultMatrixTable"
        );


    /*
       Kalau HTML tidak mempunyai
       matrix table, tidak perlu melakukan apa-apa.
    */

    if (!matrixTable) {

        return;

    }


    /*
       Tidak ada peserta.
    */

    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {

        clearResultMatrix();

        return;

    }


    matrixTable.innerHTML =
        rows
            .map(
                function (row) {

                    return createMatrixRow(
                        row
                    );

                }
            )
            .join("");

}


/* ==========================================================
   CREATE MATRIX ROW
========================================================== */

function createMatrixRow(row) {

    const participant =
        row.participant || {};


    /*
       PENTING:
       Jangan mengubah data kosong menjadi 0.

       Jika participant belum mempunyai
       hasil assessment, tampil "-".
    */


    const overall =
        findScore(
            participant,
            [
                "overallScore",
                "overall",
                "totalScore",
                "score"
            ]
        );


    const cognitive =
        findScore(
            participant,
            [
                "cognitiveAbility",
                "cognitive",
                "cognitiveScore"
            ]
        );


    const numerical =
        findScore(
            participant,
            [
                "numericalReasoning",
                "numerical",
                "numericalScore"
            ]
        );


    const verbal =
        findScore(
            participant,
            [
                "verbalReasoning",
                "verbal",
                "verbalScore"
            ]
        );


    const personality =
        findScore(
            participant,
            [
                "personalityScore",
                "personality"
            ]
        );


    return `

        <tr>

            <td class="participant-name">

                ${escapeHTML(
                    row.participantName
                )}

            </td>


            <td>

                ${formatScore(
                    overall
                )}

            </td>


            <td>

                ${formatScore(
                    cognitive
                )}

            </td>


            <td>

                ${formatScore(
                    numerical
                )}

            </td>


            <td>

                ${formatScore(
                    verbal
                )}

            </td>


            <td>

                ${formatScore(
                    personality
                )}

            </td>

        </tr>

    `;

}


/* ==========================================================
   FIND SCORE
========================================================== */

function findScore(
    participant,
    fields
) {

    if (
        !participant ||
        typeof participant !== "object"
    ) {

        return null;

    }


    for (
        let i = 0;
        i < fields.length;
        i++
    ) {

        const value =
            participant[
                fields[i]
            ];


        /*
           Jangan menerima string kosong.
        */

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            continue;

        }


        /*
           Jika berupa object,
           jangan dipaksa menjadi score.
        */

        if (
            typeof value === "object"
        ) {

            continue;

        }


        const number =
            Number(
                value
            );


        if (
            Number.isFinite(
                number
            )
        ) {

            return number;

        }

    }


    return null;

}


/* ==========================================================
   FORMAT SCORE
========================================================== */

function formatScore(
    score
) {

    if (
        score === null ||
        score === undefined
    ) {

        return "-";

    }


    return (
        Number.isInteger(score)
            ? String(score)
            : String(
                Number(
                    score.toFixed(2)
                )
            )
    );

}


/* ==========================================================
   CLEAR MATRIX
========================================================== */

function clearResultMatrix() {

    const matrixTable =
        document.getElementById(
            "resultMatrixTable"
        );


    if (matrixTable) {

        matrixTable.innerHTML = "";

    }

}


/* ==========================================================
   OPEN PARTICIPANT RESULT
========================================================== */

function openParticipantResult(
    projectId,
    participantId
) {

    if (
        !projectId ||
        !participantId
    ) {

        alert(
            "Data project atau peserta tidak ditemukan."
        );

        return;

    }


    const url =
        `participant-result.html` +
        `?projectId=${encodeURIComponent(
            projectId
        )}` +
        `&participantId=${encodeURIComponent(
            participantId
        )}`;


    window.open(
        url,
        "_blank"
    );

}


/* ==========================================================
   FORMAT DATE
========================================================== */

function formatResultDate(
    date
) {

    if (
        !date ||
        date === "-"
    ) {

        return "-";

    }


    /*
       Jika sudah berupa format
       yang tidak cocok untuk Date,
       tampilkan apa adanya.
    */

    const parsed =
        new Date(
            String(date).includes("T")
                ? date
                : String(date) +
                  "T00:00:00"
        );


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return escapeHTML(
            date
        );

    }


    return parsed.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}