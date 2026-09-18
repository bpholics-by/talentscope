/* ==========================================================
   CAREER TEST LAB — COMBINED RESULT PAGE
   FULL FIX VERSION (v4)
   ----------------------------------------------------------
   Perubahan dari v3:
   - Fix bug route: prioritas cek assessment_id (UUID) dulu
   - Hapus assessment.id dari candidateFields (itu UUID row, bukan assessment)
   - Tambah deteksi dari assessment_name (fallback)
   - Log lebih jelas untuk debug
========================================================== */

document.addEventListener("DOMContentLoaded", function () {
    loadCombinedResult();
});

/* ==========================================================
   UUID MAP — mapping assessment_id → nama & kode
   ========================================================== */
const COMBINED_UUID_MAP = {
    "5976eef2-e7a7-43a6-8e95-90f556f9a257": { name: "Tes Penalaran", code: "TPDK", route: "tpdk_report.html" },
    "327a8cde-c51c-4524-aae1-4d54402d772a": { name: "Managerial Situational Judgment Test", code: "MSJT", route: "msjt_report.html" },
    "e3026a3d-15f7-4189-b25e-8cae12968558": { name: "Leadership Situational Judgment Test", code: "LSJT", route: "sjt_report.html" },
    "8b0209ef-1b16-414c-b8c1-cd0e0449e7d7": { name: "Work Performance & Sustained Attention Assessment", code: "VAP", route: "vap_report.html" },
    "6266a366-47c4-4d5c-9f0f-6a2984227ed1": { name: "DISC Personality", code: "DISC", route: "test-result.html" },
    "d8408a0f-55c0-4fc9-941e-bb6d48292b31": { name: "PAPI Kostick", code: "PAPI", route: "test-result.html" }
};

/* ==========================================================
   ROUTE BY CODE
   ========================================================== */
function routeCombinedByCode(code) {
    var c = String(code || "").trim().toLowerCase();
    if (c.includes("tpdk") || c.includes("penalaran")) return "tpdk_report.html";
    if (c.includes("msjt") || c.includes("managerial")) return "msjt_report.html";
    if (c.includes("lsjt") || c.includes("leadership")) return "sjt_report.html";
    if (c.includes("vap") || c.includes("performance") || c.includes("sustained")) return "vap_report.html";
    if (c.includes("disc")) return "test-result.html";
    if (c.includes("papi") || c.includes("kostick")) return "test-result.html";
    return "test-result.html";
}

/* ==========================================================
   ICON BY CODE
   ========================================================== */
function getIconFor(code) {
    var c = String(code || "").trim().toLowerCase();
    if (c.includes("tpdk") || c.includes("penalaran")) return "fa-brain";
    if (c.includes("msjt") || c.includes("managerial")) return "fa-list-check";
    if (c.includes("lsjt") || c.includes("leadership")) return "fa-users";
    if (c.includes("vap") || c.includes("performance")) return "fa-eye";
    if (c.includes("disc")) return "fa-brain";
    if (c.includes("papi") || c.includes("kostick")) return "fa-user-tag";
    return "fa-clipboard-check";
}

/* ==========================================================
   LOAD COMBINED RESULT
   ========================================================== */
async function loadCombinedResult() {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("projectId");
    const participantId = params.get("participantId");

    console.log("=== COMBINED RESULT ===");
    console.log("Project ID:", projectId);
    console.log("Participant ID:", participantId);

    if (!projectId || !participantId) {
        showCombinedMessage("Data project atau peserta tidak ditemukan.");
        return;
    }

    let project = null;

    try {
        const sb = window.supabaseClient || window.supabase;
        if (sb && typeof sb.from === "function") {
            console.log("[COMBINED] Query Supabase...");

            const { data: projData, error: projErr } = await sb
                .from("projects")
                .select("*")
                .eq("id", projectId)
                .single();

            if (projData && !projErr) {
                project = projData;
            }

            if (project) {
                const { data: relations } = await sb
                    .from("project_participants")
                    .select("*")
                    .eq("project_id", projectId);

                if (Array.isArray(relations) && relations.length > 0) {
                    const participantIds = relations.map(r => r.participant_id).filter(Boolean);
                    const { data: participants } = await sb
                        .from("participants")
                        .select("*")
                        .in("id", participantIds);

                    if (Array.isArray(participants)) {
                        project.participants = participants.map(p => {
                            const rawData = p.raw_data || {};
                            return Object.assign({}, rawData, p);
                        });
                    }
                }

                const { data: assessmentRelations } = await sb
                    .from("project_assessments")
                    .select("*")
                    .eq("project_id", projectId)
                    .order("sort_order", { ascending: true });

                if (Array.isArray(assessmentRelations) && assessmentRelations.length > 0) {
                    project.assessments = assessmentRelations;
                    console.log("[COMBINED] Assessments dari Supabase:", assessmentRelations.length);
                }
            }
        }
    } catch (e) {
        console.warn("[COMBINED] Supabase fetch gagal:", e);
    }

    if (!project) {
        try {
            const projects = JSON.parse(localStorage.getItem("talentscope_projects") || "[]");
            project = projects.find(item => String(item.id) === String(projectId));
            if (project) console.log("[COMBINED] Project dari localStorage");
        } catch (error) {
            console.error("Gagal baca project:", error);
            showCombinedMessage("Data project gagal dibaca.");
            return;
        }
    }

    if (!project) {
        showCombinedMessage("Project tidak ditemukan.");
        return;
    }

    const participants = Array.isArray(project.participants) ? project.participants : [];
    const participant = participants.find(item =>
        String(item.id || item.participantId) === String(participantId)
    );

    if (!participant) {
        showCombinedMessage("Peserta tidak ditemukan.");
        return;
    }

    const projectName = project.projectName || project.name || project.project || "-";
    const assessmentDate = project.start_date || project.startDate || project.start || "-";
    const participantName = participant.name || participant.fullName || "-";

    const participantElement = document.getElementById("participantName");
    if (participantElement) participantElement.textContent = participantName;

    const projectElement = document.getElementById("projectName");
    if (projectElement) projectElement.textContent = projectName;

    const dateElement = document.getElementById("assessmentDate");
    if (dateElement) dateElement.textContent = formatCombinedDate(assessmentDate);

    let assessments = Array.isArray(project.assessments)
        ? project.assessments
        : (Array.isArray(project.assessment) ? project.assessment : []);

    assessments = assessments.slice().sort(function (a, b) {
        return Number(a.sort_order || 999) - Number(b.sort_order || 999);
    });

    if (assessments.length === 0) {
        try {
            const projects = JSON.parse(localStorage.getItem("talentscope_projects") || "[]");
            const fallbackProject = projects.find(item => String(item.id) === String(projectId));
            if (fallbackProject && Array.isArray(fallbackProject.assessments)) {
                assessments = fallbackProject.assessments.slice().sort(function (a, b) {
                    return Number(a.sort_order || 999) - Number(b.sort_order || 999);
                });
            }
        } catch (e) {}
    }

    console.log("[COMBINED] Total assessments:", assessments.length);

    renderCombinedTests(assessments, projectId, participantId);
}

/* ==========================================================
   RENDER ALL TESTS
   ========================================================== */
async function renderCombinedTests(assessments, projectId, participantId) {
    const container = document.getElementById("combinedDetail") ||
                     document.getElementById("combinedResultContent");
    if (!container) return;

    if (!assessments || assessments.length === 0) {
        showCombinedMessage("Paket assessment kosong.");
        return;
    }

    let masterAssessments = [];
    try {
        const sb = window.supabaseClient || window.supabase;
        if (sb) {
            const { data } = await sb.from("assessments").select("*");
            if (Array.isArray(data)) {
                masterAssessments = data;
                console.log("[COMBINED] Master assessments:", data.length);
            }
        }
    } catch (e) {
        console.warn("[COMBINED] Master assessments fetch gagal:", e);
    }

    if (masterAssessments.length === 0) {
        try {
            masterAssessments = JSON.parse(localStorage.getItem("assessments") || "[]");
        } catch (e) {}
    }

    const sectionsHtml = [];

    for (let i = 0; i < assessments.length; i++) {
        const info = await normalizeCombinedAssessmentAsync(assessments[i], i, masterAssessments);

        const assessmentId = String(
            assessments[i].assessment_id ||
            assessments[i].assessmentId ||
            ""
        ).trim();

        const sortOrderVal = Number(
            assessments[i].sort_order !== undefined
                ? assessments[i].sort_order
                : (assessments[i].assessment_index !== undefined ? assessments[i].assessment_index : i)
        );

        let iframeSrc =
            info.route +
            "?projectId=" + encodeURIComponent(projectId) +
            "&participantId=" + encodeURIComponent(participantId) +
            "&assessmentCode=" + encodeURIComponent(info.code || "") +
            "&embed=1";

        if (assessmentId) {
            iframeSrc += "&assessmentId=" + encodeURIComponent(assessmentId);
        }

        if (!info.route.includes("report")) {
            iframeSrc += "&assessmentIndex=" + encodeURIComponent(sortOrderVal);
        }

        console.log("[COMBINED] Section " + i + ": " + info.name + " (" + info.code + ") → " + info.route);
        console.log("  UUID:", assessmentId, "| sort_order:", sortOrderVal);

        sectionsHtml.push(`
            <section class="combined-section" id="combined-test-${i}">
                <div class="combined-section-head">
                    <div class="combined-section-title">
                        <div class="report-item-icon">
                            <i class="fa-solid ${getIconFor(info.code)}"></i>
                        </div>
                        <div>
                            <h3>${escapeCombinedHtml(info.name)}</h3>
                            <small>${escapeCombinedHtml(info.code || "Assessment Result")}</small>
                        </div>
                    </div>
                    <div class="combined-section-badge">${i + 1}</div>
                </div>
                <div class="combined-frame-wrap">
                    <div class="combined-frame-loading" id="frame-loading-${i}">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Memuat hasil ${escapeCombinedHtml(info.name)}…
                    </div>
                    <iframe
                        class="combined-frame"
                        id="result-frame-${i}"
                        title="Hasil ${escapeCombinedHtml(info.name)}"
                        src="${escapeCombinedHtml(iframeSrc)}"
                        loading="eager"
                        scrolling="no"
                        data-assessment-index="${i}">
                    </iframe>
                </div>
            </section>
        `);
    }

    container.innerHTML = sectionsHtml.join("");
    bindCombinedFrames();
}

/* ==========================================================
   NORMALIZE ASSESSMENT — v4
   Prioritas:
   1. assessment_id (UUID) → map
   2. result_type
   3. master assessments lookup
   4. Deteksi dari assessment_name (keyword)
   5. Fallback default
   ========================================================== */
async function normalizeCombinedAssessmentAsync(assessment, index, masterAssessments) {

    // ==== PRIORITAS 1: Cek assessment_id (UUID) ====
    const assessmentIdVal = String(
        assessment.assessment_id ||
        assessment.assessmentId ||
        ""
    ).trim().toLowerCase();

    if (assessmentIdVal && COMBINED_UUID_MAP[assessmentIdVal]) {
        const mapped = COMBINED_UUID_MAP[assessmentIdVal];
        console.log("[COMBINED] ✅ UUID match:", assessmentIdVal, "→", mapped.code);
        return { name: mapped.name, code: mapped.code, route: mapped.route };
    }

    // ==== PRIORITAS 2: Cek result_type ====
    const resultType = String(
        assessment.result_type ||
        assessment.resultType ||
        ""
    ).trim().toUpperCase();

    if (resultType && ["MSJT", "LSJT", "VAP", "DISC", "PAPI", "TPDK"].indexOf(resultType) !== -1) {
        const mapped = Object.values(COMBINED_UUID_MAP).find(v => v.code === resultType);
        const name = (mapped && mapped.name) ||
                     assessment.assessment_name ||
                     assessment.name ||
                     resultType;
        console.log("[COMBINED] ✅ result_type:", resultType);
        return {
            name: name,
            code: resultType,
            route: routeCombinedByCode(resultType)
        };
    }

    // ==== PRIORITAS 3: Master assessments lookup ====
    if (assessmentIdVal && Array.isArray(masterAssessments)) {
        const master = masterAssessments.find(m =>
            String(m.id || "").toLowerCase() === assessmentIdVal
        );
        if (master) {
            const code = String(master.assessment_code || master.code || "").trim().toUpperCase();
            const name = String(master.assessment_name || master.name || "").trim();
            if (code) {
                console.log("[COMBINED] ✅ Master lookup:", assessmentIdVal, "→", code);
                return {
                    name: name || code,
                    code: code,
                    route: routeCombinedByCode(code)
                };
            }
        }
    }

    // ==== PRIORITAS 4: Deteksi dari assessment_name (keyword) ====
    const nameFromData = String(
        assessment.assessment_name ||
        assessment.assessmentName ||
        assessment.name ||
        ""
    ).trim();

    if (nameFromData) {
        const upper = nameFromData.toUpperCase();
        let detectedCode = "";

        if (upper.indexOf("TPDK") !== -1 || upper.indexOf("PENALARAN") !== -1) detectedCode = "TPDK";
        else if (upper.indexOf("MSJT") !== -1 || upper.indexOf("MANAGERIAL") !== -1) detectedCode = "MSJT";
        else if (upper.indexOf("LSJT") !== -1 || upper.indexOf("LEADERSHIP") !== -1) detectedCode = "LSJT";
        else if (upper.indexOf("VAP") !== -1 || upper.indexOf("WORK PERFORMANCE") !== -1 || upper.indexOf("SUSTAINED") !== -1) detectedCode = "VAP";
        else if (upper.indexOf("DISC") !== -1) detectedCode = "DISC";
        else if (upper.indexOf("PAPI") !== -1 || upper.indexOf("KOSTICK") !== -1) detectedCode = "PAPI";

        if (detectedCode) {
            console.log("[COMBINED] ✅ Name detection:", detectedCode, "dari:", nameFromData);
            return {
                name: nameFromData,
                code: detectedCode,
                route: routeCombinedByCode(detectedCode)
            };
        }
    }

    // ==== PRIORITAS 5: Fallback default ====
    const fallbackName = assessment.assessment_name ||
                        assessment.assessmentName ||
                        assessment.name ||
                        assessment.title ||
                        "Assessment " + (index + 1);

    console.warn("[COMBINED] ⚠ Fallback default:", fallbackName);
    return {
        name: fallbackName,
        code: "",
        route: "test-result.html"
    };
}

/* ==========================================================
   BIND IFRAMES — AUTO RESIZE
   ========================================================== */
function bindCombinedFrames() {
    document.querySelectorAll(".combined-frame").forEach(function (frame) {
        frame.addEventListener("load", function () {
            const loading = document.getElementById("frame-loading-" + frame.dataset.assessmentIndex);
            if (loading) loading.style.display = "none";

            resizeCombinedFrame(frame);

            [100, 300, 600, 1000, 1500, 2500, 4000, 6000].forEach(function (ms) {
                setTimeout(function () { resizeCombinedFrame(frame); }, ms);
            });

            try {
                const doc = frame.contentDocument;
                if (doc && window.ResizeObserver) {
                    const ro = new ResizeObserver(function () {
                        resizeCombinedFrame(frame);
                    });
                    ro.observe(doc.body || doc.documentElement);
                    frame._combinedResizeObserver = ro;
                }
            } catch (e) {}
        });
    });
}

function resizeCombinedFrame(frame) {
    try {
        var doc = frame.contentDocument;
        if (!doc) return;
        var body = doc.body;
        var root = doc.documentElement;
        if (!body && !root) return;

        if (root) {
            root.style.setProperty("overflow", "hidden", "important");
            root.style.setProperty("height", "auto", "important");
            root.style.setProperty("min-height", "0", "important");
        }
        if (body) {
            body.style.setProperty("overflow", "hidden", "important");
            body.style.setProperty("height", "auto", "important");
            body.style.setProperty("min-height", "0", "important");
            body.style.setProperty("margin", "0", "important");
            body.style.setProperty("padding", "0", "important");
        }

        if (doc.head && !doc.getElementById("__combined_compact_style")) {
            var style = doc.createElement("style");
            style.id = "__combined_compact_style";
            style.textContent = `
                html, body {
                    overflow: hidden !important;
                    height: auto !important;
                    min-height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
                * { scrollbar-width: none !important; }
                .content, .main, .app {
                    padding: 0 !important;
                    margin: 0 !important;
                    min-height: 0 !important;
                }
                .top-back-wrapper,
                .settings-nav-tabs,
                .hero-banner-settings {
                    display: none !important;
                }
                .settings-card-container {
                    padding: 0 !important;
                    margin: 0 !important;
                    border: 0 !important;
                    box-shadow: none !important;
                    background: transparent !important;
                }
                .card-top-flex,
                .card-divider-line {
                    display: none !important;
                }
            `;
            doc.head.appendChild(style);
        }

        requestAnimationFrame(function () {
            var finalHeight = 0;

            var resultContent = doc.getElementById("resultContent");
            if (resultContent) {
                var rcRect = resultContent.getBoundingClientRect();
                if (rcRect.height > 0) {
                    finalHeight = rcRect.bottom;
                }
            }

            if (finalHeight < 100) {
                var maxBottom = 0;
                if (body) {
                    Array.from(body.children).forEach(function (node) {
                        if (/SCRIPT|STYLE|LINK|META|TITLE/.test(node.tagName)) return;
                        var rect = node.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            maxBottom = Math.max(maxBottom, rect.bottom);
                        }
                    });
                }
                finalHeight = maxBottom;
            }

            if (finalHeight < 100) {
                finalHeight = Math.max(
                    body ? body.scrollHeight : 0,
                    root ? root.scrollHeight : 0,
                    200
                );
            }

            var newHeight = Math.min(5000, Math.max(200, Math.ceil(finalHeight + 16)));
            frame.style.height = newHeight + "px";
            frame.setAttribute("height", newHeight);

            var wrapper = frame.closest(".combined-frame-wrap");
            if (wrapper) {
                wrapper.style.height = newHeight + "px";
            }
        });

    } catch (e) {
        console.warn("[COMBINED] resizeCombinedFrame gagal:", e);
        frame.style.height = "600px";
    }
}

/* ==========================================================
   MESSAGE / ERROR
   ========================================================== */
function showCombinedMessage(message) {
    const container = document.getElementById("combinedDetail") ||
                     document.getElementById("combinedResultContent");
    if (!container) return;
    container.innerHTML = `
        <div class="combined-error">
            <strong>${escapeCombinedHtml(message)}</strong>
        </div>
    `;
}

/* ==========================================================
   FORMAT DATE
   ========================================================== */
function formatCombinedDate(date) {
    if (!date || date === "-") return "-";
    const raw = String(date).trim();
    let d = new Date(raw);
    if (isNaN(d.getTime()) && !raw.includes("T")) {
        d = new Date(raw + "T00:00:00");
    }
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("id-ID", {
        day: "2-digit", month: "short", year: "numeric"
    });
}

/* ==========================================================
   ESCAPE HTML
   ========================================================== */
function escapeCombinedHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}