document.addEventListener("DOMContentLoaded", async () => {
    try {
        // =========================================================
        // 1. AMBIL SESSION USER TERLEBIH DAHULU
        // =========================================================
        const keys = ["talentscope_current_user", "ts_admin_session", "user", "currentUser"];
        let activeUser = null;

        for (const key of keys) {
            const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (parsed && (parsed.role || parsed.name || parsed.username)) {
                        activeUser = parsed;
                        break;
                    }
                } catch (e) {}
            }
        }

        const role = activeUser ? String(activeUser.role || "System Administrator").trim() : "";
        const isClient = /client/i.test(role);
        const isAsesor = /asesor|assessor/i.test(role);
        const isAdmin = /administrator/i.test(role) && !/system/i.test(role);

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
            let hideList = [];
            if (isClient) {
                hideList = ["Assessment Catalog", "Participants", "Test Builder", "Test Bank", "Settings"];
            } else if (isAsesor) {
                hideList = ["Assessment Catalog", "Assessment Project", "Assessment Detail", "Participants", "Test Builder", "Test Bank", "Settings"];
            } else if (isAdmin) {
                hideList = ["Settings"];
            }

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
// GLOBAL USER DROPDOWN & LOGOUT (GABUNGAN)
// =================================================================
document.addEventListener("click", function (e) {
    const userDropdown = document.getElementById("userDropdown");
    const dropdownMenu = document.getElementById("dropdownMenu");

    if (!userDropdown || !dropdownMenu) return;

    // Cek apakah yang diklik adalah tombol logout (atau bagian dalamnya)
    const logoutBtn = e.target.closest("#logoutBtn");
    if (logoutBtn) {
        e.preventDefault();
        
        // Bersihkan data sesi
        // Hanya hapus data sesi login saja, data peserta & proyek aman
localStorage.removeItem('auth_token');
localStorage.removeItem('current_user');
sessionStorage.clear();
        
        // Sesuaikan tujuan redirect (pilih salah satu: "login.html" atau "../index.html")
        window.location.href = "login.html"; 
        return;
    }

    // Toggle menu dropdown
    if (userDropdown.contains(e.target)) {
        dropdownMenu.classList.toggle("show");
    } else {
        dropdownMenu.classList.remove("show");
    }
});