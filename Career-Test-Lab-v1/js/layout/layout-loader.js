/* =========================================================
   ANTI-FLASH INIT — Set data-ts-role + inject CSS SEGERA
   Jalan SEBELUM DOMContentLoaded untuk hilangkan flash
   ========================================================= */
(function initAntiFlash() {
    try {
        var sb = window.supabaseClient;
        if (!sb || !sb.auth) return;

        var projectRef = (sb.supabaseUrl || '').split('//')[1].split('.')[0];
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
        console.log("[LAYOUT] Anti-flash role set:", role);

        // Inject CSS anti-flash
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

            '{ display: none !important; visibility: hidden !important; }'
        ].join("");
        document.head.appendChild(style);
        console.log("[LAYOUT] Anti-flash CSS injected");
    } catch (e) {
        console.warn("[LAYOUT] Anti-flash init error:", e);
    }
})();

/* =========================================================
   Existing DOMContentLoaded handler
   ========================================================= */
document.addEventListener("DOMContentLoaded", async () => {

    try {
        console.log("[LAYOUT] DOMContentLoaded triggered");
        // =========================================================
        // 1. AMBIL SESSION USER TERLEBIH DAHULU
        // =========================================================
        // =========================================================
// 1. AMBIL SESSION DARI SUPABASE AUTH (baru)
// =========================================================
let activeUser = null;

try {
    const sb = window.supabaseClient;
    if (sb && sb.auth) {
        const projectRef = (sb.supabaseUrl || '').split('//')[1].split('.')[0];
        const storageKey = 'sb-' + projectRef + '-auth-token';
        const sessionRaw = localStorage.getItem(storageKey);

        if (sessionRaw) {
            const parsed = JSON.parse(sessionRaw);
            if (parsed && parsed.user) {
                const meta = parsed.user.user_metadata || {};
                activeUser = {
                    id: parsed.user.id,
                    email: parsed.user.email,
                    role: meta.role || "",
                    name: meta.name || meta.username || parsed.user.email.split("@")[0]
                };
            }
        }
    }
} catch (e) {
    console.warn("[LAYOUT] Gagal baca Supabase session:", e);
}

// Fallback: coba storage lama (backward compat)
// Fallback DISABLED — pakai Supabase Auth saja
// (kalau ada user legacy, migrasi ke Supabase dulu)

// =========================================================
// 2. NORMALISASI ROLE — mapping konsisten
// =========================================================
const rawRole = activeUser ? String(activeUser.role || "").toLowerCase().trim() : "";

// Normalisasi: "System Administrator" → "system_admin", "Client User" → "clientuser", dst.
let role = rawRole.replace(/\s+/g, "_");
if (role === "system_administrator" || role === "system_admin") role = "system_admin";
else if (role === "client_admin" || role === "clientadmin") role = "clientadmin";
else if (role === "client_user" || role === "clientuser") role = "clientuser";
else if (role === "asesor" || role === "assessor") role = "asesor";
else if (role === "peserta" || role === "participant") role = "peserta";

const isSystemAdmin = role === "system_admin";
const isClientAdmin = role === "clientadmin";
const isClientUser  = role === "clientuser" || role === "asesor";
const isPeserta     = role === "peserta";

console.log("[LAYOUT] Role terdeteksi:", role, "| Raw:", rawRole);

        // =========================================================
        // 2. SIDEBAR (FETCH & FILTER MENU INSTAN)
        // =========================================================
        const sidebar = document.querySelector(".sidebar");

        if (sidebar) {
            const res = await fetch("layout/sidebar-admin.html");

            if (!res.ok) {
                throw new Error("Gagal memuat sidebar-admin.html: " + res.status);
            }

            sidebar.innerHTML = await res.text();

            // --- FILTER MENU DARI HYPERLINK / TEKS SEBELUM DITAMPILKAN ---
            // =========================================================
// 3. FILTER MENU PER ROLE (baru — sesuai konsep bisnis)
// =========================================================
let hideList = [];
if (isSystemAdmin) {
    hideList = [];
} else if (isClientAdmin) {
    hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
} else if (isClientUser) {
    hideList = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
} else if (isPeserta) {
    hideList = ["Assessment Catalog", "Assessment Project", "Assessment Detail",
                "Participants", "Project Access", "Test Builder", "Test Bank", "Settings"];
} else {
    // Fallback: role kosong / tidak dikenal → JANGAN hide apapun
    console.warn("[LAYOUT] Role tidak dikenal/kosong:", role, "— skip hide");
    hideList = [];
}
console.log("[LAYOUT] hideList untuk role", role, ":", hideList);

            if (hideList.length > 0) {
                const links = sidebar.querySelectorAll("a, li");
                links.forEach(link => {
                    const linkText = link.textContent.trim();
                    hideList.forEach(menuName => {
                        if (linkText.includes(menuName)) {
                            link.style.setProperty("display", "none", "important");
                        }
                    });
                });
            }

            // --- AUTO ACTIVE SIDEBAR ---
            const currentPage = location.pathname.split("/").pop().toLowerCase() || "dashboard.html";
            const sidebarLinks = sidebar.querySelectorAll(".menu a, a");

            sidebarLinks.forEach(link => {
                link.classList.remove("active");
                const parent = link.closest("li");
                if (parent) parent.classList.remove("active");

                const href = link.getAttribute("href") || "";
                const hrefPage = href.split("/").pop().split("?")[0].split("#")[0].toLowerCase();

                if (hrefPage === currentPage) {
                    link.classList.add("active");
                    if (parent) parent.classList.add("active");
                }
            });
        }
// Hide tombol Create Project untuk client user (read-only)
if (isClientUser) {
    const createBtns = document.querySelectorAll(
        'button[data-action="create-project"], ' +
        '.btn-create-project, ' +
        'button:has(> span:contains("Create Project"))'
    );
    // Fallback: cari tombol dengan teks "Create Project"
    document.querySelectorAll("button").forEach(btn => {
        if (btn.textContent.trim().includes("Create Project")) {
            btn.style.setProperty("display", "none", "important");
        }
    });
}
        // =========================================================
        // 3. HEADER (FETCH & UPDATE USERNAME/ROLE INSTAN)
        // =========================================================
        const header = document.querySelector(".header");

        if (header) {
            const res = await fetch("layout/header-admin.html");

            if (!res.ok) {
                throw new Error("Gagal memuat header-admin.html: " + res.status);
            }

            header.innerHTML = await res.text();

            // --- UPDATE TEKS PROFIL DI HEADER ---
            if (activeUser) {
                const textNodes = header.querySelectorAll("div, span, p, strong, b, h1, h2, h3");
                textNodes.forEach(el => {
                    if (el.children.length === 0) {
                        const txt = el.textContent.trim();
                        if (txt === "Administrator") {
                            el.textContent = activeUser.name || activeUser.username || "Client User";
                        }
                        if (txt === "System Admin") {
                            el.textContent = role;
                        }
                    }
                });
            }

            // --- SET PAGE TITLE & SUBTITLE ---
            const pageData = {
                "dashboard.html": { title: "Dashboard", subtitle: "Integrated Assessment Platform" },
                "assessment-catalog.html": { title: "Assessment Catalog", subtitle: "Manage all assessment instruments available in the system." },
                "assessment-project.html": { title: "Assessment Project", subtitle: "Create and manage assessment projects" },
                "project-detail.html": { title: "Assessment Detail", subtitle: "Configure assessments within a project" },
                "participants.html": { title: "Participants", subtitle: "Manage participant data and assessment progress" },
                "hasil.html": { title: "Results", subtitle: "Assessment results and reports" },
                "projects.html": { title: "Project Access", subtitle: "Manage assessment projects and client assignments" },
                "identitas.html": { title: "Participant Profile", subtitle: "Complete participant identity before assessment" },
                "petunjuk.html": { title: "Instructions", subtitle: "Assessment guidelines" },
                "assessment.html": { title: "Assessment", subtitle: "Psychological Assessment" }
            };

            const page = location.pathname.split("/").pop().toLowerCase() || "dashboard.html";

            if (pageData[page]) {
                const titleEl = document.getElementById("pageTitle");
                const subtitleEl = document.getElementById("pageSubtitle");
                if (titleEl) titleEl.textContent = pageData[page].title;
                if (subtitleEl) subtitleEl.textContent = pageData[page].subtitle;
            }
        }

    } catch (error) {
        console.error("Layout Loader Error:", error);
    }
});

// =================================================================
// GLOBAL USER DROPDOWN & LOGOUT (PHASE 3 - FIXED)
// =================================================================
(function setupUserDropdown() {
    "use strict";

    var _logoutInProgress = false;

    // ============================================================
    // LOGOUT HANDLER (single source of truth)
    // ============================================================
    async function handleLogout(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Guard: jangan dobel klik
        if (_logoutInProgress) return;
        _logoutInProgress = true;

        console.log("[LAYOUT] 🚪 Logout clicked — clearing session...");

        // Visual feedback
        var logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.disabled = true;
            logoutBtn.style.opacity = "0.6";
            logoutBtn.style.cursor = "wait";
        }

        try {
            // PRIORITAS 1: TS_SESSION
            if (window.TS_SESSION && typeof window.TS_SESSION.clearSession === "function") {
                await window.TS_SESSION.clearSession();
                console.log("[LAYOUT] ✅ Session cleared via TS_SESSION");
            }
            // PRIORITAS 2: TS_AUTH (legacy)
            else if (window.TS_AUTH && typeof window.TS_AUTH.logout === "function") {
                await window.TS_AUTH.logout();
                console.log("[LAYOUT] ✅ Session cleared via TS_AUTH");
            }
            // PRIORITAS 3: Manual clear
            else {
                var sb = window.supabaseClient;
                if (sb && sb.auth) {
                    try { await sb.auth.signOut(); } catch (err) {}
                }
                console.log("[LAYOUT] ✅ Session cleared manually");
            }
        } catch (err) {
            console.warn("[LAYOUT] Logout error:", err);
        }

        // Fallback cleanup — hapus legacy keys
        try {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
            localStorage.removeItem('talentscope_current_user');
            sessionStorage.removeItem('ts_participant_session');
        } catch (err) {}

        // Redirect ke login
        console.log("[LAYOUT] 🚪 Redirecting to login...");
        window.location.replace("login.html");
    }

    // ============================================================
    // ATTACH HANDLER (retry karena dropdown bisa dibuat dinamis)
    // ============================================================
    function attachLogoutHandler() {
        var logoutBtns = document.querySelectorAll(
            "#logoutBtn, " +
            ".dropdown-menu a[href*='logout' i], " +
            ".dropdown-menu button[data-action='logout'], " +
            ".dropdown-item[data-action='logout'], " +
            "[role='menuitem'][data-action='logout']"
        );

        // Fallback: cari berdasarkan teks
        var dropdownItems = document.querySelectorAll(
            ".dropdown-menu a, .dropdown-menu button, .dropdown-item, [role='menuitem']"
        );

        dropdownItems.forEach(function (el) {
            var txt = (el.textContent || "").trim().toLowerCase();
            var isLogoutText = (
                txt === "log out" ||
                txt === "logout" ||
                txt === "sign out" ||
                txt === "keluar" ||
                txt.includes("log out")
            );

            if (isLogoutText && el.dataset.tsLogoutBound !== "1") {
                el.dataset.tsLogoutBound = "1";
                el.addEventListener("click", handleLogout, true);
                console.log("[LAYOUT] ✅ Logout handler bound:", txt);
            }
        });

        // Handle #logoutBtn eksplisit
        var explicitBtn = document.getElementById("logoutBtn");
        if (explicitBtn && explicitBtn.dataset.tsLogoutBound !== "1") {
            explicitBtn.dataset.tsLogoutBound = "1";
            explicitBtn.addEventListener("click", handleLogout, true);
            console.log("[LAYOUT] ✅ #logoutBtn handler bound");
        }
    }

    // Retry binding dengan interval
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            setTimeout(attachLogoutHandler, 300);
        });
    } else {
        setTimeout(attachLogoutHandler, 300);
    }

    setTimeout(attachLogoutHandler, 1000);
    setTimeout(attachLogoutHandler, 2000);
    setTimeout(attachLogoutHandler, 4000);

    // ============================================================
    // DROPDOWN TOGGLE (untuk area di luar logout button)
    // ============================================================
    document.addEventListener("click", function (e) {
        var userDropdown = document.getElementById("userDropdown");
        var dropdownMenu = document.getElementById("dropdownMenu");

        if (!userDropdown || !dropdownMenu) return;

        // Skip kalau yang diklik adalah logout (sudah di-handle di atas)
        var isLogoutClick = e.target.closest(
            "#logoutBtn, .dropdown-menu a, .dropdown-menu button, .dropdown-item, [role='menuitem']"
        );
        
        if (isLogoutClick) {
            var txt = (isLogoutClick.textContent || "").trim().toLowerCase();
            if (txt.includes("log out") || txt.includes("logout") || 
                txt.includes("sign out") || txt.includes("keluar")) {
                // Biarkan handler utama yang urus
                return;
            }
        }

        // Toggle dropdown
        if (userDropdown.contains(e.target)) {
            dropdownMenu.classList.toggle("show");
        } else {
            dropdownMenu.classList.remove("show");
        }
    });

    // Expose untuk manual trigger (opsional)
    window.__tsHandleLogout = handleLogout;

})();