/* =========================================================
   TALENTSCOPE — DEBUG REDIRECT TRACER
   =========================================================
   File ini mencegat semua redirect (location.replace /
   location.href / location.assign) dan mencatatnya
   ke console + sessionStorage.
   
   Tujuan: cari tahu SIAPA yang redirect & KE MANA.
   Hapus file ini setelah debug selesai.
   ========================================================= */

;(function () {
    "use strict";

    if (window.__TS_REDIRECT_TRACER__) return;   // avoid double
    window.__TS_REDIRECT_TRACER__ = true;

    var LOG_KEY = "__ts_redirect_log";
    var PAGE = window.location.pathname.split("/").pop() || "unknown";

    function log(msg, extra) {
        var entry = {
            t: new Date().toISOString(),
            page: PAGE,
            msg: msg,
            extra: extra || null
        };
        try {
            var arr = JSON.parse(sessionStorage.getItem(LOG_KEY) || "[]");
            arr.push(entry);
            sessionStorage.setItem(LOG_KEY, JSON.stringify(arr));
        } catch (e) {}
        console.log("%c[REDIRECT-TRACE] " + PAGE + " | " + msg,
                    "background:#ffcc00;color:#000;padding:2px 4px;border-radius:3px;",
                    extra || "");
    }

    function stack() {
        try { throw new Error(); } catch (e) {
            // Ambil 3 frame di atas file ini
            return String(e.stack || "").split("\n").slice(2, 6).join(" | ");
        }
        return "";
    }

    // Patch location.replace
    var origReplace = window.location.replace.bind(window.location);
    try {
        window.location.replace = function (url) {
            log("location.replace → " + url, { stack: stack() });
            return origReplace(url);
        };
    } catch (e) { console.warn("[REDIRECT-TRACE] cannot patch replace", e); }

    // Patch location.assign
    var origAssign = window.location.assign.bind(window.location);
    try {
        window.location.assign = function (url) {
            log("location.assign → " + url, { stack: stack() });
            return origAssign(url);
        };
    } catch (e) { console.warn("[REDIRECT-TRACE] cannot patch assign", e); }

    // Patch location.href (via defineProperty)
    try {
        var origHref = window.location.href;
        Object.defineProperty(window.location, "href", {
            get: function () { return origHref; },
            set: function (url) {
                log("location.href = " + url, { stack: stack() });
                origHref = url;
                window.location.replace(url);
            },
            configurable: true
        });
    } catch (e) { console.warn("[REDIRECT-TRACE] cannot patch href", e); }

    log("tracer installed");

    // Helper: dump log
    window.__tsDumpRedirects = function () {
        try {
            var arr = JSON.parse(sessionStorage.getItem(LOG_KEY) || "[]");
            console.table(arr);
            return arr;
        } catch (e) { return []; }
    };

    window.__tsClearRedirects = function () {
        sessionStorage.removeItem(LOG_KEY);
        console.log("[REDIRECT-TRACE] log cleared");
    };

    console.log("%c[REDIRECT-TRACE] Installed on " + PAGE,
                "background:#00ff88;color:#000;padding:2px 6px;border-radius:3px;font-weight:bold;");
})();