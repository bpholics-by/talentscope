/* ==========================================================
   TALENTSCOPE - TEST RESULT CONTROLLER
   FULL FIX VERSION (v5)
   ----------------------------------------------------------
   Perubahan dari v4:
   - Tambah fallback CARI BY CODE (DISC/PAPI/VAP/MSJT/LSJT/TPDK)
     untuk data lama yang tersimpan di index berbeda
   - Prioritas: UUID → Supabase → by code → by index
   - Log lebih jelas
========================================================== */

document.addEventListener("DOMContentLoaded", function () {
    loadTestResult();
});

/* ==========================================================
   UUID MAP
========================================================== */
const TEST_RESULT_UUID_MAP = {
    "5976eef2-e7a7-43a6-8e95-90f556f9a257": { name: "Tes Penalaran", code: "TPDK" },
    "327a8cde-c51c-4524-aae1-4d54402d772a": { name: "Managerial Situational Judgment Test", code: "MSJT" },
    "e3026a3d-15f7-4189-b25e-8cae12968558": { name: "Leadership Situational Judgment Test", code: "LSJT" },
    "8b0209ef-1b16-414c-b8c1-cd0e0449e7d7": { name: "Work Performance & Sustained Attention Assessment", code: "VAP" },
    "6266a366-47c4-4d5c-9f0f-6a2984227ed1": { name: "DISC Personality", code: "DISC" },
    "d8408a0f-55c0-4fc9-941e-bb6d48292b31": { name: "PAPI Kostick", code: "PAPI" }
};

/* ==========================================================
   MAIN CONTROLLER
========================================================== */
async function loadTestResult() {
    // Tunggu sync dari Supabase (max 1.5 detik)
    await new Promise(function(resolve) {
        var startTime = Date.now();
        var maxWaitMs = 1500;
        var checkInterval = setInterval(function() {
            var projects = [];
            try {
                projects = JSON.parse(localStorage.getItem("talentscope_projects") || "[]");
            } catch (e) {}

            var params = new URLSearchParams(window.location.search);
            var targetPid = params.get("projectId");
            var found = Array.isArray(projects) && projects.some(function(p) {
                return String(p.id) === String(targetPid);
            });

            if (found) {
                clearInterval(checkInterval);
                console.log("[TEST-RESULT] ✅ Project tersedia di localStorage (" + (Date.now() - startTime) + "ms)");
                resolve();
            } else if (Date.now() - startTime >= maxWaitMs) {
                clearInterval(checkInterval);
                console.warn("[TEST-RESULT] Timeout tunggu sync (" + maxWaitMs + "ms)");
                resolve();
            }
        }, 100);
    });

    // ======================================================
    // PARSE URL PARAMS
    // ======================================================
    const params = new URLSearchParams(window.location.search);
    const projectId = String(params.get("projectId") || "").trim();
    const participantId = String(params.get("participantId") || "").trim();
    const assessmentIndexRaw = params.get("assessmentIndex");
    const assessmentCodeFromUrl = String(params.get("assessmentCode") || "").trim().toUpperCase();
    const assessmentIdFromUrl = String(params.get("assessmentId") || "").trim().toLowerCase();
    const isEmbed = params.get("embed") === "1";

    console.log("[TEST-RESULT] URL params:", {
        projectId: projectId,
        participantId: participantId,
        assessmentIndex: assessmentIndexRaw,
        assessmentCode: assessmentCodeFromUrl,
        assessmentId: assessmentIdFromUrl,
        embed: isEmbed
    });

    if (!projectId || !participantId) {
        showResultMessage("Data project atau peserta tidak ditemukan.");
        return;
    }

    const index = Number(assessmentIndexRaw);
    if (!Number.isInteger(index) || index < 0) {
        if (!assessmentCodeFromUrl && !assessmentIdFromUrl) {
            showResultMessage("Assessment index tidak valid.");
            return;
        }
    }

    // ======================================================
    // LOAD PROJECT dari localStorage
    // ======================================================
    const projects = readLocalStorageArray("talentscope_projects");
    let project = projects.find(function (item) {
        return String(item && item.id) === String(projectId);
    });

    if (!project) {
        showResultMessage("Project tidak ditemukan.");
        return;
    }

    // ======================================================
    // GET ASSESSMENTS — sort by sort_order
    // ======================================================
    let projectAssessments = [];

    try {
        const sb = window.supabaseClient || window.supabase;
        if (sb && typeof sb.from === "function") {
            const { data: assessData } = await sb
                .from("project_assessments")
                .select("*")
                .eq("project_id", projectId)
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: true });

            if (Array.isArray(assessData) && assessData.length > 0) {
                projectAssessments = assessData;
                console.log("[TEST-RESULT] Assessments dari Supabase:", assessData.length);
            }
        }
    } catch (e) {
        console.warn("[TEST-RESULT] Supabase fetch gagal:", e);
    }

    if (projectAssessments.length === 0) {
        projectAssessments = Array.isArray(project.assessments) ? project.assessments.slice() : [];
        projectAssessments.sort(function(a, b) {
            return Number(a.sort_order || 999) - Number(b.sort_order || 999);
        });
    }

    // ======================================================
    // PILIH ASSESSMENT
    // PRIORITAS 1: by assessmentId (UUID) dari URL
    // PRIORITAS 2: by assessmentCode dari URL
    // PRIORITAS 3: by assessmentIndex dari URL
    // ======================================================
    let projectAssessment = null;

    if (assessmentIdFromUrl) {
        console.log("[TEST-RESULT] Mencari assessment by UUID:", assessmentIdFromUrl);
        projectAssessment = projectAssessments.find(function (a) {
            var aId = String(a.assessment_id || a.assessmentId || "").trim().toLowerCase();
            return aId === assessmentIdFromUrl;
        });
        if (projectAssessment) {
            console.log("[TEST-RESULT] ✅ Match by UUID:", assessmentIdFromUrl);
        }
    }

    if (!projectAssessment && assessmentCodeFromUrl) {
        console.log("[TEST-RESULT] Mencari assessment by code:", assessmentCodeFromUrl);
        projectAssessment = projectAssessments.find(function (a) {
            var nameUpper = String(a.assessment_name || a.name || "").toUpperCase();
            var codeUpper = String(a.assessment_code || a.code || "").toUpperCase();
            var target = assessmentCodeFromUrl;

            if (codeUpper === target) return true;

            if (target === "DISC" && nameUpper.indexOf("DISC") !== -1) return true;
            if (target === "PAPI" && (nameUpper.indexOf("PAPI") !== -1 || nameUpper.indexOf("KOSTICK") !== -1)) return true;
            if (target === "VAP" && (nameUpper.indexOf("VAP") !== -1 || nameUpper.indexOf("WORK PERFORMANCE") !== -1 || nameUpper.indexOf("SUSTAINED") !== -1)) return true;
            if (target === "MSJT" && (nameUpper.indexOf("MANAGERIAL") !== -1 || nameUpper.indexOf("MSJT") !== -1)) return true;
            if (target === "LSJT" && (nameUpper.indexOf("LEADERSHIP") !== -1 || nameUpper.indexOf("LSJT") !== -1)) return true;
            if (target === "TPDK" && (nameUpper.indexOf("TPDK") !== -1 || nameUpper.indexOf("PENALARAN") !== -1)) return true;

            return false;
        });
        if (projectAssessment) {
            console.log("[TEST-RESULT] ✅ Match by code:", assessmentCodeFromUrl);
        }
    }

    if (!projectAssessment && Number.isInteger(index) && index >= 0) {
        projectAssessment = projectAssessments[index];
        if (projectAssessment) {
            console.log("[TEST-RESULT] ✅ Match by INDEX:", index);
        }
    }

    if (!projectAssessment) {
        showResultMessage("Assessment tidak ditemukan di project.");
        return;
    }

    console.log("[TEST-RESULT] Assessment terpilih:",
                projectAssessment.assessment_name || projectAssessment.assessment_id);

    // ======================================================
    // FIND PARTICIPANT
    // ======================================================
    const participants = Array.isArray(project.participants) ? project.participants : [];
    const participant = participants.find(function (item) {
        return String(item && (item.id || item.participantId)) === String(participantId);
    });

    if (!participant) {
        showResultMessage("Peserta tidak ditemukan.");
        return;
    }

    // ======================================================
    // PAGE INFORMATION
    // ======================================================
    updateElement("participantName",
        participant.name || participant.fullName || participant.participantName || "-");
    updateElement("projectName",
        project.projectName || project.name || project.project || "-");
    updateElement("assessmentDate", formatTestDate(
        project.start_date || project.startDate || project.start || project.assessmentDate || "-"
    ));

    // ======================================================
    // RESOLVE ASSESSMENT CODE & NAME
    // ======================================================
    const assessmentId = String(
        projectAssessment.assessment_id ||
        projectAssessment.assessmentId ||
        ""
    ).trim().toLowerCase();

    const assessmentNameFromData = String(
        projectAssessment.assessment_name ||
        projectAssessment.assessmentName ||
        projectAssessment.name ||
        ""
    ).trim();

    let assessmentCode = "";
    let assessmentName = assessmentNameFromData;

    if (assessmentCodeFromUrl) {
        assessmentCode = assessmentCodeFromUrl;
    }

    if (!assessmentCode && assessmentName) {
        const upper = assessmentName.toUpperCase();
        if (upper.indexOf("DISC") !== -1) assessmentCode = "DISC";
        else if (upper.indexOf("PAPI") !== -1 || upper.indexOf("KOSTICK") !== -1) assessmentCode = "PAPI";
        else if (upper.indexOf("VAP") !== -1 || upper.indexOf("WORK PERFORMANCE") !== -1 || upper.indexOf("SUSTAINED") !== -1) assessmentCode = "VAP";
        else if (upper.indexOf("MANAGERIAL") !== -1 || upper.indexOf("MSJT") !== -1) assessmentCode = "MSJT";
        else if (upper.indexOf("LEADERSHIP") !== -1 || upper.indexOf("LSJT") !== -1) assessmentCode = "LSJT";
        else if (upper.indexOf("TPDK") !== -1 || upper.indexOf("PENALARAN") !== -1) assessmentCode = "TPDK";
    }

    if (!assessmentCode && assessmentId && TEST_RESULT_UUID_MAP[assessmentId]) {
        assessmentCode = TEST_RESULT_UUID_MAP[assessmentId].code;
        assessmentName = assessmentName || TEST_RESULT_UUID_MAP[assessmentId].name;
    }

    if (!assessmentCode && assessmentId) {
        const masterAssessments = readLocalStorageArray("assessments");
        const master = masterAssessments.find(function (m) {
            return String(m && m.id || "").toLowerCase() === assessmentId;
        });
        if (master) {
            assessmentCode = String(master.assessment_code || master.code || "").trim().toUpperCase();
            assessmentName = assessmentName || String(master.assessment_name || master.name || "").trim();
        }
    }

    if (!assessmentCode) {
        showResultMessage("Tidak dapat menentukan tipe assessment.");
        return;
    }

    if (!assessmentName) {
        assessmentName = assessmentCode + " Assessment";
    }

    console.log("[TEST-RESULT] FINAL — code:", assessmentCode, "| name:", assessmentName);

    // ======================================================
    // BUILD ASSESSMENT OBJECT
    // ======================================================
    const assessment = {
        ...projectAssessment,
        code: assessmentCode,
        name: assessmentName,
        title: assessmentName
    };

    updateElement("testTitle", assessmentName + " Result");

    // ======================================================
    // IDENTIFY TYPE
    // ======================================================
    const isDISC = assessmentCode === "DISC";
    const isPAPI = assessmentCode === "PAPI";
    const isVAP = assessmentCode === "VAP";

    updateAssessmentHeader(isDISC, isPAPI);

    // ======================================================
    // LOAD RESULT
    // ======================================================
    const assessIdxToUse = Number.isInteger(index) && index >= 0
        ? index
        : projectAssessments.indexOf(projectAssessment);

    let participantResult = await getAssessmentResult(
        projectId, participantId, assessIdxToUse,
        assessmentCode, assessmentId,
        isDISC, isPAPI, isVAP,
        assessmentIdFromUrl
    );

    if (!participantResult) {
        showResultMessage("Hasil assessment untuk peserta ini belum tersedia atau belum disubmit.");
        return;
    }

    // ======================================================
    // RENDER CONTAINER
    // ======================================================
    const resultContainer = document.getElementById("resultContent");
    if (!resultContainer) {
        console.error("Element #resultContent tidak ditemukan.");
        return;
    }

    // ======================================================
    // RENDER BY TYPE
    // ======================================================
    if (isDISC) {
        if (typeof DISCAssessment !== "undefined") {
            const result = DISCAssessment.calculate(participantResult);
            DISCAssessment.render(resultContainer, result, assessment);
        } else {
            showResultMessage("Module DISC belum dimuat.");
        }
        return;
    }

    if (isPAPI) {
        const renderer = window.renderTestResult ||
                        (typeof renderTestResult === "function" ? renderTestResult : null);
        if (renderer) {
            renderer(assessment, participantResult);
        } else {
            showResultMessage("Module PAPI Kostick belum dimuat.");
        }
        return;
    }

    if (isVAP) {
        if (typeof VAPAssessment !== "undefined") {
            const result = VAPAssessment.calculate(participantResult);
            VAPAssessment.render(resultContainer, result, assessment);
        } else {
            showResultMessage("Module VAP belum dimuat.");
        }
        return;
    }

    if (typeof renderTestResult === "function") {
        renderTestResult(assessment, participantResult);
    } else {
        showResultMessage("Renderer untuk assessment " + assessmentCode + " belum tersedia.");
    }
}

/* ==========================================================
   GET ASSESSMENT RESULT
   ----------------------------------------------------------
   Prioritas pencarian:
   0. By assessmentId (UUID) di localStorage
   1. Supabase: INDEX + CODE
   2. Supabase: CODE saja
   3. Supabase: INDEX saja
   4. K1-BARU: Cari by CODE (semua key yang mengandung code)
   5. Cari by INDEX (data lama)
   6. Array talent_scope_results
   ========================================================== */
async function getAssessmentResult(
    projectId, participantId, assessmentIndex, assessmentCode, assessmentId,
    isDISC, isPAPI, isVAP, assessmentIdFromUrl
) {
    console.log("==========================================");
    console.log("Mencari hasil:", {
        projectId: projectId,
        participantId: participantId,
        assessmentIndex: assessmentIndex,
        assessmentCode: assessmentCode,
        assessmentId: assessmentId,
        assessmentIdFromUrl: assessmentIdFromUrl
    });

    function tryNormalize(raw, source) {
        if (!raw) return null;
        console.log("RESULT DITEMUKAN DARI:", source);
        var normalized = normalizeAssessmentResult(
            raw, projectId, participantId, assessmentIndex,
            assessmentCode, isDISC, isPAPI, isVAP
        );
        if (normalized) {
            console.log("RESULT BERHASIL DINORMALISASI");
            return normalized;
        }
        return null;
    }

    // ==========================================================
    // FALLBACK 0: localStorage by UUID
    // ==========================================================
    if (assessmentIdFromUrl) {
        console.log("[TEST-RESULT] FALLBACK 0: Cari by UUID:", assessmentIdFromUrl);

        var uuidKeys = [
            "assessment_result_v3_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "assessment_result_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "disc_result_v3_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "disc_result_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "papi_result_v3_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "papi_result_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "vap_result_v3_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "vap_result_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "sjt_result_v3_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "sjt_result_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "tpdk_result_v3_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl,
            "tpdk_result_" + projectId + "_" + participantId + "_" + assessmentIdFromUrl
        ];

        for (var uk = 0; uk < uuidKeys.length; uk++) {
            var uuidRaw = readLocalStorageObject(uuidKeys[uk]);
            if (uuidRaw) {
                console.log("[TEST-RESULT] ✅ Data ketemu via UUID:", uuidKeys[uk]);
                var nUuid = tryNormalize(uuidRaw, uuidKeys[uk]);
                if (nUuid) return nUuid;
            }
        }
        console.log("[TEST-RESULT] ⚠ Tidak ada data via UUID, lanjut fallback...");
    }

    // ==========================================================
    // QUERY SUPABASE
    // ==========================================================
    try {
        const sb = window.supabaseClient || window.supabase;
        if (sb && typeof sb.from === "function") {
            console.log("[TEST-RESULT] Query Supabase...");

            let supabaseTable = "ts_results";
            if (isDISC) supabaseTable = "disc_results";
            else if (isPAPI) supabaseTable = "papi_results";
            else if (isVAP) supabaseTable = "vap_results";
            else if (assessmentCode === "MSJT" || assessmentCode === "LSJT") supabaseTable = "sjt_results";
            else if (assessmentCode === "TPDK") supabaseTable = "tpdk_results";

            console.log("[TEST-RESULT] Query tabel:", supabaseTable);

            const { data, error } = await sb
                .from(supabaseTable)
                .select("*")
                .eq("project_id", projectId)
                .eq("participant_id", participantId);

            if (error) {
                console.warn("[TEST-RESULT] Supabase error:", error);
            } else if (Array.isArray(data) && data.length > 0) {
                console.log("[TEST-RESULT] Total rows:", data.length);

                const indexStr = String(assessmentIndex);
                const codeLower = String(assessmentCode || "").toLowerCase();
                const idLower = String(assessmentId || "").toLowerCase();

                // PRIORITAS 1: INDEX + CODE
                for (var i = 0; i < data.length; i++) {
                    var row = data[i];
                    var rowIndex = String(row.assessment_index);
                    var rowCode = String(row.assessment_code || "").trim().toLowerCase();

                    if (rowIndex === indexStr) {
                        var codeMatches =
                            rowCode === codeLower ||
                            rowCode === idLower ||
                            (codeLower && rowCode.indexOf(codeLower) !== -1);

                        if (codeMatches) {
                            console.log("[TEST-RESULT] ✅ Supabase match INDEX+CODE");
                            var n1 = tryNormalize(row.data || row, "Supabase (index + code)");
                            if (n1) return n1;
                        }
                    }
                }

                // PRIORITAS 2: CODE saja
                for (var j = 0; j < data.length; j++) {
                    var row2 = data[j];
                    var rowCode2 = String(row2.assessment_code || "").trim().toLowerCase();
                    if (rowCode2 === codeLower || rowCode2 === idLower) {
                        console.log("[TEST-RESULT] ✅ Supabase match CODE");
                        var n2 = tryNormalize(row2.data || row2, "Supabase (code)");
                        if (n2) return n2;
                    }
                }

                // PRIORITAS 3: INDEX saja
                for (var k = 0; k < data.length; k++) {
                    var row3 = data[k];
                    if (String(row3.assessment_index) === indexStr) {
                        console.log("[TEST-RESULT] ✅ Supabase match INDEX");
                        var n3 = tryNormalize(row3.data || row3, "Supabase (index)");
                        if (n3) return n3;
                    }
                }
            }
        }
    } catch (e) {
        console.warn("[TEST-RESULT] Supabase fetch gagal:", e);
    }

    // ==========================================================
    // PROJECT CODE FALLBACK
    // ==========================================================
    var projectCodeFallback = null;
    try {
        var allProjects = JSON.parse(localStorage.getItem("talentscope_projects") || "[]");
        var projMatch = allProjects.find(function(p) {
            return String(p.id) === String(projectId) || String(p.projectId) === String(projectId);
        });
        if (projMatch) {
            projectCodeFallback = String(projMatch.project_code || projMatch.projectCode || "").trim();
            if (projectCodeFallback) {
                console.log("[TEST-RESULT] Project code fallback:", projectCodeFallback);
            }
        }
    } catch(e) {}

    // ==========================================================
    // FALLBACK BARU: CARI BY CODE
    // ----------------------------------------------------------
    // Cari SEMUA key localStorage yang mengandung code (disc/papi/vap).
    // Ini untuk data lama yang tersimpan di index berbeda.
    // ==========================================================
    console.log("[TEST-RESULT] FALLBACK: Cari by code:", assessmentCode);

    var allLSKeys = Object.keys(localStorage);
    var codeLower = String(assessmentCode || "").toLowerCase();

    if (codeLower) {
        var matchedKeys = allLSKeys.filter(function(k) {
            var hasProj = k.indexOf(projectId) !== -1;
            if (!hasProj && projectCodeFallback) {
                hasProj = k.indexOf(projectCodeFallback) !== -1;
            }
            var hasPart = k.indexOf(participantId) !== -1;
            var lowerKey = k.toLowerCase();
            var hasCode = lowerKey.indexOf(codeLower) !== -1;

            return hasProj && hasPart && hasCode && k.indexOf("_result") !== -1;
        });

        console.log("[TEST-RESULT] Kandidat key by code:", matchedKeys);

        for (var mk = 0; mk < matchedKeys.length; mk++) {
            var mkRaw = readLocalStorageObject(matchedKeys[mk]);
            if (!mkRaw) continue;

            var dataType = String(
                mkRaw.resultType || mkRaw.assessmentCode || ""
            ).toUpperCase();

            if (dataType.indexOf(assessmentCode.toUpperCase()) !== -1) {
                console.log("[TEST-RESULT] ✅ Data ketemu by code:", matchedKeys[mk]);
                var nCode = tryNormalize(mkRaw, matchedKeys[mk]);
                if (nCode) return nCode;
            }
        }
    }

    // ==========================================================
    // FALLBACK LOCALSTORAGE BY INDEX
    // ==========================================================
    console.log("[TEST-RESULT] Fallback ke localStorage by index...");

    if (isDISC) {
        var discKeys = [
            "disc_result_v3_" + projectId + "_" + participantId + "_" + assessmentIndex,
            "disc_result_" + projectId + "_" + participantId + "_" + assessmentIndex,
            "assessment_result_v3_" + projectId + "_" + participantId + "_" + assessmentIndex,
            projectCodeFallback ? "disc_result_v3_" + projectCodeFallback + "_" + participantId + "_" + assessmentIndex : null,
            projectCodeFallback ? "assessment_result_v3_" + projectCodeFallback + "_" + participantId + "_" + assessmentIndex : null,
            "disc_result_v3_" + projectId + "_" + participantId,
            "disc_result_" + projectId + "_" + participantId,
            "assessment_result_v3_" + projectId + "_" + participantId,
            projectCodeFallback ? "disc_result_v3_" + projectCodeFallback + "_" + participantId : null,
            projectCodeFallback ? "assessment_result_v3_" + projectCodeFallback + "_" + participantId : null
        ].filter(Boolean);

        for (var d = 0; d < discKeys.length; d++) {
            var dRaw = readLocalStorageObject(discKeys[d]);
            if (dRaw) {
                console.log("[TEST-RESULT] ✅ DISC data ketemu:", discKeys[d]);
                var nD = tryNormalize(dRaw, discKeys[d]);
                if (nD) return nD;
            }
        }
        console.warn("[TEST-RESULT] ❌ DISC data tidak ketemu");
    }

    if (isPAPI) {
        var papiKeys = [
            "papi_result_v3_" + projectId + "_" + participantId + "_" + assessmentIndex,
            "papi_result_" + projectId + "_" + participantId + "_" + assessmentIndex,
            "assessment_result_v3_" + projectId + "_" + participantId + "_" + assessmentIndex,
            projectCodeFallback ? "papi_result_v3_" + projectCodeFallback + "_" + participantId + "_" + assessmentIndex : null,
            projectCodeFallback ? "assessment_result_v3_" + projectCodeFallback + "_" + participantId + "_" + assessmentIndex : null,
            "papi_result_v3_" + projectId + "_" + participantId,
            "papi_result_" + projectId + "_" + participantId,
            "assessment_result_v3_" + projectId + "_" + participantId,
            projectCodeFallback ? "papi_result_v3_" + projectCodeFallback + "_" + participantId : null,
            projectCodeFallback ? "assessment_result_v3_" + projectCodeFallback + "_" + participantId : null
        ].filter(Boolean);

        for (var p = 0; p < papiKeys.length; p++) {
            var papiRaw = readLocalStorageObject(papiKeys[p]);
            if (papiRaw) {
                console.log("[TEST-RESULT] ✅ PAPI data ketemu:", papiKeys[p]);
                var nPapi = tryNormalize(papiRaw, papiKeys[p]);
                if (nPapi) return nPapi;
            }
        }
        console.warn("[TEST-RESULT] ❌ PAPI data tidak ketemu");
    }

    if (isVAP) {
        var vapKeys = [
            "vap_result_v3_" + projectId + "_" + participantId + "_" + assessmentIndex,
            "vap_result_" + projectId + "_" + participantId + "_" + assessmentIndex,
            "assessment_result_v3_" + projectId + "_" + participantId + "_" + assessmentIndex,
            projectCodeFallback ? "vap_result_v3_" + projectCodeFallback + "_" + participantId + "_" + assessmentIndex : null,
            projectCodeFallback ? "assessment_result_v3_" + projectCodeFallback + "_" + participantId + "_" + assessmentIndex : null,
            "vap_result_v3_" + projectId + "_" + participantId,
            "vap_result_" + projectId + "_" + participantId,
            "assessment_result_v3_" + projectId + "_" + participantId,
            projectCodeFallback ? "vap_result_v3_" + projectCodeFallback + "_" + participantId : null,
            projectCodeFallback ? "assessment_result_v3_" + projectCodeFallback + "_" + participantId : null
        ].filter(Boolean);

        for (var v = 0; v < vapKeys.length; v++) {
            var vapRaw = readLocalStorageObject(vapKeys[v]);
            if (vapRaw) {
                console.log("[TEST-RESULT] ✅ VAP data ketemu:", vapKeys[v]);
                var nVap = tryNormalize(vapRaw, vapKeys[v]);
                if (nVap) return nVap;
            }
        }
        console.warn("[TEST-RESULT] ❌ VAP data tidak ketemu");
    }

    // Generic keys
    var genericKeys = [
        "assessment_result_" + projectId + "_" + participantId + "_" + assessmentIndex,
        projectCodeFallback ? "assessment_result_" + projectCodeFallback + "_" + participantId + "_" + assessmentIndex : null
    ].filter(Boolean);

    for (var g = 0; g < genericKeys.length; g++) {
        var exactRaw = readLocalStorageObject(genericKeys[g]);
        if (exactRaw) {
            console.log("[TEST-RESULT] ✅ Generic data ketemu:", genericKeys[g]);
            var nExact = tryNormalize(exactRaw, genericKeys[g]);
            if (nExact) return nExact;
        }
    }

    // FALLBACK TERAKHIR: talent_scope_results array
    var resultArray = readLocalStorageArray("talent_scope_results");
    for (var r = resultArray.length - 1; r >= 0; r--) {
        var item = resultArray[r];
        if (!item) continue;
        var itemProject = String(item.projectId || item.project_id || "").trim();
        var itemParticipant = String(item.participantId || item.participant_id || "").trim();
        var itemIndex = item.assessmentIndex !== undefined ? item.assessmentIndex : item.assessment_index;
        var itemCode = String(item.assessmentCode || item.assessment_code || "").toLowerCase();

        var indexMatch = String(itemIndex) === String(assessmentIndex);
        var codeMatch = itemCode === String(assessmentCode).toLowerCase();

        var projectMatch = (itemProject === String(projectId).trim()) ||
                          (projectCodeFallback && itemProject === String(projectCodeFallback).trim());

        if (projectMatch &&
            itemParticipant === String(participantId).trim() &&
            (indexMatch || codeMatch)) {
            var nArr = tryNormalize(item, "talent_scope_results[" + r + "]");
            if (nArr) return nArr;
        }
    }

    console.warn("[TEST-RESULT] ❌ HASIL TIDAK DITEMUKAN");
    return null;
}

/* ==========================================================
   NORMALIZE RESULT
========================================================== */
function normalizeAssessmentResult(raw, projectId, participantId, assessmentIndex, assessmentCode, isDISC, isPAPI, isVAP) {
    if (!raw || typeof raw !== "object") return null;

    const result = Object.assign({}, raw, {
        projectId: raw.projectId !== undefined ? raw.projectId : projectId,
        participantId: raw.participantId !== undefined ? raw.participantId : participantId,
        assessmentIndex: raw.assessmentIndex !== undefined ? raw.assessmentIndex : assessmentIndex,
        assessmentCode: raw.assessmentCode !== undefined ? raw.assessmentCode : assessmentCode
    });

    if (isVAP && result.scores && typeof result.scores === "object") return result;

    if (result.scores && typeof result.scores === "object") {
        if (isDISC && result.scores.most && result.scores.least && result.scores.change) {
            result.scores = {
                most: normalizeDiscScores(result.scores.most),
                least: normalizeDiscScores(result.scores.least),
                change: normalizeDiscScores(result.scores.change)
            };
            return result;
        }
        return result;
    }

    if (isPAPI && raw.skorDimensi && typeof raw.skorDimensi === "object") {
        result.scores = raw.skorDimensi;
        return result;
    }

    if (raw.score && typeof raw.score === "object") {
        result.scores = raw.score;
        return result;
    }

    if (raw.answers && typeof raw.answers === "object") {
        result.scores = { answers: raw.answers };
        result.answers = raw.answers;
        return result;
    }

    result.scores = {};
    result.answers = raw.answers || {};
    return result;
}

/* ==========================================================
   HELPERS
   ========================================================== */
function readLocalStorageObject(key) {
    try {
        if (!key) return null;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === "object") ? parsed : null;
    } catch (error) {
        return null;
    }
}

function readLocalStorageArray(key) {
    try {
        if (!key) return [];
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function normalizeDiscScores(obj) {
    if (!obj || typeof obj !== "object") return {};
    return {
        D: Number(obj.D || obj.d || 0),
        I: Number(obj.I || obj.i || 0),
        S: Number(obj.S || obj.s || 0),
        C: Number(obj.C || obj.c || 0)
    };
}

/* ==========================================================
   HEADER
========================================================== */
function updateAssessmentHeader(isDISC, isPAPI) {
    const titleEl = document.getElementById("sectionTitle");
    const descEl = document.getElementById("sectionDesc");
    const badgeEl = document.getElementById("dominantBadge");

    if (isDISC) {
        if (titleEl) titleEl.textContent = "Skoring & Analisis Hasil DISC";
        if (descEl) descEl.textContent = "Hasil evaluasi dan penilaian detail tipe perilaku kerja DISC.";
        if (badgeEl) badgeEl.textContent = "D";
        return;
    }

    if (isPAPI) {
        if (titleEl) titleEl.textContent = "Skoring & Analisis Hasil PAPI Kostick";
        if (descEl) descEl.textContent = "Profil aspek kepribadian, work role, dan kebutuhan dalam bekerja.";
        if (badgeEl) badgeEl.textContent = "P";
        return;
    }

    if (titleEl) titleEl.textContent = "Hasil Assessment";
    if (descEl) descEl.textContent = "Hasil evaluasi assessment peserta.";
}

/* ==========================================================
   MESSAGE
========================================================== */
function showResultMessage(message) {
    const resultContent = document.getElementById("resultContent");
    if (!resultContent) return;
    resultContent.innerHTML =
        '<div class="empty-test" style="padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#334155;display:flex;align-items:center;gap:10px;">' +
            '<i class="fa-solid fa-circle-info" style="color:#2563eb;"></i>' +
            '<span>' + escapeResultHTML(message) + '</span>' +
        '</div>';
}

function escapeResultHTML(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatTestDate(date) {
    if (!date || date === "-") return "-";
    const raw = String(date).trim();
    const d = new Date(raw.indexOf("T") !== -1 ? raw : raw + "T00:00:00");
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = value == null ? "-" : value;
}