/* =========================================================
   TALENTSCOPE PROJECT CREATE
   =========================================================
   FLOW:

   Assessment Catalog
        ↓
   Select Assessment
        ↓
   Create Assessment Project
        ↓
   Assessment Project - Create Project
        ↓
   Step 1 - Project
        ↓
   Step 2 - Schedule
        ↓
   Step 3 - Review
        ↓
   Create Project
        ↓
   Supabase projects.id (UUID)
        ↓
   project-detail.html?id=UUID

   IMPORTANT:
   - Supabase = source of truth
   - project.id = UUID
   - project_code = display/business code
   - selected assessments = sessionStorage
========================================================= */


/* =========================================================
   VERSION MARKER
========================================================= */

console.log(
    "========================================"
);

console.log(
    "[PROJECT CREATE] FULL FIX VERSION LOADED"
);

console.log(
    "[PROJECT CREATE] VERSION: UUID-FIX-002"
);

console.log(
    "========================================"
);


/* =========================================================
   PROJECT CREATE STATE
========================================================= */

/*
   JANGAN membuat variable selectedAssessments
   kedua di dalam DOMContentLoaded.

   Hanya satu state global.
*/

let selectedAssessments = [];


/* =========================================================
   SESSION STORAGE KEY
========================================================= */

const SELECTED_ASSESSMENTS_KEY =
    "talentscope_selected_assessments";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "[PROJECT CREATE] DOM ready"
        );


        /* =================================================
           LOAD SELECTED ASSESSMENTS
        ================================================= */

        loadSelectedAssessments();


        console.log(
            "[PROJECT CREATE] Total selected:",
            selectedAssessments.length
        );


        /* =================================================
           RENDER SELECTED ASSESSMENTS
        ================================================= */

        renderSelectedAssessments();


        /* =================================================
           ELEMENTS
        ================================================= */

        const modal =
            document.getElementById(
                "projectModal"
            );


        const nextButton =
    document.getElementById(
        "nextStep"
    );

if (nextButton) {

    nextButton.type = "button";

}

        const prevButton =
            document.getElementById(
                "prevStep"
            );


        const cancelButton =
            document.getElementById(
                "cancelProject"
            );


        const closeButton =
            document.getElementById(
                "closeModal"
            );


        /* =================================================
           FORM STEPS
        ================================================= */

        const steps =
            document.querySelectorAll(
                ".form-step"
            );


        const stepIndicators =
            document.querySelectorAll(
                ".stepper .step"
            );


        let currentStep = 1;


        /* =================================================
           CHECK REQUIRED ELEMENTS
        ================================================= */

        console.log(
            "[PROJECT CREATE] Elements:",
            {
                modal: !!modal,
                nextButton: !!nextButton,
                prevButton: !!prevButton,
                cancelButton: !!cancelButton,
                closeButton: !!closeButton,
                steps: steps.length,
                stepIndicators: stepIndicators.length
            }
        );


        /* =================================================
           LOAD SELECTED ASSESSMENTS
        ================================================= */

        function loadSelectedAssessments() {

            console.log(
                "[PROJECT CREATE] Loading selected assessments..."
            );


            selectedAssessments = [];


            try {

                const stored =
                    sessionStorage.getItem(
                        SELECTED_ASSESSMENTS_KEY
                    );


                if (!stored) {

                    console.warn(
                        "[PROJECT CREATE] No selected assessments in sessionStorage"
                    );

                    return selectedAssessments;

                }


                const parsed =
                    JSON.parse(
                        stored
                    );


                if (
                    !Array.isArray(parsed)
                ) {

                    console.error(
                        "[PROJECT CREATE] Selected assessment data is not an array."
                    );

                    return selectedAssessments;

                }


                /*
                   Normalisasi ringan.

                   Kita tidak mengubah data asli
                   secara agresif karena data tersebut
                   berasal dari Assessment Catalog.
                */

                selectedAssessments =
                    parsed.filter(
                        function (item) {

                            return (
                                item &&
                                typeof item === "object"
                            );

                        }
                    );


                console.log(
                    "[PROJECT CREATE] Selected assessments loaded:",
                    selectedAssessments
                );


                console.log(
                    "[PROJECT CREATE] Total selected:",
                    selectedAssessments.length
                );


            } catch (error) {

                console.error(
                    "[PROJECT CREATE] Failed to parse selected assessments:",
                    error
                );


                selectedAssessments = [];

            }


            return selectedAssessments;

        }


        /* =================================================
           RENDER SELECTED ASSESSMENTS
        ================================================= */

        function renderSelectedAssessments() {

            const container =
                document.getElementById(
                    "selectedAssessmentsList"
                );


            if (!container) {

                console.warn(
                    "[PROJECT CREATE] selectedAssessmentsList not found"
                );

                return;

            }


            if (
                !Array.isArray(
                    selectedAssessments
                ) ||
                selectedAssessments.length === 0
            ) {

                container.innerHTML = `

                    <div class="empty-assessment-selection">

                        No assessments selected.

                    </div>

                `;

                return;

            }


            container.innerHTML =
                selectedAssessments
                    .map(
                        function (
                            assessment,
                            index
                        ) {

                            const name =
                                assessment.name ||
                                assessment.assessment_name ||
                                "-";


                            const code =
                                assessment.code ||
                                assessment.assessment_code ||
                                "-";


                            const category =
                                assessment.category ||
                                "";


                            const duration =
                                assessment.duration ||
                                "";


                            return `

                                <div class="selected-assessment-item">

                                    <div
                                        class="selected-assessment-number"
                                    >

                                        ${index + 1}

                                    </div>


                                    <div
                                        class="selected-assessment-info"
                                    >

                                        <strong>
                                            ${escapeHtml(name)}
                                        </strong>


                                        <span>

                                            ${escapeHtml(code)}

                                            ${
                                                category
                                                    ? " • " +
                                                      escapeHtml(category)
                                                    : ""
                                            }

                                        </span>

                                    </div>


                                    <div
                                        class="selected-assessment-duration"
                                    >

                                        ${escapeHtml(
                                            String(duration)
                                        )}

                                    </div>

                                </div>

                            `;

                        }
                    )
                    .join("");


            console.log(
                "[PROJECT CREATE] Rendered selected assessments:",
                selectedAssessments.length
            );

        }


        /* =================================================
           HTML ESCAPE
        ================================================= */

        function escapeHtml(value) {

            return String(value)
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );

        }


        /* =================================================
           SHOW STEP
        ================================================= */

        function showStep(stepNumber) {

            currentStep =
                stepNumber;


            steps.forEach(
                function (step) {

                    step.classList.remove(
                        "active"
                    );

                }
            );


            const activeStep =
                document.getElementById(
                    "step" +
                    stepNumber
                );


            if (activeStep) {

                activeStep.classList.add(
                    "active"
                );

            }


            /* =================================================
               UPDATE STEPPER
            ================================================= */

            stepIndicators.forEach(
                function (
                    indicator,
                    index
                ) {

                    indicator.classList.remove(
                        "active"
                    );


                    if (
                        index <
                        stepNumber
                    ) {

                        indicator.classList.add(
                            "active"
                        );

                    }

                }
            );


            /* =================================================
               PREVIOUS BUTTON
            ================================================= */

            if (prevButton) {

                prevButton.style.display =
                    stepNumber === 1
                        ? "none"
                        : "inline-flex";

            }


            /* =================================================
               NEXT BUTTON TEXT
            ================================================= */

            if (nextButton) {

                if (
                    stepNumber === 3
                ) {

                    nextButton.innerHTML = `

                        <i class="fa-solid fa-floppy-disk"></i>
                        Create Project

                    `;

                } else {

                    nextButton.innerHTML = `
                        Continue
                    `;

                }

            }

        }


        /* =================================================
           VALIDATE STEP 1
        ================================================= */

        function validateStep1() {

            const name =
                document.getElementById(
                    "pName"
                );


            const company =
                document.getElementById(
                    "pCompany"
                );


            if (
                !name ||
                !name.value.trim()
            ) {

                alert(
                    "Project Name wajib diisi."
                );

                if (name) {

                    name.focus();

                }

                return false;

            }


            if (
                !company ||
                !company.value.trim()
            ) {

                alert(
                    "Company / Client wajib diisi."
                );

                if (company) {

                    company.focus();

                }

                return false;

            }


            return true;

        }


        /* =================================================
           VALIDATE STEP 2
        ================================================= */

        function validateStep2() {

            const start =
                document.getElementById(
                    "pStart"
                );


            const end =
                document.getElementById(
                    "pEnd"
                );


            if (
                !start ||
                !start.value
            ) {

                alert(
                    "Start Date wajib diisi."
                );

                if (start) {

                    start.focus();

                }

                return false;

            }


            if (
                !end ||
                !end.value
            ) {

                alert(
                    "End Date wajib diisi."
                );

                if (end) {

                    end.focus();

                }

                return false;

            }


            if (
                new Date(
                    end.value
                ) <
                new Date(
                    start.value
                )
            ) {

                alert(
                    "End Date tidak boleh lebih awal dari Start Date."
                );

                end.focus();

                return false;

            }


            return true;

        }


        /* =================================================
           UPDATE REVIEW
        ================================================= */

        function updateReview() {

            const name =
                document.getElementById(
                    "pName"
                )?.value ||
                "-";


            const company =
                document.getElementById(
                    "pCompany"
                )?.value ||
                "-";


            const type =
                document.getElementById(
                    "pType"
                )?.value ||
                "-";


            const start =
                document.getElementById(
                    "pStart"
                )?.value ||
                "-";


            const end =
                document.getElementById(
                    "pEnd"
                )?.value ||
                "-";


            const reviewName =
                document.getElementById(
                    "rName"
                );


            const reviewCompany =
                document.getElementById(
                    "rCompany"
                );


            const reviewType =
                document.getElementById(
                    "rType"
                );


            const reviewSchedule =
                document.getElementById(
                    "rSchedule"
                );


            if (reviewName) {

                reviewName.textContent =
                    name;

            }


            if (reviewCompany) {

                reviewCompany.textContent =
                    company;

            }


            if (reviewType) {

                reviewType.textContent =
                    type;

            }


            if (reviewSchedule) {

                reviewSchedule.textContent =
                    start +
                    " - " +
                    end;

            }

        }


        /* =================================================
           GENERATE PROJECT CODE
        ================================================= */

        function generateProjectCode() {

            const timestamp =
                Date.now()
                    .toString()
                    .slice(-7);


            return (
                "PRJ-" +
                timestamp
            );

        }


        /* =================================================
           CHECK UUID
        ================================================= */

        function isUUID(value) {

            if (
                typeof value !==
                "string"
            ) {

                return false;

            }


            return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                value
            );

        }


        /* =================================================
           WAIT FOR DATA SERVICE
        ================================================= */

        async function waitForDataService() {

            let attempts = 0;

            const maxAttempts = 100;


            while (
                typeof DataService ===
                    "undefined" &&
                attempts <
                    maxAttempts
            ) {

                await new Promise(
                    function (resolve) {

                        setTimeout(
                            resolve,
                            100
                        );

                    }
                );


                attempts++;

            }


            if (
                typeof DataService ===
                "undefined"
            ) {

                throw new Error(
                    "DataService tidak tersedia. Pastikan data-service.js dimuat sebelum project-create.js."
                );

            }


            console.log(
                "[PROJECT CREATE] DataService ready"
            );


            return DataService;

        }


        /* =================================================
           WAIT FOR SUPABASE CLIENT
        ================================================= */

        async function waitForSupabaseClient() {

            let attempts = 0;

            const maxAttempts = 100;


            while (
                typeof supabaseClient ===
                    "undefined" &&
                attempts <
                    maxAttempts
            ) {

                await new Promise(
                    function (resolve) {

                        setTimeout(
                            resolve,
                            100
                        );

                    }
                );


                attempts++;

            }


            if (
                typeof supabaseClient ===
                "undefined"
            ) {

                throw new Error(
                    "Supabase client tidak tersedia. Pastikan supabase-client.js dimuat sebelum project-create.js."
                );

            }


            console.log(
                "[PROJECT CREATE] Supabase client ready"
            );


            return supabaseClient;

        }


        /* =================================================
           CREATE PROJECT
        ================================================= */

        async function createProject() {

            try {

                console.log(
                    "[PROJECT CREATE] Creating project..."
                );


                /* =========================================
                   VALIDATE SELECTED ASSESSMENTS
                ========================================= */

                if (
                    !Array.isArray(
                        selectedAssessments
                    ) ||
                    selectedAssessments.length === 0
                ) {

                    alert(
                        "Tidak ada assessment yang dipilih. Silakan kembali ke Assessment Catalog."
                    );

                    return false;

                }


                /* =========================================
                   WAIT DEPENDENCIES
                ========================================= */

                await waitForDataService();

                await waitForSupabaseClient();


                /* =========================================
                   GET FORM DATA
                ========================================= */

                const nameElement =
                    document.getElementById(
                        "pName"
                    );


                const companyElement =
                    document.getElementById(
                        "pCompany"
                    );


                const typeElement =
                    document.getElementById(
                        "pType"
                    );


                const startElement =
                    document.getElementById(
                        "pStart"
                    );


                const endElement =
                    document.getElementById(
                        "pEnd"
                    );


                if (
                    !nameElement ||
                    !companyElement ||
                    !typeElement ||
                    !startElement ||
                    !endElement
                ) {

                    throw new Error(
                        "Form project tidak lengkap. Periksa ID pName, pCompany, pType, pStart, dan pEnd."
                    );

                }


                const projectName =
                    nameElement.value.trim();


                const company =
                    companyElement.value.trim();


                const projectType =
                    typeElement.value;


                const startDate =
                    startElement.value;


                const endDate =
                    endElement.value;


                /* =========================================
                   VALIDATE FORM
                ========================================= */

                if (!projectName) {

                    alert(
                        "Project Name wajib diisi."
                    );

                    nameElement.focus();

                    return false;

                }


                if (!company) {

                    alert(
                        "Company / Client wajib diisi."
                    );

                    companyElement.focus();

                    return false;

                }


                if (!startDate) {

                    alert(
                        "Start Date wajib diisi."
                    );

                    startElement.focus();

                    return false;

                }


                if (!endDate) {

                    alert(
                        "End Date wajib diisi."
                    );

                    endElement.focus();

                    return false;

                }


                if (
                    new Date(endDate) <
                    new Date(startDate)
                ) {

                    alert(
                        "End Date tidak boleh lebih awal dari Start Date."
                    );

                    endElement.focus();

                    return false;

                }


                /* =========================================
                   GENERATE PROJECT CODE
                ========================================= */

                const projectCode =
                    generateProjectCode();


                /* =========================================
                   PREPARE PROJECT DATA
                ========================================= */

                const projectData = {

                    project_code:
                        projectCode,

                    name:
                        projectName,

                    project_name:
                        projectName,

                    company:
                        company,

                    client:
                        company,

                    project_type:
                        projectType,

                    status:
                        "Draft",

                    start_date:
                        startDate,

                    end_date:
                        endDate,

                    schedule:
                        startDate +
                        " - " +
                        endDate,

                    raw_data: {

                        assessments:
                            selectedAssessments

                    }

                };


                console.log(
                    "[PROJECT CREATE] Project payload:",
                    projectData
                );


                /* =========================================
                   STEP 1
                   CREATE PROJECT IN SUPABASE
                ========================================= */

                const createdProject =
                    await DataService.createProject(
                        projectData
                    );


                console.log(
                    "[PROJECT CREATE] Project created:",
                    createdProject
                );


                /* =========================================
                   IMPORTANT:
                   PROJECT DETAIL MUST USE UUID
                ========================================= */

                if (
                    !createdProject
                ) {

                    throw new Error(
                        "Supabase tidak mengembalikan data project."
                    );

                }


                const projectId =
                    createdProject.id;


                if (
                    !projectId
                ) {

                    throw new Error(
                        "Project berhasil dibuat tetapi UUID project tidak ditemukan."
                    );

                }


                if (
                    !isUUID(projectId)
                ) {

                    throw new Error(
                        "UUID project tidak valid: " +
                        projectId
                    );

                }


                console.log(
                    "[PROJECT CREATE] SUPABASE UUID:",
                    projectId
                );


                console.log(
                    "[PROJECT CREATE] PROJECT CODE:",
                    createdProject.project_code
                );


                /* =========================================
                   STEP 2
                   PREPARE PROJECT ASSESSMENTS
                ========================================= */

                const assessmentRows =
                    selectedAssessments.map(
                        function (assessment) {

                            /*
                               Assessment ID dari catalog
                               dipertahankan apa adanya.

                               Data lengkap juga disimpan
                               di raw_data sehingga informasi
                               assessment tidak hilang.
                            */

                            return {

                                project_id:
                                    projectId,

                                assessment_id:
                                    assessment.id,

                                assessment_name:
                                    assessment.name ||
                                    assessment.assessment_name ||
                                    "-",

                                schedule_date:
                                    startDate,

                                duration:
                                    parseInt(
                                        assessment.duration
                                    ) || 0,

                                status:
                                    "active",

                                raw_data:
                                    assessment

                            };

                        }
                    );


                console.log(
                    "[PROJECT CREATE] Assessment rows:",
                    assessmentRows
                );


                /* =========================================
                   STEP 3
                   SAVE PROJECT ASSESSMENTS
                ========================================= */

                if (
                    assessmentRows.length >
                    0
                ) {

                    const {
                        data:
                            savedAssessments,
                        error:
                            assessmentError
                    } = await supabaseClient
                        .from(
                            "project_assessments"
                        )
                        .insert(
                            assessmentRows
                        )
                        .select();


                    if (
                        assessmentError
                    ) {

                        console.error(
                            "[PROJECT CREATE] Failed to save project assessments:",
                            assessmentError
                        );


                        /*
                           Project sudah berhasil dibuat.
                           Jangan menghapus sessionStorage
                           agar user masih bisa retry.
                        */

                        throw new Error(
                            "Project berhasil dibuat, tetapi assessment gagal disimpan: " +
                            (
                                assessmentError.message ||
                                "Unknown assessment error"
                            )
                        );

                    }


                    console.log(
                        "[PROJECT CREATE] Assessments saved:",
                        savedAssessments
                    );

                }


                /* =========================================
                   STEP 4
                   CLEAR TEMP STORAGE
                ========================================= */

                sessionStorage.removeItem(
                    SELECTED_ASSESSMENTS_KEY
                );


                console.log(
                    "[PROJECT CREATE] Temporary assessments cleared"
                );


                /* =========================================
                   SUCCESS
                ========================================= */

                alert(
                    "Project berhasil dibuat dengan " +
                    selectedAssessments.length +
                    " assessment!"
                );


                /* =========================================
                   STEP 5
                   REDIRECT USING SUPABASE UUID
                ========================================= */

                const redirectUrl =
                    "project-detail.html?id=" +
                    encodeURIComponent(
                        projectId
                    );


                console.log(
                    "========================================"
                );


                console.log(
                    "[PROJECT CREATE] REDIRECT UUID:",
                    projectId
                );


                console.log(
                    "[PROJECT CREATE] REDIRECT URL:",
                    redirectUrl
                );


                console.log(
                    "========================================"
                );


                /*
                   PENTING:

                   HANYA projectId yang dipakai.

                   BUKAN:
                   createdProject.project_code

                   BUKAN:
                   projectCode
                */

                window.location.href =
                    redirectUrl;


                return true;


            } catch (error) {

                console.error(
                    "[PROJECT CREATE] Failed:",
                    error
                );


                alert(
                    "Gagal membuat project: " +
                    (
                        error.message ||
                        "Unknown error"
                    )
                );


                return false;

            }

        }


        /* =================================================
           NEXT BUTTON
        ================================================= */

        if (nextButton) {

    nextButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();

            /* STEP 1 */

            if (currentStep === 1) {

                if (!validateStep1()) {
                    return;
                }

                showStep(2);
                return;

            }


            /* STEP 2 */

            if (currentStep === 2) {

                if (!validateStep2()) {
                    return;
                }

                updateReview();
                showStep(3);
                return;

            }


            /* STEP 3 */

            if (currentStep === 3) {

                nextButton.disabled = true;

                nextButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Creating...
                `;

                await createProject();

            }

        }
    );

}

                    
        /* =================================================
           PREVIOUS BUTTON
        ================================================= */

        if (prevButton) {

            prevButton.addEventListener(
                "click",
                function () {

                    if (
                        currentStep >
                        1
                    ) {

                        showStep(
                            currentStep - 1
                        );

                    }

                }
            );

        }


        /* =================================================
           CLOSE MODAL
        ================================================= */

        function closeModal() {

            if (modal) {

                modal.classList.remove(
                    "show"
                );

                modal.classList.remove(
                    "active"
                );

            }


            currentStep = 1;


            showStep(1);

        }


        /* =================================================
           CANCEL BUTTON
        ================================================= */

        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    closeModal();

                }
            );

        }


        /* =================================================
           CLOSE BUTTON
        ================================================= */

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    closeModal();

                }
            );

        }


        /* =================================================
           INITIAL STATE
        ================================================= */

        showStep(1);


        console.log(
            "[PROJECT CREATE] Ready"
        );

    }
);