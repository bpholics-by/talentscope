/* ==========================================================
   TalentScope Enterprise
   Assessment Modal
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("assessmentModal");

    const openBtn = document.getElementById("addAssessmentBtn");

    const closeBtn = document.getElementById("closeAssessmentModal");

    const cancelBtn = document.getElementById("cancelAssessment");

    // ===========================
    // OPEN MODAL
    // ===========================

    if (openBtn && modal) {

        openBtn.addEventListener("click", () => {

            modal.classList.add("show");

        });

    }

    // ===========================
    // CLOSE BUTTON
    // ===========================

    if (closeBtn && modal) {

        closeBtn.addEventListener("click", () => {

            modal.classList.remove("show");

        });

    }

    // ===========================
    // CANCEL BUTTON
    // ===========================

    if (cancelBtn && modal) {

        cancelBtn.addEventListener("click", () => {

            modal.classList.remove("show");

        });

    }

    // ===========================
    // CLICK OUTSIDE
    // ===========================

    if (modal) {

        modal.addEventListener("click", (e) => {

            if (e.target === modal) {

                modal.classList.remove("show");

            }

        });

    }

});