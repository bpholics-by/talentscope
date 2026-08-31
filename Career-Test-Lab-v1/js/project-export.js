/* ==========================================================
   TalentScope Enterprise
   PROJECT EXPORT - EXCEL
   Export PER PROJECT dari localStorage: talentscope_projects
   ========================================================== */

(function () {
    "use strict";

    const STORAGE_KEY = "talentscope_projects";

    function projects() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const data = raw ? JSON.parse(raw) : [];
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error("Project Export: gagal membaca storage.", e);
            return [];
        }
    }

    function first() {
        for (let i = 0; i < arguments.length; i++) {
            const v = arguments[i];
            if (v !== undefined && v !== null && String(v).trim() !== "") {
                return v;
            }
        }
        return "";
    }

    function projectById(id) {
        return projects().find(function (p) {
            return String(first(p?.id, p?.projectId, p?.projectID, "")) === String(id);
        }) || null;
    }

    function projectName(p) {
        return first(p?.projectName, p?.name, p?.project, p?.title, "-");
    }

    function projectId(p) {
        return first(p?.id, p?.projectId, p?.projectID, "-");
    }

    function client(p) {
        return first(
            p?.clientName,
            p?.client,
            p?.company,
            p?.organization,
            p?.companyName,
            "-"
        );
    }

    function pic(p) {
        if (p?.pic && typeof p.pic === "object") {
            return first(
                p.pic.name,
                p.pic.fullName,
                p.pic.full_name,
                p.picName,
                "-"
            );
        }

        return first(p?.pic, p?.PIC, p?.picName, "-");
    }

    function assessmentDate(p) {
        return first(p?.assessmentDate, p?.startDate, p?.start, "-");
    }

    function participants(p) {
        return Array.isArray(p?.participants) ? p.participants : [];
    }

    function participantId(p) {
        return first(
            p?.testId,
            p?.testID,
            p?.test_id,
            p?.participantId,
            p?.participantID,
            p?.employeeId,
            p?.employeeID,
            p?.id,
            "-"
        );
    }

    function participantName(p) {
        return first(
            p?.name,
            p?.fullName,
            p?.full_name,
            p?.participantName,
            p?.nama,
            "-"
        );
    }

    function education(p) {
        return first(
            p?.education,
            p?.pendidikan,
            p?.educationLevel,
            p?.education_level,
            p?.degree,
            "-"
        );
    }

    function email(p) {
        return first(p?.email, p?.emailAddress, "-");
    }

    function phone(p) {
        return first(
            p?.phone,
            p?.phoneNumber,
            p?.mobile,
            p?.mobilePhone,
            p?.telephone,
            p?.telepon,
            p?.hp,
            p?.noTelepon,
            p?.noTeleponHp,
            p?.nomorTelepon,
            "-"
        );
    }

    function position(p) {
        return first(p?.position, p?.jobPosition, p?.jabatan, "-");
    }

    function purpose(p, project) {
        return first(
            p?.assessmentPurpose,
            p?.assessment_purpose,
            p?.purpose,
            p?.assessmentObjective,
            p?.assessment_objective,
            p?.objective,
            project?.assessmentPurpose,
            project?.assessment_purpose,
            project?.purpose,
            project?.assessmentObjective,
            project?.assessment_objective,
            project?.objective,
            project?.type,
            "-"
        );
    }

    function invitationStatus(p) {
        return first(
            p?.invitationStatus,
            p?.statusInvitation,
            p?.invitation,
            p?.inviteStatus,
            p?.accessStatus,
            p?.access,
            "Not Invited"
        );
    }

    function login(p) {
        return first(
            p?.loginTime,
            p?.loggedInAt,
            p?.loginAt,
            p?.timeLogin,
            p?.lastLogin,
            "-"
        );
    }

    function logout(p) {
        return first(
            p?.logoutTime,
            p?.loggedOutAt,
            p?.logoutAt,
            p?.timeLogout,
            p?.lastLogout,
            "-"
        );
    }

    function assessmentStatus(p) {
        return first(
            p?.assessmentStatus,
            p?.assessment_status,
            p?.testStatus,
            p?.test_status,
            p?.status,
            "Not Started"
        );
    }

    function activityHistory(p) {
        const history =
            p?.activityHistory ||
            p?.activityLog ||
            p?.activities ||
            p?.history ||
            [];

        if (!Array.isArray(history) || history.length === 0) {
            return "-";
        }

        return history
            .filter(item => item && typeof item === "object")
            .map(item => {
                const activity =
                    first(
                        item?.activity,
                        item?.title,
                        item?.action,
                        item?.test,
                        item?.name,
                        "Aktivitas"
                    );

                const description =
                    first(
                        item?.description,
                        item?.detail,
                        item?.message,
                        ""
                    );

                const time =
                    first(
                        item?.timestamp,
                        item?.time,
                        item?.createdAt,
                        item?.date,
                        ""
                    );

                const formattedTime =
                    time ? dateTime(time) : "";

                return [
                    formattedTime && formattedTime !== "-" ? formattedTime : "",
                    activity,
                    description
                ]
                .filter(Boolean)
                .join(" - ");
            })
            .filter(Boolean)
            .join("\n") || "-";
    }

    function dateTime(value) {
        if (value === undefined || value === null || String(value).trim() === "") {
            return "-";
        }

        const raw = String(value).trim();
        if (raw === "-") return "-";

        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return raw;

        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        return (
            String(d.getDate()).padStart(2, "0") + " " +
            months[d.getMonth()] + " " +
            d.getFullYear() + ", " +
            String(d.getHours()).padStart(2, "0") + ":" +
            String(d.getMinutes()).padStart(2, "0") + ":" +
            String(d.getSeconds()).padStart(2, "0")
        );
    }

    function dateOnly(value) {
        if (value === undefined || value === null || String(value).trim() === "") {
            return "-";
        }

        const raw = String(value).trim();
        const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw + "T00:00:00" : raw);

        if (Number.isNaN(d.getTime())) return raw;

        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        return (
            String(d.getDate()).padStart(2, "0") + " " +
            months[d.getMonth()] + " " +
            d.getFullYear()
        );
    }

    function filePart(value) {
        return String(value || "Project")
            .trim()
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
            .replace(/\s+/g, "_")
            .slice(0, 100) || "Project";
    }

    window.exportProjectToExcel = function (id) {
        if (typeof XLSX === "undefined") {
            alert(
                "Library Excel belum tersedia. Pastikan projects.html " +
                "memuat xlsx.full.min.js."
            );
            return;
        }

        const project = projectById(id);

        if (!project) {
            alert("Project tidak ditemukan.");
            return;
        }

        const rows = [
            ["Nama Project", String(projectName(project))],
            ["ID Project", String(projectId(project))],
            ["Nama Klien/Perusahaan", String(client(project))],
            ["PIC", String(pic(project))],
            ["Tanggal Asesmen", String(dateOnly(assessmentDate(project)))],
            [],
            [
                "No",
                "No Tes/ID",
                "Nama Peserta",
                "Pendidikan",
                "Email",
                "No Telepon",
                "Posisi",
                "Tujuan Asesmen",
                "Status Invitation",
                "Waktu Login",
                "Waktu Log Out",
                "Status Asesmen",
                "History Activity"
            ]
        ];

        participants(project).forEach(function (p, index) {
            rows.push([
                index + 1,
                String(participantId(p)),
                String(participantName(p)),
                String(education(p)),
                String(email(p)),
                String(phone(p)),
                String(position(p)),
                String(purpose(p, project)),
                String(invitationStatus(p)),
                String(dateTime(login(p))),
                String(dateTime(logout(p))),
                String(assessmentStatus(p)),
                String(activityHistory(p))
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);

        ws["!cols"] = [
            { wch: 6 },
            { wch: 18 },
            { wch: 26 },
            { wch: 28 },
            { wch: 32 },
            { wch: 20 },
            { wch: 22 },
            { wch: 28 },
            { wch: 20 },
            { wch: 24 },
            { wch: 24 },
            { wch: 20 },
            { wch: 60 }
        ];

        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            wb,
            ws,
            "Export Project"
        );

        XLSX.writeFile(
            wb,
            "TalentScope_" +
            filePart(projectName(project)) +
            "_" +
            filePart(projectId(project)) +
            ".xlsx"
        );
    };

})();
