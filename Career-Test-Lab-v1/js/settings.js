/* ==========================================================
   TALENTSCOPE SETTINGS CENTER
   Role & Permission Management
   Local Demo Storage
========================================================== */

(function(){
    "use strict";


    /* ==========================================================
       STORAGE
    ========================================================== */

    const USER_KEY = "talentscope_settings_users";
    const ROLE_KEY = "talentscope_settings_roles";
    const PROFILE_KEY = "talentscope_settings_profile";


    /* ==========================================================
       CURRENT SYSTEM PERMISSIONS
    ========================================================== */

    const permissions = [
        ["dashboard", "Dashboard"],
        ["assessment_catalog", "Assessment Catalog"],
        ["assessment_project", "Assessment Project"],
        ["assessment_detail", "Assessment Detail"],
        ["participants", "Participants"],
        ["results", "Results"],
        ["project_access", "Project Access"],
        ["test_bank", "Test Bank"],
        ["settings", "Settings"],
        ["my_assessment", "My Assessment"]
    ];


    /* ==========================================================
       ROLE CONFIGURATION
    ========================================================== */

    const SYSTEM_ROLE_IDS = [
        "ROLE-SYSTEM",
        "ROLE-ADMIN",
        "ROLE-CLIENT",
        "ROLE-ASESOR",
        "ROLE-PESERTA"
    ];

    const LOCKED_ROLE_IDS = [
        "ROLE-SYSTEM",
        "ROLE-ADMIN"
    ];


    /* ==========================================================
       DEFAULT PROFILE
    ========================================================== */

    const defaultProfile = {
        name: "Administrator",
        username: "admin",
        email: "admin@talentscope.com",
        role: "System Administrator"
    };


    /* ==========================================================
       DEFAULT ROLES
    ========================================================== */

    const defaultRoles = [

        /* ------------------------------------------------------
           SYSTEM ADMINISTRATOR
           View Only
        ------------------------------------------------------ */

        {
            id: "ROLE-SYSTEM",
            name: "System Administrator",
            description: "Full access to all TalentScope modules and system settings.",
            locked: true,
            permissions: permissions.map(item => item[0])
        },


        /* ------------------------------------------------------
           ADMINISTRATOR
           View Only
        ------------------------------------------------------ */

        {
            id: "ROLE-ADMIN",
            name: "Administrator",
            description: "Manage assessments, projects, participants and results.",
            locked: true,
            permissions: [
                "dashboard",
                "assessment_catalog",
                "assessment_project",
                "assessment_detail",
                "participants",
                "results",
                "project_access",
                "test_bank"
            ]
        },


        /* ------------------------------------------------------
           CLIENT
           EDITABLE BY SYSTEM ADMINISTRATOR
        ------------------------------------------------------ */

        {
            id: "ROLE-CLIENT",
            name: "Client",
            description: "Manage assigned projects, participants, assessments and results.",
            locked: false,
            permissions: [
                "dashboard",
                "assessment_project",
                "assessment_detail",
                "participants",
                "results",
                "project_access"
            ]
        },


        /* ------------------------------------------------------
           ASESOR
           EDITABLE BY SYSTEM ADMINISTRATOR
        ------------------------------------------------------ */

        {
            id: "ROLE-ASESOR",
            name: "Asesor",
            description: "View assigned assessment projects.",
            locked: false,
            permissions: [
                "dashboard",
                "project_access"
            ]
        },

        /* ------------------------------------------------------
           PESERTA
           EDITABLE BY SYSTEM ADMINISTRATOR
        ------------------------------------------------------ */
        {
            id: "ROLE-PESERTA",
            name: "Peserta",
            description: "Access participant dashboard and assigned assessments.",
            locked: false,
            permissions: [
                "dashboard",
                "my_assessment"
            ]
        }
    ];

    /* ==========================================================
       DEFAULT USERS
    ========================================================== */

    const defaultUsers = [

        {
            id: "USR-001",
            name: "Administrator",
            username: "admin",
            email: "admin@talentscope.com",
            role: "System Administrator",
            status: "Active",
            password: "admin123"
        },

        {
            id: "USR-002",
            name: "Client",
            username: "client",
            email: "client@company.com",
            role: "Client",
            status: "Active",
            password: "client123"
        },

        {
            id: "USR-003",
            name: "Asesor",
            username: "asesor",
            email: "asesor@talentscope.com",
            role: "Asesor",
            status: "Active",
            password: "asesor123"
        },

        {
            id: "USR-004",
            name: "Peserta",
            username: "peserta",
            email: "peserta@talentscope.com",
            role: "Peserta",
            status: "Active",
            password: "peserta123"
        }
    ];


    /* ==========================================================
       DOM HELPER
    ========================================================== */

    const $ = id => document.getElementById(id);


    /* ==========================================================
       LOAD STORAGE
    ========================================================== */

    function loadData(key, fallback){

        try{

            const stored = localStorage.getItem(key);

            if(!stored){
                return fallback;
            }

            return JSON.parse(stored);

        }catch(error){

            console.error("Storage error:", error);

            return fallback;
        }
    }


    let profile = loadData(
        PROFILE_KEY,
        {...defaultProfile}
    );

    let users = loadData(
        USER_KEY,
        [...defaultUsers]
    );

    let roles = loadData(
        ROLE_KEY,
        [...defaultRoles]
    );


    /* ==========================================================
       ROLE MIGRATION
       Menyesuaikan data lama dengan struktur role terbaru.
    ========================================================== */

    function migrateRoles(){

        let changed = false;


        /* ------------------------------------------------------
           Rename old Client Administrator
           menjadi Client
        ------------------------------------------------------ */

        const oldClientAdmin = roles.find(
            role => role.id === "ROLE-CLIENT-ADMIN"
        );

        if(oldClientAdmin){

            const existingClient = roles.find(
                role => role.id === "ROLE-CLIENT"
            );

            if(!existingClient){

                roles.push({
                    id: "ROLE-CLIENT",
                    name: "Client",
                    description: oldClientAdmin.description ||
                        "Manage assigned projects, participants, assessments and results.",
                    locked: false,
                    permissions: oldClientAdmin.permissions || []
                });

            }

            roles = roles.filter(
                role => role.id !== "ROLE-CLIENT-ADMIN"
            );

            changed = true;
        }


        /* ------------------------------------------------------
           Rename old Client User
           jika masih ada
        ------------------------------------------------------ */

        const oldClientUser = roles.find(
            role => role.id === "ROLE-CLIENT-USER"
        );

        if(oldClientUser){

            roles = roles.filter(
                role => role.id !== "ROLE-CLIENT-USER"
            );

            changed = true;
        }


        /* ------------------------------------------------------
           Tambahkan role baru jika belum ada
        ------------------------------------------------------ */

        defaultRoles.forEach(defaultRole => {

            const existing = roles.find(
                role => role.id === defaultRole.id
            );

            if(!existing){

                roles.push({
                    ...defaultRole,
                    permissions: [...defaultRole.permissions]
                });

                changed = true;
            }

        });


        /* ------------------------------------------------------
           Normalisasi role bawaan lama yang masih memakai
           permission default versi sebelumnya.
           Hanya pola default lama yang diubah; permission yang
           sudah dikustom oleh System Administrator dipertahankan.
        ------------------------------------------------------ */
        const oldAsesorPermissions = [
            "dashboard",
            "assessment_project",
            "assessment_detail",
            "results",
            "project_access"
        ];

        const oldPesertaPermissions = [
            "dashboard"
        ];

        function samePermissionSet(a, b){
            if(!Array.isArray(a) || !Array.isArray(b)) return false;
            return a.length === b.length &&
                a.every(item => b.includes(item));
        }

        const asesorRole = roles.find(role => role.id === "ROLE-ASESOR");
        if(asesorRole && samePermissionSet(asesorRole.permissions, oldAsesorPermissions)){
            asesorRole.permissions = ["dashboard","project_access"];
            changed = true;
        }

        const pesertaRole = roles.find(role => role.id === "ROLE-PESERTA");
        if(pesertaRole && samePermissionSet(pesertaRole.permissions, oldPesertaPermissions)){
            pesertaRole.permissions = ["dashboard","my_assessment"];
            changed = true;
        }

        /* ------------------------------------------------------
           Pastikan status locked sesuai sistem
        ------------------------------------------------------ */

        roles.forEach(role => {

            if(SYSTEM_ROLE_IDS.includes(role.id)){

                const shouldBeLocked =
                    LOCKED_ROLE_IDS.includes(role.id);

                if(role.locked !== shouldBeLocked){

                    role.locked = shouldBeLocked;

                    changed = true;
                }
            }

        });


        /* ------------------------------------------------------
           Rename user role lama
        ------------------------------------------------------ */

        users.forEach(user => {

            if(user.role === "Client Administrator"){

                user.role = "Client";
                changed = true;
            }

            if(user.role === "Client User"){

                user.role = "Client";
                changed = true;
            }

        });


        if(changed){
            save();
        }
    }


    /* ==========================================================
       SAVE
    ========================================================== */

    function save(){

        localStorage.setItem(
            PROFILE_KEY,
            JSON.stringify(profile)
        );

        localStorage.setItem(
            USER_KEY,
            JSON.stringify(users)
        );

        localStorage.setItem(
            ROLE_KEY,
            JSON.stringify(roles)
        );
    }


    /* ==========================================================
       ESCAPE HTML
    ========================================================== */

    function escapeHtml(value){

        return String(value ?? "").replace(
            /[&<>"']/g,
            char => ({
                "&":"&amp;",
                "<":"&lt;",
                ">":"&gt;",
                '"':"&quot;",
                "'":"&#039;"
            })[char]
        );
    }


    /* ==========================================================
       INITIALS
    ========================================================== */

    function getInitials(name){

        return String(name || "U")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0,2)
            .map(part => part.charAt(0))
            .join("")
            .toUpperCase();
    }


    /* ==========================================================
       TOAST
    ========================================================== */

    function showToast(message){

        const toast = $("settingsToast");

        if(!toast){
            return;
        }

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(window.settingsToastTimer);

        window.settingsToastTimer = setTimeout(() => {

            toast.classList.remove("show");

        }, 2800);
    }


    /* ==========================================================
       MODAL
    ========================================================== */

    function openModal(id){

        const modal = $(id);

        if(!modal){
            return;
        }

        modal.classList.add("open");

        document.body.style.overflow = "hidden";
    }


    function closeModal(id){

        const modal = $(id);

        if(!modal){
            return;
        }

        modal.classList.remove("open");

        if(!document.querySelector(".modal.open")){

            document.body.style.overflow = "";
        }
    }


    /* ==========================================================
       PROFILE RENDER
    ========================================================== */

    function renderProfile(){

        $("profileName").value =
            profile.name || "";

        $("profileUsername").value =
            profile.username || "";

        $("profileEmail").value =
            profile.email || "";

        $("profileRole").textContent =
            profile.role || "";

        $("profileAvatar").textContent =
            getInitials(profile.name);
    }


    /* ==========================================================
       ROLE OPTIONS
    ========================================================== */

    function renderRoleOptions(){

        const select = $("userRole");
        const filter = $("roleFilter");

        if(!select || !filter){
            return;
        }

        const previousSelect = select.value;
        const previousFilter = filter.value;


        const options = roles.map(role =>

            `<option value="${escapeHtml(role.name)}">
                ${escapeHtml(role.name)}
            </option>`

        ).join("");


        select.innerHTML = options;

        filter.innerHTML =
            `<option value="">All Roles</option>${options}`;


        if(
            [...select.options].some(
                option => option.value === previousSelect
            )
        ){

            select.value = previousSelect;
        }


        if(
            [...filter.options].some(
                option => option.value === previousFilter
            )
        ){

            filter.value = previousFilter;
        }
    }


    /* ==========================================================
       USERS RENDER
    ========================================================== */

    function renderUsers(){

        const query =
            $("userSearch").value.trim().toLowerCase();

        const roleFilter =
            $("roleFilter").value;


        const filtered = users.filter(user => {

            const searchable =
                `${user.name} ${user.username} ${user.email}`
                .toLowerCase();


            return (
                (!query || searchable.includes(query)) &&
                (!roleFilter || user.role === roleFilter)
            );
        });


        $("usersTableBody").innerHTML =
            filtered.length

            ?

            filtered.map(user => `

                <tr>

                    <td>

                        <div class="user-cell">

                            <div class="user-avatar">
                                ${escapeHtml(
                                    getInitials(user.name)
                                )}
                            </div>

                            <div>

                                <div class="user-name">
                                    ${escapeHtml(user.name)}
                                </div>

                                <div class="user-email">
                                    ${escapeHtml(user.email)}
                                </div>

                            </div>

                        </div>

                    </td>


                    <td>
                        ${escapeHtml(user.username)}
                    </td>


                    <td>

                        <span class="role-badge">
                            ${escapeHtml(user.role)}
                        </span>

                    </td>


                    <td>

                        <span class="status-badge ${String(
                            user.status
                        ).toLowerCase()}">

                            ${escapeHtml(user.status)}

                        </span>

                    </td>


                    <td class="align-right">

                        <div class="table-actions">

                            <button
                                type="button"
                                class="icon-action edit-user"
                                data-id="${escapeHtml(user.id)}"
                                title="Edit">

                                <i class="fa-solid fa-pen"></i>

                            </button>


                            <button
                                type="button"
                                class="icon-action delete-user"
                                data-id="${escapeHtml(user.id)}"
                                title="Delete">

                                <i class="fa-solid fa-trash"></i>

                            </button>

                        </div>

                    </td>

                </tr>

            `).join("")

            :

            `
                <tr>
                    <td
                        colspan="5"
                        style="
                            text-align:center;
                            padding:40px;
                            color:#94a3b8;
                        "
                    >
                        No users found
                    </td>
                </tr>
            `;
    }


    /* ==========================================================
       ROLE RENDER
    ========================================================== */

    function renderRoles(){

        $("rolesGrid").innerHTML = roles.map(role => {

            const canEdit =
                !LOCKED_ROLE_IDS.includes(role.id);


            return `

                <article class="role-card">

                    <div class="role-card-top">

                        <div class="role-icon">

                            <i class="fa-solid ${
                                role.id === "ROLE-SYSTEM"
                                    ? "fa-crown"
                                    : "fa-shield-halved"
                            }"></i>

                        </div>


                        ${
                            role.id === "ROLE-SYSTEM"

                            ?

                            `<span class="status-badge active">
                                SYSTEM
                            </span>`

                            :

                            role.id === "ROLE-ADMIN"

                            ?

                            `<span class="status-badge active">
                                SYSTEM
                            </span>`

                            :

                            ""
                        }

                    </div>


                    <h4>
                        ${escapeHtml(role.name)}
                    </h4>


                    <p>
                        ${escapeHtml(
                            role.description ||
                            "No description provided."
                        )}
                    </p>


                    <div class="role-footer">

                        <span>
                            ${(role.permissions || []).length}
                            permissions
                        </span>


                        <button
                            type="button"
                            class="edit-role"
                            data-id="${escapeHtml(role.id)}"
                        >

                            ${
                                canEdit
                                    ? "Edit Role"
                                    : "View"
                            }

                        </button>

                    </div>

                </article>
            `;

        }).join("");
    }


    /* ==========================================================
       PERMISSIONS RENDER
    ========================================================== */

    function renderPermissions(
        selected = [],
        disabled = false
    ){

        $("permissionsGrid").innerHTML =
            permissions.map(([id,label]) => `

                <label class="permission-item">

                    <input
                        type="checkbox"
                        value="${id}"
                        ${
                            selected.includes(id)
                                ? "checked"
                                : ""
                        }
                        ${
                            disabled
                                ? "disabled"
                                : ""
                        }
                    >

                    <span>
                        ${label}
                    </span>

                </label>

            `).join("");
    }


    /* ==========================================================
       RENDER ALL
    ========================================================== */

    function renderAll(){

        renderProfile();
        renderRoleOptions();
        renderUsers();
        renderRoles();
    }


    /* ==========================================================
       TABS
    ========================================================== */

    document
        .querySelectorAll(".settings-tab")
        .forEach(tab => {

            tab.addEventListener("click", () => {

                const target = tab.dataset.tab;


                document
                    .querySelectorAll(".settings-tab")
                    .forEach(item =>
                        item.classList.remove("active")
                    );


                document
                    .querySelectorAll(".settings-panel")
                    .forEach(item =>
                        item.classList.remove("active")
                    );


                tab.classList.add("active");

                $("tab-" + target)
                    .classList.add("active");
            });

        });


    /* ==========================================================
       PROFILE UPDATE
    ========================================================== */

    $("profileForm").addEventListener(
        "submit",
        event => {

            event.preventDefault();


            profile.name =
                $("profileName").value.trim();

            profile.username =
                $("profileUsername").value.trim();

            profile.email =
                $("profileEmail").value.trim();


            const mainUser =
                users.find(
                    user => user.id === "USR-001"
                );


            if(mainUser){

                mainUser.name =
                    profile.name;

                mainUser.username =
                    profile.username;

                mainUser.email =
                    profile.email;
            }


            save();

            renderProfile();

            renderUsers();

            showToast(
                "Account profile berhasil diperbarui"
            );
        }
    );


    /* ==========================================================
       PASSWORD TOGGLE
    ========================================================== */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".password-toggle"
                );


            if(!button){
                return;
            }


            const input =
                $(button.dataset.target);

            const icon =
                button.querySelector("i");


            input.type =
                input.type === "password"
                    ? "text"
                    : "password";


            icon.className =
                input.type === "password"
                    ? "fa-regular fa-eye"
                    : "fa-regular fa-eye-slash";
        }
    );


    /* ==========================================================
       PASSWORD UPDATE
    ========================================================== */

    $("passwordForm").addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const mainUser =
                users.find(
                    user => user.id === "USR-001"
                );


            const current =
                $("currentPassword").value;

            const next =
                $("newPassword").value;

            const confirmPassword =
                $("confirmPassword").value;


            if(
                !mainUser ||
                current !== mainUser.password
            ){

                showToast(
                    "Current password tidak sesuai"
                );

                return;
            }


            if(next !== confirmPassword){

                showToast(
                    "Konfirmasi password belum sama"
                );

                return;
            }


            mainUser.password = next;

            save();

            $("passwordForm").reset();

            showToast(
                "Password berhasil diperbarui"
            );
        }
    );


    /* ==========================================================
       ADD USER
    ========================================================== */

    $("addUserBtn").addEventListener(
        "click",
        () => {

            $("userForm").reset();

            $("userId").value = "";

            $("userModalTitle").textContent =
                "Add User";

            $("userModalEyebrow").textContent =
                "USER ACCOUNT";

            $("userPassword").required = true;

            $("userPassword").placeholder = "";

            $("userStatus").value =
                "Active";

            $("userRole").value =
                roles[0]?.name || "";


            openModal("userModal");
        }
    );


    /* ==========================================================
       EDIT USER
    ========================================================== */

    function editUser(id){

        const user =
            users.find(
                item => item.id === id
            );


        if(!user){
            return;
        }


        $("userId").value =
            user.id;

        $("userName").value =
            user.name;

        $("userUsername").value =
            user.username;

        $("userEmail").value =
            user.email;

        $("userRole").value =
            user.role;

        $("userStatus").value =
            user.status;

        $("userPassword").value = "";

        $("userPassword").required =
            false;

        $("userPassword").placeholder =
            "Leave empty to keep current password";

        $("userModalTitle").textContent =
            "Edit User";

        $("userModalEyebrow").textContent =
            "USER MANAGEMENT";


        openModal("userModal");
    }


    /* ==========================================================
       SAVE USER
    ========================================================== */

    $("userForm").addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const id =
                $("userId").value;


            const username =
                $("userUsername")
                    .value
                    .trim();


            const duplicate =
                users.find(user =>
                    user.username.toLowerCase() ===
                    username.toLowerCase() &&
                    user.id !== id
                );


            if(duplicate){

                showToast(
                    "Username sudah digunakan"
                );

                return;
            }


            const payload = {

                id:
                    id ||
                    "USR-" + Date.now(),

                name:
                    $("userName")
                        .value
                        .trim(),

                username,

                email:
                    $("userEmail")
                        .value
                        .trim(),

                role:
                    $("userRole").value,

                status:
                    $("userStatus").value
            };


            const index =
                users.findIndex(
                    user => user.id === id
                );


            if(index >= 0){

                payload.password =
                    $("userPassword").value ||
                    users[index].password;


                users[index] = {
                    ...users[index],
                    ...payload
                };

            }else{

                payload.password =
                    $("userPassword").value;

                users.push(payload);
            }


            save();

            renderAll();

            closeModal("userModal");

            showToast(
                index >= 0
                    ? "User berhasil diperbarui"
                    : "User baru berhasil ditambahkan"
            );
        }
    );


    /* ==========================================================
       USER ACTIONS
    ========================================================== */

    document.addEventListener(
        "click",
        event => {

            const edit =
                event.target.closest(
                    ".edit-user"
                );


            if(edit){

                editUser(
                    edit.dataset.id
                );

                return;
            }


            const remove =
                event.target.closest(
                    ".delete-user"
                );


            if(remove){

                const user =
                    users.find(
                        item =>
                            item.id ===
                            remove.dataset.id
                    );


                if(!user){
                    return;
                }


                if(user.id === "USR-001"){

                    showToast(
                        "Main System Administrator tidak dapat dihapus"
                    );

                    return;
                }


                if(
                    confirm(
                        `Hapus user "${user.name}"?`
                    )
                ){

                    users =
                        users.filter(
                            item =>
                                item.id !==
                                user.id
                        );


                    save();

                    renderUsers();

                    showToast(
                        "User berhasil dihapus"
                    );
                }
            }

        }
    );


    /* ==========================================================
       CREATE ROLE
    ========================================================== */

    $("addRoleBtn").addEventListener(
        "click",
        () => {

            $("roleForm").reset();

            $("roleId").value = "";

            $("roleModalTitle").textContent =
                "Create Role";

            $("roleName").disabled =
                false;

            $("roleDescription").disabled =
                false;


            renderPermissions(
                [],
                false
            );


            $("selectAllPermissions")
                .style.display = "";


            $("selectAllPermissions")
                .textContent =
                    "Select all";


            openModal("roleModal");
        }
    );


    /* ==========================================================
       EDIT ROLE
    ========================================================== */

    function editRole(roleId) {
    // 1. Cek User Saat Ini
    const user = window.TalentScopeAccess ? window.TalentScopeAccess.getCurrentUser() : {};

    // 2. Jika BUKAN System Administrator, TOLAK AKSI!
    if (user.roleKey !== "system-administrator") {
        alert("Hanya System Administrator yang diizinkan menambah atau mengubah Role & Permission!");
        return; // Hentikan fungsi
    }

    // --- Kode lama settings.js Anda dilanjutkan di bawah sini ---
    const role = roles.find(item => item.id === roleId);
    if (!role) return;
    
    // Batasi agar nama Role System Admin & Admin bawaan tidak sembarangan diubah
    const isLockedRole = (role.id === "ROLE-SYSTEM" || role.id === "ROLE-ADMIN");
    document.getElementById("roleName").disabled = isLockedRole;

    openModal("roleModal");
}
    
    function editRole(id){

        const role =
            roles.find(
                item => item.id === id
            );


        if(!role){
            return;
        }


        const isLocked =
            LOCKED_ROLE_IDS.includes(
                role.id
            );


        $("roleId").value =
            role.id;

        $("roleName").value =
            role.name;

        $("roleDescription").value =
            role.description || "";


        $("roleModalTitle").textContent =
            isLocked
                ? "View System Role"
                : "Edit Role";


        /*
           System Administrator & Administrator
           hanya View.

           Client / Asesor / Peserta
           permission dapat diedit oleh
           System Administrator.
        */

        $("roleName").disabled =
            true;

        $("roleDescription").disabled =
            isLocked;


        renderPermissions(
            role.permissions || [],
            isLocked
        );


        document
            .querySelectorAll(
                "#permissionsGrid input"
            )
            .forEach(input => {

                input.disabled =
                    isLocked;
            });


        $("selectAllPermissions")
            .style.display =
                isLocked
                    ? "none"
                    : "";


        $("selectAllPermissions")
            .textContent =
                "Select all";


        openModal("roleModal");
    }


    /* ==========================================================
       ROLE BUTTON
    ========================================================== */

    document.addEventListener(
        "click",
        event => {

            const edit =
                event.target.closest(
                    ".edit-role"
                );


            if(edit){

                editRole(
                    edit.dataset.id
                );
            }

        }
    );


    /* ==========================================================
       SELECT ALL PERMISSIONS
    ========================================================== */

    $("selectAllPermissions")
        .addEventListener(
            "click",
            () => {

                const boxes = [
                    ...document.querySelectorAll(
                        "#permissionsGrid input:not(:disabled)"
                    )
                ];


                const allChecked =
                    boxes.length > 0 &&
                    boxes.every(
                        box => box.checked
                    );


                boxes.forEach(box => {

                    box.checked =
                        !allChecked;
                });


                $("selectAllPermissions")
                    .textContent =
                        allChecked
                            ? "Select all"
                            : "Clear all";
            }
        );


    /* ==========================================================
       SAVE ROLE
    ========================================================== */

    $("roleForm").addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const id =
                $("roleId").value;


            const existing =
                roles.find(
                    role => role.id === id
                );


            /*
               System Administrator & Administrator
               tidak boleh disimpan sebagai edit.
            */

            if(
                existing &&
                LOCKED_ROLE_IDS.includes(
                    existing.id
                )
            ){

                closeModal("roleModal");

                return;
            }


            const name =
                $("roleName")
                    .value
                    .trim();


            if(!name){

                showToast(
                    "Nama role wajib diisi"
                );

                return;
            }


            const duplicate =
                roles.find(role =>
                    role.name.toLowerCase() ===
                    name.toLowerCase() &&
                    role.id !== id
                );


            if(duplicate){

                showToast(
                    "Nama role sudah digunakan"
                );

                return;
            }


            const selected = [
                ...document.querySelectorAll(
                    "#permissionsGrid input:checked"
                )
            ].map(
                input => input.value
            );


            /*
               Untuk role bawaan Client,
               Asesor dan Peserta,
               nama role tetap menggunakan
               nama sistem.

               Jadi yang diedit adalah
               permission + description.
            */

            let finalName = name;


            if(existing){

                const builtInRole =
                    SYSTEM_ROLE_IDS.includes(
                        existing.id
                    );


                if(builtInRole){

                    finalName =
                        existing.name;
                }
            }


            const payload = {

                id:
                    id ||
                    "ROLE-" + Date.now(),

                name:
                    finalName,

                description:
                    $("roleDescription")
                        .value
                        .trim(),

                locked:
                    existing
                        ? !!existing.locked
                        : false,

                permissions:
                    selected
            };


            const index =
                roles.findIndex(
                    role => role.id === id
                );


            if(index >= 0){

                roles[index] = {
                    ...roles[index],
                    ...payload
                };

            }else{

                roles.push(payload);
            }


            save();

            renderAll();

            closeModal("roleModal");


            showToast(
                index >= 0
                    ? "Permission role berhasil diperbarui"
                    : "Role baru berhasil dibuat"
            );
        }
    );


    /* ==========================================================
       MODAL CLOSE
    ========================================================== */

    document.addEventListener(
        "click",
        event => {

            const close =
                event.target.closest(
                    "[data-close]"
                );


            if(close){

                closeModal(
                    close.dataset.close
                );
            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if(event.key === "Escape"){

                document
                    .querySelectorAll(
                        ".modal.open"
                    )
                    .forEach(modal => {

                        closeModal(
                            modal.id
                        );

                    });
            }

        }
    );


    /* ==========================================================
       SEARCH & FILTER
    ========================================================== */

    $("userSearch")
        .addEventListener(
            "input",
            renderUsers
        );


    $("roleFilter")
        .addEventListener(
            "change",
            renderUsers
        );


    /* ==========================================================
       INITIALIZATION
    ========================================================== */

    migrateRoles();

    renderAll();

})();