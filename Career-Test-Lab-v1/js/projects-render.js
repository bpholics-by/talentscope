/* ==========================================================
   TalentScope Enterprise
   Projects Render
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const table = document.getElementById("projectTable");

    if (!table) return;

    // Ambil data project langsung dari localStorage saat
    // halaman pertama kali dibuka agar tabel tidak menunggu
    // variabel/global state dari proses lain.
    let initialProjects = [];

    try {
        const storedProjects =
            JSON.parse(
                localStorage.getItem("talentscope_projects") || "[]"
            );

        initialProjects =
            Array.isArray(storedProjects)
                ? storedProjects
                : [];

    } catch (error) {

        console.error(
            "Gagal memuat project saat initial render:",
            error
        );

        initialProjects = [];
    }

    renderProjects(initialProjects);

});


/* ==========================================================
   FORMAT DATE
========================================================== */

function formatDate(date) {

    if (!date) return "-";

    const d = new Date(date + "T00:00:00");

    if (isNaN(d)) return "-";

    return d.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* ==========================================================
   RENDER PROJECTS
========================================================== */

function renderProjects(data) {

    const table =
        document.getElementById("projectTable");

    if (!table) return;

    table.innerHTML = "";


    /* ------------------------------------------------------
       JIKA DATA KOSONG
    ------------------------------------------------------ */

    if (!Array.isArray(data) || data.length === 0) {

        table.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    style="
                        text-align:center;
                        padding:40px;
                        color:#7182a3;
                    "
                >

                    No projects found.

                </td>

            </tr>
        `;

        return;

    }


    /* ------------------------------------------------------
       RENDER PROJECT
    ------------------------------------------------------ */

    data.forEach(project => {


        /* ==================================================
           STATUS
        ================================================== */

        let statusClass = "";

        switch (project.status) {

            case "Running":
                statusClass = "running";
                break;

            case "Completed":
                statusClass = "complete";
                break;

            case "Waiting":
                statusClass = "waiting";
                break;

            case "Draft":
                statusClass = "waiting";
                break;

            default:
                statusClass = "running";

        }


        /* ==================================================
           PROJECT NAME
        ================================================== */

        const projectName =
            project.projectName ||
            project.name ||
            project.project ||
            "-";


        /* ==================================================
           PARTICIPANT COUNT
        ================================================== */

        const participantCount =
            Array.isArray(project.participants)
                ? project.participants.length
                : 0;


        /* ==================================================
           RENDER ROW
        ================================================== */

        table.innerHTML += `

            <tr>


                <!-- =========================================
                     CHECKBOX
                ========================================== -->

                <td>

                    <input
                        type="checkbox"
                        class="project-checkbox"
                        value="${escapeHtml(project.id)}"
                    >

                </td>



                <!-- =========================================
                     PROJECT
                ========================================== -->

                <td>

                    <div class="project-info">

                        <div>

                            <strong>

                                ${escapeHtml(projectName)}

                            </strong>

                            <span>

                                ${escapeHtml(project.id)}

                            </span>

                        </div>

                    </div>

                </td>



                <!-- =========================================
                     CLIENT / COMPANY
                ========================================== -->

                <td>

                    ${escapeHtml(
                        project.company ||
                        project.organization ||
                        "-"
                    )}

                </td>



                <!-- =========================================
                     ASSESSMENT DATE
                ========================================== -->

                <td>

                    ${formatDate(
                        project.startDate ||
                        project.start
                    )}

                </td>



                <!-- =========================================
                     PARTICIPANTS
                ========================================== -->

                <td>

                    ${participantCount}

                </td>



                <!-- =========================================
                     PIC
                ========================================== -->

                <td>

                    ${escapeHtml(
                        typeof project.pic === "string"
                            ? project.pic
                            : (
                                project.pic?.name ||
                                project.pic?.fullName ||
                                "-"
                            )
                    )}

                </td>



                <!-- =========================================
                     STATUS
                ========================================== -->

                <td>

                    <span
                        class="status ${statusClass}"
                    >

                        ${escapeHtml(
                            project.status || "-"
                        )}

                    </span>

                </td>



                <!-- =========================================
                     ACTION
                ========================================== -->

                <td>

                    <div class="table-actions">


                        <!-- =================================
                             VIEW & MONITORING
                        ================================== -->

                        <button
                            type="button"
                            title="View & Monitoring"
                            aria-label="View & Monitoring"
                            onclick="
                                openProjectViewMonitoring(
                                    '${escapeJs(project.id)}'
                                )
                            "
                        >

                            <i
                                class="fa-solid fa-eye"
                            ></i>

                        </button>



                        
                        <!-- =================================
                             RESULTS
                        ================================== -->

                        <button
                            type="button"
                            title="Results"
                            aria-label="Results"
                            onclick="
                                openProjectResults(
                                    '${escapeJs(project.id)}'
                                )
                            "
                        >

                            <i
                                class="fa-solid fa-file-lines"
                            ></i>

                        </button>



                        <!-- =================================
                             EXPORT
                        ================================== -->

                        <button
                            type="button"
                            title="Export"
                            aria-label="Export"
                            onclick="
                                exportProjectToExcel(
                                    '${escapeJs(project.id)}'
                                )
                            "

                        >

                            <i
                                class="fa-solid fa-file-export"
                            ></i>

                        </button>



                        <!-- =================================
                             EDIT
                        ================================== -->

                        <button
                            type="button"
                            title="Edit"
                            aria-label="Edit"
                            onclick="
                                openProjectEdit(
                                    '${escapeJs(project.id)}'
                                )
                            "
                        >

                            <i
                                class="fa-solid fa-pen"
                            ></i>

                        </button>



                        <!-- =================================
                             GENERATE USERNAME & PASSWORD
                        ================================== -->

                        <button
                            type="button"
                            title="Generate Username & Password"
                            aria-label="Generate Username & Password"
                            onclick="
                                generateProjectAccess(
                                    '${escapeJs(project.id)}'
                                )
                            "
                        >

                            <i
                                class="fa-solid fa-key"
                            ></i>

                        </button>


                    </div>

                </td>


            </tr>

        `;

    });

}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeHtml(value) {

    if (value === null || value === undefined) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==========================================================
   ESCAPE JAVASCRIPT STRING
========================================================== */

function escapeJs(value) {

    if (value === null || value === undefined) {

        return "";

    }

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");

}


/* ==========================================================
   VIEW & MONITORING
========================================================== */

window.openProjectViewMonitoring =
function(projectId) {

    if (!projectId) {

        alert(
            "Project ID tidak ditemukan."
        );

        return;

    }


        window.open(
        `view-monitoring.html?id=${encodeURIComponent(projectId)}`,
        "_blank"
    );

};


/* ==========================================================
   OPEN PROJECT PARTICIPANTS
========================================================== */

window.openProjectParticipants =
function(projectId) {

    if (!projectId) {

        alert(
            "Project ID tidak ditemukan."
        );

        return;

    }


    window.open(
        `participants.html?projectId=${encodeURIComponent(projectId)}`,
        "_blank"
    );

};


/* ==========================================================
   OPEN PROJECT RESULTS
========================================================== */

window.openProjectResults =
function(projectId) {

    if (!projectId) {

        alert(
            "Project ID tidak ditemukan."
        );

        return;

    }


    window.open(
        `hasil.html?id=${encodeURIComponent(projectId)}`,
        "_blank"
    );

};


/* ==========================================================
   OPEN PROJECT EDIT / PROJECT DETAIL
========================================================== */

window.openProjectEdit = function(projectId) {

    "use strict";

    /* ------------------------------------------------------
       VALIDASI PROJECT ID
    ------------------------------------------------------ */

    if (!projectId) {

        alert(
            "Project ID tidak ditemukan."
        );

        return;
    }


    /* ------------------------------------------------------
       NORMALISASI ID
       Supaya aman jika ID berupa angka / string
    ------------------------------------------------------ */

    const id =
        String(projectId).trim();


    if (!id) {

        alert(
            "Project ID tidak ditemukan."
        );

        return;
    }


    /* ------------------------------------------------------
       CEK PROJECT TERLEBIH DAHULU
       Tidak mengubah data apa pun.
    ------------------------------------------------------ */

    let projects = [];

    try {

        projects =
            JSON.parse(
                localStorage.getItem(
                    "talentscope_projects"
                ) || "[]"
            );

    } catch (error) {

        console.error(
            "Gagal membaca data project:",
            error
        );

        projects = [];

    }


    const project =
        projects.find(
            function(item) {

                return (
                    item &&
                    String(item.id).trim() === id
                );

            }
        );


    /* ------------------------------------------------------
       PROJECT TIDAK DITEMUKAN
    ------------------------------------------------------ */

    if (!project) {

        alert(
            "Project dengan ID " +
            id +
            " tidak ditemukan."
        );

        return;
    }


    /* ------------------------------------------------------
       MASUK KE PROJECT DETAIL
       MENGIKUTI PROJECT YANG DIPILIH
    ------------------------------------------------------ */

    window.location.href =
        "project-detail.html?id=" +
        encodeURIComponent(id);

};

/* ==========================================================
   UPDATE REMOVE BUTTON STATE
========================================================== */

function updateRemoveButton() {

    const button =
        document.getElementById(
            "removeSelectedProjects"
        );

    if (!button) return;


    const selected =
        document.querySelectorAll(
            ".project-checkbox:checked"
        );


    button.classList.toggle(
        "active",
        selected.length > 0
    );

}


/* ==========================================================
   SELECT ALL PROJECTS
========================================================== */

document.addEventListener(
    "change",
    function(e) {


        /* --------------------------------------------------
           SELECT ALL
        -------------------------------------------------- */

        if (
            e.target.id ===
            "selectAllProjects"
        ) {

            const checked =
                e.target.checked;


            document
                .querySelectorAll(
                    ".project-checkbox"
                )
                .forEach(function(checkbox) {

                    checkbox.checked =
                        checked;

                });


            updateRemoveButton();

        }


        /* --------------------------------------------------
           UPDATE SELECT ALL
        -------------------------------------------------- */

        if (
            e.target.classList.contains(
                "project-checkbox"
            )
        ) {

            const allCheckboxes =
                document.querySelectorAll(
                    ".project-checkbox"
                );


            const checkedCheckboxes =
                document.querySelectorAll(
                    ".project-checkbox:checked"
                );


            const selectAll =
                document.getElementById(
                    "selectAllProjects"
                );


            if (selectAll) {

                selectAll.checked =
                    allCheckboxes.length > 0 &&
                    allCheckboxes.length ===
                    checkedCheckboxes.length;

            }


            updateRemoveButton();

        }

    }
);


/* ==========================================================
   REMOVE SELECTED PROJECTS
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {


        const removeButton =
            document.getElementById(
                "removeSelectedProjects"
            );


        if (!removeButton) return;


        removeButton.addEventListener(
            "click",
            function() {


                const selected =
                    Array.from(
                        document.querySelectorAll(
                            ".project-checkbox:checked"
                        )
                    )
                    .map(function(checkbox) {

                        return String(
                            checkbox.value
                        );

                    });


                /* ------------------------------------------
                   TIDAK ADA PROJECT DIPILIH
                ------------------------------------------ */

                if (
                    selected.length ===
                    0
                ) {

                    alert(
                        "Please select project first."
                    );

                    return;

                }


                /* ------------------------------------------
                   KONFIRMASI
                ------------------------------------------ */

                const confirmed =
                    confirm(
                        "Are you sure you want to remove " +
                        selected.length +
                        " selected project(s)?"
                    );


                if (!confirmed) {

                    return;

                }


                /* ------------------------------------------
                   AMBIL DATA TERBARU
                ------------------------------------------ */

                let storedProjects = [];


                try {

                    storedProjects =
                        JSON.parse(
                            localStorage.getItem(
                                "talentscope_projects"
                            )
                        ) || [];

                } catch (error) {

                    console.error(
                        error
                    );

                    storedProjects = [];

                }


                /* ------------------------------------------
                   HAPUS PROJECT
                ------------------------------------------ */

                const remainingProjects =
                    storedProjects.filter(
                        function(project) {

                            return !selected.includes(
                                String(project.id)
                            );

                        }
                    );


                /* ------------------------------------------
                   SIMPAN
                ------------------------------------------ */

                localStorage.setItem(
                    "talentscope_projects",
                    JSON.stringify(
                        remainingProjects
                    )
                );


                /* ------------------------------------------
                   UPDATE VARIABLE GLOBAL
                ------------------------------------------ */

                if (
                    typeof window.projects !==
                    "undefined"
                ) {

                    window.projects =
                        remainingProjects;

                }


                /* ------------------------------------------
                   SELECT ALL
                ------------------------------------------ */

                const selectAll =
                    document.getElementById(
                        "selectAllProjects"
                    );


                if (selectAll) {

                    selectAll.checked =
                        false;

                }


                /* ------------------------------------------
                   RENDER ULANG
                ------------------------------------------ */

                renderProjects(
                    remainingProjects
                );


                /* ------------------------------------------
                   UPDATE STATISTIC
                ------------------------------------------ */

                if (
                    typeof updateProjectStats ===
                    "function"
                ) {

                    updateProjectStats();

                }


                updateRemoveButton();


                alert(
                    selected.length +
                    " project(s) successfully removed."
                );

            }
        );

    }
);


/* ==========================================================
   GENERATE PROJECT ACCESS
   TalentScope Enterprise
========================================================== */

(function () {

    "use strict";


    /* ======================================================
       STORAGE
    ====================================================== */

    const PROJECT_STORAGE_KEY =
        "talentscope_projects";

    const ROLE_STORAGE_KEY =
        "talentscope_settings_roles";


    /* ======================================================
       LOAD PROJECTS
    ====================================================== */

    function loadProjects() {

        try {

            const stored =
                JSON.parse(
                    localStorage.getItem(
                        PROJECT_STORAGE_KEY
                    ) || "[]"
                );

            return Array.isArray(stored)
                ? stored
                : [];

        } catch (error) {

            console.error(
                "TalentScope: gagal membaca project.",
                error
            );

            return [];

        }

    }


    /* ======================================================
       LOAD CLIENT ROLES DARI SETTINGS
    ====================================================== */

    function loadClientRoles() {

        const fallbackRoles = [

            {
                id:
                    "ROLE-CLIENT-ADMIN",

                name:
                    "Client Administrator"
            },

            {
                id:
                    "ROLE-CLIENT",

                name:
                    "Client User"
            }

        ];


        try {

            const stored =
                JSON.parse(
                    localStorage.getItem(
                        ROLE_STORAGE_KEY
                    ) || "[]"
                );


            if (!Array.isArray(stored)) {

                return fallbackRoles;

            }


            const allowedNames = [

                "Client Administrator",

                "Client User"

            ];


            const roles =
                stored.filter(
                    function (role) {

                        if (!role) {
                            return false;
                        }


                        return allowedNames.includes(
                            String(
                                role.name || ""
                            ).trim()
                        );

                    }
                )
                .map(
                    function (role) {

                        return {

                            id:
                                role.id ||
                                "",

                            name:
                                String(
                                    role.name
                                ).trim()

                        };

                    }
                );


            /*
               Jika Settings belum memiliki
               role tersebut, gunakan fallback.
            */

            if (!roles.length) {

                return fallbackRoles;

            }


            return roles;

        } catch (error) {

            console.error(
                "TalentScope: gagal membaca role Settings.",
                error
            );

            return fallbackRoles;

        }

    }


    /* ======================================================
       ESCAPE HTML
    ====================================================== */

    function accessEscapeHtml(value) {

        return String(
            value == null
                ? ""
                : value
        ).replace(
            /[&<>"']/g,
            function (character) {

                return {

                    "&":
                        "&amp;",

                    "<":
                        "&lt;",

                    ">":
                        "&gt;",

                    '"':
                        "&quot;",

                    "'":
                        "&#039;"

                }[character];

            }
        );

    }


    /* ======================================================
       PROJECT NAME
    ====================================================== */

    function getProjectAccessName(project) {

        return String(

            project.projectName ||

            project.name ||

            project.project ||

            "Project"

        ).trim();

    }


    /* ======================================================
       CLEAN TEXT
    ====================================================== */

    function cleanCredentialText(value) {

        return String(
            value || ""
        )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9]+/g,
            ""
        );

    }


    /* ======================================================
       ROLE SLUG
    ====================================================== */

    function getRoleSlug(roleName) {

        if (
            roleName ===
            "Client Administrator"
        ) {

            return "clientadmin";

        }


        return "clientuser";

    }


    /* ======================================================
       RANDOM STRING
    ====================================================== */

    function randomString(length) {

        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZ" +
            "abcdefghijkmnopqrstuvwxyz" +
            "23456789";


        let result = "";


        /*
           Gunakan crypto.randomUUID/randomValues
           jika browser mendukung.
        */

        if (
            window.crypto &&
            window.crypto.getRandomValues
        ) {

            const values =
                new Uint32Array(
                    length
                );


            window.crypto.getRandomValues(
                values
            );


            for (
                let i = 0;
                i < length;
                i++
            ) {

                result +=
                    characters[
                        values[i] %
                        characters.length
                    ];

            }


            return result;

        }


        /*
           Fallback browser lama.
        */

        for (
            let i = 0;
            i < length;
            i++
        ) {

            result +=
                characters[
                    Math.floor(
                        Math.random() *
                        characters.length
                    )
                ];

        }


        return result;

    }


    /* ======================================================
       GENERATE PASSWORD
    ====================================================== */

    function generateSecurePassword() {

        const upper =
            "ABCDEFGHJKLMNPQRSTUVWXYZ";

        const lower =
            "abcdefghijkmnopqrstuvwxyz";

        const number =
            "23456789";

        const special =
            "!@#$%&*";


        /*
           Pastikan password memiliki
           kombinasi karakter.
        */

        const required = [

            upper[
                Math.floor(
                    Math.random() *
                    upper.length
                )
            ],

            lower[
                Math.floor(
                    Math.random() *
                    lower.length
                )
            ],

            number[
                Math.floor(
                    Math.random() *
                    number.length
                )
            ],

            special[
                Math.floor(
                    Math.random() *
                    special.length
                )
            ]

        ];


        const remaining =
            randomString(8);


        const password =
            required.join("") +
            remaining;


        /*
           Acak kembali supaya
           karakter wajib tidak selalu
           berada di depan.
        */

        return password
            .split("")
            .sort(
                function () {

                    return Math.random() - 0.5;

                }
            )
            .join("");

    }


    /* ======================================================
       CHECK USERNAME DUPLICATE
    ====================================================== */

    function usernameExists(
        username,
        projects
    ) {

        const normalized =
            String(
                username
            ).toLowerCase();


        return projects.some(
            function (project) {

                if (!project) {
                    return false;
                }


                const existing =
                    project.access &&
                    project.access.username
                        ? String(
                            project.access.username
                        ).toLowerCase()
                        : "";


                return (
                    existing &&
                    existing === normalized
                );

            }
        );

    }


    /* ======================================================
       GENERATE UNIQUE USERNAME
    ====================================================== */

    function generateUniqueUsername(
        project,
        role,
        projects
    ) {

        const projectName =
            cleanCredentialText(
                getProjectAccessName(
                    project
                )
            );


        const roleSlug =
            getRoleSlug(
                role.name
            );


        let username =
            projectName +
            "." +
            roleSlug;


        /*
           Jika belum digunakan,
           langsung gunakan.
        */

        if (
            !usernameExists(
                username,
                projects
            )
        ) {

            return username;

        }


        /*
           Jika sudah ada,
           tambahkan angka random.
        */

        let counter = 1;


        while (
            usernameExists(
                username +
                counter,
                projects
            )
        ) {

            counter++;

        }


        return (
            username +
            counter
        );

    }


    /* ======================================================
       MODAL STYLE
    ====================================================== */

    function ensureAccessModalStyle() {

        if (
            document.getElementById(
                "projectAccessModalStyle"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "projectAccessModalStyle";


        style.textContent = `

            #projectAccessModal{
    position:fixed;
    inset:0;
    z-index:99999;

    display:none;
    align-items:center;
    justify-content:center;

    padding:24px;

    background:
        radial-gradient(
            circle at 20% 10%,
            rgba(37,99,235,.18),
            transparent 35%
        ),
        rgba(8,20,45,.68);

    backdrop-filter:blur(9px);
    -webkit-backdrop-filter:blur(9px);

    box-sizing:border-box;
}

#projectAccessModal.show{
    display:flex;
}

/* =========================================================
   MODAL CONTAINER
========================================================= */

.project-access-dialog{
    position:relative;

    width:min(620px,100%);
    max-height:min(760px,calc(100vh - 48px));

    overflow-y:auto;
    overflow-x:hidden;

    background:#ffffff;

    border:1px solid rgba(255,255,255,.9);
    border-radius:24px;

    box-shadow:
        0 35px 90px rgba(7,25,55,.30),
        0 8px 25px rgba(7,25,55,.12);

    padding:0;

    z-index:1;

    animation:projectAccessModalIn .25s ease-out;

   }

@keyframes projectAccessModalIn{
    from{
        opacity:0;
        transform:translateY(18px) scale(.985);
    }

    to{
        opacity:1;
        transform:translateY(0) scale(1);
    }
}

/* =========================================================
   HIDDEN SCROLLBAR
   Modal tetap bisa di-scroll dengan mouse/touchpad/keyboard
========================================================= */

.project-access-dialog{
    scrollbar-width:none;
    -ms-overflow-style:none;
}

.project-access-dialog::-webkit-scrollbar{
    display:none;
    width:0;
    height:0;
}

/* =========================================================
   HEADER
========================================================= */

.project-access-header{
    position:relative;

    display:flex;
    align-items:flex-start;
    justify-content:space-between;

    gap:20px;

    padding:30px 30px 27px;

    background:
        linear-gradient(
            135deg,
            #087ff5 0%,
            #168cf7 45%,
            #6557ed 100%
        );

    color:#ffffff;
}

.project-access-header::after{
    content:"";

    position:absolute;
    right:-70px;
    top:-90px;

    width:220px;
    height:220px;

    border-radius:50%;

    background:rgba(255,255,255,.10);

    pointer-events:none;
}

/* =========================================================
   HEADER TEXT
========================================================= */

.project-access-eyebrow{
    display:block;

    margin-bottom:8px;

    color:rgba(255,255,255,.82);

    font-size:10px;
    font-weight:800;

    letter-spacing:.16em;
    text-transform:uppercase;
}

.project-access-title{
    margin:0;

    color:#ffffff;

    font-size:26px;
    line-height:1.2;

    font-weight:800;
    letter-spacing:-.02em;
}

.project-access-subtitle{
    margin:8px 45px 0 0;

    color:rgba(255,255,255,.88);

    font-size:13px;
    line-height:1.55;

    font-weight:500;
}

/* =========================================================
   CLOSE BUTTON
========================================================= */

.project-access-close{
    position:relative;
    z-index:2;

    flex:0 0 auto;

    width:42px;
    height:42px;

    border:1px solid rgba(255,255,255,.35);

    border-radius:12px;

    background:rgba(255,255,255,.14);

    color:#ffffff;

    cursor:pointer;

    font-size:17px;

    transition:
        background .18s ease,
        transform .18s ease,
        border-color .18s ease;
}

.project-access-close:hover{
    background:rgba(255,255,255,.24);

    border-color:rgba(255,255,255,.55);

    transform:translateY(-1px);
}

/* =========================================================
   PROJECT INFORMATION
========================================================= */

.project-access-project{
    margin:26px 30px 20px;

    padding:19px 20px;

    border:1px solid #d8e8ff;

    border-radius:16px;

    background:
        linear-gradient(
            135deg,
            #eff7ff 0%,
            #f4f1ff 100%
        );

    box-shadow:
        0 5px 18px rgba(30,80,150,.05);
}

.project-access-project-label{
    display:block;

    margin-bottom:7px;

    color:#6280a5;

    font-size:10px;
    font-weight:800;

    letter-spacing:.13em;
    text-transform:uppercase;
}

.project-access-project-name{
    color:#082f63;

    font-size:18px;
    line-height:1.35;

    font-weight:800;

    word-break:break-word;
}

/* =========================================================
   FORM FIELD
========================================================= */

.project-access-field{
    margin:0 30px 20px;
}

.project-access-field label{
    display:block;

    margin-bottom:8px;

    color:#173b68;

    font-size:13px;
    font-weight:700;
}

.project-access-field select,
.project-access-value{
    width:100%;

    min-height:48px;

    box-sizing:border-box;

    border:1px solid #cddcf0;

    border-radius:12px;

    background:#ffffff;

    padding:0 14px;

    color:#123b6b;

    font-family:Inter,Arial,sans-serif;

    font-size:14px;
    font-weight:500;

    outline:none;

    transition:
        border-color .18s ease,
        box-shadow .18s ease,
        background .18s ease;
}

.project-access-field select{
    cursor:pointer;

    appearance:auto;
}

.project-access-field select:hover{
    border-color:#a9c4e8;
}

.project-access-field select:focus{
    border-color:#1685ef;

    box-shadow:
        0 0 0 4px rgba(22,133,239,.10);
}

/* =========================================================
   RESULT CARD
========================================================= */

.project-access-result{
    display:none;

    margin:4px 30px 0;

    padding:18px;

    border:1px solid #bce9d5;

    border-radius:17px;

    background:
        linear-gradient(
            145deg,
            #effcf6 0%,
            #f4fbff 100%
        );

    box-shadow:
        0 8px 24px rgba(22,120,85,.06);
}

.project-access-result.show{
    display:block;
}

/* =========================================================
   RESULT ROW
========================================================= */

.project-access-result-row{
    margin-bottom:12px;

    padding:14px 15px;

    border:1px solid rgba(180,221,205,.78);

    border-radius:12px;

    background:rgba(255,255,255,.72);

    box-sizing:border-box;
}

.project-access-result-row:last-child{
    margin-bottom:0;
}

.project-access-result-label{
    display:block;

    margin-bottom:7px;

    color:#648474;

    font-size:10px;
    font-weight:800;

    letter-spacing:.13em;
    text-transform:uppercase;
}

.project-access-result-value{
    color:#063d2b;

    font-size:15px;
    line-height:1.45;

    font-weight:800;

    word-break:break-all;

    font-family:
        "SFMono-Regular",
        Consolas,
        "Liberation Mono",
        Menlo,
        monospace;

    text-shadow:none;
}

/* =========================================================
   ACTION BUTTONS
========================================================= */

.project-access-actions{
    display:flex;

    justify-content:flex-end;

    gap:10px;

    margin:24px 30px 28px;
}

.project-access-btn{
    min-height:46px;

    padding:0 20px;

    border:1px solid #d1ddeb;

    border-radius:12px;

    background:#ffffff;

    color:#29486f;

    font-family:Inter,Arial,sans-serif;

    font-size:13px;
    font-weight:700;

    cursor:pointer;

    transition:
        transform .18s ease,
        box-shadow .18s ease,
        border-color .18s ease,
        background .18s ease;
}

.project-access-btn:hover{
    border-color:#b7c8df;

    background:#f8fbff;

    transform:translateY(-1px);
}

.project-access-btn.primary{
    border-color:#087ff5;

    background:
        linear-gradient(
            135deg,
            #087ff5,
            #315ee8
        );

    color:#ffffff;

    box-shadow:
        0 8px 20px rgba(8,127,245,.22);
}

.project-access-btn.primary:hover{
    border-color:#087ff5;

    background:
        linear-gradient(
            135deg,
            #0674e5,
            #294fd8
        );

    box-shadow:
        0 10px 25px rgba(8,127,245,.28);

    transform:translateY(-1px);
}

.project-access-btn:disabled{
    opacity:.55;

    cursor:not-allowed;

    transform:none;
}

/* =========================================================
   MOBILE
========================================================= */

@media(max-width:600px){

    #projectAccessModal{
        padding:12px;
    }

    .project-access-dialog{
        max-height:calc(100vh - 24px);

        border-radius:20px;
    }

    .project-access-header{
        padding:24px 20px 22px;
    }

    .project-access-title{
        font-size:23px;
    }

    .project-access-project{
        margin:20px 20px 18px;
    }

    .project-access-field{
        margin-left:20px;
        margin-right:20px;
    }

    .project-access-result{
        margin-left:20px;
        margin-right:20px;
    }

    .project-access-actions{
        margin-left:20px;
        margin-right:20px;
        margin-bottom:22px;

        flex-direction:column-reverse;
    }

    .project-access-btn{
        width:100%;
    }
}

        `;


        document.head.appendChild(
            style
        );

    }


    /* ======================================================
       CREATE MODAL
    ====================================================== */

    function ensureAccessModal() {

        let modal =
            document.getElementById(
                "projectAccessModal"
            );


        if (modal) {

            return modal;

        }


        ensureAccessModalStyle();


        modal =
            document.createElement(
                "div"
            );


        modal.id =
            "projectAccessModal";


        modal.innerHTML = `

            <div
                class="project-access-backdrop"
                data-access-close
            ></div>

            <div
                class="project-access-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="projectAccessTitle"
            >

                <div class="project-access-header">

                    <div>

                        <span
                            class="project-access-eyebrow"
                        >
                            PROJECT ACCESS
                        </span>

                        <h3
                            id="projectAccessTitle"
                            class="project-access-title"
                        >
                            Generate Credentials
                        </h3>

                        <p
                            class="project-access-subtitle"
                        >
                            Buat username dan password
                            untuk akses client pada project ini.
                        </p>

                    </div>

                    <button
                        type="button"
                        class="project-access-close"
                        data-access-close
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                <div
                    class="project-access-project"
                >

                    <span
                        class="project-access-project-label"
                    >
                        Project
                    </span>

                    <div
                        id="projectAccessProjectName"
                        class="project-access-project-name"
                    >
                        -
                    </div>

                </div>


                <div class="project-access-field">

                    <label
                        for="projectAccessRole"
                    >
                        Account Role
                    </label>

                    <select
                        id="projectAccessRole"
                    ></select>

                </div>


                <div
                    id="projectAccessExisting"
                    class="project-access-result"
                >

                    <div
                        class="project-access-result-row"
                    >

                        <span
                            class="project-access-result-label"
                        >
                            Role
                        </span>

                        <div
                            id="projectAccessExistingRole"
                            class="project-access-result-value"
                        >
                            -
                        </div>

                    </div>

                    <div
                        class="project-access-result-row"
                    >

                        <span
                            class="project-access-result-label"
                        >
                            Username
                        </span>

                        <div
                            id="projectAccessExistingUsername"
                            class="project-access-result-value"
                        >
                            -
                        </div>

                    </div>

                    <div
                        class="project-access-result-row"
                    >

                        <span
                            class="project-access-result-label"
                        >
                            Password
                        </span>

                        <div
                            id="projectAccessExistingPassword"
                            class="project-access-result-value"
                        >
                            -
                        </div>

                    </div>

                </div>


                <div
                    id="projectAccessGenerated"
                    class="project-access-result"
                >

                    <div
                        class="project-access-result-row"
                    >

                        <span
                            class="project-access-result-label"
                        >
                            Role
                        </span>

                        <div
                            id="projectAccessGeneratedRole"
                            class="project-access-result-value"
                        >
                            -
                        </div>

                    </div>

                    <div
                        class="project-access-result-row"
                    >

                        <span
                            class="project-access-result-label"
                        >
                            Username
                        </span>

                        <div
                            id="projectAccessGeneratedUsername"
                            class="project-access-result-value"
                        >
                            -
                        </div>

                    </div>

                    <div
                        class="project-access-result-row"
                    >

                        <span
                            class="project-access-result-label"
                        >
                            Password
                        </span>

                        <div
                            id="projectAccessGeneratedPassword"
                            class="project-access-result-value"
                        >
                            -
                        </div>

                    </div>

                </div>


                <div class="project-access-actions">

                    <button
                        type="button"
                        class="project-access-btn"
                        data-access-close
                    >
                        Tutup
                    </button>

                    <button
                        type="button"
                        id="projectAccessGenerateBtn"
                        class="project-access-btn primary"
                    >
                        <i class="fa-solid fa-key"></i>
                        Generate Credentials
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target.closest(
                        "[data-access-close]"
                    )
                ) {

                    closeAccessModal();

                }

            }
        );


        return modal;

    }


    /* ======================================================
       CLOSE MODAL
    ====================================================== */

    function closeAccessModal() {

        const modal =
            document.getElementById(
                "projectAccessModal"
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "show"
        );


        document.body.style.overflow =
            "";

    }


    /* ======================================================
       SHOW CURRENT ACCESS
    ====================================================== */

    function renderExistingAccess(
        project
    ) {

        const box =
            document.getElementById(
                "projectAccessExisting"
            );


        if (!box) {
            return;
        }


        const access =
            project &&
            project.access;


        if (
            !access ||
            !access.username
        ) {

            box.classList.remove(
                "show"
            );

            return;

        }


        const existingRole =
    document.getElementById(
        "projectAccessExistingRole"
    );

if (existingRole) {

    let icon = "fa-user";

    if (
        access.role &&
        access.role
            .toLowerCase()
            .includes("administrator")
    ) {

        icon = "fa-user-shield";

    }

    existingRole.innerHTML =
        `<i class="fa-solid ${icon}"></i>` +
        `<span>${accessEscapeHtml(
            access.role || "-"
        )}</span>`;

}

        document.getElementById(
            "projectAccessExistingUsername"
        ).textContent =
            access.username ||
            "-";


        document.getElementById(
            "projectAccessExistingPassword"
        ).textContent =
            access.password ||
            "-";


        box.classList.add(
            "show"
        );

    }


    /* ======================================================
       SHOW MODAL
    ====================================================== */

    function openAccessModal(
        project
    ) {

        const modal =
            ensureAccessModal();


        const roles =
            loadClientRoles();


        const roleSelect =
            document.getElementById(
                "projectAccessRole"
            );


        const projectName =
            getProjectAccessName(
                project
            );


        document.getElementById(
            "projectAccessProjectName"
        ).textContent =
            projectName;


        roleSelect.innerHTML =
            roles.map(
                function (role) {

                    return `

                        <option
                            value="${accessEscapeHtml(role.id)}"
                        >
                            ${accessEscapeHtml(role.name)}
                        </option>

                    `;

                }
            ).join("");


        /*
           Default:
           Client Administrator
        */

        const clientAdmin =
            roles.find(
                function (role) {

                    return (
                        role.name ===
                        "Client Administrator"
                    );

                }
            );


        if (clientAdmin) {

            roleSelect.value =
                clientAdmin.id;

        }

// ======================================================
// UPDATE ROLE SAAT ACCOUNT ROLE DIGANTI
// ======================================================

roleSelect.onchange = function () {

    const selectedRole =
        roles.find(
            function (item) {

                return String(item.id) ===
                    String(roleSelect.value);

            }
        );


    if (!selectedRole) {
        return;
    }


    /*
       Tentukan icon berdasarkan nama role.
    */

    let roleIcon = "👤";


    if (
        selectedRole.name
            .toLowerCase()
            .includes("administrator")
    ) {

        roleIcon = "🛡️";

    }
    else if (
        selectedRole.name
            .toLowerCase()
            .includes("user")
    ) {

        roleIcon = "👤";

    }


    /*
       Update ROLE pada credential yang sedang tampil.
    */

    const existingRole =
        document.getElementById(
            "projectAccessExistingRole"
        );


    if (existingRole) {

        let icon = "fa-user";

if (
    selectedRole.name
        .toLowerCase()
        .includes("administrator")
) {

    icon = "fa-user-shield";

}

existingRole.innerHTML =
    `<i class="fa-solid ${icon}"></i>` +
    `<span>${accessEscapeHtml(
        selectedRole.name
    )}</span>`;

    }


    /*
       Update hasil generate jika element
       tersebut masih ada di HTML.
    */

    const generatedRole =
        document.getElementById(
            "projectAccessGeneratedRole"
        );


    if (generatedRole) {

        generatedRole.textContent =
            roleIcon + " " +
            selectedRole.name;

    }

};

        /*
           Reset hasil generate.
        */

        const generated =
            document.getElementById(
                "projectAccessGenerated"
            );


        if (generated) {

            generated.classList.remove(
                "show"
            );

        }


        renderExistingAccess(
            project
        );


        modal.classList.add(
            "show"
        );


        document.body.style.overflow =
            "hidden";

    }


    /* ======================================================
       GENERATE
    ====================================================== */

    function generateAccessForProject(
        projectId
    ) {

        const projects =
            loadProjects();


        const project =
            projects.find(
                function (item) {

                    return String(
                        item.id
                    ) === String(
                        projectId
                    );

                }
            );


        if (!project) {

            alert(
                "Project tidak ditemukan."
            );

            return;

        }


        const roleSelect =
            document.getElementById(
                "projectAccessRole"
            );


        if (!roleSelect) {
            return;
        }


        const roles =
            loadClientRoles();


        const role =
            roles.find(
                function (item) {

                    return String(
                        item.id
                    ) === String(
                        roleSelect.value
                    );

                }
            );


        if (!role) {

            alert(
                "Role client tidak ditemukan."
            );

            return;

        }


        /*
           Jangan menimpa credential lama
           tanpa konfirmasi.
        */

        if (
            project.access &&
            project.access.username
        ) {

            const confirmed =
                confirm(
                    "Project ini sudah memiliki username & password.\n\n" +
                    "Apakah Anda ingin membuat credential baru dan mengganti credential lama?"
                );


            if (!confirmed) {

                return;

            }

        }


        const username =
            generateUniqueUsername(
                project,
                role,
                projects
            );


        const password =
            generateSecurePassword();


        /*
           SIMPAN ACCESS
        */

        project.access = {

            username:
                username,

            password:
                password,

            role:
                role.name,

            roleId:
                role.id,

            projectId:
                project.id,

            generatedAt:
                new Date().toISOString()

        };


        /*
           SIMPAN PROJECT
        */

        localStorage.setItem(
            PROJECT_STORAGE_KEY,
            JSON.stringify(
                projects
            )
        );


        /*
           Update global projects jika
           variable tersedia.
        */

        if (
            typeof window.projects !==
            "undefined"
        ) {

            window.projects =
                projects;

        }


        /*
   Sembunyikan hasil generate sementara.
   Credential akan ditampilkan melalui
   Current Access agar tidak terjadi duplikasi.
*/

const generated =
    document.getElementById(
        "projectAccessGenerated"
    );

if (generated) {

    generated.classList.remove(
        "show"
    );

}


        /*
           Current access di-refresh.
        */

        renderExistingAccess(
            project
        );


        /*
           Refresh tabel tanpa
           mengganggu halaman.
        */

        if (
            typeof renderProjects ===
            "function"
        ) {

            renderProjects(
                projects
            );

        }


        /*
           Pastikan modal tetap terbuka
           setelah tabel dirender.
        */

        setTimeout(
            function () {

                const modal =
                    document.getElementById(
                        "projectAccessModal"
                    );


                if (modal) {

                    modal.classList.add(
                        "show"
                    );

                }

            },
            0
        );


        console.log(
            "TalentScope Project Access generated:",
            {
                projectId:
                    project.id,

                role:
                    role.name,

                username:
                    username
            }
        );

    }


    /* ======================================================
       PUBLIC FUNCTION
       Dipanggil oleh tombol KEY
    ====================================================== */

    window.generateProjectAccess =
        function (projectId) {

            const projects =
                loadProjects();


            const project =
                projects.find(
                    function (item) {

                        return String(
                            item.id
                        ) === String(
                            projectId
                        );

                    }
                );


            if (!project) {

                alert(
                    "Project tidak ditemukan."
                );

                return;

            }


            openAccessModal(
                project
            );


            const generateButton =
                document.getElementById(
                    "projectAccessGenerateBtn"
                );


            if (
                generateButton &&
                !generateButton.dataset.bound
            ) {

                generateButton.dataset.bound =
                    "true";


                generateButton.addEventListener(
                    "click",
                    function () {

                        generateAccessForProject(
                            project.id
                        );

                    }
                );

            }

        };


    /* ======================================================
       ESC CLOSE
    ====================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeAccessModal();

            }

        }
    );


})();