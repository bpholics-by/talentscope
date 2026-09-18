/* ==========================================================
   DATABASE — CONFIG & SESSION
   ----------------------------------------------------------
   Berisi:
   - STORAGE_KEY konstanta
   - Helper: getRawData, pickField
   - Session user saat ini
   - State global: rawDatabaseParticipants
========================================================== */

(function () {
    "use strict";

    window.DB = window.DB || {};

    // Konstanta
    DB.STORAGE_KEY = "talentscope_participants";
    DB.PROJECTS_KEY = "talentscope_projects";

    // Helper: Ambil raw_data dari peserta
    DB.getRawData = function (item) {
        try {
            const raw = item && item.raw_data;
            if (!raw) return {};
            if (typeof raw === "string") return JSON.parse(raw);
            if (typeof raw === "object") return raw;
        } catch (e) {
            console.warn("Gagal membaca raw_data peserta:", e);
        }
        return {};
    };

    // Helper: Ambil field dari beberapa kemungkinan lokasi
    DB.pickField = function (item, keys, fallback) {
        for (const k of keys) {
            const v = item ? item[k] : undefined;
            if (v !== undefined && v !== null && String(v).trim() !== "") {
                return v;
            }
        }
        const raw = DB.getRawData(item);
        for (const k of keys) {
            const v = raw ? raw[k] : undefined;
            if (v !== undefined && v !== null && String(v).trim() !== "") {
                return v;
            }
        }
        return fallback !== undefined ? fallback : "-";
    };

    // Session user (dari login.html)
    DB.currentUserSession =
        JSON.parse(sessionStorage.getItem("ts_admin_session")) ||
        JSON.parse(localStorage.getItem("talentscope_current_user")) ||
        JSON.parse(localStorage.getItem("userSession")) || {
            username: "admin",
            role: "System Administrator",
            company: "",
            assignedProjects: []
        };

    // State global
    DB.rawDatabaseParticipants = [];

    console.log("[DB] Config initialized");
})();