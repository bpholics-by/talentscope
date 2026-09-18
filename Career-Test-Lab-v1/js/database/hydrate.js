/* ==========================================================
   DATABASE — HYDRATE PARTICIPANT
   ----------------------------------------------------------
   Lengkapi data peserta dengan:
   - Activity log dari projects
   - Tujuan tes dari project
========================================================== */

(function () {
    "use strict";

    window.DB = window.DB || {};

    function norm(v) {
        return String(v == null ? "" : v).trim().toLowerCase();
    }

    // Ambil tujuan tes dari project
    DB.getProjectPurposeForParticipant = function (item, projects) {
        if (!item) return "";
        DB.buildDatabaseIndex();

        var pid = norm(
            item.projectId ||
                item.idProject ||
                item.project_id ||
                item.projectID
        );
        var project = null;

        if (pid && DB.__tsProjectIndex) {
            project = DB.__tsProjectIndex.get(pid);
        }

        if (!project) {
            var pname = norm(
                item.namaProject || item.projectName || item.project_name
            );
            if (pname && Array.isArray(projects)) {
                project = projects.find(function (p) {
                    return (
                        p &&
                        norm(p.name || p.projectName || p.project_name) ===
                            pname
                    );
                });
            }
        }

        if (!project) return "";

        return (
            project.tujuanTes ||
            project.purpose ||
            project.testPurpose ||
            project.assessmentPurpose ||
            project.objective ||
            project.objectiveTest ||
            project.tujuan ||
            project.type ||
            ""
        );
    };

    // Hydrate activity log dari projects
    DB.hydrateParticipantActivityFromProjects = function (parsedData) {
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            return parsedData;
        }

        DB.buildDatabaseIndex();
        if (!DB.__tsProjectIndex || DB.__tsProjectIndex.size === 0) {
            return parsedData;
        }

        var operationalFields = [
            "invitationStatus",
            "invitedAt",
            "invitationSentAt",
            "accountStatus",
            "access",
            "loginTime",
            "loggedInAt",
            "loginAt",
            "lastLoginAt",
            "logoutTime",
            "loggedOutAt",
            "logoutAt",
            "lastLogoutAt",
            "isLoggedIn",
            "assessmentStatus",
            "statusAsesmen",
            "activity",
            "currentActivity",
            "lastActivity",
            "activityUpdatedAt",
            "lastSeen",
            "lastSeenAt",
            "activityHistory",
            "history"
        ];

        var changed = false;

        var hydrated = parsedData.map(function (item) {
            var pid = norm(
                item.projectId || item.idProject || item.projectID
            );
            if (!pid) return item;

            var project = DB.__tsProjectIndex.get(pid);
            if (!project) return item;

            var participantId = norm(
                item.participantId || item.participantID || item.id || ""
            );
            var email = norm(
                item.email || item.emailUser || item.emailAddress || ""
            );

            var projectParticipant = null;
            if (participantId) {
                projectParticipant = DB.__tsParticipantIndex.get(
                    pid + "|id:" + participantId
                );
            }
            if (!projectParticipant && email) {
                projectParticipant = DB.__tsParticipantIndex.get(
                    pid + "|email:" + email
                );
            }

            if (!projectParticipant) return item;

            var next = Object.assign({}, item);
            var itemChanged = false;

            operationalFields.forEach(function (field) {
                if (field === "activityHistory" || field === "history") {
                    var existingHistory = Array.isArray(next[field])
                        ? next[field]
                        : [];
                    var incomingHistory = Array.isArray(
                        projectParticipant[field]
                    )
                        ? projectParticipant[field]
                        : [];

                    if (incomingHistory.length === 0) return;

                    var seenKeys = new Set();
                    var merged = [];

                    existingHistory
                        .concat(incomingHistory)
                        .forEach(function (h) {
                            if (!h) return;
                            var key = JSON.stringify([
                                h.type,
                                h.activity || h.description,
                                h.timestamp || h.time
                            ]);
                            if (seenKeys.has(key)) return;
                            seenKeys.add(key);
                            merged.push(h);
                        });

                    merged.sort(function (a, b) {
                        return (
                            new Date(b.timestamp || b.time || 0) -
                            new Date(a.timestamp || a.time || 0)
                        );
                    });

                    if (
                        JSON.stringify(next[field]) !== JSON.stringify(merged)
                    ) {
                        next[field] = merged;
                        itemChanged = true;
                    }
                } else {
                    if (
                        projectParticipant[field] !== undefined &&
                        projectParticipant[field] !== null
                    ) {
                        if (
                            JSON.stringify(next[field]) !==
                            JSON.stringify(projectParticipant[field])
                        ) {
                            next[field] = projectParticipant[field];
                            itemChanged = true;
                        }
                    }
                }
            });

            if (
                projectParticipant.status !== undefined &&
                projectParticipant.status !== null &&
                next.assessmentStatus === undefined
            ) {
                next.assessmentStatus = projectParticipant.status;
                itemChanged = true;
            }

            if (projectParticipant.username && !next.username) {
                next.username = projectParticipant.username;
                itemChanged = true;
            }

            if (projectParticipant.password && !next.password) {
                next.password = projectParticipant.password;
                itemChanged = true;
            }

            if (itemChanged) changed = true;
            return next;
        });

        if (changed) {
            try {
                localStorage.setItem(
                    DB.STORAGE_KEY,
                    JSON.stringify(hydrated)
                );
            } catch (e) {
                console.warn("Gagal sinkronisasi status peserta:", e);
            }
        }

        return hydrated;
    };

    // Hydrate tujuan tes dari projects
    DB.hydrateParticipantPurposeFromProjects = function (parsedData) {
        if (!Array.isArray(parsedData)) return parsedData;

        var projects = [];
        try {
            projects = JSON.parse(
                localStorage.getItem(DB.PROJECTS_KEY) || "[]"
            );
        } catch (e) {
            projects = [];
        }

        if (!Array.isArray(projects) || !projects.length) {
            return parsedData;
        }

        var changed = false;

        var hydrated = parsedData.map(function (item) {
            var existingPurpose =
                item.tujuanTes ||
                item.purpose ||
                item.testPurpose ||
                item.assessmentPurpose ||
                "";

            if (existingPurpose) return item;

            var projectPurpose = DB.getProjectPurposeForParticipant(
                item,
                projects
            );
            if (!projectPurpose) return item;

            changed = true;

            return {
                ...item,
                tujuanTes: projectPurpose,
                purpose: projectPurpose
            };
        });

        if (changed) {
            try {
                localStorage.setItem(
                    DB.STORAGE_KEY,
                    JSON.stringify(hydrated)
                );
            } catch (e) {
                console.warn("Gagal menyimpan Tujuan Tes:", e);
            }
        }

        return hydrated;
    };

    console.log("[DB] Hydrate module initialized");
})();