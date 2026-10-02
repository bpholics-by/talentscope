/* ==========================================================
   TALENTSCOPE — SESSION HELPER (SINGLE SOURCE OF TRUTH)
   ----------------------------------------------------------
   Satu-satunya helper untuk baca session Supabase Auth.
   Semua file lain WAJIB pakai helper ini, bukan langsung
   akses supabase.auth.getSession() atau localStorage.
   
   Prinsip:
   - Supabase Auth adalah authentication authority
   - Session di-cache di memory (bukan localStorage)
   - Auto-refresh token sebelum expired
   - onAuthStateChange untuk reactive updates
========================================================== */

;(function(global) {
    "use strict";
    
    // ==========================================================
    // CACHE (in-memory, bukan localStorage)
    // ==========================================================
    var _sessionCache = null;
    var _userCache = null;
    var _lastFetch = 0;
    var CACHE_TTL_MS = 5000; // 5 detik cache
    
    // ==========================================================
    // HELPER: Get Supabase client
    // ==========================================================
    function getSupabase() {
        return global.supabaseClient || global.supabase || null;
    }
    
    // ==========================================================
    // GET SESSION (cached)
    // ==========================================================
    async function getSession(forceRefresh) {
        var sb = getSupabase();
        if (!sb || !sb.auth) {
            console.warn("[SESSION] Supabase client tidak tersedia");
            return null;
        }
        
        // Return cache kalau masih fresh
        var now = Date.now();
        if (!forceRefresh && _sessionCache && (now - _lastFetch) < CACHE_TTL_MS) {
            return _sessionCache;
        }
        
        try {
            var { data: { session }, error } = await sb.auth.getSession();
            
            if (error) {
                console.warn("[SESSION] getSession error:", error.message);
                _sessionCache = null;
                _userCache = null;
                return null;
            }
            
            _sessionCache = session;
            _userCache = session ? session.user : null;
            _lastFetch = now;
            
            return session;
        } catch (e) {
            console.error("[SESSION] getSession exception:", e);
            return null;
        }
    }
    
    // ==========================================================
    // GET USER (cached)
    // ==========================================================
    async function getUser(forceRefresh) {
        var session = await getSession(forceRefresh);
        return session ? session.user : null;
    }
    
    // ==========================================================
    // GET USER METADATA
    // ==========================================================
    async function getUserMetadata() {
        var user = await getUser();
        return user ? (user.user_metadata || {}) : {};
    }
    
    // ==========================================================
    // GET ROLE (canonical)
    // ==========================================================
    async function getRole() {
        var meta = await getUserMetadata();
        var role = String(meta.role || "").toLowerCase().trim().replace(/\s+/g, "_");
        
        // Canonical role
        if (role === "system_administrator" || role === "system_admin") return "system_admin";
        if (role === "administrator" || role === "admin") return "administrator";
        if (role === "client_administrator" || role === "client_admin" || role === "clientadmin") return "client_admin";
        if (role === "asesor" || role === "assessor") return "asesor";
        if (role === "peserta" || role === "participant") return "peserta";
        if (role === "client_user" || role === "clientuser") return "client_user";
        
        return role;
    }
    
    // ==========================================================
    // GET PARTICIPANT ID (dari metadata)
    // ==========================================================
    async function getParticipantId() {
        var meta = await getUserMetadata();
        return meta.participant_id || "";
    }
    
    // ==========================================================
    // GET PROJECT ID (dari metadata)
    // ==========================================================
    async function getProjectId() {
        var meta = await getUserMetadata();
        return meta.project_id || "";
    }
    
    // ==========================================================
    // GET PROJECT NAME (dari metadata)
    // ==========================================================
    async function getProjectName() {
        var meta = await getUserMetadata();
        return meta.project_name || "";
    }
    
    // ==========================================================
    // GET ACCESS TOKEN (untuk API calls)
    // ==========================================================
    async function getAccessToken() {
        var session = await getSession();
        return session ? session.access_token : "";
    }
    
    // ==========================================================
    // IS AUTHENTICATED
    // ==========================================================
    async function isAuthenticated() {
        var session = await getSession();
        return !!session && !!session.user;
    }
    
    // ==========================================================
    // REQUIRE AUTHENTICATED (redirect ke login jika tidak)
    // ==========================================================
    async function requireAuth(loginPage) {
        var isAuth = await isAuthenticated();
        if (!isAuth) {
            window.location.replace(loginPage || "login.html");
            return null;
        }
        return await getUser();
    }
    
    // ==========================================================
    // REQUIRE ROLE (redirect jika role tidak sesuai)
    // ==========================================================
    async function requireRole(allowedRoles, redirectTo) {
        var user = await requireAuth();
        if (!user) return null;
        
        var role = await getRole();
        var allowed = (allowedRoles || []).map(function(r) {
            return String(r).toLowerCase();
        });
        
        if (allowed.length > 0 && allowed.indexOf(role) === -1) {
            console.warn("[SESSION] Role not allowed:", role, "Allowed:", allowed);
            window.location.replace(redirectTo || "login.html");
            return null;
        }
        
        return user;
    }
    
    // ==========================================================
    // CLEAR SESSION
    // ==========================================================
    async function clearSession() {
        var sb = getSupabase();
        _sessionCache = null;
        _userCache = null;
        _lastFetch = 0;
        
        if (sb && sb.auth) {
            try {
                await sb.auth.signOut();
            } catch (e) {
                console.warn("[SESSION] SignOut error:", e);
            }
        }
    }
    
    // ==========================================================
    // REFRESH SESSION
    // ==========================================================
    async function refreshSession() {
        var sb = getSupabase();
        if (!sb || !sb.auth) return null;
        
        try {
            var { data, error } = await sb.auth.refreshSession();
            if (error) {
                console.warn("[SESSION] Refresh error:", error.message);
                return null;
            }
            
            _sessionCache = data.session;
            _userCache = data.session ? data.session.user : null;
            _lastFetch = Date.now();
            
            return data.session;
        } catch (e) {
            console.error("[SESSION] Refresh exception:", e);
            return null;
        }
    }
    
    // ==========================================================
    // ON AUTH STATE CHANGE (subscribe)
    // ==========================================================
    function onAuthChange(callback) {
        var sb = getSupabase();
        if (!sb || !sb.auth) {
            console.warn("[SESSION] Supabase tidak tersedia untuk onAuthChange");
            return null;
        }
        
        try {
            var { data: { subscription } } = sb.auth.onAuthStateChange(function(event, session) {
                // Update cache
                _sessionCache = session;
                _userCache = session ? session.user : null;
                _lastFetch = Date.now();
                
                // Callback
                if (typeof callback === "function") {
                    callback(event, session);
                }
            });
            
            return subscription;
        } catch (e) {
            console.error("[SESSION] onAuthStateChange error:", e);
            return null;
        }
    }
    
    // ==========================================================
    // CLEAR CACHE (untuk force refresh)
    // ==========================================================
    function clearCache() {
        _sessionCache = null;
        _userCache = null;
        _lastFetch = 0;
    }
    
    // ==========================================================
    // EXPORT
    // ==========================================================
    global.TS_SESSION = {
        // Core
        getSession: getSession,
        getUser: getUser,
        getUserMetadata: getUserMetadata,
        getAccessToken: getAccessToken,
        isAuthenticated: isAuthenticated,
        
        // Metadata shortcuts
        getRole: getRole,
        getParticipantId: getParticipantId,
        getProjectId: getProjectId,
        getProjectName: getProjectName,
        
        // Auth guard
        requireAuth: requireAuth,
        requireRole: requireRole,
        
        // Actions
        clearSession: clearSession,
        refreshSession: refreshSession,
        clearCache: clearCache,
        
        // Subscribe
        onAuthChange: onAuthChange,
    };
    
    console.log("[SESSION] TS_SESSION helper loaded");
    
})(window);