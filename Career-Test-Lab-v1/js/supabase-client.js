// ============================================
// SUPABASE CLIENT (REFACTOR FASE 1)
// Centralized Supabase Connection + Resilience
// ============================================
//
// IMPROVEMENTS:
// 1. fetchWithTimeout()   — request di-abort kalau > 15 detik
// 2. retryWithBackoff()   — auto-retry 3× dengan exponential backoff
// 3. Custom fetch di client — semua request otomatis pakai timeout
// 4. Compatibility check  — error jelas kalau library belum load
// ============================================

(function () {
    "use strict";

    // ============================================
    // CONFIGURATION
    // ============================================

    // FIX: Baca dari config global
var SUPABASE_URL = (window.TS_CONFIG && window.TS_CONFIG.SUPABASE_URL) || '';
var SUPABASE_ANON_KEY = (window.TS_CONFIG && window.TS_CONFIG.SUPABASE_ANON_KEY) || '';

// Validasi
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[SUPABASE] Config belum diisi! Buka js/config.js");
}

    var REQUEST_TIMEOUT_MS = 15000;   // 15 detik
    var MAX_RETRIES = 3;
    var RETRY_BASE_DELAY_MS = 500;    // 500ms, 1s, 2s


    // ============================================
    // COMPATIBILITY CHECK
    // ============================================

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        console.error(
            "[SUPABASE] Library @supabase/supabase-js belum dimuat. " +
            "Pastikan <script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"> " +
            "dimuat SEBELUM file ini."
        );
        return;
    }


    // ============================================
    // FETCH WITH TIMEOUT
    // ============================================
    //
    // Bungkus fetch() dengan AbortController supaya
    // request yang hang > REQUEST_TIMEOUT_MS otomatis
    // di-abort, tidak menggantung selamanya.
    // ============================================

    function fetchWithTimeout(input, init) {
        init = init || {};

        // Kalau caller sudah punya signal sendiri, hormati.
        if (init.signal) {
            return fetch(input, init);
        }

        var controller = new AbortController();
        var timeoutId = setTimeout(function () {
            controller.abort();
        }, REQUEST_TIMEOUT_MS);

        init.signal = controller.signal;

        return fetch(input, init).then(
            function (response) {
                clearTimeout(timeoutId);
                return response;
            },
            function (error) {
                clearTimeout(timeoutId);

                // Custom message untuk AbortError
                if (error && error.name === "AbortError") {
                    var timeoutErr = new Error(
                        "[SUPABASE] Request timeout setelah " +
                        REQUEST_TIMEOUT_MS + "ms"
                    );
                    timeoutErr.name = "TimeoutError";
                    timeoutErr.isTimeout = true;
                    throw timeoutErr;
                }

                throw error;
            }
        );
    }


    // ============================================
    // RETRY WITH BACKOFF
    // ============================================
    //
    // Bungkus fetch dengan retry otomatis untuk error
    // network / 5xx / 429 (rate limit). Tidak retry
    // untuk 4xx (client error — retry tidak akan berhasil).
    // ============================================

    function shouldRetry(response, error) {
        // Error network / timeout → retry
        if (error) {
            if (error.isTimeout) return true;
            // Network error biasanya TypeError: Failed to fetch
            if (error.name === "TypeError") return true;
            return false;
        }

        // Response error → cek status
        if (!response) return false;
        if (response.status === 429) return true;   // Rate limit
        if (response.status >= 500) return true;   // Server error
        return false;
    }

    function fetchWithRetry(input, init) {
        var attempt = 0;

        function tryOnce() {
            attempt++;

            return fetchWithTimeout(input, init).then(
                function (response) {
                    if (shouldRetry(response, null) && attempt < MAX_RETRIES) {
                        var delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
                        console.warn(
                            "[SUPABASE] Request gagal (status " + response.status +
                            "), retry " + attempt + "/" + MAX_RETRIES +
                            " dalam " + delay + "ms"
                        );
                        return new Promise(function (resolve) {
                            setTimeout(resolve, delay);
                        }).then(tryOnce);
                    }
                    return response;
                },
                function (error) {
                    if (shouldRetry(null, error) && attempt < MAX_RETRIES) {
                        var delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
                        console.warn(
                            "[SUPABASE] Request gagal (" +
                            (error && error.message || "unknown") +
                            "), retry " + attempt + "/" + MAX_RETRIES +
                            " dalam " + delay + "ms"
                        );
                        return new Promise(function (resolve) {
                            setTimeout(resolve, delay);
                        }).then(tryOnce);
                    }
                    throw error;
                }
            );
        }

        return tryOnce();
    }


    // ============================================
    // CREATE SUPABASE CLIENT
    // ============================================
    //
    // Semua request lewat custom fetch (timeout + retry).
    // ============================================

    var supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: false,  // Kita tidak pakai Supabase Auth
                autoRefreshToken: false,
                detectSessionInUrl: false
            },
            global: {
                headers: {
                    "x-application-name": "TalentScope"
                },
                fetch: fetchWithRetry  // ← custom fetch
            }
        }
    );


    // ============================================
    // CONNECTION TEST
    // ============================================

    async function testSupabaseConnection() {
        try {
            var result = await supabaseClient
                .from('projects')
                .select('id')
                .limit(1);

            if (result.error) {
                console.error('[SUPABASE] Connection failed:', result.error);
                return false;
            }

            console.log('[SUPABASE] Connection successful');
            return true;
        } catch (error) {
            console.error('[SUPABASE] Unexpected connection error:', error);
            return false;
        }
    }


    // ============================================
    // GLOBAL AVAILABILITY
    // ============================================

    window.supabaseClient = supabaseClient;
    window.testSupabaseConnection = testSupabaseConnection;
    window.fetchWithTimeout = fetchWithTimeout;   // expose untuk debug

    console.log(
        '[SUPABASE] Client initialized (timeout: ' +
        REQUEST_TIMEOUT_MS + 'ms, retry: ' + MAX_RETRIES + '×)'
    );

})();