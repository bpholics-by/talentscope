/* ==========================================================
   TalentScope Enterprise
   Assessment Manager
========================================================== */

let editMode = false;
let editId = null;
let selectedAssessments = [];

/* ==========================================================
   INITIALIZE
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadAssessment();

    renderAssessments();

    bindSaveButton();

    bindDeleteButton();

    bindEditButton();

    bindCreateProjectButton();

});

/* ==========================================================
   LOAD LOCAL STORAGE
========================================================== */

function loadAssessment(){

    const data = localStorage.getItem("assessments");

    if(data){

        assessments = JSON.parse(data);

    }

}

/* ==========================================================
   SAVE LOCAL STORAGE
========================================================== */

function saveAssessmentStorage(){

    localStorage.setItem(

        "assessments",

        JSON.stringify(assessments)

    );

}

/* ==========================================================
   SAVE BUTTON
========================================================== */

function bindSaveButton(){

    const btn = document.getElementById("saveAssessment");

    if(!btn) return;

    btn.onclick = saveAssessment;

}

/* ==========================================================
   ADD / UPDATE
========================================================== */

function saveAssessment(){

    const code = document.getElementById("assessmentCode").value.trim();

    const name = document.getElementById("assessmentName").value.trim();

    const category = document.getElementById("assessmentCategory").value;

    const duration = Number(

        document.getElementById("assessmentDuration").value

    );

    const question = Number(

        document.getElementById("assessmentQuestion").value

    );

    const status =

        document.getElementById("assessmentStatus").value === "true";

    const description =

        document.getElementById("assessmentDescription").value.trim();

    if(code==="" || name===""){

        alert("Assessment Code dan Assessment Name wajib diisi.");

        return;

    }

    if(editMode){

        const item = assessments.find(a => a.id === editId);

        if(item){

            item.code = code;
            item.name = name;
            item.category = category;
            item.duration = duration;
            item.question = question;
            item.status = status;
            item.description = description;

        }

    }else{

        assessments.push({

            id: Date.now(),

            code,

            name,

            category,

            duration,

            question,

            status,

            description

        });

    }

    saveAssessmentStorage();

    renderAssessments();

    closeModal();

    resetForm();

}

/* ==========================================================
   DELETE
========================================================== */

function bindDeleteButton(){

    document.addEventListener("click",(e)=>{

        const btn=e.target.closest(".deleteAssessment");

        if(!btn) return;

        if(!confirm("Delete this assessment ?")) return;

        const id=Number(btn.dataset.id);

        assessments=assessments.filter(

            item=>item.id!==id

        );

        saveAssessmentStorage();

        renderAssessments();

    });

}

/* ==========================================================
   EDIT
========================================================== */

function bindEditButton(){

    document.addEventListener("click",(e)=>{

        const btn=e.target.closest(".editAssessment");

        if(!btn) return;

        editMode=true;

        editId=Number(btn.dataset.id);

        const item=assessments.find(

            a=>a.id===editId

        );

        if(!item) return;

        document.getElementById("assessmentCode").value=item.code;

        document.getElementById("assessmentName").value=item.name;

        document.getElementById("assessmentCategory").value=item.category;

        document.getElementById("assessmentDuration").value=item.duration;

        document.getElementById("assessmentQuestion").value=item.question;

        document.getElementById("assessmentStatus").value=item.status;

        document.getElementById("assessmentDescription").value=item.description;

        document.getElementById("assessmentModal")

            .classList.add("show");

    });

}

/* ==========================================================
   RESET FORM
========================================================== */

function resetForm(){

    editMode=false;

    editId=null;

    document.getElementById("assessmentCode").value="";

    document.getElementById("assessmentName").value="";

    document.getElementById("assessmentDuration").value=20;

    document.getElementById("assessmentQuestion").value=30;

    document.getElementById("assessmentDescription").value="";

}

/* ==========================================================
   CLOSE MODAL
========================================================== */

function closeModal(){

    document

        .getElementById("assessmentModal")

        .classList.remove("show");

}

document.addEventListener("DOMContentLoaded", () => {

    loadAssessment();

    renderAssessments();

    bindSaveButton();

    bindDeleteButton();

    bindEditButton();

    bindCreateProjectButton();   // tambah ini

});

/* ==========================================================
   CREATE ASSESSMENT PROJECT
========================================================== */

function bindCreateProjectButton(){

    const btn = document.getElementById("createProject");

    if(!btn) return;

    btn.addEventListener("click",()=>{

        const checked = document.querySelectorAll(
            ".assessment-check:checked"
        );

        if(checked.length===0){

            alert("Please select at least one assessment.");

            return;

        }

        const selected = [];

        checked.forEach(item=>{

            const id = Number(item.dataset.id);

            const assessment = assessments.find(a=>a.id===id);

            if(assessment){

                selected.push(assessment);

            }

        });

        localStorage.setItem(

            "selectedAssessments",

            JSON.stringify(selected)

        );

        window.location.href="assessment-project.html";

    });

}

function updateSelectedCounter(){

    const count=document.querySelectorAll(
        ".assessment-check:checked"
    ).length;

    const el=document.getElementById("selectedCount");

    if(el){

        el.textContent=count;

    }

}

document.addEventListener("change",(e)=>{

    if(e.target.classList.contains("assessment-check")){

        updateSelectedCounter();

    }

});

/* ==========================================================
   CREATE PROJECT BUTTON
========================================================== */

function bindCreateProjectButton(){

    const btn = document.getElementById("createProject");

    if(!btn) return;

    btn.addEventListener("click",()=>{

        const checked = document.querySelectorAll(".assessment-check:checked");

        if(checked.length===0){

            alert("Please select at least one assessment.");

            return;

        }

        const selected = [];

        checked.forEach(item=>{

            const id = Number(item.dataset.id);

            const assessment = assessments.find(a=>a.id===id);

            if(assessment){

                selected.push(assessment);

            }

        });

        localStorage.setItem(

            "selectedAssessments",

            JSON.stringify(selected)

        );

        alert(selected.length + " assessment selected.");

        // nanti diganti:
        // window.location.href = "assessment-project.html";

    });

}

/* ==========================================================
   UPDATE SELECTED COUNTER
========================================================== */

function updateSelectedCounter(){

    const total = document.querySelectorAll(
        ".assessment-check:checked"
    ).length;

    document.getElementById("selectedCount").textContent = total;

}

/* ==========================================================
   UPDATE SELECTED
========================================================== */

function updateSelectedCounter(){

    const checked = document.querySelectorAll(".assessment-check:checked");

    selectedAssessments = [];

    checked.forEach(item=>{

        selectedAssessments.push(Number(item.dataset.id));

    });

    document.getElementById("selectedCount").textContent =
        selectedAssessments.length;

    document.getElementById("createProject").disabled =
        selectedAssessments.length === 0;

}

/* ==========================================================
   CREATE PROJECT
========================================================== */

function bindCreateProjectButton(){

    const btn = document.getElementById("createProject");

    if(!btn) return;

    btn.addEventListener("click",()=>{

        if(selectedAssessments.length===0){

            alert("Please select at least one assessment.");

            return;

        }

        const selected = assessments.filter(item=>

            selectedAssessments.includes(item.id)

        );

        localStorage.setItem(

            "selectedAssessments",

            JSON.stringify(selected)

        );

        window.location.href="assessment-project.html";

    });

}

/* ==========================================================
   CREATE ASSESSMENT PROJECT
========================================================== */

function bindCreateProjectButton(){

    const btn = document.getElementById("createProject");

    if(!btn) return;

    btn.addEventListener("click", createAssessmentProject);

}

function createAssessmentProject(){

    const checked = document.querySelectorAll(".assessment-check:checked");

    if(checked.length === 0){

        alert("Please select at least one assessment.");

        return;

    }

    const selectedIds = [];

    checked.forEach(cb=>{

        selectedIds.push(Number(cb.dataset.id));

    });

    localStorage.setItem(

        "selectedAssessments",

        JSON.stringify(selectedIds)

    );

    window.location.href = "assessment-project.html";

}