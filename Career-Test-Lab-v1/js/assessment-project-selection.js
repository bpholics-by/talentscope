/* =========================================================
   ASSESSMENT PROJECT SELECTION

   FLOW:
   Assessment Catalog
        ↓
   Select Assessment
        ↓
   Create Assessment Project
        ↓
   Save Selected Assessment
        ↓
   Redirect Assessment Project
========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    function () {


        console.log(
            "[ASSESSMENT SELECTION] Module loaded"
        );


        /* =================================================
           ELEMENTS
        ================================================= */

        const selectedCount =
            document.getElementById(
                "selectedCount"
            );


        const createProjectBtn =
            document.getElementById(
                "createProjectBtn"
            );


        const assessmentTable =
            document.getElementById(
                "assessmentTable"
            );


        const checkAll =
            document.getElementById(
                "checkAll"
            );


        /* =================================================
   GET SELECTED ASSESSMENTS
================================================= */

function getSelectedAssessments() {

    const selected = [];


    if (!assessmentTable) {

        console.warn(
            "[ASSESSMENT SELECTION] Assessment table not found"
        );

        return selected;

    }


    const checkboxes =
        assessmentTable.querySelectorAll(
            ".assessment-check:checked"
        );


    checkboxes.forEach(
        function (checkbox) {


            const row =
                checkbox.closest("tr");


            if (!row) {

                return;

            }


            /*
               AMBIL SEMUA KOLOM DALAM BARIS
            */

            const columns =
                row.querySelectorAll("td");


            /*
               STRUKTUR KOLOM:

               0 = Checkbox
               1 = Code
               2 = Assessment Name
               3 = Category
               4 = Duration
               5 = Questions
               6 = Status
               7 = Action
            */


            const assessmentId =
                checkbox.dataset.id ||
                "";


            const assessmentCode =
                columns[1]
                    ? columns[1].innerText.trim()
                    : "";


            /*
               Nama assessment di dalam <h4>
            */

            const nameElement =
                columns[2]
                    ? columns[2].querySelector("h4")
                    : null;


            const assessmentName =
                nameElement
                    ? nameElement.innerText.trim()
                    : (
                        columns[2]
                            ? columns[2].innerText.trim()
                            : ""
                    );


            /*
               CATEGORY
            */

            const assessmentCategory =
                columns[3]
                    ? columns[3].innerText.trim()
                    : "";


            /*
               DURATION
            */

            const assessmentDuration =
                columns[4]
                    ? columns[4].innerText.trim()
                    : "";


            /*
               QUESTIONS
            */

            const assessmentQuestions =
                columns[5]
                    ? columns[5].innerText.trim()
                    : "";


            /*
               SIMPAN DATA
            */

            selected.push({

                id: assessmentId,

                code: assessmentCode,

                name: assessmentName,

                category: assessmentCategory,

                duration: assessmentDuration,

                questions: assessmentQuestions

            });


        }
    );


    console.log(
        "[ASSESSMENT SELECTION] Selected data:",
        selected
    );


    return selected;

}
        /* =================================================
           UPDATE SELECTED COUNT
        ================================================= */

        function updateSelectedCount() {

            const selected =
                getSelectedAssessments();


            const count =
                selected.length;


            if (selectedCount) {

                selectedCount.textContent =
                    count +
                    (
                        count === 1
                            ? " assessment selected"
                            : " assessments selected"
                    );

            }


            console.log(
                "[ASSESSMENT SELECTION] Selected:",
                selected
            );

        }


        /* =================================================
           CHECKBOX CHANGE
        ================================================= */

        document.addEventListener(
            "change",
            function (event) {


                const target =
                    event.target;


                if (
                    target.matches(
                        "#assessmentTable input[type='checkbox']"
                    )
                ) {

                    updateSelectedCount();

                }


                /* CHECK ALL */

                if (
                    target.id === "checkAll"
                ) {

                    setTimeout(
                        updateSelectedCount,
                        50
                    );

                }

            }
        );


        /* =================================================
           CREATE PROJECT BUTTON
        ================================================= */

        if (createProjectBtn) {

            createProjectBtn.addEventListener(
                "click",
                function () {


                    const selected =
                        getSelectedAssessments();


                    if (
                        selected.length === 0
                    ) {

                        alert(
                            "Silakan pilih minimal satu assessment terlebih dahulu."
                        );

                        return;

                    }


                    console.log(
                        "[ASSESSMENT SELECTION] Sending assessments:",
                        selected
                    );


                    /*
                       SIMPAN SEMENTARA
                       AGAR DIBACA assessment-project.html
                    */

                    sessionStorage.setItem(

                        "talentscope_selected_assessments",

                        JSON.stringify(
                            selected
                        )

                    );


                    /*
                       REDIRECT
                    */

                    window.location.href =
                        "assessment-project.html";

                }
            );

        }


        /* =================================================
           INITIAL CHECK
        ================================================= */

        setTimeout(
            updateSelectedCount,
            500
        );


        console.log(
            "[ASSESSMENT SELECTION] Ready"
        );


    }
);