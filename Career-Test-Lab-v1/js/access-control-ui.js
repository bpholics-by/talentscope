(function () {
  "use strict";

  function applyAccessControl() {
    // 1. Ambil session user aktif
    var keys = [
      "ts_admin_session",
      "talentscope_current_user",
      "user",
      "currentUser",
    ];
    var activeUser = null;

    for (var i = 0; i < keys.length; i++) {
      var raw =
        sessionStorage.getItem(keys[i]) || localStorage.getItem(keys[i]);
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (parsed && (parsed.role || parsed.name || parsed.username)) {
            activeUser = parsed;
            break;
          }
        } catch (e) {}
      }
    }

    if (!activeUser) return;

    var role = String(activeUser.role || "System Administrator").trim();

    // 2. Ubah Teks Header Profile
    var textNodes = document.querySelectorAll(
      "div, span, p, strong, b, h1, h2, h3",
    );
    textNodes.forEach(function (el) {
      if (el.children.length === 0) {
        var txt = el.textContent.trim();
        if (txt === "Administrator") {
          el.textContent =
            activeUser.name || activeUser.username || "Client User";
        }
        if (txt === "System Admin") {
          el.textContent = role;
        }
      }
    });

    // 3. Sembunyikan Menu Sidebar Sesuai Role
    //
    // FIX PENTING: role yang benar-benar dibuat lewat "Generate
    // Credentials" di projects-render.js HANYA ADA DUA nilai
    // persis: "Client Administrator" dan "Client User" (lihat
    // loadClientRoles()/syncAccessToUsersDirectory() di file
    // itu). Tidak pernah ada role bernama "Asesor"/"Assessor".
    // "Client User" itulah yang SECARA PERILAKU harus diperlakukan
    // sebagai Asesor (dashboard asesor, view-only, dst) - bukan
    // "Client Administrator". Regex /client/i lama mencocokkan
    // KEDUANYA sekaligus, dan /asesor|assessor/i tidak pernah
    // cocok sama sekali, jadi sebelumnya "Client User" selalu
    // jatuh ke cabang isClient (disamakan dengan Client
    // Administrator) - inilah bug utama yang bikin dashboard
    // Client User identik dengan Client Administrator.
    var isSystemAdmin = /system/i.test(role);
    var isAsesor =
      !isSystemAdmin &&
      (/asesor|assessor/i.test(role) ||
        (/client/i.test(role) && /user/i.test(role)));
    var isClient = !isSystemAdmin && !isAsesor && /client/i.test(role);
    var isAdmin = !isSystemAdmin && !isAsesor && !isClient && /administrator/i.test(role);

    var hideList = [];
    if (isClient) {
      // FIX: dikonfirmasi Client Administrator HARUS bisa buka menu
      // Participants (dibatasi ke project miliknya saja - scoping
      // dilakukan di participants.js, bukan di sini). Sebelumnya
      // menu ini ikut disembunyikan.
      hideList = [
        "Assessment Catalog",
        "Test Builder",
        "Test Bank",
        "Settings",
      ];
    } else if (isAsesor) {
      // FIX: Asesor HARUS tetap melihat "Assessment Project" dan
      // "Participants" (partisipan hanya di project miliknya,
      // tanpa edit/remove) — sebelumnya kedua menu ini malah ikut
      // disembunyikan, jadi menu yang muncul cuma Dashboard +
      // Project Access, tidak sesuai spesifikasi.
      hideList = [
        "Assessment Catalog",
        "Assessment Detail",
        "Test Builder",
        "Test Bank",
        "Settings",
      ];
    } else if (isAdmin) {
      hideList = ["Settings"];
    }

    if (hideList.length > 0) {
      var links = document.querySelectorAll(
        ".sidebar a, nav a, .sidebar li, .menu-item, a",
      );
      links.forEach(function (link) {
        var linkText = link.textContent.trim();
        hideList.forEach(function (menuName) {
          if (linkText.indexOf(menuName) !== -1) {
            link.style.setProperty("display", "none", "important");
          }
        });
      });
    }

    // 4. Sembunyikan Tombol Aksi Sensitif untuk Asesor saja
    // (Client Administrator = PIC/pemilik project, tetap full akses
    // ke semua tombol pada project miliknya sendiri)
    if (isAsesor) {
      var buttons = document.querySelectorAll(
        "button, .btn, .btn-primary, .btn-danger",
      );
      buttons.forEach(function (btn) {
        var bt = btn.textContent.toLowerCase();
        if (
          bt.includes("remove") ||
          bt.includes("create") ||
          bt.includes("add") ||
          bt.includes("delete") ||
          bt.includes("tambah") ||
          bt.includes("edit")
        ) {
          btn.style.setProperty("display", "none", "important");
        }
      });
    }
  }

  // Jalankan secepat mungkin & saat DOM selesai dimuat
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyAccessControl);
  } else {
    applyAccessControl();
  }
  window.addEventListener("load", applyAccessControl);
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