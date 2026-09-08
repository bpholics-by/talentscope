/* =========================================================
   TALENTSCOPE PROJECT DETAIL DATA
   SOURCE: SUPABASE
   FIX: DIRECT UI RENDER FROM SUPABASE DATA
========================================================= */

(function () {

    "use strict";


    console.log(
        "[PROJECT DETAIL] Module starting..."
    );


    /* =====================================================
       HELPERS
    ===================================================== */

    function getElement(id) {

        return document.getElementById(id);

    }


    function setText(id, value) {

    const element =
        getElement(id);

    // Jika element tidak ada di HTML,
    // lewati tanpa menampilkan warning di console.
    if (!element) {

        return;

    }

    element.textContent =
        value === undefined ||
        value === null ||
        String(value).trim() === ""
            ? "-"
            : String(value);

}

    function escapeHTML(value) {

        return String(
            value === undefined ||
            value === null
                ? ""
                : value
        )
        .replace(
            /[&<>"']/g,
            function (character) {

                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"

                }[character];

            }
        );

    }


    /* =====================================================
       PREMIUM ASSESSMENT PACKAGE (UNIFIED RENDERER)
    ===================================================== */
    function normalizeAssessment(assessment, index) {
        const item = (assessment && typeof assessment === "object") ? assessment : {};
        return {
            id: item.id || item.assessment_id || item.uuid || "",
            name: typeof assessment === "string" ? assessment : (item.assessment_name || item.name || item.code || "Assessment instrument"),
            category: item.category || item.type || "Assessment instrument",
            duration: item.duration || item.duration_minutes || item.estimated_duration || "",
            schedule: item.schedule_date || item.schedule || "",
            status: item.status || "Active",
            index: index + 1
        };
    }

    function renderAssessmentPackage(assessmentList, assessments) {
        if (!assessmentList) return;
        const list = Array.isArray(assessments) ? assessments : [];
        if (!list.length) {
            assessmentList.innerHTML = `<div class="assessment-empty-state"><div class="assessment-empty-icon"><i class="fa-regular fa-clipboard"></i></div><div><strong>No assessment selected</strong><span>This project does not have an assessment package yet.</span></div></div>`;
            return;
        }
        assessmentList.innerHTML = `<div class="assessment-package-grid">${list.map(function (assessment, index) {
            const a = normalizeAssessment(assessment, index);
            const safeId = String(a.id).replace(/'/g, "\\'");
            const hasId = !!a.id;
            const statusClass = String(a.status).toLowerCase() === "active" ? "is-active" : "is-neutral";
            return `<article class="assessment-premium-card" data-assessment-id="${escapeHTML(a.id)}"><div class="assessment-card-main"><div class="assessment-number">${String(a.index).padStart(2, "0")}</div><div class="assessment-card-content"><div class="assessment-title-row"><h3>${escapeHTML(a.name)}</h3><span class="assessment-status ${statusClass}"><span class="status-dot"></span>${escapeHTML(a.status)}</span></div><p class="assessment-category"><i class="fa-regular fa-folder-open"></i>${escapeHTML(a.category)}</p><div class="assessment-meta-row">${a.duration !== "" ? `<span><i class="fa-regular fa-clock"></i>${escapeHTML(a.duration)} min</span>` : ""}${a.schedule ? `<span><i class="fa-regular fa-calendar"></i>${escapeHTML(String(a.schedule).replace("T", " ").slice(0, 16))}</span>` : ""}</div></div></div></article>`;
        }).join("")}</div>`;
    }

    window.renderAssessmentPackage = renderAssessmentPackage;


    function formatDate(value) {

        if (!value) {

            return "-";

        }


        const date =
            new Date(
                String(value).length === 10
                    ? value + "T00:00:00"
                    : value
            );


        if (isNaN(date.getTime())) {

            return String(value);

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


    function normalizeProject(project) {

        if (!project) {

            return null;

        }


        /*
         * Supabase menggunakan snake_case.
         * UI lama menggunakan beberapa nama field berbeda.
         *
         * Kita normalisasi di SATU tempat.
         */

        const normalized = {

            ...project,

            id:
                project.id,

            project_code:
                project.project_code ||
                project.projectCode ||
                "",

            name:
                project.name ||
                project.project_name ||
                project.projectName ||
                "",

            company:
                project.company ||
                project.client ||
                "",

            type:
                project.project_type ||
                project.type ||
                project.projectType ||
                "",

            start:
                project.start_date ||
                project.start ||
                "",

            end:
                project.end_date ||
                project.end ||
                "",

            participants:
                Array.isArray(
                    project.participants
                )
                    ? project.participants
                    : [],

            assessments:
                Array.isArray(
                    project.assessments
                )
                    ? project.assessments
                    : []

        };


        /*
         * Kalau assessments tidak berada
         * langsung pada project, coba ambil
         * dari raw_data.
         */

        if (
            normalized.assessments.length === 0 &&
            project.raw_data &&
            Array.isArray(
                project.raw_data.assessments
            )
        ) {

            normalized.assessments =
                project.raw_data.assessments;

        }


        return normalized;

    }


    /* =====================================================
       UUID VALIDATION
    ===================================================== */

    function isUUID(value) {

        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            .test(
                String(value || "")
            );

    }


    /* =====================================================
       WAIT FOR DATASERVICE
    ===================================================== */

    async function waitForDataService() {

        let attempts = 0;

        const maxAttempts = 100;


        while (
            typeof DataService === "undefined" &&
            attempts < maxAttempts
        ) {

            await new Promise(
                function (resolve) {

                    setTimeout(
                        resolve,
                        100
                    );

                }
            );


            attempts++;

        }


        return (
            typeof DataService !== "undefined"
        );

    }


    /* =====================================================
       RENDER PROJECT DIRECTLY TO UI
    ===================================================== */

    function renderProjectToUI(project) {

        const p =
            normalizeProject(
                project
            );


        if (!p) {

            console.error(
                "[PROJECT DETAIL] Cannot render empty project"
            );

            return;

        }


        console.log(
            "[PROJECT DETAIL] Rendering project to UI:",
            p
        );


        /* =================================================
           PAGE TITLE
        ================================================= */

        document.title =
            (
                p.name ||
                "Project Detail"
            ) +
            " | TalentScope";


        /* =================================================
   DISPLAY PROJECT DATA
================================================= */

const displayProjectName =
    p.name ||
    p.project_name ||
    "Untitled Project";


const displayProjectCode =
    p.project_code ||
    (
        p.id
            ? "PRJ-" +
              p.id
                .substring(0, 8)
                .toUpperCase()
            : "-"
    );


/* =================================================
   HERO
================================================= */

setText(
    "projectNameHeader",
    displayProjectName
);


setText(
    "projectIdHeader",
    displayProjectCode
);


/* =================================================
   COMPANY
================================================= */

setText(
    "companyName",
    p.company || "-"
);


/* =================================================
   PROJECT OVERVIEW
================================================= */

/* PROJECT ID */

setText(
    "projectId",
    displayProjectCode
);


/* PROJECT TYPE */

setText(
    "projectType",
    p.type ||
    p.project_type ||
    "-"
);


/* SCHEDULE */

const overviewStart =
    p.start ||
    p.start_date ||
    null;


const overviewEnd =
    p.end ||
    p.end_date ||
    null;


let overviewSchedule = "-";


if (
    overviewStart &&
    overviewEnd
) {

    overviewSchedule =
        formatDate(overviewStart) +
        " - " +
        formatDate(overviewEnd);

}

else if (overviewStart) {

    overviewSchedule =
        formatDate(overviewStart);

}


setText(
    "schedule",
    overviewSchedule
);


/* PARTICIPANTS */

const overviewParticipantCount =
    Array.isArray(p.participants)

        ? p.participants.length

        : (
            p.participant_count ||
            0
        );


setText(
    "participantCount",
    overviewParticipantCount
);


/* LAST UPDATED */

const overviewUpdatedAt =
    p.updated_at ||
    p.created_at ||
    null;


setText(
    "updatedAt",

    overviewUpdatedAt

        ? formatDate(overviewUpdatedAt)

        : "-"
);


/* =================================================
   STATUS
================================================= */

        /* =================================================
           PROGRESS
        ================================================= */

        const participants =
            Array.isArray(
                p.participants
            )
                ? p.participants
                : [];


        const notStarted =
            participants.filter(
                function (item) {

                    return (
                        String(
                            item.status || ""
                        ).toLowerCase()
                        === "not started"
                    );

                }
            ).length;


        const inProgress =
            participants.filter(
                function (item) {

                    return (
                        String(
                            item.status || ""
                        ).toLowerCase()
                        === "in progress"
                    );

                }
            ).length;


        const completed =
            participants.filter(
                function (item) {

                    return (
                        String(
                            item.status || ""
                        ).toLowerCase()
                        === "completed"
                    );

                }
            ).length;


        const completion =
            participants.length > 0

                ? Math.round(
                    (
                        completed /
                        participants.length
                    ) *
                    100
                )

                : 0;


        setText(
            "notStarted",
            notStarted
        );


        setText(
            "inProgress",
            inProgress
        );


        setText(
            "completed",
            completed
        );


        setText(
            "progressPercent",
            completion + "%"
        );


        setText(
            "progressText",
            completion + "%"
        );


        const progressBar =
            getElement(
                "progressBar"
            );


        if (progressBar) {

            progressBar.style.width =
                completion + "%";

        }


        /* =================================================
           SCHEDULE DETAIL
        ================================================= */

        setText(
            "startDate",
            formatDate(
                p.start
            )
        );


        setText(
            "endDate",
            formatDate(
                p.end
            )
        );


        let duration = "-";


        if (
            p.start &&
            p.end
        ) {

            const start =
                new Date(
                    p.start +
                    "T00:00:00"
                );


            const end =
                new Date(
                    p.end +
                    "T00:00:00"
                );


            if (
                !isNaN(
                    start.getTime()
                ) &&
                !isNaN(
                    end.getTime()
                )
            ) {

                const days =
                    Math.max(
                        1,
                        Math.round(
                            (
                                end -
                                start
                            ) /
                            86400000
                        ) + 1
                    );


                duration =
                    days +
                    " day" +
                    (
                        days > 1
                            ? "s"
                            : ""
                    );

            }

        }


        setText(
            "duration",
            duration
        );


        setText(
            "scheduleTimezone",
            p.timezoneLabel ||
            p.timezone ||
            "Asia/Jakarta (WIB)"
        );


        setText(
            "scheduleMode",
            p.mode ||
            "Online"
        );


        /* =================================================
           ASSESSMENT LIST — unified premium renderer
        ================================================= */
        const assessmentList = getElement("assessmentList");
        if (assessmentList) {
            const assessments = Array.isArray(p.assessments) ? p.assessments : [];
            renderAssessmentPackage(assessmentList, assessments);
        }

        /* =================================================
           PARTICIPANT TABLE
        ================================================= */

        const participantTable =
            getElement(
                "participantTable"
            );


        if (participantTable) {

            if (
                participants.length === 0
            ) {

                participantTable.innerHTML = `
                    <tr>
                        <td
                            colspan="8"
                            style="
                                text-align:center;
                                padding:20px;
                                color:var(--muted);
                            "
                        >
                            Belum ada peserta terdaftar.
                        </td>
                    </tr>
                `;

            } else {

                participantTable.innerHTML =
                    participants
                        .map(
                            function (
                                participant
                            ) {

                                const participantId =
                                    participant.id || "";

                                const participantCode =
                                    participant.participant_code ||
                                    participant.code ||
                                    participantId ||
                                    "-";

                                return `
                                    <tr>

                                        <td>
                                            <input
                                                type="checkbox"
                                                class="participant-select"
                                                value="${escapeHTML(participantId)}"
                                                data-participant-id="${escapeHTML(participantId)}"
                                            >
                                        </td>

                                        <td>
                                            <strong>
                                                ${escapeHTML(participantCode)}
                                            </strong>
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                participant.name || "-"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                participant.email || "-"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                participant.position || "-"
                                            )}
                                        </td>

                                        <td>
                                            <span class="pill gray">
                                                ${escapeHTML(
                                                    participant.status ||
                                                    "Not Started"
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                participant.access ||
                                                "Not Granted"
                                            )}
                                        </td>

                                        <td>

    <button
        type="button"
        class="btn participant-edit-btn"
        data-participant-id="${escapeHTML(participantId)}"
        style="
            padding:7px 12px;
            margin-right:6px;
        "
    >
        Edit
    </button>


    <button
        type="button"
        class="btn participant-remove-btn"
        data-participant-id="${escapeHTML(participantId)}"
        style="
            padding:7px 12px;
            border-color:#e0a5a5;
            color:#a33;
            background:#fff;
        "
    >
        Remove
    </button>

</td>

                                    </tr>
                                `;

                            }
                        )
                        .join("");

            }

        }

/* =================================================
   PARTICIPANT ACTION BUTTONS
================================================= */

participantTable
    .querySelectorAll(
        ".participant-edit-btn"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const participantId =
                        button.dataset.participantId;


                    openParticipantEdit(
                        participantId
                    );

                }
            );

        }
    );


participantTable
    .querySelectorAll(
        ".participant-remove-btn"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const participantId =
                        button.dataset.participantId;


                    removeProjectParticipant(
                        participantId
                    );

                }
            );

        }
    );

        /* =================================================
           STORE GLOBAL DATA
        ================================================= */

        window.currentProject =
            p;


        /*
         * Penting:
         * window.project digunakan oleh beberapa
         * kontrol lama di project-detail.html.
         */

        window.project =
            p;

if (
    typeof window.renderProjectActions ===
    "function"
) {

    window.renderProjectActions();

}
        /*
         * Beritahu script lain bahwa data
         * Supabase sudah siap.
         */

        window.dispatchEvent(
            new CustomEvent(
                "projectLoaded",
                {
                    detail: p
                }
            )
        );


        console.log(
            "[PROJECT DETAIL] UI render completed"
        );

    }

    /* =====================================================
   PARTICIPANT ACTIONS
===================================================== */


function openParticipantEdit(
    participantId
) {

    const project =
        window.currentProject;


    if (!project) {

        console.error(
            "[PROJECT DETAIL] Project data not available"
        );

        return;

    }


    const participant =
        (project.participants || [])
        .find(
            function (item) {

                return (
                    String(item.id) ===
                    String(participantId)
                );

            }
        );


    if (!participant) {

        alert(
            "Participant tidak ditemukan."
        );

        return;

    }


    const newName =
        prompt(
            "Participant Name",
            participant.name || ""
        );


    if (
        newName === null
    ) {

        return;

    }


    const newEmail =
        prompt(
            "Email Address",
            participant.email || ""
        );


    if (
        newEmail === null
    ) {

        return;

    }


    const newPosition =
        prompt(
            "Position",
            participant.position || ""
        );


    if (
        newPosition === null
    ) {

        return;

    }


    saveParticipantEdit(
        participantId,
        {
            name:
                newName.trim(),

            email:
                newEmail.trim(),

            position:
                newPosition.trim()
        }
    );

}

async function saveParticipantEdit(
    participantId,
    participantData
) {

    try {

        console.log(
            "[PROJECT DETAIL] Updating participant:",
            participantId
        );


        await DataService.updateParticipant(

            participantId,

            participantData

        );


        alert(
            "Participant berhasil diperbarui."
        );


        window.location.reload();


    } catch (error) {

        console.error(
            "[PROJECT DETAIL] Failed to update participant:",
            error
        );


        alert(
            "Gagal memperbarui participant."
        );

    }

}

async function removeProjectParticipant(
    participantId
) {

    try {

        const project =
            window.currentProject;


        if (!project) {

            alert(
                "Project tidak ditemukan."
            );

            return;

        }


        const participant =
            (project.participants || [])
            .find(
                function (item) {

                    return (
                        String(item.id) ===
                        String(participantId)
                    );

                }
            );


        const participantName =
            participant
                ? participant.name
                : "Participant";


        const confirmed =
            confirm(

                "Apakah Anda yakin ingin menghapus " +
                participantName +
                " dari project ini?"

            );


        if (!confirmed) {

            return;

        }


        console.log(
            "[PROJECT DETAIL] Removing participant:",
            {
                projectId:
                    project.id,

                participantId:
                    participantId
            }
        );


        await DataService.removeParticipantFromProject(

            project.id,

            participantId

        );


        alert(
            "Participant berhasil dihapus dari project."
        );


        window.location.reload();


    } catch (error) {

        console.error(
            "[PROJECT DETAIL] Failed to remove participant:",
            error
        );


        alert(
            "Gagal menghapus participant: " +
            (
                error.message ||
                "Unknown error"
            )
        );

    }

}

    /* =====================================================
       LOAD PROJECT
    ===================================================== */

    async function loadProject() {

        console.log(
            "[PROJECT DETAIL] Loading project..."
        );


        const params =
            new URLSearchParams(
                window.location.search
            );


        const projectId =
            params.get("id");


        console.log(
            "[PROJECT DETAIL] Project ID:",
            projectId
        );


        if (!projectId) {

            console.error(
                "[PROJECT DETAIL] Project ID not found in URL"
            );

            return;

        }


        /* =================================================
           WAIT DATASERVICE
        ================================================= */

        const serviceReady =
            await waitForDataService();


        if (!serviceReady) {

            console.error(
                "[PROJECT DETAIL] DataService not available"
            );

            return;

        }


        console.log(
            "[PROJECT DETAIL] DataService ready"
        );


        try {

            let project =
                null;


            /* =============================================
               UUID
            ============================================= */

            if (
                isUUID(
                    projectId
                )
            ) {

                console.log(
                    "[PROJECT DETAIL] ID detected as UUID"
                );


                project =
                    await DataService.getProjectById(
                        projectId
                    );

            }


            /* =============================================
               PROJECT CODE
            ============================================= */

            else {

                console.warn(
                    "[PROJECT DETAIL] ID detected as Project Code:",
                    projectId
                );


                project =
                    await DataService.getProjectByCode(
                        projectId
                    );

            }


            console.log(
                "[PROJECT DETAIL] Project loaded:",
                project
            );


            if (!project) {

                console.warn(
                    "[PROJECT DETAIL] Project not found"
                );

                return;

            }


            /* =============================================
               LOAD PROJECT PARTICIPANTS FROM SUPABASE
               IMPORTANT:
               participants are stored in project_participants,
               so they must be loaded separately before render.
            ============================================= */

            if (
                typeof DataService.getProjectParticipants ===
                "function"
            ) {

                console.log(
                    "[PROJECT DETAIL] Loading project participants..."
                );

                try {

                    const projectParticipantRelations =
                        await DataService.getProjectParticipants(
                            project.id
                        );


                    console.log(
                        "[PROJECT DETAIL] Project participants loaded:",
                        projectParticipantRelations
                    );


                    project.participants =
                        Array.isArray(
                            projectParticipantRelations
                        )
                            ? projectParticipantRelations
                                .map(
                                    function (relation) {

                                        const participant =
                                            relation.participant ||
                                            relation;


                                        if (!participant) {

                                            return null;

                                        }


                                        return {

                                            ...participant,

                                            // Keep the participant UUID as id so
                                            // existing selection/invitation/remove
                                            // functions continue to work.
                                            id:
                                                participant.id ||
                                                relation.participant_id ||
                                                relation.id ||
                                                "",

                                            participant_code:
                                                participant.participant_code ||
                                                relation.participant_code ||
                                                participant.code ||
                                                "",

                                            name:
                                                participant.name ||
                                                participant.full_name ||
                                                "-",

                                            email:
                                                participant.email ||
                                                "-",

                                            position:
                                                participant.position ||
                                                participant.job_title ||
                                                "-",

                                            status:
                                                relation.status ||
                                                participant.status ||
                                                "Not Started",

                                            access:
                                                relation.access ||
                                                relation.access_status ||
                                                participant.access ||
                                                "Not Granted"

                                        };

                                    }
                                )
                                .filter(Boolean)
                            : [];


                    console.log(
                        "[PROJECT DETAIL] Participants normalized:",
                        project.participants
                    );

                } catch (participantError) {

                    console.error(
                        "[PROJECT DETAIL] Failed to load project participants:",
                        participantError
                    );

                    // Keep project rendering functional even when
                    // participant loading has a separate problem.
                    project.participants =
                        Array.isArray(project.participants)
                            ? project.participants
                            : [];

                }

            }


            /* =============================================
               RENDER DIRECTLY
            ============================================= */

            renderProjectToUI(
                project
            );


            console.log(
                "[PROJECT DETAIL] Project ready"
            );


            /* =============================================
               LOAD ASSESSMENTS
            ============================================= */

            if (
                typeof DataService.getProjectAssessments ===
                "function"
            ) {

                console.log(
                    "[PROJECT DETAIL] Loading assessments..."
                );


                try {

                    const assessments =
                        await DataService.getProjectAssessments(
                            project.id
                        );


                    console.log(
                        "[PROJECT DETAIL] Assessments loaded:",
                        assessments
                    );


                    /*
                     * Kalau table project_assessments
                     * memiliki data, gunakan data tersebut.
                     */

                    if (
                        Array.isArray(
                            assessments
                        ) &&
                        assessments.length > 0
                    ) {

                        project.assessments =
                            assessments;


                        window.currentProject =
                            normalizeProject(
                                project
                            );


                        window.project =
                            window.currentProject;


                        /*
                         * Render assessment ulang
                         * tanpa mengganggu data project.
                         */

                        const assessmentList =
                            getElement(
                                "assessmentList"
                            );


                        if (assessmentList) {
                            renderAssessmentPackage(assessmentList, assessments);
                        }

                    }

                } catch (
                    assessmentError
                ) {

                    console.warn(
                        "[PROJECT DETAIL] Assessment load warning:",
                        assessmentError
                    );

                }

            }


        } catch (error) {

            console.error(
                "[PROJECT DETAIL] Failed to load project:",
                error
            );

        }

    }


    /* =====================================================
       DOM READY
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            loadProject
        );

    } else {

        loadProject();

    }


})();