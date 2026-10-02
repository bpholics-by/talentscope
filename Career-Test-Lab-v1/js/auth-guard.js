/* =========================================================
   TALENTSCOPE — AUTH-GUARD.JS (PHASE 2 - USE TS_SESSION)
   ---------------------------------------------------------
   Menggunakan TS_SESSION helper untuk session management.
   Tidak lagi langsung akses supabase.auth.getSession().
========================================================= */

;(function(global) {
    "use strict";

    var LOGIN_PAGE = "login.html";
    var DASHBOARD_PAGE = "dashboard.html";
    var PARTICIPANT_PAGE = "participant-dashboard.html";

    // ============================================================
    // HELPER: Dapatkan TS_SESSION
    // ============================================================
    function getSession() {
        if (!global.TS_SESSION) {
            console.warn("[AUTH-GUARD] TS_SESSION belum dimuat!");
            return null;
        }
        return global.TS_SESSION;
    }

    // ============================================================
    // SESSION FUNCTIONS (delegate ke TS_SESSION)
    // ============================================================
    async function getSessionAsync() {
        var ts = getSession();
        return ts ? await ts.getSession() : null;
    }

    async function getUser() {
        var ts = getSession();
        return ts ? await ts.getUser() : null;
    }

    async function isAuthenticated() {
        var ts = getSession();
        return ts ? await ts.isAuthenticated() : false;
    }

    async function getUserRole() {
        var ts = getSession();
        return ts ? await ts.getRole() : "";
    }

    async function getToken() {
        var ts = getSession();
        return ts ? await ts.getAccessToken() : "";
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
    // REQUIRE AUTH / ROLE
    // ============================================================
    async function requireAuth() {
        var authenticated = await isAuthenticated();
        if (!authenticated) {
            goToLogin("not authenticated");
            return null;
        }
        return await getUser();
    }

    async function requireRole(allowedRoles) {
        var user = await requireAuth();
        if (!user) return null;

        var role = await getUserRole();
        if (!role) {
            goToLogin("no role");
            return null;
        }

        if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
            var allowed = allowedRoles.map(function(r) {
                return String(r).toLowerCase();
            });
            if (allowed.indexOf(role) === -1) {
                console.warn("[AUTH-GUARD] Role not allowed:", role);
                redirectByRole(role);
                return null;
            }
        }

        return user;
    }

    // ============================================================
    // AUTO UPDATE HEADER
    // ============================================================
    async function autoUpdateHeader() {
        try {
            var user = await getUser();
            if (!user) return;

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
            // Silent
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
            'html[data-ts-role="client_user"] .sidebar a[href*="assessment-catalog"],',
            'html[data-ts-role="client_user"] .sidebar li:has(a[href*="assessment-catalog"]),',
            'html[data-ts-role="client_user"] .sidebar a[href*="settings"],',
            'html[data-ts-role="client_user"] .sidebar li:has(a[href*="settings"]),',
            'html[data-ts-role="asesor"] .sidebar a[href*="assessment-catalog"],',
            'html[data-ts-role="asesor"] .sidebar li:has(a[href*="assessment-catalog"]),',
            'html[data-ts-role="asesor"] .sidebar a[href*="settings"],',
            'html[data-ts-role="asesor"] .sidebar li:has(a[href*="settings"]),',
            'html[data-ts-role="client_admin"] .sidebar a[href*="settings"],',
            'html[data-ts-role="client_admin"] .sidebar li:has(a[href*="settings"]),',
            '{ display: none !important; visibility: hidden !important; }'
        ].join("");
        document.head.appendChild(style);
    })();

    // ============================================================
    // AUTO UPDATE SIDEBAR
    // ============================================================
    async function autoUpdateSidebar() {
        try {
            var role = await getUserRole();
            if (!role) return;

            document.documentElement.setAttribute("data-ts-role", role);

            var hideList = [];
            if (role === "system_admin") {
                hideList = [];
            } else if (role === "client_admin") {
                hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
            } else if (role === "client_user" || role === "asesor") {
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

            if (role === "client_user" || role === "asesor") {
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
    // INIT
    // ============================================================
    async function initAuthGuard() {
        var ts = getSession();
        if (!ts) {
            console.warn("[AUTH-GUARD] TS_SESSION tidak tersedia. Skip init.");
            return;
        }

        // Tunggu session siap (maks 3 detik)
        var session = await ts.getSession();
        if (!session) {
            await new Promise(function(resolve) {
                var resolved = false;
                var timeout = setTimeout(function() {
                    if (!resolved) { resolved = true; resolve(); }
                }, 3000);

                var sub = ts.onAuthChange(function(event, sess) {
                    if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && !resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        if (sub && sub.unsubscribe) sub.unsubscribe();
                        resolve();
                    }
                });
            });
        }

        await autoUpdateHeader();
        await autoUpdateSidebar();
    }

    // ============================================================
    // EXPORT
    // ============================================================
    global.TS_AUTH = {
        getSession: getSessionAsync,
        getUser: getUser,
        isAuthenticated: isAuthenticated,
        getUserRole: getUserRole,
        getToken: getToken,
        goToLogin: goToLogin,
        redirectByRole: redirectByRole,
        requireAuth: requireAuth,
        requireRole: requireRole,
        autoUpdateHeader: autoUpdateHeader,
        autoUpdateSidebar: autoUpdateSidebar,
        logout: async function() {
            var ts = getSession();
            if (ts) await ts.clearSession();
            window.location.replace(LOGIN_PAGE);
        },
        clearSession: function() {
            var ts = getSession();
            if (ts) ts.clearCache();
        },
        saveSession: function() {
            console.warn("[AUTH-GUARD] saveSession deprecated");
        }
    };

    // Auto-run
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAuthGuard);
    } else {
        initAuthGuard();
    }

    console.log("[AUTH-GUARD] Loaded (Phase 2 - using TS_SESSION)");

})(window);