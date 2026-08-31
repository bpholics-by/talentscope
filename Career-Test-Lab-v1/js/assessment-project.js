/* ==========================================================
   ASSESSMENT PROJECT
   TalentScope Enterprise
========================================================== */


/* ==========================================================
   GLOBAL DATA
========================================================== */

let selectedAssessments = [];


/* ==========================================================
   LOAD SELECTED ASSESSMENTS
========================================================== */

function loadSelectedAssessments() {

    const data = localStorage.getItem("selectedAssessments");

    if (!data) {

        selectedAssessments = [];

        return;

    }

    try {

        const parsedData = JSON.parse(data);

        if (Array.isArray(parsedData)) {

            selectedAssessments = parsedData;

        } else {

            selectedAssessments = [];

        }

    } catch (error) {

        console.error(
            "Failed to load selected assessments:",
            error
        );

        selectedAssessments = [];

    }

}


/* ==========================================================
   RENDER SELECTED ASSESSMENTS
========================================================== */

function renderSelectedAssessments() {

    const container =
        document.getElementById(
            "selectedAssessmentList"
        );

    if (!container) {

        console.warn(
            "selectedAssessmentList not found."
        );

        return;

    }

    container.innerHTML = "";


    /* ------------------------------------------------------
       EMPTY STATE
    ------------------------------------------------------ */

    if (selectedAssessments.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-folder-open"></i>

                <h3>No Assessment Selected</h3>

                <p>
                    Please return to Assessment Catalog
                    and select at least one assessment.
                </p>

            </div>

        `;

        return;

    }


    /* ------------------------------------------------------
       RENDER ASSESSMENT
    ------------------------------------------------------ */

    selectedAssessments.forEach((item, index) => {

        const name =
            item.name ||
            item.assessmentName ||
            "Assessment";

        const code =
            item.code ||
            item.assessmentCode ||
            "-";

        const category =
            item.category ||
            "Assessment";

        const duration =
            item.duration ||
            item.durationMinutes ||
            0;


        const assessmentItem =
            document.createElement("div");

        assessmentItem.className =
            "assessment-item";


        assessmentItem.innerHTML = `

            <div class="assessment-info">

                <h4>
                    ${escapeHtml(name)}
                </h4>

                <p>
                    ${escapeHtml(code)}
                </p>

            </div>

            <div class="assessment-meta">

                <span class="badge">

                    ${escapeHtml(category)}

                </span>

                <small>

                    ${duration} Minutes

                </small>

            </div>

        `;


        container.appendChild(
            assessmentItem
        );

    });

}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeHtml(value) {

    if (value === null || value === undefined) {

        return "";

    }

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* ==========================================================
   GET FORM VALUE
========================================================== */

function getValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {

        return "";

    }

    return element.value.trim();

}


/* ==========================================================
   VALIDATE PROJECT
========================================================== */

function validateProject() {

    const projectName =
        getValue("projectName");

    const organization =
        getValue("organization");

    const projectType =
        getValue("projectType");

    const startDate =
        getValue("startDate");

    const endDate =
        getValue("endDate");


    /* ------------------------------------------------------
       PROJECT NAME
    ------------------------------------------------------ */

    if (!projectName) {

        alert(
            "Project Name is required."
        );

        document
            .getElementById("projectName")
            ?.focus();

        return false;

    }


    /* ------------------------------------------------------
       COMPANY / CLIENT
    ------------------------------------------------------ */

    if (!organization) {

        alert(
            "Company / Client is required."
        );

        document
            .getElementById("organization")
            ?.focus();

        return false;

    }


    /* ------------------------------------------------------
       PROJECT TYPE
    ------------------------------------------------------ */

    if (!projectType) {

        alert(
            "Project Type is required."
        );

        document
            .getElementById("projectType")
            ?.focus();

        return false;

    }


    /* ------------------------------------------------------
       START DATE
    ------------------------------------------------------ */

    if (!startDate) {

        alert(
            "Start Date is required."
        );

        document
            .getElementById("startDate")
            ?.focus();

        return false;

    }


    /* ------------------------------------------------------
       END DATE
    ------------------------------------------------------ */

    if (!endDate) {

        alert(
            "End Date is required."
        );

        document
            .getElementById("endDate")
            ?.focus();

        return false;

    }


    /* ------------------------------------------------------
       DATE VALIDATION
    ------------------------------------------------------ */

    const start =
        new Date(startDate);

    const end =
        new Date(endDate);

    if (end < start) {

        alert(
            "End Date cannot be earlier than Start Date."
        );

        document
            .getElementById("endDate")
            ?.focus();

        return false;

    }


    /* ------------------------------------------------------
       ASSESSMENT VALIDATION
    ------------------------------------------------------ */

    if (
        !Array.isArray(selectedAssessments) ||
        selectedAssessments.length === 0
    ) {

        alert(
            "Please select at least one assessment."
        );

        return false;

    }


    return true;

}


/* ==========================================================
   CREATE PROJECT OBJECT
========================================================== */

function buildProjectObject() {

    const project = {

    id: Date.now(),

    /* FIELD UNTUK PROJECT DETAIL */
    name:
        getValue("projectName"),

    company:
        getValue("organization"),

    type:
        getValue("projectType"),

    start:
        getValue("startDate"),

    end:
        getValue("endDate"),

    startTime:
        getValue("startTime"),

    pic:
        getValue("pic"),

    participantTarget:
        getValue("participantTarget"),

    status:
        "Draft",

    participant:
        0,

    participants:
        [],

    assessments:
        [...selectedAssessments],

    createdAt:
        new Date().toISOString()

};


    return project;

}


/* ==========================================================
   SAVE PROJECT
========================================================== */

function saveProject() {

    console.log(
        "Save Assessment Project clicked."
    );


    /* ------------------------------------------------------
       VALIDATE
    ------------------------------------------------------ */

    if (!validateProject()) {

        return;

    }


    /* ------------------------------------------------------
       CREATE PROJECT
    ------------------------------------------------------ */

    const project =
        buildProjectObject();


    console.log(
        "Project to save:",
        project
    );


    /* ------------------------------------------------------
       LOAD EXISTING PROJECTS
    ------------------------------------------------------ */

    let projects = [];

    try {

        projects =
    JSON.parse(
        localStorage.getItem(
            "talentscope_projects"
        )
    ) || [];

    } catch (error) {

        console.error(
            "Failed to read assessmentProjects:",
            error
        );

        projects = [];

    }


    if (!Array.isArray(projects)) {

        projects = [];

    }


    /* ------------------------------------------------------
       ADD PROJECT
    ------------------------------------------------------ */

    projects.push(project);


    /* ------------------------------------------------------
       SAVE PROJECTS
    ------------------------------------------------------ */

    localStorage.setItem(

    "talentscope_projects",

    JSON.stringify(projects)

);


    /* ------------------------------------------------------
       SET CURRENT PROJECT
    ------------------------------------------------------ */

    localStorage.setItem(

        "currentProjectId",

        String(project.id)

    );


    /* ------------------------------------------------------
       CLEAR SELECTED ASSESSMENTS
    ------------------------------------------------------ */

    localStorage.removeItem(
        "selectedAssessments"
    );

    selectedAssessments = [];


    /* ------------------------------------------------------
       SUCCESS MESSAGE
    ------------------------------------------------------ */

    alert(
        "Assessment Project successfully created."
    );


    /* ------------------------------------------------------
       GO TO PROJECT DETAIL
    ------------------------------------------------------ */

    window.location.href =
    "project-detail.html?id=" +
    encodeURIComponent(project.id);

}


/* ==========================================================
   CANCEL PROJECT
========================================================== */

function cancelProject() {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this project?"
        );


    if (!confirmed) {

        return;

    }


    /* ------------------------------------------------------
       REMOVE TEMPORARY ASSESSMENTS
    ------------------------------------------------------ */

    localStorage.removeItem(
        "selectedAssessments"
    );

    selectedAssessments = [];


    /* ------------------------------------------------------
       RETURN TO ASSESSMENT CATALOG
    ------------------------------------------------------ */

    window.location.href =
        "assessment-catalog.html";

}


/* ==========================================================
   UPDATE PAGE HEADER
========================================================== */

function updatePageHeader() {

    const title =
        document.getElementById(
            "pageTitle"
        );

    const subtitle =
        document.getElementById(
            "pageSubtitle"
        );


    if (title) {

        title.textContent =
            "Assessment Project";

    }


    if (subtitle) {

        subtitle.textContent =
            "Create project from selected assessments";

    }

}


/* ==========================================================
   INITIALIZE PAGE
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "assessment-project.js loaded"
        );


        /* --------------------------------------------------
           LOAD SELECTED ASSESSMENTS
        -------------------------------------------------- */

        loadSelectedAssessments();


        console.log(
            "Selected Assessments:",
            selectedAssessments
        );


        /* --------------------------------------------------
           RENDER SELECTED ASSESSMENTS
        -------------------------------------------------- */

        renderSelectedAssessments();


        /* --------------------------------------------------
           UPDATE HEADER
        -------------------------------------------------- */

        updatePageHeader();


        /* --------------------------------------------------
           SAVE BUTTON
        -------------------------------------------------- */

        const saveBtn =
            document.getElementById(
                "saveProject"
            );


        if (saveBtn) {

            saveBtn.addEventListener(
                "click",
                saveProject
            );

        } else {

            console.warn(
                "Save button #saveProject not found."
            );

        }


        /* --------------------------------------------------
           CANCEL BUTTON
        -------------------------------------------------- */

        const cancelBtn =
            document.getElementById(
                "cancelProject"
            );


        if (cancelBtn) {

            cancelBtn.addEventListener(
                "click",
                cancelProject
            );

        } else {

            console.warn(
                "Cancel button #cancelProject not found."
            );

        }

    }
);