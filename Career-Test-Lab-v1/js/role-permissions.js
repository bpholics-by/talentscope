/* ==========================================================
   TALENTSCOPE — ROLE PERMISSIONS (PHASE 3 - CANONICAL)
   ==========================================================
   
   Single source of truth untuk role & permission.
   
   Prinsip:
   - Role canonical: system_admin, administrator, client_admin,
     client_user, asesor, peserta
   - Baca role dari TS_SESSION (bukan localStorage/sessionStorage)
   - View-only: client_user, asesor
   - Full-access: system_admin, administrator, client_admin
   - Peserta: hanya akses assessment miliknya sendiri
   
   Cara pakai:
   - Sync:  RolePermissions.isViewOnly()
   - Async: await RolePermissions.getRoleAsync()
   - Block: RolePermissions.blockIfViewOnly("hapus peserta")
========================================================== */

(function (global) {
    "use strict";

    // ==========================================================
    // LOAD GOOGLE FONT (Inter)
    // ==========================================================
    (function loadGoogleFont() {
        try {
            if (document.getElementById("ts-google-font")) return;

            var preconnect1 = document.createElement("link");
            preconnect1.rel = "preconnect";
            preconnect1.href = "https://fonts.googleapis.com";
            document.head.appendChild(preconnect1);

            var preconnect2 = document.createElement("link");
            preconnect2.rel = "preconnect";
            preconnect2.href = "https://fonts.gstatic.com";
            preconnect2.crossOrigin = "anonymous";
            document.head.appendChild(preconnect2);

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
    // CANONICAL ROLES
    // ==========================================================
       var ROLES = {
        SYSTEM_ADMIN: "system_admin",
        ADMINISTRATOR: "administrator",
        CLIENT_ADMIN: "client_admin",
        CLIENT_USER: "client_user",
        ASESOR: "asesor",
        PESERTA: "peserta"
    };

    // ==========================================================
    // ROLE LABELS — display name untuk UI
    // Canonical role (value) → Human-readable label
    // ==========================================================
    var ROLE_LABELS = {
        "system_admin":  "System Administrator",
        "administrator": "Administrator",
        "client_admin":  "Client",
        "client_user":   "Client User",
        "asesor":        "Asesor",
        "peserta":       "Peserta"
    };

    function getRoleLabel(role) {
        var key = String(role || "").toLowerCase().trim().replace(/\s+/g, "_");
        // Normalize dulu (handle "system_administrator" → "system_admin")
        var normalized = normalizeRole(key);
        return ROLE_LABELS[normalized] || ROLE_LABELS[key] || role || "-";
    }

    // View-only roles (tidak boleh create/edit/delete)
    var VIEW_ONLY_ROLES = [
        ROLES.CLIENT_USER,
        ROLES.ASESOR
    ];

    // Full-access roles (bisa CRUD)
    var FULL_ACCESS_ROLES = [
        ROLES.SYSTEM_ADMIN,
        ROLES.ADMINISTRATOR,
        ROLES.CLIENT_ADMIN
    ];

    // ==========================================================
    // NORMALIZE ROLE
    // ==========================================================
    function normalizeRole(rawRole) {
        var role = String(rawRole || "").toLowerCase().trim().replace(/\s+/g, "_");

        if (role === "system_administrator" || role === "system_admin" || role === "sysadmin") {
            return ROLES.SYSTEM_ADMIN;
        }
        if (role === "administrator" || role === "admin") {
            return ROLES.ADMINISTRATOR;
        }
        if (role === "client_administrator" || role === "client_admin" || role === "clientadmin") {
            return ROLES.CLIENT_ADMIN;
        }
        if (role === "client_user" || role === "clientuser" || role === "client") {
            return ROLES.CLIENT_USER;
        }
        if (role === "asesor" || role === "assessor") {
            return ROLES.ASESOR;
        }
        if (role === "peserta" || role === "participant") {
            return ROLES.PESERTA;
        }

        return role;
    }

    // ==========================================================
    // GET ROLE (SYNC — dari HTML data-ts-role)
    // ==========================================================
    // Untuk kasus yang butuh cepat, sync, dan role sudah di-set
    // di HTML oleh TS_SESSION atau auth-guard.
    function getRole() {
        var htmlRole = document.documentElement.getAttribute("data-ts-role");
        if (htmlRole) {
            return normalizeRole(htmlRole);
        }
        return "";
    }

    // ==========================================================
    // GET ROLE ASYNC (paling reliable — dari TS_SESSION)
    // ==========================================================
    async function getRoleAsync() {
        // PRIORITAS 1: TS_SESSION
        if (global.TS_SESSION) {
            try {
                var role = await global.TS_SESSION.getRole();
                if (role) return normalizeRole(role);
            } catch (e) {
                console.warn("[ROLE-PERM] TS_SESSION.getRole error:", e);
            }
        }

        // PRIORITAS 2: HTML data-ts-role
        var htmlRole = document.documentElement.getAttribute("data-ts-role");
        if (htmlRole) {
            return normalizeRole(htmlRole);
        }

        // PRIORITAS 3: Supabase Auth langsung (fallback)
        try {
            var sb = global.supabaseClient;
            if (sb && sb.auth) {
                var { data: { session } } = await sb.auth.getSession();
                if (session && session.user && session.user.user_metadata) {
                    return normalizeRole(session.user.user_metadata.role || "");
                }
            }
        } catch (e) {
            console.warn("[ROLE-PERM] Supabase Auth fallback error:", e);
        }

        return "";
    }

    // ==========================================================
    // GET USER (ASYNC — dari TS_SESSION)
    // ==========================================================
    async function getUser() {
        if (global.TS_SESSION) {
            try {
                return await global.TS_SESSION.getUser();
            } catch (e) {
                console.warn("[ROLE-PERM] TS_SESSION.getUser error:", e);
            }
        }
        return null;
    }

    // ==========================================================
    // IS VIEW ONLY (SYNC)
    // ==========================================================
    function isViewOnlyRole() {
        var role = getRole();
        if (!role) return false;
        return VIEW_ONLY_ROLES.indexOf(role) !== -1;
    }

    // ==========================================================
    // IS FULL ACCESS (SYNC)
    // ==========================================================
    function isFullAccessRole() {
        var role = getRole();
        if (!role) return false;
        return FULL_ACCESS_ROLES.indexOf(role) !== -1;
    }

    // ==========================================================
    // BLOCK IF VIEW ONLY (SYNC)
    // ==========================================================
    function blockIfViewOnly(actionLabel) {
        if (!isViewOnlyRole()) return false;

        alert(
            "Anda tidak memiliki akses untuk " +
            (actionLabel || "melakukan aksi ini") +
            ".\n\nRole Anda hanya memiliki akses lihat & export data."
        );

        return true;
    }

    // ==========================================================
    // BLOCK IF VIEW ONLY (ASYNC — lebih reliable)
    // ==========================================================
    async function blockIfViewOnlyAsync(actionLabel) {
        var role = await getRoleAsync();
        var isVO = VIEW_ONLY_ROLES.indexOf(role) !== -1;

        if (!isVO) return false;

        alert(
            "Anda tidak memiliki akses untuk " +
            (actionLabel || "melakukan aksi ini") +
            ".\n\nRole Anda hanya memiliki akses lihat & export data."
        );

        return true;
    }

    // ==========================================================
    // ANTI-FLASH — Set data-ts-role + inject CSS SEGERA
    // ==========================================================
    (function initAntiFlash() {
        try {
            var sb = global.supabaseClient;
            if (!sb || !sb.supabaseUrl) return;

            var projectRef = sb.supabaseUrl.split('//')[1].split('.')[0];
            var storageKey = 'sb-' + projectRef + '-auth-token';
            var sessionRaw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
            if (!sessionRaw) return;

            var parsed = JSON.parse(sessionRaw);
            var meta = (parsed && parsed.user && parsed.user.user_metadata) || {};
            var role = normalizeRole(meta.role || "");

            document.documentElement.setAttribute("data-ts-role", role);
            console.log("[ROLE-PERM] Anti-flash role set:", role);

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

                'html[data-ts-role="client_user"] button[data-action="create-project"],',
                'html[data-ts-role="asesor"] button[data-action="create-project"]',

                '{ display: none !important; visibility: hidden !important; }'
            ].join("");

            document.head.appendChild(style);
            console.log("[ROLE-PERM] Anti-flash CSS injected");
        } catch (e) {
            console.warn("[ROLE-PERM] Anti-flash error:", e);
        }
    })();

    // ==========================================================
    // AUTO UPDATE HEADER — dari TS_SESSION
    // ==========================================================
    async function autoUpdateHeader() {
        try {
            var user = await getUser();
            if (!user) return;

                        var meta = user.user_metadata || {};
            var name = meta.name || meta.username || (user.email || "").split("@")[0];
            var role = meta.role || "User";
            var roleLabel = getRoleLabel(role);

            var nameEl = document.querySelector(".header-user-name");
            var roleEl = document.querySelector(".header-user-role");

            if (nameEl) nameEl.textContent = name;
            if (roleEl) roleEl.textContent = roleLabel;

            console.log("[ROLE-PERM] Header updated:", { name: name, role: role, roleLabel: roleLabel });
        } catch (e) {
            console.warn("[ROLE-PERM] Header update error:", e);
        }
    }

    // ==========================================================
    // AUTO UPDATE SIDEBAR — filter menu by role
    // ==========================================================
    async function autoUpdateSidebar() {
        try {
            var role = await getRoleAsync();
            if (!role) {
                console.warn("[ROLE-PERM] Role kosong, skip sidebar filter");
                return;
            }

            document.documentElement.setAttribute("data-ts-role", role);

            var hideList = [];
            if (role === ROLES.SYSTEM_ADMIN) {
                hideList = [];
            } else if (role === ROLES.ADMINISTRATOR) {
                hideList = ["Settings"];
            } else if (role === ROLES.CLIENT_ADMIN) {
                hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
            } else if (role === ROLES.CLIENT_USER || role === ROLES.ASESOR) {
                hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
            } else if (role === ROLES.PESERTA) {
                hideList = [
                    "Assessment Catalog", "Assessment Project", "Assessment Detail",
                    "Participants", "Project Access", "Test Builder", "Test Bank", "Settings"
                ];
            } else {
                hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
            }

            console.log("[ROLE-PERM] Sidebar filter:", { role: role, hideList: hideList });

            if (hideList.length > 0) {
                var sidebarLinks = document.querySelectorAll(
                    ".sidebar .menu a, .sidebar .menu li, .sidebar a, .sidebar li"
                );
                sidebarLinks.forEach(function (link) {
                    var linkText = (link.textContent || "").trim();
                    hideList.forEach(function (menuName) {
                        if (linkText.includes(menuName)) {
                            var target = (link.tagName === "A" && link.parentElement && link.parentElement.tagName === "LI")
                                ? link.parentElement
                                : link;
                            target.style.setProperty("display", "none", "important");
                        }
                    });
                });
            }

            // Hide tombol "Create Project" untuk client user / asesor
            if (role === ROLES.CLIENT_USER || role === ROLES.ASESOR) {
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

    // ==========================================================
    // ENFORCE READ-ONLY — block create/edit/delete buttons
    // ==========================================================
    function enforceReadOnly() {
        var role = getRole();
        if (VIEW_ONLY_ROLES.indexOf(role) === -1) return;

        var HIDE_KEYWORDS = [
            "edit", "ubah", "update",
            "remove", "delete", "hapus",
            "add participant", "tambah peserta", "add project",
            "create", "buat project", "insert",
            "import", "impor", "upload",
            "send invitation", "kirim undangan", "invite", "undang",
            "generate", "password", "credential", "kredensial",
            "save", "simpan",
            "cancel project", "cancel", "batal", "hapus project",
            "selesai atur", "atur urutan", "reorder", "drag",
            "reminder", "notify", "send reminder"
        ];

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

            if (className.indexOf("tab") !== -1) return false;
            if (!text && !title && !ariaLabel) return false;
            if (text === "view" || text === "lihat") return false;

            for (var a = 0; a < ALLOW_KEYWORDS.length; a++) {
                if (text === ALLOW_KEYWORDS[a]) return false;
            }

            for (var h = 0; h < HIDE_KEYWORDS.length; h++) {
                if (combined.indexOf(HIDE_KEYWORDS[h]) !== -1) return true;
            }

            return false;
        }

        function applyHide() {
            var hidden = 0;
            document.querySelectorAll("button, a.btn, .btn, .btn-primary").forEach(function (btn) {
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

        applyHide();

        // MutationObserver — re-apply setiap DOM berubah
        if (window.MutationObserver) {
            if (window.__tsReadOnlyObserver) {
                window.__tsReadOnlyObserver.disconnect();
            }
            window.__tsReadOnlyObserver = new MutationObserver(function (mutations) {
                var hasAddedNodes = false;
                mutations.forEach(function (m) {
                    if (m.addedNodes && m.addedNodes.length > 0) {
                        hasAddedNodes = true;
                    }
                });
                if (hasAddedNodes) applyHide();
            });

            window.__tsReadOnlyObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        // Intercept klik (backup)
        document.addEventListener("click", function (e) {
            var button = e.target.closest("button, a.btn, [role='button'], .btn");
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

        console.log("[ROLE-PERM] ✅ Read-only enforcement active");
    }

    // ==========================================================
    // MUTATION OBSERVER — re-hide menu setiap DOM berubah
    // ==========================================================
    function watchSidebarChanges() {
        var role = getRole();
        if (!role) return;

        var hideList = [];
        if (role === ROLES.SYSTEM_ADMIN) {
            hideList = [];
        } else if (role === ROLES.ADMINISTRATOR) {
            hideList = ["Settings"];
        } else if (role === ROLES.CLIENT_ADMIN) {
            hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
        } else if (role === ROLES.CLIENT_USER || role === ROLES.ASESOR) {
            hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
        } else if (role === ROLES.PESERTA) {
            hideList = [
                "Assessment Catalog", "Assessment Project", "Assessment Detail",
                "Participants", "Project Access", "Test Builder", "Test Bank", "Settings"
            ];
        }

        if (hideList.length === 0) return;

        function applyHide() {
            var links = document.querySelectorAll(".sidebar a, .sidebar li, nav a, .menu-item");
            links.forEach(function (link) {
                var text = (link.textContent || "").trim();
                hideList.forEach(function (menuName) {
                    if (text.includes(menuName)) {
                        var target = (link.tagName === "A" && link.parentElement && link.parentElement.tagName === "LI")
                            ? link.parentElement
                            : link;
                        target.style.setProperty("display", "none", "important");
                    }
                });
            });
        }

        applyHide();

        if (window.__tsRoleMutationObserver) {
            window.__tsRoleMutationObserver.disconnect();
        }

        window.__tsRoleMutationObserver = new MutationObserver(function (mutations) {
            var shouldReapply = false;
            mutations.forEach(function (m) {
                if (m.addedNodes && m.addedNodes.length > 0) {
                    for (var i = 0; i < m.addedNodes.length; i++) {
                        var node = m.addedNodes[i];
                        if (node.nodeType === 1) {
                            if (node.classList && (
                                node.classList.contains("sidebar") ||
                                node.classList.contains("menu") ||
                                node.classList.contains("menu-item") ||
                                (node.querySelector && node.querySelector(".sidebar a, .menu a"))
                            )) {
                                shouldReapply = true;
                                break;
                            }
                            if (node.closest && node.closest(".sidebar, nav")) {
                                shouldReapply = true;
                                break;
                            }
                        }
                    }
                }
            });
            if (shouldReapply) applyHide();
        });

        window.__tsRoleMutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log("[ROLE-PERM] MutationObserver active");
    }

    // ==========================================================
    // FORCE SHOW "Assessment Detail" untuk client_user/asesor
    // ==========================================================
    (function forceShowAssessmentDetail() {
        function showAssessmentDetail() {
            var role = getRole();
            if (role !== ROLES.CLIENT_USER && role !== ROLES.ASESOR) return;

            document.querySelectorAll(".sidebar a, .sidebar li, .menu-item").forEach(function (el) {
                var text = (el.textContent || "").trim();
                if (text === "Assessment Detail") {
                    el.style.removeProperty("display");
                    if (el.parentElement) {
                        el.parentElement.style.removeProperty("display");
                    }
                }
            });
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function () {
                setTimeout(showAssessmentDetail, 2500);
                setTimeout(showAssessmentDetail, 3500);
                setTimeout(showAssessmentDetail, 5000);
            });
        } else {
            setTimeout(showAssessmentDetail, 2500);
            setTimeout(showAssessmentDetail, 3500);
            setTimeout(showAssessmentDetail, 5000);
        }
    })();

    // ==========================================================
    // INIT
    // ==========================================================
    async function initRolePermissions() {
        await autoUpdateHeader();
        await autoUpdateSidebar();

        // Enforce read-only + watch sidebar setelah role siap
        setTimeout(enforceReadOnly, 500);
        setTimeout(watchSidebarChanges, 1200);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            setTimeout(initRolePermissions, 300);
        });
    } else {
        setTimeout(initRolePermissions, 300);
    }

    // ==========================================================
    // EXPORT
    // ==========================================================
    global.RolePermissions = {
        // Roles
        ROLES: ROLES,
        VIEW_ONLY_ROLES: VIEW_ONLY_ROLES,
        FULL_ACCESS_ROLES: FULL_ACCESS_ROLES,

        // Role getter
        normalizeRole: normalizeRole,
        getRole: getRole,
        getRoleAsync: getRoleAsync,
        getUser: getUser,

        // Role check
        isViewOnly: isViewOnlyRole,
        isFullAccess: isFullAccessRole,

        // Block action
        blockIfViewOnly: blockIfViewOnly,
        blockIfViewOnlyAsync: blockIfViewOnlyAsync,

        // UI helpers
        autoUpdateHeader: autoUpdateHeader,
              autoUpdateHeader: autoUpdateHeader,
      getRoleLabel: getRoleLabel,
      ROLE_LABELS: ROLE_LABELS,
        autoUpdateSidebar: autoUpdateSidebar,
        enforceReadOnly: enforceReadOnly,
        watchSidebarChanges: watchSidebarChanges
    };

    console.log("[ROLE-PERM] ✅ RolePermissions loaded (Phase 3 - canonical)");

})(window);