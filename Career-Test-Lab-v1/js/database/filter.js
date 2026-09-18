/* ==========================================================
   DATABASE — COMPANY FILTER
   ----------------------------------------------------------
   Client/Asesor hanya melihat data perusahaan sendiri.
   Admin tetap bisa lihat semua.
========================================================== */

(function () {
    "use strict";

    window.DB = window.DB || {};

    function normalizeCompanyValue(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    }

    function getCurrentDatabaseRole() {
        return normalizeCompanyValue(
            DB.currentUserSession.role ||
                DB.currentUserSession.userRole ||
                DB.currentUserSession.roleName ||
                ""
        );
    }

    function isDatabaseAdmin() {
        var role = getCurrentDatabaseRole();
        return [
            "admin",
            "administrator",
            "system administrator",
            "super admin",
            "superadmin"
        ].includes(role);
    }

    function isCompanyRestrictedRole() {
        var role = getCurrentDatabaseRole();
        if (!role) return false;
        return (
            role.includes("client") ||
            role.includes("asesor") ||
            role.includes("assessor")
        );
    }

    function getCurrentUserCompany() {
        var candidates = [
            DB.currentUserSession.company,
            DB.currentUserSession.perusahaan,
            DB.currentUserSession.companyName,
            DB.currentUserSession.namaPerusahaan,
            DB.currentUserSession.organization,
            DB.currentUserSession.organisation,
            DB.currentUserSession.clientName,
            DB.currentUserSession.client,
            DB.currentUserSession.company_name,
            DB.currentUserSession.nama_perusahaan
        ];

        for (var i = 0; i < candidates.length; i++) {
            var normalized = normalizeCompanyValue(candidates[i]);
            if (normalized) return normalized;
        }
        return "";
    }

    function getProjectCompany(project) {
        if (!project || typeof project !== "object") return "";
        var candidates = [
            project.company,
            project.perusahaan,
            project.companyName,
            project.namaPerusahaan,
            project.organization,
            project.organisation,
            project.clientName,
            project.client,
            project.company_name,
            project.nama_perusahaan
        ];

        for (var i = 0; i < candidates.length; i++) {
            var normalized = normalizeCompanyValue(candidates[i]);
            if (normalized) return normalized;
        }
        return "";
    }

    function getParticipantCompany(participant) {
        if (!participant || typeof participant !== "object") return "";
        var rawData = DB.getRawData(participant);
        var candidates = [
            participant.company,
            participant.perusahaan,
            participant.companyName,
            participant.namaPerusahaan,
            participant.organization,
            participant.organisation,
            participant.clientName,
            participant.client,
            participant.company_name,
            participant.nama_perusahaan,
            rawData.company,
            rawData.perusahaan,
            rawData.companyName,
            rawData.namaPerusahaan,
            rawData.organization,
            rawData.organisation,
            rawData.clientName,
            rawData.client,
            rawData.company_name,
            rawData.nama_perusahaan
        ];

        for (var i = 0; i < candidates.length; i++) {
            var normalized = normalizeCompanyValue(candidates[i]);
            if (normalized) return normalized;
        }
        return "";
    }

    function canAccessProjectByDirectAssignment(project) {
        if (!project) return false;

        var sessionProjectId = String(
            DB.currentUserSession.projectId ||
                DB.currentUserSession.project_id ||
                ""
        ).trim();

        if (!sessionProjectId || sessionProjectId === "ALL") return false;

        var projectId = String(
            project.id || project.projectId || project.project_id || ""
        ).trim();

        if (sessionProjectId === projectId) return true;

        var assigned = Array.isArray(DB.currentUserSession.assignedProjects)
            ? DB.currentUserSession.assignedProjects
            : [];

        return assigned
            .map(function (v) {
                return String(v).trim();
            })
            .includes(projectId);
    }

    DB.canAccessDatabaseProject = function (project) {
        if (isDatabaseAdmin()) return true;
        if (!isCompanyRestrictedRole()) return true;
        if (canAccessProjectByDirectAssignment(project)) return true;

        var userCompany = getCurrentUserCompany();
        if (!userCompany) {
            console.warn(
                "[DATABASE ACCESS] Client/Asesor tanpa perusahaan & projectId."
            );
            return false;
        }

        var projectCompany = getProjectCompany(project);
        return projectCompany === userCompany;
    };

    DB.canAccessDatabaseParticipant = function (participant) {
        if (isDatabaseAdmin()) return true;
        if (!isCompanyRestrictedRole()) return true;

        var participantProjectId = String(
            (participant &&
                (participant.projectId || participant.project_id)) ||
                ""
        ).trim();

        if (
            participantProjectId &&
            canAccessProjectByDirectAssignment({ id: participantProjectId })
        ) {
            return true;
        }

        var userCompany = getCurrentUserCompany();
        if (!userCompany) return false;

        var participantCompany = getParticipantCompany(participant);
        return participantCompany === userCompany;
    };

    // Expose untuk dipakai modul lain
    DB.isDatabaseAdmin = isDatabaseAdmin;
    DB.isCompanyRestrictedRole = isCompanyRestrictedRole;
    DB.normalizeCompanyValue = normalizeCompanyValue;

    console.log("[DB] Filter module initialized");
})();