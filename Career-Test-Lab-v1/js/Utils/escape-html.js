/* ==========================================================
   ESCAPE HTML — Utility (Unified)
   ----------------------------------------------------------
   Satu sumber kebenaran untuk escape HTML di seluruh aplikasi.
   Gantikan 13+ duplikat fungsi escapeHtml di berbagai file.
========================================================== */

(function () {
    "use strict";
    
    if (typeof window.escapeHtml === "function") {
        return; // Sudah ada, skip
    }
    
    window.escapeHtml = function (s) {
        if (s === undefined || s === null) return "";
        return String(s).replace(/[&<>"']/g, function (c) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[c];
        });
    };
    
    // Alias uppercase (untuk konsistensi dengan escapeHTML di view-monitoring)
    if (typeof window.escapeHTML !== "function") {
        window.escapeHTML = window.escapeHtml;
    }
})();