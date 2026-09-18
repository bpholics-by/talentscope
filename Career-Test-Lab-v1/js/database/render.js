/* ==========================================================
   DATABASE — RENDER TABLE & MODAL
========================================================== */

(function () {
    "use strict";

    window.DB = window.DB || {};

    // ==========================================================
    // HELPER: FORMAT DATE
    // ==========================================================
    function formatAssessmentDate(rawDate) {
        if (!rawDate) return "-";
        try {
            var d = new Date(rawDate);
            if (isNaN(d.getTime())) return String(rawDate);
            return d.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        } catch (e) {
            return String(rawDate);
        }
    }

    function formatNiceDate(isoStr) {
        if (!isoStr) return "-";
        try {
            var d = new Date(isoStr);
            if (isNaN(d.getTime())) return isoStr;
            return d.toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        } catch (e) {
            return isoStr;
        }
    }

    // ==========================================================
    // GET PROJECT CODE BY ID
    // ==========================================================
    function getProjectCodeById(projectIdValue) {
        if (!projectIdValue) return "";
        try {
            var projects = JSON.parse(
                localStorage.getItem(DB.PROJECTS_KEY) || "[]"
            );
            if (!Array.isArray(projects)) return "";

            var found = projects.find(function (proj) {
                return proj && String(proj.id) === String(projectIdValue);
            });
            if (found) {
                return (
                    found.projectCode ||
                    found.project_code ||
                    found.code ||
                    ""
                );
            }
        } catch (e) {
            console.warn("Gagal ambil kode project:", e);
        }
        return "";
    }

    // ==========================================================
    // LOAD PARTICIPANTS
    // ==========================================================
    DB.loadParticipantsFromLocalStorage = function (searchQuery) {
        searchQuery = searchQuery || "";

        var storedData = localStorage.getItem(DB.STORAGE_KEY);
        var parsedData = [];

        if (storedData) {
            try {
                parsedData = JSON.parse(storedData);
            } catch (e) {
                parsedData = [];
            }
        }

        parsedData = DB.hydrateParticipantPurposeFromProjects(parsedData);
        parsedData = DB.hydrateParticipantActivityFromProjects(parsedData);

        // Filter perusahaan
        parsedData = parsedData.filter(function (participant) {
            return DB.canAccessDatabaseParticipant(participant);
        });

        // Ambil daftar project untuk tanggal
        var projectListForDates = [];
        try {
            projectListForDates = JSON.parse(
                localStorage.getItem(DB.PROJECTS_KEY) || "[]"
            );
            if (!Array.isArray(projectListForDates)) projectListForDates = [];
        } catch (e) {
            projectListForDates = [];
        }

        function findProjectForDates(pid) {
            if (!pid) return null;
            return (
                projectListForDates.find(function (p) {
                    return (
                        String(p.id || p.projectId || p.project_id || "").trim() ===
                        String(pid).trim()
                    );
                }) || null
            );
        }

        DB.rawDatabaseParticipants = parsedData.map(function (item, index) {
            var projectId =
                item.projectId ||
                item.idProject ||
                item.project_id ||
                "P001";

            var relatedProject = findProjectForDates(projectId);

            var tanggalValue = DB.pickField(
                item,
                [
                    "tanggal",
                    "date",
                    "assessmentDate",
                    "assessment_date",
                    "tanggalAsesmen",
                    "tanggal_assessment"
                ],
                ""
            );

            if (!tanggalValue || tanggalValue === "-") {
                if (relatedProject) {
                    tanggalValue =
                        relatedProject.start_date ||
                        relatedProject.startDate ||
                        relatedProject.start ||
                        relatedProject.created_at ||
                        relatedProject.createdAt ||
                        "";
                }
            }

            return {
                ...item,
                id: item.id || index,
                nama: item.nama || item.fullName || item.name || "-",
                namaProject: item.namaProject || item.projectName || "-",
                projectId: projectId,
                projectCode:
                    getProjectCodeById(projectId) ||
                    item.projectCode ||
                    item.project_code ||
                    projectId,
                tanggal: tanggalValue ? formatAssessmentDate(tanggalValue) : "-",
                perusahaan: item.perusahaan || item.company || "-"
            };
        });

        var query = (searchQuery || "").toLowerCase().trim();
        var filteredData = DB.rawDatabaseParticipants.filter(function (item) {
            var nama = (item.nama || "").toLowerCase();
            var projectId = (item.projectId || "").toLowerCase();
            var projectCode = (item.projectCode || "").toLowerCase();
            var perusahaan = (item.perusahaan || "").toLowerCase();
            var namaProject = (item.namaProject || "").toLowerCase();

            return (
                nama.includes(query) ||
                projectId.includes(query) ||
                projectCode.includes(query) ||
                perusahaan.includes(query) ||
                namaProject.includes(query)
            );
        });

        DB.renderParticipantTable(filteredData);
    };

    // ==========================================================
    // RENDER TABLE
    // ==========================================================
    DB.renderParticipantTable = function (data) {
        var tbody = document.getElementById("participantTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!data || data.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="7" class="empty-state">' +
                '<i class="fa-solid fa-folder-open" style="font-size:28px;margin-bottom:8px;color:#cbd5e1;"></i><br>' +
                "Belum ada data peserta yang tersimpan.</td></tr>";
            return;
        }

        data.forEach(function (item) {
            var tr = document.createElement("tr");
            tr.innerHTML =
                '<td style="text-align:center;"><input type="checkbox" class="row-checkbox" value="' +
                item.id +
                '"></td>' +
                '<td class="participant-name">' +
                (item.nama || "-") +
                "</td>" +
                "<td>" +
                (item.namaProject || "-") +
                "</td>" +
                "<td><strong>" +
                (item.projectCode || item.projectId || "-") +
                "</strong></td>" +
                "<td>" +
                (item.tanggal || "-") +
                "</td>" +
                "<td>" +
                (item.perusahaan || "-") +
                "</td>" +
                '<td style="text-align:center;">' +
                '<div class="table-actions">' +
                '<button class="btn-icon-action btn-view" onclick="DB.openDetailModal(\'' +
                item.id +
                '\')"><i class="fa-solid fa-eye"></i> Detail</button>' +
                '<button class="btn-icon-action btn-edit" onclick="DB.openEditModal(\'' +
                item.id +
                '\')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>' +
                '<a href="participant-result.html?projectId=' +
                (item.projectId || "") +
                "&participantId=" +
                item.id +
                '" class="btn-icon-action btn-result"><i class="fa-solid fa-chart-simple"></i> Hasil</a>' +
                "</div></td>";
            tbody.appendChild(tr);
        });
    };

    // ==========================================================
    // OPEN DETAIL MODAL
    // ==========================================================
    DB.openDetailModal = function (participantId) {
        var p = DB.rawDatabaseParticipants.find(function (item) {
            return item.id == participantId;
        });
        if (!p) return;

        var projects = [];
        try {
            var primary = JSON.parse(
                localStorage.getItem(DB.PROJECTS_KEY) || "[]"
            );
            var legacy = JSON.parse(
                localStorage.getItem("projects") || "[]"
            );
            projects =
                Array.isArray(primary) && primary.length
                    ? primary
                    : Array.isArray(legacy)
                    ? legacy
                    : [];
        } catch (e) {
            projects = [];
        }

        var norm = function (value) {
            return String(value == null ? "" : value).trim().toLowerCase();
        };

        var projectId = p.projectId || p.idProject || p.projectID || "";
        var projectName = p.namaProject || p.projectName || p.project || "";
        var company = p.perusahaan || p.company || "";
        var participantIdValue =
            p.participantId || p.participantID || p.id || "";
        var email = p.email || p.emailUser || p.emailAddress || "";

        var matchedProject = null;

        if (projectId) {
            matchedProject =
                projects.find(function (proj) {
                    return (
                        norm(proj && (proj.id || proj.projectId || proj.projectID)) ===
                        norm(projectId)
                    );
                }) || null;
        }

        if (!matchedProject && projectName) {
            matchedProject =
                projects.find(function (proj) {
                    return (
                        norm(proj && (proj.name || proj.projectName || proj.project)) ===
                        norm(projectName)
                    );
                }) || null;
        }

        if (!matchedProject && (participantIdValue || email)) {
            matchedProject =
                projects.find(function (proj) {
                    var list = Array.isArray(proj && proj.participants)
                        ? proj.participants
                        : [];
                    return list.some(function (participant) {
                        var pid =
                            participant &&
                            (participant.id ||
                                participant.participantId ||
                                participant.participantID);
                        var pem =
                            participant &&
                            (participant.email || participant.emailAddress);
                        return (
                            (participantIdValue && norm(pid) === norm(participantIdValue)) ||
                            (email && norm(pem) === norm(email))
                        );
                    });
                }) || null;
        }

        if (!matchedProject && company) {
            matchedProject =
                projects.find(function (proj) {
                    return (
                        norm(
                            proj &&
                                (proj.company ||
                                    proj.perusahaan ||
                                    proj.organization ||
                                    proj.client ||
                                    proj.clientName)
                        ) === norm(company)
                    );
                }) || null;
        }

        function readPic(source) {
            if (!source) return "";
            var value =
                source.pic ||
                source.PIC ||
                source.picName ||
                source.picProyek ||
                source.admin ||
                source.adminName ||
                "";
            if (value && typeof value === "object") {
                return String(
                    value.name ||
                        value.fullName ||
                        value.nama ||
                        value.label ||
                        value.username ||
                        ""
                ).trim();
            }
            return String(value || "").trim();
        }

        var matchedProjectParticipant =
            (function () {
                var list = Array.isArray(matchedProject && matchedProject.participants)
                    ? matchedProject.participants
                    : [];
                return (
                    list.find(function (person) {
                        var pid =
                            person &&
                            (person.id ||
                                person.participantId ||
                                person.participantID);
                        var pem =
                            person && (person.email || person.emailAddress);
                        return (
                            (participantIdValue && norm(pid) === norm(participantIdValue)) ||
                            (email && norm(pem) === norm(email))
                        );
                    }) || null
                );
            })();

        var detailParticipant = matchedProjectParticipant
            ? { ...p, ...matchedProjectParticipant }
            : p;

        var picValue =
            readPic(matchedProject) || readPic(p) || "-";

        var invitationStatus =
            detailParticipant.invitationStatus ||
            detailParticipant.invitation_status ||
            (detailParticipant.access === "Invited" ? "Invited" : "") ||
            "Pending";

        var assessmentStatus =
            detailParticipant.assessmentStatus ||
            detailParticipant.statusAsesmen ||
            detailParticipant.assessment_status ||
            detailParticipant.status ||
            "Not Started";

        // Ambil activity history
        function getLatestActivityTime(history, keywords) {
            if (!Array.isArray(history)) return "";
            var matches = history.filter(function (h) {
                if (!h) return false;
                var text = String(
                    (h.type || "") +
                        " " +
                        (h.activity || "") +
                        " " +
                        (h.description || "")
                ).toLowerCase();
                return keywords.some(function (kw) {
                    return text.includes(kw.toLowerCase());
                });
            });
            if (matches.length === 0) return "";
            matches.sort(function (a, b) {
                return (
                    new Date(b.timestamp || b.time || 0) -
                    new Date(a.timestamp || a.time || 0)
                );
            });
            return matches[0].timestamp || matches[0].time || "";
        }

        var activityHistory =
            detailParticipant.activityHistory ||
            detailParticipant.activity_history ||
            [];

        var loginTimeFromHistory = getLatestActivityTime(activityHistory, [
            "login",
            "masuk ke",
            "page-enter",
            "online"
        ]);
        var logoutTimeFromHistory = getLatestActivityTime(activityHistory, [
            "logout",
            "keluar",
            "sesi berakhir",
            "offline",
            "tab-hidden"
        ]);

        var loginTime =
            loginTimeFromHistory ||
            detailParticipant.loginTime ||
            detailParticipant.loggedInAt ||
            detailParticipant.loginAt ||
            detailParticipant.lastLoginAt ||
            "";

        var logoutTime =
            logoutTimeFromHistory ||
            detailParticipant.logoutTime ||
            detailParticipant.loggedOutAt ||
            detailParticipant.logoutAt ||
            detailParticipant.lastLogoutAt ||
            "";

        var participantName =
            detailParticipant.nama || detailParticipant.name || "Tanpa Nama";
        var participantEmail =
            detailParticipant.email || detailParticipant.emailUser || "-";
        var participantPhone = DB.pickField(
            detailParticipant,
            ["telepon", "phone", "noTelepon", "no_telepon", "phoneNumber"],
            "-"
        );
        var participantEdu = DB.pickField(
            detailParticipant,
            ["pendidikan", "education", "education_level"],
            "-"
        );
        var participantCompany =
            detailParticipant.perusahaan || detailParticipant.company || "-";
        var participantPos =
            detailParticipant.posisi ||
            detailParticipant.position ||
            "Posisi belum diatur";
        var participantPurpose =
            detailParticipant.tujuanTes || detailParticipant.purpose || "-";
        var participantPass =
            detailParticipant.password ||
            detailParticipant.accessCode ||
            "-";

        // Build HTML (ringkas — pakai template string)
        var detailHtml = buildDetailModalHtml({
            participantName: participantName,
            participantPos: participantPos,
            participantCompany: participantCompany,
            participantEmail: participantEmail,
            participantPhone: participantPhone,
            participantEdu: participantEdu,
            picValue: picValue,
            participantPass: participantPass,
            invitationStatus: invitationStatus,
            assessmentStatus: assessmentStatus,
            loginTime: loginTime,
            logoutTime: logoutTime,
            detailParticipant: detailParticipant,
            formatNiceDate: formatNiceDate
        });

        var modalContent = document.getElementById("modalDetailContent");
        if (modalContent) modalContent.innerHTML = detailHtml;

        var detailModal = document.getElementById("detailModal");
        if (detailModal) detailModal.style.display = "flex";
    };

    // ==========================================================
    // BUILD DETAIL MODAL HTML (dipisah untuk clarity)
    // ==========================================================
    function buildDetailModalHtml(ctx) {
        var historyHtml = "• Belum ada riwayat aktivitas tercatat.";

        var history = ctx.detailParticipant.history || [];
        var activityHistory =
            ctx.detailParticipant.activityHistory ||
            ctx.detailParticipant.activity_history ||
            [];

        var sourceList =
            history.length > 0
                ? history
                : activityHistory.length > 0
                ? activityHistory
                : null;

        if (sourceList) {
            historyHtml = sourceList
                .map(function (h) {
                    if (typeof h === "object" && h !== null) {
                        var text =
                            h.description ||
                            h.activity ||
                            h.type ||
                            JSON.stringify(h);
                        var time =
                            h.timestamp || h.date || h.time || h.createdAt || "";
                        return (
                            "• " +
                            text +
                            (time ? " (" + ctx.formatNiceDate(time) + ")" : "")
                        );
                    }
                    return "• " + h;
                })
                .join("<br>");
        }

        return (
            '<div style="font-family:inherit;color:#1e293b;padding:4px;">' +
            '<div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;padding:20px;border-radius:12px;display:flex;align-items:center;gap:16px;margin-bottom:20px;box-shadow:0 4px 12px rgba(59,130,246,0.2);">' +
            '<div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;border:2px solid rgba(255,255,255,0.4);">' +
            ctx.participantName.charAt(0).toUpperCase() +
            "</div>" +
            '<div><h2 style="margin:0;font-size:20px;font-weight:700;color:white;">' +
            ctx.participantName +
            "</h2>" +
            '<p style="margin:4px 0 0 0;font-size:13px;opacity:0.9;"><i class="fa-solid fa-briefcase"></i> ' +
            ctx.participantPos +
            ' &bull; <i class="fa-solid fa-building"></i> ' +
            ctx.participantCompany +
            "</p></div></div>" +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">' +
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">' +
            '<h4 style="margin:0 0 10px 0;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#3b82f6;font-weight:600;"><i class="fa-solid fa-user-shield"></i> Informasi Personal</h4>' +
            buildInfoRow("Email / Username", ctx.participantEmail) +
            buildInfoRow("No. Telepon", ctx.participantPhone) +
            buildInfoRow("Pendidikan", ctx.participantEdu) +
            buildInfoRow(
                "Perusahaan & PIC",
                ctx.participantCompany + " (PIC: " + ctx.picValue + ")"
            ) +
            buildInfoRow(
                "Password / Kode Akses",
                '<span style="font-family:monospace;background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#334155;">' +
                    ctx.participantPass +
                    "</span>"
            ) +
            "</div>" +
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">' +
            '<h4 style="margin:0 0 10px 0;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#10b981;font-weight:600;"><i class="fa-solid fa-clipboard-list"></i> Status & Sesi Asesmen</h4>' +
            '<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-size:11px;color:#64748b;font-weight:500;">Status Invitation</span>' +
            '<span class="status-badge ' +
            (/^(Accepted|Invited)$/i.test(ctx.invitationStatus)
                ? "success"
                : "pending") +
            '" style="font-size:11px;">' +
            ctx.invitationStatus +
            "</span></div>" +
            '<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-size:11px;color:#64748b;font-weight:500;">Status Asesmen</span>' +
            '<span class="status-badge ' +
            (/^(Selesai|Completed|Complete)$/i.test(ctx.assessmentStatus)
                ? "success"
                : "pending") +
            '" style="font-size:11px;">' +
            ctx.assessmentStatus +
            "</span></div>" +
            buildInfoRow(
                "Waktu Login",
                '<i class="fa-regular fa-clock" style="color:#3b82f6;"></i> ' +
                    ctx.formatNiceDate(ctx.loginTime)
            ) +
            buildInfoRow(
                "Waktu Logout",
                '<i class="fa-regular fa-clock" style="color:#ef4444;"></i> ' +
                    ctx.formatNiceDate(ctx.logoutTime)
            ) +
            "</div></div>" +
            '<div style="background:#0f172a;border-radius:10px;padding:16px;color:#e2e8f0;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;border-bottom:1px solid #1e293b;padding-bottom:8px;">' +
            '<span style="font-size:13px;font-weight:600;color:#38bdf8;"><i class="fa-solid fa-terminal"></i> History Asesmen & Activity Log</span>' +
            '<span style="font-size:10px;background:#1e293b;padding:2px 6px;border-radius:4px;color:#94a3b8;">Realtime Log</span>' +
            "</div>" +
            '<div class="hide-scroll" style="font-family:monospace;font-size:11.5px;line-height:1.6;max-height:120px;overflow-y:auto;color:#cbd5e1;">' +
            historyHtml +
            "</div></div></div>"
        );
    }

    function buildInfoRow(label, value) {
        return (
            '<div style="margin-bottom:8px;">' +
            '<span style="display:block;font-size:11px;color:#64748b;font-weight:500;">' +
            label +
            "</span>" +
            '<span style="font-size:13px;font-weight:600;color:#0f172a;">' +
            value +
            "</span></div>"
        );
    }

    // ==========================================================
    // OPEN EDIT MODAL
    // ==========================================================
    DB.openEditModal = function (id) {
        if (
            typeof RolePermissions !== "undefined" &&
            RolePermissions.blockIfViewOnly("mengedit data peserta")
        ) {
            return;
        }

        var participant = DB.rawDatabaseParticipants.find(function (item) {
            var itemId =
                item.id || item.participantId || item.employeeId || "";
            return String(itemId) === String(id);
        });

        if (!participant) {
            alert("Data peserta tidak ditemukan.");
            return;
        }

        if (typeof DB.closeModal === "function") {
            DB.closeModal("detailModal");
        }

        function setSafeVal(elementId, value) {
            var el = document.getElementById(elementId);
            if (el) el.value = value || "";
        }

        setSafeVal("editRowId", participant.id || id);
        setSafeVal(
            "editProjectId",
            participant.projectId || participant.idProject || ""
        );
        setSafeVal(
            "editName",
            participant.name || participant.fullName || ""
        );
        setSafeVal(
            "editEmail",
            participant.email || participant.username || ""
        );
        setSafeVal(
            "editPassword",
            participant.password || participant.accessCode || ""
        );
        setSafeVal(
            "editEducation",
            DB.pickField(participant, ["education", "pendidikan"], "")
        );
        setSafeVal(
            "editPosition",
            participant.position || participant.jobTitle || ""
        );
        setSafeVal(
            "editPhone",
            DB.pickField(
                participant,
                ["phone", "phoneNumber", "telepon"],
                ""
            )
        );
        setSafeVal(
            "editAssessmentDate",
            DB.pickField(
                participant,
                ["assessmentDate", "assessment_date", "tanggal", "date"],
                ""
            )
        );
        setSafeVal(
            "editAssessmentStatus",
            participant.assessmentStatus || participant.status || "Not Started"
        );

        var editModal = document.getElementById("editParticipantModal");
        if (editModal) editModal.style.display = "flex";
    };

    // ==========================================================
    // CLOSE MODAL
    // ==========================================================
    DB.closeModal = function (modalId) {
        var modal = document.getElementById(modalId);
        if (modal) modal.style.display = "none";
    };

    // ==========================================================
    // SAVE PARTICIPANT DETAIL
    // ==========================================================
    DB.saveParticipantDetail = function (event) {
        event.preventDefault();

        if (
            typeof RolePermissions !== "undefined" &&
            RolePermissions.blockIfViewOnly("menyimpan perubahan data peserta")
        ) {
            return;
        }

        function getVal(elementId) {
            var el = document.getElementById(elementId);
            return el ? el.value.trim() : "";
        }

        var rowId = getVal("editRowId");

        if (!rowId) {
            alert("ID peserta tidak ditemukan, gagal menyimpan.");
            return;
        }

        var index = DB.rawDatabaseParticipants.findIndex(function (item) {
            return String(item.id) === String(rowId);
        });

        if (index === -1) {
            alert("Data peserta tidak ditemukan, gagal menyimpan.");
            return;
        }

        var updated = {
            ...DB.rawDatabaseParticipants[index],
            name: getVal("editName"),
            nama: getVal("editName"),
            email: getVal("editEmail"),
            username: getVal("editEmail"),
            password: getVal("editPassword"),
            accessCode: getVal("editPassword"),
            education: getVal("editEducation"),
            pendidikan: getVal("editEducation"),
            position: getVal("editPosition"),
            posisi: getVal("editPosition"),
            phone: getVal("editPhone"),
            telepon: getVal("editPhone"),
            assessmentDate: getVal("editAssessmentDate"),
            tanggal: getVal("editAssessmentDate"),
            assessmentStatus: getVal("editAssessmentStatus"),
            status: getVal("editAssessmentStatus")
        };

        DB.rawDatabaseParticipants[index] = updated;

        try {
            localStorage.setItem(
                DB.STORAGE_KEY,
                JSON.stringify(DB.rawDatabaseParticipants)
            );
        } catch (e) {
            console.warn("Gagal menyimpan perubahan peserta:", e);
            alert("Gagal menyimpan perubahan. Coba lagi.");
            return;
        }

        DB.closeModal("editParticipantModal");

        var searchInput = document.getElementById("globalSearchInput");
        DB.loadParticipantsFromLocalStorage(
            searchInput ? searchInput.value : ""
        );

        alert("Perubahan berhasil disimpan.");
    };

    // ==========================================================
    // SELECT ALL / REMOVE
    // ==========================================================
    DB.handleSelectAllChange = function (mainCheckbox) {
        document
            .querySelectorAll(".row-checkbox")
            .forEach(function (cb) {
                cb.checked = mainCheckbox.checked;
            });
    };

    DB.toggleSelectAll = function () {
        var mainCb = document.getElementById("selectAllCheckbox");
        if (mainCb) {
            mainCb.checked = !mainCb.checked;
            DB.handleSelectAllChange(mainCb);
        }
    };

    DB.removeSelected = function () {
        if (
            typeof RolePermissions !== "undefined" &&
            RolePermissions.blockIfViewOnly("menghapus data peserta")
        ) {
            return;
        }

        var selectedBoxes = document.querySelectorAll(".row-checkbox:checked");
        if (selectedBoxes.length === 0) {
            alert("Pilih setidaknya satu peserta untuk dihapus.");
            return;
        }

        if (
            confirm(
                "Apakah Anda yakin ingin menghapus " +
                    selectedBoxes.length +
                    " data?"
            )
        ) {
            var idsToDelete = Array.from(selectedBoxes).map(function (cb) {
                return cb.value;
            });

            DB.rawDatabaseParticipants = DB.rawDatabaseParticipants.filter(
                function (item) {
                    return !idsToDelete.includes(item.id);
                }
            );
            localStorage.setItem(
                DB.STORAGE_KEY,
                JSON.stringify(DB.rawDatabaseParticipants)
            );

            DB.loadParticipantsFromLocalStorage();

            var mainCb = document.getElementById("selectAllCheckbox");
            if (mainCb) mainCb.checked = false;
        }
    };

    console.log("[DB] Render module initialized");
})();