/* ==========================================================
   TalentScope - Role Permissions (shared)

   Role "Client User" dan "Asesor"/"Assessor" bersifat
   VIEW-ONLY: boleh melihat & export data, TAPI TIDAK BOLEH
   create/edit/delete/remove. Tombol aksi TETAP TAMPIL
   (tidak disembunyikan) — begitu diklik, munculkan pop up
   "tidak memiliki akses" dan batalkan aksinya.

   "Client Administrator" TIDAK dibatasi (nama role-nya
   mengisyaratkan akses kelola penuh untuk lingkup
   perusahaannya) — hanya "Client User" polos dan
   "Asesor"/"Assessor" yang view-only.

   CARA PAKAI, taruh di awal setiap fungsi create/edit/delete:

       function hapusPeserta(id) {
           if (RolePermissions.blockIfViewOnly("menghapus data peserta")) {
               return;
           }
           ...
       }

   Atau langsung di listener tombol:

       btnHapus.addEventListener("click", function () {
           if (RolePermissions.blockIfViewOnly("menghapus data peserta")) {
               return;
           }
           ...
       });
========================================================== */

(function (global) {
    "use strict";

    // ==========================================================
// LOAD GOOGLE FONT (Inter) — preconnect + link
// ==========================================================
(function loadGoogleFont() {
    try {
        if (document.getElementById("ts-google-font")) return;

        // Preconnect (paralel)
        var preconnect1 = document.createElement("link");
        preconnect1.rel = "preconnect";
        preconnect1.href = "https://fonts.googleapis.com";
        document.head.appendChild(preconnect1);

        var preconnect2 = document.createElement("link");
        preconnect2.rel = "preconnect";
        preconnect2.href = "https://fonts.gstatic.com";
        preconnect2.crossOrigin = "anonymous";
        document.head.appendChild(preconnect2);

        // Font stylesheet
        var fontLink = document.createElement("link");
        fontLink.id = "ts-google-font";
        fontLink.rel = "stylesheet";
        fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
        document.head.appendChild(fontLink);

        console.log("[ROLE-PERM] Google Font (Inter) loaded");
    } catch (e) {
        console.warn("[ROLE-PERM] Font load error:", e);
    }
})();
    // ==========================================================
    // ANTI-FLASH — Set data-ts-role + inject CSS SEGERA
    // Jalan SEBELUM IIFE utama, sebelum DOM render sidebar
    // ==========================================================
    (function initAntiFlash() {
        try {
            var sb = window.supabaseClient;
            if (!sb || !sb.supabaseUrl) return;
            var projectRef = sb.supabaseUrl.split('//')[1].split('.')[0];
            var storageKey = 'sb-' + projectRef + '-auth-token';
            var sessionRaw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
            if (!sessionRaw) return;
            var parsed = JSON.parse(sessionRaw);
            var meta = (parsed && parsed.user && parsed.user.user_metadata) || {};
            var rawRole = String(meta.role || "").toLowerCase().trim();
            var role = rawRole.replace(/\s+/g, "_");
            if (role === "system_administrator" || role === "system_admin") role = "system_admin";
            else if (role === "client_administrator" || role === "client_admin" || role === "clientadmin") role = "clientadmin";
            else if (role === "client_user" || role === "clientuser") role = "clientuser";
            else if (role === "asesor" || role === "assessor") role = "asesor";
            else if (role === "peserta" || role === "participant") role = "peserta";

            // Set data-ts-role di <html> SEGERA
            document.documentElement.setAttribute("data-ts-role", role);
            console.log("[ROLE-PERM] Anti-flash role set:", role);

            // Inject CSS anti-flash (hanya sekali)
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
                'html[data-ts-role="asesor"] button[data-action="create-project"]',
                '{ display: none !important; visibility: hidden !important; }'
            ].join("");
            document.head.appendChild(style);
            console.log("[ROLE-PERM] Anti-flash CSS injected");
        } catch (e) {
            console.warn("[ROLE-PERM] Anti-flash error:", e);
        }
    })();

    function normalize(value) {

        return String(value === undefined || value === null ? "" : value)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    }

    /*
       Sumber session yang benar: sessionStorage["ts_admin_session"]
       (ditulis login.html untuk akun admin/Client/Asesor).
    */
    function getSession() {

        try {

            return (
                JSON.parse(
                    sessionStorage.getItem("ts_admin_session")
                ) ||
                JSON.parse(
                    localStorage.getItem("talentscope_current_user")
                ) ||
                {}
            );

        } catch (error) {

            return {};

        }

    }

    function getRole() {

        var session = getSession();

        return normalize(
            session.role ||
            session.userRole ||
            session.roleName ||
            ""
        );

    }

    /*
       VIEW-ONLY: "Client User" (bukan Administrator) dan
       "Asesor"/"Assessor". "Client Administrator" TIDAK
       termasuk (tetap full akses).
    */
    function isViewOnlyRole() {

        var role = getRole();

        if (!role) {
            return false;
        }

        if (role.includes("administrator")) {
            return false;
        }

        return (
            role.includes("asesor") ||
            role.includes("assessor") ||
            role.includes("client")
        );

    }

    /*
       Panggil di awal handler create/edit/delete/remove.
       Return true kalau aksi HARUS dibatalkan (role view-only) —
       sekalian menampilkan pop up. Return false kalau boleh lanjut.
    */
    function blockIfViewOnly(actionLabel) {

        if (!isViewOnlyRole()) {
            return false;
        }

        alert(
            "Anda tidak memiliki akses untuk " +
            (actionLabel || "melakukan aksi ini") +
            ".\n\nRole Anda hanya memiliki akses lihat & export data."
        );

        return true;

    }

    global.RolePermissions = {

        getSession: getSession,

        getRole: getRole,

        isViewOnly: isViewOnlyRole,

        blockIfViewOnly: blockIfViewOnly

    };
// ============================================
// AUTO UPDATE HEADER dari Supabase Auth
// ============================================
async function autoUpdateHeaderFromSupabase() {
    try {
        var sb = window.supabaseClient;
        if (!sb || !sb.auth) return;
        var { data: { session } } = await sb.auth.getSession();
        if (!session || !session.user) return;
        
        var meta = session.user.user_metadata || {};
        var name = meta.name || meta.username || (session.user.email || "").split("@")[0];
        var role = meta.role || "User";
        
        var nameEl = document.querySelector(".header-user-name");
        var roleEl = document.querySelector(".header-user-role");
        if (nameEl) nameEl.textContent = name;
        if (roleEl) roleEl.textContent = role;
        console.log("[ROLE-PERM] Header updated:", { name, role });
    } catch (e) {
        console.warn("[ROLE-PERM] Header update error:", e);
    }
}

// Auto-run
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
        setTimeout(autoUpdateHeaderFromSupabase, 100);
        setTimeout(autoUpdateHeaderFromSupabase, 500);
        setTimeout(autoUpdateHeaderFromSupabase, 1500);
    });
} else {
    setTimeout(autoUpdateHeaderFromSupabase, 100);
    setTimeout(autoUpdateHeaderFromSupabase, 500);
    setTimeout(autoUpdateHeaderFromSupabase, 1500);
}

// Expose
global.RolePermissions = global.RolePermissions || {};
global.RolePermissions.autoUpdateHeader = autoUpdateHeaderFromSupabase;

    // ==========================================================
// READ-ONLY ENFORCEMENT — Blokir aksi edit/remove untuk client user
// ==========================================================
    function enforceReadOnly() {
        var role = document.documentElement.getAttribute("data-ts-role");
        if (role !== "clientuser" && role !== "asesor") return;

        // Tombol yang HARUS HIDE untuk read-only role
        var HIDE_KEYWORDS = [
            // Edit
            "edit", "ubah", "update",
            // Delete
            "remove", "delete", "hapus",
            // Create/Add
            "add participant", "tambah peserta", "add project",
            "create", "buat project", "insert",
            // Import/Upload
            "import", "impor", "upload",
            // Send/Invite
            "send invitation", "kirim undangan", "invite", "undang",
            // Generate
            "generate", "password", "credential", "kredensial",
            // Save
            "save", "simpan",
            // Cancel/Batal
            "cancel project", "cancel", "batal", "hapus project",
            // Reorder mode
            "selesai atur", "atur urutan", "reorder", "drag",
            // Reminder/Notify
            "reminder", "notify", "send reminder"
        ];

        // Kata kunci yang DIIZINKAN (view/export/navigation)
        var ALLOW_KEYWORDS = [
            "view", "lihat", "detail", "export", "ekspor",
            "download", "unduh", "print", "cetak", "preview",
            "refresh", "search", "cari", "filter", "back", "kembali",
            "excel template", "template excel",
            "participants", "assessment", "schedule", "activity",
            "dashboard", "project", "access", "catalog"
        ];

        function shouldHide(btn) {
            var text = (btn.textContent || "").toLowerCase().trim();
            var title = (btn.getAttribute("title") || "").toLowerCase();
            var ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
            var dataAction = (btn.getAttribute("data-action") || "").toLowerCase();
            var className = (btn.className || "").toLowerCase();
            var combined = [text, title, ariaLabel, dataAction, className].join(" ");

            // Skip tab navigation
            if (className.indexOf("tab") !== -1) return false;

            // Skip kalau tidak ada text
            if (!text && !title && !ariaLabel) return false;

            // Skip tombol "View" dengan icon saja (tanpa text panjang)
            if (text === "view" || text === "lihat") return false;

            // ALLOW — whitelist
            for (var a = 0; a < ALLOW_KEYWORDS.length; a++) {
                if (text === ALLOW_KEYWORDS[a]) return false;  // exact match
            }

            // HIDE — blacklist
            for (var h = 0; h < HIDE_KEYWORDS.length; h++) {
                if (combined.indexOf(HIDE_KEYWORDS[h]) !== -1) return true;
            }

            return false;
        }

        function applyHide() {
            var hidden = 0;
            document.querySelectorAll("button, a.btn, .btn, .btn-primary").forEach(function(btn) {
                if (shouldHide(btn)) {
                    if (btn.style.display !== "none") {
                        btn.style.setProperty("display", "none", "important");
                        hidden++;
                        console.log("[ROLE-PERM] 🚫 Hidden:", (btn.textContent || "").trim().substring(0, 50));
                    }
                }
            });
            return hidden;
        }

        // Apply sekarang
        applyHide();

        // MutationObserver — re-apply setiap DOM berubah
        if (window.MutationObserver) {
            if (window.__tsReadOnlyObserver) {
                window.__tsReadOnlyObserver.disconnect();
            }
            window.__tsReadOnlyObserver = new MutationObserver(function(mutations) {
                var hasAddedNodes = false;
                mutations.forEach(function(m) {
                    if (m.addedNodes && m.addedNodes.length > 0) {
                        hasAddedNodes = true;
                    }
                });
                if (hasAddedNodes) {
                    applyHide();
                }
            });

            window.__tsReadOnlyObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            console.log("[ROLE-PERM] ✅ Read-only MutationObserver active");
        }

        // Intercept klik (backup)
        document.addEventListener("click", function(e) {
            var target = e.target;
            var button = target.closest("button, a.btn, [role='button'], .btn");
            if (!button) return;
            if (shouldHide(button)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.warn("[ROLE-PERM] 🚫 Blocked:", button.textContent.trim());
                alert("Anda tidak memiliki akses untuk aksi ini (read-only).");
                return false;
            }
        }, true);
      // capture phase — intercept sebelum handler lain

    console.log("[ROLE-PERM] ✅ Read-only enforcement active for client user");
}

// Jalankan setelah DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
        setTimeout(enforceReadOnly, 500);
        setTimeout(enforceReadOnly, 1500);
    });
} else {
    setTimeout(enforceReadOnly, 500);
    setTimeout(enforceReadOnly, 1500);
}
// ==========================================================
    // AUTO UPDATE SIDEBAR — Filter menu by role
    // ==========================================================
    async function autoUpdateSidebarByRole() {
        try {
            var sb = window.supabaseClient;
            if (!sb || !sb.auth) return;
            var result = await sb.auth.getSession();
            var session = result && result.data ? result.data.session : null;
            if (!session || !session.user) return;

            var meta = session.user.user_metadata || {};
            var rawRole = String(meta.role || "").toLowerCase().trim();
            var role = rawRole.replace(/\s+/g, "_");
            if (role === "system_administrator" || role === "system_admin") role = "system_admin";
            else if (role === "client_administrator" || role === "client_admin" || role === "clientadmin") role = "clientadmin";
            else if (role === "client_user" || role === "clientuser") role = "clientuser";
            else if (role === "asesor" || role === "assessor") role = "asesor";
            else if (role === "peserta" || role === "participant") role = "peserta";

            // Set data-ts-role untuk CSS anti-flash
            document.documentElement.setAttribute("data-ts-role", role);

            // Mapping role → menu yang disembunyikan
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

            console.log("[ROLE-PERM] Sidebar filter:", { role: role, hideList: hideList });

            if (hideList.length > 0) {
                var sidebarLinks = document.querySelectorAll(".sidebar .menu a, .sidebar .menu li, .sidebar a, .sidebar li");
                sidebarLinks.forEach(function (link) {
                    var linkText = (link.textContent || "").trim();
                    hideList.forEach(function (menuName) {
                        if (linkText.includes(menuName)) {
                            var target = link.tagName === "A" && link.parentElement && link.parentElement.tagName === "LI"
                                ? link.parentElement
                                : link;
                            target.style.setProperty("display", "none", "important");
                        }
                    });
                });
            }

            // Hide tombol "Create Project" untuk client user
            if (role === "clientuser" || role === "asesor") {
                document.querySelectorAll("button").forEach(function (btn) {
                    if ((btn.textContent || "").trim().includes("Create Project")) {
                        btn.style.setProperty("display", "none", "important");
                    }
                });
            }
        } catch (e) {
            console.warn("[ROLE-PERM] Sidebar filter error:", e);
        }
    }

    // Auto-run sidebar filter
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            setTimeout(autoUpdateSidebarByRole, 200);
            setTimeout(autoUpdateSidebarByRole, 700);
            setTimeout(autoUpdateSidebarByRole, 1600);
            setTimeout(autoUpdateSidebarByRole, 2500);
        });
    } else {
        setTimeout(autoUpdateSidebarByRole, 200);
        setTimeout(autoUpdateSidebarByRole, 700);
        setTimeout(autoUpdateSidebarByRole, 1600);
        setTimeout(autoUpdateSidebarByRole, 2500);
    }

    global.RolePermissions = global.RolePermissions || {};
    global.RolePermissions.autoUpdateSidebar = autoUpdateSidebarByRole;

    
    // ==========================================================
    // MUTATION OBSERVER — Re-hide menu setiap DOM berubah
    // Handle sidebar yang di-render dinamis (layout-loader.js)
    // ==========================================================
    function watchSidebarChanges() {
        var role = document.documentElement.getAttribute("data-ts-role");
        if (!role) {
            console.log("[ROLE-PERM] MutationObserver skip — data-ts-role belum di-set");
            return;
        }

        // Hitung hideList (SAMA dengan autoUpdateSidebarByRole)
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
            // Fallback: JANGAN hide apapun
            hideList = [];
        }

        if (hideList.length === 0) {
            console.log("[ROLE-PERM] MutationObserver: role '" + role + "' tidak hide menu");
            return;
        }

        function applyHide() {
            var links = document.querySelectorAll(".sidebar a, .sidebar li, nav a, .menu-item");
            var hiddenCount = 0;
            links.forEach(function (link) {
                var text = (link.textContent || "").trim();
                hideList.forEach(function (menuName) {
                    if (text.includes(menuName)) {
                        var target = (link.tagName === "A" && link.parentElement && link.parentElement.tagName === "LI")
                            ? link.parentElement
                            : link;
                        target.style.setProperty("display", "none", "important");
                        hiddenCount++;
                    }
                });
            });
            return hiddenCount;
        }

        // Apply sekarang
        var count = applyHide();
        console.log("[ROLE-PERM] MutationObserver applied, hidden:", count);

        // Watch DOM changes (untuk sidebar yang di-render dinamis)
        if (window.__tsRoleMutationObserver) {
            window.__tsRoleMutationObserver.disconnect();
        }

        window.__tsRoleMutationObserver = new MutationObserver(function (mutations) {
            var shouldReapply = false;
            mutations.forEach(function (m) {
                if (m.addedNodes && m.addedNodes.length > 0) {
                    // Cek apakah ada sidebar-related element yang di-add
                    for (var i = 0; i < m.addedNodes.length; i++) {
                        var node = m.addedNodes[i];
                        if (node.nodeType === 1) {  // Element node
                            if (node.classList && (
                                node.classList.contains("sidebar") ||
                                node.classList.contains("menu") ||
                                node.classList.contains("menu-item") ||
                                node.querySelector && node.querySelector(".sidebar a, .menu a")
                            )) {
                                shouldReapply = true;
                                break;
                            }
                            // Cek juga kalau node di dalam sidebar
                            if (node.closest && node.closest(".sidebar, nav")) {
                                shouldReapply = true;
                                break;
                            }
                        }
                    }
                }
            });

            if (shouldReapply) {
                console.log("[ROLE-PERM] MutationObserver: sidebar changed, re-applying hide");
                applyHide();
            }
        });

        window.__tsRoleMutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log("[ROLE-PERM] MutationObserver active");
    }

    // Panggil watchSidebarChanges setelah autoUpdateSidebarByRole
    setTimeout(watchSidebarChanges, 1200);

    // Expose untuk manual trigger
    global.RolePermissions = global.RolePermissions || {};
    global.RolePermissions.watchSidebarChanges = watchSidebarChanges;

        // ==========================================================
    // FORCE SHOW — "Assessment Detail" untuk Client User
    // Karena menu ini HARUS terlihat untuk client user/asesor
    // ==========================================================
    (function forceShowAssessmentDetail() {
        function showAssessmentDetail() {
            var role = document.documentElement.getAttribute("data-ts-role");
            if (role !== "clientuser" && role !== "asesor") return;

            document.querySelectorAll(".sidebar a, .sidebar li, .menu-item").forEach(function(el) {
                var text = (el.textContent || "").trim();
                if (text === "Assessment Detail") {
                    el.style.removeProperty("display");
                    if (el.parentElement) {
                        el.parentElement.style.removeProperty("display");
                    }
                }
            });
        }

        // Apply berulang — kalahkan race condition
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function() {
                setTimeout(showAssessmentDetail, 2500);
                setTimeout(showAssessmentDetail, 3500);
                setTimeout(showAssessmentDetail, 5000);
            });
        } else {
            setTimeout(showAssessmentDetail, 2500);
            setTimeout(showAssessmentDetail, 3500);
            setTimeout(showAssessmentDetail, 5000);
        }

        // Monitor DOM — re-show kalau ada yang hide
        if (window.MutationObserver) {
            var observer = new MutationObserver(function(mutations) {
                var needFix = false;
                mutations.forEach(function(m) {
                    if (m.type === "attributes" && m.attributeName === "style") {
                        var el = m.target;
                        var text = (el.textContent || "").trim();
                        if (text === "Assessment Detail" && el.style.display === "none") {
                            needFix = true;
                        }
                    }
                });
                if (needFix) showAssessmentDetail();
            });

            document.addEventListener("DOMContentLoaded", function() {
                setTimeout(function() {
                    document.querySelectorAll(".sidebar a, .sidebar li").forEach(function(el) {
                        var text = (el.textContent || "").trim();
                        if (text === "Assessment Detail") {
                            observer.observe(el, { attributes: true, attributeFilter: ["style"] });
                            if (el.parentElement) {
                                observer.observe(el.parentElement, { attributes: true, attributeFilter: ["style"] });
                            }
                        }
                    });
                    console.log("[ROLE-PERM] 👁️ Assessment Detail observer active");
                }, 3000);
            });
        }

        console.log("[ROLE-PERM] ✅ Force show Assessment Detail registered");
    })();
})(window);
