/* ==========================================================
   TalentScope - Project Filter & Read-Only Asesor (FIX)
   ========================================================== */

(function () {
    "use strict";

    /* --------------------------------------------------------
       FIX: window.TalentScopeAccess tidak pernah didefinisikan
       di file manapun sebelumnya, jadi getCurrentUser() selalu
       null dan seluruh fungsi ini mati (langsung return di
       bawah). Definisikan di sini, baca dari sessionStorage
       "ts_admin_session" (dipakai untuk Client Administrator /
       Asesor / System Admin, diisi oleh login.html).
       -------------------------------------------------------- */
    if (!window.TalentScopeAccess) {
        window.TalentScopeAccess = {
            getCurrentUser: function () {
                try {
                    var raw = sessionStorage.getItem("ts_admin_session");
                    return raw ? JSON.parse(raw) : null;
                } catch (e) {
                    return null;
                }
            }
        };
    }

    function enforceRoleLimits() {
        const user = window.TalentScopeAccess ? window.TalentScopeAccess.getCurrentUser() : null;
        if (!user) return;

        // FIX PENTING: role yang benar2 tersimpan cuma ada 2 nilai
        // persis: "Client Administrator" dan "Client User" (lihat
        // loadClientRoles() di projects-render.js). Tidak pernah ada
        // role bernama "Asesor"/"Assessor". "Client User" itu yang
        // SECARA PERILAKU = Asesor. Regex /client/i lama mencocokkan
        // KEDUANYA, jadi "Client User" sebelumnya selalu disamakan
        // dengan Client Administrator (bug utama).
        const roleStr = String(user.role || "");
        const isSystemAdmin = /system/i.test(roleStr);
        const isAsesorRole =
            !isSystemAdmin &&
            (/asesor|assessor/i.test(roleStr) ||
                (/client/i.test(roleStr) && /user/i.test(roleStr)));
        const isClientRole = !isSystemAdmin && !isAsesorRole && /client/i.test(roleStr);

        // 1. ASESOR: MODE VIEW ONLY (Hapus/Sembunyikan Tombol Aksi)
        if (isAsesorRole) {
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

        // 2. CLIENT: FILTER PROJECT
        // FIX: dulu di sini pakai pencocokan teks baris yang rapuh
        // (cek apakah teks baris mengandung username/nama client atau
        // kata "client") - gampang salah tampil. Sekarang project
        // yang dikirim ke renderProjects() di projects-render.js
        // SUDAH difilter berdasarkan projectId pada session (lihat
        // getVisibleProjectsForCurrentUser() di file itu), jadi baris
        // yang sampai ke DOM di sini memang sudah cuma milik user
        // yang login. Tidak perlu filter ulang di sini.
    }

    document.addEventListener("DOMContentLoaded", enforceRoleLimits);

    // Dijalankan kembali jika ada perubahan tabel dinamis
    window.TalentScopeProjectFilter = {
        apply: enforceRoleLimits
    };
})();