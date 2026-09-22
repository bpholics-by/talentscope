/* =========================================================
   TALENTSCOPE — AUTH-GUARD.JS
   ---------------------------------------------------------
   Helper JWT session di client.
   - Simpan/ambil/clear JWT + user object di localStorage
   - Cek auth & expiry
   - Require auth / role (auto redirect kalau tidak valid)
   
   Catatan: file ini BERBEDA dari js/access-control-ui.js
   (yang mengatur hide/show menu sidebar).
   ========================================================= */

;(function (global) {
    "use strict";

    var KEY_TOKEN    = "ts_auth_token";
    var KEY_USER     = "ts_auth_user";
    var KEY_EXPIRES  = "ts_auth_expires";
    var KEY_LOGIN_AT = "ts_auth_login_at";

    var LOGIN_PAGE   = "login.html";

    // ============================================================
    // SAVE / READ / CLEAR
    // ============================================================

    function saveSession(token, user, expiresAt) {
        try {
            if (!token || !user) {
                console.error("[AUTH-GUARD] saveSession: token/user kosong");
                return false;
            }
            localStorage.setItem(KEY_TOKEN, token);
            localStorage.setItem(KEY_USER, JSON.stringify(user));
            localStorage.setItem(KEY_EXPIRES, String(expiresAt || ""));
            localStorage.setItem(KEY_LOGIN_AT, new Date().toISOString());
            console.log("[AUTH-GUARD] Session saved:", user.username, "| role:", user.role);
            return true;
        } catch (err) {
            console.error("[AUTH-GUARD] saveSession error:", err);
            return false;
        }
    }

    function getToken() {
        try { return localStorage.getItem(KEY_TOKEN) || ""; }
        catch (err) { return ""; }
    }

    function getUser() {
        try {
            var raw = localStorage.getItem(KEY_USER);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (err) {
            return null;
        }
    }

    function getExpiresAt() {
        try { return localStorage.getItem(KEY_EXPIRES) || ""; }
        catch (err) { return ""; }
    }

    function getLoginAt() {
        try { return localStorage.getItem(KEY_LOGIN_AT) || ""; }
        catch (err) { return ""; }
    }

    function clearSession() {
        try {
            localStorage.removeItem(KEY_TOKEN);
            localStorage.removeItem(KEY_USER);
            localStorage.removeItem(KEY_EXPIRES);
            localStorage.removeItem(KEY_LOGIN_AT);
        } catch (err) {
            console.warn("[AUTH-GUARD] clearSession error:", err);
        }
    }

    // ============================================================
    // VALIDATION
    // ============================================================

    function isExpired() {
        var exp = getExpiresAt();
        if (!exp) return true;
        try {
            var expMs = new Date(exp).getTime();
            if (isNaN(expMs)) return true;
            return Date.now() >= expMs;
        } catch (err) {
            return true;
        }
    }

    function isAuthenticated() {
        return !!getToken() && !!getUser() && !isExpired();
    }

    // ============================================================
    // REDIRECT
    // ============================================================

    function goToLogin(reason) {
        if (reason) console.log("[AUTH-GUARD] Redirect ke login:", reason);
        clearSession();
        var here = window.location.pathname.split("/").pop() || "";
        if (here === LOGIN_PAGE) return;
        window.location.replace(LOGIN_PAGE);
    }

    // ============================================================
    // REQUIRE AUTH / ROLE
    // ============================================================

    function requireAuth() {
        if (!isAuthenticated()) {
            goToLogin("not authenticated");
            return false;
        }
        return true;
    }

    function requireRole(allowedRoles) {
        if (!isAuthenticated()) {
            goToLogin("not authenticated");
            return null;
        }

        var user = getUser();
        if (!user || !user.role) {
            goToLogin("no role in session");
            return null;
        }

        if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
            var userRole = String(user.role).toLowerCase();
            var allowed = allowedRoles.map(function (r) {
                return String(r).toLowerCase();
            });
            if (allowed.indexOf(userRole) === -1) {
                console.warn("[AUTH-GUARD] Role not allowed:", user.role);
                if (userRole === "participant") {
                    window.location.replace("participant-dashboard.html");
                } else {
                    window.location.replace("dashboard.html");
                }
                return null;
            }
        }

        return user;
    }

    async function verifyWithServer() {
        return isAuthenticated();
    }

    function logout() {
        clearSession();
        window.location.replace(LOGIN_PAGE);
    }

    // ============================================================
    // EXPORT
    // ============================================================

    global.TS_AUTH = {
        saveSession: saveSession,
        getToken: getToken,
        getUser: getUser,
        getExpiresAt: getExpiresAt,
        getLoginAt: getLoginAt,
        clearSession: clearSession,

        isAuthenticated: isAuthenticated,
        isExpired: isExpired,

        requireAuth: requireAuth,
        requireRole: requireRole,
        verifyWithServer: verifyWithServer,

        logout: logout,
        goToLogin: goToLogin
    };

    console.log("[AUTH-GUARD] Loaded");

})(window);