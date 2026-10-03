/* ==========================================================
   PROJECT DETAIL
   TalentScope Enterprise
   ========================================================== */


/* ==========================================================
   GLOBAL
   ========================================================== */

let currentProject = null;
let allProjects = [];
let pendingImportedParticipants = [];


/* ==========================================================
   DOM READY
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {

    console.log("project-detail.js loaded");

    loadCurrentProject();

    if (!currentProject) {

        console.warn("Current project not found.");

        return;

    }

    renderProjectInformation();
    renderAssessments();
    renderParticipants();

    loadProjects();
    renderProjects();

    initializeParticipantModal();
    initializeProjectFilters();
    initializeImportParticipant();

});


/* ==========================================================
   LOAD CURRENT PROJECT
   ========================================================== */

function loadCurrentProject() {

    const projectId =
        Number(
            localStorage.getItem("currentProjectId")
        );

    allProjects =
        JSON.parse(
            localStorage.getItem("assessmentProjects")
        ) || [];


    /*
       Jika currentProjectId tidak ada,
       gunakan project terakhir.
    */

    if (!projectId) {

        currentProject =
            allProjects[
                allProjects.length - 1
            ];

    } else {

        currentProject =
            allProjects.find(
                function (project) {

                    return (
                        Number(project.id) ===
                        projectId
                    );

                }
            );

    }


    if (!currentProject) {

        return;

    }


    /*
       Pastikan participants selalu array.
    */

    if (
        !Array.isArray(
            currentProject.participants
        )
    ) {

        currentProject.participants = [];

    }


    /*
       Pastikan assessments selalu array.
    */

    if (
        !Array.isArray(
            currentProject.assessments
        )
    ) {

        currentProject.assessments = [];

    }

}


/* ==========================================================
   SAVE CURRENT PROJECT
   ========================================================== */

function saveProjectToStorage() {

    if (!currentProject) {

        return;

    }


    const index =
        allProjects.findIndex(
            function (project) {

                return (
                    Number(project.id) ===
                    Number(currentProject.id)
                );

            }
        );


    if (index !== -1) {

        allProjects[index] =
            currentProject;

    } else {

        allProjects.push(
            currentProject
        );

    }


    localStorage.setItem(
        "assessmentProjects",
        JSON.stringify(
            allProjects
        )
    );


    localStorage.setItem(
        "currentProjectId",
        String(
            currentProject.id
        )
    );


    console.log(
        "Project saved:",
        currentProject
    );

}


/* ==========================================================
   RENDER PROJECT INFORMATION
   ========================================================== */

function renderProjectInformation() {

    if (!currentProject) return;


    const projectTitle =
        document.getElementById(
            "projectTitle"
        );

    const projectOrganization =
        document.getElementById(
            "projectOrganization"
        );

    const infoProjectName =
        document.getElementById(
            "infoProjectName"
        );

    const infoOrganization =
        document.getElementById(
            "infoOrganization"
        );

    const infoType =
        document.getElementById(
            "infoType"
        );

    const infoPIC =
        document.getElementById(
            "infoPIC"
        );

    const infoStart =
        document.getElementById(
            "infoStart"
        );

    const infoEnd =
        document.getElementById(
            "infoEnd"
        );

    const infoStartTime =
        document.getElementById(
            "infoStartTime"
        );

    const infoParticipants =
        document.getElementById(
            "infoParticipants"
        );

    const participantTargetDisplay =
        document.getElementById(
            "participantTargetDisplay"
        );


    const projectName =
        currentProject.projectName ||
        currentProject.name ||
        "Project Detail";


    const organization =
        currentProject.organization ||
        "-";


    if (projectTitle) {

        projectTitle.textContent =
            projectName;

    }


    if (projectOrganization) {

        projectOrganization.textContent =
            organization;

    }


    if (infoProjectName) {

        infoProjectName.textContent =
            projectName;

    }


    if (infoOrganization) {

        infoOrganization.textContent =
            organization;

    }


    if (infoType) {

        infoType.textContent =
            currentProject.projectType ||
            currentProject.type ||
            "-";

    }


    if (infoPIC) {

        infoPIC.textContent =
            currentProject.pic ||
            "-";

    }


    if (infoStart) {

        infoStart.textContent =
            formatDate(
                currentProject.startDate
            );

    }


    if (infoEnd) {

        infoEnd.textContent =
            formatDate(
                currentProject.endDate
            );

    }


    if (infoStartTime) {

        infoStartTime.textContent =
            currentProject.startTime ||
            "-";

    }


    if (infoParticipants) {

        infoParticipants.textContent =
            currentProject.participants.length;

    }


    if (participantTargetDisplay) {

        participantTargetDisplay.textContent =
            currentProject.participantTarget ||
            currentProject.participantsTarget ||
            "-";

    }

}


/* ==========================================================
   FORMAT DATE
   ========================================================== */

function formatDate(dateValue) {

    if (!dateValue) {

        return "-";

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* ==========================================================
   RENDER ASSESSMENTS
   ========================================================== */

function renderAssessments() {

    const container =
        document.getElementById(
            "assessmentList"
        );

    const count =
        document.getElementById(
            "assessmentCount"
        );


    if (!container) {

        return;

    }


    const assessments =
        Array.isArray(
            currentProject.assessments
        )
            ? currentProject.assessments
            : [];


    if (count) {

        count.textContent =
            `${assessments.length} Assessment${
                assessments.length === 1
                    ? ""
                    : "s"
            }`;

    }


    if (
        assessments.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-folder-open"></i>

                <h3>No Assessment</h3>

                <p>
                    No assessment has been added
                    to this project.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        assessments
            .map(
                function (assessment) {

                    return `

                        <div class="assessment-item">

                            <div class="assessment-info">

                                <h4>
                                    ${escapeHTML(
                                        assessment.name ||
                                        "Assessment"
                                    )}
                                </h4>

                                <p>
                                    ${escapeHTML(
                                        assessment.code ||
                                        "-"
                                    )}
                                </p>

                            </div>

                            <div class="assessment-meta">

                                <span class="badge">

                                    ${escapeHTML(
                                        assessment.category ||
                                        "Assessment"
                                    )}

                                </span>

                                ${
                                    assessment.duration
                                    ?
                                    `
                                    <small>
                                        ${escapeHTML(
                                            String(
                                                assessment.duration
                                            )
                                        )} Minutes
                                    </small>
                                    `
                                    :
                                    ""
                                }

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* ==========================================================
   RENDER PARTICIPANTS (DIPERBAIKI AGAR MASUK DATABASE)
   ========================================================== */

function renderParticipants() {

    const container =
        document.getElementById(
            "participantTable"
        );

    const count =
        document.getElementById(
            "participantCount"
        );

    if (!container) {
        return;
    }

    const participants =
        Array.isArray(
            currentProject.participants
        )
            ? currentProject.participants
            : [];

    // ==========================================
    // TAMBAHKAN KODE INI AGAR TERSIMPAN KE DATABASE
    // ==========================================
    try {
        // Ambil semua proyek yang ada di localStorage
        let allProjects = JSON.parse(localStorage.getItem("talentscope_projects") || "[]");
        
        // Gabungkan atau perbarui data peserta dari project aktif ini ke penyimpanan global database
        let globalParticipants = [];
        allProjects.forEach(proj => {
            if (proj && Array.isArray(proj.participants)) {
                proj.participants.forEach(p => {
                    // Tambahkan info project/perusahaan agar lengkap di database
                    globalParticipants.push({
                        ...p,
                        projectName: proj.projectName || proj.name || "Project",
                        projectId: proj.id || proj.projectId || "-",
                        company: proj.company || p.company || "-"
                    });
                });
            }
        });
        
        // Simpan ke kunci yang dibaca oleh halaman Database Peserta
        localStorage.setItem("talentscope_participants", JSON.stringify(globalParticipants));
    } catch (e) {
        console.error("Gagal sinkronisasi peserta ke database:", e);
    }
    // ==========================================

    if (count) {
        count.textContent =
            participants.length;
    }

    if (
        participants.length === 0
    ) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-users"></i>
                <h3>No Participant</h3>
                <p>
                    Click Assign Participant
                    to add a participant.
                </p>
            </div>
        `;
        return;
    }

    /* ==========================================================
   AUTO-SYNC PARTICIPANTS TO DATABASE FROM TABLE ROWS
========================================================== */
window.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        const rows = document.querySelectorAll("#participantTable tr, table tbody tr");
        if (!rows || rows.length === 0) return;

        let participantsList = [];

        rows.forEach(function(row) {
            const cells = row.querySelectorAll("td");
            if (cells.length >= 4) {
                // Ambil data teks dari kolom tabel
                const nameText = cells[0] ? cells[0].innerText.trim() : "";
                const positionText = cells[1] ? cells[1].innerText.trim() : "";
                const statusText = cells[2] ? cells[2].innerText.trim() : "";
                const companyText = cells[3] ? cells[3].innerText.trim() : "";

                // Abaikan jika baris kosong / tulisan "Belum ada peserta"
                if (nameText && !nameText.toLowerCase().includes("belum ada")) {
                    // Pisahkan nama dan email jika digabung dalam satu kolom
                    const lines = nameText.split("\n");
                    const name = lines[0] || "Peserta";
                    const email = lines[1] || (name.toLowerCase().replace(/\s+/g, '') + "@company.com");

                    participantsList.push({
                        name: name,
                        email: email,
                        position: positionText || "Staff",
                        status: statusText || "Not Started",
                        company: companyText || "Teatra",
                        projectName: "Project Teatra",
                        projectId: "P001",
                        date: "2026-06-01"
                    });
                }
            }
        });

        // Jika data berhasil dibaca dari tabel, simpan ke localStorage Database Peserta
        if (participantsList.length > 0) {
            localStorage.setItem("talentscope_participants", JSON.stringify(participantsList));
        }
    }, 500); // Beri jeda 0.5 detik agar tabel selesai dirender template
});


    container.innerHTML = `

        <div class="table-responsive">

            <table class="table">

                <thead>

                    <tr>

                        <th>Employee ID</th>

                        <th>Name</th>

                        <th>Email</th>

                        <th>Position</th>

                        <th>Division</th>

                        <th>Location</th>

                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    ${
                        participants
                            .map(
                                function (participant) {

                                    return `

                                        <tr>

                                            <td>
                                                ${escapeHTML(
                                                    participant.employeeId ||
                                                    "-"
                                                )}
                                            </td>

                                            <td>
                                                ${escapeHTML(
                                                    participant.fullName ||
                                                    "-"
                                                )}
                                            </td>

                                            <td>
                                                ${escapeHTML(
                                                    participant.email ||
                                                    "-"
                                                )}
                                            </td>

                                            <td>
                                                ${escapeHTML(
                                                    participant.position ||
                                                    "-"
                                                )}
                                            </td>

                                            <td>
                                                ${escapeHTML(
                                                    participant.division ||
                                                    "-"
                                                )}
                                            </td>

                                            <td>
                                                ${escapeHTML(
                                                    participant.location ||
                                                    "-"
                                                )}
                                            </td>

                                            <td>

                                                <span
                                                    class="status-badge ${getParticipantStatusClass(
                                                        participant.status
                                                    )}"
                                                >

                                                    ${escapeHTML(
                                                        participant.status ||
                                                        "Not Started"
                                                    )}

                                                </span>

                                            </td>

                                        </tr>

                                    `;

                                }
                            )
                            .join("")
                    }

                </tbody>

            </table>

        </div>

    `;

}


/* ==========================================================
   PARTICIPANT STATUS CLASS
   ========================================================== */

function getParticipantStatusClass(status) {

    if (!status) {

        return "status-draft";

    }


    const normalized =
        String(status)
            .toLowerCase();


    if (
        normalized.includes("complete")
    ) {

        return "status-completed";

    }


    if (
        normalized.includes("progress") ||
        normalized.includes("started")
    ) {

        return "status-active";

    }


    return "status-draft";

}


/* ==========================================================
   LOAD PROJECTS
   ========================================================== */

function loadProjects() {

    allProjects =
        JSON.parse(
            localStorage.getItem(
                "assessmentProjects"
            )
        ) || [];

}


/* ==========================================================
   RENDER PROJECTS
   ========================================================== */

function renderProjects() {

    const tbody =
        document.getElementById(
            "projectsTableBody"
        );


    if (!tbody) {

        return;

    }


    const searchInput =
        document.getElementById(
            "projectSearch"
        );

    const statusFilter =
        document.getElementById(
            "projectStatusFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "all";


    let projects =
        [...allProjects];


    if (search) {

        projects =
            projects.filter(
                function (project) {

                    const projectName =
                        (
                            project.projectName ||
                            project.name ||
                            ""
                        )
                        .toLowerCase();


                    const organization =
                        (
                            project.organization ||
                            ""
                        )
                        .toLowerCase();


                    return (
                        projectName.includes(search) ||
                        organization.includes(search)
                    );

                }
            );

    }


    if (
        selectedStatus !== "all"
    ) {

        projects =
            projects.filter(
                function (project) {

                    return (
                        project.status ||
                        "Draft"
                    ) === selectedStatus;

                }
            );

    }


    if (
        projects.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >

                    No projects found.

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        projects
            .map(
                function (project) {

                    const participants =
                        Array.isArray(
                            project.participants
                        )
                            ? project.participants.length
                            : 0;


                    const status =
                        project.status ||
                        "Draft";


                    return `

                        <tr>

                            <td>

                                <strong>

                                    ${escapeHTML(
                                        project.projectName ||
                                        project.name ||
                                        "-"
                                    )}

                                </strong>

                            </td>

                            <td>

                                ${escapeHTML(
                                    project.organization ||
                                    "-"
                                )}

                            </td>

                            <td>

                                ${escapeHTML(
                                    project.projectType ||
                                    project.type ||
                                    "-"
                                )}

                            </td>

                            <td>

                                ${formatDate(
                                    project.startDate
                                )}

                                -

                                ${formatDate(
                                    project.endDate
                                )}

                            </td>

                            <td>

                                ${participants}

                            </td>

                            <td>

                                <span
                                    class="status-badge ${getProjectStatusClass(
                                        status
                                    )}"
                                >

                                    ${escapeHTML(
                                        status
                                    )}

                                </span>

                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="project-action"
                                    data-project-id="${escapeHTML(
                                        project.id
                                    )}"
                                    title="View Project"
                                >

                                    <i
                                        class="fa-solid fa-arrow-right"
                                    ></i>

                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    tbody
        .querySelectorAll(
            "[data-project-id]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            button.dataset.projectId;


                        localStorage.setItem(
                            "currentProjectId",
                            id
                        );


                        window.location.href =
                            "project-detail.html";

                    }
                );

            }
        );

}


/* ==========================================================
   PROJECT STATUS CLASS
   ========================================================== */

function getProjectStatusClass(status) {

    if (!status) {

        return "status-draft";

    }


    const normalized =
        String(status)
            .toLowerCase();


    if (
        normalized === "active"
    ) {

        return "status-active";

    }


    if (
        normalized === "completed"
    ) {

        return "status-completed";

    }


    return "status-draft";

}


/* ==========================================================
   PROJECT FILTERS
   ========================================================== */

function initializeProjectFilters() {

    const search =
        document.getElementById(
            "projectSearch"
        );

    const filter =
        document.getElementById(
            "projectStatusFilter"
        );


    if (search) {

        search.addEventListener(
            "input",
            renderProjects
        );

    }


    if (filter) {

        filter.addEventListener(
            "change",
            renderProjects
        );

    }

}


/* ==========================================================
   PARTICIPANT MODAL
   ========================================================== */

function initializeParticipantModal() {

    const modal =
        document.getElementById(
            "participantModal"
        );

    const addButton =
        document.getElementById(
            "addParticipant"
        );

    const cancelButton =
        document.getElementById(
            "cancelParticipant"
        );

    const closeButton =
        document.getElementById(
            "closeParticipantModal"
        );

    const saveButton =
        document.getElementById(
            "saveParticipant"
        );


    if (!modal) {

        console.warn(
            "participantModal not found."
        );

        return;

    }


    /*
       OPEN
    */

    if (addButton) {

        addButton.addEventListener(
            "click",
            function () {

                console.log(
                    "Assign Participant clicked"
                );


                clearParticipantForm();


                modal.classList.add(
                    "show"
                );


                setTimeout(
                    function () {

                        const employeeId =
                            document.getElementById(
                                "employeeId"
                            );


                        if (employeeId) {

                            employeeId.focus();

                        }

                    },
                    100
                );

            }
        );

    }


    /*
       CLOSE - CANCEL
    */

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                modal.classList.remove(
                    "show"
                );

            }
        );

    }


    /*
       CLOSE - X
    */

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                modal.classList.remove(
                    "show"
                );

            }
        );

    }


    /*
       CLICK OUTSIDE
    */

    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                modal.classList.remove(
                    "show"
                );

            }

        }
    );


    /*
       SAVE
    */

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveParticipant
        );

    }

}


/* ==========================================================
   SAVE PARTICIPANT
   ========================================================== */

function saveParticipant() {

    console.log(
        "saveParticipant() called"
    );


    if (!currentProject) {

        alert(
            "Project not found."
        );

        return;

    }


    const employeeId =
        getInputValue(
            "employeeId"
        );

    const fullName =
        getInputValue(
            "fullName"
        );

    const email =
        getInputValue(
            "email"
        );

    const position =
        getInputValue(
            "position"
        );

    const division =
        getInputValue(
            "division"
        );

    const location =
        getInputValue(
            "location"
        );


    /*
       REQUIRED
    */

    if (!employeeId) {

        alert(
            "Employee ID is required."
        );

        document
            .getElementById(
                "employeeId"
            )
            ?.focus();

        return;

    }


    if (!fullName) {

        alert(
            "Full Name is required."
        );

        document
            .getElementById(
                "fullName"
            )
            ?.focus();

        return;

    }


    if (!email) {

        alert(
            "Email is required."
        );

        document
            .getElementById(
                "email"
            )
            ?.focus();

        return;

    }


    if (!position) {

        alert(
            "Position is required."
        );

        document
            .getElementById(
                "position"
            )
            ?.focus();

        return;

    }


    /*
       EMAIL
    */

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailPattern.test(email)
    ) {

        alert(
            "Please enter a valid email address."
        );

        return;

    }


    if (
        !Array.isArray(
            currentProject.participants
        )
    ) {

        currentProject.participants = [];

    }


    /*
       DUPLICATE EMPLOYEE ID
    */

    const normalizedEmployeeId =
        normalizeEmployeeId(
            employeeId
        );


    const duplicate =
        currentProject.participants.some(
            function (participant) {

                return (
                    normalizeEmployeeId(
                        participant.employeeId
                    ) ===
                    normalizedEmployeeId
                );

            }
        );


    if (duplicate) {

        alert(
            "Employee ID already exists in this project."
        );

        document
            .getElementById(
                "employeeId"
            )
            ?.focus();

        return;

    }


    /*
       CREATE
    */

    const participant = {

        id:
            Date.now(),

        employeeId:
            employeeId,

        fullName:
            fullName,

        email:
            email,

        position:
            position,

        division:
            division,

        location:
            location,

        status:
            "Not Started"

    };


    /*
       ADD
    */

    currentProject.participants.push(
        participant
    );


    /*
       SAVE
    */

    saveProjectToStorage();


    /*
       REFRESH
    */

    renderParticipants();
    renderProjectInformation();
    renderProjects();


    /*
       CLOSE
    */

    const modal =
        document.getElementById(
            "participantModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    clearParticipantForm();


    alert(
        `${fullName} has been successfully added as a participant.`
    );

}


/* ==========================================================
   CLEAR PARTICIPANT FORM
   ========================================================== */

function clearParticipantForm() {

    const fields = [

        "employeeId",
        "fullName",
        "email",
        "position",
        "division",
        "location",
        "phoneNumber"

    ];


    fields.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value = "";

            }

        }
    );

}


/* ==========================================================
   GET INPUT VALUE
   ========================================================== */

function getInputValue(id) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";

    }


    return element.value
        .trim();

}


/* ==========================================================
   NORMALIZE EMPLOYEE ID
   ========================================================== */

function normalizeEmployeeId(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /^\uFEFF/,
            ""
        )

        .replace(
            /^'/,
            ""
        )

        .trim()

        .replace(
            /\s+/g,
            ""
        )

        .toLowerCase();

}


/* ==========================================================
   ESCAPE HTML
   ========================================================== */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

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


/* ==========================================================
   INITIALIZE IMPORT PARTICIPANT
   ========================================================== */

function initializeImportParticipant() {

    console.log(
        "initializeImportParticipant()"
    );


    const importButton =
        document.getElementById(
            "importParticipant"
        );

    const modal =
        document.getElementById(
            "importParticipantModal"
        );

    const closeButton =
        document.getElementById(
            "closeImportParticipant"
        );

    const cancelButton =
        document.getElementById(
            "cancelImportParticipant"
        );

    const importConfirmButton =
        document.getElementById(
            "confirmImportParticipant"
        );

    const templateButton =
        document.getElementById(
            "downloadParticipantTemplate"
        );

    const fileInput =
        document.getElementById(
            "participantExcel"
        );


    if (!modal) {

        console.warn(
            "importParticipantModal not found."
        );

        return;

    }


    /*
       OPEN IMPORT MODAL
    */

    if (importButton) {

        importButton.addEventListener(
            "click",
            function () {

                console.log(
                    "Import Excel clicked"
                );


                pendingImportedParticipants = [];


                resetImportPreview();


                modal.classList.add(
                    "show"
                );

            }
        );

    }


    /*
       CLOSE X
    */

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeImportModal
        );

    }


    /*
       CANCEL
    */

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeImportModal
        );

    }


    /*
       CLICK OUTSIDE
    */

    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                closeImportModal();

            }

        }
    );


    /*
       DOWNLOAD TEMPLATE
    */

    if (templateButton) {

        templateButton.addEventListener(
            "click",
            downloadParticipantTemplate
        );

    }


    /*
       FILE CHANGE
    */

    if (fileInput) {

        fileInput.addEventListener(
            "change",
            function () {

                console.log(
                    "Excel file selected"
                );


                pendingImportedParticipants =
                    [];


                importParticipantsFromExcel();

            }
        );

    }


    /*
       CONFIRM IMPORT
    */

    if (importConfirmButton) {

        importConfirmButton.addEventListener(
            "click",
            processImportedParticipants
        );

    }

}


/* ==========================================================
   CLOSE IMPORT MODAL
   ========================================================== */

function closeImportModal() {

    const modal =
        document.getElementById(
            "importParticipantModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    pendingImportedParticipants = [];


    const fileInput =
        document.getElementById(
            "participantExcel"
        );


    if (fileInput) {

        fileInput.value = "";

    }


    resetImportPreview();

}


/* ==========================================================
   CHECK XLSX
   ========================================================== */

function isExcelLibraryAvailable() {

    return (
        typeof XLSX !== "undefined" &&
        XLSX.utils &&
        typeof XLSX.read === "function"
    );

}


/* ==========================================================
   DOWNLOAD EXCEL TEMPLATE
   ========================================================== */

function downloadParticipantTemplate() {

    console.log(
        "downloadParticipantTemplate()"
    );


    if (
        !isExcelLibraryAvailable()
    ) {

        alert(
            "Excel library is not available.\n\n" +
            "Please check the SheetJS script in project-detail.html."
        );

        return;

    }


    const templateData = [

        {

            "Employee ID":
                "EMP001",

            "Full Name":
                "Budi Santoso",

            "Email":
                "budi@company.com",

            "Position":
                "Manager",

            "Division":
                "Human Resources",

            "Location":
                "Jakarta"

        },

        {

            "Employee ID":
                "EMP002",

            "Full Name":
                "Siti Rahma",

            "Email":
                "siti@company.com",

            "Position":
                "Staff",

            "Division":
                "Finance",

            "Location":
                "Bandung"

        }

    ];


    const worksheet =
        XLSX.utils.json_to_sheet(
            templateData
        );


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Participants"
    );


    XLSX.writeFile(
        workbook,
        "participant-template.xlsx"
    );

}


/* ==========================================================
   IMPORT PARTICIPANTS FROM EXCEL
   ========================================================== */

function importParticipantsFromExcel() {

    console.log(
        "importParticipantsFromExcel()"
    );


    if (!currentProject) {

        alert(
            "Project not found."
        );

        return;

    }


    if (
        !isExcelLibraryAvailable()
    ) {

        alert(
            "Excel library is not available.\n\n" +
            "Please check the SheetJS CDN in project-detail.html."
        );

        return;

    }


    const fileInput =
        document.getElementById(
            "participantExcel"
        );


    if (
        !fileInput ||
        !fileInput.files ||
        fileInput.files.length === 0
    ) {

        alert(
            "Please select an Excel file first."
        );

        return;

    }


    const file =
        fileInput.files[0];


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            try {

                const data =
                    new Uint8Array(
                        event.target.result
                    );


                const workbook =
                    XLSX.read(
                        data,
                        {
                            type: "array"
                        }
                    );


                if (
                    !workbook.SheetNames ||
                    workbook.SheetNames.length === 0
                ) {

                    alert(
                        "The Excel file does not contain a worksheet."
                    );

                    return;

                }


                const firstSheet =
                    workbook.Sheets[
                        workbook.SheetNames[0]
                    ];


                const rows =
                    XLSX.utils.sheet_to_json(
                        firstSheet,
                        {
                            defval: ""
                        }
                    );


                if (
                    !rows.length
                ) {

                    alert(
                        "The Excel file is empty."
                    );

                    return;

                }


                console.log(
                    "Excel rows:",
                    rows
                );


                generateImportPreview(
                    rows
                );

            }

            catch (error) {

                console.error(
                    "Excel Import Error:",
                    error
                );


                alert(
                    "Unable to read the Excel file.\n\n" +
                    error.message
                );

            }

        };


    reader.readAsArrayBuffer(
        file
    );

}


/* ==========================================================
   NORMALIZE EXCEL HEADER
   ========================================================== */

function normalizeExcelHeader(value) {

    return String(value || "")

        .replace(
            /^\uFEFF/,
            ""
        )

        .trim()

        .toLowerCase()

        .replace(
            /\s+/g,
            " "
        );

}


/* ==========================================================
   GET EXCEL VALUE
   ========================================================== */

function getExcelValue(row, possibleNames) {

    const keys =
        Object.keys(row);


    for (
        const key of keys
    ) {

        const normalizedKey =
            normalizeExcelHeader(
                key
            );


        for (
            const name of possibleNames
        ) {

            if (
                normalizedKey ===
                normalizeExcelHeader(name)
            ) {

                return String(
                    row[key] ?? ""
                ).trim();

            }

        }

    }


    return "";

}


/* ==========================================================
   GENERATE IMPORT PREVIEW
   ========================================================== */

function generateImportPreview(rows) {

    console.log(
        "generateImportPreview()"
    );


    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {

        return;

    }


    /*
       Existing Employee IDs
    */

    const existingIds =
        new Set(

            (
                currentProject.participants ||
                []
            )
            .map(
                function (participant) {

                    return normalizeEmployeeId(
                        participant.employeeId
                    );

                }
            )
            .filter(
                function (id) {

                    return id !== "";

                }
            )

        );


    console.log(
        "Existing Employee IDs:",
        [...existingIds]
    );


    const excelIds =
        new Set();


    const previewRows = [];


    let validCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;


    rows.forEach(
        function (row, index) {

            /*
               Flexible header support
            */

            const employeeId =
                getExcelValue(
                    row,
                    [
                        "Employee ID",
                        "EmployeeID",
                        "ID",
                        "NIK",
                        "No Employee"
                    ]
                );


            const fullName =
                getExcelValue(
                    row,
                    [
                        "Full Name",
                        "FullName",
                        "Name",
                        "Nama"
                    ]
                );


            const email =
                getExcelValue(
                    row,
                    [
                        "Email",
                        "E-mail",
                        "Email Address"
                    ]
                );


            const position =
                getExcelValue(
                    row,
                    [
                        "Position",
                        "Job Position",
                        "Jabatan"
                    ]
                );


            const division =
                getExcelValue(
                    row,
                    [
                        "Division",
                        "Department",
                        "Departement",
                        "Divisi"
                    ]
                );


            const location =
                getExcelValue(
                    row,
                    [
                        "Location",
                        "Lokasi"
                    ]
                );


            let status =
                "Valid";


            let statusClass =
                "import-row-valid";


            const normalizedId =
                normalizeEmployeeId(
                    employeeId
                );


            /*
               REQUIRED
            */

            if (
                !normalizedId ||
                !fullName ||
                !email
            ) {

                status =
                    "Error";


                statusClass =
                    "import-row-error";


                errorCount++;

            }


            /*
               DUPLICATE EXISTING
            */

            else if (
                existingIds.has(
                    normalizedId
                )
            ) {

                status =
                    "Duplicate";


                statusClass =
                    "import-row-duplicate";


                duplicateCount++;

            }


            /*
               DUPLICATE INSIDE EXCEL
            */

            else if (
                excelIds.has(
                    normalizedId
                )
            ) {

                status =
                    "Duplicate";


                statusClass =
                    "import-row-duplicate";


                duplicateCount++;

            }


            /*
               VALID
            */

            else {

                status =
                    "Valid";


                statusClass =
                    "import-row-valid";


                validCount++;


                excelIds.add(
                    normalizedId
                );

            }


            previewRows.push({

                rowNumber:
                    index + 2,

                employeeId:
                    employeeId,

                fullName:
                    fullName,

                email:
                    email,

                position:
                    position,

                division:
                    division,

                location:
                    location,

                status:
                    status,

                statusClass:
                    statusClass

            });

        }
    );


    /*
       Store valid participants
    */

    pendingImportedParticipants =
        previewRows

            .filter(
                function (row) {

                    return (
                        row.status ===
                        "Valid"
                    );

                }
            )

            .map(
                function (row, index) {

                    return {

                        id:
                            Date.now() +
                            index,

                        employeeId:
                            row.employeeId,

                        fullName:
                            row.fullName,

                        email:
                            row.email,

                        position:
                            row.position,

                        division:
                            row.division,

                        location:
                            row.location,

                        status:
                            "Not Started"

                    };

                }
            );


    console.log(
        "Pending imported participants:",
        pendingImportedParticipants
    );


    /*
       Render preview
    */

    renderImportPreview(
        previewRows
    );


    /*
       Summary
    */

    const validElement =
        document.getElementById(
            "previewValidCount"
        );

    const duplicateElement =
        document.getElementById(
            "previewDuplicateCount"
        );

    const errorElement =
        document.getElementById(
            "previewErrorCount"
        );


    if (validElement) {

        validElement.textContent =
            validCount;

    }


    if (duplicateElement) {

        duplicateElement.textContent =
            duplicateCount;

    }


    if (errorElement) {

        errorElement.textContent =
            errorCount;

    }


    /*
       Show preview
    */

    const preview =
        document.getElementById(
            "importPreview"
        );


    if (preview) {

        preview.classList.add(
            "show"
        );

    }

}


/* ==========================================================
   RENDER IMPORT PREVIEW
   ========================================================== */

function renderImportPreview(rows) {

    const tbody =
        document.getElementById(
            "importPreviewBody"
        );


    if (!tbody) {

        console.warn(
            "importPreviewBody not found."
        );

        return;

    }


    tbody.innerHTML = "";


    rows.forEach(
        function (row) {

            let statusClass =
                "import-status-valid";


            if (
                row.status ===
                "Duplicate"
            ) {

                statusClass =
                    "import-status-duplicate";

            }


            if (
                row.status ===
                "Error"
            ) {

                statusClass =
                    "import-status-error";

            }


            const tr =
                document.createElement(
                    "tr"
                );


            tr.className =
                row.statusClass;


            tr.innerHTML = `

                <td>
                    ${escapeHTML(
                        row.rowNumber
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        row.employeeId ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        row.fullName ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        row.email ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        row.position ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        row.division ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        row.location ||
                        "-"
                    )}
                </td>

                <td>

                    <span
                        class="import-status ${statusClass}"
                    >

                        ${escapeHTML(
                            row.status
                        )}

                    </span>

                </td>

            `;


            tbody.appendChild(
                tr
            );

        }
    );

}


/* ==========================================================
   PROCESS IMPORTED PARTICIPANTS
   ========================================================== */

function processImportedParticipants() {

    console.log(
        "processImportedParticipants()"
    );


    if (!currentProject) {

        alert(
            "Project not found."
        );

        return;

    }


    if (
        !Array.isArray(
            pendingImportedParticipants
        )
    ) {

        pendingImportedParticipants =
            [];

    }


    /*
       SAFETY:
       cek ulang duplicate sebelum import.
    */

    const existingIds =
        new Set(

            (
                currentProject.participants ||
                []
            )
            .map(
                function (participant) {

                    return normalizeEmployeeId(
                        participant.employeeId
                    );

                }
            )

        );


    const newParticipants =
        pendingImportedParticipants.filter(
            function (participant) {

                const id =
                    normalizeEmployeeId(
                        participant.employeeId
                    );


                return (
                    id &&
                    !existingIds.has(id)
                );

            }
        );


    /*
       Jika tidak ada peserta valid
    */

    if (
        newParticipants.length === 0
    ) {

        alert(
            "Tidak ada peserta baru yang dapat di-import.\n\n" +
            "Jika muncul Duplicate, berarti Employee ID tersebut " +
            "sudah ada di project ini."
        );

        return;

    }


    /*
       CONFIRM
    */

    const confirmed =
        confirm(
            `Import ${newParticipants.length} participant(s) into this project?`
        );


    if (!confirmed) {

        return;

    }


    /*
       ADD
    */

    currentProject.participants.push(
        ...newParticipants
    );


    /*
       SAVE
    */

    saveProjectToStorage();


    /*
       REFRESH
    */

    renderParticipants();
    renderProjectInformation();
    renderProjects();


    const importedCount =
        newParticipants.length;


    /*
       RESET
    */

    pendingImportedParticipants =
        [];


    const fileInput =
        document.getElementById(
            "participantExcel"
        );


    if (fileInput) {

        fileInput.value = "";

    }


    resetImportPreview();


    /*
       CLOSE
    */

    closeImportModal();


    /*
       SUCCESS
    */

    alert(
        `${importedCount} participant(s) imported successfully.`
    );

}


/* ==========================================================
   RESET IMPORT PREVIEW
   ========================================================== */

function resetImportPreview() {

    const preview =
        document.getElementById(
            "importPreview"
        );


    if (preview) {

        preview.classList.remove(
            "show"
        );

    }


    const previewBody =
        document.getElementById(
            "importPreviewBody"
        );


    if (previewBody) {

        previewBody.innerHTML = "";

    }


    const validCount =
        document.getElementById(
            "previewValidCount"
        );

    const duplicateCount =
        document.getElementById(
            "previewDuplicateCount"
        );

    const errorCount =
        document.getElementById(
            "previewErrorCount"
        );


    if (validCount) {

        validCount.textContent =
            "0";

    }


    if (duplicateCount) {

        duplicateCount.textContent =
            "0";

    }


    if (errorCount) {

        errorCount.textContent =
            "0";

    }

}



/* ==========================================================
   PROJECT DETAIL HEADER
========================================================== */

function updateProjectDetailHeader() {

    const pageTitle =
        document.getElementById("pageTitle");

    const pageSubtitle =
        document.getElementById("pageSubtitle");


    /*
        Header mungkin dimuat sedikit terlambat.
        Kalau belum tersedia, coba lagi setelah 100 ms.
    */

    if (!pageTitle || !pageSubtitle) {

        setTimeout(
            updateProjectDetailHeader,
            100
        );

        return;
    }


    /* ======================================================
       SET PROJECT DETAIL HEADER
    ====================================================== */

    pageTitle.textContent =
        "Project Detail";


    pageSubtitle.textContent =
        "Manage assessment project and participants";

}


/* ==========================================================
   RUN PROJECT DETAIL HEADER
========================================================== */

updateProjectDetailHeader();

