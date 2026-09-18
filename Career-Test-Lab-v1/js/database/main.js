/* ==========================================================
   DATABASE — MAIN CONTROLLER
   ----------------------------------------------------------
   Entry point: dipanggil saat DOM ready.
========================================================== */

(function () {
    "use strict";

    window.DB = window.DB || {};

    // ==========================================================
    // SETUP SEARCH
    // ==========================================================
    function setupRealtimeSearch() {
        var searchInput = document.getElementById("globalSearchInput");
        if (searchInput) {
            searchInput.addEventListener("input", function () {
                DB.loadParticipantsFromLocalStorage(this.value);
            });
        }
    }

    // ==========================================================
    // SETUP AUTO REFRESH (60 detik)
    // ==========================================================
    function setupDatabaseAutoRefresh() {
        var lastParticipantsSnapshot =
            localStorage.getItem(DB.STORAGE_KEY) || "[]";
        var lastProjectsSnapshot =
            localStorage.getItem(DB.PROJECTS_KEY) || "[]";

        // Storage event (tab lain)
        window.addEventListener("storage", function (event) {
            if (
                event.key === DB.STORAGE_KEY ||
                event.key === DB.PROJECTS_KEY
            ) {
                refreshDatabaseIfChanged();
            }
        });

        // Polling 60 detik (fallback)
        setInterval(function () {
            refreshDatabaseIfChanged();
        }, 60000);

        function refreshDatabaseIfChanged() {
            var latestParticipants =
                localStorage.getItem(DB.STORAGE_KEY) || "[]";
            var latestProjects =
                localStorage.getItem(DB.PROJECTS_KEY) || "[]";

            var participantsChanged =
                latestParticipants !== lastParticipantsSnapshot;
            var projectsChanged =
                latestProjects !== lastProjectsSnapshot;

            if (!participantsChanged && !projectsChanged) return;

            lastParticipantsSnapshot = latestParticipants;
            lastProjectsSnapshot = latestProjects;

            var searchInput = document.getElementById("globalSearchInput");
            DB.loadParticipantsFromLocalStorage(
                searchInput ? searchInput.value : ""
            );
        }
    }

    // ==========================================================
    // SETUP REALTIME PARTICIPANT SYNC (dimatikan)
    // ==========================================================
    function setupRealtimeParticipantSync() {
        console.log(
            "[DATABASE][REALTIME] Realtime channel dinonaktifkan. " +
                "Update via polling 60s + storage event."
        );
    }

    // ==========================================================
    // INIT USER PERMISSIONS (role badge)
    // ==========================================================
    function initUserPermissions() {
        var usernameEl = document.getElementById("currentUsername");
        var badgeEl = document.getElementById("currentRoleBadge");

        if (usernameEl)
            usernameEl.innerText =
                DB.currentUserSession.username || "admin";
        if (badgeEl)
            badgeEl.innerText =
                DB.currentUserSession.role || "System Administrator";
    }

    // ==========================================================
    // OPEN MODAL FROM URL
    // ==========================================================
    function openModalFromUrlParams(urlParams) {
        var detailId = urlParams.get("detail");
        var editId = urlParams.get("edit");
        var nameHint = urlParams.get("name");

        if (!detailId && !editId) return;

        var targetId = detailId || editId;

        var match = DB.rawDatabaseParticipants.find(function (item) {
            return String(item.id) === String(targetId);
        });

        if (!match && nameHint) {
            var normalizedName = decodeURIComponent(nameHint)
                .toLowerCase()
                .trim();
            match = DB.rawDatabaseParticipants.find(function (item) {
                return (
                    (item.nama || "").toLowerCase().trim() === normalizedName
                );
            });
        }

        if (!match) {
            console.warn("[DATABASE] Peserta tidak ditemukan:", targetId);
            return;
        }

        if (detailId) {
            DB.openDetailModal(match.id);
        } else if (editId) {
            DB.openEditModal(match.id);
        }
    }

    // ==========================================================
    // EXPOSE ke window (untuk onclick di HTML)
    // ==========================================================
    window.openDetailModal = DB.openDetailModal;
    window.openEditModal = DB.openEditModal;
    window.closeModal = DB.closeModal;
    window.saveParticipantDetail = DB.saveParticipantDetail;
    window.handleSelectAllChange = DB.handleSelectAllChange;
    window.toggleSelectAll = DB.toggleSelectAll;
    window.removeSelected = DB.removeSelected;

    // ==========================================================
    // INIT (dipanggil dari HTML)
    // ==========================================================
    DB.initDatabasePage = async function () {
        initUserPermissions();

        var urlParams = new URLSearchParams(window.location.search);
        var searchQueryParam = urlParams.get("search") || "";
        var searchInput = document.getElementById("globalSearchInput");

        var initialSearchValue = "";
        if (searchQueryParam) {
            initialSearchValue = decodeURIComponent(searchQueryParam);
            if (searchInput) searchInput.value = initialSearchValue;
        }

        // Sync dari Supabase dulu
        await DB.syncDatabaseFromSupabase();

        // Load data
        DB.loadParticipantsFromLocalStorage(initialSearchValue);

        // Setup events
        setupRealtimeSearch();
        setupDatabaseAutoRefresh();
        setupRealtimeParticipantSync();

        // Auto-open modal dari URL
        openModalFromUrlParams(urlParams);
    };

    console.log("[DB] Main module initialized");
})();