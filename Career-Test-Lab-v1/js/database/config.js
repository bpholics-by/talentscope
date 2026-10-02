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
    // Session user — PRIORITAS: Supabase Auth, fallback ke storage lama
(function buildCurrentUserSession() {
    var session = null;

    // 1. Coba baca dari Supabase Auth (sessionStorage/localStorage)
    try {
        var sb = window.supabaseClient;
        if (sb && sb.supabaseUrl) {
            var projectRef = sb.supabaseUrl.split('//')[1].split('.')[0];
            var storageKey = 'sb-' + projectRef + '-auth-token';
            var sessionRaw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
            if (sessionRaw) {
                var parsed = JSON.parse(sessionRaw);
                if (parsed && parsed.user) {
                    var meta = parsed.user.user_metadata || {};
                    session = {
                        id: parsed.user.id,
                        email: parsed.user.email,
                        username: meta.username || parsed.user.email.split("@")[0],
                        role: meta.role || "Peserta",
                        name: meta.name || meta.username || parsed.user.email.split("@")[0],
                        company: meta.company || "",
                        projectId: meta.projectId || "",
                        assignedProjects: meta.projectId ? [meta.projectId] : []
                    };
                }
            }
        }
    } catch (e) {
        console.warn("[DB Config] Supabase Auth read error:", e);
    }

    // 2. Fallback ke storage lama
    if (!session) {
        session =
            JSON.parse(sessionStorage.getItem("ts_admin_session") || "null") ||
            JSON.parse(localStorage.getItem("talentscope_current_user") || "null") ||
            JSON.parse(localStorage.getItem("userSession") || "null");
    }

    // 3. Fallback terakhir
    if (!session) {
        session = {
            username: "admin",
            role: "System Administrator",
            company: "",
            assignedProjects: []
        };
    }

    // 4. Enrich dari ts_users (via localStorage `talentscope_settings_users`)
    //    Supaya `company` & `projectId` terisi kalau metadata belum ada
    try {
        var users = JSON.parse(localStorage.getItem("talentscope_settings_users") || "[]");
        if (Array.isArray(users) && session.username) {
            var tsUser = users.find(function(u) {
                return u && (u.username === session.username || u.email === session.email);
            });
            if (tsUser) {
                if (!session.company && tsUser.company) session.company = tsUser.company;
                if (!session.projectId && tsUser.projectId) session.projectId = tsUser.projectId;
                if (!session.assignedProjects || !session.assignedProjects.length) {
                    session.assignedProjects = tsUser.projectId ? [tsUser.projectId] : [];
                }
            }
        }
    } catch (e) {
        console.warn("[DB Config] ts_users enrich error:", e);
    }

    DB.currentUserSession = session;
    console.log("[DB Config] currentUserSession:", DB.currentUserSession);
})();

    // State global
    DB.rawDatabaseParticipants = [];

    console.log("[DB] Config initialized");
})();