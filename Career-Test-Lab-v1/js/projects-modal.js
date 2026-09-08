/* ==========================================
   GENERATE PROJECT CODE
========================================== */

function generateProjectCode() {

    const now = new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    const random =
        Math.floor(
            Math.random() * 9000
        ) + 1000;


    return `PRJ-${year}${month}${day}-${random}`;

}

/* ==========================================
   PROJECT MODAL + SUPABASE SAVE
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("[PROJECT MODAL] Initializing...");


    /* ==========================================
       ELEMENTS
    ========================================== */

    const modal = document.getElementById("projectModal");

    const openButton =
        document.querySelector(".page-header .btn-primary");

    const closeButton =
        document.getElementById("closeModal");

    const cancelButton =
        document.getElementById("cancelProject");

    const saveButton =
        document.getElementById("saveProject");


    /* ==========================================
       OPEN MODAL
    ========================================== */

    if (openButton) {

        openButton.addEventListener("click", () => {

            if (modal) {

                modal.classList.add("show");

            }

        });

    }


    /* ==========================================
       CLOSE MODAL
    ========================================== */

    function closeProjectModal() {

        if (modal) {

            modal.classList.remove("show");

        }

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeProjectModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeProjectModal
        );

    }


    /* ==========================================
       CLOSE WHEN CLICK OUTSIDE
    ========================================== */

    window.addEventListener("click", (event) => {

        if (event.target === modal) {

            closeProjectModal();

        }

    });


    /* ==========================================
       SAVE PROJECT
    ========================================== */

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            async () => {

                console.log(
                    "[PROJECT MODAL] Save button clicked"
                );


                /* ==================================
                   GET FORM VALUES
                ================================== */

                const projectName =
                    document
                        .getElementById("projectName")
                        .value
                        .trim();


                const companyName =
                    document
                        .getElementById("companyName")
                        .value
                        .trim();


                const clientName =
                    document
                        .getElementById("clientName")
                        .value
                        .trim();


                const picName =
                    document
                        .getElementById("picName")
                        .value
                        .trim();


                const startDate =
                    document
                        .getElementById("startDate")
                        .value;


                const endDate =
                    document
                        .getElementById("endDate")
                        .value;


                const participantLimit =
                    document
                        .getElementById("participantLimit")
                        .value;


                /* ==================================
                   VALIDATION
                ================================== */

                if (!projectName) {

                    alert(
                        "Project Name wajib diisi."
                    );

                    return;

                }


                if (!companyName) {

                    alert(
                        "Company wajib diisi."
                    );

                    return;

                }


                /* ==================================
                   CHECK DATA SERVICE
                ================================== */

                if (
                    typeof DataService === "undefined"
                ) {

                    console.error(
                        "[PROJECT MODAL] DataService not found"
                    );

                    alert(
                        "Data service belum tersedia."
                    );

                    return;

                }


                if (
                    typeof DataService.createProject !==
                    "function"
                ) {

                    console.error(
                        "[PROJECT MODAL] createProject function not found"
                    );

                    alert(
                        "Fungsi create project belum tersedia."
                    );

                    return;

                }


                /* ==================================
                   PREPARE DATA
                ================================== */

                const projectData = {

    project_code: generateProjectCode(),

    name: projectName,

    project_name: projectName,

    company: companyName,

    client: clientName || null,

    pic: picName || null,

    project_type: "Assessment",

    status: "Draft",

    start_date:
        startDate
            ? new Date(startDate).toISOString()
            : null,

    end_date:
        endDate
            ? new Date(endDate).toISOString()
            : null,

    raw_data: {

        participant_limit:
            participantLimit
                ? Number(participantLimit)
                : null

    }

};


                console.log(
                    "[PROJECT MODAL] Project data:",
                    projectData
                );


                /* ==================================
                   DISABLE BUTTON
                ================================== */

                const originalButtonHTML =
                    saveButton.innerHTML;


                saveButton.disabled = true;


                saveButton.innerHTML =

                    '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';


                try {


                    /* ==============================
                       SAVE TO SUPABASE
                    ============================== */

                    console.log(
                        "[PROJECT MODAL] Saving to Supabase..."
                    );


                    const newProject =

                        await DataService.createProject(
                            projectData
                        );


                    console.log(
                        "[PROJECT MODAL] Project saved successfully:",
                        newProject
                    );


                    /* ==============================
                       RELOAD PROJECT DATA
                    ============================== */

                    console.log(
                        "[PROJECT MODAL] Reloading projects..."
                    );


                    await loadProjectsFromSupabase();


                    /* ==============================
                       RENDER PROJECT TABLE
                    ============================== */

                    if (
                        typeof renderProjects ===
                        "function"
                    ) {

                        renderProjects();

                    }


                    /* ==============================
                       UPDATE STATISTICS
                    ============================== */

                    if (
                        typeof updateProjectStats ===
                        "function"
                    ) {

                        updateProjectStats();

                    }


                    /* ==============================
                       CLOSE MODAL
                    ============================== */

                    closeProjectModal();


                    /* ==============================
                       RESET FORM
                    ============================== */

                    document
                        .getElementById("projectName")
                        .value = "";


                    document
                        .getElementById("companyName")
                        .value = "";


                    document
                        .getElementById("clientName")
                        .value = "";


                    document
                        .getElementById("picName")
                        .value = "";


                    document
                        .getElementById("startDate")
                        .value = "";


                    document
                        .getElementById("endDate")
                        .value = "";


                    document
                        .getElementById("participantLimit")
                        .value = "";


                    /* ==============================
                       SUCCESS MESSAGE
                    ============================== */

                    alert(
                        "Project berhasil disimpan ke Supabase."
                    );


                }
                catch (error) {


                    console.error(
                        "[PROJECT MODAL] Failed to save project:",
                        error
                    );


                    alert(
                        "Gagal menyimpan project. Silakan cek Console."
                    );


                }
                finally {


                    /* ==============================
                       RESTORE BUTTON
                    ============================== */

                    saveButton.disabled = false;


                    saveButton.innerHTML =
                        originalButtonHTML;


                }


            }
        );

    }


    console.log(
        "[PROJECT MODAL] Initialized successfully"
    );


});