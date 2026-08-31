/* ==========================================================
   TalentScope Enterprise
   assessment.js — FINAL CLEAN VERSION

   Fitur:
   - Load assessment dari localStorage / data awal
   - Render table
   - Statistik 4 card
   - Search
   - Filter category & status
   - Pagination
   - Add
   - Edit
   - Delete
   - Select assessment
   - Create Assessment Project
   - Modal close/cancel
   ========================================================== */

(function () {
    "use strict";

    const STORAGE_KEY = "assessments";
    const SELECTED_KEY = "selectedAssessments";
    const PER_PAGE = 10;

    let assessments = [];
    let currentPage = 1;
    let selectedIds = [];
    let editMode = false;
    let editId = null;

    /* ======================================================
       BASIC HELPERS
       ====================================================== */

    function $(id) {
        return document.getElementById(id);
    }

    function text(value) {
        return value == null ? "" : String(value);
    }

    function escapeHtml(value) {
        return text(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function isActive(item) {
        return (
            item.status === true ||
            item.status === "true" ||
            item.status === "Active" ||
            item.status === "active" ||
            item.active === true ||
            item.active === "true" ||
            item.active === "Active" ||
            item.active === "active"
        );
    }

    function getDuration(item) {
        const value = Number(item.duration);
        return Number.isFinite(value) ? value : 0;
    }

    function getQuestions(item) {
        if (item.question != null) {
            return Number(item.question) || 0;
        }

        if (item.questions != null) {
            return Number(item.questions) || 0;
        }

        return 0;
    }

    function makeId() {
        return Date.now().toString() + Math.random().toString(16).slice(2);
    }

    /* ======================================================
       STORAGE
       ====================================================== */

    function loadData() {
        let stored = null;

        try {
            stored = JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );
        } catch (error) {
            console.warn(
                "localStorage assessments tidak valid.",
                error
            );
        }

        if (Array.isArray(stored)) {
            assessments = stored;
        } else if (
            Array.isArray(window.assessments)
        ) {
            assessments = window.assessments;
        } else {
            assessments = [];
        }

        normalizeData();
        saveData();
    }

    function normalizeData() {
        assessments = assessments.map(function (item, index) {
            const normalized = {
                ...item
            };

            if (
                normalized.id == null ||
                normalized.id === ""
            ) {
                normalized.id =
                    Date.now().toString() + "-" + index;
            }

            if (normalized.question == null) {
                normalized.question =
                    normalized.questions || 0;
            }

            if (normalized.questions == null) {
                normalized.questions =
                    normalized.question || 0;
            }

            if (normalized.status == null) {
                normalized.status =
                    isActive(normalized);
            }

            if (normalized.description == null) {
                normalized.description = "";
            }

            return normalized;
        });
    }

    function saveData() {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(assessments)
        );

        window.assessments = assessments;
    }

    /* ======================================================
       FILTER / SEARCH
       ====================================================== */

    function getFilteredData() {
        const searchInput =
            $("searchAssessment");

        const categorySelect =
            $("filterCategory");

        const statusSelect =
            $("filterStatus");

        const search =
            searchInput
                ? searchInput.value.trim().toLowerCase()
                : "";

        const category =
            categorySelect
                ? categorySelect.value.trim().toLowerCase()
                : "";

        const status =
            statusSelect
                ? statusSelect.value.trim().toLowerCase()
                : "";

        return assessments.filter(function (item) {
            const itemName =
                text(item.name).toLowerCase();

            const itemCode =
                text(item.code).toLowerCase();

            const itemCategory =
                text(item.category).toLowerCase();

            const itemDescription =
                text(item.description).toLowerCase();

            const active =
                isActive(item);

            const searchMatch =
                !search ||
                itemName.includes(search) ||
                itemCode.includes(search) ||
                itemCategory.includes(search) ||
                itemDescription.includes(search);

            const categoryMatch =
                !category ||
                itemCategory === category;

            let statusMatch = true;

            if (status === "active") {
                statusMatch = active;
            }

            if (status === "inactive") {
                statusMatch = !active;
            }

            return (
                searchMatch &&
                categoryMatch &&
                statusMatch
            );
        });
    }

    /* ======================================================
       STATISTICS
       ====================================================== */

    function updateStatistics() {
        const total = assessments.length;

        const active =
            assessments.filter(isActive).length;

        const duration =
            assessments.reduce(function (sum, item) {
                return sum + getDuration(item);
            }, 0);

        const categories =
            new Set(
                assessments
                    .map(function (item) {
                        return text(
                            item.category
                        ).trim();
                    })
                    .filter(Boolean)
            ).size;

        /*
         * Mendukung ID card yang sudah ada.
         */
        const totalEl =
            $("totalAssessment") ||
            document.querySelector(
                '[data-stat="total-assessment"]'
            );

        const activeEl =
            $("activeAssessment") ||
            document.querySelector(
                '[data-stat="active-assessment"]'
            );

        const durationEl =
            $("totalDuration") ||
            document.querySelector(
                '[data-stat="total-duration"]'
            );

        const categoryEl =
            $("totalCategory") ||
            document.querySelector(
                '[data-stat="total-category"]'
            );

        if (totalEl) {
            totalEl.textContent = total;
        }

        if (activeEl) {
            activeEl.textContent = active;
        }

        if (durationEl) {
            durationEl.textContent = duration;
        }

        if (categoryEl) {
            categoryEl.textContent = categories;
        }
    }

    /* ======================================================
       TABLE
       ====================================================== */

    function renderTable() {
        const tbody =
            $("assessmentTable");

        if (!tbody) {
            return;
        }

        const data =
            getFilteredData();

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    data.length / PER_PAGE
                )
            );

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const start =
            (currentPage - 1) * PER_PAGE;

        const pageData =
            data.slice(
                start,
                start + PER_PAGE
            );

        if (!pageData.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8"
                        style="text-align:center;padding:60px;">
                        No assessment found
                    </td>
                </tr>
            `;

            updatePagination(totalPages);
            updateSelectedCounter();
            return;
        }

        tbody.innerHTML =
            pageData.map(function (item) {
                const active =
                    isActive(item);

                const checked =
                    selectedIds.some(function (id) {
                        return String(id) ===
                            String(item.id);
                    });

                const categoryClass =
                    text(item.category)
                        .toLowerCase()
                        .replace(/\s+/g, "-");

                return `
                    <tr>

                        <td>
                            <input
                                type="checkbox"
                                class="assessment-check"
                                data-id="${escapeHtml(item.id)}"
                                ${checked ? "checked" : ""}
                            >
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(item.code)}
                            </strong>
                        </td>

                        <td>
                            <div class="assessment-name">
                                <h4>
                                    ${escapeHtml(item.name)}
                                </h4>
                                <small>
                                    ${escapeHtml(item.description || "")}
                                </small>
                            </div>
                        </td>

                        <td>
                            <span class="badge ${categoryClass}">
                                ${escapeHtml(item.category || "")}
                            </span>
                        </td>

                        <td>
                            ${getDuration(item)} Minutes
                        </td>

                        <td>
                            ${getQuestions(item)} Items
                        </td>

                        <td>
                            <span class="status ${active ? "active" : "inactive"}">
                                ${active ? "Active" : "Inactive"}
                            </span>
                        </td>

                        <td>
                            <div class="action-buttons">

                                <button
                                    type="button"
                                    class="editAssessment"
                                    data-id="${escapeHtml(item.id)}"
                                    title="Edit Assessment">
                                    <i class="fa-solid fa-pen"></i>
                                </button>

                                <button
                                    type="button"
                                    class="deleteAssessment delete"
                                    data-id="${escapeHtml(item.id)}"
                                    title="Delete Assessment">
                                    <i class="fa-solid fa-trash"></i>
                                </button>

                            </div>
                        </td>

                    </tr>
                `;
            }).join("");

        updatePagination(totalPages);
        updateSelectedCounter();
    }

    /* ======================================================
       PAGINATION
       ====================================================== */

    function updatePagination(totalPages) {
        const pagination =
            $("assessmentPagination");

        if (!pagination) {
            return;
        }

        const prev =
            $("prevPage");

        const next =
            $("nextPage");

        if (prev) {
            prev.disabled =
                currentPage <= 1;

            prev.style.opacity =
                prev.disabled ? "0.45" : "1";
        }

        if (next) {
            next.disabled =
                currentPage >= totalPages;

            next.style.opacity =
                next.disabled ? "0.45" : "1";
        }

        pagination
            .querySelectorAll(".pg-num")
            .forEach(function (button, index) {

                const page =
                    index + 1;

                button.style.display =
                    page <= totalPages
                        ? "flex"
                        : "none";

                button.classList.toggle(
                    "active",
                    page === currentPage
                );
            });
    }

    function bindPagination() {
        const prev =
            $("prevPage");

        const next =
            $("nextPage");

        if (prev) {
            prev.onclick = function () {
                if (currentPage > 1) {
                    currentPage--;
                    renderTable();
                }
            };
        }

        if (next) {
            next.onclick = function () {
                const data =
                    getFilteredData();

                const totalPages =
                    Math.max(
                        1,
                        Math.ceil(
                            data.length / PER_PAGE
                        )
                    );

                if (
                    currentPage <
                    totalPages
                ) {
                    currentPage++;
                    renderTable();
                }
            };
        }

        document
            .querySelectorAll(
                "#assessmentPagination .pg-num"
            )
            .forEach(function (button, index) {

                button.onclick =
                    function () {
                        const page =
                            index + 1;

                        const data =
                            getFilteredData();

                        const totalPages =
                            Math.max(
                                1,
                                Math.ceil(
                                    data.length /
                                    PER_PAGE
                                )
                            );

                        if (
                            page <=
                            totalPages
                        ) {
                            currentPage =
                                page;

                            renderTable();
                        }
                    };
            });
    }

    /* ======================================================
       SELECT CHECKBOX
       ====================================================== */

    function updateSelectedCounter() {
        selectedIds =
            Array.from(
                document.querySelectorAll(
                    ".assessment-check:checked"
                )
            ).map(function (checkbox) {
                return checkbox.dataset.id;
            });

        const counter =
            $("selectedCount");

        if (counter) {
            counter.textContent =
                selectedIds.length +
                " assessment selected";
        }

        const createButton =
            $("createProjectBtn");

        if (createButton) {
            createButton.disabled =
                selectedIds.length === 0;
        }
    }

    function bindSelection() {
        document.addEventListener(
            "change",
            function (event) {

                if (
                    event.target.matches(
                        ".assessment-check"
                    )
                ) {
                    updateSelectedCounter();
                }

                if (
                    event.target.id ===
                    "checkAll"
                ) {
                    const checked =
                        event.target.checked;

                    document
                        .querySelectorAll(
                            ".assessment-check"
                        )
                        .forEach(function (checkbox) {
                            checkbox.checked =
                                checked;
                        });

                    updateSelectedCounter();
                }
            }
        );
    }

    /* ======================================================
       MODAL
       ====================================================== */

    function openModal() {
        const modal =
            $("assessmentModal");

        if (!modal) {
            return;
        }

        modal.classList.add("show");
        modal.style.display = "flex";
        document.body.classList.add(
            "modal-open"
        );
    }

    function closeModal() {
        const modal =
            $("assessmentModal");

        if (!modal) {
            return;
        }

        modal.classList.remove("show");
        modal.style.display = "none";
        document.body.classList.remove(
            "modal-open"
        );

        editMode = false;
        editId = null;

        updateModalTitle(false);
    }

    function updateModalTitle(editing) {
        const title =
            document.querySelector(
                "#assessmentModal .modal-title"
            );

        const subtitle =
            document.querySelector(
                "#assessmentModal .modal-subtitle"
            );

        if (title) {
            title.textContent =
                editing
                    ? "Edit Assessment"
                    : "Add New Assessment";
        }

        if (subtitle) {
            subtitle.textContent =
                editing
                    ? "Update assessment instrument"
                    : "Create and configure a new assessment instrument";
        }
    }

    function resetForm() {
        const code =
            $("assessmentCode");

        const name =
            $("assessmentName");

        const category =
            $("assessmentCategory");

        const status =
            $("assessmentStatus");

        const duration =
            $("assessmentDuration");

        const question =
            $("assessmentQuestion");

        const description =
            $("assessmentDescription");

        if (code) code.value = "";
        if (name) name.value = "";

        if (category) {
            category.selectedIndex = 0;
        }

        if (status) {
            status.value = "Active";
        }

        if (duration) {
            duration.value = 20;
        }

        if (question) {
            question.value = 30;
        }

        if (description) {
            description.value = "";
        }

        editMode = false;
        editId = null;

        updateModalTitle(false);
    }

    /* ======================================================
       ADD
       ====================================================== */

    function bindAdd() {
        const button =
            $("addAssessmentBtn");

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                resetForm();
                openModal();
            }
        );
    }

    /* ======================================================
       EDIT
       ====================================================== */

    function startEdit(id) {
        const item =
            assessments.find(function (assessment) {
                return String(assessment.id) ===
                    String(id);
            });

        if (!item) {
            alert(
                "Assessment tidak ditemukan."
            );
            return;
        }

        editMode = true;
        editId = item.id;

        const code =
            $("assessmentCode");

        const name =
            $("assessmentName");

        const category =
            $("assessmentCategory");

        const status =
            $("assessmentStatus");

        const duration =
            $("assessmentDuration");

        const question =
            $("assessmentQuestion");

        const description =
            $("assessmentDescription");

        if (code) {
            code.value =
                item.code || "";
        }

        if (name) {
            name.value =
                item.name || "";
        }

        if (category) {
            category.value =
                item.category || "";
        }

        if (status) {
            status.value =
                isActive(item)
                    ? "Active"
                    : "Inactive";
        }

        if (duration) {
            duration.value =
                getDuration(item);
        }

        if (question) {
            question.value =
                getQuestions(item);
        }

        if (description) {
            description.value =
                item.description || "";
        }

        updateModalTitle(true);
        openModal();
    }

    function bindEdit() {
        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".editAssessment"
                    );

                if (!button) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                startEdit(
                    button.dataset.id
                );
            }
        );
    }

    /* ======================================================
       DELETE
       ====================================================== */

    function bindDelete() {
        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        ".deleteAssessment"
                    );

                if (!button) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                const id =
                    button.dataset.id;

                const item =
                    assessments.find(function (assessment) {
                        return String(assessment.id) ===
                            String(id);
                    });

                if (!item) {
                    return;
                }

                const confirmed =
                    window.confirm(
                        'Hapus assessment "' +
                        (item.name || item.code) +
                        '"?'
                    );

                if (!confirmed) {
                    return;
                }

                assessments =
                    assessments.filter(function (assessment) {
                        return String(assessment.id) !==
                            String(id);
                    });

                selectedIds =
                    selectedIds.filter(function (selectedId) {
                        return String(selectedId) !==
                            String(id);
                    });

                saveData();

                currentPage = 1;
                renderTable();
                updateStatistics();
            }
        );
    }

    /* ======================================================
       SAVE
       ====================================================== */

    function saveAssessment() {
        const codeEl =
            $("assessmentCode");

        const nameEl =
            $("assessmentName");

        const categoryEl =
            $("assessmentCategory");

        const statusEl =
            $("assessmentStatus");

        const durationEl =
            $("assessmentDuration");

        const questionEl =
            $("assessmentQuestion");

        const descriptionEl =
            $("assessmentDescription");

        if (
            !codeEl ||
            !nameEl ||
            !categoryEl ||
            !statusEl ||
            !durationEl ||
            !questionEl ||
            !descriptionEl
        ) {
            console.error(
                "Field form assessment tidak lengkap."
            );
            return;
        }

        const code =
            codeEl.value.trim();

        const name =
            nameEl.value.trim();

        const category =
            categoryEl.value.trim();

        const status =
            statusEl.value === "Active";

        const duration =
            Number(durationEl.value) || 0;

        const question =
            Number(questionEl.value) || 0;

        const description =
            descriptionEl.value.trim();

        if (!code) {
            alert(
                "Assessment Code wajib diisi."
            );
            codeEl.focus();
            return;
        }

        if (!name) {
            alert(
                "Assessment Name wajib diisi."
            );
            nameEl.focus();
            return;
        }

        if (editMode) {
            const item =
                assessments.find(function (assessment) {
                    return String(assessment.id) ===
                        String(editId);
                });

            if (!item) {
                alert(
                    "Assessment yang diedit tidak ditemukan."
                );
                return;
            }

            item.code = code;
            item.name = name;
            item.category = category;
            item.status = status;
            item.active = status;
            item.duration = duration;
            item.question = question;
            item.questions = question;
            item.description = description;

        } else {
            assessments.push({
                id: makeId(),
                code: code,
                name: name,
                category: category,
                status: status,
                active: status,
                duration: duration,
                question: question,
                questions: question,
                description: description
            });
        }

        saveData();

        closeModal();
        resetForm();

        currentPage = 1;

        renderTable();
        updateStatistics();
    }

    function bindSave() {
        const button =
            $("saveAssessment");

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                saveAssessment();
            }
        );
    }

    /* ======================================================
       CLOSE / CANCEL
       ====================================================== */

    function bindModalClose() {
        const closeButton =
            $("closeAssessmentModal");

        const cancelButton =
            $("cancelAssessment");

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    closeModal();
                }
            );
        }

        if (cancelButton) {
            cancelButton.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    closeModal();
                }
            );
        }

        const modal =
            $("assessmentModal");

        if (modal) {
            modal.addEventListener(
                "click",
                function (event) {
                    if (
                        event.target === modal
                    ) {
                        closeModal();
                    }
                }
            );
        }

        document.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Escape"
                ) {
                    closeModal();
                }
            }
        );
    }

    /* ======================================================
       SEARCH
       ====================================================== */

    function bindSearch() {
        const search =
            $("searchAssessment");

        if (!search) {
            return;
        }

        search.addEventListener(
            "input",
            function () {
                currentPage = 1;
                renderTable();
            }
        );
    }

    /* ======================================================
       FILTER
       ====================================================== */

    function bindFilter() {
        const filterButton =
            $("filterAssessment");

        const panel =
            $("assessmentFilterPanel");

        const apply =
            $("applyAssessmentFilter");

        const clear =
            $("clearAssessmentFilter");

        const reset =
            $("resetAssessmentFilter");

        if (
            filterButton &&
            panel
        ) {
            filterButton.addEventListener(
                "click",
                function () {
                    const hidden =
                        getComputedStyle(panel)
                            .display === "none";

                    panel.style.display =
                        hidden
                            ? "block"
                            : "none";
                }
            );
        }

        if (apply) {
            apply.addEventListener(
                "click",
                function () {
                    currentPage = 1;
                    renderTable();

                    if (panel) {
                        panel.style.display =
                            "none";
                    }
                }
            );
        }

        if (clear) {
            clear.addEventListener(
                "click",
                function () {

                    const category =
                        $("filterCategory");

                    const status =
                        $("filterStatus");

                    if (category) {
                        category.value = "";
                    }

                    if (status) {
                        status.value = "";
                    }

                    currentPage = 1;
                    renderTable();

                    if (panel) {
                        panel.style.display =
                            "none";
                    }
                }
            );
        }

        if (reset) {
            reset.addEventListener(
                "click",
                function () {

                    const category =
                        $("filterCategory");

                    const status =
                        $("filterStatus");

                    const search =
                        $("searchAssessment");

                    if (category) {
                        category.value = "";
                    }

                    if (status) {
                        status.value = "";
                    }

                    if (search) {
                        search.value = "";
                    }

                    currentPage = 1;
                    renderTable();
                }
            );
        }
    }

    /* ======================================================
       CREATE PROJECT
       ====================================================== */

    function bindCreateProject() {
        const button =
            $("createProjectBtn");

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                updateSelectedCounter();

                if (
                    selectedIds.length === 0
                ) {
                    alert(
                        "Pilih minimal satu assessment terlebih dahulu."
                    );
                    return;
                }

                const selected =
                    assessments.filter(function (item) {
                        return selectedIds.some(function (id) {
                            return String(id) ===
                                String(item.id);
                        });
                    });

                localStorage.setItem(
                    SELECTED_KEY,
                    JSON.stringify(selected)
                );

                window.location.href =
                    "assessment-project.html";
            }
        );
    }

    /* ======================================================
       INITIALIZE
       ====================================================== */

    function init() {
        loadData();

        bindAdd();
        bindEdit();
        bindDelete();
        bindSave();
        bindModalClose();
        bindSearch();
        bindFilter();
        bindSelection();
        bindPagination();
        bindCreateProject();

        renderTable();
        updateStatistics();

        console.log(
            "TalentScope: assessment.js FINAL loaded."
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }

})();

