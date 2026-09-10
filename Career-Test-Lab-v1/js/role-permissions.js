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

})(window);
