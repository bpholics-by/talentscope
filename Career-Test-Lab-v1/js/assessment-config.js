/* ============================================================
   TALENTSCOPE — ASSESSMENT CONFIG LOADER
   ------------------------------------------------------------
   Single source of truth untuk semua metadata tes.
   
   Fungsi:
   - Fetch metadata dari tabel `assessment_metadata` di Supabase
   - Cache di window.ASSESSMENT_METADATA (Map by code & UUID)
   - Cache di localStorage untuk offline/fallback
   - Helper functions: getMetadata, getRoute, getTable, getIcon
   
   Cara pakai:
   <script src="js/assessment-config.js"></script>
   
   Lalu akses:
   window.ASSESSMENT_CONFIG.getRoute("DISC")  → "test-result.html"
   window.ASSESSMENT_CONFIG.getTable("TPDK")  → "tpdk_results"
   ============================================================ */

;(function (global) {
    "use strict";

    // ============================================================
    // CONFIG
    // ============================================================
    var CACHE_KEY = "ts_assessment_metadata_cache";
    var CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam

    // ============================================================
    // STATE
    // ============================================================
    var metadataByCode = {};   // { "DISC": {...}, "TPDK": {...} }
    var metadataById = {};     // { "6266a366-...": {...} }
    var loaded = false;
    var loadingPromise = null;

    // ============================================================
    // SUPABASE CLIENT
    // ============================================================
    function getSupabaseClient() {
        var client = global.supabaseClient || global.supabase;
        if (client && typeof client.from === "function") {
            return client;
        }
        return null;
    }

    // ============================================================
    // LOAD FROM SUPABASE
    // ============================================================
    async function fetchFromSupabase() {
        var sb = getSupabaseClient();
        if (!sb) {
            console.warn("[ASSESSMENT-CONFIG] Supabase client belum tersedia");
            return null;
        }

        try {
            var result = await sb
                .from("assessment_metadata")
                .select("*")
                .eq("is_active", true)
                .order("sort_order", { ascending: true });

            if (result.error) {
                console.error("[ASSESSMENT-CONFIG] Gagal fetch:", result.error);
                return null;
            }

            if (!Array.isArray(result.data) || result.data.length === 0) {
                console.warn("[ASSESSMENT-CONFIG] Metadata kosong");
                return null;
            }

            console.log("[ASSESSMENT-CONFIG] ✅ Loaded", result.data.length, "assessment(s)");
            return result.data;

        } catch (err) {
            console.error("[ASSESSMENT-CONFIG] Exception:", err);
            return null;
        }
    }

    // ============================================================
    // LOAD FROM LOCALSTORAGE CACHE
    // ============================================================
    function loadFromCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;

            var cached = JSON.parse(raw);
            if (!cached || !Array.isArray(cached.data)) return null;

            // Cek TTL
            if (cached.timestamp && (Date.now() - cached.timestamp) > CACHE_TTL_MS) {
                console.log("[ASSESSMENT-CONFIG] Cache expired");
                return null;
            }

            console.log("[ASSESSMENT-CONFIG] Loaded from cache:", cached.data.length, "assessment(s)");
            return cached.data;

        } catch (err) {
            console.warn("[ASSESSMENT-CONFIG] Cache parse error:", err);
            return null;
        }
    }

    // ============================================================
    // SAVE TO CACHE
    // ============================================================
    function saveToCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
        } catch (err) {
            console.warn("[ASSESSMENT-CONFIG] Gagal save cache:", err);
        }
    }

    // ============================================================
    // BUILD INDEXES (by code & by UUID)
    // ============================================================
    function buildIndexes(dataArray) {
        metadataByCode = {};
        metadataById = {};

        dataArray.forEach(function (item) {
            if (!item || !item.assessment_code) return;

            var meta = {
                id: item.id,
                code: item.assessment_code,
                name: item.assessment_name,
                category: item.category || "Behavior",
                testPage: item.test_page,
                reportPage: item.report_page,
                resultTable: item.result_table,
                icon: item.icon || "fa-clipboard-check",
                duration: item.duration_minutes || 30,
                sortOrder: item.sort_order || 999
            };

            metadataByCode[item.assessment_code.toUpperCase()] = meta;

            // Kalau ada UUID linked (dari assessments master table)
            if (item.assessment_id) {
                metadataById[String(item.assessment_id).toLowerCase()] = meta;
            }
        });

        console.log("[ASSESSMENT-CONFIG] Indexed:", Object.keys(metadataByCode).length, "code(s)");
    }

    // ============================================================
    // LOAD (MAIN FUNCTION)
    // ============================================================
    async function loadMetadata(forceRefresh) {
        if (loaded && !forceRefresh) {
            return { byCode: metadataByCode, byId: metadataById };
        }

        if (loadingPromise && !forceRefresh) {
            return loadingPromise;
        }

        loadingPromise = (async function () {
            // 1. Coba Supabase dulu
            var data = await fetchFromSupabase();

            // 2. Fallback cache
            if (!data) {
                data = loadFromCache();
            }

            // 3. Kalau tidak ada, return empty
            if (!data) {
                console.warn("[ASSESSMENT-CONFIG] Tidak ada data metadata");
                loaded = true;
                return { byCode: {}, byId: {} };
            }

            // 4. Build indexes
            buildIndexes(data);

            // 5. Save cache
            saveToCache(data);

            loaded = true;
            return { byCode: metadataByCode, byId: metadataById };
        })();

        return loadingPromise;
    }

    // ============================================================
    // HELPER FUNCTIONS (Public API)
    // ============================================================

    /**
     * Get metadata by code (mis. "DISC") atau UUID
     */
    function getMetadata(codeOrUuid) {
        if (!codeOrUuid) return null;
        var key = String(codeOrUuid).trim();

        // Coba by code (uppercase)
        var byCode = metadataByCode[key.toUpperCase()];
        if (byCode) return byCode;

        // Coba by UUID (lowercase)
        var byId = metadataById[key.toLowerCase()];
        if (byId) return byId;

        return null;
    }

    /**
     * Get report page route
     * Fallback: test-result.html
     */
    function getRoute(codeOrUuid) {
        var meta = getMetadata(codeOrUuid);
        return meta ? meta.reportPage : "test-result.html";
    }

    /**
     * Get test page route
     * Fallback: null
     */
    function getTestPage(codeOrUuid) {
        var meta = getMetadata(codeOrUuid);
        return meta ? meta.testPage : null;
    }

    /**
     * Get result table name (Supabase)
     * Fallback: null
     */
    function getTable(codeOrUuid) {
        var meta = getMetadata(codeOrUuid);
        return meta ? meta.resultTable : null;
    }

    /**
     * Get icon class (FontAwesome)
     */
    function getIcon(codeOrUuid) {
        var meta = getMetadata(codeOrUuid);
        return meta ? meta.icon : "fa-clipboard-check";
    }

    /**
     * Get assessment name
     */
    function getName(codeOrUuid) {
        var meta = getMetadata(codeOrUuid);
        return meta ? meta.name : null;
    }

    /**
     * Get all metadata
     */
    function getAll() {
        return Object.values(metadataByCode);
    }

    /**
     * Detect code from free text (nama tes)
     * Berguna untuk fallback kalau cuma ada nama
     */
    function detectCodeFromName(name) {
        if (!name) return null;
        var upper = String(name).toUpperCase();

        // Loop semua metadata, cari yang name-nya mengandung keyword
        var keys = Object.keys(metadataByCode);
        for (var i = 0; i < keys.length; i++) {
            var code = keys[i];
            var meta = metadataByCode[code];
            if (!meta) continue;

            // Cek code match
            if (upper.indexOf(code) !== -1) return code;

            // Cek name keyword match
            var nameUpper = String(meta.name).toUpperCase();
            if (upper.indexOf(nameUpper) !== -1) return code;

            // Cek kata kunci spesifik
            if (code === "LSJT" && (upper.indexOf("LEADERSHIP") !== -1)) return code;
            if (code === "MSJT" && (upper.indexOf("MANAGERIAL") !== -1)) return code;
            if (code === "TPDK" && (upper.indexOf("PENALARAN") !== -1)) return code;
            if (code === "VAP" && (upper.indexOf("WORK PERFORMANCE") !== -1 || upper.indexOf("SUSTAINED") !== -1)) return code;
            if (code === "PAPI" && upper.indexOf("KOSTICK") !== -1) return code;
        }

        return null;
    }

    // ============================================================
    // EXPORT PUBLIC API
    // ============================================================
    global.ASSESSMENT_CONFIG = {
        // Load
        load: loadMetadata,
        refresh: function () { return loadMetadata(true); },

        // Get
        getMetadata: getMetadata,
        getRoute: getRoute,
        getTestPage: getTestPage,
        getTable: getTable,
        getIcon: getIcon,
        getName: getName,
        getAll: getAll,
        detectCodeFromName: detectCodeFromName,

        // Status
        isLoaded: function () { return loaded; },

        // Debug
        _state: function () { return { byCode: metadataByCode, byId: metadataById }; }
    };

    // ============================================================
    // AUTO-LOAD
    // ============================================================
    // Load saat pertama kali dipanggil, atau saat DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            loadMetadata();
        });
    } else {
        loadMetadata();
    }

    console.log("[ASSESSMENT-CONFIG] Module initialized");

})(window);