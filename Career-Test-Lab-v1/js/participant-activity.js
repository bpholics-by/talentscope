/* ==========================================================
   TalentScope - Participant Activity Tracker (shared)

   Dipakai di semua halaman peserta (Petunjuk Umum, halaman
   tes DISC/PAPI/VAP, dst). Mencatat activity ke localStorage
   (untuk kompatibilitas dengan kode lama) SEKALIGUS
   mensinkronkan ke Supabase (kolom participants.raw_data),
   supaya admin di halaman View & Monitoring / Database
   melihat data real-time dari perangkat/browser manapun,
   bukan cuma localStorage milik peserta itu sendiri.

   CARA PAKAI (taruh setelah supabase-client.js + data-service.js):

       <script src="js/participant-activity.js"></script>
       <script>
           ParticipantActivity.trackPageEntry("Petunjuk Umum");
           ParticipantActivity.trackTabSwitch("Petunjuk Umum");
       </script>

   Untuk activity custom (mis. submit jawaban tertentu):

       ParticipantActivity.recordActivity({
           type: "answer-submit",
           label: "Online - Mengerjakan soal 5",
           description: "Peserta menjawab soal nomor 5.",
           patch: { currentQuestionIndex: 5 }
       });
========================================================== */

(function (global) {
    "use strict";


    /* =====================================================
       HELPERS
    ===================================================== */

    function normalize(value) {

        return String(
            value === undefined || value === null
                ? ""
                : value
        ).trim();

    }

    function normalizeEmail(value) {

        return normalize(value).toLowerCase();

    }

    function readProjects() {

        try {

            var raw =
                localStorage.getItem(
                    "talentscope_projects"
                );

            var parsed =
                raw ? JSON.parse(raw) : [];

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            return [];

        }

    }

    function writeProjects(projects) {

        try {

            localStorage.setItem(
                "talentscope_projects",
                JSON.stringify(projects)
            );

        } catch (error) {}

    }


    /* =====================================================
       RESOLVE IDENTITY

       Prioritas: query string (?projectId=&participantId=),
       dipakai halaman seperti assessment.html / disc_test.html
       yang menerima context lewat URL. Fallback ke
       sessionStorage ts_participant_session (dipakai
       participant-dashboard.html).
    ===================================================== */

    function resolveIdentity() {

        var params =
            new URLSearchParams(
                window.location.search
            );

        var projectId =
            normalize(
                params.get("projectId") ||
                params.get("project") ||
                ""
            );

        var participantId =
            normalize(
                params.get("participantId") ||
                params.get("participant") ||
                ""
            );

        var email = "";

        if (!projectId || !participantId) {

            try {

                var raw =
                    sessionStorage.getItem(
                        "ts_participant_session"
                    );

                var s =
                    raw ? JSON.parse(raw) : null;

                if (s) {

                    projectId =
                        projectId ||
                        normalize(
                            s.projectId ||
                            s.project_id
                        );

                    participantId =
                        participantId ||
                        normalize(
                            s.participantId ||
                            s.participant_id ||
                            s.id
                        );

                    email =
                        normalizeEmail(
                            s.email ||
                            s.emailAddress
                        );

                }

            } catch (error) {}

        }

        return {
            projectId: projectId,
            participantId: participantId,
            email: email
        };

    }


    /* =====================================================
       FIND PARTICIPANT DI localStorage
    ===================================================== */

    function findParticipant(projects, identity) {

        var found = null;

        projects.forEach(function (project) {

            var projectId =
                normalize(
                    project.id ||
                    project.projectId ||
                    project.project_id
                );

            if (
                identity.projectId &&
                projectId !== identity.projectId
            ) {
                return;
            }

            if (
                !Array.isArray(
                    project.participants
                )
            ) {
                return;
            }

            project.participants.forEach(
                function (participant) {

                    var participantId =
                        normalize(
                            participant.id ||
                            participant.participantId ||
                            participant.participant_id ||
                            participant.employeeId ||
                            participant.employee_id
                        );

                    var participantEmail =
                        normalizeEmail(
                            participant.email ||
                            participant.emailAddress
                        );

                    var matched =
                        (
                            identity.participantId &&
                            participantId ===
                            identity.participantId
                        ) ||
                        (
                            identity.email &&
                            participantEmail ===
                            identity.email
                        );

                    if (matched) {
                        found = participant;
                    }

                }
            );

        });

        return found;

    }


    /* =====================================================
       SYNC KE SUPABASE
    ===================================================== */

    function syncToSupabase(participantId, participant) {

        try {

            if (
                !participantId ||
                !participant ||
                typeof DataService === "undefined" ||
                typeof DataService.updateParticipant !==
                    "function"
            ) {
                return;
            }

            DataService.updateParticipant(
                participantId,
                {
                    raw_data: participant
                }
            ).catch(function (error) {

                console.error(
                    "[PARTICIPANT ACTIVITY] Gagal sync ke Supabase:",
                    error
                );

            });

        } catch (error) {

            console.error(
                "[PARTICIPANT ACTIVITY] Unexpected sync error:",
                error
            );

        }

    }


    /* =====================================================
       RECORD ACTIVITY (fungsi utama)
    ===================================================== */

    function recordActivity(options) {

        options = options || {};

        var type =
            options.type || "activity";

        var label =
            options.label || "Activity";

        var description =
            options.description || label;

        var extra =
            options.extra || {};

        var patch =
            options.patch || {};


        var identity =
            resolveIdentity();

        if (
            !identity.projectId ||
            (
                !identity.participantId &&
                !identity.email
            )
        ) {

            console.warn(
                "[PARTICIPANT ACTIVITY] Identitas peserta tidak ditemukan, activity tidak dicatat:",
                type
            );

            return;

        }


        var projects =
            readProjects();

        var participant =
            findParticipant(
                projects,
                identity
            );

        if (!participant) {

            console.warn(
                "[PARTICIPANT ACTIVITY] Participant tidak ditemukan di localStorage:",
                identity
            );

            return;

        }


        var now =
            new Date().toISOString();


        participant.activity = label;
        participant.currentActivity = label;
        participant.lastActivity = label;
        participant.activityUpdatedAt = now;
        participant.lastSeen = now;
        participant.lastSeenAt = now;

        Object.assign(
            participant,
            patch
        );


        if (
            !Array.isArray(
                participant.activityHistory
            )
        ) {
            participant.activityHistory = [];
        }


        var entry =
            Object.assign(
                {
                    type: type,
                    activity: label,
                    title: label,
                    description: description,
                    timestamp: now,
                    time: now
                },
                extra
            );

        participant.activityHistory.push(entry);


        writeProjects(projects);


        // ID untuk update Supabase HARUS UUID asli
        // participants.id (bukan participant_code). Field ini
        // sudah diisi UUID sejak login.html melakukan
        // sinkronisasi awal ke localStorage.
        var supabaseParticipantId =
            identity.participantId ||
            normalize(participant.id);

        syncToSupabase(
            supabaseParticipantId,
            participant
        );

    }


    /* =====================================================
       TRACK PAGE ENTRY

       Catat "masuk ke halaman X" sekali saat halaman dimuat.
    ===================================================== */

    function trackPageEntry(pageLabel) {

        recordActivity({

            type: "page-enter",

            label:
                "Online - Masuk ke " +
                pageLabel,

            description:
                "Peserta masuk ke halaman " +
                pageLabel +
                ".",

            extra: {
                page: pageLabel
            }

        });

    }


    /* =====================================================
       TRACK TAB SWITCH

       Deteksi ketika peserta pindah tab/minimize (tab
       disembunyikan) dan ketika kembali aktif.
    ===================================================== */

    function trackTabSwitch(pageLabel) {

        document.addEventListener(
            "visibilitychange",
            function () {

                var hidden =
                    document.hidden;

                recordActivity({

                    type:
                        hidden
                            ? "tab-hidden"
                            : "tab-visible",

                    label:
                        hidden
                            ? "Berpindah tab / minimize"
                            : "Kembali ke tab TalentScope",

                    description:
                        (
                            hidden
                                ? "Peserta berpindah dari tab/window "
                                : "Peserta kembali ke tab/window "
                        ) +
                        pageLabel +
                        ".",

                    extra: {
                        page: pageLabel
                    }

                });

            }
        );

    }


    /* =====================================================
       EXPORT
    ===================================================== */

    global.ParticipantActivity = {

        recordActivity: recordActivity,

        trackPageEntry: trackPageEntry,

        trackTabSwitch: trackTabSwitch,

        resolveIdentity: resolveIdentity

    };


})(window);
