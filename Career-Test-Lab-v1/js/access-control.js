/* ==========================================================
   TALENTSCOPE — ACCESS CONTROL (Refactor Fase 2)
   ==========================================================
   MERGE dari 5 script yang sebelumnya terpisah-pisah di
   view-monitoring.html & hasil.html:

   1. Role filter (menu sidebar by role)
   2. Project filter (by company / projectId)
   3. User profile display (nama & role di header)
   4. Hide Settings menu (non-system-admin)
   5. Session stabilization

   PERUBAHAN UTAMA:
   - 1 MutationObserver (bukan 4) dengan debounce 500ms
   - 1 script include (bukan 5-6 script inline)
   - Semua filter jalan sekali saat DOM ready, tidak
     trigger berkali-kali
   - Console bersih, tidak ada race condition

   CARA PAKAI:
   <script src="js/access-control.js"></script>
   (dimuat SETELAH DOM ready — taruh di akhir body)
   ========================================================== */

(function () {
    "use strict";

    // ==========================================================
    // SESSION HELPER
    // ==========================================================

    function getSession() {
        try {
            var s = sessionStorage.getItem("ts_admin_session");
            if (s) return JSON.parse(s);
        } catch (e) {}

        try {
            var l = localStorage.getItem("talentscope_current_user");
            if (l) return JSON.parse(l);
        } catch (e) {}

        return null;
    }

    function getRole(session) {
        if (!session) return "";
        return String(
            session.role ||
            session.userRole ||
            session.roleName ||
            ""
        ).trim();
    }

    function isSystemAdmin(session) {
        var role = getRole(session).toLowerCase();
        return role.indexOf("system") !== -1;
    }

    function isAdmin(session) {
        var role = getRole(session).toLowerCase();
        return role.indexOf("admin") !== -1 &&
               role.indexOf("system") === -1;
    }

    function isClient(session) {
        var role = getRole(session).toLowerCase();
        return role.indexOf("client") !== -1;
    }

    function isAsesor(session) {
        var role = getRole(session).toLowerCase();
        return role.indexOf("asesor") !== -1 ||
               role.indexOf("assessor") !== -1;
    }


    // ==========================================================
    // FILTER 1: HIDE MENU BY ROLE
    // ==========================================================

    function applyMenuFilter(session) {
        var hideList = [];

        if (isClient(session)) {
            hideList = [
                "Assessment Catalog",
                "Participants",
                "Test Builder",
                "Test Bank",
                "Settings"
            ];
        } else if (isAsesor(session)) {
            hideList = [
                "Assessment Catalog",
                "Assessment Project",
                "Assessment Detail",
                "Participants",
                "Test Builder",
                "Test Bank",
                "Settings"
            ];
        } else if (isAdmin(session)) {
            hideList = ["Settings"];
        }

        if (hideList.length === 0) return;

        // Cari di sidebar & nav
        var menuItems = document.querySelectorAll(
            ".sidebar a, nav a, .sidebar li, .menu-item, .dropdown-menu a, .dropdown-menu button, .dropdown-item"
        );

        menuItems.forEach(function (item) {
            var text = (item.textContent || "").trim();
            hideList.forEach(function (target) {
                if (text.indexOf(target) !== -1) {
                    item.style.setProperty("display", "none", "important");
                }
            });
        });
    }


    // ==========================================================
    // FILTER 2: HIDE SENSITIVE BUTTONS BY ROLE
    // ==========================================================

    function applyButtonFilter(session) {
        if (!isClient(session) && !isAsesor(session)) return;

        var buttons = document.querySelectorAll("button, .btn, .btn-primary");
        buttons.forEach(function (btn) {
            var t = (btn.textContent || "").toLowerCase();
            if (
                t.indexOf("remove") !== -1 ||
                t.indexOf("delete") !== -1 ||
                t.indexOf("hapus") !== -1 ||
                t.indexOf("create") !== -1 ||
                t.indexOf("add ") !== -1 ||
                t.indexOf("tambah") !== -1
            ) {
                btn.style.setProperty("display", "none", "important");
            }
        });
    }


    // ==========================================================
    // FILTER 3: PROJECT FILTER (by company / projectId)
    // ==========================================================
    //
    // Client/Asesor hanya lihat project milik perusahaan atau
    // projectId mereka. Admin lihat semua.
    // ==========================================================

    function normalizeCompany(v) {
        return String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
    }

    function getSessionCompany(session) {
        if (!session) return "";
        var candidates = [
            session.company,
            session.perusahaan,
            session.companyName,
            session.company_name,
            session.organization,
            session.clientName,
            session.client
        ];
        for (var i = 0; i < candidates.length; i++) {
            var norm = normalizeCompany(candidates[i]);
            if (norm) return norm;
        }
        return "";
    }

    function getSessionProjectId(session) {
        if (!session) return "";
        return String(
            session.projectId ||
            session.project_id ||
            ""
        ).trim();
    }

    function shouldShowProjectRow(row, session) {
    // ==========================================================
    // FIX: Client/Asesor dengan company & projectId kosong
    // ----------------------------------------------------------
    // Sebelumnya: return false → semua row di-hide → tabel kosong
    // Sekarang: kalau TIDAK ADA filter sama sekali, tampilkan semua
    // (karena URL sudah menentukan project via ?id=)
    // ==========================================================

    if (isSystemAdmin(session) || isAdmin(session)) return true;
    if (!isClient(session) && !isAsesor(session)) return true;

    var rowText = (row.textContent || "").toLowerCase();

    // ------------------------------------------------------
    // Cek filter by projectId (URL ?id= atau session)
    // ------------------------------------------------------
    var urlProjectId = "";
    try {
        var urlParams = new URLSearchParams(window.location.search);
        urlProjectId = String(urlParams.get("id") || "").trim().toLowerCase();
    } catch (e) {}

    var sessionProjectId = String(getSessionProjectId(session) || "").trim().toLowerCase();
    var activeProjectId = urlProjectId || sessionProjectId;

    if (activeProjectId && activeProjectId !== "all" && rowText.indexOf(activeProjectId) !== -1) {
        return true;
    }

    // ------------------------------------------------------
    // Cek filter by company
    // ------------------------------------------------------
    var company = getSessionCompany(session);
    if (company && rowText.indexOf(company) !== -1) {
        return true;
    }

    // ------------------------------------------------------
    // FALLBACK: Kalau TIDAK ADA filter aktif, tampilkan
    // (relevan untuk client yang login via URL ?id=projectId)
    // ------------------------------------------------------
    var hasAnyFilter = activeProjectId || company;
    if (!hasAnyFilter) {
        return true;  // ← INI FIX-NYA
    }

    return false;
}
    function applyProjectFilter(session) {
        if (isSystemAdmin(session) || isAdmin(session)) return;
        if (!isClient(session) && !isAsesor(session)) return;

        var rows = document.querySelectorAll(
            "#projectMonitoringTable tr, " +
            "#participantMonitoringTable tr, " +
            "table tbody tr"
        );

        var visibleCount = 0;
        rows.forEach(function (row) {
            if (row.querySelector(".empty-state")) return;
            if (shouldShowProjectRow(row, session)) {
                row.style.display = "";
                visibleCount++;
            } else {
                row.style.setProperty("display", "none", "important");
            }
        });

        // Update count di footer
        var countEl = document.querySelector(
            "#projectCount, #participantCount, [class*='showing']"
        );
        if (countEl && visibleCount >= 0) {
            countEl.textContent = "Showing " + visibleCount + " results";
        }
    }


    // ==========================================================
    // FILTER 4: USER PROFILE DISPLAY
    // ==========================================================

    function applyUserProfile(session) {
        if (!session) return;

        var userName = session.name || session.username || "User";
        var role = getRole(session) || "User";

        // Update elemen yang menampilkan nama
        var nameTargets = document.querySelectorAll(
            "#userRole, .user-name, #currentUsername, [class*='username']"
        );
        nameTargets.forEach(function (el) {
            if (el.children.length === 0) {
                var txt = (el.textContent || "").trim();
                if (txt === "Administrator" || txt === "System Admin" ||
                    txt === "admin" || txt === "-") {
                    el.textContent = userName;
                }
            }
        });

        // Update elemen yang menampilkan role
        var roleTargets = document.querySelectorAll(
            "#userLabel, #currentRoleBadge, .user-role, [class*='role']"
        );
        roleTargets.forEach(function (el) {
            if (el.children.length === 0) {
                var txt = (el.textContent || "").trim();
                if (txt === "Admin" || txt === "System Admin" || txt === "-") {
                    el.textContent = role;
                }
            }
        });
    }


    // ==========================================================
    // FILTER 5: HIDE SETTINGS MENU (Non-System-Admin)
    // ==========================================================

    function applyHideSettings(session) {
        if (isSystemAdmin(session)) return;

        var items = document.querySelectorAll(
            "a[href*='setting'], button[onclick*='setting'], " +
            ".dropdown-menu a, .dropdown-menu button, .dropdown-item"
        );

        items.forEach(function (item) {
            var text = (item.textContent || "").trim().toLowerCase();
            if (text.indexOf("setting") !== -1 ||
                text.indexOf("pengaturan") !== -1) {
                item.style.setProperty("display", "none", "important");
            }
        });
    }


    // ==========================================================
    // APPLY ALL FILTERS
    // ==========================================================

    var __lastApplyTime = 0;

    function applyAllFilters() {
        var now = Date.now();

        // Debounce: minimal 500ms antar apply
        if (now - __lastApplyTime < 500) return;
        __lastApplyTime = now;

        var session = getSession();
        if (!session) return;

        try { applyMenuFilter(session); } catch (e) {
            console.warn("[AccessControl] Menu filter error:", e);
        }
        try { applyButtonFilter(session); } catch (e) {
            console.warn("[AccessControl] Button filter error:", e);
        }
        try { applyProjectFilter(session); } catch (e) {
            console.warn("[AccessControl] Project filter error:", e);
        }
        try { applyUserProfile(session); } catch (e) {
            console.warn("[AccessControl] User profile error:", e);
        }
        try { applyHideSettings(session); } catch (e) {
            console.warn("[AccessControl] Hide settings error:", e);
        }
    }


    // ==========================================================
    // INIT — 1 MUTATIONOBSERVER, DEBOUNCED
    // ==========================================================

    function init() {
        // Apply pertama saat DOM ready
        applyAllFilters();

        // Setup 1 MutationObserver dengan debounce
        var observerTimer = null;
        var observer = new MutationObserver(function () {
            if (observerTimer) return;
            observerTimer = setTimeout(function () {
                observerTimer = null;
                applyAllFilters();
            }, 500);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log("[AccessControl] Initialized (1 observer, debounced 500ms)");
    }

    // Jalankan saat DOM siap
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // Re-apply saat window load (untuk berjaga-jaga)
    window.addEventListener("load", function () {
        __lastApplyTime = 0;  // reset debounce
        applyAllFilters();
    });

    // Expose untuk debug
    window.AccessControl = {
        applyAllFilters: applyAllFilters,
        getSession: getSession,
        getRole: getRole
    };

})();