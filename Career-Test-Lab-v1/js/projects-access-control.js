/* ==========================================================
   TalentScope Enterprise
   Project Access / Role Control
   - System Administrator & Administrator: full project access
   - Client: only assigned/owned projects
   - Asesor: only assigned projects
   - Peserta: no access to Projects page
   - Generate Credentials: disabled for Client & Asesor
========================================================== */

(function () {
    "use strict";

    const PROFILE_KEY = "talentscope_settings_profile";

    function readJson(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function readJsonFromSession(key, fallback = null) {
        try {
            const raw = sessionStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function normalizeRole(role) {
        const value = String(role || "").trim().toLowerCase();

        if (
            value === "system administrator" ||
            value === "super admin" ||
            value === "super administrator" ||
            value === "system admin"
        ) {
            return "system-administrator";
        }

        if (value === "administrator" || value === "admin") {
            return "administrator";
        }

        if (
            value === "client" ||
            value === "client user" ||
            value === "client administrator"
        ) {
            return "client";
        }

        if (value === "asesor" || value === "assessor") {
            return "asesor";
        }

        if (value === "peserta" || value === "participant") {
            return "peserta";
        }

        return value;
    }

    function getCurrentUser() {
        const candidates = [
            window.currentUser,
            window.loggedInUser,
            window.authUser,
            window.currentAccount,
            window.talentscopeCurrentUser,

            readJsonFromSession("ts_admin_session"),
            readJsonFromSession("ts_participant_session"),
            readJson("talentscope_current_user"),
            readJson("talentscope_logged_in_user"),
            readJson("talentscope_auth_user"),
            readJson("talentscope_current_account"),
            readJson("currentUser"),
            readJson("loggedInUser"),
            readJson("authUser")
        ];

        let user = candidates.find(
            item => item && typeof item === "object"
        );

        /*
         * Demo fallback:
         * halaman lama Settings menggunakan profile ini
         * sebagai account administrator utama.
         */
        if (!user) {
            user = readJson(PROFILE_KEY, {
                name: "Administrator",
                username: "admin",
                email: "admin@talentscope.com",
                role: "System Administrator"
            });
        }

        return {
            ...user,
            id: user.id || user.userId || "",
            name: user.name || user.fullName || user.displayName || "",
            username: user.username || user.userName || user.login || "",
            email: user.email || "",
            role: user.role || user.roleName || user.accountRole || ""
        };
    }

    function getAccess() {
        const user = getCurrentUser();
        const role = normalizeRole(user.role);

        return {
            user,
            role,
            isSystemAdministrator: role === "system-administrator",
            isAdministrator: role === "administrator",
            isClient: role === "client",
            isAsesor: role === "asesor",
            isPeserta: role === "peserta",
            canManage:
                role === "system-administrator" ||
                role === "administrator",
            canGenerate:
                role === "system-administrator" ||
                role === "administrator"
        };
    }

    function normalize(value) {
        return String(value ?? "")
            .trim()
            .toLowerCase();
    }

    function accountIdentifiers(user) {
        return [
            user.id,
            user.username,
            user.email,
            user.name
        ]
            .filter(Boolean)
            .map(normalize);
    }

    function projectClientValues(project) {
        const access = project?.access || {};
        const pic = project?.pic || {};

        return [
            project.clientId,
            project.clientUserId,
            project.clientUsername,
            project.clientEmail,
            project.clientUser,
            project.client,
            project.clientName,
            project.company,
            project.organization,
            project.companyName,

            /*
             * Ini penting untuk project credential:
             * username yang dibuat melalui Project Access
             * menjadi relasi langsung antara account Client
             * dan project.
             */
            access.ownerId,
            access.ownerUsername,
            access.ownerEmail,
            access.clientId,
            access.clientUsername,
            access.username,

            pic.clientId,
            pic.clientUsername,
            pic.clientEmail
        ]
            .filter(Boolean)
            .map(normalize);
    }

    function projectAssessorValues(project) {
        const pic = project?.pic || {};

        return [
            project.asesorId,
            project.assessorId,
            project.asesorUsername,
            project.assessorUsername,
            project.asesorEmail,
            project.assessorEmail,
            project.asesor,
            project.assessor,
            project.assignedAssessor,
            project.assignedAssessorId,
            project.assignedAssessorUsername,
            project.assignedToAssessor,

            pic.asesorId,
            pic.assessorId,
            pic.asesorUsername,
            pic.assessorUsername,
            pic.asesorEmail,
            pic.assessorEmail
        ]
            .filter(Boolean)
            .map(normalize);
    }

    function belongsToCurrentAccount(project, access) {
        const ids = accountIdentifiers(access.user);

        if (!ids.length) {
            return false;
        }

        if (access.isClient) {
            const projectAccessUsername =
                normalize(project?.access?.username);

            if (
                projectAccessUsername &&
                ids.includes(projectAccessUsername)
            ) {
                return true;
            }

            return projectClientValues(project).some(
                value => ids.includes(value)
            );
        }

        if (access.isAsesor) {
            return projectAssessorValues(project).some(
                value => ids.includes(value)
            );
        }

        return true;
    }

    function visibleProjects(data) {
        const access = getAccess();

        if (access.canManage) {
            return Array.isArray(data) ? data : [];
        }

        if (access.isClient || access.isAsesor) {
            return (Array.isArray(data) ? data : []).filter(
                project => belongsToCurrentAccount(project, access)
            );
        }

        return [];
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[character]
        );
    }

    function renderRoleMessage(access) {
        if (access.isClient) {
            return "Tidak ada project yang ditugaskan ke akun Client ini.";
        }

        if (access.isAsesor) {
            return "Tidak ada project yang ditugaskan ke asesor ini.";
        }

        if (access.isPeserta) {
            return "Halaman Project tidak tersedia untuk account Peserta.";
        }

        return "No projects found.";
    }

    function installRenderOverride() {
        if (typeof window.renderProjects !== "function") {
            return;
        }

        const originalRenderProjects =
            window.renderProjects;

        window.renderProjects = function (data) {
            const access = getAccess();
            const filtered = visibleProjects(data);

            if (filtered.length || access.canManage) {
                originalRenderProjects(filtered);
                return;
            }

            const table =
                document.getElementById("projectTable");

            if (!table) return;

            table.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        style="
                            text-align:center;
                            padding:40px;
                            color:#7182a3;
                        "
                    >
                        ${escapeHtml(renderRoleMessage(access))}
                    </td>
                </tr>
            `;
        };

        /*
         * projects-render.js already registers DOMContentLoaded
         * and calls renderProjects(). Karena fungsi sudah
         * dioverride sebelum DOMContentLoaded, filter berlaku
         * tanpa mengubah data asli localStorage.
         */
    }

    function installProjectEditGuard() {
        if (typeof window.openProjectEdit !== "function") {
            return;
        }

        const original =
            window.openProjectEdit;

        window.openProjectEdit = function (projectId) {
            if (!getAccess().canManage) {
                alert(
                    "Anda tidak memiliki izin untuk mengubah project."
                );
                return;
            }

            return original(projectId);
        };
    }

    function installGenerateGuard() {
        if (typeof window.generateProjectAccess !== "function") {
            return;
        }

        const original =
            window.generateProjectAccess;

        window.generateProjectAccess = function (projectId) {
            if (!getAccess().canGenerate) {
                alert(
                    "Generate Username & Password hanya dapat dilakukan oleh Administrator."
                );
                return;
            }

            return original(projectId);
        };
    }

    function installRoleUI() {
        const access = getAccess();

        document.documentElement.dataset.projectRole =
            access.role || "unknown";

        const removeButton =
            document.getElementById(
                "removeSelectedProjects"
            );

        const selectAll =
            document.getElementById(
                "selectAllProjects"
            );

        if (!access.canManage) {
            if (removeButton) {
                removeButton.disabled = true;
                removeButton.hidden = true;
            }

            if (selectAll) {
                selectAll.disabled = true;
                selectAll.hidden = true;
            }
        }

        /*
         * Project modal create/edit tetap dimiliki oleh
         * administrator. Client dan Asesor tidak boleh
         * memakai modal tersebut.
         */
        if (!access.canManage) {
            const modal =
                document.getElementById(
                    "projectModal"
                );

            if (modal) {
                modal.setAttribute(
                    "aria-hidden",
                    "true"
                );
            }

            /*
             * Jika layout-loader membuat tombol Create Project,
             * sembunyikan tombol berdasarkan teks/title.
             */
            document
                .querySelectorAll(
                    "button, a"
                )
                .forEach(element => {
                    const text =
                        normalize(
                            element.textContent
                        );

                    const title =
                        normalize(
                            element.getAttribute("title")
                        );

                    const label =
                        text + " " + title;

                    if (
                        label.includes("create project") ||
                        label.includes("add project") ||
                        label.includes("new project")
                    ) {
                        element.hidden = true;
                    }
                });
        }
    }

    function updateVisibleStats() {
        const access = getAccess();

        let projects = [];

        try {
            projects =
                JSON.parse(
                    localStorage.getItem("talentscope_projects") || "[]"
                );

            if (!Array.isArray(projects)) {
                projects = [];
            }
        } catch (error) {
            projects = [];
        }

        projects = visibleProjects(projects);

        const total =
            document.getElementById("totalProjects");

        const running =
            document.getElementById("runningProjects");

        const completed =
            document.getElementById("completedProjects");

        const clients =
            document.getElementById("totalClients");

        if (total) {
            total.textContent = projects.length;
        }

        if (running) {
            running.textContent =
                projects.filter(project =>
                    ["scheduled", "ongoing", "running"]
                        .includes(
                            normalize(project.status)
                        )
                ).length;
        }

        if (completed) {
            completed.textContent =
                projects.filter(project =>
                    normalize(project.status) === "completed"
                ).length;
        }

        if (clients) {
            clients.textContent =
                new Set(
                    projects
                        .map(project =>
                            normalize(
                                project.company ||
                                project.organization
                            )
                        )
                        .filter(Boolean)
                ).size;
        }

        /*
         * Peserta tidak menggunakan halaman Projects.
         * Ini hanya menjaga UI agar tidak menampilkan
         * angka project dari semua account.
         */
        if (access.isPeserta) {
            [total, running, completed, clients]
                .filter(Boolean)
                .forEach(element => {
                    element.textContent = "0";
                });
        }
    }

    function applyTableActionUI() {
        const access = getAccess();

        document
            .querySelectorAll("#projectTable tr")
            .forEach(row => {
                const editButton =
                    Array.from(
                        row.querySelectorAll("button")
                    ).find(button =>
                        normalize(
                            button.getAttribute("title")
                        ) === "edit"
                    );

                const exportButton =
                    Array.from(
                        row.querySelectorAll("button")
                    ).find(button =>
                        normalize(
                            button.getAttribute("title")
                        ) === "export"
                    );

                const generateButton =
                    Array.from(
                        row.querySelectorAll("button")
                    ).find(button =>
                        normalize(
                            button.getAttribute("title")
                        ).includes("generate username")
                    );

                const checkbox =
                    row.querySelector(
                        ".project-checkbox"
                    );

                if (!access.canManage) {
                    if (editButton) {
                        editButton.hidden = true;
                    }

                    if (exportButton) {
                        exportButton.hidden = true;
                    }

                    if (checkbox) {
                        checkbox.hidden = true;
                        checkbox.disabled = true;
                    }

                    if (generateButton) {
                        generateButton.disabled = true;
                        generateButton.setAttribute(
                            "aria-disabled",
                            "true"
                        );
                        generateButton.title =
                            "Generate Username & Password hanya untuk Administrator";
                    }
                }
            });
    }

    function installDisabledCredentialStyle() {
        if (
            document.getElementById(
                "projectAccessRoleControlStyle"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "projectAccessRoleControlStyle";

        style.textContent = `
            .table-actions button:disabled,
            .table-actions button[aria-disabled="true"] {
                opacity: .45;
                cursor: not-allowed;
                pointer-events: none;
            }

            #removeSelectedProjects[hidden],
            #selectAllProjects[hidden] {
                display: none !important;
            }
        `;

        document.head.appendChild(style);
    }

    /*
     * Expose helper untuk halaman lain yang akan memakai
     * rule role yang sama.
     */
    window.TalentScopeProjectAccess = {
        getAccess,
        visibleProjects,
        belongsToCurrentAccount
    };

    /*
     * projects-render.js sudah diload lebih dulu pada projects.html,
     * sehingga override aman dilakukan segera sebelum DOM siap.
     */
    installRenderOverride();
    installProjectEditGuard();
    installGenerateGuard();

    document.addEventListener(
        "DOMContentLoaded",
        function () {
            installRoleUI();
            installDisabledCredentialStyle();
            applyTableActionUI();
            updateVisibleStats();
        }
    );

})();
