/* ==========================================================
   TALENTSCOPE — TAB SWITCH WARNING (Shared Helper)
   ==========================================================
   Helper untuk mendeteksi & memberi warning ketika peserta
   pindah tab/aplikasi selama asesmen.

   FITUR:
   1. Counter pindah tab (persist di sessionStorage)
   2. Deteksi pindah > 30 detik (long switch)
   3. Warning popup di 3×, 5×, 7×
   4. Log ke activityHistory peserta
   5. Sinkron dengan participant-dashboard.html (counter sama)

   DIPAKAI DI:
   - msjt_managerial.html
   - sjt_leadership.html
   - speedtest.html (VAP)
   - disc_test.html
   - papi_kostick_test.html

   CARA PAKAI (di setiap test file):
   <script src="js/tab-switch-warning.js"></script>
   <script>
       TabSwitchWarning.init({ context: "MSJT" });
   </script>
========================================================== */

(function () {
    "use strict";

    // Cek apakah sudah di-init sebelumnya
    if (window.TabSwitchWarning && window.TabSwitchWarning.__initialized) {
        console.log("[TabSwitchWarning] Sudah di-init, skip");
        return;
    }

    var STATE_KEY = "ts_tab_switch_stats_v2";  // beda dari v1 (dashboard)
    var THRESHOLDS = {
        3: {
            level: "first",
            message: "⚠️ PERINGATAN PINDAH TAB\n\n" +
                     "Anda terdeteksi pindah tab 3 kali selama asesmen.\n\n" +
                     "Mohon fokus pada tes. Aktivitas pindah tab " +
                     "TERCATAT dalam log asesmen dan dapat mempengaruhi " +
                     "penilaian integritas Anda."
        },
        5: {
            level: "second",
            message: "⚠️ PERINGATAN KEDUA\n\n" +
                     "Anda sudah pindah tab 5 kali.\n\n" +
                     "Aktivitas ini mencurigakan. Bila perlu bantuan, " +
                     "silakan hubungi administrator.\n\n" +
                     "Pindah tab berulang dapat menyebabkan hasil tes " +
                     "Anda ditinjau ulang atau dibatalkan."
        },
        7: {
            level: "final",
            message: "🚨 PERINGATAN TERAKHIR\n\n" +
                     "Anda sudah pindah tab 7 kali.\n\n" +
                     "Pindah tab berulang selama asesmen melanggar " +
                     "ketentuan integritas. Administrator sudah diberitahu.\n\n" +
                     "Mohon tetap fokus. Bila perlu intervensi, " +
                     "hubungi administrator segera."
        }
    };

    var __stats = {
        count: 0,
        longSwitches: 0,
        totalDuration: 0,
        lastHiddenAt: null,
        warningShownAt: {},
        context: "assessment"
    };

    // Baca dari sessionStorage (persist antar halaman)
    function loadStats() {
        try {
            var saved = sessionStorage.getItem(STATE_KEY);
            if (saved) {
                var parsed = JSON.parse(saved);
                __stats.count = parsed.count || 0;
                __stats.longSwitches = parsed.longSwitches || 0;
                __stats.totalDuration = parsed.totalDuration || 0;
                __stats.warningShownAt = parsed.warningShownAt || {};
            }
        } catch (e) {}
    }

    function saveStats() {
        try {
            sessionStorage.setItem(STATE_KEY, JSON.stringify({
                count: __stats.count,
                longSwitches: __stats.longSwitches,
                totalDuration: __stats.totalDuration,
                warningShownAt: __stats.warningShownAt
            }));
        } catch (e) {}
    }

    // Cek dan tampilkan warning kalau sudah mencapai threshold
    function checkWarning() {
        var count = __stats.count;
        var lastWarning = __stats.warningShownAt[count] || 0;

        // Hindari spam warning dalam 60 detik
        if (Date.now() - lastWarning < 60000) return;

        var threshold = THRESHOLDS[count];

        // Setelah 7×, muncul setiap 3× berikutnya
        if (!threshold && count > 7 && (count - 7) % 3 === 1) {
            threshold = {
                level: "recurring",
                message: "⚠️ PERINGATAN\n\n" +
                         "Anda sudah pindah tab " + count + " kali.\n\n" +
                         "Aktivitas ini dicatat. Mohon fokus pada tes."
            };
        }

        if (!threshold) return;

        __stats.warningShownAt[count] = Date.now();
        saveStats();

        // Popup warning
        setTimeout(function () {
            try {
                alert(threshold.message);
            } catch (e) {
                console.warn("[TabSwitchWarning] Alert gagal:", e);
            }

            // Catat warning di activity history
            logWarningToActivity(count, threshold.level);
        }, 300);
    }

    // Log warning ke activityHistory peserta
    function logWarningToActivity(count, level) {
        try {
            // Cek session peserta
            var s = sessionStorage.getItem("ts_participant_session");
            if (!s) return;

            var session = JSON.parse(s);
            var activeSessionId = session.activeSessionId;
            if (!activeSessionId) return;

            // Cek apakah push API tersedia
            if (!window.TalentScopeSync ||
                typeof window.TalentScopeSync.pushParticipantPresenceNow !== "function") {
                return;
            }

            // Ambil participant dari localStorage
            var projects = JSON.parse(localStorage.getItem("talentscope_projects") || "[]");
            var sessionProjectId = session.projectId || session.project_id;
            var sessionParticipantId = session.participantId || session.participant_id;

            for (var i = 0; i < projects.length; i++) {
                var project = projects[i];
                if (String(project.id) !== String(sessionProjectId)) continue;

                var participants = project.participants || [];
                for (var j = 0; j < participants.length; j++) {
                    var p = participants[j];
                    if (String(p.id) !== String(sessionParticipantId)) continue;

                    // Tambah log
                    if (!Array.isArray(p.activityHistory)) p.activityHistory = [];
                    p.activityHistory.push({
                        type: "tab-warning",
                        activity: "Peringatan pindah tab #" + count,
                        description: "Sistem menampilkan peringatan karena peserta pindah tab " + count + " kali.",
                        timestamp: new Date().toISOString(),
                        time: new Date().toISOString(),
                        sessionId: activeSessionId,
                        warningLevel: level,
                        context: __stats.context
                    });

                    // Update counter di participant
                    p.tabSwitchCount = __stats.count;
                    p.tabSwitchLongSwitches = __stats.longSwitches;
                    p.tabSwitchTotalDuration = __stats.totalDuration;
                    p.tabSwitchUpdatedAt = new Date().toISOString();

                    // Simpan ke localStorage (trigger push otomatis)
                    try {
                        localStorage.setItem("talentscope_projects", JSON.stringify(projects));
                    } catch (e) {}

                    // Push langsung ke Supabase
                    window.TalentScopeSync.pushParticipantPresenceNow(p.id, p)
                        .catch(function (err) {
                            console.warn("[TabSwitchWarning] Push gagal:", err);
                        });
                    return;
                }
            }
        } catch (e) {
            console.warn("[TabSwitchWarning] Log activity gagal:", e);
        }
    }

    // Simpan statistik ke participant (dipanggil saat balik ke tab)
    function syncStatsToParticipant() {
        try {
            var s = sessionStorage.getItem("ts_participant_session");
            if (!s) return;

            var session = JSON.parse(s);
            var sessionProjectId = session.projectId || session.project_id;
            var sessionParticipantId = session.participantId || session.participant_id;

            var projects = JSON.parse(localStorage.getItem("talentscope_projects") || "[]");

            for (var i = 0; i < projects.length; i++) {
                var project = projects[i];
                if (String(project.id) !== String(sessionProjectId)) continue;

                var participants = project.participants || [];
                for (var j = 0; j < participants.length; j++) {
                    var p = participants[j];
                    if (String(p.id) !== String(sessionParticipantId)) continue;

                    p.tabSwitchCount = __stats.count;
                    p.tabSwitchLongSwitches = __stats.longSwitches;
                    p.tabSwitchTotalDuration = __stats.totalDuration;
                    p.tabSwitchUpdatedAt = new Date().toISOString();

                    try {
                        localStorage.setItem("talentscope_projects", JSON.stringify(projects));
                    } catch (e) {}

                    return;
                }
            }
        } catch (e) {}
    }

    // Handler visibility change
    function handleVisibilityChange() {
        // Skip kalau internal navigation
        if (window.__tsParticipantInternalNavigation) return;

        var hidden = document.visibilityState === "hidden";

        if (hidden) {
            __stats.lastHiddenAt = Date.now();
            __stats.count++;
            saveStats();
            console.log("[TabSwitchWarning] Pindah tab #" + __stats.count);
        } else {
            // Balik ke tab
            if (__stats.lastHiddenAt) {
                var duration = Math.round((Date.now() - __stats.lastHiddenAt) / 1000);
                __stats.totalDuration += duration;
                __stats.lastHiddenAt = null;

                if (duration > 30) {
                    __stats.longSwitches++;
                }
                saveStats();
                console.log("[TabSwitchWarning] Kembali, durasi " + duration + "s");

                // Sinkron ke participant
                syncStatsToParticipant();
            }

            // Cek warning
            checkWarning();
        }
    }

    // Init
    function init(options) {
        options = options || {};
        __stats.context = options.context || "assessment";

        loadStats();

        // Attach listener
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Sync ke participant di awal
        syncStatsToParticipant();

        window.TabSwitchWarning.__initialized = true;

        console.log("[TabSwitchWarning] Initialized — context:", __stats.context,
                    "| count:", __stats.count);
    }

    // Expose global
    window.TabSwitchWarning = {
        init: init,
        getStats: function () {
            return {
                count: __stats.count,
                longSwitches: __stats.longSwitches,
                totalDuration: __stats.totalDuration,
                context: __stats.context
            };
        },
        reset: function () {
            __stats.count = 0;
            __stats.longSwitches = 0;
            __stats.totalDuration = 0;
            __stats.warningShownAt = {};
            saveStats();
            console.log("[TabSwitchWarning] Reset");
        }
    };

})();