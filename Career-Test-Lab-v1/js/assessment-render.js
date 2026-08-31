/* ==========================================================
   TalentScope Enterprise
   Assessment Render Engine
========================================================== */


/* ==========================================================
   CHECK STATUS ASSESSMENT
========================================================== */

function isAssessmentActive(item){

    return (
        item.active === true ||
        item.active === "true" ||
        item.status === true ||
        item.status === "true" ||
        item.status === "Active" ||
        item.status === "active"
    );

}


/* ==========================================================
   UPDATE STATISTICS CARD
========================================================== */

function updateAssessmentStatistics(data = assessments){

    const list = Array.isArray(data)
        ? data
        : [];


    /* ------------------------------------------------------
       TOTAL ASSESSMENT
    ------------------------------------------------------ */

    const totalAssessment =
        list.length;


    /* ------------------------------------------------------
       ACTIVE ASSESSMENT
    ------------------------------------------------------ */

    const activeAssessment =
        list.filter(item =>
            isAssessmentActive(item)
        ).length;


    /* ------------------------------------------------------
       TOTAL DURATION
    ------------------------------------------------------ */

    const totalDuration =
        list.reduce((total, item) => {

            return total + (
                Number(item.duration) || 0
            );

        }, 0);


    /* ------------------------------------------------------
       TOTAL CATEGORY
    ------------------------------------------------------ */

    const categorySet =
        new Set();

    list.forEach(item => {

        const category =
            String(
                item.category || ""
            ).trim();

        if(category){

            categorySet.add(category);

        }

    });


    const totalCategory =
        categorySet.size;


    /* ------------------------------------------------------
       UPDATE HTML
    ------------------------------------------------------ */

    const totalAssessmentEl =
        document.getElementById(
            "totalAssessment"
        );


    const activeAssessmentEl =
        document.getElementById(
            "activeAssessment"
        );


    const totalDurationEl =
        document.getElementById(
            "totalDuration"
        );


    const totalCategoryEl =
        document.getElementById(
            "totalCategory"
        );


    if(totalAssessmentEl){

        totalAssessmentEl.textContent =
            totalAssessment;

    }


    if(activeAssessmentEl){

        activeAssessmentEl.textContent =
            activeAssessment;

    }


    if(totalDurationEl){

        totalDurationEl.textContent =
            totalDuration;

    }


    if(totalCategoryEl){

        totalCategoryEl.textContent =
            totalCategory;

    }

}


/* ==========================================================
   RENDER ASSESSMENTS TABLE
========================================================== */

function renderAssessments(data = assessments){

    const tbody =
        document.getElementById(
            "assessmentTable"
        );


    /*
       Tetap update card walaupun
       table tidak ditemukan.
    */

    updateAssessmentStatistics(data);


    if(!tbody) return;


    tbody.innerHTML = "";


    /* ======================================================
       EMPTY STATE
    ====================================================== */

    if(!Array.isArray(data) || data.length === 0){

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    style="
                        text-align:center;
                        padding:60px;
                    "
                >

                    No assessment found

                </td>

            </tr>

        `;

        return;

    }


    /* ======================================================
       RENDER DATA
    ====================================================== */

    data.forEach((item,index)=>{


        /*
           SUPPORT BOTH:

           questions
           question
        */

        const questionCount =
            item.questions ??
            item.question ??
            0;


        /*
           SUPPORT BOTH:

           active
           status
        */

        const active =
            isAssessmentActive(item);


        const statusText =
            active
                ? "Active"
                : "Inactive";


        /*
           CATEGORY
        */

        const category =
            item.category || "";


        const categoryClass =
            category
                .toLowerCase()
                .replace(/\s+/g,"-");


        tbody.innerHTML += `

        <tr>


            <!-- CHECKBOX -->

            <td>

                <input
                    type="checkbox"
                    class="assessment-check"
                    data-id="${item.id}"
                >

            </td>


            <!-- CODE -->

            <td>

                <strong>
                    ${item.code || "-"}
                </strong>

            </td>


            <!-- ASSESSMENT NAME -->

            <td>

                <div class="assessment-name">

                    <h4>
                        ${item.name || "-"}
                    </h4>

                    <small>
                        ${item.description || ""}
                    </small>

                </div>

            </td>


            <!-- CATEGORY -->

            <td>

                <span
                    class="
                        badge
                        ${categoryClass}
                    "
                >

                    ${category}

                </span>

            </td>


            <!-- DURATION -->

            <td>

                ${item.duration || 0}
                Minutes

            </td>


            <!-- QUESTIONS -->

            <td>

                ${questionCount}
                Items

            </td>


            <!-- STATUS -->

            <td>

                <span
                    class="
                        status
                        ${active ? "active" : "inactive"}
                    "
                >

                    ${statusText}

                </span>

            </td>


            <!-- ACTION -->

            <td>

                <div class="action-buttons">


                    <button
                        class="editAssessment"
                        data-id="${item.id}"
                        type="button"
                    >

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        class="
                            delete
                            deleteAssessment
                        "
                        data-id="${item.id}"
                        type="button"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>


                </div>

            </td>


        </tr>

        `;

    });


    /* ======================================================
       CHECKBOX EVENT
    ====================================================== */

    document
        .querySelectorAll(
            ".assessment-check"
        )
        .forEach(check => {

            check.addEventListener(
                "change",
                updateSelectedCounter
            );

        });


    /* ======================================================
       UPDATE SELECTED COUNTER
    ====================================================== */

    if(
        typeof updateSelectedCounter ===
        "function"
    ){

        updateSelectedCounter();

    }

}


/* ==========================================================
   AUTO UPDATE CARD + TABLE
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        /*
           assessment-data.js harus sudah
           dimuat sebelum renderer ini.
        */

        if(
            typeof assessments !==
            "undefined"
        ){

            updateAssessmentStatistics(
                assessments
            );

            renderAssessments(
                assessments
            );

        }

    }
);