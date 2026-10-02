/* =========================================================
   TALENTSCOPE — AUTH-GUARD.JS (SUPABASE AUTH MODE) - FIXED
   ========================================================= */

;(function (global) {
    "use strict";

    var LOGIN_PAGE = "login.html";
    var DASHBOARD_PAGE = "dashboard.html";
    var PARTICIPANT_PAGE = "participant-dashboard.html";

    function getSupabase() {
        return window.supabaseClient || null;
    }

    // ============================================================
    // SESSION FUNCTIONS
    // ============================================================
    async function getSession() {
        var sb = getSupabase();
        if (!sb) return null;
        try {
            var result = await sb.auth.getSession();
            if (result.error) return null;
            return result.data ? result.data.session : null;
        } catch (err) {
            return null;
        }
    }

    async function getUser() {
        var session = await getSession();
        return session && session.user ? session.user : null;
    }

    async function isAuthenticated() {
        var session = await getSession();
        return !!session;
    }

    async function getUserRole() {
        var user = await getUser();
        if (!user) return "";
        return (user.user_metadata && user.user_metadata.role) || "";
    }

    // ============================================================
    // REDIRECT
    // ============================================================
    function goToLogin(reason) {
        if (reason) console.log("[AUTH-GUARD] Redirect ke login:", reason);
        var here = window.location.pathname.split("/").pop() || "";
        if (here === LOGIN_PAGE) return;
        window.location.replace(LOGIN_PAGE);
    }

    function redirectByRole(role) {
        var r = String(role || "").toLowerCase();
        if (r === "peserta" || r === "participant") {
            window.location.replace(PARTICIPANT_PAGE);
        } else {
            window.location.replace(DASHBOARD_PAGE);
        }
    }

    // ============================================================
    // ROLE NORMALIZER
    // ============================================================
    function normalizeRole(rawRole) {
        var role = String(rawRole || "").toLowerCase().trim().replace(/\s+/g, "_");
        if (role === "system_administrator" || role === "system_admin") return "system_admin";
        if (role === "client_administrator" || role === "client_admin" || role === "clientadmin") return "clientadmin";
        if (role === "client_user" || role === "clientuser") return "clientuser";
        if (role === "asesor" || role === "assessor") return "asesor";
        if (role === "peserta" || role === "participant") return "peserta";
        return role;
    }

    // ============================================================
    // AUTO UPDATE HEADER (DIPERBAIKI)
    // ============================================================
    async function autoUpdateHeader() {
        try {
            var sb = window.supabaseClient;
            if (!sb || !sb.auth) return;

            var { data: { session } } = await sb.auth.getSession();
            if (!session || !session.user) return;

            var user = session.user;
            var meta = user.user_metadata || {};
            var role = meta.role || "User";
            var name = meta.name || meta.username || (user.email ? user.email.split("@")[0] : "User");

            var nameEl = document.querySelector(".header-user-name");
            if (nameEl) nameEl.textContent = name;

            var roleEl = document.querySelector(".header-user-role");
            if (roleEl) roleEl.textContent = role;

            var avatarEl = document.querySelector(".header-avatar");
            if (avatarEl && name) avatarEl.textContent = name.charAt(0).toUpperCase();
        } catch (e) {
            // silent
        }
    }

    // ============================================================
    // INJECT CSS ANTI-FLASH
    // ============================================================
    (function injectAntiFlashCSS() {
        if (document.getElementById("ts-anti-flash-css")) return;
        var style = document.createElement("style");
        style.id = "ts-anti-flash-css";
        style.textContent = [
            'html[data-ts-role="clientuser"] .sidebar a[href*="assessment-catalog"],',
            'html[data-ts-role="clientuser"] .sidebar li:has(a[href*="assessment-catalog"]),',
            'html[data-ts-role="clientuser"] .sidebar a[href*="settings"],',
            'html[data-ts-role="clientuser"] .sidebar li:has(a[href*="settings"]),',
            'html[data-ts-role="asesor"] .sidebar a[href*="assessment-catalog"],',
            'html[data-ts-role="asesor"] .sidebar li:has(a[href*="assessment-catalog"]),',
            'html[data-ts-role="asesor"] .sidebar a[href*="settings"],',
            'html[data-ts-role="asesor"] .sidebar li:has(a[href*="settings"]),',
            'html[data-ts-role="clientadmin"] .sidebar a[href*="settings"],',
            'html[data-ts-role="clientadmin"] .sidebar li:has(a[href*="settings"]),',
            'html[data-ts-role="clientuser"] button[data-action="create-project"],',
            'html[data-ts-role="asesor"] button[data-action="create-project"],',
            'html[data-ts-role="clientuser"] button.btn-create-project,',
            'html[data-ts-role="asesor"] button.btn-create-project',
            '{ display: none !important; visibility: hidden !important; }'
        ].join("");
        document.head.appendChild(style);
    })();

    // ============================================================
    // AUTO UPDATE SIDEBAR (DIPERBAIKI)
    // ============================================================
    async function autoUpdateSidebar() {
        try {
            var sb = window.supabaseClient;
            if (!sb || !sb.auth) return;

            var { data: { session } } = await sb.auth.getSession();
            if (!session || !session.user) return;

            var meta = session.user.user_metadata || {};
            var role = normalizeRole(meta.role);

            document.documentElement.setAttribute("data-ts-role", role);

            var hideList = [];
            if (role === "system_admin") {
                hideList = [];
            } else if (role === "clientadmin") {
                hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
            } else if (role === "clientuser" || role === "asesor") {
                hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
            } else if (role === "peserta") {
                hideList = ["Assessment Catalog", "Assessment Project", "Assessment Detail",
                            "Participants", "Project Access", "Test Builder", "Test Bank", "Settings"];
            } else {
                hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
            }

            if (hideList.length > 0) {
                var selectors = [
                    ".sidebar .menu a", ".sidebar .menu li",
                    ".sidebar nav a", ".sidebar nav li", ".sidebar a"
                ];
                var links = document.querySelectorAll(selectors.join(", "));
                links.forEach(function (link) {
                    var text = (link.textContent || "").trim();
                    hideList.forEach(function (menuName) {
                        if (text.includes(menuName)) {
                            var target = link.tagName === "A" && link.parentElement && link.parentElement.tagName === "LI"
                                ? link.parentElement
                                : link;
                            target.style.setProperty("display", "none", "important");
                        }
                    });
                });
            }

            if (role === "clientuser" || role === "asesor") {
                document.querySelectorAll("button").forEach(function (btn) {
                    if ((btn.textContent || "").trim().includes("Create Project")) {
                        btn.style.setProperty("display", "none", "important");
                    }
                });
            }
        } catch (e) {
            console.warn("[AUTH-GUARD] autoUpdateSidebar error:", e);
        }
    }

    // ============================================================
    // INIT — TUNGGU SESSION SIAP
    // ============================================================
    async function initAuthGuard() {
        var sb = getSupabase();
        if (!sb) {
            console.warn("[AUTH-GUARD] Supabase client tidak tersedia");
            return;
        }

        // Coba getSession dulu
        var session = await getSession();

        // Jika belum ada, tunggu event INITIAL_SESSION
        if (!session) {
            await new Promise(function(resolve) {
                var resolved = false;
                var timeout = setTimeout(function() {
                    if (!resolved) { resolved = true; resolve(); }
                }, 3000);

                var { data: { subscription } } = sb.auth.onAuthStateChange(function(event, sess) {
                    if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && !resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        subscription.unsubscribe();
                        resolve();
                    }
                });
            });
        }

        // Setelah session siap (atau timeout), jalankan update
        await autoUpdateHeader();
        await autoUpdateSidebar();
    }

    // ============================================================
    // EXPORT
    // ============================================================
    global.TS_AUTH = {
        getSession: getSession,
        getUser: getUser,
        isAuthenticated: isAuthenticated,
        getUserRole: getUserRole,
        goToLogin: goToLogin,
        redirectByRole: redirectByRole,
        autoUpdateHeader: autoUpdateHeader,
        autoUpdateSidebar: autoUpdateSidebar,
        logout: async function() {
            var sb = getSupabase();
            if (sb) { try { await sb.auth.signOut(); } catch(e){} }
            window.location.replace(LOGIN_PAGE);
        },
        clearSession: function() { console.warn("Deprecated"); },
        saveSession: function() { console.warn("Deprecated"); }
    };
    // ============================================================
    // INIT — TUNGGU SESSION SIAP
    // ============================================================
    async function initAuthGuard() {
        var sb = getSupabase();
        if (!sb) {
            console.warn("[AUTH-GUARD] Supabase client tidak tersedia");
            return;
        }

        // Coba getSession dulu
        var session = await getSession();

        // Jika belum ada, tunggu event INITIAL_SESSION
        if (!session) {
            await new Promise(function(resolve) {
                var resolved = false;
                var timeout = setTimeout(function() {
                    if (!resolved) { resolved = true; resolve(); }
                }, 3000);

                var { data: { subscription } } = sb.auth.onAuthStateChange(function(event, sess) {
                    if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && !resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        subscription.unsubscribe();
                        resolve();
                    }
                });
            });
        }

        // Setelah session siap (atau timeout), jalankan update
        await autoUpdateHeader();
        await autoUpdateSidebar();
    }

    // Auto-run
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAuthGuard); // <-- PASTIKAN initAuthGuard
    } else {
        initAuthGuard(); // <-- PASTIKAN initAuthGuard
    }

    console.log("[AUTH-GUARD] Loaded (FIXED)");

})(window);
    