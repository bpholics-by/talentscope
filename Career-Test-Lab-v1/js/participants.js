/* ==========================================================
   TALENTSCOPE - PARTICIPANT MANAGEMENT
   File: js/participants.js
   ========================================================== */

/* ==========================================================
   TALENTSCOPE PARTICIPANTS - SUPABASE INITIALIZATION
   ========================================================== */

window.__talentScopeProjectsCache =
    window.__talentScopeProjectsCache || [];

window.__talentScopeParticipantDataLoaded =
    window.__talentScopeParticipantDataLoaded || false;


document.addEventListener("DOMContentLoaded", function () {
    initializeParticipants();
});


async function initializeParticipants() {

    initializeActionButtons();
    initializeSearch();
    initializeFilter();
    initializeExport();

    try {
        await loadParticipantDataFromSupabase();
    } catch (error) {
        console.error(
            "[PARTICIPANTS] Supabase load failed, using legacy cache:",
            error
        );
        loadLegacyProjectsIntoCache();
    }

    // Cache lokal hanya untuk kompatibilitas fitur lama.
    // Supabase tetap menjadi sumber data utama.
    syncParticipantsDatabase(getProjects());


/* =========================================
   REFRESH UI
========================================= */

refreshParticipantTable();


/* =========================================
   REFRESH STATISTICS
========================================= */

refreshStatistics();


console.log(
    "[PARTICIPANTS] Initialization completed"
);
}


/* ==========================================================
   WAIT FOR DATA SERVICE
   ========================================================== */

async function waitForDataService() {

    const startedAt = Date.now();

    while (
        typeof window.DataService === "undefined" &&
        Date.now() - startedAt < 10000
    ) {
        await new Promise(function (resolve) {
            setTimeout(resolve, 100);
        });
    }

    if (
        typeof window.DataService === "undefined" ||
        typeof window.DataService.getProjects !== "function"
    ) {
        throw new Error("DataService belum tersedia");
    }

    console.log(
        "[PARTICIPANTS] DataService ready"
    );
}



async function loadParticipantDataFromSupabase() {

    await waitForDataService();

    console.log(
        "[PARTICIPANTS] Loading real data from Supabase..."
    );

    const projects =
        await window.DataService.getProjects();

    // PERBAIKAN PERFORMA: ambil peserta semua project SECARA
    // PARALEL (Promise.all), bukan satu-satu berurutan seperti
    // sebelumnya. Loading awal sebelumnya = total waktu semua
    // request dijumlahkan; sekarang = waktu request paling lama
    // saja, karena semuanya jalan bersamaan.
    const hydratedProjects = await Promise.all(
        (projects || []).map(async function (project) {

            let participants = [];

            try {

                if (
                    typeof window.DataService.getProjectParticipants === "function"
                ) {

                    const relations =
                        await window.DataService.getProjectParticipants(
                            project.id
                        );

                    participants =
                        (relations || [])
                        .map(function (relation) {

                            const participant =
                                relation.participant || {};

                            if (
                                !participant ||
                                !Object.keys(participant).length
                            ) {
                                return null;
                            }

                            return {
                                ...participant,

                                // Simpan status relasi project bila ada.
                                projectParticipantStatus:
                                    relation.status ||
                                    relation.participant_status ||
                                    "",

                                status:
                                    participant.status ||
                                    relation.status ||
                                    relation.participant_status ||
                                    participant.assessment_status ||
                                    "Not Started"
                            };

                        })
                        .filter(Boolean);

                } else if (
                    typeof window.DataService.getParticipantsByProject === "function"
                ) {

                    participants =
                        await window.DataService.getParticipantsByProject(
                            project.id
                        );

                }

            } catch (error) {

                console.warn(
                    "[PARTICIPANTS] Failed to load participants for project:",
                    project.id,
                    error
                );

            }

            return {
                ...project,
                participants: Array.isArray(participants)
                    ? participants
                    : []
            };

        })
    );

    window.__talentScopeProjectsCache =
        hydratedProjects;

    window.__talentScopeParticipantDataLoaded =
        true;

    // Legacy cache diperbarui agar fungsi lama yang masih
    // bergantung pada localStorage tidak kehilangan data.
    try {
        localStorage.setItem(
            "talentscope_projects",
            JSON.stringify(hydratedProjects)
        );
    } catch (error) {
        console.warn(
            "[PARTICIPANTS] Unable to update legacy cache:",
            error
        );
    }

    console.log(
        "[PARTICIPANTS] Supabase data ready:",
        hydratedProjects
    );

    return hydratedProjects;

}


function loadLegacyProjectsIntoCache() {

    try {

        const raw =
            localStorage.getItem("talentscope_projects");

        const projects =
            raw ? JSON.parse(raw) : [];

        window.__talentScopeProjectsCache =
            Array.isArray(projects)
                ? projects
                : [];

        return window.__talentScopeProjectsCache;

    } catch (error) {

        console.error(
            "[PARTICIPANTS] Legacy cache unavailable:",
            error
        );

        window.__talentScopeProjectsCache = [];
        return [];

    }

}


/* ==========================================================
   LOCAL STORAGE
   ========================================================== */

function getProjects() {

    if (
        Array.isArray(
            window.__talentScopeProjectsCache
        )
    ) {
        return window.__talentScopeProjectsCache;
    }

    return loadLegacyProjectsIntoCache();

}


async function saveProjects(projects) {

    const safeProjects =
        Array.isArray(projects)
            ? projects
            : [];

    window.__talentScopeProjectsCache =
        safeProjects;

    // Legacy cache tetap disimpan untuk kompatibilitas
    // fungsi lama, tetapi bukan lagi sumber data utama.
    try {
        localStorage.setItem(
            "talentscope_projects",
            JSON.stringify(safeProjects)
        );
    } catch (error) {
        console.warn(
            "[PARTICIPANTS] Failed to save legacy cache:",
            error
        );
    }

    syncParticipantsDatabase(safeProjects);

    return true;

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

                            <label>Pendidikan</label>

                            <input
                                id="newParticipantEducation"
                                type="text"
                                placeholder="Contoh: S1 Teknik Industri">

                        </div>


                        <div class="ts-form-group">

                            <label>No. Telepon</label>

                            <input
                                id="newParticipantPhone"
                                type="tel"
                                placeholder="Contoh: 08123456789">

                        </div>


                        <div class="ts-form-group">

                            <label>Tanggal Assessment</label>

                            <input
                                id="newParticipantAssessmentDate"
                                type="date">

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


    const education =
        document
            .getElementById("newParticipantEducation")
            .value
            .trim();


    const phone =
        document
            .getElementById("newParticipantPhone")
            .value
            .trim();


    const assessmentDate =
        document
            .getElementById("newParticipantAssessmentDate")
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

        education: education || "-",

        phone: phone || "-",

        assessmentDate: assessmentDate || "",

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

    console.log(
        "[PARTICIPANTS] Refreshing participant table..."
    );


    const tableBody =
        document.querySelector(
            ".participant-table tbody"
        );


    if (!tableBody) {

        console.warn(
            "[PARTICIPANTS] Table body not found"
        );

        return;

    }


    const projects =
        getProjects();


    const rows = [];


    projects.forEach(
        function (project) {

            const participants =
                Array.isArray(
                    project.participants
                )
                    ? project.participants
                    : [];


            participants.forEach(
                function (participant) {

                    rows.push({
                        participant:
                            participant,

                        project:
                            project
                    });

                }
            );

        }
    );


    /* =========================================
       EMPTY STATE
    ========================================= */

    if (rows.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#64748b;
                    "
                >

                    No participants found.

                </td>

            </tr>

        `;


        return;

    }


    /* =========================================
       RENDER ROWS
    ========================================= */

    tableBody.innerHTML =
        rows.map(
            function (item, index) {

                const p =
                    item.participant || {};

                const project =
                    item.project || {};


                const name =
                    p.name ||
                    p.nama ||
                    p.fullName ||
                    "-";


                const email =
                    p.email ||
                    p.emailAddress ||
                    "-";



                const participantId =
                    p.id ||
                    p.participantId ||
                    "-";

                // Keep the full UUID internally for View/Edit/Remove,
                // but render a compact, readable ID in the table.
                const shortParticipantId =
                    participantId && participantId !== "-"
                        ? "PRT-" + String(participantId)
                            .replace(/[^a-zA-Z0-9]/g, "")
                            .slice(0, 8)
                            .toUpperCase()
                        : "-";


                const projectName =
                    project.name ||
                    project.project_name ||
                    "-";


                const status =
                    p.assessment_status ||
                    p.assessmentStatus ||
                    p.status ||
                    p.projectParticipantStatus ||
                    "Not Started";


                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>

                            <div
                                style="
                                    font-weight:600;
                                "
                            >
                                ${escapeHtml(name)}
                            </div>

                            <div
                                style="
                                    font-size:12px;
                                    color:#64748b;
                                    margin-top:3px;
                                "
                            >
                                ${escapeHtml(email)}
                            </div>

                        </td>


                        <td>

                            ${escapeHtml(
                                projectName
                            )}

                        </td>



                        <td>

                            <span
                                class="participant-id-chip"
                                title="${escapeHtml(participantId)}"
                            >
                                ${escapeHtml(shortParticipantId)}
                            </span>

                        </td>


                        <td>

                            <span
                                class="status ${getStatusClass(status)}"
                            >

                                ${escapeHtml(
                                    status
                                )}

                            </span>

                        </td>


                        <td>

                            <div class="participant-action-buttons">
                                <button
                                    type="button"
                                    class="action-btn view-btn"
                                    onclick="viewParticipant('${escapeJs(participantId)}')"
                                    title="View participant"
                                >
                                    <i class="fa-solid fa-eye"></i>
                                    <span>View</span>
                                </button>

                                <button
                                    type="button"
                                    class="action-btn edit-btn"
                                    onclick="editParticipant('${escapeJs(participantId)}')"
                                    title="Edit participant"
                                >
                                    <i class="fa-solid fa-pen"></i>
                                    <span>Edit</span>
                                </button>

                                <button
                                    type="button"
                                    class="action-btn remove-btn"
                                    onclick="deleteParticipant('${escapeJs(participantId)}')"
                                    title="Remove participant"
                                >
                                    <i class="fa-solid fa-trash-can"></i>
                                    <span>Remove</span>
                                </button>
                            </div>

                        </td>

                    </tr>

                `;

            }
        )
        .join("");


    console.log(
        "[PARTICIPANTS] Table rendered:",
        rows.length,
        "participants"
    );

}




/* ==========================================================
   PARTICIPANT TABLE ACTIONS
   ========================================================== */

const __tsParticipantActionStyle = `
.participant-action-buttons{display:flex;align-items:center;justify-content:flex-start;gap:8px;white-space:nowrap;}
.participant-action-buttons .action-btn{appearance:none;border:1px solid #dbe4ef;background:#fff;border-radius:9px;min-width:76px;height:34px;padding:0 11px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font:600 12px/1 inherit;cursor:pointer;box-shadow:0 2px 6px rgba(15,23,42,.05);transition:transform .16s ease,box-shadow .16s ease,background .16s ease,border-color .16s ease;}
.participant-action-buttons .action-btn:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(15,23,42,.10);}
.participant-action-buttons .action-btn i{font-size:11px;}
.participant-action-buttons .view-btn{color:#2563eb;background:#f8fbff;border-color:#cfe0ff;}
.participant-action-buttons .view-btn:hover{background:#eff6ff;border-color:#93c5fd;}
.participant-action-buttons .edit-btn{color:#0f766e;background:#f0fdfa;border-color:#bdebe5;}
.participant-action-buttons .edit-btn:hover{background:#e6fffb;border-color:#79d7cb;}
.participant-action-buttons .remove-btn{color:#b42318;background:#fff7f7;border-color:#f5c4c0;}
.participant-action-buttons .remove-btn:hover{background:#fff0f0;border-color:#ee9b95;}
.participant-id-chip{display:inline-flex;align-items:center;min-height:28px;padding:0 9px;border-radius:8px;background:#f1f5f9;border:1px solid #e2e8f0;color:#475569;font-size:11px;font-weight:700;letter-spacing:.025em;white-space:nowrap;}
`;

if (!document.getElementById("tsParticipantActionStyle")) {
    const style = document.createElement("style");
    style.id = "tsParticipantActionStyle";
    style.textContent = __tsParticipantActionStyle;
    document.head.appendChild(style);
}

/* ==========================================================
   STATISTICS
   ========================================================== */

function refreshStatistics() {

    const projects = getProjects();

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
                normalize(
                    p.assessment_status ||
                    p.assessmentStatus ||
                    p.status ||
                    p.projectParticipantStatus ||
                    ""
                );

            if (
                status.includes("running") ||
                status.includes("progress") ||
                status.includes("active") ||
                status.includes("ongoing")
            ) {
                active++;
            }

            if (
                status.includes("complete") ||
                status.includes("completed") ||
                status.includes("finish") ||
                status.includes("finished")
            ) {
                completed++;
            }

            const rawScore =
                p.average_score ??
                p.averageScore ??
                p.score ??
                p.final_score ??
                p.finalScore;

            if (
                rawScore !== undefined &&
                rawScore !== null &&
                rawScore !== ""
            ) {

                const score =
                    Number(rawScore);

                if (!isNaN(score)) {
                    scoreTotal += score;
                    scoreCount++;
                }

            }

        });

    });

    const average =
        scoreCount
            ? Math.round(scoreTotal / scoreCount)
            : 0;

    // Current HTML uses ID-based cards.
    const statTotal =
        document.getElementById("statTotal");

    const statActive =
        document.getElementById("statActive");

    const statCompleted =
        document.getElementById("statCompleted");

    const statAverage =
        document.getElementById("statAverage");

    if (statTotal) statTotal.textContent = total;
    if (statActive) statActive.textContent = active;
    if (statCompleted) statCompleted.textContent = completed;
    if (statAverage) statAverage.textContent = average + "%";

    // Backward compatibility with older .stat-card layout.
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
                    ) ||
                    card.querySelector("h3");

                if (number) {
                    number.textContent =
                        numbers[index];
                }

            }
        );

    }

}


/* ==========================================================
   EXPORT


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

    // Buka detail participant di halaman Database (tab baru),
    // sesuai ID-nya masing-masing.
    const url =
        "database.html?detail=" +
        encodeURIComponent(p.id || id) +
        "&name=" +
        encodeURIComponent(p.name || "");

    window.open(url, "_blank");

    return;

    /* =====================================================
       KODE LAMA DI BAWAH INI TIDAK LAGI DIPAKAI
       (modal detail sekarang dibuka dari database.html).
       Dibiarkan sebagai referensi, tidak akan pernah
       tereksekusi karena ada `return;` di atas.
    ===================================================== */

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
       ROBUST PARTICIPANT FIELD RESOLVER
       Keeps DataService unchanged. This only reads aliases /
       nested participant payloads returned by Supabase.

       PENTING: Banyak data (education, phone, assessmentDate, dll)
       ternyata TIDAK disimpan sebagai kolom terpisah di Supabase,
       melainkan di dalam kolom "raw_data" (berbentuk JSON).
       Jadi kita wajib membuka isi raw_data juga saat mencari data.
    ===================================================== */
    function parseRawData(source) {

        try {

            const raw =
                source && source.raw_data;

            if (!raw) {
                return {};
            }

            if (typeof raw === "string") {
                return JSON.parse(raw);
            }

            if (typeof raw === "object") {
                return raw;
            }

        } catch (error) {

            console.warn(
                "Gagal membaca raw_data participant:",
                error
            );

        }

        return {};

    }

    function getParticipantField(source, keys, fallback) {

        const rawData = parseRawData(source);

        const containers = [
            source || {},
            rawData,
            (source && source.profile) || {},
            (source && source.personalInfo) || {},
            (source && source.personal_info) || {},
            (source && source.details) || {},
            (source && source.metadata) || {},
            (source && source.data) || {}
        ];

        for (const container of containers) {
            for (const key of keys) {
                const value = container ? container[key] : undefined;
                if (value !== undefined && value !== null && String(value).trim() !== "") {
                    return value;
                }
            }
        }

        return fallback === undefined ? "-" : fallback;
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
    getParticipantField(
        latestParticipant,
        ["accessCode", "access_code", "password", "passcode", "pass_code", "credential", "credentialCode"]
    ) !== "-"
        ? getParticipantField(latestParticipant, ["accessCode", "access_code", "password", "passcode", "pass_code", "credential", "credentialCode"])
        : getParticipantField(p, ["accessCode", "access_code", "password", "passcode", "pass_code", "credential", "credentialCode"]),

detailParticipantEducation:
    getParticipantField(
        latestParticipant,
        [
            "education", "educationLevel", "education_level",
            "pendidikan", "pendidikanTerakhir", "pendidikan_terakhir",
            "lastEducation", "last_education", "degree", "qualification",
            "academicLevel", "academic_level", "jenjang"
        ],
        getParticipantField(
            p,
            [
                "education", "educationLevel", "education_level",
                "pendidikan", "pendidikanTerakhir", "pendidikan_terakhir",
                "lastEducation", "last_education", "degree", "qualification",
                "academicLevel", "academic_level", "jenjang"
            ],
            "-"
        )
    ),

    detailParticipantId:
        latestParticipant.id ||
        latestParticipant.participantId ||
        participantId,

    detailParticipantPosition:
        getParticipantField(
            latestParticipant,
            ["position", "jobPosition", "job_position", "jobTitle", "job_title", "jabatan", "posisi", "department", "division"]
        ) !== "-"
            ? getParticipantField(latestParticipant, ["position", "jobPosition", "job_position", "jobTitle", "job_title", "jabatan", "posisi", "department", "division"])
            : participantPosition,

    detailParticipantPhone:
    getParticipantField(
        latestParticipant,
        [
            "phone", "phoneNumber", "phone_number", "mobile",
            "mobilePhone", "mobile_phone", "mobileNumber", "mobile_number",
            "telephone", "telephoneNumber", "telephone_number",
            "telepon", "noTelepon", "no_telepon", "noHp", "no_hp",
            "phoneNo", "phone_no", "contactNumber", "contact_number", "hp", "telp"
        ],
        getParticipantField(
            p,
            [
                "phone", "phoneNumber", "phone_number", "mobile",
                "mobilePhone", "mobile_phone", "mobileNumber", "mobile_number",
                "telephone", "telephoneNumber", "telephone_number",
                "telepon", "noTelepon", "no_telepon", "noHp", "no_hp",
                "phoneNo", "phone_no", "contactNumber", "contact_number", "hp", "telp"
            ],
            participantPhone || "-"
        )
    ),
    
    detailAssessmentDate:
        formatDate(
            getParticipantField(
                latestParticipant,
                [
                    "assessmentDate", "assessment_date",
                    "tanggal", "tanggalAssessment", "tanggal_assessment"
                ],
                getParticipantField(
                    p,
                    [
                        "assessmentDate", "assessment_date",
                        "tanggal", "tanggalAssessment", "tanggal_assessment"
                    ],
                    assessmentDate
                )
            )
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

    // Buka form edit participant di halaman Database (tab baru),
    // sesuai ID-nya masing-masing.
    const editUrl =
        "database.html?edit=" +
        encodeURIComponent(p.id || id) +
        "&name=" +
        encodeURIComponent(p.name || "");

    window.open(editUrl, "_blank");

    return;

    /* =====================================================
       KODE LAMA DI BAWAH INI TIDAK LAGI DIPAKAI
       (form edit sekarang dibuka dari database.html).
       Dibiarkan sebagai referensi, tidak akan pernah
       tereksekusi karena ada `return;` di atas.
    ===================================================== */

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


    const newEducation =
        prompt(
            "Pendidikan:",
            (p.education && p.education !== "-") ? p.education : ""
        );

    if (newEducation === null) {
        return;
    }


    const newPhone =
        prompt(
            "No. Telepon:",
            (p.phone && p.phone !== "-") ? p.phone : ""
        );

    if (newPhone === null) {
        return;
    }


    const newAssessmentDate =
        prompt(
            "Tanggal Assessment (format: YYYY-MM-DD):",
            p.assessmentDate || ""
        );

    if (newAssessmentDate === null) {
        return;
    }


    p.name =
        newName.trim() || p.name;


    p.position =
        newPosition.trim() || p.position;


    p.education =
        newEducation.trim() || "-";


    p.phone =
        newPhone.trim() || "-";


    p.assessmentDate =
        newAssessmentDate.trim();


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

            participant.education =
                p.education;

            participant.phone =
                p.phone;

            participant.assessmentDate =
                p.assessmentDate;

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