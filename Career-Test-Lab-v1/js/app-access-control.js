/* ==========================================================
   TALENTSCOPE - GLOBAL ACCESS CONTROL & SESSION SYNC
   ========================================================== */
(function () {
    "use strict";

    // 1. Ambil session user dari penyimpanan browser
    function getActiveUser() {
        var keys = ["ts_admin_session", "talentscope_current_user", "user", "currentUser"];
        for (var i = 0; i < keys.length; i++) {
            var data = sessionStorage.getItem(keys[i]) || localStorage.getItem(keys[i]);
            if (data) {
                try {
                    var parsed = JSON.parse(data);
                    if (parsed && (parsed.role || parsed.username || parsed.name)) {
                        return parsed;
                    }
                } catch (e) {}
            }
        }
        return null;
    }

    var currentUser = getActiveUser();
    var currentPath = window.location.pathname.split("/").pop() || "index.html";

    // Jika belum login dan bukan di login.html, lempar balik ke login.html
    if (!currentUser && currentPath !== "login.html") {
        window.location.replace("login.html");
        return;
    }

    if (!currentUser) return;

    var role = String(currentUser.role || "System Administrator").trim();

    // 2. Fungsi Sinkronisasi Tampilan Navigasi & Profil
    function syncUI() {
        // A. Perbarui Teks Profil Kanan Atas secara Otomatis
        var allTextNodes = document.querySelectorAll("div, span, p, strong, b, a");
        allTextNodes.forEach(function (el) {
            if (el.children.length === 0) {
                var txt = el.textContent.trim();
                if (txt === "Administrator") {
                    el.textContent = currentUser.name || currentUser.username || "User";
                }
                if (txt === "System Admin") {
                    el.textContent = role;
                }
            }
        });

        // B. Filter Menu Sidebar Sesuai Role Active
        var isSystemAdmin = /system/i.test(role);

        // PENTING: role "Client User" (hasil Generate Credentials dengan
        // Account Role = Client User) harus berperilaku seperti Asesor
        // (dashboard terbatas), BUKAN seperti Client Administrator.
        // Sebelumnya "Client User" ikut ke-detect sebagai Client karena
        // sama-sama mengandung kata "client".
        var isAsesor = /asesor|assessor/i.test(role) || /client\s*user/i.test(role);
        var isClient = /client/i.test(role) && !isAsesor;
        var isAdmin = /administrator/i.test(role) && !isSystemAdmin && !isClient;

        var restrictedMenus = [];
        if (isClient) {
            restrictedMenus = ["Assessment Catalog", "Test Builder", "Test Bank", "Settings"];
        } else if (isAsesor) {
            // Client User (login sebagai Asesor): menu yang tampil hanya
            // Dashboard, Assessment Project, Participants (dibatasi ke
            // project miliknya sendiri), dan Project Access.
            restrictedMenus = ["Assessment Catalog", "Assessment Detail", "Test Builder", "Test Bank", "Settings"];
        } else if (isAdmin) {
            restrictedMenus = ["Settings"];
        }

        if (restrictedMenus.length > 0) {
            var links = document.querySelectorAll(".sidebar a, nav a, .sidebar li, .menu-item, a");
            links.forEach(function (item) {
                var itemText = item.textContent.trim();
                restrictedMenus.forEach(function (menuName) {
                    if (itemText.indexOf(menuName) !== -1) {
                        item.style.setProperty("display", "none", "important");
                    }
                });
            });
        }

        // C. Sembunyikan Tombol Aksi Sensitif untuk Asesor
        if (isAsesor) {
            document.querySelectorAll("button, .btn, .btn-primary").forEach(function (btn) {
                var text = btn.textContent.toLowerCase();
                if (
                    text.includes("add") || text.includes("tambah") ||
                    text.includes("create") || text.includes("delete") ||
                    text.includes("remove") || text.includes("hapus") ||
                    text.includes("edit") || text.includes("ubah") ||
                    text.includes("generate")
                ) {
                    btn.style.setProperty("display", "none", "important");
                }
            });
        }
    }

    // Eksekusi saat DOM Siap
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", syncUI);
    } else {
        syncUI();
    }
    window.addEventListener("load", syncUI);
})();


document.addEventListener("DOMContentLoaded", function() {
    var userRaw = sessionStorage.getItem("ts_admin_session") || sessionStorage.getItem("ts_participant_session");
    if (userRaw) {
        var activeUser = JSON.parse(userRaw);
        // Sembunyikan menu Settings jika bukan System Administrator
        if (!/system/i.test(activeUser.role || "")) {
            document.querySelectorAll(".dropdown-menu a, .dropdown-item").forEach(function(el) {
                if (el.textContent.trim().toLowerCase().includes("setting")) {
                    el.style.setProperty("display", "none", "important");
                }
            });
        }
    }
});