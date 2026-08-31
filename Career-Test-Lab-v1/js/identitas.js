/* ==========================================================
   TalentScope Enterprise
   Participant Profile
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ======================================================
       ELEMENT
    ====================================================== */

    const form = document.getElementById("participantForm");

    const assessmentNumber = document.getElementById("assessmentNumber");
    const fullName = document.getElementById("fullName");
    const age = document.getElementById("age");
    const gender = document.getElementById("gender");
    const assessmentDate = document.getElementById("assessmentDate");
    const position = document.getElementById("position");
    const company = document.getElementById("company");
    const phone = document.getElementById("phone");
    

    const btnSave = document.getElementById("btnSave");
    const btnCancel = document.getElementById("btnCancel");


    /* ======================================================
       AUTO ASSESSMENT NUMBER
    ====================================================== */

    const now = new Date();

    const year = now.getFullYear();

    const random = Math.floor(100000 + Math.random() * 900000);

    assessmentNumber.value = `TS-${year}-${random}`;

    // nomor tetap bisa diedit jika diperlukan
    assessmentNumber.readOnly = false;


    /* ======================================================
       AUTO DATE
    ====================================================== */

    assessmentDate.value = now.toISOString().split("T")[0];


    /* ======================================================
       VALIDATION
    ====================================================== */

    function validateForm() {

        let valid = true;

        const fields = [

    assessmentNumber,
    fullName,
    age,
    gender,
    assessmentDate,
    position,
    company,
    phone

];

        fields.forEach(field => {

            field.classList.remove("input-error");

            if (field.value.trim() === "") {

                field.classList.add("input-error");

                valid = false;

            }

        });

        if (!valid) {

            alert("Please complete all required fields.");

        }

        return valid;

    }


    /* ======================================================
       SAVE
    ====================================================== */

    function saveParticipant() {

        if (!validateForm()) {

            return;

        }

        const participant = {

            assessmentNumber: assessmentNumber.value,

            fullName: fullName.value,

            age: age.value,

            gender: gender.value,

            assessmentDate: assessmentDate.value,

            position: position.value,

            company: company.value,

            phone: phone.value,

            
        };

        localStorage.setItem(

            "participantProfile",

            JSON.stringify(participant)

        );

        alert("Participant profile saved successfully.");

        window.location.href = "pilih-tes.html";

    }


    /* ======================================================
       SAVE BUTTON
    ====================================================== */

    btnSave.addEventListener(

        "click",

        saveParticipant

    );


    /* ======================================================
       CANCEL BUTTON
    ====================================================== */

    btnCancel.addEventListener(

        "click",

        () => {

            if (

                confirm("Cancel input participant data?")

            ) {

                history.back();

            }

        }

    );


    /* ======================================================
       REMOVE ERROR WHEN USER TYPES
    ====================================================== */

    [
    assessmentNumber,
    fullName,
    age,
    gender,
    assessmentDate,
    position,
    company,
    phone
]

    .forEach(field => {

        field.addEventListener(

            "input",

            () => {

                field.classList.remove("input-error");

            }

        );

        field.addEventListener(

            "change",

            () => {

                field.classList.remove("input-error");

            }

        );

    });

});