/* ==========================================================
   TALENTSCOPE
   VIEW & MONITORING
   SOURCE:
   SUPABASE (tabel `projects`, `project_participants`,
   `participants`)

   Sebelumnya membaca dari localStorage -> talentscope_projects.
   Sekarang project & participant diambil live dari Supabase
   lewat DataService (js/data-service.js), yang harus sudah
   dimuat sebelum file ini (lihat view-monitoring.html).
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await initializeMonitoring();

    }
);


/* ==========================================================
   AKSES DATA BERDASARKAN ROLE (Client/Asesor hanya melihat
   project miliknya sendiri)
========================================================== */

function getMonitoringSession() {

    try {

        return (
            JSON.parse(
                sessionStorage.getItem("ts_admin_session")
            ) ||
            JSON.parse(
                localStorage.getItem("talentscope_current_user")
            ) ||
            {}
        );

    } catch (error) {

        return {};

    }

}

function normalizeMonitoringValue(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}

function getMonitoringRole() {

    const session = getMonitoringSession();

    return normalizeMonitoringValue(
        session.role ||
        session.userRole ||
        session.roleName ||
        ""
    );

}

function isMonitoringAdmin() {

    const role = getMonitoringRole();

    return [
        "admin",
        "administrator",
        "system administrator",
        "super admin",
        "superadmin"
    ].includes(role);

}

function isMonitoringCompanyRestricted() {

    const role = getMonitoringRole();

    if (!role) {
        return false;
    }

    return (
        role.includes("client") ||
        role.includes("asesor") ||
        role.includes("assessor")
    );

}

function getMonitoringUserCompany() {

    const session = getMonitoringSession();

    const candidates = [
        session.company,
        session.perusahaan,
        session.companyName,
        session.company_name,
        session.organization,
        session.clientName,
        session.client
    ];

    for (const company of candidates) {

        const normalized =
            normalizeMonitoringValue(company);

        if (normalized) {
            return normalized;
        }

    }

    return "";

}

function getMonitoringProjectCompany(project) {

    if (!project) {
        return "";
    }

    const candidates = [
        project.company,
        project.perusahaan,
        project.companyName,
        project.company_name,
        project.organization,
        project.clientName,
        project.client
    ];

    for (const company of candidates) {

        const normalized =
            normalizeMonitoringValue(company);

        if (normalized) {
            return normalized;
        }

    }

    return "";

}

function canMonitoringAccessProjectByDirectAssignment(project) {

    if (!project) {
        return false;
    }

    const session = getMonitoringSession();

    const sessionProjectId =
        String(
            session.projectId ||
            session.project_id ||
            ""
        ).trim();

    if (!sessionProjectId || sessionProjectId === "ALL") {
        return false;
    }

    const projectId =
        String(
            project.id ||
            project.projectId ||
            project.project_id ||
            ""
        ).trim();

    if (sessionProjectId === projectId) {
        return true;
    }

    const assigned =
        Array.isArray(session.assignedProjects)
            ? session.assignedProjects
            : [];

    return assigned
        .map(function (value) {
            return String(value).trim();
        })
        .includes(projectId);

}

function canMonitoringAccessProject(project) {

    if (isMonitoringAdmin()) {
        return true;
    }

    if (!isMonitoringCompanyRestricted()) {
        return true;
    }

    if (canMonitoringAccessProjectByDirectAssignment(project)) {
        return true;
    }

    const userCompany =
        getMonitoringUserCompany();

    if (!userCompany) {

        console.warn(
            "[MONITORING ACCESS] Client/Asesor tidak memiliki perusahaan maupun projectId yang cocok pada session."
        );

        return false;

    }

    return (
        getMonitoringProjectCompany(project) ===
        userCompany
    );

}


/* ==========================================================
   STATE
========================================================== */

let monitoringProjects = [];

let selectedProject = null;

let selectedParticipant = null;


/* ==========================================================
   INITIALIZE
========================================================== */

async function initializeMonitoring() {

    await loadMonitoringProjects();

    renderMonitoringProjects();

    initializeSearch();

    initializeNavigation();

    initializeUserRole();

    initializeLogout();

    startLiveMonitoringRefresh();

}

/* ==========================================================
   LOAD PROJECTS (SUPABASE)
========================================================== */

async function loadMonitoringProjects() {

    if (
        typeof DataService === "undefined" ||
        !DataService ||
        typeof DataService.getProjects !== "function"
    ) {

        console.error(
            "[MONITORING] DataService tidak tersedia. " +
            "Pastikan supabase-js, js/supabase-client.js, dan " +
            "js/data-service.js dimuat SEBELUM js/view-monitoring.js."
        );

        monitoringProjects = [];

        return;

    }

    try {

        console.log(
            "[MONITORING] Loading projects from Supabase..."
        );

        const projectRows =
            await DataService.getProjects();

        if (!Array.isArray(projectRows)) {

            console.warn(
                "[MONITORING] Data project dari Supabase tidak valid"
            );

            monitoringProjects = [];

            return;

        }

        const accessibleProjectRows =
            projectRows.filter(
                canMonitoringAccessProject
            );


        const built = [];

        for (const projectRow of accessibleProjectRows) {

            const project =
                buildMonitoringProject(
                    projectRow
                );

            try {

                const relations =
                    await DataService.getProjectParticipants(
                        projectRow.id
                    );

                project.participants =
                    relations.map(
                        buildMonitoringParticipant
                    );

            } catch (participantError) {

                console.error(
                    "[MONITORING] Gagal memuat peserta project",
                    projectRow.id,
                    participantError
                );

                project.participants = [];

            }

            built.push(project);

        }

        monitoringProjects = built;

        // NEW: Start realtime subscription
        const urlParams = new URLSearchParams(location.search);
        const activeProjectId = urlParams.get("id") || urlParams.get("projectId");
        if (activeProjectId) {
            startRealtimeSubscription(activeProjectId);
        }

        console.log(
            `[MONITORING] Loaded ${monitoringProjects.length} projects from Supabase`
        );

    } catch (error) {

        console.error(
            "TalentScope: gagal membaca project dari Supabase.",
            error
        );

        monitoringProjects = [];

    }

}


/* ==========================================================
   BUILD PROJECT OBJECT DARI ROW SUPABASE
========================================================== */

function buildMonitoringProject(projectRow) {

    const rawData =
        (projectRow && projectRow.raw_data) || {};

    const project =
        Object.assign(
            {},
            rawData,
            projectRow
        );

    project.startDate =
        projectRow.start_date ||
        rawData.startDate ||
        rawData.start ||
        null;

    project.participants = [];

    return project;

}


/* ==========================================================
   BUILD PARTICIPANT OBJECT DARI RELASI SUPABASE
========================================================== */

function buildMonitoringParticipant(relation) {
    const participantRow = (relation && relation.participant) || {};
    const rawData = participantRow.raw_data || {};

    const participant = Object.assign({}, rawData, participantRow);

    // ID
    participant.id =
        participantRow.participant_code ||
        participantRow.id ||
        rawData.id;

    // Activity mapping
    participant.currentActivity =
        participantRow.current_activity ||
        participantRow.currentActivity ||
        rawData.currentActivity ||
        "";

    participant.lastActivity =
        participantRow.last_activity ||
        participantRow.lastActivity ||
        rawData.lastActivity ||
        "";

    participant.activityUpdatedAt =
        participantRow.activity_updated_at ||
        participantRow.activityUpdatedAt ||
        rawData.activityUpdatedAt ||
        "";

    const lastSeenCandidates = [
        participantRow.activity_updated_at,
        participantRow.last_activity_at,
        participantRow.last_login_at,
        participantRow.login_at,
        rawData.lastSeenAt,
        rawData.lastSeen,
        rawData.lastActivityAt,
        rawData.heartbeat
    ].filter(Boolean);

    let latestLastSeen = "";
    let latestLastSeenTs = 0;
    for (const value of lastSeenCandidates) {
        const ts = new Date(value).getTime();
        if (Number.isFinite(ts) && ts > latestLastSeenTs) {
            latestLastSeenTs = ts;
            latestLastSeen = value;
        }
    }
    participant.lastSeenAt = latestLastSeen;
    participant.lastSeen = latestLastSeen;

    const rawIsLoggedIn =
        participantRow.is_logged_in !== undefined
            ? participantRow.is_logged_in
            : (participantRow.isLoggedIn !== undefined
                ? participantRow.isLoggedIn
                : rawData.isLoggedIn);

    participant.isLoggedIn =
        rawIsLoggedIn === true ||
        rawIsLoggedIn === "true" ||
        rawIsLoggedIn === 1 ||
        rawIsLoggedIn === "1";

    participant.is_logged_in = participant.isLoggedIn;

    const rawLoginAt =
        participantRow.login_at ||
        participantRow.last_login_at ||
        "";

    const rawLogoutAt =
        participantRow.logout_at ||
        participantRow.last_logout_at ||
        "";

    const latestActivityAt =
        participantRow.activity_updated_at || "";

    const isCurrentlyOnline = participant.isLoggedIn;

    let loginTimeValue = rawLoginAt;
    if (latestActivityAt) {
        const loginTs = rawLoginAt ? new Date(rawLoginAt).getTime() : 0;
        const activityTs = new Date(latestActivityAt).getTime();
        if (!loginTs || activityTs > loginTs) {
            loginTimeValue = latestActivityAt;
        }
    }
    participant.loginTime = loginTimeValue || participant.lastSeenAt || rawData.loginTime || "";

    if (isCurrentlyOnline) {
        participant.logoutTime = "";
    } else {
        let logoutTimeValue = rawLogoutAt;
        if (latestActivityAt) {
            const logoutTs = rawLogoutAt ? new Date(rawLogoutAt).getTime() : 0;
            const activityTs = new Date(latestActivityAt).getTime();
            if (!logoutTs || activityTs > logoutTs) {
                logoutTimeValue = latestActivityAt;
            }
        }
        participant.logoutTime = logoutTimeValue || rawData.logoutTime || "";
    }

    participant._supabaseParticipantId = participantRow.id;
    participant._supabaseRawData = rawData;

    return participant;
}

/* ==========================================================
   REALTIME SUBSCRIPTION — Supabase WebSocket
========================================================== */

var monitoringRealtimeChannel = null;
var monitoringRealtimeProjectId = null;

function startRealtimeSubscription(projectId) {
    var sb = window.supabaseClient || window.supabase;
    if (!sb || typeof sb.channel !== "function") {
        console.warn("[Monitoring] Supabase Realtime tidak tersedia");
        return;
    }

    if (monitoringRealtimeChannel && monitoringRealtimeProjectId === projectId) {
        return;
    }

    if (monitoringRealtimeChannel) {
        try {
            sb.removeChannel(monitoringRealtimeChannel);
        } catch (err) {
            console.warn("[Monitoring] Remove channel error:", err);
        }
        monitoringRealtimeChannel = null;
    }

    console.log("[Monitoring] 🔌 Subscribing realtime for project:", projectId);

    monitoringRealtimeProjectId = projectId;

    monitoringRealtimeChannel = sb
        .channel("monitoring-" + projectId)
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "participants",
            filter: "project_id=eq." + projectId
        }, function(payload) {
            handleRealtimeUpdate(payload);
        })
        .subscribe(function(status) {
            if (status === "SUBSCRIBED") {
                setMonitoringConnectionStatus("connected");
            } else if (status === "TIMED_OUT" || status === "CLOSED" || status === "CHANNEL_ERROR") {
                setMonitoringConnectionStatus("disconnected");
            }
        });
}

/* ==========================================================
   HANDLE REALTIME UPDATE
========================================================== */

function handleRealtimeUpdate(payload) {
    if (!selectedProject) {
        loadMonitoringProjects().then(function() {
            renderMonitoringProjects();
        });
        return;
    }

    var newRow = payload.new || payload.old;
    if (!newRow || !newRow.id) return;

    var participants = selectedProject.participants || [];
    var participantIndex = participants.findIndex(function(p) {
        return p._supabaseParticipantId === newRow.id;
    });

    var updatedParticipant = buildMonitoringParticipant({
        participant: newRow,
        project_id: newRow.project_id
    });

    if (participantIndex >= 0) {
        var existing = participants[participantIndex] || {};
        participants[participantIndex] = Object.assign({}, existing, updatedParticipant, {
            activityHistory: existing.activityHistory || updatedParticipant.activityHistory || [],
            _supabaseParticipantId: newRow.id,
            _supabaseRawData: existing._supabaseRawData || updatedParticipant._supabaseRawData
        });
    } else {
        participants.push(updatedParticipant);
    }

    selectedProject.participants = participants;

    var projectIndex = monitoringProjects.findIndex(function(p) {
        return getProjectId(p) === getProjectId(selectedProject);
    });
    if (projectIndex >= 0) {
        monitoringProjects[projectIndex].participants = participants;
    }

    renderParticipants(selectedProject);

    if (selectedParticipant) {
        var selectedId = selectedParticipant._supabaseParticipantId;
        if (selectedId === newRow.id) {
            selectedParticipant = participants[participantIndex >= 0 ? participantIndex : participants.length - 1];
            fillParticipantDetail(selectedProject, selectedParticipant);
        }
    }

    updateMonitoringTimestamp();
}

/* ==========================================================
   UI: Koneksi Status Indicator
========================================================== */

function setMonitoringConnectionStatus(status) {
    var el = document.getElementById("realtimeStatus");
    if (!el) return;

    if (status === "connected") {
        el.innerHTML = '<span style="color:#16a34a">●</span> Live';
        el.title = "Realtime connected";
    } else if (status === "disconnected") {
        el.innerHTML = '<span style="color:#d97706">●</span> Polling';
        el.title = "Realtime disconnected — using polling fallback";
    }
}

/* ==========================================================
   LIVE MONITORING REFRESH
========================================================== */

function startLiveMonitoringRefresh() {

    if (window.talentScopeMonitoringRefreshStarted) {
        return;
    }

    window.talentScopeMonitoringRefreshStarted = true;

    setInterval(async function () {
        try {
            if (!selectedProject) {
                await loadMonitoringProjects();
                renderMonitoringProjects();
                updateMonitoringTimestamp();
                return;
            }

            const selectedProjectId = getProjectId(selectedProject);
            if (!selectedProjectId) return;

            const relations = await Promise.race([
                DataService.getProjectParticipants(selectedProjectId),
                new Promise(function (resolve) {
                    setTimeout(function () { 
                        resolve([]); 
                    }, 10000);
                })
            ]);

            if (!Array.isArray(relations) || relations.length === 0) {
                return;
            }

            const latestParticipants = relations.map(buildMonitoringParticipant);
            selectedProject.participants = latestParticipants;

            const projectIndex = monitoringProjects.findIndex(
                function (project) {
                    return getProjectId(project) === selectedProjectId;
                }
            );

            if (projectIndex !== -1) {
                monitoringProjects[projectIndex].participants = latestParticipants;
            }

            let hasAutomaticLogout = false;
            const changedParticipants = [];

            latestParticipants.forEach(function (participant) {
                if (participant.isLoggedIn !== true) return;
                if (participant.logoutTime) return;
                if (participant.logout_at) return;

                const lastSeen = participant.lastSeenAt || participant.lastSeen || "";
                if (!lastSeen) return;

                const lastSeenTime = new Date(lastSeen).getTime();
                if (!Number.isFinite(lastSeenTime)) return;

                const minutesAgo = (Date.now() - lastSeenTime) / (60 * 1000);

                if (minutesAgo > 30) {
                    const updated = recordAutomaticLogout(selectedProject, participant);
                    if (updated) {
                        hasAutomaticLogout = true;
                        changedParticipants.push(participant);
                    }
                }
            });

            if (hasAutomaticLogout) {
                await persistAutomaticLogouts(changedParticipants);
            }

            renderParticipants(selectedProject);
            updateMonitoringTimestamp();

            if (selectedParticipant) {
                const selectedParticipantId = getParticipantId(selectedParticipant);
                const latestParticipant = latestParticipants.find(
                    function (participant) {
                        return getParticipantId(participant) === selectedParticipantId;
                    }
                );

                if (latestParticipant) {
                    selectedParticipant = latestParticipant;
                    fillParticipantDetail(selectedProject, latestParticipant);
                }
            }

        } catch (error) {
            console.warn("[Monitoring] Live refresh gagal:", error);
        }
    }, 30000);
}

/* ==========================================================
   HELPER: Update timestamp "last refresh" di UI
========================================================== */

function updateMonitoringTimestamp() {
    var el = document.getElementById("lastRefreshTime");
    if (!el) return;
    
    var now = new Date();
    var timeStr = now.toLocaleTimeString("id-ID", { 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit" 
    });
    el.textContent = "Last update: " + timeStr;
    el.style.color = "#16a34a";
}

/* ==========================================================
   SIMPAN AUTOMATIC LOGOUT KE SUPABASE
========================================================== */

async function persistAutomaticLogouts(participants) {

    for (const participant of participants) {

        if (!participant || !participant._supabaseParticipantId) {
            continue;
        }

        try {
            const logoutTimeISO = participant.logoutTime ||
                participant.logoutAt ||
                participant.lastLogoutAt ||
                participant.waktuLogout ||
                new Date().toISOString();

            const parsedDate = new Date(logoutTimeISO);
            if (isNaN(parsedDate.getTime())) {
                continue;
            }

            const updatedRawData = Object.assign(
                {},
                participant._supabaseRawData || {},
                {
                    isLoggedIn: false,
                    onlineStatus: "offline",
                    status: "Offline",
                    logoutTime: logoutTimeISO,
                    logoutAt: logoutTimeISO,
                    lastLogoutAt: logoutTimeISO,
                    lastLogout: logoutTimeISO,
                    waktuLogout: logoutTimeISO,
                    currentActivity: "Offline",
                    activityHistory: participant.activityHistory || []
                }
            );

            const updatePayload = {
                is_logged_in: false,
                logout_at: logoutTimeISO,
                last_logout_at: logoutTimeISO,
                raw_data: updatedRawData
            };

            await DataService.updateParticipant(
                participant._supabaseParticipantId,
                updatePayload
            );

        } catch (error) {
            console.error(
                "[Monitoring] ❌ Gagal menyimpan automatic logout:",
                participant.id,
                error
            );
        }
    }
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
    if (project && Array.isArray(project.participants)) {
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
    if (project?.pic && typeof project.pic === "object") {
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
   FORMAT DATE & STATUS
========================================================== */

function formatMonitoringDate(value) {
    if (value === undefined || value === null || String(value).trim() === "") {
        return "-";
    }
    const raw = String(value).trim();
    if (/^[0-9]{2}\s[A-Za-z]{3}\s[0-9]{4}$/.test(raw)) {
        return raw;
    }
    const date = new Date(raw.includes("T") ? raw : raw + "T00:00:00");
    if (isNaN(date.getTime())) {
        return raw;
    }
    return date.toLocaleDateString("en-GB", {
        day:"2-digit",
        month:"short",
        year:"numeric"
    });
}

function getStatusClass(status) {
    const value = String(status || "").toLowerCase().trim();
    if (value.includes("complete")) return "completed";
    if (value.includes("ongoing") || value.includes("running") || value.includes("progress") || value.includes("active")) return "ongoing";
    if (value.includes("scheduled") || value.includes("waiting")) return "scheduled";
    if (value.includes("draft")) return "draft";
    return "scheduled";
}

function getProjectStatus(project) {
    return project?.status || project?.projectStatus || "-";
}

/* ==========================================================
   RENDER PROJECTS
========================================================== */

function renderMonitoringProjects(source) {
    const table = document.getElementById("projectMonitoringTable");
    const count = document.getElementById("projectCount");
    if (!table) return;

    const data = Array.isArray(source) ? source : monitoringProjects;
    table.innerHTML = "";

    if (!data.length) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fa-solid fa-chart-line"></i>
                    <p>Belum ada project untuk ditampilkan.</p>
                </td>
            </tr>
        `;
        if (count) count.textContent = "Showing 0 results";
        return;
    }

    data.forEach(function (project) {
        const projectId = getProjectId(project);
        const projectName = getProjectName(project);
        const participants = getParticipants(project);
        const status = getProjectStatus(project);
        const statusClass = getStatusClass(status);
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="project-name">${escapeHTML(projectName)}</div>
                ${projectId ? `<span class="project-id">${escapeHTML(projectId)}</span>` : ""}
            </td>
            <td>${escapeHTML(getClient(project))}</td>
            <td>${escapeHTML(formatMonitoringDate(project.startDate || project.start || project.assessmentDate))}</td>
            <td><span class="participant-count">${participants.length}</span></td>
            <td>${escapeHTML(getPIC(project))}</td>
            <td><span class="status ${statusClass}">${escapeHTML(status)}</span></td>
            <td>
                <button type="button" class="monitor-btn" data-project-id="${escapeHTML(projectId)}">
                    <i class="fa-solid fa-chart-line"></i> View & Monitoring
                </button>
            </td>
        `;

        const button = row.querySelector(".monitor-btn");
        if (button) {
            button.addEventListener("click", function () {
                openProjectMonitoring(projectId);
            });
        }
        table.appendChild(row);
    });

    if (count) count.textContent = "Showing " + data.length + " results";
}

/* ==========================================================
   OPEN PROJECT
========================================================== */

function openProjectMonitoring(projectId) {
    const project = monitoringProjects.find(function (p) {
        return getProjectId(p) === String(projectId);
    });

    if (!project) {
        alert("Project tidak ditemukan.");
        return;
    }

    selectedProject = project;
    selectedParticipant = null;

    startRealtimeSubscription(String(projectId));
    renderParticipants(project);

    const projectCard = document.querySelector(".card:not(.detail-card):not(.participant-detail)");
    if (projectCard) projectCard.style.display = "none";

    const participantCard = document.getElementById("participantCard");
    if (participantCard) participantCard.classList.add("show");

    const detailCard = document.getElementById("participantDetailCard");
    if (detailCard) detailCard.classList.remove("show");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ==========================================================
   RENDER PARTICIPANTS
========================================================== */

function renderParticipants(project) {
    const table = document.getElementById("participantMonitoringTable");
    const count = document.getElementById("participantCount");
    const title = document.getElementById("participantTitle");

    if (!table) return;
    const participants = getParticipants(project);
    table.innerHTML = "";

    if (title) title.textContent = "Participants - " + getProjectName(project);

    if (!participants.length) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fa-solid fa-users"></i>
                    <p>Belum ada peserta dalam project ini.</p>
                </td>
            </tr>
        `;
        if (count) count.textContent = "Showing 0 results";
        return;
    }

    participants.forEach(function (participant) {
        const participantId = getParticipantId(participant);
        const participantName = getParticipantName(participant);
        const isOnline = isParticipantOnline(participant);
        const activityText = String(participant?.currentActivity || participant?.activity || "").trim();
        const activityLower = activityText.toLowerCase();
        const isDoingTest = activityText !== "" && activityLower !== "online" && (activityLower.includes("mengerjakan") || activityLower.includes("assessment") || activityLower.includes("test") || activityLower.includes("tes"));
        
        const statusTitle = isOnline ? "Online" : "Offline";
        const statusActivity = !isOnline ? "Peserta sedang offline" : isDoingTest ? activityText : "Tidak sedang mengerjakan tes";
        const statusClass = isOnline ? "is-online" : "is-offline";
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><div class="project-name">${escapeHTML(getProjectName(project))}</div></td>
            <td>${escapeHTML(formatMonitoringDate(project.startDate || project.start || project.assessmentDate))}</td>
            <td>
                <div class="project-name">${escapeHTML(participantName)}</div>
                ${participantId ? `<span class="project-id">${escapeHTML(participantId)}</span>` : ""}
            </td>
            <td class="participant-status-cell">
                <div class="participant-status ${statusClass}">
                    <div class="participant-status-main">
                        <span class="participant-status-dot"></span>
                        <strong>${escapeHTML(statusTitle)}</strong>
                    </div>
                    <div class="participant-status-activity">${escapeHTML(statusActivity)}</div>
                </div>
            </td>
            <td>
                <button type="button" class="monitor-btn participant-monitor-btn">
                    <i class="fa-solid fa-user-clock"></i> View & Monitoring
                </button>
            </td>
        `;

        const button = row.querySelector(".participant-monitor-btn");
        if (button) {
            button.addEventListener("click", function () {
                openParticipantMonitoring(project, participant);
            });
        }
        table.appendChild(row);
    });

    if (count) count.textContent = "Showing " + participants.length + " results";
}

/* ==========================================================
   OPEN PARTICIPANT MONITORING
========================================================== */

function openParticipantMonitoring(project, participant) {
    selectedProject = project;
    selectedParticipant = participant;

    const detailCard = document.getElementById("participantDetailCard");
    const participantCard = document.getElementById("participantCard");

    if (participantCard) participantCard.classList.remove("show");
    if (detailCard) detailCard.classList.add("show");

    fillParticipantDetail(project, participant);

    window.scrollTo({ top:0, behavior:"smooth" });
}

/* ==========================================================
   PARTICIPANT DETAIL
========================================================== */

function fillParticipantDetail(project, participant) {
    const name = getParticipantName(participant);
    const projectName = getProjectName(project);
    const assessmentDate = formatMonitoringDate(project.startDate || project.start || project.assessmentDate);
    const invitation = participant?.invitationStatus || participant?.statusInvitation || participant?.invitation || participant?.inviteStatus || participant?.accessStatus || "Belum diundang";

    const login = participant?.loginTime || participant?.loggedInAt || participant?.loginAt || participant?.timeLogin || participant?.lastLogin || "-";

    let logout = participant?.logoutTime || participant?.loggedOutAt || participant?.logoutAt || participant?.timeLogout || participant?.lastLogoutAt || "";

    if (!logout) {
        var logoutHistory = Array.isArray(participant.activityHistory) ? participant.activityHistory : [];
        var logoutItem = logoutHistory.find(function(item) {
            var type = String(item?.type || "").toLowerCase();
            var activity = String(item?.activity || item?.description || "").toLowerCase();
            return type === "logout" || activity.includes("keluar") || activity.includes("logout") || activity.includes("sesi berakhir");
        });
        if (logoutItem) {
            logout = logoutItem.timestamp || logoutItem.time || logoutItem.createdAt || "";
        }
    }

    if (!logout) logout = "-";

    setText("detailParticipantName", name);
    setText("detailName", name);
    setText("detailProject", projectName);
    setText("detailDate", assessmentDate);
    setText("detailInvitation", invitation);
    setText("detailLogin", formatDateTime(login));
    setText("detailLogout", formatDateTime(logout));

    var tabStatsEl = document.getElementById("detailTabStats");
    if (tabStatsEl) {
        var tabCount = Number(participant.tabSwitchCount) || 0;
        var tabLong = Number(participant.tabSwitchLongSwitches) || 0;
        var tabDuration = Number(participant.tabSwitchTotalDuration) || 0;

        if (tabCount === 0) {
            var history = Array.isArray(participant.activityHistory) ? participant.activityHistory : [];
            history.forEach(function(item) {
                var text = String(item?.activity || item?.description || item?.title || "").toLowerCase();
                if (text.includes("pindah tab") || text.includes("berpindah tab")) {
                    tabCount++;
                    var match = text.match(/(\d+)\s*detik/);
                    if (match) {
                        var sec = Number(match[1]);
                        tabDuration += sec;
                        if (sec > 30) tabLong++;
                    }
                }
            });
        }

        if (tabCount === 0) {
            tabStatsEl.textContent = "Tidak ada pindah tab";
            tabStatsEl.style.color = "#16a34a";
        } else if (tabCount <= 2) {
            tabStatsEl.textContent = tabCount + "× pindah tab (normal)";
            tabStatsEl.style.color = "#65a30d";
        } else if (tabCount <= 5) {
            tabStatsEl.textContent = tabCount + "× pindah tab" + (tabLong > 0 ? ", " + tabLong + "× > 30 detik ⚠️" : "");
            tabStatsEl.style.color = "#d97706";
            tabStatsEl.style.fontWeight = "700";
        } else {
            tabStatsEl.textContent = tabCount + "× pindah tab" + (tabLong > 0 ? ", " + tabLong + "× > 30 detik 🚨" : "");
            tabStatsEl.style.color = "#dc2626";
            tabStatsEl.style.fontWeight = "800";
        }

        if (tabDuration > 0) {
            tabStatsEl.title = "Total waktu di tab lain: " + Math.round(tabDuration) + " detik";
        }
    }

    renderParticipantActivity(participant);
}

/* ==========================================================
   ACTIVITY
========================================================== */

function getCurrentActivity(participant) {
    const directActivity = participant?.currentActivity || participant?.activity || participant?.currentTest || participant?.testActivity || participant?.kegiatan;
    if (directActivity && String(directActivity).trim() !== "") return String(directActivity);

    const status = String(participant?.assessmentStatus || participant?.assessment_status || participant?.testStatus || participant?.status || "").toLowerCase().trim();
    if (status.includes("progress") || status.includes("running") || status.includes("active") || status.includes("ongoing")) return "Sedang mengerjakan tes";
    if (status.includes("complete") || status.includes("completed") || status.includes("finish") || status.includes("finished")) return "Tes telah selesai";
    if (status.includes("login") || status.includes("logged")) return "Peserta sudah login";
    return "Tidak sedang mengerjakan tes";
}

function getActivityHistory(participant) {
    const history = participant?.activityHistory || participant?.activityLog || participant?.activities || participant?.history || [];
    if (Array.isArray(history)) return history;
    return [];
}

/* ==========================================================
   FIX UTAMA: Ambil data history dari Supabase (Tabel)
========================================================== */
async function loadActivityHistoryFromSupabase(participantId) {
    try {
        var sb = window.supabaseClient || window.supabase;
        if (!sb) return [];
        
        var { data, error } = await sb
            .from("participant_activity_history")
            .select("*")
            .eq("participant_id", participantId)
            .order("timestamp", { ascending: false })
            .limit(50);
        
        if (error) {
            console.warn("[Monitoring] Activity history error:", error);
            return [];
        }
        
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.warn("[Monitoring] Activity history exception:", e);
        return [];
    }
}

async function renderParticipantActivity(participant) {
    if (!participant) return;

    const currentBox = document.getElementById("currentActivity");
    if (currentBox) {
        const active = isParticipantActive(participant);
        const isOnline = isParticipantOnline(participant);
        const rawActivity = String(participant?.currentActivity || participant?.activity || participant?.testActivity || participant?.lastActivity || "").trim();
        const activityLower = rawActivity.toLowerCase();
        const isDoingTest = /^sedang\s+mengerjakan\s+tes\s*\d*\s*\(/i.test(rawActivity) || activityLower.includes("mengerjakan tes") || activityLower.includes("assessment") || activityLower.includes("test") || activityLower.includes("tes");
        const isLoggedIn = participant?.isLoggedIn === true || participant?.isLoggedIn === "true";
        
        let displayActivity = "Offline";
        let displaySubtext = "Peserta tidak terhubung";
        const explicitLogout = !!(participant.logoutTime || participant.loggedOutAt || participant.logoutAt || participant.lastLogoutAt);
        const participantStatus = String(participant?.status || participant?.onlineStatus || "").toLowerCase().trim();

        if (participantStatus === "completed" || participantStatus === "complete") {
            displayActivity = "Assessment selesai";
            displaySubtext = "Peserta telah menyelesaikan assessment";
        } else if (explicitLogout) {
            displayActivity = "Offline";
            displaySubtext = "Peserta sudah logout";
        } else if (!isOnline) {
            displayActivity = "Offline";
            displaySubtext = "Peserta tidak terhubung";
        } else if (isOnline && isDoingTest) {
            const testOrdinal = Number.isFinite(Number(participant?.currentAssessmentIndex)) ? (Number(participant.currentAssessmentIndex) + 1) : null;
            displayActivity = rawActivity || (participant?.currentTest ? "Sedang mengerjakan tes" + (testOrdinal ? " " + testOrdinal : "") + " (" + participant.currentTest + ")" : "Sedang mengerjakan tes");
            displaySubtext = "Sedang berlangsung";
        } else if (isOnline && isLoggedIn) {
            displayActivity = "Online";
            displaySubtext = "Siap mengerjakan tes";
        } else {
            displayActivity = "Offline";
            displaySubtext = "Peserta tidak terhubung";
        }

        currentBox.classList.toggle("is-active", active);
        currentBox.innerHTML = `
            <div class="activity-status-dot ${isOnline ? '' : 'offline'}"></div>
            <div class="activity-current-content">
                <strong>${escapeHTML(displayActivity)}</strong>
                <span>${escapeHTML(displaySubtext)}</span>
            </div>
        `;
    }

    /* ======================================================
       ACTIVITY HISTORY (FIX: Fetch dari Supabase)
    ====================================================== */
    const historyContainer = document.getElementById("activityHistory");
    if (!historyContainer) return;

    // Tampilkan loading sementara
    historyContainer.innerHTML = '<div class="activity-empty">Memuat riwayat aktivitas...</div>';

    var supabaseId = participant._supabaseParticipantId || participant.id;
    var historyData = await loadActivityHistoryFromSupabase(supabaseId);

    // Fallback ke data lokal jika Supabase kosong
    if (!historyData || historyData.length === 0) {
        historyData = Array.isArray(participant.activityHistory) ? participant.activityHistory : [];
    }

    if (historyData.length === 0) {
        historyContainer.innerHTML = `<div class="activity-empty">Belum ada aktivitas.</div>`;
        return;
    }

    const sortedHistory = historyData.sort(function(a, b) {
        const dateA = new Date(a.timestamp || a.time || a.createdAt || 0);
        const dateB = new Date(b.timestamp || b.time || b.createdAt || 0);
        return dateB - dateA;
    });

    historyContainer.innerHTML = "";

    sortedHistory.forEach(function(item) {
        const title = item.activity || item.title || item.action || item.test || item.name || "Aktivitas tes";
        const description = item.description || item.detail || item.message || "";
        const time = item.timestamp || item.time || item.createdAt || item.date || "-";
        const row = document.createElement("div");
        row.className = "activity-history-item";

        row.innerHTML = `
            <div class="activity-history-marker"></div>
            <div class="activity-history-content">
                <strong>${escapeHTML(title)}</strong>
                ${description ? `<span>${escapeHTML(description)}</span>` : ""}
            </div>
            <div class="activity-history-time">
                ${escapeHTML(formatDateTime(time))}
            </div>
        `;

        historyContainer.appendChild(row);
    });
}


/* ==========================================================
   PARTICIPANT ONLINE CHECK
========================================================== */

function isParticipantOnline(participant) {
    if (!participant) return false;
    if (participant.logoutTime || participant.loggedOutAt || participant.logoutAt || participant.lastLogoutAt) return false;

    const isLoggedIn = participant.isLoggedIn === true || participant.isLoggedIn === "true" || participant.is_logged_in === true || participant.is_logged_in === "true";
    if (!isLoggedIn) return false;

    const candidates = [participant.lastSeenAt, participant.lastSeen, participant.activityUpdatedAt, participant.activity_updated_at, participant.last_activity_at, participant.loginTime, participant.login_at, participant.last_login_at].filter(Boolean);
    if (candidates.length === 0) return true;

    let latestTs = 0;
    for (const value of candidates) {
        const ts = new Date(value).getTime();
        if (Number.isFinite(ts) && ts > latestTs) latestTs = ts;
    }

    if (latestTs === 0) return true;
    const age = Date.now() - latestTs;
    const ONLINE_TIMEOUT = 120 * 1000; // 2 menit
    if (age < 0) return true;
    return age <= ONLINE_TIMEOUT;
}

/* ==========================================================
   AUTO LOGOUT RECORD
========================================================== */

function recordAutomaticLogout(project, participant) {
    if (!participant) return false;
    const existingLogoutTime = participant.logoutTime || participant.loggedOutAt || participant.logoutAt || participant.lastLogoutAt || participant.lastLogout || participant.waktuLogout || null;
    if (existingLogoutTime) return false;

    const hasLoginHistory = !!(participant.loginTime || participant.loggedInAt || participant.loginAt || participant.lastLoginAt || participant.lastLogin || participant.lastSeenAt || participant.lastSeen || participant.lastActivityAt || participant.heartbeat);
    if (!hasLoginHistory) return false;
    if (isParticipantOnline(participant)) return false;

    const lastSeenValue = participant.lastSeenAt || participant.lastSeen || participant.lastActivityAt || participant.heartbeat || participant.activityUpdatedAt || null;
    let logoutDate;
    if (lastSeenValue) {
        const parsedDate = new Date(lastSeenValue);
        if (!isNaN(parsedDate.getTime())) logoutDate = parsedDate;
    }
    if (!logoutDate) logoutDate = new Date();

    const logoutISOString = logoutDate.toISOString();
    participant.isLoggedIn = false;
    participant.onlineStatus = "offline";
    participant.status = "Offline";
    participant.logoutTime = logoutISOString;
    participant.loggedOutAt = logoutISOString;
    participant.logoutAt = logoutISOString;
    participant.lastLogoutAt = logoutISOString;
    participant.lastLogout = logoutISOString;
    participant.waktuLogout = logoutISOString;
    participant.currentActivity = "Offline";

    if (!Array.isArray(participant.activityHistory)) participant.activityHistory = [];
    participant.activityHistory.unshift({
        activity: "Peserta keluar / sesi berakhir",
        description: "Peserta keluar / sesi berakhir",
        type: "logout",
        timestamp: logoutISOString
    });
    return true;
}

/* ==========================================================
   PARTICIPANT ACTIVE CHECK
========================================================== */

function isParticipantActive(participant) {
    if (!participant) return false;
    if (!isParticipantOnline(participant)) return false;
    const isLoggedIn = participant.isLoggedIn === true || participant.isLoggedIn === "true";
    if (!isLoggedIn) return false;
    return true;
}

/* ==========================================================
   FORMAT DATETIME
========================================================== */

function formatDateTime(value) {
    if (value === undefined || value === null || String(value).trim() === "" || String(value).trim() === "-") return "-";
    const raw = String(value).trim();
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;

    return date.toLocaleString("id-ID", {
        day:"2-digit",
        month:"short",
        year:"numeric",
        hour:"2-digit",
        minute:"2-digit"
    });
}

/* ==========================================================
   SEARCH & NAVIGATION
========================================================== */

function initializeSearch() {
    const input = document.getElementById("projectSearch");
    if (!input) return;

    input.addEventListener("input", function () {
        const keyword = input.value.toLowerCase().trim();
        if (!keyword) {
            renderMonitoringProjects();
            return;
        }

        const filtered = monitoringProjects.filter(function (project) {
            const projectName = getProjectName(project).toLowerCase();
            const client = getClient(project).toLowerCase();
            const pic = getPIC(project).toLowerCase();
            return projectName.includes(keyword) || client.includes(keyword) || pic.includes(keyword);
        });
        renderMonitoringProjects(filtered);
    });
}

function initializeNavigation() {
    const backProjects = document.getElementById("backToProjects");
    const backParticipants = document.getElementById("backToParticipants");

    if (backProjects) {
        backProjects.addEventListener("click", function () { showProjects(); });
    }

    if (backParticipants) {
        backParticipants.addEventListener("click", function () {
            if (selectedProject) {
                const detailCard = document.getElementById("participantDetailCard");
                const participantCard = document.getElementById("participantCard");
                if (detailCard) detailCard.classList.remove("show");
                if (participantCard) participantCard.classList.add("show");
                window.scrollTo({ top:0, behavior:"smooth" });
            }
        });
    }
}

function showProjects() {
    selectedProject = null;
    selectedParticipant = null;

    const participantCard = document.getElementById("participantCard");
    const detailCard = document.getElementById("participantDetailCard");
    if (participantCard) participantCard.classList.remove("show");
    if (detailCard) detailCard.classList.remove("show");

    const projectCard = document.querySelector(".card:not(.detail-card):not(.participant-detail)");
    if (projectCard) projectCard.style.display = "";

    const input = document.getElementById("projectSearch");
    if (input) input.value = "";

    renderMonitoringProjects();
    window.scrollTo({ top:0, behavior:"smooth" });
}

function initializeUserRole() {
    const userRole = document.getElementById("userRole");
    const userLabel = document.getElementById("userLabel");
    if (!userRole || !userLabel) return;

    let storedUser = null;
    try {
        storedUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user") || "null");
    } catch (error) { storedUser = null; }
    if (!storedUser) return;

    let role = storedUser.role || storedUser.userRole || storedUser.type || storedUser.userType || "";
    role = String(role).toLowerCase();

    if (role.includes("admin")) {
        userRole.textContent = "Administrator";
        userLabel.textContent = "Admin";
    } else if (role.includes("client")) {
        userRole.textContent = "Client";
        userLabel.textContent = "Client";
    } else if (role.includes("asesor") || role.includes("assessor")) {
        userRole.textContent = "Asesor";
        userLabel.textContent = "Asesor";
    }
}

function initializeLogout() {
    const button = document.getElementById("logoutBtn");
    if (!button) return;

    button.addEventListener("click", function () {
        const confirmed = confirm("Apakah Anda yakin ingin logout?");
        if (!confirmed) return;
        localStorage.removeItem("currentUser");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = value === undefined || value === null || String(value).trim() === "" ? "-" : value;
}

function escapeHTML(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function backToProjects() {
    window.location.href = "view-monitoring.html";
}

function backToParticipants(projectId) {
    if (!projectId) {
        const params = new URLSearchParams(window.location.search);
        projectId = params.get("projectId");
    }
    if (!projectId) {
        window.location.href = "view-monitoring.html";
        return;
    }
    window.location.href = `view-monitoring.html?projectId=${encodeURIComponent(projectId)}`;
}