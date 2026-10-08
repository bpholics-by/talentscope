/* ==========================================================
   TALENTSCOPE â€” SUPABASE SYNC BRIDGE (REFACTOR FASE 3)
   ----------------------------------------------------------
   OPTIMASI EGRESS v3:
   1. Auto-sync interval: 60s â†’ 120s (2 menit)
   2. Presence throttle: 60s â†’ 120s
   3. Selective columns â€” hemat 30-40%
   4. Delta sync â€” hanya sync yang berubah
   5. Skip sync saat tab hidden
   6. Skip auto-sync di halaman tes (__TS_DISABLE_AUTO_SYNC)
   7. Delta sync untuk project_assessments (hemat)
   8. Skip redundant sync saat tab aktif kembali (kalau baru sync)
   ========================================================== */

(function () {
    "use strict";

    // ======================================================
    // KONFIGURASI SUPABASE
    // ======================================================

    var SUPABASE_URL = (window.TS_CONFIG && window.TS_CONFIG.SUPABASE_URL) || '';
    var SUPABASE_ANON_KEY = (window.TS_CONFIG && window.TS_CONFIG.SUPABASE_ANON_KEY) || '';

    var PROJECTS_KEYS = ["talentscope_projects", "projects"];
    var RESULTS_KEY = "talent_scope_results";
    var USERS_KEY = "talentscope_settings_users";

    var SYNC_TS_KEY_PREFIX = "ts_last_sync_";
    var SYNC_LOCK_KEY_PREFIX = "ts_sync_lock_";

    /* ============================================================
       OPTIMASI EGRESS v3
       ============================================================ */

    // âœ… Interval sync: 120 detik (2 menit) â€” kompromi antara freshness & egress
    var AUTO_SYNC_INTERVAL_MS = 120 * 1000;

    // âœ… Presence throttle: 120 detik (2 menit) â€” sama dengan sync interval
    var PRESENCE_THROTTLE_MS = 120 * 1000;

    
    // ============================================
    // AUTH TOKEN HELPER (Fase D — Supabase Auth)
    // ============================================
    // Mengambil JWT dari session Supabase Auth.
    // Fallback ke ANON_KEY kalau tidak ada session.
    // ============================================
    var __tsCachedToken = null;
    var __tsTokenExpiry = 0;

    function getAuthTokenOrAnon() {
        // Prioritas 1: cached token (masih valid)
        if (__tsCachedToken && Date.now() < __tsTokenExpiry) {
            return __tsCachedToken;
        }

        // Prioritas 2: session Supabase Auth dari localStorage
        try {
            var sb = window.supabaseClient;
            if (sb && sb.auth) {
                // Cari key session Supabase di localStorage
                var projectRef = (sb.supabaseUrl || '').split('//')[1].split('.')[0];
                var storageKey = 'sb-' + projectRef + '-auth-token';
                var sessionRaw = localStorage.getItem(storageKey);

                if (sessionRaw) {
                    var parsed = JSON.parse(sessionRaw);
                    if (parsed && parsed.access_token) {
                        __tsCachedToken = parsed.access_token;
                        // Cache sampai 5 menit sebelum expiry
                        var expiresAt = (parsed.expires_at || 0) * 1000;
                        __tsTokenExpiry = expiresAt - (5 * 60 * 1000);
                        return __tsCachedToken;
                    }
                }

                // Fallback: cek langsung ke Supabase Auth (async → return last)
                var sessionFromAuth = sb.auth.getSession();
                // getSession() return promise, tapi kita butuh sync.
                // Pakai cache dulu, update cache di background.
            }
        } catch (e) {
            console.warn("[TS-Sync] Gagal ambil JWT, fallback anon:", e);
        }

        // Fallback: anon key
        return SUPABASE_ANON_KEY;
    }

    // âœ… Batch size: 2 â†’ hemat egress per request
    var BATCH_SIZE = 2;

    // âœ… Minimum gap antar sync (dari event) â€” cegah spam
    var MIN_SYNC_GAP_MS = 30 * 1000;  // 30 detik


    // ======================================================
    // SELECTIVE COLUMNS â€” HEMAT EGRESS
    // ======================================================

    var SELECT_COLS = {
        projects: "id,project_code,name,project_name,company,client,pic,status,start_date,end_date,created_at,updated_at",
        participants: "id,participant_code,project_id,name,full_name,email,username,position,department,company,is_logged_in,login_at,logout_at,last_login_at,status,assessment_status,raw_data,updated_at",
        project_participants: "id,project_id,participant_id,status,registered_at,updated_at",
        project_assessments: "id,project_id,assessment_id,assessment_name,sort_order,created_at",
        ts_results: "id,project_id,participant_id,assessment_index,assessment_code,data,created_at",
        ts_users: "id,data,updated_at"
    };


    // ======================================================
    // DETEKSI HALAMAN TES
    // ======================================================

    function isAutoSyncDisabled() {
        return window.__TS_DISABLE_AUTO_SYNC === true;
    }


    // ======================================================
    // STATE INTERNAL
    // ======================================================

    var __tsLastPushMap = {};
    var __tsLastSyncMap = {};
    var __tsSyncInProgress = false;
    var __tsPendingPushes = {};
    var __tsDebounceTimers = {};
    var __tsLastSyncTrigger = 0;


    // ======================================================
    // HELPER: WAKTU SYNC
    // ======================================================

    function getLastSyncTime(tableName) {
        try {
            var stored = localStorage.getItem(SYNC_TS_KEY_PREFIX + tableName);
            if (stored) return stored;
        } catch (e) {}
        return "1970-01-01T00:00:00Z";
    }

    function setLastSyncTime(tableName, isoTime) {
        try {
            localStorage.setItem(SYNC_TS_KEY_PREFIX + tableName, isoTime);
        } catch (e) {}
    }

    function nowISO() {
        return new Date().toISOString();
    }


    // ======================================================
    // HELPER: FETCH ASYNC
    // ======================================================

    function restGetAsync(path) {
        var useRetry = (typeof window.fetchWithRetry === "function");
        var fetchFn = useRetry ? window.fetchWithRetry : window.fetch;

        return fetchFn(SUPABASE_URL + path, {
            method: "GET",
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": "Bearer " + getAuthTokenOrAnon(),
            }
        })
        .then(function (res) {
            if (!res.ok) {
                console.warn("[TS-Sync] GET gagal:", path, res.status);
                return null;
            }
            return res.json();
        })
        .catch(function (error) {
            console.warn("[TS-Sync] GET error:", path, error);
            return null;
        });
    }


    // ======================================================
    // HELPER: UPSERT
    // ======================================================

    function dedupeRowsById(rows) {
        var map = {};
        var order = [];

        rows.forEach(function (row) {
            if (!row || !row.id) return;
            if (!(row.id in map)) {
                order.push(row.id);
            }
            map[row.id] = row;
        });

        return order.map(function (id) { return map[id]; });
    }
// ============================================
// AUTH SESSION CHECKER
// ============================================
function hasActiveSession() {
    try {
        var sb = window.supabaseClient;
        if (!sb || !sb.auth) return false;
        
        // Baca session dari localStorage (sinkron)
        var projectRef = (sb.supabaseUrl || '').split('//')[1].split('.')[0];
        var storageKey = 'sb-' + projectRef + '-auth-token';
        var sessionRaw = localStorage.getItem(storageKey);
        
        if (!sessionRaw) return false;
        
        var parsed = JSON.parse(sessionRaw);
        if (!parsed || !parsed.access_token) return false;
        
        // Cek expiry
        var expiresAt = (parsed.expires_at || 0) * 1000;
        if (expiresAt && Date.now() >= expiresAt) return false;
        
        return true;
    } catch (e) {
        return false;
    }
}
    function performUpsertRequest(table, rows, options) {
        if (!rows || !rows.length) {
            return Promise.resolve({ ok: true, skipped: true });
        }
    // ✅ FIX: Skip kalau tidak ada session (user belum login)
    if (!hasActiveSession()) {
        console.log("[TS-Sync] Skip upsert (no active session):", table);
        return Promise.resolve({ ok: true, skipped: true, reason: "no-session" });
    }
        var deduped = dedupeRowsById(rows);
        if (!deduped.length) {
            return Promise.resolve({ ok: true, skipped: true });
        }

        var useKeepalive = !!(options && options.keepalive);
        var fetchFn = (typeof window.fetchWithRetry === "function")
            ? window.fetchWithRetry
            : window.fetch;

        var fetchOptions = {
            method: "POST",
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": "Bearer " + getAuthTokenOrAnon(),
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal"
            },
            body: JSON.stringify(deduped)
        };

        if (useKeepalive) {
            fetchOptions.keepalive = true;
        }

        return fetchFn(SUPABASE_URL + "/rest/v1/" + table + "?on_conflict=id", fetchOptions)
            .then(function (response) {
                if (response.ok) {
                    return { ok: true, status: response.status };
                }
                // FIX: Handle 409 Conflict (duplicate) gracefully — bukan error
                if (response.status === 409) {
                    return { ok: true, status: 409, reason: "duplicate-ignored" };
                }
                return response.text().then(function (text) {
                    console.warn("[TS-Sync] Upsert ditolak:", table, response.status, text);
                    return { ok: false, status: response.status, message: text };
                });
            })
            .catch(function (error) {
                console.warn("[TS-Sync] Upsert gagal (network):", table, error);
                return { ok: false, status: 0, message: String(error && error.message || error) };
            });
    }

    function restUpsert(table, rows) {
        try {
            performUpsertRequest(table, rows, { keepalive: false });
        } catch (error) {
            console.warn("[TS-Sync] Upsert error:", table, error);
        }
    }

// ============================================
// ROLE CHECKER — hanya admin yang boleh write ke ts_projects
// clientuser (asesor) = read-only, skip write
// ============================================
function canWriteProjects() {
    try {
        var sb = window.supabaseClient;
        if (!sb || !sb.auth) return false;
        
        // Baca session dari localStorage (sinkron)
        var projectRef = (sb.supabaseUrl || '').split('//')[1].split('.')[0];
        var storageKey = 'sb-' + projectRef + '-auth-token';
        var sessionRaw = localStorage.getItem(storageKey);
        
        if (!sessionRaw) return false;
        
        var parsed = JSON.parse(sessionRaw);
        var role = (parsed && parsed.user && parsed.user.user_metadata && 
                    parsed.user.user_metadata.role) || "";
        
        var roleLower = String(role).toLowerCase();
        
        // Hanya system_admin & clientadmin yang boleh write
        return roleLower === "system_admin" 
            || roleLower === "admin"
            || roleLower === "clientadmin";
    } catch (e) {
        return false;
    }
}
    // ======================================================
    // HELPER: BACA ARRAY LOCALSTORAGE
    // ======================================================

    function readLocalArray(key) {
        try {
            var raw = localStorage.getItem(key);
            var parsed = JSON.parse(raw || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }


    // ======================================================
    // KONVERSI OBJECT â†’ ROW
    // ======================================================

    function projectToRow(project) {
        var pid = String(project && (project.id || project.projectId || project.project_id) || "");
        if (!pid) return null;
        return { id: pid, data: project, updated_at: nowISO() };
    }

    function resultToRow(item) {
        var pid = String((item && item.projectId) || "");
        var parid = String((item && item.participantId) || "");
        if (!pid || !parid) return null;

        var idx = String(item.assessmentIndex !== undefined && item.assessmentIndex !== null ? item.assessmentIndex : "");
        // ============================================
// Normalisasi assessment_code:
// - UUID → konversi ke kode lowercase (via map UUID → code)
// - Teks → lowercase
// - Kosong → "gen"
// ============================================
var rawCode = String(item.assessmentCode || "GEN").trim();
var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Map UUID → lowercase code (dari tabel assessments)
var UUID_TO_CODE_MAP = {
    "6266a366-47c4-4d5c-9f0f-6a2984227ed1": "disc",
    "d8408a0f-55c0-4fc9-94fe-bb6d48292b31": "papi",
    "e3026a3d-15f7-4189-b25e-8cae12968558": "lsjt",
    "327a8cde-c51c-4524-aae1-4d54402d772a": "msjt",
    "8b0209ef-1b16-414c-b8c1-cd0e0449e7d7": "vap"
    // TPDK & INTRAY: tambahkan kalau sudah tahu UUID-nya
};

var code;
if (UUID_REGEX.test(rawCode)) {
    code = UUID_TO_CODE_MAP[rawCode.toLowerCase()] || "gen";
    if (code === "gen") {
        console.warn("[TS-Sync] UUID tidak dikenal, fallback ke 'gen':", rawCode);
    }
} else {
    code = rawCode.toLowerCase();
}

        return {
            id: pid + "__" + parid + "__" + idx + "__" + code,
            project_id: pid,
            participant_id: parid,
            assessment_index: idx,
            assessment_code: code,
            data: item,
            updated_at: nowISO()
        };
    }

    function userToRow(user) {
        var uid = String(user && user.id || "");
        if (!uid) return null;
        return { id: uid, data: user, updated_at: nowISO() };
    }


    // ======================================================
    // PUSH USERS
    // ======================================================

    function pushUsersNow(usersOverride) {
    try {
        var arr = Array.isArray(usersOverride)
            ? usersOverride
            : readLocalArray(USERS_KEY);

        // âœ… FIX: Dedup by username (case-insensitive) sebelum push
        // Keep LAST occurrence (yang terbaru)
        var dedupMap = {};
        var dedupOrder = [];
        arr.forEach(function(user) {
            if (!user) return;
            var key = String(user.username || user.id || "").toLowerCase().trim();
            if (!key) return;
            if (!dedupMap[key]) dedupOrder.push(key);
            dedupMap[key] = user;
        });
        var dedupedArr = dedupOrder.map(function(k) { return dedupMap[k]; });

        console.log("[TS-Sync] pushUsersNow: " + arr.length + " â†’ " + dedupedArr.length + " (deduped)");

        var rows = dedupedArr.map(userToRow).filter(Boolean);
        return performUpsertRequest("ts_users", rows, { keepalive: true });
    } catch (error) {
        console.warn("[TS-Sync] pushUsersNow error:", error);
        return Promise.resolve({ ok: false, status: 0, message: String(error && error.message || error) });
    }
}

    window.TalentScopeSync = window.TalentScopeSync || {};
    window.TalentScopeSync.pushUsersNow = pushUsersNow;


    // ======================================================
    // ASSEMBLE PROJECTS â€” DELTA SYNC + SELECTIVE COLUMNS
    // ======================================================

    async function assembleProjectsFromRelationalTablesAsync() {
        var lastProjectsSync = getLastSyncTime("projects");
        var lastParticipantsSync = getLastSyncTime("participants");
        var lastRelationsSync = getLastSyncTime("project_participants");
        var lastAssessmentsSync = getLastSyncTime("project_assessments");

        // Delta sync untuk semua (termasuk project_assessments)
        var projectsUrl = "/rest/v1/projects?select=" + SELECT_COLS.projects;
        if (lastProjectsSync !== "1970-01-01T00:00:00Z") {
            projectsUrl += "&updated_at=gt." + encodeURIComponent(lastProjectsSync);
        }

        var participantsUrl = "/rest/v1/participants?select=" + SELECT_COLS.participants;
        if (lastParticipantsSync !== "1970-01-01T00:00:00Z") {
            participantsUrl += "&updated_at=gt." + encodeURIComponent(lastParticipantsSync);
        }

        var relationsUrl = "/rest/v1/project_participants?select=" + SELECT_COLS.project_participants;
        if (lastRelationsSync !== "1970-01-01T00:00:00Z") {
            relationsUrl += "&updated_at=gt." + encodeURIComponent(lastRelationsSync);
        }

        // âœ… OPTIMASI: project_assessments pakai DELTA SYNC juga
        // FIX: project_assessments tidak punya updated_at â€” full sync saja
var assessmentsUrl = "/rest/v1/project_assessments?select=" + SELECT_COLS.project_assessments;
// Delta sync tidak aktif untuk tabel ini

        var projectRows = await restGetAsync(projectsUrl);
        if (projectRows === null) return null;

        var relationRowsRaw = await restGetAsync(relationsUrl);
        var participantRowsRaw = await restGetAsync(participantsUrl);

        if (relationRowsRaw === null || participantRowsRaw === null) {
            console.warn("[TS-Sync] Gagal ambil relasi/participants, batalkan assembly.");
            return null;
        }

        var assessmentRows = await restGetAsync(assessmentsUrl) || [];

        var syncTime = nowISO();
        setLastSyncTime("projects", syncTime);
        setLastSyncTime("participants", syncTime);
        setLastSyncTime("project_participants", syncTime);
        setLastSyncTime("project_assessments", syncTime);

        var participantById = {};
        participantRowsRaw.forEach(function (p) {
            if (p && p.id != null) {
                participantById[String(p.id)] = p;
            }
        });

        var relationsByProject = {};
        relationRowsRaw.forEach(function (rel) {
            var pid = String((rel && rel.project_id) || "");
            if (!pid) return;
            if (!relationsByProject[pid]) relationsByProject[pid] = [];
            relationsByProject[pid].push(rel);
        });

        var assessmentsByProject = {};
        assessmentRows.forEach(function (a) {
            var pid = String((a && a.project_id) || "");
            if (!pid) return;
            if (!assessmentsByProject[pid]) assessmentsByProject[pid] = [];
            assessmentsByProject[pid].push(a);
        });

        return projectRows.map(function (project) {
            var pid = String((project && project.id) || "");
            var relations = relationsByProject[pid] || [];

            var participants = relations.map(function (rel) {
                var participant = participantById[String(rel.participant_id)];
                if (!participant) return null;

                var rawData = (participant && participant.raw_data) || {};
                var merged = {};
                for (var k in rawData) merged[k] = rawData[k];
                for (var k2 in participant) merged[k2] = participant[k2];

                merged.status =
                    participant.status ||
                    rel.status ||
                    rel.participant_status ||
                    "Not Started";

                return merged;
            }).filter(Boolean);

            var merged2 = {};
            for (var k3 in project) merged2[k3] = project[k3];

            merged2.participants = participants;

            if (assessmentsByProject[pid] && assessmentsByProject[pid].length) {
                merged2.assessments = assessmentsByProject[pid].slice().sort(function(a, b) {
                    return Number(a.sort_order || 999) - Number(b.sort_order || 999);
                });
                console.log("[TS-Sync] Assessments (delta):", pid, merged2.assessments.length);
            } else if (project.raw_data && Array.isArray(project.raw_data.assessments) && project.raw_data.assessments.length) {
                merged2.assessments = project.raw_data.assessments;
            } else if (Array.isArray(project.assessments) && project.assessments.length) {
                merged2.assessments = project.assessments;
            } else {
                merged2.assessments = [];
            }

            return merged2;
        });
    }


    // ======================================================
    // SYNC-DOWN: PROJECTS
    // ======================================================

    async function syncProjectsDownAsync() {
        try {
            var assembled = await assembleProjectsFromRelationalTablesAsync();

            if (assembled !== null) {
                var existingProjects = [];
                try {
                    existingProjects = JSON.parse(localStorage.getItem("talentscope_projects") || "[]");
                } catch (e) {
                    existingProjects = [];
                }

                if (!Array.isArray(existingProjects)) existingProjects = [];

                var mergedMap = {};
                existingProjects.forEach(function (p) {
                    var id = String(p && (p.id || p.projectId || p.project_id) || "");
                    if (id) mergedMap[id] = p;
                });
                assembled.forEach(function (p) {
                    var id = String(p && (p.id || p.projectId || p.project_id) || "");
                    if (id) mergedMap[id] = p;
                });

                var finalProjects = Object.keys(mergedMap).map(function (id) {
                    return mergedMap[id];
                });

                var json = JSON.stringify(finalProjects);
                PROJECTS_KEYS.forEach(function (key) {
                    localStorage.setItem(key, json);
                });

                console.log("[TS-Sync] Projects synced (delta):", assembled.length, "changed,", finalProjects.length, "total");
                return;
            }

            // Fallback: ts_projects
            var remote = await restGetAsync("/rest/v1/ts_projects?select=id,data");
            if (remote === null) return;

            if (remote.length > 0) {
                var projects = remote.map(function (row) { return row.data; });
                var json2 = JSON.stringify(projects);
                PROJECTS_KEYS.forEach(function (key) {
                    localStorage.setItem(key, json2);
                });
            }
        } catch (error) {
            console.warn("[TS-Sync] syncProjectsDownAsync error:", error);
        }
    }


    // ======================================================
    // SYNC-DOWN: RESULTS
    // ======================================================

    async function syncResultsDownAsync() {
    try {
        // ============================================
        // FIX: ts_results pakai FULL SYNC (bukan delta)
        // Alasan: data kecil (~31 rows), delta sync sering skip data lama
        // ============================================
        var url = "/rest/v1/ts_results?select=" + SELECT_COLS.ts_results;
        // DELTA SYNC DIHAPUS — selalu full sync untuk ts_results

        var remote = await restGetAsync(url);
        if (remote === null) return;

        if (remote.length > 0) {
            var existingResults = readLocalArray(RESULTS_KEY);
            var mergedResultsMap = {};
            
            // Merge data existing (dari localStorage)
            existingResults.forEach(function (r) {
                var key = String(
                    r && (
                        (r.projectId || r.project_id) + "__" + 
                        (r.participantId || r.participant_id) + "__" + 
                        (r.assessmentIndex != null ? r.assessmentIndex : r.assessment_index)
                    ) || ""
                );
                if (key && key.indexOf("undefined") === -1) {
                    mergedResultsMap[key] = r;
                }
            });
            
            // Merge data remote (dari Supabase)
            remote.forEach(function (row) {
                var d = row.data || {};
                // Gabung kolom DB + JSONB — DB sebagai fallback
                var merged = Object.assign({}, d, {
                    projectId: row.project_id || d.projectId,
                    participantId: row.participant_id || d.participantId,
                    assessmentIndex: row.assessment_index != null ? row.assessment_index : d.assessmentIndex,
                    assessmentCode: row.assessment_code || d.assessmentCode,
                    resultType: d.resultType || String(row.assessment_code || "").toUpperCase(),
                    submittedAt: d.submittedAt || row.created_at
                });
                var key = String(
                    (merged.projectId || "") + "__" + 
                    (merged.participantId || "") + "__" + 
                    merged.assessmentIndex
                );
                if (key && key.indexOf("undefined") === -1) {
                    mergedResultsMap[key] = merged;
                }
            });

            var finalResults = Object.keys(mergedResultsMap).map(function (k) {
                return mergedResultsMap[k];
            });

            localStorage.setItem(RESULTS_KEY, JSON.stringify(finalResults));
            console.log("[TS-Sync] Results synced (full):", remote.length, "remote,", finalResults.length, "total");

            // Update per-result keys untuk akses cepat
            remote.forEach(function (row) {
                var pid = row.project_id;
                var parid = row.participant_id;
                var idx = row.assessment_index;
                var code = String(row.assessment_code || "").toLowerCase();
                var json = JSON.stringify(row.data);

                localStorage.setItem("assessment_result_v3_" + pid + "_" + parid + "_" + idx, json);
                localStorage.setItem("assessment_result_" + pid + "_" + parid + "_" + idx, json);

                if (code) {
                    localStorage.setItem(code + "_result_v3_" + pid + "_" + parid + "_" + idx, json);
                    localStorage.setItem(code + "_result_" + pid + "_" + parid + "_" + idx, json);
                }
            });

            setLastSyncTime("ts_results", nowISO());
        }
    } catch (error) {
        console.warn("[TS-Sync] syncResultsDownAsync error:", error);
    }
}


    // ======================================================
    // SYNC-DOWN: USERS
    // ======================================================

    async function syncUsersDownAsync() {
        try {
            var lastSync = getLastSyncTime("ts_users");
            var url = "/rest/v1/ts_users?select=" + SELECT_COLS.ts_users;
            if (lastSync !== "1970-01-01T00:00:00Z") {
                url += "&updated_at=gt." + encodeURIComponent(lastSync);
            }

            var remote = await restGetAsync(url);
            if (remote === null) return;

            if (remote.length > 0) {
                var existingUsers = readLocalArray(USERS_KEY);
                var mergedUsersMap = {};
                existingUsers.forEach(function (u) {
                    if (u && u.id) mergedUsersMap[u.id] = u;
                });
                remote.forEach(function (row) {
                    if (row.data && row.data.id) mergedUsersMap[row.data.id] = row.data;
                });

                var finalUsers = Object.keys(mergedUsersMap).map(function (k) {
                    return mergedUsersMap[k];
                });

                localStorage.setItem(USERS_KEY, JSON.stringify(finalUsers));
                setLastSyncTime("ts_users", nowISO());
            }
        } catch (error) {
            console.warn("[TS-Sync] syncUsersDownAsync error:", error);
        }
    }


    // ======================================================
    // PUSH PRESENCE PESERTA
    // ======================================================

    function shouldPushPresence(participantId) {
        if (!participantId) return false;
        var now = Date.now();
        var last = __tsLastPushMap[participantId] || 0;
        if (now - last < PRESENCE_THROTTLE_MS) return false;
        __tsLastPushMap[participantId] = now;
        return true;
    }

    function pushOneParticipantPresence(participantRowId, participant) {
        if (!participantRowId) {
            return Promise.resolve({ ok: false, skipped: true });
        }

        if (!shouldPushPresence(participantRowId)) {
            return Promise.resolve({ ok: false, skipped: true, reason: "throttled" });
        }

        var fetchFn = (typeof window.fetchWithRetry === "function")
            ? window.fetchWithRetry
            : window.fetch;

        return fetchFn(
            SUPABASE_URL + "/rest/v1/participants?id=eq." + encodeURIComponent(participantRowId) + "&select=raw_data",
            {
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": "Bearer " + getAuthTokenOrAnon(),
                },
                keepalive: true
            }
        )
        .then(function (res) {
            return res.ok ? res.json() : [];
        })
        .then(function (rows) {
            var existingRawData = (rows && rows[0] && rows[0].raw_data) || {};

            var existingHistory = Array.isArray(existingRawData.activityHistory) ? existingRawData.activityHistory : [];
            var localHistory = Array.isArray(participant.activityHistory) ? participant.activityHistory : [];

            var seenHistoryKeys = {};
            var mergedHistory = localHistory.concat(existingHistory).filter(function (item) {
                var key = JSON.stringify([
                    item && item.type,
                    item && (item.activity || item.description),
                    item && item.timestamp
                ]);
                if (seenHistoryKeys[key]) return false;
                seenHistoryKeys[key] = true;
                return true;
            });

            mergedHistory.sort(function (a, b) {
                return new Date((b && b.timestamp) || 0) - new Date((a && a.timestamp) || 0);
            });

            var mergedRawData = Object.assign({}, existingRawData, {
                isLoggedIn: participant.isLoggedIn,
                onlineStatus: participant.onlineStatus,
                loginTime: participant.loginTime,
                loginAt: participant.loginAt,
                loggedInAt: participant.loggedInAt,
                lastLoginAt: participant.lastLoginAt,
                lastSeen: participant.lastSeen,
                lastSeenAt: participant.lastSeenAt,
                lastHeartbeat: participant.lastHeartbeat,
                currentActivity: participant.currentActivity,
                currentTest: participant.currentTest,
                currentAssessmentIndex: participant.currentAssessmentIndex,
                currentAssessmentCode: participant.currentAssessmentCode,
                activity: participant.activity,
                lastActivity: participant.lastActivity,
                activityUpdatedAt: participant.activityUpdatedAt,
                activityHistory: mergedHistory,
                assessmentStatus: participant.assessmentStatus,
                logoutTime: participant.logoutTime,
                loggedOutAt: participant.loggedOutAt,
                logoutAt: participant.logoutAt,
                lastLogoutAt: participant.lastLogoutAt,
                lastLogout: participant.lastLogout,
                waktuLogout: participant.waktuLogout,
                tabSwitchCount: participant.tabSwitchCount,
                tabSwitchLongSwitches: participant.tabSwitchLongSwitches,
                tabSwitchTotalDuration: participant.tabSwitchTotalDuration,
                tabSwitchUpdatedAt: participant.tabSwitchUpdatedAt
            });

            var logoutTimeVal = participant.logoutAt
                || participant.logoutTime
                || participant.lastLogoutAt
                || participant.waktuLogout;

            if (participant.isLoggedIn === false && !logoutTimeVal) {
                logoutTimeVal = nowISO();
                mergedRawData.logoutAt = logoutTimeVal;
                mergedRawData.logoutTime = logoutTimeVal;
                mergedRawData.lastLogoutAt = logoutTimeVal;
                mergedRawData.waktuLogout = logoutTimeVal;
                console.log("[TS-Sync] Auto-generate logout timestamp:", participantRowId, logoutTimeVal);
            }

            var updatePayload = {
                is_logged_in: participant.isLoggedIn === true,
                raw_data: mergedRawData
            };

            var loginTimeVal = participant.loginAt || participant.loginTime || participant.loggedInAt;
            if (loginTimeVal) {
                updatePayload.login_at = loginTimeVal;
                updatePayload.last_login_at = loginTimeVal;
            }

            if (logoutTimeVal) {
                updatePayload.logout_at = logoutTimeVal;
                updatePayload.last_logout_at = logoutTimeVal;
            }

            return fetchFn(
                SUPABASE_URL + "/rest/v1/participants?id=eq." + encodeURIComponent(participantRowId),
                {
                    method: "PATCH",
                    headers: {
                        "apikey": SUPABASE_ANON_KEY,
                        "Authorization": "Bearer " + getAuthTokenOrAnon(),
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    body: JSON.stringify(updatePayload),
                    keepalive: true
                }
            );
        })
        .then(function (res) {
            if (res && !res.ok) {
                return res.text().then(function (text) {
                    console.warn("[TS-Sync] Gagal presence:", participantRowId, res.status, text);
                    return { ok: false, status: res.status };
                });
            }
            return { ok: true };
        })
        .catch(function (error) {
            var errMsg = String(error && error.message || error);

            var isNormalCancel =
                errMsg.indexOf("Failed to fetch") !== -1 ||
                errMsg.indexOf("AbortError") !== -1 ||
                errMsg.indexOf("NetworkError") !== -1;

            if (!isNormalCancel) {
                console.warn("[TS-Sync] Presence error:", participantRowId, error);
            }

            return { ok: false, error: errMsg, silent: isNormalCancel };
        });
    }

    function pushOneParticipantPresenceForce(participantRowId, participant) {
        if (participantRowId) {
            delete __tsLastPushMap[participantRowId];
        }
        return pushOneParticipantPresence(participantRowId, participant);
    }

    window.TalentScopeSync.pushParticipantPresenceNow = pushOneParticipantPresenceForce;

    async function pushParticipantsPresence(projects) {
        var allParticipants = [];

        (projects || []).forEach(function (project) {
            var participants = Array.isArray(project && project.participants) ? project.participants : [];
            participants.forEach(function (p) {
                if (p && p.id) allParticipants.push(p);
            });
        });

        if (allParticipants.length === 0) return [];

        var batches = [];
        for (var i = 0; i < allParticipants.length; i += BATCH_SIZE) {
            batches.push(allParticipants.slice(i, i + BATCH_SIZE));
        }

        var results = [];
        for (var j = 0; j < batches.length; j++) {
            var batch = batches[j];
            var batchResults = await Promise.all(
                batch.map(function (p) {
                    return pushOneParticipantPresence(p.id, p);
                })
            );
            results = results.concat(batchResults);
        }

        return results;
    }


    // ======================================================
    // DEBOUNCED PUSH + FLUSH
    // ======================================================

    function debouncedPush(bucket, fn, delay) {
        clearTimeout(__tsDebounceTimers[bucket]);
        __tsPendingPushes[bucket] = fn;
        __tsDebounceTimers[bucket] = setTimeout(function () {
            delete __tsPendingPushes[bucket];
            fn();
        }, delay || 800);
    }

    function flushPendingPushesNow() {
        Object.keys(__tsPendingPushes).forEach(function (bucket) {
            clearTimeout(__tsDebounceTimers[bucket]);
            var fn = __tsPendingPushes[bucket];
            delete __tsPendingPushes[bucket];
            try {
                fn();
            } catch (error) {
                console.warn("[TS-Sync] Gagal flush:", bucket, error);
            }
        });
    }

    window.addEventListener("pagehide", flushPendingPushesNow);
    window.addEventListener("beforeunload", flushPendingPushesNow);
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
            flushPendingPushesNow();
        }
    });


    // ======================================================
    // WRAP localStorage.setItem
    // ======================================================

    var originalSetItem = localStorage.setItem.bind(localStorage);

    localStorage.setItem = function (key, value) {
        originalSetItem(key, value);

        if (isAutoSyncDisabled()) {
            return;
        }

        try {
            if (PROJECTS_KEYS.indexOf(key) !== -1) {
    debouncedPush("projects", function () {
        var arr = readLocalArray("talentscope_projects");
        
        // ✅ GUARD: hanya admin yang boleh write ke ts_projects
        if (canWriteProjects()) {
            var rows = arr.map(projectToRow).filter(Boolean);
            restUpsert("ts_projects", rows);
        } else {
            console.log("[TS-Sync] Skip write ts_projects — role read-only");
        }
        
        pushParticipantsPresence(arr);
    });
} else if (key === RESULTS_KEY) {
                debouncedPush("results", function () {
                    var arr = readLocalArray(RESULTS_KEY);
                    var rows = arr.map(resultToRow).filter(Boolean);
                    // Skip write ts_results untuk role peserta (RLS block)
var currentRole = "";
try {
    var sessionData = JSON.parse(sessionStorage.getItem("ts_participant_session") || "{}");
    currentRole = sessionData.role || "";
} catch(e) {}
if (currentRole !== "peserta") {
    restUpsert("ts_results", rows);
} else {
    console.log("[TS-Sync] Skip write ts_results — role peserta");
}
                });
            } else if (key === USERS_KEY) {
                debouncedPush("users", function () {
                    var arr = readLocalArray(USERS_KEY);
                    var rows = arr.map(userToRow).filter(Boolean);
                    restUpsert("ts_users", rows);
                });
            }
        } catch (error) {
            console.warn("[TS-Sync] Gagal kirim:", key, error);
        }
    };


    // ======================================================
    // BACKGROUND SYNC â€” DENGAN MIN GAP
    // ======================================================

    function startBackgroundSync() {
        // âœ… Cegah spam: minimal 30s antar sync dari event
        var now = Date.now();
        if (now - __tsLastSyncTrigger < MIN_SYNC_GAP_MS) {
            console.log("[TS-Sync] Skip sync â€” terlalu cepat (" + Math.round((now - __tsLastSyncTrigger) / 1000) + "s lalu)");
            return;
        }
        __tsLastSyncTrigger = now;

        if (__tsSyncInProgress) {
            console.log("[TS-Sync] Sync sudah berjalan, skip");
            return;
        }

        __tsSyncInProgress = true;
        console.log("[TS-Sync] Mulai background sync...");

        Promise.allSettled([
            syncProjectsDownAsync(),
            syncResultsDownAsync(),
            syncUsersDownAsync()
        ]).then(function (results) {
            __tsSyncInProgress = false;
            console.log("[TS-Sync] Background sync selesai");
            results.forEach(function (r, i) {
                if (r.status === "rejected") {
                    console.warn("[TS-Sync] Sync task " + i + " gagal:", r.reason);
                }
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startBackgroundSync);
    } else {
        startBackgroundSync();
    }


    // ======================================================
    // EXPOSE UNTUK DEBUG
    // ======================================================

    window.TalentScopeSync = window.TalentScopeSync || {};
    window.TalentScopeSync.forceSync = startBackgroundSync;

    window.TalentScopeSync.getLastSyncTimes = function () {
        var result = {};
        ["projects", "participants", "project_participants", "project_assessments", "ts_results", "ts_users"].forEach(function (t) {
            result[t] = getLastSyncTime(t);
        });
        return result;
    };

    window.TalentScopeSync.resetDeltaSync = function () {
        ["projects", "participants", "project_participants", "project_assessments", "ts_results", "ts_users"].forEach(function (t) {
            try {
                localStorage.removeItem(SYNC_TS_KEY_PREFIX + t);
            } catch (e) {}
        });
        console.log("[TS-Sync] Delta sync reset â€” refresh halaman untuk full sync ulang");
    };


    // ======================================================
    // AUTO-SYNC â€” 120 DETIK (2 MENIT)
    // ======================================================

    var __tsAutoSyncInterval = null;

    function startAutoSync() {
        if (isAutoSyncDisabled()) {
            console.log("[TS-Sync] Auto-sync DISABLED (flag __TS_DISABLE_AUTO_SYNC aktif)");
            return;
        }

        if (__tsAutoSyncInterval) return;

        // âœ… Interval 120s (2 menit) â€” hemat egress
        __tsAutoSyncInterval = setInterval(function () {
            if (document.visibilityState !== "visible") {
                console.log("[TS-Sync] Skip auto-sync â€” tab tidak aktif");
                return;
            }

            console.log("[TS-Sync] Auto-sync berkala (2 menit)...");
            startBackgroundSync();
        }, AUTO_SYNC_INTERVAL_MS);

        console.log("[TS-Sync] Auto-sync aktif (interval: " + (AUTO_SYNC_INTERVAL_MS / 1000) + "s)");
    }

    function stopAutoSync() {
        if (__tsAutoSyncInterval) {
            clearInterval(__tsAutoSyncInterval);
            __tsAutoSyncInterval = null;
        }
    }

    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
            flushPendingPushesNow();
        } else if (document.visibilityState === "visible") {
            if (isAutoSyncDisabled()) return;

            // âœ… Sudah ada MIN_SYNC_GAP_MS guard di startBackgroundSync
            console.log("[TS-Sync] Tab aktif kembali â€” sync langsung");
            startBackgroundSync();
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startAutoSync);
    } else {
        startAutoSync();
    }

    window.TalentScopeSync.startAutoSync = startAutoSync;
    window.TalentScopeSync.stopAutoSync = stopAutoSync;

    console.log("[TS-Sync] Initialized (refactor fase 3: egress optimization v3)");

})();