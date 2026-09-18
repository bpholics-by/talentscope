/* ==========================================================
   TALENTSCOPE — REPORT ACCESS CONTROL
   ==========================================================
   Membatasi akses di halaman report viewer berdasarkan role:
   - Admin / System Admin → full access
   - Client / Asesor → read-only untuk peserta mereka sendiri

   Dipakai di:
   - msjt_report.html
   - sjt_report.html
   - vap_report.html

   Cara pakai:
   <script src="js/report-access-control.js"></script>
   (dimuat SETELAH DOM ready)
========================================================== */

(function () {
    "use strict";

    var ROLE_CACHE = null;

    // =====================================================
    // GET SESSION
    // =====================================================
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

    // =====================================================
    // GET ROLE
    // =====================================================
    function getRole() {
        if (ROLE_CACHE) return ROLE_CACHE;
        var session = getSession();
        if (!session) return "";
        var role = String(
            session.role ||
            session.userRole ||
            session.roleName ||
            ""
        ).trim().toLowerCase();
        ROLE_CACHE = role;
        return role;
    }

    // =====================================================
    // CEK ROLE
    // =====================================================
    function isSystemAdmin() {
        return getRole().indexOf("system") !== -1;
    }

    function isAdmin() {
        var role = getRole();
        return role.indexOf("admin") !== -1 && role.indexOf("system") === -1;
    }

    function isClient() {
        return getRole().indexOf("client") !== -1;
    }

    function isAsesor() {
        var role = getRole();
        return role.indexOf("asesor") !== -1 || role.indexOf("assessor") !== -1;
    }

    function isRestricted() {
        return isClient() || isAsesor();
    }

    // =====================================================
    // APPLY RESTRICTIONS
    // =====================================================
    function applyRestrictions() {
        var session = getSession();
        if (!session) {
            console.log("[ReportAccess] Tidak ada session — skip");
            return;
        }

        var role = getRole();
        console.log("[ReportAccess] Role:", role);

        // Kalau admin → tidak ada restriction
        if (isSystemAdmin() || isAdmin()) {
            console.log("[ReportAccess] Admin — full access");
            return;
        }

        // Kalau bukan client/asesor → skip
        if (!isRestricted()) {
            console.log("[ReportAccess] Role tidak dikenal — skip");
            return;
        }

        console.log("[ReportAccess] Restricted role — sembunyikan tombol destruktif");

        // ==================================================
        // 1. SEMBUNYIKAN TOMBOL DESTRUKTIF
        // ==================================================

        var buttonsToHide = [
            // MSJT/LSJT/VAP report
            "button.danger",
            "button[onclick*='clearAll']",
            "button[onclick*='removeSelected']",
            "button[onclick*='hapus']",
            "button[onclick*='delete']"
        ];

        buttonsToHide.forEach(function (selector) {
            document.querySelectorAll(selector).forEach(function (btn) {
                btn.style.setProperty("display", "none", "important");
            });
        });

        // Sembunyikan tombol dengan teks "Hapus"
        document.querySelectorAll("button").forEach(function (btn) {
            var text = (btn.textContent || "").toLowerCase();
            if (text.indexOf("hapus") !== -1 ||
                text.indexOf("delete") !== -1 ||
                text.indexOf("remove") !== -1) {
                btn.style.setProperty("display", "none", "important");
            }
        });

        // ==================================================
        // 2. SEMBUNYIKAN "Export Semua"
        // ==================================================
        document.querySelectorAll("button").forEach(function (btn) {
            var text = (btn.textContent || "").toLowerCase();
            if (text.indexOf("export semua") !== -1 ||
                text.indexOf("export all") !== -1) {
                btn.style.setProperty("display", "none", "important");
            }
        });

        // ==================================================
        // 3. LOCK DROPDOWN — hanya tampilkan peserta mereka
        // ==================================================

        var select = document.getElementById("resultSelect");
        if (!select) {
            console.log("[ReportAccess] #resultSelect tidak ada");
            return;
        }

        // Simpan method asli
        if (!select.__originalInnerHTML) {
            select.__originalInnerHTML = select.innerHTML;
        }

        // Tambah pointer-events: none supaya tidak bisa dibuka
        // Tapi tetap tampil (biar user lihat nama peserta)
        select.style.setProperty("pointer-events", "none", "important");
        select.style.setProperty("background", "#f8fafc", "important");
        select.style.setProperty("cursor", "not-allowed", "important");

        console.log("[ReportAccess] Dropdown di-lock");

        // ==================================================
        // 4. TAMBAH BADGE "VIEW ONLY"
        // ==================================================
        var header = document.querySelector(".topbar, header, .header");
        if (header && !document.getElementById("__viewOnlyBadge")) {
            var badge = document.createElement("span");
            badge.id = "__viewOnlyBadge";
            badge.textContent = "👁 View Only";
            badge.style.cssText =
                "margin-left:12px;padding:5px 10px;border-radius:6px;" +
                "background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;";

            var target = header.querySelector("h1, .header-title, h1");
            if (target && target.parentNode) {
                target.parentNode.appendChild(badge);
            } else {
                header.appendChild(badge);
            }
        }

        console.log("[ReportAccess] ✓ Restrictions applied");
    }

    // =====================================================
    // INIT
    // =====================================================
    function init() {
        // Tunggu DOM ready + 200ms supaya renderDropdown selesai dulu
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function () {
                setTimeout(applyRestrictions, 500);
            });
        } else {
            setTimeout(applyRestrictions, 500);
        }
    }

    init();

    // Expose untuk debug
    window.ReportAccessControl = {
        isAdmin: isAdmin,
        isSystemAdmin: isSystemAdmin,
        isClient: isClient,
        isAsesor: isAsesor,
        isRestricted: isRestricted,
        getRole: getRole,
        apply: applyRestrictions
    };

})();