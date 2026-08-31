/* ==========================================================
   TALENTSCOPE - PARTICIPANT MANAGEMENT
   File: js/participants.js
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {

    initializeParticipants();

});


/* ==========================================================
   MAIN INITIALIZATION
   ========================================================== */

function initializeParticipants() {

    initializeActionButtons();

    initializeSearch();

    initializeFilter();

    initializeExport();

    // Sinkronkan data peserta yang sudah ada ke Central Participant Database.
    syncParticipantsDatabase(getProjects());

    refreshParticipantTable();

    refreshStatistics();

}


/* ==========================================================
   LOCAL STORAGE
   ========================================================== */

function getProjects() {

    try {

        const raw = localStorage.getItem("talentscope_projects");

        if (!raw) {
            return [];
        }

        const data = JSON.parse(raw);

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.error("Gagal membaca talentscope_projects:", error);

        return [];

    }

}


function saveProjects(projects) {

    try {

        localStorage.setItem(
            "talentscope_projects",
            JSON.stringify(projects)
        );

        // Tetap simpan project seperti sebelumnya, lalu sinkronkan
        // participant ke Central Participant Database.
        syncParticipantsDatabase(projects);

        return true;

    } catch (error) {

        console.error("Gagal menyimpan projects:", error);

        alert("Data peserta gagal disimpan.");

        return false;

    }

}


/* ==========================================================
   CENTRAL PARTICIPANT DATABASE SYNC
   ========================================================== */

function syncParticipantsDatabase(projects) {

    try {

        const participantMap = new Map();

        const safeProjects =
            Array.isArray(projects) ? projects : [];

        safeProjects.forEach(function (project) {

            const participants =
                Array.isArray(project && project.participants)
                    ? project.participants
                    : [];

            const projectPurpose =
                project && (
                    project.tujuanTes ||
                    project.purpose ||
                    project.type ||
                    ""
                );

            participants.forEach(function (participant) {

                if (!participant || typeof participant !== "object") {
                    return;
                }

                const participantId =
                    participant.id ||
                    participant.participantId ||
                    "";

                const participantEmail =
                    participant.email ||
                    participant.emailAddress ||
                    "";

                const key = participantId
                    ? "id:" + String(participantId)
                    : participantEmail
                        ? "email:" + normalize(participantEmail)
                        : "";

                if (!key) {
                    return;
                }

                participantMap.set(
                    key,
                    {
                        ...participant,

                        participantId:
                            participantId ||
                            participant.participantId ||
                            "",

                        nama:
                            participant.nama ||
                            participant.name ||
                            "",

                        email:
                            participant.email ||
                            participant.emailAddress ||
                            "",

                        perusahaan:
                            participant.perusahaan ||
                            participant.company ||
                            (project && project.company) ||
                            "-",

                        company:
                            participant.company ||
                            participant.perusahaan ||
                            (project && project.company) ||
                            "-",

                        pic:
                            participant.pic ||
                            participant.picProyek ||
                            (project && project.pic) ||
                            "-",

                        posisi:
                            participant.posisi ||
                            participant.position ||
                            "-",

                        projectId:
                            project && project.id
                                ? project.id
                                : "",

                        namaProject:
                            project && project.name
                                ? project.name
                                : "",

                        projectName:
                            project && project.name
                                ? project.name
                                : "",

                        tujuanTes:
                            participant.tujuanTes ||
                            participant.purpose ||
                            projectPurpose ||
                            "",

                        purpose:
                            participant.purpose ||
                            participant.tujuanTes ||
                            projectPurpose ||
                            "",

                        tanggal:
                            participant.tanggal ||
                            participant.assessmentDate ||
                            participant.assessment_date ||
                            (project && project.start) ||
                            "",

                        assessmentDate:
                            participant.assessmentDate ||
                            participant.assessment_date ||
                            (project && project.start) ||
                            ""
                    }
                );

            });

        });

        localStorage.setItem(
            "talentscope_participants",
            JSON.stringify(
                Array.from(participantMap.values())
            )
        );

    } catch (error) {

        console.error(
            "Gagal sinkronisasi talentscope_participants:",
            error
        );

    }

}


/* ==========================================================
   NORMALIZATION
   ========================================================== */

function normalize(value) {

    return String(value == null ? "" : value)
        .trim()
        .toLowerCase();

}


function normalizeCode(value) {

    return String(value == null ? "" : value)
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();

}


/* ==========================================================
   ACCESS CODE
   ========================================================== */

function generateAccessCode() {

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "TS-EMP";

    for (let i = 0; i < 6; i++) {

        code += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );

    }

    return code;

}


/* ==========================================================
   PARTICIPANT ID
   ========================================================== */

function generateParticipantId() {

    const projects = getProjects();

    let maxNumber = 0;

    projects.forEach(function (project) {

        const participants = Array.isArray(project.participants)
            ? project.participants
            : [];

        participants.forEach(function (participant) {

            const id = String(
                participant.id ||
                participant.participantId ||
                ""
            );

            const match = id.match(/^EMP(\d+)$/i);

            if (match) {

                const number = parseInt(match[1], 10);

                if (number > maxNumber) {
                    maxNumber = number;
                }

            }

        });

    });

    return "EMP" + String(maxNumber + 1).padStart(3, "0");

}


/* ==========================================================
   GET ACTIVE PROJECT
   ========================================================== */

function getCurrentProject() {

    const projects = getProjects();

    if (!projects.length) {
        return null;
    }

    /*
     * Jika ada project yang sedang dipilih oleh sistem,
     * gunakan project tersebut.
     */

    const selectedId =
        localStorage.getItem("talentscope_selected_project");

    if (selectedId) {

        const selected = projects.find(function (project) {

            return String(project.id) === String(selectedId);

        });

        if (selected) {
            return selected;
        }

    }

    /*
     * Fallback:
     * gunakan project pertama.
     */

    return projects[0];

}


/* ==========================================================
   ACTION BUTTONS
   ========================================================== */

function initializeActionButtons() {

    const btnAdd =
        document.getElementById("btnAddParticipant");

    const btnTemplate =
        document.getElementById("btnDownloadTemplate");

    const btnImport =
        document.getElementById("btnImportExcel");

    const closeModal =
        document.getElementById("closeImportModal");

    const cancelModal =
        document.getElementById("cancelImportBtn");

    const dropZone =
        document.getElementById("dropZone");

    const fileInput =
        document.getElementById("modalFileInput");

    const processImport =
        document.getElementById("processImportBtn");


    /* ------------------------------------------------------
       ADD PARTICIPANT
       ------------------------------------------------------ */

    if (btnAdd) {

        btnAdd.addEventListener("click", function () {

            showAddParticipantModal();

        });

    }


    /* ------------------------------------------------------
       DOWNLOAD TEMPLATE
       ------------------------------------------------------ */

    if (btnTemplate) {

        btnTemplate.addEventListener("click", function () {

            downloadTemplate();

        });

    }


    /* ------------------------------------------------------
       IMPORT MODAL
       ------------------------------------------------------ */

    if (btnImport) {

        btnImport.addEventListener("click", function () {

            openImportModal();

        });

    }


    if (closeModal) {

        closeModal.addEventListener("click", function () {

            closeImportModal();

        });

    }


    if (cancelModal) {

        cancelModal.addEventListener("click", function () {

            closeImportModal();

        });

    }


    /* ------------------------------------------------------
       DROP ZONE
       ------------------------------------------------------ */

    if (dropZone && fileInput) {

        dropZone.addEventListener("click", function () {

            fileInput.click();

        });


        dropZone.addEventListener("dragover", function (event) {

            event.preventDefault();

            dropZone.style.borderColor = "#0878e8";

        });


        dropZone.addEventListener("dragleave", function () {

            dropZone.style.borderColor = "#cbd5e1";

        });


        dropZone.addEventListener("drop", function (event) {

            event.preventDefault();

            dropZone.style.borderColor = "#cbd5e1";

            const files = event.dataTransfer.files;

            if (files && files.length) {

                fileInput.files = files;

                showSelectedFile(files[0]);

            }

        });


        fileInput.addEventListener("change", function () {

            if (fileInput.files.length) {

                showSelectedFile(fileInput.files[0]);

            }

        });

    }


    /* ------------------------------------------------------
       PROCESS IMPORT
       ------------------------------------------------------ */

    if (processImport) {

        processImport.addEventListener("click", function () {

            processImportedFile();

        });

    }

}


/* ==========================================================
   ADD PARTICIPANT MODAL
   ========================================================== */

function showAddParticipantModal() {

    let modal = document.getElementById(
        "addParticipantModal"
    );


    if (!modal) {

        modal = document.createElement("div");

        modal.id = "addParticipantModal";

        modal.innerHTML = `
            <div class="ts-modal-overlay">

                <div class="ts-modal">

                    <div class="ts-modal-header">

                        <h3>Add Participant</h3>

                        <button
                            type="button"
                            id="closeAddParticipant">
                            &times;
                        </button>

                    </div>

                    <form id="addParticipantForm">

                        <div class="ts-form-group">

                            <label>Full Name</label>

                            <input
                                id="newParticipantName"
                                type="text"
                                required
                                placeholder="Nama lengkap">

                        </div>


                        <div class="ts-form-group">

                            <label>Email</label>

                            <input
                                id="newParticipantEmail"
                                type="email"
                                required
                                placeholder="email@company.com">

                        </div>


                        <div class="ts-form-group">

                            <label>Position</label>

                            <input
                                id="newParticipantPosition"
                                type="text"
                                placeholder="Position">

                        </div>


                        <div class="ts-form-group">

                            <label>Access Code</label>

                            <div style="
                                display:flex;
                                gap:8px;
                            ">

                                <input
                                    id="newParticipantCode"
                                    type="text"
                                    readonly
                                    style="flex:1">

                                <button
                                    type="button"
                                    id="regenerateParticipantCode"
                                    class="btn btn-outline">
                                    Generate
                                </button>

                            </div>

                        </div>


                        <div style="
                            display:flex;
                            justify-content:flex-end;
                            gap:10px;
                            margin-top:20px;
                        ">

                            <button
                                type="button"
                                class="btn btn-secondary"
                                id="cancelAddParticipant">
                                Batal
                            </button>

                            <button
                                type="submit"
                                class="btn btn-primary">
                                Simpan Participant
                            </button>

                        </div>

                    </form>

                </div>

            </div>
        `;


        document.body.appendChild(modal);


        addParticipantModalStyle();


        document
            .getElementById("newParticipantCode")
            .value = generateAccessCode();


        document
            .getElementById("closeAddParticipant")
            .addEventListener("click", closeAddParticipantModal);


        document
            .getElementById("cancelAddParticipant")
            .addEventListener("click", closeAddParticipantModal);


        document
            .getElementById("regenerateParticipantCode")
            .addEventListener("click", function () {

                document
                    .getElementById("newParticipantCode")
                    .value = generateAccessCode();

            });


        document
            .getElementById("addParticipantForm")
            .addEventListener("submit", saveNewParticipant);

    }


    modal.style.display = "block";

}


/* ==========================================================
   SAVE NEW PARTICIPANT
   ========================================================== */

function saveNewParticipant(event) {

    event.preventDefault();


    const name =
        document
            .getElementById("newParticipantName")
            .value
            .trim();


    const email =
        document
            .getElementById("newParticipantEmail")
            .value
            .trim();


    const position =
        document
            .getElementById("newParticipantPosition")
            .value
            .trim();


    const accessCode =
        document
            .getElementById("newParticipantCode")
            .value
            .trim();


    if (!name || !email) {

        alert("Nama dan email wajib diisi.");

        return;

    }


    const projects = getProjects();

    let project = getCurrentProject();


    if (!project) {

        project = {

            id: "PROJECT-" + Date.now(),

            name: "Default Assessment",

            company: "-",

            type: "Recruitment",

            start: new Date()
                .toISOString()
                .slice(0, 10),

            end: "",

            status: "Draft",

            participants: [],

            assessments: []

        };

        projects.push(project);

    }


    if (!Array.isArray(project.participants)) {

        project.participants = [];

    }


    const duplicate = project.participants.some(
        function (participant) {

            return normalize(
                participant.email
            ) === normalize(email);

        }
    );


    if (duplicate) {

        alert("Email participant sudah terdaftar.");

        return;

    }


    const participant = {

        id: generateParticipantId(),

        name: name,

        email: email,

        position: position || "-",

        accessCode: accessCode,

        status: "Not Started",

        invitationStatus: "Active",

        accessStatus: "Active",

        // Di TalentScope, Tujuan Tes mengikuti Project Type.
        tujuanTes:
            project.tujuanTes ||
            project.purpose ||
            project.type ||
            "",

        purpose:
            project.tujuanTes ||
            project.purpose ||
            project.type ||
            "",

        createdAt: new Date().toISOString()

    };


    project.participants.push(participant);


    if (saveProjects(projects)) {

        alert(
            "Participant berhasil ditambahkan.\n\n" +
            "Nama: " + name + "\n" +
            "Access Code: " + accessCode
        );


        closeAddParticipantModal();

        refreshParticipantTable();

        refreshStatistics();

    }

}


/* ==========================================================
   CLOSE ADD MODAL
   ========================================================== */

function closeAddParticipantModal() {

    const modal =
        document.getElementById(
            "addParticipantModal"
        );

    if (modal) {

        modal.style.display = "none";

    }

}


/* ==========================================================
   ADD MODAL STYLE
   ========================================================== */

function addParticipantModalStyle() {

    if (
        document.getElementById(
            "talentscopeParticipantModalStyle"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "talentscopeParticipantModalStyle";


    style.textContent = `

        .ts-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, .48);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            padding: 20px;
        }

        .ts-modal {
            width: min(480px, 100%);
            background: #fff;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 30px 80px rgba(0,0,0,.25);
        }

        .ts-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .ts-modal-header h3 {
            margin: 0;
            font-size: 19px;
            color: #14263d;
        }

        .ts-modal-header button {
            border: 0;
            background: transparent;
            font-size: 26px;
            cursor: pointer;
            color: #64748b;
        }

        .ts-form-group {
            margin-bottom: 15px;
        }

        .ts-form-group label {
            display: block;
            margin-bottom: 6px;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
        }

        .ts-form-group input {
            width: 100%;
            height: 42px;
            border: 1px solid #d7e0ea;
            border-radius: 9px;
            padding: 0 12px;
            outline: none;
        }

        .ts-form-group input:focus {
            border-color: #0878e8;
            box-shadow: 0 0 0 3px rgba(8,120,232,.08);
        }

    `;


    document.head.appendChild(style);

}


/* ==========================================================
   IMPORT MODAL
   ========================================================== */

function openImportModal() {

    const modal =
        document.getElementById("importModal");

    if (modal) {

        modal.style.display = "block";

    }

}


function closeImportModal() {

    const modal =
        document.getElementById("importModal");

    if (modal) {

        modal.style.display = "none";

    }

}


/* ==========================================================
   DOWNLOAD TEMPLATE
   ========================================================== */

function downloadTemplate() {

    const content =
        "Full Name,Email,Phone Number,Department,Position\n" +
        "Budi Santoso,budi@company.com,081234567890,HR,Manager\n" +
        "Siti Rahma,siti@company.com,081234567891,HR,Staff\n";


    const blob =
        new Blob(
            [content],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "TalentScope_Participants_Template.csv";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);

}


/* ==========================================================
   SHOW SELECTED FILE
   ========================================================== */

function showSelectedFile(file) {

    const dropZone =
        document.getElementById("dropZone");


    if (!dropZone) {
        return;
    }


    dropZone.dataset.fileName =
        file.name;


    dropZone.innerHTML = `

        <i class="fa-solid fa-file-circle-check"
           style="
              font-size:2.5rem;
              color:#16a34a;
              margin-bottom:10px;
           ">
        </i>

        <p style="margin:0;color:#334155;">
            ${escapeHtml(file.name)}
        </p>

        <small style="color:#64748b;">
            File siap diproses
        </small>

    `;

}


/* ==========================================================
   IMPORT FILE
   ========================================================== */

function processImportedFile() {

    const input =
        document.getElementById(
            "modalFileInput"
        );


    if (!input || !input.files.length) {

        alert("Silakan pilih file terlebih dahulu.");

        return;

    }


    const file = input.files[0];


    const reader =
        new FileReader();


    reader.onload = function (event) {

        const text =
            event.target.result;


        importCSV(text);


    };


    reader.onerror = function () {

        alert("File tidak dapat dibaca.");

    };


    reader.readAsText(file);

}


/* ==========================================================
   IMPORT CSV
   ========================================================== */

function importCSV(text) {

    const lines =
        text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);


    if (lines.length < 2) {

        alert(
            "File tidak memiliki data participant."
        );

        return;

    }


    const headers =
        parseCSVLine(lines[0])
            .map(normalize);


    const nameIndex =
        findColumn(headers, [
            "full name",
            "name",
            "nama",
            "nama lengkap"
        ]);


    const emailIndex =
        findColumn(headers, [
            "email",
            "email address"
        ]);


    const positionIndex =
        findColumn(headers, [
            "position",
            "jabatan"
        ]);


    if (nameIndex === -1 || emailIndex === -1) {

        alert(
            "Kolom wajib tidak ditemukan.\n\n" +
            "Minimal harus ada: Full Name dan Email."
        );

        return;

    }


    const projects = getProjects();

    let project = getCurrentProject();


    if (!project) {

        alert(
            "Belum ada project assessment."
        );

        return;

    }


    if (!Array.isArray(project.participants)) {

        project.participants = [];

    }


    let added = 0;

    let skipped = 0;


    for (let i = 1; i < lines.length; i++) {

        const values =
            parseCSVLine(lines[i]);


        const name =
            String(values[nameIndex] || "").trim();


        const email =
            String(values[emailIndex] || "").trim();


        const position =
            positionIndex >= 0
                ? String(values[positionIndex] || "").trim()
                : "";


        if (!name || !email) {

            skipped++;

            continue;

        }


        const exists =
            project.participants.some(
                participant =>
                    normalize(
                        participant.email
                    ) === normalize(email)
            );


        if (exists) {

            skipped++;

            continue;

        }


        project.participants.push({

            id: generateParticipantId(),

            name: name,

            email: email,

            position: position || "-",

            accessCode: generateAccessCode(),

            status: "Not Started",

            invitationStatus: "Active",

            accessStatus: "Active",

            createdAt:
                new Date().toISOString()

        });


        added++;

    }


    if (saveProjects(projects)) {

        closeImportModal();

        refreshParticipantTable();

        refreshStatistics();


        alert(
            "Import selesai.\n\n" +
            "Berhasil: " + added + "\n" +
            "Dilewati: " + skipped
        );

    }

}


/* ==========================================================
   CSV PARSER
   ========================================================== */

function parseCSVLine(line) {

    const result = [];

    let current = "";

    let insideQuotes = false;


    for (let i = 0; i < line.length; i++) {

        const char = line[i];


        if (char === '"') {

            if (
                insideQuotes &&
                line[i + 1] === '"'
            ) {

                current += '"';

                i++;

            } else {

                insideQuotes = !insideQuotes;

            }

        } else if (
            char === "," &&
            !insideQuotes
        ) {

            result.push(current);

            current = "";

        } else {

            current += char;

        }

    }


    result.push(current);


    return result.map(function (value) {

        return value
            .trim()
            .replace(/^"|"$/g, "");

    });

}


/* ==========================================================
   FIND COLUMN
   ========================================================== */

function findColumn(headers, names) {

    for (let i = 0; i < headers.length; i++) {

        if (names.includes(headers[i])) {

            return i;

        }

    }

    return -1;

}


/* ==========================================================
   SEARCH
   ========================================================== */

function initializeSearch() {

    const input =
        document.getElementById(
            "searchParticipant"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        filterTable
    );

}


/* ==========================================================
   FILTER
   ========================================================== */

function initializeFilter() {

    const filter =
        document.getElementById(
            "filterTest"
        );


    if (!filter) {
        return;
    }


    filter.addEventListener(
        "change",
        filterTable
    );

}


/* ==========================================================
   FILTER TABLE
   ========================================================== */

function filterTable() {

    const searchInput =
        document.getElementById(
            "searchParticipant"
        );


    const filterTest =
        document.getElementById(
            "filterTest"
        );


    const keyword =
        searchInput
            ? normalize(searchInput.value)
            : "";


    const selectedTest =
        filterTest
            ? normalize(filterTest.value)
            : "all";


    const rows =
        document.querySelectorAll(
            ".participant-table tbody tr"
        );


    rows.forEach(function (row) {

        const rowText =
            normalize(row.innerText);


        const assessmentCell =
            row.cells && row.cells[2]
                ? normalize(
                    row.cells[2].innerText
                )
                : "";


        const matchKeyword =
            !keyword ||
            rowText.includes(keyword);


        const matchTest =
            selectedTest === "all" ||
            !selectedTest ||
            assessmentCell.includes(
                selectedTest
            );


        row.style.display =
            matchKeyword && matchTest
                ? ""
                : "none";

    });

}


/* ==========================================================
   REFRESH TABLE
   ========================================================== */

function refreshParticipantTable() {

    const tbody =
        document.querySelector(
            ".participant-table tbody"
        );


    if (!tbody) {
        return;
    }


    const projects =
        getProjects();


    const participants = [];


    projects.forEach(function (project) {

        const list =
            Array.isArray(project.participants)
                ? project.participants
                : [];


        list.forEach(function (participant) {

            participants.push({

                participant: participant,

                project: project

            });

        });

    });


    /*
     * Jika tidak ada data, jangan
     * menghapus struktur HTML yang
     * sudah ada.
     */

    if (!participants.length) {

        return;

    }


    tbody.innerHTML = "";


    participants.forEach(function (item) {

        const p = item.participant;

        const project = item.project;


        const name =
            p.name ||
            p.fullName ||
            p.full_name ||
            "-";


        const email =
            p.email ||
            p.emailAddress ||
            "-";


        const position =
            p.position ||
            "-";


        const status =
            p.status ||
            "Not Started";


        const company =
    project.company ||
    "-";


        const avatar =
            name.charAt(0).toUpperCase();


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>

                <div class="participant-info">

                    <div class="participant-avatar">
                        ${escapeHtml(avatar)}
                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        <span>
                            ${escapeHtml(email)}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHtml(position)}
            </td>


            <td>

                <span class="status ${getStatusClass(status)}">

                    ${escapeHtml(status)}

                </span>

            </td>


            <td>

                <strong>
                    ${escapeHtml(company)}
                </strong>

            </td>


            <td>

                <div class="table-actions">

                    <button
                        type="button"
                        title="View"
                        onclick="viewParticipant('${escapeJs(p.id || "")}')">

                        <i class="fa-solid fa-eye"></i>

                    </button>


                                        <button
                        type="button"
                        class="danger"
                        title="Delete"
                        onclick="deleteParticipant('${escapeJs(p.id || "")}')">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            </td>

        `;


        tbody.appendChild(row);

    });


    filterTable();

}


/* ==========================================================
   STATUS CLASS
   ========================================================== */

function getStatusClass(status) {

    const value =
        normalize(status);


    if (
        value.includes("complete") ||
        value.includes("completed") ||
        value.includes("finish")
    ) {

        return "complete";

    }


    if (
        value.includes("running") ||
        value.includes("progress") ||
        value.includes("active")
    ) {

        return "running";

    }


    return "";

}


/* ==========================================================
   STATISTICS
   ========================================================== */

function refreshStatistics() {

    const projects =
        getProjects();


    let total = 0;

    let active = 0;

    let completed = 0;

    let scoreTotal = 0;

    let scoreCount = 0;


    projects.forEach(function (project) {

        const participants =
            Array.isArray(project.participants)
                ? project.participants
                : [];


        participants.forEach(function (p) {

            total++;


            const status =
                normalize(p.status);


            if (
                status.includes("running") ||
                status.includes("progress") ||
                status.includes("active")
            ) {

                active++;

            }


            if (
                status.includes("complete") ||
                status.includes("completed") ||
                status.includes("finish")
            ) {

                completed++;

            }


            if (
                p.score !== undefined &&
                p.score !== null &&
                p.score !== ""
            ) {

                const score =
                    Number(p.score);


                if (!isNaN(score)) {

                    scoreTotal += score;

                    scoreCount++;

                }

            }

        });

    });


    const average =
        scoreCount
            ? Math.round(
                scoreTotal / scoreCount
            )
            : 0;


    /*
     * Cari angka statistik berdasarkan
     * struktur HTML yang sudah ada.
     */

    const statCards =
        document.querySelectorAll(
            ".participant-stats .stat-card"
        );


    if (statCards.length >= 4) {

        const numbers = [
            total,
            active,
            completed,
            average + "%"
        ];


        statCards.forEach(
            function (card, index) {

                const number =
                    card.querySelector(
                        ".stat-content h3"
                    );


                if (number) {

                    number.textContent =
                        numbers[index];

                }

            }
        );

    }

}



/* ==========================================================
   /* =========================================================
   VIEW PARTICIPANT - PREMIUM DETAIL
========================================================= */

function viewParticipant(id) {

    const result = findParticipantById(id);

    if (!result) {
        alert("Participant tidak ditemukan.");
        return;
    }

    const p = result.participant || {};
    const project = result.project || {};

    const modal = document.getElementById(
        "participantDetailModal"
    );

    if (!modal) {
        return;
    }


    /* =====================================================
       HELPER
    ===================================================== */

    function getValue() {

        const values = Array.from(arguments);

        for (let i = 0; i < values.length; i++) {

            const value = values[i];

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                return value;
            }

        }

        return "-";
    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatDate(value) {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return "-";
        }

        const raw = String(value).trim();

        /*
         * Kalau sudah format YYYY-MM-DD,
         * ubah menjadi format Indonesia.
         */

        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {

            const parts = raw.split("-");

            return (
                parts[2] +
                " " +
                [
                    "Januari",
                    "Februari",
                    "Maret",
                    "April",
                    "Mei",
                    "Juni",
                    "Juli",
                    "Agustus",
                    "September",
                    "Oktober",
                    "November",
                    "Desember"
                ][Number(parts[1]) - 1] +
                " " +
                parts[0]
            );

        }


        /*
         * Kalau berupa ISO datetime,
         * ambil bagian tanggalnya.
         */

        if (raw.includes("T")) {

            const date = new Date(raw);

            if (!isNaN(date.getTime())) {

                return date.toLocaleDateString(
                    "id-ID",
                    {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    }
                );

            }

        }


        return raw;

    }


    /* =====================================================
       FORMAT TIME
    ===================================================== */

    function formatDateTime(value){

    if(!value){
        return "-";
    }

    var d = new Date(value);

    if(isNaN(d.getTime())){
        return String(value);
    }

    var days = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu"
    ];

    var months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];

    var day =
        days[d.getDay()];

    var date =
        String(d.getDate()).padStart(2,"0");

    var month =
        months[d.getMonth()];

    var year =
        d.getFullYear();

    var hour =
        String(d.getHours()).padStart(2,"0");

    var minute =
        String(d.getMinutes()).padStart(2,"0");

    var second =
        String(d.getSeconds()).padStart(2,"0");

    return (
        day+
        ", "+
        date+
        " "+
        month+
        " "+
        year+
        " pukul "+
        hour+
        ":"+
        minute+
        ":"+
        second
    );
}


    /* =====================================================
       PARTICIPANT BASIC INFORMATION
    ===================================================== */

    const participantName = getValue(
        p.name,
        p.fullName,
        p.full_name
    );

    const participantEmail = getValue(
        p.email,
        p.emailAddress
    );

    const participantId = getValue(
        p.id,
        p.participantId
    );

    const participantPosition = getValue(
        p.position,
        p.jobTitle
    );

    const participantPhone = getValue(
        p.phone,
        p.phoneNumber,
        p.telephone,
        p.mobile
    );


    /* =====================================================
       ASSESSMENT DATE
    ===================================================== */

    const assessmentDate = getValue(
        p.assessmentDate,
        p.assessment_date,

        project.assessmentDate,
        project.assessment_date,

        project.date,

        project.start
    );


    
   /* =====================================================
   LOGIN TIME
===================================================== */

const loginTime = getValue(
    p.loginTime,
    p.loggedInAt,
    p.loginAt,
    p.login_at,
    p.accessedAt
);


   /* =====================================================
   LOGOUT TIME
===================================================== */

const logoutTime = getValue(
    p.logoutTime,
    p.loggedOutAt,
    p.logoutAt,
    p.logout_at,
    p.completedAt
);


    /* =====================================================
       INVITATION STATUS
    ===================================================== */

    let invitationStatus = getValue(
        p.invitationStatus,
        p.invitation_status,
        p.accessStatus,
        p.access_status,
        p.access
    );


    /*
     * Kalau status kosong tetapi sudah ada invitedAt,
     * berarti invitation sudah pernah diproses.
     */

    if (
        invitationStatus === "-" &&
        (
            p.invitedAt ||
            p.lastInvitationAt ||
            p.invitationSentAt
        )
    ) {

        invitationStatus = "Invited";

    }


    /* =====================================================
   ASSESSMENT STATUS
===================================================== */

const assessmentStatus = getValue(
    p.assessmentStatus,
    p.assessment_status,
    p.status
);


    /* =====================================================
   AMBIL DATA PARTICIPANT TERBARU
   DARI LOCAL STORAGE
===================================================== */

let latestParticipant = p;


/*
 * Data participant terbaru disimpan di
 * talentscope_projects.
 *
 * Kita cari berdasarkan:
 * 1. Participant ID
 * 2. Email
 */

try {

    const storedProjects =
        JSON.parse(
            localStorage.getItem(
                "talentscope_projects"
            ) || "[]"
        );


    if (Array.isArray(storedProjects)) {

        for (
            let i = 0;
            i < storedProjects.length;
            i++
        ) {

            const project =
                storedProjects[i];


            const participantList =
                Array.isArray(
                    project.participants
                )
                    ? project.participants
                    : [];


            for (
                let j = 0;
                j < participantList.length;
                j++
            ) {

                const candidate =
                    participantList[j];


                const candidateId =
                    candidate.id ||
                    candidate.participantId ||
                    "";


                const candidateEmail =
                    candidate.email ||
                    candidate.emailAddress ||
                    "";


                /*
                 * MATCH PARTICIPANT ID
                 */

                if (
                    participantId &&
                    candidateId &&
                    String(candidateId) ===
                    String(participantId)
                ) {

                    latestParticipant =
                        candidate;

                    break;

                }


                /*
                 * FALLBACK MATCH EMAIL
                 */

                if (
                    participantEmail &&
                    candidateEmail &&
                    String(candidateEmail)
                        .toLowerCase() ===
                    String(participantEmail)
                        .toLowerCase()
                ) {

                    latestParticipant =
                        candidate;

                    break;

                }

            }

        }

    }

} catch (error) {

    console.warn(
        "Gagal membaca data participant terbaru:",
        error
    );

}


/* =====================================================
   DATA LOGIN / LOGOUT TERBARU
===================================================== */

const latestLoginTime =
    latestParticipant.loginTime ||
    latestParticipant.loggedInAt ||
    latestParticipant.loginAt ||
    latestParticipant.login_at ||
    "";


const latestLogoutTime =
    latestParticipant.logoutTime ||
    latestParticipant.loggedOutAt ||
    latestParticipant.logoutAt ||
    latestParticipant.logout_at ||
    "";

    const participantHasLoggedIn =
    !!(
        latestParticipant.loginTime ||
        latestParticipant.loggedInAt ||
        latestParticipant.loginAt ||
        latestParticipant.login_at
    );

const participantHasLoggedOut =
    !!(
        latestParticipant.logoutTime ||
        latestParticipant.loggedOutAt ||
        latestParticipant.logoutAt ||
        latestParticipant.logout_at
    );

/* =====================================================
   INVITATION STATUS
===================================================== */

let finalInvitationStatus =
    latestParticipant.invitationStatus ||
    latestParticipant.invitation_status ||
    latestParticipant.accessStatus ||
    latestParticipant.access_status ||
    latestParticipant.access ||
    "";


/*
 * Kalau status kosong tetapi invitation
 * pernah dikirim.
 */

if (
    !String(finalInvitationStatus).trim() ||
    String(finalInvitationStatus).trim() === "-"
) {

    if (
        latestParticipant.invitedAt ||
        latestParticipant.lastInvitationAt ||
        latestParticipant.invitationSentAt ||
        latestParticipant.invitationSubject ||
        latestParticipant.invitationBody
    ) {

        finalInvitationStatus =
            "Invited";

    } else {

        finalInvitationStatus =
            "-";

    }

}


/* =====================================================
   ASSESSMENT STATUS
===================================================== */

let finalAssessmentStatus =
    latestParticipant.assessmentStatus ||
    latestParticipant.assessment_status ||
    latestParticipant.status ||
    "";


/*
 * COMPLETED
 */

if (
    latestParticipant.completedAt
) {

    finalAssessmentStatus =
        "Completed";

}


/*
 * IN PROGRESS
 */

else if (
    latestParticipant.isLoggedIn === true &&
    (
        latestParticipant.loginTime ||
        latestParticipant.loggedInAt
    )
) {

    finalAssessmentStatus =
        "In Progress";

}


/*
 * NOT STARTED
 */

else if (
    !String(finalAssessmentStatus).trim() ||
    String(finalAssessmentStatus).trim() === "-"
) {

    finalAssessmentStatus =
        "Not Started";

}


/* =====================================================
   MASUKKAN DATA KE MODAL
===================================================== */

const fields = {

    detailParticipantName:
        latestParticipant.name ||
        latestParticipant.fullName ||
        participantName,

    detailParticipantEmail:
        latestParticipant.email ||
        latestParticipant.emailAddress ||
        participantEmail,

        detailParticipantPassword:
    latestParticipant.accessCode ||
    latestParticipant.password ||
    latestParticipant.access_code ||
    "-",

detailParticipantEducation:
    latestParticipant.education ||
    latestParticipant.educationLevel ||
    latestParticipant.education_level ||
    latestParticipant.pendidikan ||
    latestParticipant.degree ||
    "-",

    detailParticipantId:
        latestParticipant.id ||
        latestParticipant.participantId ||
        participantId,

    detailParticipantPosition:
        latestParticipant.position ||
        latestParticipant.jobPosition ||
        participantPosition,

    detailParticipantPhone:
    latestParticipant.phone ||
    latestParticipant.phoneNumber ||
    latestParticipant.phone_number ||
    latestParticipant.mobile ||
    latestParticipant.mobilePhone ||
    latestParticipant.mobile_phone ||
    latestParticipant.telephone ||
    latestParticipant.telephoneNumber ||
    latestParticipant.telephone_number ||
    latestParticipant.telepon ||
    latestParticipant.noTelepon ||
    latestParticipant.no_telepon ||
    latestParticipant.noHp ||
    latestParticipant.no_hp ||
    latestParticipant.hp ||
    participantPhone ||
    "-",
    
    detailAssessmentDate:
        formatDate(
            latestParticipant.assessmentDate ||
            latestParticipant.assessment_date ||
            assessmentDate
        ),

    detailLoginTime:
    participantHasLoggedIn
        ? formatDateTime(latestLoginTime)
        : "-",

detailLogoutTime:
    participantHasLoggedOut
        ? formatDateTime(latestLogoutTime)
        : "-",
    

    detailInvitationStatus:
        finalInvitationStatus,

    detailAssessmentStatus:
        finalAssessmentStatus

};


/* =====================================================
   TAMPILKAN KE MODAL
===================================================== */

Object.keys(fields).forEach(function (
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            fields[elementId];

    }

});

    /* =====================================================
       STATUS STYLE
    ===================================================== */

    const statusElement =
        document.getElementById(
            "detailAssessmentStatus"
        );


    if (statusElement) {

        statusElement.classList.remove(
            "complete",
            "running",
            "pending",
            "not-started"
        );


        const status =
            String(assessmentStatus)
                .toLowerCase()
                .trim();


        if (
            status.includes("complete") ||
            status.includes("completed") ||
            status.includes("finish")
        ) {

            statusElement.classList.add(
                "complete"
            );

        }

        else if (
            status.includes("running") ||
            status.includes("progress") ||
            status.includes("active")
        ) {

            statusElement.classList.add(
                "running"
            );

        }

        else if (
            status.includes("pending") ||
            status.includes("waiting")
        ) {

            statusElement.classList.add(
                "pending"
            );

        }

        else {

            statusElement.classList.add(
                "not-started"
            );

        }

    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    modal.classList.add("is-open");

    document.body.style.overflow = "hidden";

}

/* ==========================================================
   CLOSE PARTICIPANT DETAIL
========================================================== */

function closeParticipantDetail() {

    const modal =
        document.getElementById(
            "participantDetailModal"
        );

    if (!modal) {

        return;
    }


    modal.classList.remove(
        "is-open"
    );

    document.body.style.overflow =
        "";

}

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target &&
            event.target.id ===
                "participantDetailModal"
        ) {

            closeParticipantDetail();

        }

    }
);

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeParticipantDetail();

        }

    }
);

/* ==========================================================
   EDIT PARTICIPANT
   ========================================================== */

function editParticipant(id) {

    const result =
        findParticipantById(id);


    if (!result) {

        alert("Participant tidak ditemukan.");

        return;

    }


    const p = result.participant;


    const newName =
        prompt(
            "Nama participant:",
            p.name || ""
        );


    if (newName === null) {
        return;
    }


    const newPosition =
        prompt(
            "Position:",
            p.position || ""
        );


    if (newPosition === null) {
        return;
    }


    p.name =
        newName.trim() || p.name;


    p.position =
        newPosition.trim() || p.position;


    const projects =
        getProjects();


    const project =
        projects.find(
            x =>
                String(x.id) ===
                String(result.project.id)
        );


    if (project) {

        const participant =
            project.participants.find(
                x =>
                    String(x.id) ===
                    String(id)
            );


        if (participant) {

            participant.name =
                p.name;

            participant.position =
                p.position;

        }

    }


    if (saveProjects(projects)) {

        refreshParticipantTable();

        refreshStatistics();

    }

}


/* ==========================================================
   DELETE PARTICIPANT
   ========================================================== */

function deleteParticipant(id) {

    const result =
        findParticipantById(id);


    if (!result) {

        alert("Participant tidak ditemukan.");

        return;

    }


    const name =
        result.participant.name ||
        "participant";


    const confirmed =
        confirm(
            "Hapus participant \"" +
            name +
            "\"?"
        );


    if (!confirmed) {
        return;
    }


    const projects =
        getProjects();


    const project =
        projects.find(
            x =>
                String(x.id) ===
                String(result.project.id)
        );


    if (!project) {
        return;
    }


    project.participants =
        Array.isArray(project.participants)
            ? project.participants.filter(
                p =>
                    String(p.id) !==
                    String(id)
            )
            : [];


    if (saveProjects(projects)) {

        refreshParticipantTable();

        refreshStatistics();

        alert(
            "Participant berhasil dihapus."
        );

    }

}


/* ==========================================================
   FIND PARTICIPANT
   ========================================================== */

function findParticipantById(id) {

    const projects =
        getProjects();


    for (
        let i = 0;
        i < projects.length;
        i++
    ) {

        const project =
            projects[i];


        const participants =
            Array.isArray(project.participants)
                ? project.participants
                : [];


        for (
            let j = 0;
            j < participants.length;
            j++
        ) {

            if (
                String(participants[j].id) ===
                String(id)
            ) {

                return {

                    project: project,

                    participant:
                        participants[j]

                };

            }

        }

    }


    return null;

}


/* ==========================================================
   EXPORT PARTICIPANTS
   ========================================================== */

function initializeExport() {

    const button =
        document.getElementById(
            "btnExport"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        exportParticipants
    );

}


function exportParticipants() {

    const projects =
        getProjects();


    const rows = [

        [
            "Participant ID",
            "Full Name",
            "Email",
            "Position",
            "Access Code",
            "Status",
            "Project"
        ]

    ];


    projects.forEach(function (project) {

        const participants =
            Array.isArray(project.participants)
                ? project.participants
                : [];


        participants.forEach(function (p) {

            rows.push([

                p.id || "",

                p.name || "",

                p.email || "",

                p.position || "",

                p.accessCode || "",

                p.status || "",

                project.name || ""

            ]);

        });

    });


    const csv =
        rows
            .map(function (row) {

                return row
                    .map(function (value) {

                        return '"' +
                            String(value)
                                .replace(/"/g, '""') +
                            '"';

                    })
                    .join(",");

            })
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "TalentScope_Participants.csv";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}


/* ==========================================================
   HTML ESCAPE
   ========================================================== */

function escapeHtml(value) {

    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeJs(value) {

    return String(value == null ? "" : value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');

}