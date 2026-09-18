/* ==========================================================
   DATABASE — SYNC DARI SUPABASE
   ----------------------------------------------------------
   Tarik data terbaru dari Supabase, simpan ke localStorage.
   Fallback ke localStorage kalau Supabase down.
========================================================== */

(function () {
    "use strict";

    window.DB = window.DB || {};

    async function waitForDataService(timeoutMs) {
        var startedAt = Date.now();
        while (
            typeof window.DataService === "undefined" &&
            Date.now() - startedAt < timeoutMs
        ) {
            await new Promise(function (resolve) {
                setTimeout(resolve, 100);
            });
        }
        return (
            typeof window.DataService !== "undefined" &&
            typeof window.DataService.getProjects === "function"
        );
    }

    DB.syncDatabaseFromSupabase = async function () {
        try {
            var ready = await waitForDataService(6000);
            if (!ready) {
                console.warn("[DATABASE] DataService tidak tersedia.");
                return;
            }

            var projects = await window.DataService.getProjects();

            // Filter berdasarkan akses perusahaan
            var accessibleProjects = (projects || []).filter(function (p) {
                return DB.canAccessDatabaseProject(p);
            });

            var hydratedProjects = await Promise.all(
                accessibleProjects.map(async function (project) {
                    var participants = [];

                    try {
                        if (
                            typeof window.DataService.getProjectParticipants ===
                            "function"
                        ) {
                            var relations =
                                await window.DataService.getProjectParticipants(
                                    project.id
                                );

                            participants = (relations || [])
                                .map(function (relation) {
                                    var participant = relation.participant || {};
                                    if (
                                        !participant ||
                                        !Object.keys(participant).length
                                    ) {
                                        return null;
                                    }

                                    var rawData = participant.raw_data || {};
                                    var merged = {
                                        ...rawData,
                                        ...participant
                                    };
                                    merged.status =
                                        participant.status ||
                                        relation.status ||
                                        relation.participant_status ||
                                        participant.assessment_status ||
                                        "Not Started";
                                    return merged;
                                })
                                .filter(Boolean);
                        } else if (
                            typeof window.DataService.getParticipantsByProject ===
                            "function"
                        ) {
                            var rawParticipants =
                                await window.DataService.getParticipantsByProject(
                                    project.id
                                );
                            participants = (rawParticipants || [])
                                .map(function (participant) {
                                    if (!participant) return null;
                                    var rawData = participant.raw_data || {};
                                    return { ...rawData, ...participant };
                                })
                                .filter(Boolean);
                        }
                    } catch (error) {
                        console.warn(
                            "[DATABASE] Gagal ambil peserta project:",
                            project.id,
                            error
                        );
                    }

                    return {
                        ...project,
                        participants: Array.isArray(participants)
                            ? participants
                            : []
                    };
                })
            );

            localStorage.setItem(
                DB.PROJECTS_KEY,
                JSON.stringify(hydratedProjects)
            );

            // Ratakan peserta
            var participantMap = new Map();

            hydratedProjects.forEach(function (project) {
                var projectPurpose =
                    project &&
                    (project.tujuanTes ||
                        project.purpose ||
                        project.type ||
                        "");

                (Array.isArray(project.participants)
                    ? project.participants
                    : []
                ).forEach(function (participant) {
                    if (!participant || typeof participant !== "object") return;

                    var participantId =
                        participant.id || participant.participantId || "";
                    var participantEmail =
                        participant.email || participant.emailAddress || "";

                    var key = participantId
                        ? "id:" + String(participantId)
                        : participantEmail
                        ? "email:" +
                          String(participantEmail).toLowerCase().trim()
                        : "";
                    if (!key) return;

                    participantMap.set(key, {
                        ...participant,
                        id: participantId,
                        participantId: participantId,
                        nama:
                            participant.nama || participant.name || "",
                        email: participantEmail,
                        perusahaan:
                            participant.perusahaan ||
                            participant.company ||
                            (project && project.company) ||
                            "-",
                        company:
                            participant.company ||
                            participant.perusahaan ||
                            (project && project.company) ||
                            "-",
                        pic:
                            participant.pic ||
                            participant.picProyek ||
                            (project && project.pic) ||
                            "-",
                        projectId: project && project.id ? project.id : "",
                        namaProject:
                            project && project.name ? project.name : "",
                        projectName:
                            project && project.name ? project.name : "",
                        tujuanTes:
                            participant.tujuanTes ||
                            participant.purpose ||
                            projectPurpose ||
                            "",
                        purpose:
                            participant.purpose ||
                            participant.tujuanTes ||
                            projectPurpose ||
                            "",
                        tanggal:
                            participant.tanggal ||
                            participant.assessmentDate ||
                            participant.assessment_date ||
                            (project && project.start) ||
                            "",
                        assessmentDate:
                            participant.assessmentDate ||
                            participant.assessment_date ||
                            (project && project.start) ||
                            ""
                    });
                });
            });

            localStorage.setItem(
                DB.STORAGE_KEY,
                JSON.stringify(Array.from(participantMap.values()))
            );

            console.log(
                "[DATABASE] Sinkron dari Supabase berhasil:",
                hydratedProjects.length,
                "project,",
                participantMap.size,
                "peserta"
            );
        } catch (error) {
            console.warn(
                "[DATABASE] Sinkron gagal, pakai localStorage:",
                error
            );
        }
    };

    console.log("[DB] Sync module initialized");
})();