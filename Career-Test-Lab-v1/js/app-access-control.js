/* =========================================================
   TALENTSCOPE — GLOBAL ACCESS CONTROL & SESSION SYNC
   ---------------------------------------------------------
   - Baca session dari Supabase Auth (via TS_AUTH)
   - Fallback ke session lama (backward compatibility)
   - Sync UI: sembunyikan menu & tombol sesuai role
   ========================================================= */

;(async function () {
    "use strict";

    // ============================================================
    // 1. GET ACTIVE USER (async)
    // ============================================================
       async function getActiveUser() {
        // ==========================================================
        // PRIORITAS 1: Supabase Auth langsung (via window.supabaseClient)
        // Lebih reliable daripada TS_AUTH — karena supabaseClient selalu ada
        // ==========================================================
        try {
            var sb = window.supabaseClient;
            if (sb && sb.auth && sb.supabaseUrl) {
                var result = await sb.auth.getSession();
                var session = result && result.data ? result.data.session : null;
                
                if (session && session.user) {
                    var meta = session.user.user_metadata || {};
                    var userObj = {
                        id: session.user.id,
                        email: session.user.email,
                        username: meta.username || session.user.email,
                        role: meta.role || "Peserta",
                        name: meta.name || session.user.email
                    };
                    console.log("[APP-ACCESS] User from Supabase Auth:", userObj.email, "| Role:", userObj.role);
                    return userObj;
                }
            }
        } catch (e) {
            console.warn("[APP-ACCESS] Supabase Auth check error:", e);
        }

        // ==========================================================
        // PRIORITAS 2: Supabase Auth via TS_AUTH (kalau ada)
        // ==========================================================
        try {
            if (window.TS_AUTH && typeof window.TS_AUTH.isAuthenticated === "function") {
                var isAuth = await window.TS_AUTH.isAuthenticated();
                if (isAuth) {
                    var user = await window.TS_AUTH.getUser();
                    if (user && (user.email || user.id)) {
                        return {
                            id: user.id,
                            email: user.email,
                            username: (user.user_metadata && user.user_metadata.username) || user.email,
                            role: (user.user_metadata && user.user_metadata.role) || "Peserta",
                            name: (user.user_metadata && user.user_metadata.name) || user.email
                        };
                    }
                }
            }
        } catch (e) {
            console.warn("[APP-ACCESS] TS_AUTH check error:", e);
        }

        // ==========================================================
        // PRIORITAS 3: Fallback session lama (backward compatibility)
        // ==========================================================
        var keys = ["ts_admin_session", "talentscope_current_user", "user", "currentUser"];
        for (var i = 0; i < keys.length; i++) {
            var data = sessionStorage.getItem(keys[i]) || localStorage.getItem(keys[i]);
            if (data) {
                try {
                    var parsed = JSON.parse(data);
                    if (parsed) {
                        console.log("[APP-ACCESS] User from legacy storage:", keys[i]);
                        return parsed;
                    }
                } catch (e) {}
            }
        }
        
        console.warn("[APP-ACCESS] No user found in any storage");
        return null;
    }

    // ============================================================
    // 2. CEK USER & ROLE
    // ============================================================
    var currentUser = await getActiveUser();
    var currentPath = window.location.pathname.split("/").pop() || "index.html";

    // Kalau belum login & bukan di login.html, lempar balik ke login
    if (!currentUser && currentPath !== "login.html") {
        console.warn("[APP-ACCESS] No user, redirect to login");
        window.location.replace("login.html");
        return;
    }

    // Kalau tidak ada user (di login page), stop
    if (!currentUser) {
        console.log("[APP-ACCESS] No user on login page");
        return;
    }

    var role = String(currentUser.role || "").trim();
    var roleLower = role.toLowerCase();

    console.log("[APP-ACCESS] User:", currentUser.username, "| Role:", role);

    // ============================================================
    // 3. SYNC UI
    // ============================================================
    function syncUI() {
        // Menu yang TIDAK boleh diakses oleh role tertentu
        var restrictedMenus = [];
        var isAsesor = false;

        // Sesuaikan dengan role
        if (roleLower === "asesor") {
            isAsesor = true;
            restrictedMenus = ["Settings", "Pengaturan", "Participants", "Peserta"];
        } else if (roleLower === "client" || roleLower === "client administrator" || roleLower === "client user") {
            restrictedMenus = ["Settings", "Pengaturan"];
        }

        // Sembunyikan menu restricted
        var menuItems = document.querySelectorAll(".sidebar-menu a, .nav-item, .menu-item");
        menuItems.forEach(function (item) {
            var itemText = item.textContent.trim();
            restrictedMenus.forEach(function (menuName) {
                if (itemText.indexOf(menuName) !== -1) {
                    item.style.setProperty("display", "none", "important");
                }
            });
        });

        // Sembunyikan tombol aksi sensitif untuk Asesor
        if (isAsesor) {
            document.querySelectorAll("button, .btn, .btn-primary").forEach(function (btn) {
                var text = btn.textContent.toLowerCase();
                if (text.includes("add") || text.includes("tambah") ||
                    text.includes("create") || text.includes("delete") ||
                    text.includes("remove") || text.includes("hapus") ||
                    text.includes("edit") || text.includes("ubah") ||
                    text.includes("generate")) {
                    btn.style.setProperty("display", "none", "important");
                }
            });
        }
    }

    // ============================================================
    // 4. EKSEKUSI SAAT DOM SIAP
    // ============================================================
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", syncUI);
    } else {
        syncUI();
    }
    window.addEventListener("load", syncUI);

})();