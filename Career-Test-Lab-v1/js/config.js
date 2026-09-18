/* ==========================================================
   TALENTSCOPE — KONFIGURASI GLOBAL
   ----------------------------------------------------------
   ⚠️ FILE INI UNTUK WHITE-LABEL
   
   Kalau jual folder ke client, mereka cukup edit file INI
   SAJA — tidak perlu edit file lain.
   
   VERSION: 2.0.0
   LAST UPDATE: 2026-09-18
   CHANGELOG:
   - Tambah API_BASE (fix 404 error)
   - Tambah backward compatibility (window.SUPABASE_URL)
   - Tambah FEATURES.TPDK
   - Tambah auto-derive API_BASE dari SUPABASE_URL
========================================================== */

(function() {
    "use strict";

    // ======================================================
    // ⚠️ SUPABASE — WAJIB DIISI
    // ======================================================
    // Ganti 2 nilai di bawah ini dengan kredensial Supabase Anda
    // Cara mendapatkan:
    // 1. Buka https://supabase.com
    // 2. Pilih project Anda
    // 3. Klik Settings → API
    // 4. Copy "Project URL" dan "anon public key"
    // ======================================================
    
    const SUPABASE_URL = "https://nixmychfhsnsvymkuxtm.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peG15Y2hmaHNuc3Z5bWt1eHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NzU0MzMsImV4cCI6MjEwMzA1MTQzM30.Ak9SMJkhwtTlo8zIcHha8uecF4ayz172zIwGbdliNm4";

    // ======================================================
    // KONFIGURASI GLOBAL
    // ======================================================
    
    window.TS_CONFIG = {

        // ==================================================
        // SUPABASE
        // ==================================================
        SUPABASE_URL: SUPABASE_URL,
        SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
        
        // API_BASE — otomatis derive dari SUPABASE_URL
        // Format: https://[project-id].supabase.co/rest/v1
        API_BASE: SUPABASE_URL + "/rest/v1",

        // ==================================================
        // BRANDING — OPSIONAL
        // ==================================================
        APP_NAME: "TalentScope",
        APP_VERSION: "1.0.0",
        LOGO_URL: "",
        PRIMARY_COLOR: "#2563eb",

        // ==================================================
        // FEATURE FLAGS — OPSIONAL
        // ==================================================
        FEATURES: {
            DISC: true,
            PAPI: true,
            VAP: true,
            MSJT: true,
            LSJT: true,
            TPDK: true      // ← BARU: Tes Penalaran Dunia Kerja
        },

        // ==================================================
        // TIMEOUT & RETRY
        // ==================================================
        REQUEST_TIMEOUT_MS: 15000,
        MAX_RETRIES: 3,
        RETRY_BASE_DELAY_MS: 500,

        // ==================================================
        // SYNC CONFIG
        // ==================================================
        AUTO_SYNC_INTERVAL_MS: 60000,
        PRESENCE_THROTTLE_MS: 60000,
        BATCH_SIZE: 2

    };

    // ======================================================
    // ⚠️ BACKWARD COMPATIBILITY
    // ------------------------------------------------------
    // Untuk file lama yang masih pakai:
    // - window.SUPABASE_URL
    // - window.SUPABASE_ANON_KEY
    // - window.API_BASE
    // ======================================================
    
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    window.API_BASE = SUPABASE_URL + "/rest/v1";

    // ======================================================
    // FREEZE CONFIG (immutable)
    // ======================================================
    
    Object.freeze(window.TS_CONFIG);
    Object.freeze(window.TS_CONFIG.FEATURES);

    // ======================================================
    // CONSOLE LOG — VERIFIKASI
    // ======================================================
    
    console.log(
        "%c[CONFIG v2.0] ✓ Loaded",
        "color:#2563eb;font-weight:bold;font-size:12px",
        {
            supabaseUrl: window.TS_CONFIG.SUPABASE_URL,
            apiBase: window.TS_CONFIG.API_BASE,
            appName: window.TS_CONFIG.APP_NAME,
            version: window.TS_CONFIG.APP_VERSION,
            features: Object.keys(window.TS_CONFIG.FEATURES).filter(k => window.TS_CONFIG.FEATURES[k])
        }
    );

})();