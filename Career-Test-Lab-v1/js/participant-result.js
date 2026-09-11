/* ==========================================================
   TALENTSCOPE — PARTICIPANT RESULT PAGE
   FIXED VERSION
   - Judul assessment spesifik (bukan "Assessment 1/2/3")
   - Routing ke report viewer spesifik (VAP/LSJT/MSJT)
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {
    loadParticipantResult();
});

/* ==========================================================
   KATALOG FALLBACK
   ========================================================== */
const ASSESSMENT_FALLBACK = {
    "VAP": {
        name: "Work Performance & Sustained Attention Assessment",
        route: "vap_report.html"
    },
    "LSJT": {
        name: "Leadership Situational Judgment Test",
        route: "sjt_report.html"
    },
    "MSJT": {
        name: "Managerial Situational Judgment Test",
        route: "msjt_report.html"
    },
    "DISC": {
        name: "DISC Personality Assessment",
        route: "test-result.html"
    },
    "PAPI": {
        name: "PAPI Kostick",
        route: "test-result.html"
    }
};

function resolveAssessmentInfo(assessment, index) {
    // Coba ekstrak nama dari berbagai field
    let rawName = "";
    let rawCode = "";

    if (typeof assessment === "string") {
        rawName = assessment;
        rawCode = assessment;
    } else if (assessment && typeof assessment === "object") {
        // PENTING: cek assessment_name (snake_case) DULU — ini yang dari Supabase
        rawName = String(
            assessment.assessment_name ||
            assessment.assessmentName ||
            assessment.name ||
            assessment.title ||
            assessment.testName ||
            assessment.label ||
            ""
        ).trim();

        rawCode = String(
            assessment.assessment_code ||
            assessment.assessmentCode ||
            assessment.code ||
            ""
        ).trim().toUpperCase();
    }

    // Cek apakah rawName generic ("Assessment 1", "Assessment 2", dll)
    const isGeneric = !rawName || /^assessment\s*\d*$/i.test(rawName);

    // Kalau generic, coba fallback dari kode
    if (isGeneric && rawCode && ASSESSMENT_FALLBACK[rawCode]) {
        rawName = ASSESSMENT_FALLBACK[rawCode].name;
    }

    // Kalau masih generic, coba fallback dari index
    if (isGeneric) {
        const idxFallback = [
            { name: "Work Performance & Sustained Attention Assessment", route: "vap_report.html" },
            { name: "Managerial Situational Judgment Test", route: "msjt_report.html" },
            { name: "Leadership Situational Judgment Test", route: "sjt_report.html" }
        ][index];
        if (idxFallback) rawName = idxFallback.name;
    }

    // Kalau masih kosong, pakai generic terakhir
    if (!rawName) rawName = `Assessment ${index + 1}`;

    // Tentukan route
    let route = "test-result.html";
    if (rawCode && ASSESSMENT_FALLBACK[rawCode] && ASSESSMENT_FALLBACK[rawCode].route) {
        route = ASSESSMENT_FALLBACK[rawCode].route;
    } else {
        // Deteksi dari nama
        const lowerName = rawName.toLowerCase();
        if (lowerName.includes("vap") || lowerName.includes("work performance") || lowerName.includes("sustained attention")) {
            route = "vap_report.html";
        } else if (lowerName.includes("managerial")) {
            route = "msjt_report.html";
        } else if (lowerName.includes("leadership")) {
            route = "sjt_report.html";
        }
    }

    return { name: rawName, code: rawCode, route: route };
}


/* ==========================================================
   LOAD PARTICIPANT RESULT
========================================================== */

function loadParticipantResult() {

    const params = new URLSearchParams(window.location.search);

    const projectId = params.get("projectId");
    const participantId = params.get("participantId");

    console.log("=== PARTICIPANT RESULT DEBUG ===");
    console.log("Project ID:", projectId);
    console.log("Participant ID:", participantId);

    if (!projectId || !participantId) {
        alert("Data project atau peserta tidak ditemukan.");
        return;
    }

    let projects = [];
    try {
        const raw = localStorage.getItem("talentscope_projects");
        projects = raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error("Failed to load projects:", error);
        return;
    }

    const project = projects.find(function (item) {
        return String(item.id) === String(projectId);
    });

    if (!project) {
        alert("Project tidak ditemukan.");
        return;
    }

    const participants = Array.isArray(project.participants) ? project.participants : [];

    const participant = participants.find(function (item) {
        return String(item.id || item.participantId) === String(participantId);
    });

    if (!participant) {
        alert("Peserta tidak ditemukan.");
        return;
    }

    const projectName =
        project.projectName ||
        project.name ||
        project.project ||
        "-";

    const assessmentDate =
        project.start_date ||
        project.startDate ||
        project.start ||
        project.assessmentDate ||
        project.schedule_start ||
        project.date ||
        "-";

    const participantName =
        participant.name ||
        participant.fullName ||
        "-";

    const participantNameElement = document.getElementById("participantName");
    if (participantNameElement) participantNameElement.textContent = participantName;

    const projectNameElement = document.getElementById("projectName");
    if (projectNameElement) projectNameElement.textContent = projectName;

    const assessmentDateElement = document.getElementById("assessmentDate");
    if (assessmentDateElement) {
        assessmentDateElement.textContent = formatParticipantDate(assessmentDate);
    }

    renderParticipantTests(project, participant);
    setupCombinedResultButton(project.id, participant.id || participant.participantId);
}


/* ==========================================================
   RENDER TEST LIST
========================================================== */

function renderParticipantTests(project, participant) {

    const testList = document.getElementById("testList");
    if (!testList) return;

    const assessments = Array.isArray(project.assessments)
        ? project.assessments
        : (Array.isArray(project.assessment) ? project.assessment : []);

    if (assessments.length === 0) {
        testList.innerHTML = `
            <div class="empty-test">
                <i class="fa-solid fa-circle-info"></i>
                <span>Belum ada assessment yang tersedia untuk project ini.</span>
            </div>
        `;
        return;
    }

    testList.innerHTML = "";

    assessments.forEach(function (assessment, index) {

        const info = resolveAssessmentInfo(assessment, index);

        testList.innerHTML += `
            <div class="test-result-item">
                <div class="test-result-info">
                    <div class="test-icon">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                    <div>
                        <strong>${escapeHtml(info.name)}</strong>
                        <span>Assessment Result</span>
                    </div>
                </div>

                <button
                    type="button"
                    class="test-view-btn"
                    onclick="openSingleTestResult(
                        '${escapeHtml(project.id)}',
                        '${escapeHtml(participant.id || participant.participantId)}',
                        '${index}',
                        '${escapeHtml(info.route)}',
                        '${escapeHtml(info.code)}'
                    )"
                >
                    <i class="fa-solid fa-eye"></i>
                    View Result
                </button>
            </div>
        `;
    });
}


/* ==========================================================
   OPEN SINGLE TEST RESULT
   Route ke report viewer spesifik berdasarkan tipe assessment
========================================================== */

function openSingleTestResult(
    projectId,
    participantId,
    assessmentIndex,
    route,
    assessmentCode
) {

    // Default route kalau tidak ada
    let targetUrl = route || "test-result.html";

    const params =
        "?projectId=" + encodeURIComponent(projectId) +
        "&participantId=" + encodeURIComponent(participantId) +
        "&assessmentIndex=" + encodeURIComponent(assessmentIndex);

    // Report viewer spesifik tidak butuh assessmentIndex
    // (mereka sudah tahu assessment-nya dari konteks)
    let finalUrl;
    if (targetUrl === "vap_report.html" ||
        targetUrl === "sjt_report.html" ||
        targetUrl === "msjt_report.html") {

        finalUrl = targetUrl +
            "?projectId=" + encodeURIComponent(projectId) +
            "&participantId=" + encodeURIComponent(participantId);

    } else {
        // Legacy test-result.html — kirim semua parameter
        finalUrl = targetUrl + params +
            "&assessmentCode=" + encodeURIComponent(assessmentCode || "");
    }

    console.log("[PARTICIPANT-RESULT] Opening:", finalUrl);

    window.open(finalUrl, "_blank");
}


/* ==========================================================
   SETUP COMBINED RESULT BUTTON
========================================================== */

function setupCombinedResultButton(projectId, participantId) {

    const btn = document.getElementById("combinedResultBtn");
    if (!btn) return;

    btn.onclick = function () {
        window.location.href =
            "combined-result.html?projectId=" +
            encodeURIComponent(projectId) +
            "&participantId=" +
            encodeURIComponent(participantId);
    };
}


/* ==========================================================
   HELPERS
========================================================== */

function escapeHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const formatParticipantDate = function (date) {
    if (!date || date === "-") return "-";
    const d = new Date(date + "T00:00:00");
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};