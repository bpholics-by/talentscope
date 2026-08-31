/* ==========================================================
   TalentScope Enterprise
   Project Assessment Selector
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadAssessmentSelection();

});



/* ==========================================================
   LOAD ASSESSMENT
========================================================== */

function loadAssessmentSelection() {

    const container = document.getElementById("projectAssessmentList");

    if (!container) return;

    if (typeof assessments === "undefined") {

        container.innerHTML = `
            <div class="assessment-empty">

                Assessment data not found.

            </div>
        `;

        return;

    }

    container.innerHTML = "";

    assessments.forEach(item => {

        container.innerHTML += `

<div class="assessment-card">

    <label class="assessment-card-label">

        <input
            type="checkbox"
            class="assessment-check"
            value="${item.code}">

        <div class="assessment-card-content">

            <div class="assessment-top">

                <div class="assessment-icon">

                    ${item.code}

                </div>

                <div>

                    <h4>

                        ${item.name}

                    </h4>

                    <span>

                        ${item.code}

                    </span>

                </div>

            </div>

            <div class="assessment-meta">

                <span>

                    <i class="fa-solid fa-brain"></i>

                    ${item.category}

                </span>

                <span>

                    <i class="fa-regular fa-clock"></i>

                    ${item.duration} Minutes

                </span>

            </div>

        </div>

    </label>

</div>

`;

    });

}