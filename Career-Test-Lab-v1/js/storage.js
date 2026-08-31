/* ==========================================================
   STORAGE MODULE
   Career Test Lab
========================================================== */

/* ==========================================================
   PARTICIPANT STORAGE
========================================================== */

function getParticipants() {

    return JSON.parse(
        localStorage.getItem("participants")
    ) || [];

}

function saveParticipant(participant) {

    const participants = getParticipants();

    participants.push(participant);

    localStorage.setItem(
        "participants",
        JSON.stringify(participants)
    );

}

/* ==========================================================
   ASSESSMENT RESULT STORAGE
========================================================== */

function getAssessmentResults() {

    return JSON.parse(
        localStorage.getItem("assessment_results")
    ) || [];

}


/* ==========================================================
   SAVE ASSESSMENT RESULT
========================================================== */

function saveAssessmentResult(result) {

    const results =
        getAssessmentResults();


    /* ------------------------------------------
       IDENTITAS HASIL
    ------------------------------------------ */

    const projectId =
        result.projectId || "";

    const participantId =
        result.participantId || "";

    const assessmentCode =
        result.assessmentCode || "";


    /* ------------------------------------------
       CARI HASIL YANG SUDAH ADA
    ------------------------------------------ */

    const existingIndex =
        results.findIndex(function (item) {

            return String(item.projectId) ===
                String(projectId) &&

                String(item.participantId) ===
                String(participantId) &&

                String(item.assessmentCode).toUpperCase() ===
                String(assessmentCode).toUpperCase();

        });


    /* ------------------------------------------
       UPDATE JIKA SUDAH ADA
    ------------------------------------------ */

    if (existingIndex !== -1) {

        results[existingIndex] = result;

    } else {

        results.push(result);

    }


    /* ------------------------------------------
       SIMPAN
    ------------------------------------------ */

    localStorage.setItem(
        "assessment_results",
        JSON.stringify(results)
    );

}


/* ==========================================================
   GET ONE ASSESSMENT RESULT
========================================================== */

function getAssessmentResult(
    projectId,
    participantId,
    assessmentCode
) {

    const results =
        getAssessmentResults();


    return results.find(function (item) {

        return String(item.projectId) ===
            String(projectId) &&

            String(item.participantId) ===
            String(participantId) &&

            String(item.assessmentCode).toUpperCase() ===
            String(assessmentCode).toUpperCase();

    }) || null;

}