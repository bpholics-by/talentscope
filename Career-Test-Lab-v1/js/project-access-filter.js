/* ==========================================================
   TalentScope - Project Filter & Read-Only Asesor (FIX)
   ========================================================== */

(function () {
    "use strict";

    function enforceRoleLimits() {
        const user = window.TalentScopeAccess ? window.TalentScopeAccess.getCurrentUser() : null;
        if (!user) return;

        const role = user.role;

        // 1. ASESOR: MODE VIEW ONLY (Hapus/Sembunyikan Tombol Aksi)
        if (role === "Asesor") {
            // Sembunyikan tombol Create / Add Project
            document.querySelectorAll("#addProjectBtn, .btn-create, .btn-primary-add").forEach(btn => {
                btn.style.display = "none";
            });

            // Sembunyikan tombol Edit & Delete pada Tabel / Card
            document.querySelectorAll(".btn-edit, .btn-delete, button[data-action='edit'], button[data-action='delete']").forEach(btn => {
                btn.style.display = "none";
            });

            // Matikan tombol Generate Password
            document.querySelectorAll(".btn-generate, button[title*='Generate']").forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = "0.4";
                btn.style.cursor = "not-allowed";
                btn.title = "Hanya Administrator yang dapat meng-generate password";
            });
        }

        // 2. CLIENT: HANYA MENAMPILKAN PROJECT MILIK CLIENT
        if (role === "Client") {
            const clientName = (user.username || user.name || "").toLowerCase();

            document.querySelectorAll("table tbody tr, .project-card").forEach(row => {
                const rowText = row.textContent.toLowerCase();
                if (!rowText.includes(clientName) && !rowText.includes("client")) {
                    row.style.display = "none";
                }
            });
        }
    }

    document.addEventListener("DOMContentLoaded", enforceRoleLimits);

    // Dijalankan kembali jika ada perubahan tabel dinamis
    window.TalentScopeProjectFilter = {
        apply: enforceRoleLimits
    };
})();