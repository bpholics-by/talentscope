/* ==========================================================
   DATABASE — INDEX MAP
   ----------------------------------------------------------
   Build index O(1) untuk lookup project & participant.
   Menghindari nested loop O(N×M×K).
========================================================== */

(function () {
    "use strict";

    window.DB = window.DB || {};

    DB.__tsProjectIndex = null;
    DB.__tsParticipantIndex = null;
    DB.__tsIndexBuiltAt = 0;
    DB.__TS_INDEX_TTL_MS = 5000;

    function norm(v) {
        return String(v == null ? "" : v).trim().toLowerCase();
    }

    DB.buildDatabaseIndex = function () {
        var now = Date.now();
        if (
            DB.__tsProjectIndex &&
            now - DB.__tsIndexBuiltAt < DB.__TS_INDEX_TTL_MS
        ) {
            return;
        }

        var projects = [];
        try {
            projects = JSON.parse(
                localStorage.getItem(DB.PROJECTS_KEY) || "[]"
            );
        } catch (e) {
            projects = [];
        }
        if (!Array.isArray(projects)) projects = [];

        var projectById = new Map();
        var participantByKey = new Map();

        projects.forEach(function (p) {
            if (!p) return;

            var pid = norm(p.id || p.projectId || p.projectID || p.project_id);
            if (pid) projectById.set(pid, p);

            var list = Array.isArray(p.participants) ? p.participants : [];
            list.forEach(function (person) {
                if (!person) return;

                var perId = norm(
                    person.id ||
                        person.participantId ||
                        person.participantID ||
                        person.employeeId ||
                        ""
                );
                var perEmail = norm(person.email || person.emailAddress || "");

                if (perId) participantByKey.set(pid + "|id:" + perId, person);
                if (perEmail)
                    participantByKey.set(pid + "|email:" + perEmail, person);
            });
        });

        DB.__tsProjectIndex = projectById;
        DB.__tsParticipantIndex = participantByKey;
        DB.__tsIndexBuiltAt = now;

        console.log(
            "[DB-INDEX] Built index:",
            projectById.size,
            "projects,",
            participantByKey.size,
            "participant keys"
        );
    };

    // Invalidate index saat projects di-update
    var originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
        originalSetItem(key, value);
        if (key === DB.PROJECTS_KEY) {
            DB.__tsProjectIndex = null;
            DB.__tsParticipantIndex = null;
            DB.__tsIndexBuiltAt = 0;
        }
    };

    console.log("[DB] Index module initialized");
})();