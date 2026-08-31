/* ==========================================================
   CAREER TEST LAB
   Dashboard Controller
   Version 1.1.0
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadStatistics();

    animateProgressBars();

    animateDashboard();

    updateDashboardProgress();

});


/* ==========================================================
   LOAD STATISTICS
========================================================== */

function loadStatistics(){

    const cards = document.querySelectorAll(".stat-card h3");

    if(cards.length < 4) return;

    animateValue(
        cards[0],
        dashboardData.statistics.assessments,
        ""
    );

    animateValue(
        cards[1],
        dashboardData.statistics.participants,
        ""
    );

    animateValue(
        cards[2],
        dashboardData.statistics.progress,
        "%"
    );

    animateValue(
        cards[3],
        dashboardData.statistics.duration,
        " m"
    );

}


/* ==========================================================
   COUNTER ANIMATION
========================================================== */

function animateValue(element, endValue, suffix=""){

    let startValue = 0;

    const duration = 1800;

    const stepTime = 16;

    const increment = endValue / (duration / stepTime);

    const timer = setInterval(()=>{

        startValue += increment;

        if(startValue >= endValue){

            startValue = endValue;

            clearInterval(timer);

        }

        element.textContent =
            Math.floor(startValue) + suffix;

    }, stepTime);

}

/* ==========================================================
   PROGRESS BAR ANIMATION
   Version 1.0
========================================================== */

function animateProgressBars(){

    const progressBars = document.querySelectorAll(
        ".progress-fill, .hero-progress-fill"
    );

    progressBars.forEach(bar=>{

        const target = bar.dataset.progress;

        if(!target) return;

        bar.style.width = "0%";

        setTimeout(()=>{

            bar.style.width = target + "%";

        },250);

    });

}

/* ==========================================================
   DASHBOARD ENTRANCE ANIMATION
========================================================== */

function animateDashboard(){

    const elements = document.querySelectorAll(
        ".hero, .stat-card, .panel"
    );

    elements.forEach((element,index)=>{

        element.style.opacity="0";

        element.style.transform="translateY(30px)";

        setTimeout(()=>{

            element.style.transition=
                "all .6s ease";

            element.style.opacity="1";

            element.style.transform=
                "translateY(0)";

        },index*120);

    });

}

function updateDashboardProgress() {

    let projects = [];

    try {

        const stored =
            localStorage.getItem("talentscope_projects");

        if (stored) {
            projects = JSON.parse(stored);
        }

    } catch (error) {

        console.error(
            "Gagal membaca project:",
            error
        );

        projects = [];

    }


    // =========================================
    // KUMPULKAN SEMUA PESERTA
    // =========================================

    let participants = [];

    projects.forEach(project => {

        if (
            Array.isArray(project.participants)
        ) {

            participants.push(
                ...project.participants
            );

        }

    });


    const totalParticipants =
        participants.length;


    // =========================================
    // HITUNG PESERTA SELESAI
    // =========================================

    const completedParticipants =
        participants.filter(
            participant =>
                participant.status === "Completed"
        ).length;


    // =========================================
    // HITUNG PROGRESS
    // =========================================

    let progress = 0;

    if (totalParticipants > 0) {

        progress =
            Math.round(
                (
                    completedParticipants /
                    totalParticipants
                ) * 100
            );

    }


    // =========================================
    // UPDATE PROGRESS BAR
    // =========================================

    const progressFill =
        document.getElementById(
            "heroProgressFill"
        );

    if (progressFill) {

        progressFill.style.width =
            progress + "%";

    }


    // =========================================
    // UPDATE TEXT
    // =========================================

    const progressText =
        document.getElementById(
            "heroProgressText"
        );

    if (progressText) {

        progressText.textContent =
            progress + "% Complete";

    }


    const participantText =
        document.getElementById(
            "heroParticipantText"
        );

    if (participantText) {

        participantText.textContent =
            totalParticipants +
            " Peserta";

    }

}

