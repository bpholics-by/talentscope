/* ==========================================================
   TALENTSCOPE — PARTICIPANT RESULT PAGE
   CLEAN FULL VERSION
   ----------------------------------------------------------
   Fitur:
   - Auto-load dari Supabase (fresh data)
   - Fallback ke localStorage
   - Normalize UUID assessment_id → nama & kode teks
   - Routing ke report viewer spesifik (VAP/LSJT/MSJT)
   ========================================================== */

/* ==========================================================
   MASTER DATA — UUID ke Nama/Kode Assessment
   ========================================================== */
const UUID_TO_ASSESSMENT = {
    "327a8cde-c51c-4524-aae1-4d54402d772a": {
        name: "Managerial Situational Judgment Test",
        code: "MSJT",
        route: "msjt_report.html"
    },
    "e3026a3d-15f7-4189-b25e-8cae12968558": {
        name: "Leadership Situational Judgment Test",
        code: "LSJT",
        route: "sjt_report.html"
    },
    "8b0209ef-1b16-414c-b8c1-cd0e0449e7d7": {
        name: "Work Performance & Sustained Attention Assessment",
        code: "VAP",
        route: "vap_report.html"
    },
    "6266a366-47c4-4d5c-9f0f-6a2984227ed1": {
        name: "DISC Personality",
        code: "DISC",
        route: "test-result.html"
    },
    "d8408a0f-55c0-4fc9-941e-bb6d48292b31": {
        name: "PAPI Kostick",
        code: "PAPI",
        route: "test-result.html"
    }
};

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
        name: "DISC Personality",
        route: "test-result.html"
    },
    "PAPI": {
        name: "PAPI Kostick",
        route: "test-result.html"
    }
};

/* ==========================================================
   LOAD PARTICIPANT RESULT — Fungsi Utama
   ========================================================== */
async function loadParticipantResult() {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("projectId");
    const participantId = params.get("participantId");

    if (!projectId || !participantId) {
        alert("Data project atau peserta tidak ditemukan.");
        return;
    }

    console.log("=== PARTICIPANT RESULT DEBUG ===");
    console.log("Project ID:", projectId);
    console.log("Participant ID:", participantId);

    let project = null;
    let supabaseResults = [];

    // ==========================================================
    // PRIORITAS 1: Ambil dari Supabase
    // ==========================================================
    try {
        const sb = window.supabaseClient || window.supabase;

        if (sb && typeof sb.from === "function") {
            const { data: projData, error: projErr } = await sb
                .from("projects")
                .select("*")
                .eq("id", projectId)
                .single();

            if (projData && !projErr) {
                project = projData;
                console.log("[PARTICIPANT-RESULT] Project dari Supabase");
            }

            const { data: resultsData } = await sb
                .from("ts_results")
                .select("*")
                .eq("project_id", projectId)
                .eq("participant_id", participantId);

            if (Array.isArray(resultsData)) {
                supabaseResults = resultsData.map(r => r.data || r);
                console.log("[PARTICIPANT-RESULT] Results dari Supabase:", supabaseResults.length);
            }
        }
    } catch (e) {
        console.warn("[PARTICIPANT-RESULT] Supabase fetch gagal:", e);
    }

    // ==========================================================
    // FALLBACK: Ambil dari localStorage
    // ==========================================================
    if (!project) {
        let projects = [];
        try {
            const raw = localStorage.getItem("talentscope_projects");
            projects = raw ? JSON.parse(raw) : [];
        } catch (error) {
            console.error("Failed to load projects:", error);
            return;
        }

        project = projects.find(function (item) {
            return String(item.id) === String(projectId);
        });

        if (project) {
            console.log("[PARTICIPANT-RESULT] Project dari localStorage (fallback)");
        }

        if (supabaseResults.length === 0) {
            try {
                const allResults = JSON.parse(localStorage.getItem("talent_scope_results") || "[]");
                supabaseResults = allResults.filter(r =>
                    String(r.participantId) === String(participantId) &&
                    String(r.projectId) === String(projectId)
                );
                console.log("[PARTICIPANT-RESULT] Results dari localStorage:", supabaseResults.length);
            } catch (e) {}
        }
    }

    if (!project) {
        alert("Project tidak ditemukan.");
        return;
    }

    // ==========================================================
    // Cari participant
    // ==========================================================
    const participants = Array.isArray(project.participants) ? project.participants : [];
    let participant = participants.find(function (item) {
        return String(item.id || item.participantId) === String(participantId);
    });

    if (!participant) {
        participant = { id: participantId, participantId: participantId, name: "-" };
        console.warn("[PARTICIPANT-RESULT] Participant tidak ditemukan, pakai fallback");
    }

    // ==========================================================
    // Render info peserta
    // ==========================================================
    const projectName = project.projectName || project.name || project.project || "-";
    // PATCH: Format tanggal dari Supabase (buang bagian waktu)
let assessmentDate = project.start_date || project.startDate || project.start || "-";

// Kalau format ISO (ada T), ambil bagian tanggal saja
if (assessmentDate && typeof assessmentDate === "string" && assessmentDate.includes("T")) {
    assessmentDate = assessmentDate.split("T")[0];  // "2026-09-11"
}
    const participantName = participant.name || participant.fullName || "-";

    const participantNameEl = document.getElementById("participantName");
    if (participantNameEl) participantNameEl.textContent = participantName;

    const projectNameEl = document.getElementById("projectName");
    if (projectNameEl) projectNameEl.textContent = projectName;

    const assessmentDateEl = document.getElementById("assessmentDate");
    if (assessmentDateEl) {
        assessmentDateEl.textContent = formatParticipantDate(assessmentDate);
    }

    // ==========================================================
    // Render tests
    // ==========================================================
    renderParticipantTestsFromSupabase(project, participant, supabaseResults);

    setupCombinedResultButton(projectId, participantId);
}

/* ==========================================================
   AMBIL MASTER ASSESSMENTS dari localStorage
   ========================================================== */
function getMasterAssessments() {
    try {
        const raw = localStorage.getItem("assessments");
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

/* ==========================================================
   NORMALIZE ASSESSMENT — Inti Fix UUID
   ----------------------------------------------------------
   Cek semua field yang mungkin berisi UUID, map ke nama/kode.
   ========================================================== */
function normalizeAssessment(assessment, index, masterAssessments) {
    // Kumpulkan semua kemungkinan nilai untuk dicek
    const candidateFields = [
        assessment.assessment_id,
        assessment.assessmentId,
        assessment.id,
        assessment.code,
        assessment.assessment_code,
        assessment.assessmentCode,
        assessment.name,
        assessment.assessment_name,
        assessment.assessmentName,
        assessment.title
    ];

    // 1. Cek apakah ada yang match UUID_TO_ASSESSMENT
    for (let i = 0; i < candidateFields.length; i++) {
        const val = String(candidateFields[i] || "").trim().toLowerCase();
        if (val && UUID_TO_ASSESSMENT[val]) {
            const mapped = UUID_TO_ASSESSMENT[val];
            console.log("[UUID MAP]", val, "→", mapped.code);
            return {
                name: mapped.name,
                code: mapped.code,
                route: mapped.route
            };
        }
    }

    // 2. Cek master assessments dari localStorage
    const assessmentId = String(
        assessment.assessment_id ||
        assessment.assessmentId ||
        assessment.id ||
        ""
    ).trim().toLowerCase();

    if (assessmentId && Array.isArray(masterAssessments) && masterAssessments.length > 0) {
        const master = masterAssessments.find(m =>
            String(m.id || "").trim().toLowerCase() === assessmentId
        );
        if (master) {
            const code = String(master.assessment_code || master.code || "").trim();
            const name = String(master.assessment_name || master.name || "").trim();
            if (code && name) {
                console.log("[MASTER LOOKUP]", assessmentId, "→", code);
                return {
                    name: name,
                    code: code,
                    route: routeByCode(code)
                };
            }
        }
    }

    // 3. Fallback ke resolveAssessmentInfo biasa
    return resolveAssessmentInfo(assessment, index);
}

/* ==========================================================
   RENDER TESTS
   ========================================================== */
function renderParticipantTestsFromSupabase(project, participant, supabaseResults) {
    const testList = document.getElementById("testList");
    if (!testList) return;

    const masterAssessments = getMasterAssessments();

    const projectAssessments = Array.isArray(project.assessments)
        ? project.assessments
        : (Array.isArray(project.assessment) ? project.assessment : []);

    if (projectAssessments.length === 0 && supabaseResults.length === 0) {
        testList.innerHTML = `
            <div class="empty-test">
                <i class="fa-solid fa-circle-info"></i>
                <span>Belum ada assessment yang tersedia untuk project ini.</span>
            </div>
        `;
        return;
    }

    let items = [];

    if (projectAssessments.length > 0) {
        items = projectAssessments.map(function (assessment, index) {
            const info = normalizeAssessment(assessment, index, masterAssessments);

            const result = supabaseResults.find(function (r) {
                const rIndex = String(r.assessmentIndex ?? "");
                const rCode = String(r.assessmentCode || "").toLowerCase();
                const targetCode = String(info.code || "").toLowerCase();
                return rIndex === String(index) ||
                       (targetCode && rCode === targetCode);
            });

            return {
                info: info,
                index: index,
                hasResult: !!result
            };
        });
    } else {
        items = supabaseResults.map(function (r, i) {
            let code = String(r.assessmentCode || r.assessment_code || "").toLowerCase();
            let name = r.assessmentName || r.assessment_name || "";
            let route = routeByCode(code);

            const codeLower = code.trim().toLowerCase();
            if (UUID_TO_ASSESSMENT[codeLower]) {
                const mapped = UUID_TO_ASSESSMENT[codeLower];
                name = mapped.name;
                code = mapped.code;
                route = mapped.route;
            }

            const nameLower = String(name).trim().toLowerCase();
            if (UUID_TO_ASSESSMENT[nameLower]) {
                const mapped = UUID_TO_ASSESSMENT[nameLower];
                name = mapped.name;
                code = mapped.code;
                route = mapped.route;
            }

            if (!name) name = code.toUpperCase();

            return {
                info: { name: name, code: code.toUpperCase(), route: route },
                index: Number(r.assessmentIndex ?? r.assessment_index ?? i),
                hasResult: true
            };
        });
    }

    testList.innerHTML = "";

    items.forEach(function (item) {
        const info = item.info;
        testList.innerHTML += `
            <div class="test-result-item">
                <div class="test-result-info">
                    <div class="test-icon">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                    <div>
                        <strong>${escapeHtml(info.name)}</strong>
                        <span>${item.hasResult ? "✓ Hasil tersedia" : "Belum dikerjakan"}</span>
                    </div>
                </div>
                <button
                    type="button"
                    class="test-view-btn"
                    onclick="openSingleTestResult(
                        '${escapeHtml(project.id)}',
                        '${escapeHtml(participant.id || participant.participantId)}',
                        '${item.index}',
                        '${escapeHtml(info.route)}',
                        '${escapeHtml(info.code)}'
                    )"
                    ${item.hasResult ? "" : "disabled"}
                >
                    <i class="fa-solid fa-eye"></i>
                    ${item.hasResult ? "View Result" : "Belum Ada"}
                </button>
            </div>
        `;
    });
}

/* ==========================================================
   ROUTE BY CODE
   ========================================================== */
function routeByCode(code) {
    const c = String(code || "").toLowerCase();
    if (c.includes("msjt")) return "msjt_report.html";
    if (c.includes("lsjt")) return "sjt_report.html";
    if (c.includes("vap")) return "vap_report.html";
    if (c.includes("disc")) return "test-result.html";
    if (c.includes("papi")) return "test-result.html";
    return "test-result.html";
}

/* ==========================================================
   RESOLVE ASSESSMENT INFO
   ========================================================== */
function resolveAssessmentInfo(assessment, index) {
    let rawName = "";
    let rawCode = "";

    if (typeof assessment === "string") {
        rawName = assessment;
        rawCode = assessment;
    } else if (assessment && typeof assessment === "object") {
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

    const isGeneric = !rawName || /^assessment\s*\d*$/i.test(rawName);

    if (isGeneric && rawCode && ASSESSMENT_FALLBACK[rawCode]) {
        rawName = ASSESSMENT_FALLBACK[rawCode].name;
    }

    if (isGeneric) {
        const idxFallback = [
            { name: "Work Performance & Sustained Attention Assessment", route: "vap_report.html" },
            { name: "Managerial Situational Judgment Test", route: "msjt_report.html" },
            { name: "Leadership Situational Judgment Test", route: "sjt_report.html" },
            { name: "DISC Personality", route: "test-result.html" },
            { name: "PAPI Kostick", route: "test-result.html" }
        ][index];
        if (idxFallback) rawName = idxFallback.name;
    }

    if (!rawName) rawName = "Assessment " + (index + 1);

    let route = "test-result.html";
    if (rawCode && ASSESSMENT_FALLBACK[rawCode] && ASSESSMENT_FALLBACK[rawCode].route) {
        route = ASSESSMENT_FALLBACK[rawCode].route;
    } else {
        const lowerName = rawName.toLowerCase();
        if (lowerName.includes("vap") || lowerName.includes("work performance") || lowerName.includes("sustained attention")) {
            route = "vap_report.html";
        } else if (lowerName.includes("managerial")) {
            route = "msjt_report.html";
        } else if (lowerName.includes("leadership")) {
            route = "sjt_report.html";
        } else if (lowerName.includes("disc")) {
            route = "test-result.html";
        } else if (lowerName.includes("papi") || lowerName.includes("kostick")) {
            route = "test-result.html";
        }
    }

    return { name: rawName, code: rawCode, route: route };
}

/* ==========================================================
   OPEN SINGLE TEST RESULT
   ========================================================== */
function openSingleTestResult(projectId, participantId, assessmentIndex, route, assessmentCode) {
    let targetUrl = route || "test-result.html";
    let finalUrl;

    if (targetUrl === "vap_report.html" ||
        targetUrl === "sjt_report.html" ||
        targetUrl === "msjt_report.html") {
        finalUrl = targetUrl +
            "?projectId=" + encodeURIComponent(projectId) +
            "&participantId=" + encodeURIComponent(participantId);
    } else {
        // FIX: Kirim assessmentCode (teks) sebagai identifier utama
        // assessmentIndex tetap dikirim untuk backward compatibility
        finalUrl = targetUrl +
            "?projectId=" + encodeURIComponent(projectId) +
            "&participantId=" + encodeURIComponent(participantId) +
            "&assessmentCode=" + encodeURIComponent(assessmentCode || "") +
            "&assessmentIndex=" + encodeURIComponent(assessmentIndex);
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
    const raw = String(date).trim();
    
    // Coba parse langsung dulu (kalau format ISO)
    let d = new Date(raw);
    
    // Kalau gagal, coba tambah T00:00:00 (untuk format "YYYY-MM-DD")
    if (isNaN(d.getTime()) && !raw.includes("T")) {
        d = new Date(raw + "T00:00:00");
    }
    
    if (isNaN(d.getTime())) return raw;
    
    return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

/* ==========================================================
   AUTO-INIT
   ========================================================== */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
        loadParticipantResult();
    });
} else {
    loadParticipantResult();
}