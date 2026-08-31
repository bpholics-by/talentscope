/* ==========================================================
   TALENTSCOPE
   VIEW & MONITORING
   SOURCE:
   localStorage -> talentscope_projects
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeMonitoring();

    }
);


/* ==========================================================
   STORAGE KEY
========================================================== */

const MONITORING_STORAGE_KEY =
    "talentscope_projects";


/* ==========================================================
   STATE
========================================================== */

let monitoringProjects = [];

let selectedProject = null;

let selectedParticipant = null;


/* ==========================================================
   INITIALIZE
========================================================== */

function initializeMonitoring() {

    loadMonitoringProjects();

    renderMonitoringProjects();

    initializeSearch();

    initializeNavigation();

    initializeUserRole();

    initializeLogout();

    startLiveMonitoringRefresh();

}

/* ==========================================================
   LOAD PROJECTS
========================================================== */

function loadMonitoringProjects() {

    try {

        const raw =
            localStorage.getItem(
                MONITORING_STORAGE_KEY
            );

        if (!raw) {

            monitoringProjects = [];

            return;

        }


        const data =
            JSON.parse(raw);


        monitoringProjects =
            Array.isArray(data)
                ? data
                : [];

    }

    catch (error) {

        console.error(
            "TalentScope: gagal membaca project.",
            error
        );

        monitoringProjects = [];

    }

}

/* ==========================================================
   LIVE MONITORING REFRESH
   Membaca ulang data participant dari localStorage
   tanpa mengubah status secara paksa berdasarkan waktu.
========================================================== */

function startLiveMonitoringRefresh() {

    if (window.talentScopeMonitoringRefreshStarted) {
        return;
    }

    window.talentScopeMonitoringRefreshStarted = true;

    setInterval(function () {
        try {
            const raw = localStorage.getItem(MONITORING_STORAGE_KEY);
            if (!raw) {
                return;
            }

            const latestProjects = JSON.parse(raw);
            if (!Array.isArray(latestProjects)) {
                return;
            }

            monitoringProjects = latestProjects;

            if (selectedProject) {
                const selectedProjectId = getProjectId(selectedProject);

                const latestSelectedProject = monitoringProjects.find(
                    function (project) {
                        return getProjectId(project) === selectedProjectId;
                    }
                );

                if (latestSelectedProject) {
                    // HAPUS SEMUA LOGIKA AUTO-OFFLINE BERBASIS WAKTU (> 10 DETIK).
                    // Biarkan halaman admin murni merender data terbaru apa adanya
                    // berdasarkan aksi nyata peserta (Login / Tutup Tab / Logout).

                    selectedProject = latestSelectedProject;

                    /* ======================================================
   CEK PARTICIPANT YANG SUDAH DISCONNECT
====================================================== */

const latestParticipants =
    getParticipants(
        latestSelectedProject
    );


let hasAutomaticLogout =
    false;


/* ==========================================================
   CEK PESERTA YANG SUDAH TIDAK AKTIF
   DAN CATAT AUTOMATIC LOGOUT
========================================================== */

latestParticipants.forEach(
    function(participant) {

        const updated =
            recordAutomaticLogout(
                latestSelectedProject,
                participant
            );


        if (updated) {

            hasAutomaticLogout =
                true;

        }

    }
);


/* ==========================================================
   PENTING:
   JIKA ADA AUTOMATIC LOGOUT,
   SIMPAN PERUBAHAN KE LOCALSTORAGE

   Sebelumnya object participant berubah di memory,
   tetapi perubahan logout belum tentu tersimpan permanen.
========================================================== */

if (hasAutomaticLogout) {

    try {

        localStorage.setItem(
            MONITORING_STORAGE_KEY,
            JSON.stringify(monitoringProjects)
        );

        console.log(
            "[Monitoring] Automatic logout berhasil disimpan."
        );

    }
    catch (error) {

        console.error(
            "[Monitoring] Gagal menyimpan automatic logout:",
            error
        );

    }

}


/* ==========================================================
   RENDER ULANG TAMPILAN
========================================================== */

renderParticipants(
    latestSelectedProject
);


/* ======================================================
   UPDATE DETAIL PARTICIPANT YANG SEDANG DIBUKA
====================================================== */

if (selectedParticipant) {

    const selectedParticipantId =
        getParticipantId(
            selectedParticipant
        );


    const latestParticipant =
        getParticipants(
            latestSelectedProject
        ).find(
            function(participant) {

                return (
                    getParticipantId(
                        participant
                    ) === selectedParticipantId
                );

            }
        );


    if (latestParticipant) {

        selectedParticipant =
            latestParticipant;


        fillParticipantDetail(
            latestSelectedProject,
            latestParticipant
        );

    }

}
                }
            }
        }
        catch (error) {
            console.warn("Live monitoring refresh gagal:", error);
        }
    }, 3000);
}

/* ==========================================================
   HELPERS
========================================================== */

function getProjectId(project) {

    return String(
        project?.id ||
        project?.projectId ||
        project?.projectID ||
        ""
    );

}


function getProjectName(project) {

    return (
        project?.projectName ||
        project?.name ||
        project?.project ||
        "-"
    );

}


function getParticipants(project) {

    if (
        project &&
        Array.isArray(
            project.participants
        )
    ) {

        return project.participants;

    }

    return [];

}


function getParticipantName(participant) {

    return (
        participant?.name ||
        participant?.fullName ||
        participant?.participantName ||
        participant?.nama ||
        "-"
    );

}


function getParticipantId(participant) {

    return String(
        participant?.id ||
        participant?.participantId ||
        participant?.participantID ||
        ""
    );

}


function getClient(project) {

    return (
        project?.company ||
        project?.organization ||
        project?.client ||
        project?.clientName ||
        "-"
    );

}


function getPIC(project) {

    if (
        project?.pic &&
        typeof project.pic === "object"
    ) {

        return (
            project.pic.name ||
            project.pic.fullName ||
            "-"
        );

    }

    return (
        project?.pic ||
        project?.PIC ||
        "-"
    );

}


/* ==========================================================
   FORMAT DATE
========================================================== */

function formatMonitoringDate(value) {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {

        return "-";

    }


    const raw =
        String(value).trim();


    /*
       Jika sudah format
       DD Mon YYYY
    */

    if (
        /^[0-9]{2}\s[A-Za-z]{3}\s[0-9]{4}$/.test(
            raw
        )
    ) {

        return raw;

    }


    /*
       ISO DATE
    */

    const date =
        new Date(
            raw.includes("T")
                ? raw
                : raw + "T00:00:00"
        );


    if (isNaN(date.getTime())) {

        return raw;

    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day:"2-digit",
            month:"short",
            year:"numeric"
        }
    );

}


/* ==========================================================
   STATUS
========================================================== */

function getStatusClass(status) {

    const value =
        String(
            status || ""
        )
        .toLowerCase()
        .trim();


    if (
        value.includes("complete") ||
        value.includes("completed")
    ) {

        return "completed";

    }


    if (
        value.includes("ongoing") ||
        value.includes("running") ||
        value.includes("progress") ||
        value.includes("active")
    ) {

        return "ongoing";

    }


    if (
        value.includes("scheduled") ||
        value.includes("waiting")
    ) {

        return "scheduled";

    }


    if (
        value.includes("draft")
    ) {

        return "draft";

    }


    return "scheduled";

}


/* ==========================================================
   PROJECT STATUS
========================================================== */

function getProjectStatus(project) {

    return (
        project?.status ||
        project?.projectStatus ||
        "-"
    );

}


/* ==========================================================
   RENDER PROJECTS
========================================================== */

function renderMonitoringProjects(
    source
) {

    const table =
        document.getElementById(
            "projectMonitoringTable"
        );


    const count =
        document.getElementById(
            "projectCount"
        );


    if (!table) return;


    const data =
        Array.isArray(source)
            ? source
            : monitoringProjects;


    table.innerHTML = "";


    if (!data.length) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-state"
                >

                    <i class="fa-solid fa-chart-line"></i>

                    <p>
                        Belum ada project untuk ditampilkan.
                    </p>

                </td>

            </tr>

        `;


        if (count) {

            count.textContent =
                "Showing 0 results";

        }

        return;

    }


    data.forEach(
        function (project) {

            const projectId =
                getProjectId(project);


            const projectName =
                getProjectName(project);


            const participants =
                getParticipants(project);


            const status =
                getProjectStatus(project);


            const statusClass =
                getStatusClass(status);


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>

                    <div class="project-name">

                        ${escapeHTML(
                            projectName
                        )}

                    </div>

                    ${
                        projectId
                            ? `
                                <span class="project-id">
                                    ${escapeHTML(projectId)}
                                </span>
                              `
                            : ""
                    }

                </td>


                <td>

                    ${escapeHTML(
                        getClient(project)
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        formatMonitoringDate(
                            project.startDate ||
                            project.start ||
                            project.assessmentDate
                        )
                    )}

                </td>


                <td>

                    <span class="participant-count">

                        ${participants.length}

                    </span>

                </td>


                <td>

                    ${escapeHTML(
                        getPIC(project)
                    )}

                </td>


                <td>

                    <span
                        class="status ${statusClass}"
                    >

                        ${escapeHTML(
                            status
                        )}

                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="monitor-btn"
                        data-project-id="${escapeHTML(projectId)}"
                    >

                        <i class="fa-solid fa-chart-line"></i>

                        View & Monitoring

                    </button>

                </td>

            `;


            const button =
                row.querySelector(
                    ".monitor-btn"
                );


            if (button) {

                button.addEventListener(
                    "click",
                    function () {

                        openProjectMonitoring(
                            projectId
                        );

                    }
                );

            }


            table.appendChild(row);

        }
    );


    if (count) {

        count.textContent =
            "Showing " +
            data.length +
            " results";

    }

}


/* ==========================================================
   OPEN PROJECT
========================================================== */

function openProjectMonitoring(
    projectId
) {

    const project =
        monitoringProjects.find(
            function (item) {

                return (
                    getProjectId(item) ===
                    String(projectId)
                );

            }
        );


    if (!project) {

        alert(
            "Project tidak ditemukan."
        );

        return;

    }


    selectedProject =
        project;


    selectedParticipant =
        null;


    renderParticipants(
        project
    );


    const projectCard =
        document.querySelector(
            ".card:not(.detail-card):not(.participant-detail)"
        );


    if (projectCard) {

        projectCard.style.display =
            "none";

    }


    const participantCard =
        document.getElementById(
            "participantCard"
        );


    if (participantCard) {

        participantCard.classList.add(
            "show"
        );

    }


    const detailCard =
        document.getElementById(
            "participantDetailCard"
        );


    if (detailCard) {

        detailCard.classList.remove(
            "show"
        );

    }


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


/* ==========================================================
   RENDER PARTICIPANTS
========================================================== */

function renderParticipants(
    project
) {

    const table =
        document.getElementById(
            "participantMonitoringTable"
        );


    const count =
        document.getElementById(
            "participantCount"
        );


    const title =
        document.getElementById(
            "participantTitle"
        );


    if (!table) return;


    const participants =
        getParticipants(project);


    table.innerHTML = "";


    if (title) {

        title.textContent =
            "Participants - " +
            getProjectName(project);

    }


    if (!participants.length) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-state"
                >

                    <i class="fa-solid fa-users"></i>

                    <p>
                        Belum ada peserta dalam project ini.
                    </p>

                </td>

            </tr>

        `;


        if (count) {

            count.textContent =
                "Showing 0 results";

        }

        return;

    }


    participants.forEach(
        function (participant) {

            const participantId =
                getParticipantId(
                    participant
                );


            const participantName =
                getParticipantName(
                    participant
                );


            /*
               ==================================================
               STATUS ONLINE
               ==================================================
            */

            const isOnline =
    isParticipantOnline(
        participant
    );


            /*
               ==================================================
               AMBIL ACTIVITY
               ==================================================
            */

            const activityText =
                String(
                    participant?.currentActivity ||
                    participant?.activity ||
                    ""
                )
                .trim();


            const activityLower =
                activityText.toLowerCase();


            /*
               ==================================================
               CEK APAKAH SEDANG MENGERJAKAN TES
               ==================================================
            */

            const isDoingTest =
                activityText !== "" &&
                activityLower !== "online" &&
                (
                    activityLower.includes(
                        "mengerjakan"
                    ) ||
                    activityLower.includes(
                        "assessment"
                    ) ||
                    activityLower.includes(
                        "test"
                    ) ||
                    activityLower.includes(
                        "tes"
                    )
                );


            /*
               ==================================================
               TEXT STATUS
               ==================================================
            */

            const statusTitle =
                isOnline
                    ? "Online"
                    : "Offline";


            const statusActivity =
    !isOnline

        ? "Peserta sedang offline"

        : isDoingTest

            ? activityText

            : "Tidak sedang mengerjakan tes";


            /*
               ==================================================
               CLASS DOT
               ==================================================
            */

            const statusClass =
                isOnline
                    ? "is-online"
                    : "is-offline";


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <!-- PROJECT -->

                <td>

                    <div class="project-name">

                        ${escapeHTML(
                            getProjectName(project)
                        )}

                    </div>

                </td>


                <!-- ASSESSMENT DATE -->

                <td>

                    ${escapeHTML(
                        formatMonitoringDate(
                            project.startDate ||
                            project.start ||
                            project.assessmentDate
                        )
                    )}

                </td>


                <!-- PARTICIPANT -->

                <td>

                    <div class="project-name">

                        ${escapeHTML(
                            participantName
                        )}

                    </div>


                    ${
                        participantId
                            ? `
                                <span class="project-id">
                                    ${escapeHTML(
                                        participantId
                                    )}
                                </span>
                              `
                            : ""
                    }

                </td>


                <!-- STATUS -->

                <td class="participant-status-cell">

                    <div
                        class="
                            participant-status
                            ${statusClass}
                        "
                    >

                        <div
                            class="participant-status-main"
                        >

                            <span
                                class="
                                    participant-status-dot
                                "
                            ></span>


                            <strong>
                                ${escapeHTML(
                                    statusTitle
                                )}
                            </strong>

                        </div>


                        <div
                            class="
                                participant-status-activity
                            "
                        >

                            ${escapeHTML(
                                statusActivity
                            )}

                        </div>

                    </div>

                </td>


                <!-- VIEW & MONITORING -->

                <td>

                    <button
                        type="button"
                        class="
                            monitor-btn
                            participant-monitor-btn
                        "
                    >

                        <i
                            class="fa-solid fa-user-clock"
                        ></i>

                        View & Monitoring

                    </button>

                </td>

            `;


            /*
               ==================================================
               BUTTON VIEW & MONITORING
               ==================================================
            */

            const button =
                row.querySelector(
                    ".participant-monitor-btn"
                );


            if (button) {

                button.addEventListener(
                    "click",
                    function () {

                        openParticipantMonitoring(
                            project,
                            participant
                        );

                    }
                );

            }


            table.appendChild(row);

        }
    );


    /*
       ==================================================
       RESULT COUNT
       ==================================================
    */

    if (count) {

        count.textContent =
            "Showing " +
            participants.length +
            " results";

    }

}


/* ==========================================================
   OPEN PARTICIPANT MONITORING
========================================================== */

function openParticipantMonitoring(
    project,
    participant
) {

    selectedProject =
        project;

    selectedParticipant =
        participant;


    const detailCard =
        document.getElementById(
            "participantDetailCard"
        );


    const participantCard =
        document.getElementById(
            "participantCard"
        );


    if (participantCard) {

        participantCard.classList.remove(
            "show"
        );

    }


    if (detailCard) {

        detailCard.classList.add(
            "show"
        );

    }


    fillParticipantDetail(
        project,
        participant
    );


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


/* ==========================================================
   PARTICIPANT DETAIL
========================================================== */

function fillParticipantDetail(
    project,
    participant
) {

    const name =
        getParticipantName(
            participant
        );


    const projectName =
        getProjectName(
            project
        );


    const assessmentDate =
        formatMonitoringDate(
            project.startDate ||
            project.start ||
            project.assessmentDate
        );


    /* ======================================================
       INVITATION
    ====================================================== */

    const invitation =
        participant?.invitationStatus ||
        participant?.statusInvitation ||
        participant?.invitation ||
        participant?.inviteStatus ||
        participant?.accessStatus ||
        "Belum diundang";


    /* ======================================================
       LOGIN
    ====================================================== */

    const login =
        participant?.loginTime ||
        participant?.loggedInAt ||
        participant?.loginAt ||
        participant?.timeLogin ||
        participant?.lastLogin ||
        "-";


    /* ======================================================
       LOGOUT
    ====================================================== */

    const logout =
        participant?.logoutTime ||
        participant?.loggedOutAt ||
        participant?.logoutAt ||
        participant?.timeLogout ||
        "-";


    /* ======================================================
       BASIC INFORMATION
    ====================================================== */

    setText(
        "detailParticipantName",
        name
    );


    setText(
        "detailName",
        name
    );


    setText(
        "detailProject",
        projectName
    );


    setText(
        "detailDate",
        assessmentDate
    );


    setText(
        "detailInvitation",
        invitation
    );


    setText(
        "detailLogin",
        formatDateTime(login)
    );


    setText(
        "detailLogout",
        formatDateTime(logout)
    );


    /* ======================================================
       ACTIVITY
    ====================================================== */

    renderParticipantActivity(
        participant
    );

}


/* ==========================================================
   ACTIVITY
========================================================== */

function getCurrentActivity(
    participant
) {

    /*
     * PRIORITAS 1
     * Activity yang memang disimpan oleh sistem test.
     */

    const directActivity =
        participant?.currentActivity ||
        participant?.activity ||
        participant?.currentTest ||
        participant?.testActivity ||
        participant?.kegiatan;


    if (
        directActivity &&
        String(directActivity).trim() !== ""
    ) {

        return String(
            directActivity
        );

    }


    /*
     * PRIORITAS 2
     * Cek status assessment peserta.
     */

    const status =
        String(
            participant?.assessmentStatus ||
            participant?.assessment_status ||
            participant?.testStatus ||
            participant?.status ||
            ""
        )
        .toLowerCase()
        .trim();


    if (
        status.includes("progress") ||
        status.includes("running") ||
        status.includes("active") ||
        status.includes("ongoing")
    ) {

        return "Sedang mengerjakan tes";

    }


    if (
        status.includes("complete") ||
        status.includes("completed") ||
        status.includes("finish") ||
        status.includes("finished")
    ) {

        return "Tes telah selesai";

    }


    if (
        status.includes("login") ||
        status.includes("logged")
    ) {

        return "Peserta sudah login";

    }


    return "Tidak sedang mengerjakan tes";

}


/* ==========================================================
   ACTIVITY HISTORY
========================================================== */

function getActivityHistory(
    participant
) {

    /*
     * Beberapa kemungkinan nama field
     * agar kompatibel dengan sistem yang
     * sudah ada.
     */

    const history =
        participant?.activityHistory ||
        participant?.activityLog ||
        participant?.activities ||
        participant?.history ||
        [];


    if (
        Array.isArray(history)
    ) {

        return history;

    }


    return [];

}


/* ==========================================================
   RENDER ACTIVITY
========================================================== */

function renderParticipantActivity(
    participant
) {

    if (!participant) {
        return;
    }


    const currentActivity =
        getCurrentActivity(
            participant
        );


    const activityHistory =
        getActivityHistory(
            participant
        );


    /* ======================================================
       CURRENT ACTIVITY
    ====================================================== */

    const currentBox =
        document.getElementById(
            "currentActivity"
        );

    if (currentBox) {

        const active =
            isParticipantActive(
                participant
            );

            const isOnline =
    isParticipantOnline(
        participant
    );

        const rawActivity =
            String(
                participant?.currentActivity ||
                participant?.activity ||
                participant?.testActivity ||
                participant?.lastActivity ||
                ""
            ).trim();

        const activityLower =
            rawActivity.toLowerCase();

        const isDoingTest =
            /^sedang\s+mengerjakan\s+tes\s*\(/i.test(rawActivity) ||
            activityLower.includes("mengerjakan tes") ||
            activityLower.includes("assessment") ||
            activityLower.includes("test") ||
            activityLower.includes("tes");

        const isLoggedIn =
            participant?.isLoggedIn === true ||
            participant?.isLoggedIn === "true";

        /* ======================================================
   TENTUKAN TAMPILAN ACTIVITY

   PRIORITAS:
   1. Completed
   2. Offline
   3. Sedang mengerjakan tes
   4. Online
====================================================== */

let displayActivity = "Offline";

let displaySubtext =
    "Peserta sedang tidak aktif";


/* ======================================================
   STATUS COMPLETED
====================================================== */

const participantStatus =
    String(
        participant?.status ||
        participant?.onlineStatus ||
        ""
    )
    .toLowerCase()
    .trim();


if (
    participantStatus === "completed" ||
    participantStatus === "complete"
) {

    displayActivity =
        "Assessment selesai";

    displaySubtext =
        "Peserta telah menyelesaikan assessment";


/* ======================================================
   OFFLINE

   PENTING:
   Walaupun currentActivity masih
   \"Sedang mengerjakan tes\",
   jika heartbeat mati tetap OFFLINE.
====================================================== */

} else if (!isOnline) {

    displayActivity =
        "Offline";

    displaySubtext =
        "Peserta tidak sedang terhubung";


/* ======================================================
   SEDANG MENGERJAKAN TES
====================================================== */

} else if (
    isOnline &&
    isDoingTest
) {

    displayActivity =
        rawActivity ||
        (
            participant?.currentTest
                ? "Sedang mengerjakan tes (" +
                  participant.currentTest +
                  ")"
                : "Sedang mengerjakan tes"
        );

    displaySubtext =
        "Sedang berlangsung";


/* ======================================================
   ONLINE
====================================================== */

} else if (
    isOnline &&
    isLoggedIn
) {

    displayActivity =
        "Online";

    displaySubtext =
        "Siap mengerjakan tes";

}
        currentBox.classList.toggle(
            "is-active",
            active
        );

        currentBox.innerHTML = `
            <div
                class="
        activity-status-dot
        ${isOnline ? '' : 'offline'}
    "
            ></div>

            <div class="activity-current-content">
                <strong>
                    ${escapeHTML(displayActivity)}
                </strong>

                <span>
                    ${escapeHTML(displaySubtext)}
                </span>
            </div>
        `;
    }

    /* ======================================================
       ACTIVITY HISTORY
    ====================================================== */

    const historyContainer =
        document.getElementById(
            "activityHistory"
        );


    if (!historyContainer) {
        return;
    }


    historyContainer.innerHTML = "";


    if (
        activityHistory.length === 0
    ) {

        historyContainer.innerHTML = `

            <div
                class="activity-empty"
            >

                Belum ada aktivitas.

            </div>

        `;

        return;

    }


    const sortedHistory =
        [...activityHistory]
            .sort(
                function(a, b) {

                    const dateA =
                        new Date(
                            a?.timestamp ||
                            a?.time ||
                            a?.createdAt ||
                            0
                        );

                    const dateB =
                        new Date(
                            b?.timestamp ||
                            b?.time ||
                            b?.createdAt ||
                            0
                        );

                    return (
                        dateB - dateA
                    );

                }
            );


    sortedHistory.forEach(
        function(item) {

            const title =
                item?.activity ||
                item?.title ||
                item?.action ||
                item?.test ||
                item?.name ||
                "Aktivitas tes";


            const description =
                item?.description ||
                item?.detail ||
                item?.message ||
                "";


            const time =
                item?.timestamp ||
                item?.time ||
                item?.createdAt ||
                item?.date ||
                "-";


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "activity-history-item";


            row.innerHTML = `

                <div
                    class="activity-history-marker"
                ></div>


                <div
                    class="activity-history-content"
                >

                    <strong>
                        ${escapeHTML(
                            title
                        )}
                    </strong>


                    ${
                        description
                            ? `
                                <span>
                                    ${escapeHTML(
                                        description
                                    )}
                                </span>
                              `
                            : ""
                    }

                </div>


                <div
                    class="activity-history-time"
                >

                    ${escapeHTML(
                        formatDateTime(time)
                    )}

                </div>

            `;


            historyContainer.appendChild(
                row
            );

        }
    );

}


/* ==========================================================
   PARTICIPANT ONLINE CHECK
   ONLINE = HEARTBEAT MASIH AKTIF
========================================================== */

function isParticipantOnline(
    participant
) {

    if (!participant) {
        return false;
    }


    /*
       Logout eksplisit = OFFLINE.
    */

    if (
        participant.isLoggedIn !== true
    ) {
        return false;
    }


    /*
       Online hanya jika heartbeat
       masih dalam batas waktu.
    */

    const lastSeen =
        participant.lastSeenAt ||
        participant.lastSeen ||
        "";


    if (!lastSeen) {
        return false;
    }


    const lastSeenTime =
        new Date(lastSeen).getTime();


    if (
        !Number.isFinite(
            lastSeenTime
        )
    ) {
        return false;
    }


    const ONLINE_TIMEOUT =
        30 * 1000;


    const age =
        Date.now() -
        lastSeenTime;


    return (
        age >= 0 &&
        age <= ONLINE_TIMEOUT
    );

}

/* ==========================================================
   AUTO LOGOUT RECORD
   Mencatat waktu logout jika participant disconnect
   karena close tab / close window / close browser.
========================================================== */

function recordAutomaticLogout(
    project,
    participant
) {

    if (!participant) {
        return false;
    }


    /* ======================================================
       JIKA SUDAH ADA WAKTU LOGOUT, JANGAN DIBUAT ULANG
    ====================================================== */

    const existingLogoutTime =
        participant.logoutTime ||
        participant.loggedOutAt ||
        participant.logoutAt ||
        participant.lastLogoutAt ||
        participant.lastLogout ||
        participant.waktuLogout ||
        null;


    if (existingLogoutTime) {
        return false;
    }


    /* ======================================================
       CEK APAKAH PESERTA PERNAH MEMILIKI AKTIVITAS LOGIN

       Jangan hanya mengandalkan isLoggedIn === true,
       karena bisa saja halaman peserta sudah mengubah
       status menjadi false tetapi belum sempat mengisi
       logoutTime.
    ====================================================== */

    const hasLoginHistory =
        !!(
            participant.loginTime ||
            participant.loggedInAt ||
            participant.loginAt ||
            participant.lastLoginAt ||
            participant.lastLogin ||
            participant.lastSeenAt ||
            participant.lastSeen ||
            participant.lastActivityAt ||
            participant.heartbeat
        );


    if (!hasLoginHistory) {
        return false;
    }


    /* ======================================================
       CEK APAKAH PESERTA MASIH ONLINE

       Jika masih online, TIDAK BOLEH membuat logoutTime.
    ====================================================== */

    if (isParticipantOnline(participant)) {
        return false;
    }


    /* ======================================================
       AMBIL WAKTU AKTIVITAS TERAKHIR

       PRIORITAS:
       1. lastSeenAt
       2. lastSeen
       3. lastActivityAt
       4. heartbeat
       5. activityUpdatedAt
    ====================================================== */

    const lastSeenValue =
        participant.lastSeenAt ||
        participant.lastSeen ||
        participant.lastActivityAt ||
        participant.heartbeat ||
        participant.activityUpdatedAt ||
        null;


    let logoutDate;


    if (lastSeenValue) {

        const parsedDate =
            new Date(lastSeenValue);

        if (
            !isNaN(parsedDate.getTime())
        ) {

            logoutDate =
                parsedDate;

        }

    }


    /* ======================================================
       FALLBACK JIKA WAKTU AKTIVITAS TIDAK VALID
    ====================================================== */

    if (!logoutDate) {

        logoutDate =
            new Date();

    }


    const logoutISOString =
        logoutDate.toISOString();


    /* ======================================================
       SIMPAN STATUS LOGOUT

       Gunakan beberapa alias field agar kompatibel dengan
       Database Peserta dan modul TalentScope lainnya.
    ====================================================== */

    participant.isLoggedIn =
        false;

    participant.onlineStatus =
        "offline";

    participant.status =
        "Offline";

    participant.logoutTime =
        logoutISOString;

    participant.loggedOutAt =
        logoutISOString;

    participant.logoutAt =
        logoutISOString;

    participant.lastLogoutAt =
        logoutISOString;

    participant.lastLogout =
        logoutISOString;

    participant.waktuLogout =
        logoutISOString;

    participant.currentActivity =
        "Offline";


    /* ======================================================
       CATAT ACTIVITY HISTORY
    ====================================================== */

    if (
        !Array.isArray(
            participant.activityHistory
        )
    ) {

        participant.activityHistory =
            [];

    }


    participant.activityHistory.unshift({

        activity:
            "Peserta keluar / sesi berakhir",

        description:
            "Peserta keluar / sesi berakhir",

        type:
            "logout",

        timestamp:
            logoutISOString

    });


    return true;

}

/* ==========================================================
   PARTICIPANT ACTIVE CHECK
   ACTIVE = LOGIN + HEARTBEAT MASIH HIDUP
========================================================== */

function isParticipantActive(
    participant
) {

    if (!participant) {
        return false;
    }


    /* ======================================================
       PALING PENTING:
       Semua status aktif harus mengikuti heartbeat.

       Jika heartbeat sudah mati,
       participant otomatis tidak aktif.
    ====================================================== */

    if (
        !isParticipantOnline(
            participant
        )
    ) {

        return false;

    }


    /* ======================================================
       CEK LOGIN
    ====================================================== */

    const isLoggedIn =
        participant.isLoggedIn === true ||
        participant.isLoggedIn === "true";


    if (!isLoggedIn) {

        return false;

    }


    /* ======================================================
       JIKA ONLINE + LOGIN
       BERARTI PESERTA AKTIF
    ====================================================== */

    return true;

}


/* ==========================================================
   FORMAT DATETIME
========================================================== */

function formatDateTime(
    value
) {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === "" ||
        String(value).trim() === "-"
    ) {

        return "-";

    }


    const raw =
        String(value).trim();


    const date =
        new Date(raw);


    if (isNaN(date.getTime())) {

        return raw;

    }


    return date.toLocaleString(
        "id-ID",
        {
            day:"2-digit",
            month:"short",
            year:"numeric",
            hour:"2-digit",
            minute:"2-digit"
        }
    );

}


/* ==========================================================
   SEARCH
========================================================== */

function initializeSearch() {

    const input =
        document.getElementById(
            "projectSearch"
        );


    if (!input) return;


    input.addEventListener(
        "input",
        function () {

            const keyword =
                input.value
                    .toLowerCase()
                    .trim();


            if (!keyword) {

                renderMonitoringProjects();

                return;

            }


            const filtered =
                monitoringProjects.filter(
                    function (project) {

                        const projectName =
                            getProjectName(
                                project
                            )
                            .toLowerCase();


                        const client =
                            getClient(
                                project
                            )
                            .toLowerCase();


                        const pic =
                            getPIC(
                                project
                            )
                            .toLowerCase();


                        return (
                            projectName.includes(
                                keyword
                            )
                            ||
                            client.includes(
                                keyword
                            )
                            ||
                            pic.includes(
                                keyword
                            )
                        );

                    }
                );


            renderMonitoringProjects(
                filtered
            );

        }
    );

}


/* ==========================================================
   NAVIGATION
========================================================== */

function initializeNavigation() {

    const backProjects =
        document.getElementById(
            "backToProjects"
        );


    const backParticipants =
        document.getElementById(
            "backToParticipants"
        );


    if (backProjects) {

        backProjects.addEventListener(
            "click",
            function () {

                showProjects();

            }
        );

    }


    if (backParticipants) {

        backParticipants.addEventListener(
            "click",
            function () {

                if (
                    selectedProject
                ) {

                    const detailCard =
                        document.getElementById(
                            "participantDetailCard"
                        );


                    const participantCard =
                        document.getElementById(
                            "participantCard"
                        );


                    if (detailCard) {

                        detailCard.classList.remove(
                            "show"
                        );

                    }


                    if (participantCard) {

                        participantCard.classList.add(
                            "show"
                        );

                    }


                    window.scrollTo({
                        top:0,
                        behavior:"smooth"
                    });

                }

            }
        );

    }

}


/* ==========================================================
   SHOW PROJECTS
========================================================== */

function showProjects() {

    selectedProject =
        null;

    selectedParticipant =
        null;


    const participantCard =
        document.getElementById(
            "participantCard"
        );


    const detailCard =
        document.getElementById(
            "participantDetailCard"
        );


    if (participantCard) {

        participantCard.classList.remove(
            "show"
        );

    }


    if (detailCard) {

        detailCard.classList.remove(
            "show"
        );

    }


    const projectCard =
        document.querySelector(
            ".card:not(.detail-card):not(.participant-detail)"
        );


    if (projectCard) {

        projectCard.style.display =
            "";

    }


    const input =
        document.getElementById(
            "projectSearch"
        );


    if (input) {

        input.value = "";

    }


    renderMonitoringProjects();


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


/* ==========================================================
   USER ROLE
========================================================== */

function initializeUserRole() {

    const userRole =
        document.getElementById(
            "userRole"
        );


    const userLabel =
        document.getElementById(
            "userLabel"
        );


    if (!userRole || !userLabel) {

        return;

    }


    let storedUser =
        null;


    try {

        storedUser =
            JSON.parse(
                localStorage.getItem(
                    "currentUser"
                )
                ||
                localStorage.getItem(
                    "user"
                )
                ||
                "null"
            );

    }

    catch (error) {

        storedUser =
            null;

    }


    if (!storedUser) {

        return;

    }


    let role =
        storedUser.role ||
        storedUser.userRole ||
        storedUser.type ||
        storedUser.userType ||
        "";


    role =
        String(role)
            .toLowerCase();


    if (
        role.includes("admin")
    ) {

        userRole.textContent =
            "Administrator";

        userLabel.textContent =
            "Admin";

    }

    else if (
        role.includes("client")
    ) {

        userRole.textContent =
            "Client";

        userLabel.textContent =
            "Client";

    }

    else if (
        role.includes("asesor") ||
        role.includes("assessor")
    ) {

        userRole.textContent =
            "Asesor";

        userLabel.textContent =
            "Asesor";

    }

}


/* ==========================================================
   LOGOUT
========================================================== */

function initializeLogout() {

    const button =
        document.getElementById(
            "logoutBtn"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        function () {

            const confirmed =
                confirm(
                    "Apakah Anda yakin ingin logout?"
                );


            if (!confirmed) {

                return;

            }


            /*
               Hapus session login.
               DATA PROJECT TIDAK DIHAPUS.
            */

            localStorage.removeItem(
                "currentUser"
            );

            localStorage.removeItem(
                "user"
            );


            /*
               Sesuaikan tujuan jika
               halaman login kakak berbeda.
            */

            window.location.href =
                "login.html";

        }
    );

}

/* ==========================================================
   ACTIVITY LOG
========================================================== */

function renderActivityLog(
    activityLog,
    currentActivity
) {

    const container =
        document.getElementById(
            "activityLog"
        );

    if (!container) return;

    container.innerHTML = "";

    const history =
        Array.isArray(activityLog)
            ? [...activityLog]
            : [];

    /*
       Aktivitas tes baru bisa menyimpan nama assessment di:
       testName / assessmentName / test / name,
       sementara activity tetap menjadi kalimat yang dibaca user.
    */
    if (history.length === 0) {

        const fallback =
            currentActivity ||
            "Belum ada riwayat aktivitas.";

        container.innerHTML = `
            <div class="activity-log-item">
                <div class="activity-log-dot"></div>
                <div class="activity-log-content">
                    <strong>${escapeHTML(fallback)}</strong>
                    <span>Aktivitas saat ini</span>
                </div>
            </div>
        `;

        return;
    }

    history
        .sort(function(a, b) {
            const aDate =
                new Date(
                    a?.timestamp ||
                    a?.time ||
                    a?.createdAt ||
                    a?.date ||
                    0
                );

            const bDate =
                new Date(
                    b?.timestamp ||
                    b?.time ||
                    b?.createdAt ||
                    b?.date ||
                    0
                );

            return bDate - aDate;
        })
        .forEach(function(item) {

            const testName =
                String(
                    item?.testName ||
                    item?.assessmentName ||
                    item?.test ||
                    item?.assessment ||
                    ""
                ).trim();

            let activity =
                String(
                    item?.activity ||
                    item?.title ||
                    item?.action ||
                    item?.description ||
                    item?.name ||
                    "-"
                ).trim();

            /*
               Jika event adalah test-start/test-session tetapi activity
               belum mengandung nama tes, bentuk ulang dari field testName.
            */
            const type =
                String(
                    item?.type ||
                    ""
                ).toLowerCase();

            if (
                testName &&
                (
                    type === "test-start" ||
                    type === "test-session" ||
                    type === "test-complete"
                ) &&
                !/mengerjakan\s+tes\s*\(/i.test(activity) &&
                !/tes\s+selesai\s*\(/i.test(activity)
            ) {
                if (type === "test-complete") {
                    activity =
                        "Tes selesai (" +
                        testName +
                        ")";
                } else {
                    activity =
                        "Sedang mengerjakan tes (" +
                        testName +
                        ")";
                }

                if (
                    item?.sessionNumber !== undefined &&
                    item?.sessionNumber !== null
                ) {
                    activity +=
                        " — Sesi " +
                        item.sessionNumber;
                }
            }

            const time =
                item?.timestamp ||
                item?.time ||
                item?.createdAt ||
                item?.date ||
                "";

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "activity-log-item";

            row.innerHTML = `
                <div class="activity-log-dot"></div>

                <div class="activity-log-content">

                    <strong>
                        ${escapeHTML(activity)}
                    </strong>

                    ${
                        testName &&
                        !activity.includes("(" + testName + ")")
                            ? `
                                <span>
                                    ${escapeHTML(testName)}
                                </span>
                              `
                            : ""
                    }

                    ${
                        time
                            ? `
                                <span>
                                    ${escapeHTML(
                                        formatDateTime(time)
                                    )}
                                </span>
                              `
                            : ""
                    }

                </div>
            `;

            container.appendChild(row);
        });
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) return;


    element.textContent =
        value === undefined ||
        value === null ||
        String(value).trim() === ""
            ? "-"
            : value;

}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeHTML(
    value
) {

    return String(
        value === undefined ||
        value === null
            ? ""
            : value
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

/* ==========================================================
   BACK TO PROJECTS
========================================================== */

function backToProjects() {

    window.location.href =
        "view-monitoring.html";

}

/* ==========================================================
   BACK TO PARTICIPANTS
========================================================== */

function backToParticipants(projectId) {

    if (!projectId) {

        const params =
            new URLSearchParams(
                window.location.search
            );

        projectId =
            params.get("projectId");

    }

    if (!projectId) {

        window.location.href =
            "view-monitoring.html";

        return;

    }

    window.location.href =
        `view-monitoring.html?projectId=${encodeURIComponent(projectId)}`;

}

/* ==========================================================
   LIVE MONITORING REFRESH

   HANYA MEMBACA STATUS PESERTA.
   View Monitoring TIDAK BOLEH mencatat logout otomatis.

   Logout hanya dicatat oleh:
   1. Tombol Logout peserta
   2. Close tab/window peserta
========================================================== */

if (
    latestSelectedProject &&
    latestSelectedProject.participants &&
    Array.isArray(latestSelectedProject.participants)
) {
    latestSelectedProject.participants.forEach(function(participant) {

        /*
         * Jangan ubah:
         * - isLoggedIn
         * - status
         * - onlineStatus
         * - logoutTime
         * - logoutAt
         * - waktuLogout
         *
         * View Monitoring hanya membaca data terbaru.
         */

    });
}