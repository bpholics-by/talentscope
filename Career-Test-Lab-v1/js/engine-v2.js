document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       CAREER TEST LAB
       ENGINE V3
       TES KECERDASAN - SEQUENTIAL MODE
       ===================================================== */


    /* =====================================================
       1. CEK KONFIGURASI
       ===================================================== */

    if (typeof TEST_CONFIG === "undefined") {

        alert("Konfigurasi tes tidak ditemukan.");
        return;

    }


    const testConfig = TEST_CONFIG.intelligence;


    if (!testConfig) {

        alert("Konfigurasi Tes Kecerdasan tidak ditemukan.");
        return;

    }


    /* =====================================================
       2. ELEMENT HTML
       ===================================================== */

    const testTitle =
        document.getElementById("testTitle");

    const timerElement =
        document.getElementById("timer");

    const timerBox =
        document.querySelector(".timer-box");

    const sectionTitle =
        document.getElementById("sectionTitle");

    const questionProgress =
        document.getElementById("questionProgress");

    const progress =
        document.getElementById("progress");

    const questionNumber =
        document.getElementById("questionNumber");

    const questionText =
        document.getElementById("questionText");

    const optionsElement =
        document.getElementById("options");

    const previousBtn =
        document.getElementById("previousBtn");

    const nextBtn =
        document.getElementById("nextBtn");

    const sectionNavigation =
        document.getElementById("sectionNavigation");
/* =====================================================
   TOMBOL KEMBALI KE DASHBOARD
   ===================================================== */

const dashboardButton =
    document.createElement("button");


dashboardButton.type =
    "button";


dashboardButton.className =
    "dashboard-back-btn";





dashboardButton.addEventListener(
    "click",
    function () {

        /*
         * Peserta hanya boleh keluar
         * melalui tombol ini jika memang
         * ingin kembali ke dashboard.
         */

        if (
            document.referrer &&
            document.referrer !==
            window.location.href
        ) {

            window.location.href =
                document.referrer;

        }

        else {

            window.history.back();

        }

    }
);


/*
 * Masukkan tombol ke halaman.
 */

const testHeader =
    document.querySelector(".test-header");


if (testHeader) {

    testHeader.insertBefore(
        dashboardButton,
        testHeader.firstChild
    );

}

    /* =====================================================
       3. STATE
       ===================================================== */

    let sections = [];

    let currentSectionIndex = 0;

    let currentQuestionIndex = 0;

    let remainingSeconds =
        testConfig.duration;

    let timerInterval = null;

    let testFinished = false;


    /*
     * Menyimpan section yang sudah selesai
     */

    let completedSections = [];


    /* =====================================================
       4. MULAI
       ===================================================== */

    loadTest();


    async function loadTest() {

        testTitle.textContent =
            testConfig.title;


        /*
         * Load seluruh bank soal
         */

        for (
            const section
            of testConfig.sections
        ) {

            const questions =
                await loadQuestionBank(section);


            sections.push({

                id:
                    section.id,

                title:
                    section.title,

                questions:
                    questions,

                answers:
                    {}

            });

        }


        console.log(
            "Bank soal berhasil dimuat:",
            sections
        );


        renderSections();

        renderQuestion();

        startTimer();

    }


    /* =====================================================
       5. LOAD BANK SOAL
       ===================================================== */

    function loadQuestionBank(section) {

        return new Promise(function (resolve) {

            const fileMap = {

                verbal:
                    "../data/verbal.js",

                numerik:
                    "../data/numerik.js",

                logika:
                    "../data/logika.js",

                spasial:
                    "../data/spasial.js"

            };


            const variableMap = {

                verbal:
                    "soalVerbal",

                numerik:
                    "soalNumerik",

                logika:
                    "soalLogika",

                spasial:
                    "soalSpasial"

            };


            const file =
                fileMap[section.id];


            const variableName =
                variableMap[section.id];


            if (!file) {

                console.error(
                    "File soal tidak ditemukan:",
                    section.id
                );

                resolve([]);

                return;

            }


            const script =
                document.createElement("script");


            script.src =
                file;


            script.onload =
                function () {

                    let questions = null;


                    if (
                        variableName === "soalVerbal" &&
                        typeof soalVerbal !== "undefined"
                    ) {

                        questions = soalVerbal;

                    }

                    else if (
                        variableName === "soalNumerik" &&
                        typeof soalNumerik !== "undefined"
                    ) {

                        questions = soalNumerik;

                    }

                    else if (
                        variableName === "soalLogika" &&
                        typeof soalLogika !== "undefined"
                    ) {

                        questions = soalLogika;

                    }

                    else if (
                        variableName === "soalSpasial" &&
                        typeof soalSpasial !== "undefined"
                    ) {

                        questions = soalSpasial;

                    }


                    if (
                        Array.isArray(questions)
                    ) {

                        console.log(
                            section.title +
                            " berhasil dimuat:",
                            questions.length +
                            " soal"
                        );


                        resolve(
                            questions
                        );

                    }

                    else {

                        console.error(
                            "Variabel bank soal tidak ditemukan:",
                            variableName
                        );


                        resolve([]);

                    }

                };


            script.onerror =
                function () {

                    console.error(
                        "Gagal memuat:",
                        file
                    );


                    resolve([]);

                };


            document.head.appendChild(
                script
            );

        });

    }


    /* =====================================================
       6. RENDER SUBTES
       ===================================================== */

    function renderSections() {

        sectionNavigation.innerHTML =
            "";


        sections.forEach(
            function (section, index) {

                const button =
                    document.createElement("button");


                button.type =
                    "button";


                button.className =
                    "section-btn";


                button.innerHTML = `

                    <span class="section-status">
                        ${index === 0 ? "●" : "🔒"}
                    </span>

                    <span class="section-label">
                        ${escapeHTML(section.title)}
                    </span>

                `;


                /*
                 * Semua tombol subtes dikunci.
                 *
                 * Peserta TIDAK dapat berpindah
                 * secara manual.
                 */

                button.disabled =
                    true;


                sectionNavigation.appendChild(
                    button
                );

            }
        );


        updateSectionButtons();

    }


    /* =====================================================
       7. UPDATE STATUS SUBTES
       ===================================================== */

    function updateSectionButtons() {

        const buttons =
            sectionNavigation.querySelectorAll(
                ".section-btn"
            );


        buttons.forEach(
            function (button, index) {

                button.classList.remove(
                    "active",
                    "locked",
                    "completed"
                );


                const status =
                    button.querySelector(
                        ".section-status"
                    );


                /*
                 * SUBTES AKTIF
                 */

                if (
                    index ===
                    currentSectionIndex
                ) {

                    button.classList.add(
                        "active"
                    );


                    button.disabled =
                        true;


                    if (status) {

                        status.textContent =
                            "●";

                    }


                    return;

                }


                /*
                 * SUBTES SUDAH SELESAI
                 */

                if (
                    completedSections.includes(
                        index
                    )
                ) {

                    button.classList.add(
                        "completed"
                    );


                    button.disabled =
                        true;


                    if (status) {

                        status.textContent =
                            "✓";

                    }


                    return;

                }


                /*
                 * SUBTES TERKUNCI
                 */

                button.classList.add(
                    "locked"
                );


                button.disabled =
                    true;


                if (status) {

                    status.textContent =
                        "🔒";

                }

            }
        );

    }


    /* =====================================================
       8. RENDER SOAL
       ===================================================== */

    function renderQuestion() {

        const section =
            sections[
                currentSectionIndex
            ];


        if (!section) {
            return;
        }


        const questions =
            section.questions;


        /*
         * Jika bank kosong
         */

        if (
            questions.length === 0
        ) {

            sectionTitle.textContent =
                section.title;


            questionNumber.textContent =
                "-";


            questionProgress.textContent =
                "Bank soal belum tersedia";


            questionText.textContent =
                "Soal untuk bagian ini belum tersedia.";


            optionsElement.innerHTML =
                "";


            updateSectionButtons();

            updateProgress();

            updateNavigation();

            return;

        }


        /*
         * Soal aktif
         */

        const question =
            questions[
                currentQuestionIndex
            ];


        sectionTitle.textContent =
            section.title;


        questionNumber.textContent =
            question.nomor ||
            currentQuestionIndex + 1;


        questionProgress.textContent =
            `Soal ${currentQuestionIndex + 1} dari ${questions.length}`;


        questionText.textContent =
            question.pertanyaan ||
            "";


        renderOptions(
            question,
            section
        );


        updateSectionButtons();

        updateProgress();

        updateNavigation();

    }


    /* =====================================================
       9. RENDER PILIHAN
       ===================================================== */

    function renderOptions(
        question,
        section
    ) {

        optionsElement.innerHTML =
            "";


        const pilihan =
            Array.isArray(
                question.pilihan
            )
                ? question.pilihan
                : [];


        pilihan.forEach(
            function (option, index) {

                const optionElement =
                    document.createElement("div");


                optionElement.className =
                    "option";


                const letter =
                    String.fromCharCode(
                        65 + index
                    );


                optionElement.innerHTML = `

                    <span class="option-letter">
                        ${letter}
                    </span>

                    <span class="option-text">
                        ${escapeHTML(option)}
                    </span>

                `;


                /*
                 * Jawaban yang sudah dipilih
                 */

                const savedAnswer =
                    section.answers[
                        currentQuestionIndex
                    ];


                if (
                    savedAnswer === index
                ) {

                    optionElement.classList.add(
                        "selected"
                    );

                }


                /*
                 * Pilih jawaban
                 */

                optionElement.addEventListener(
                    "click",
                    function () {

                        selectAnswer(
                            section,
                            index
                        );

                    }
                );


                optionsElement.appendChild(
                    optionElement
                );

            }
        );

    }


    /* =====================================================
       10. PILIH JAWABAN
       ===================================================== */

    function selectAnswer(
        section,
        answerIndex
    ) {

        section.answers[
            currentQuestionIndex
        ] =
            answerIndex;


        renderOptions(
            section.questions[
                currentQuestionIndex
            ],
            section
        );

    }


    /* =====================================================
       11. PROGRESS
       ===================================================== */

    function updateProgress() {

        let completedBefore = 0;


        sections.forEach(
            function (section, index) {

                if (
                    index <
                    currentSectionIndex
                ) {

                    completedBefore +=
                        section.questions.length;

                }

            }
        );


        const totalQuestions =
            sections.reduce(
                function (
                    total,
                    section
                ) {

                    return total +
                        section.questions.length;

                },
                0
            );


        const currentPosition =
            completedBefore +
            currentQuestionIndex +
            1;


        let percentage = 0;


        if (
            totalQuestions > 0
        ) {

            percentage =
                (
                    currentPosition /
                    totalQuestions
                ) * 100;

        }


        progress.style.width =
            Math.min(
                percentage,
                100
            ) + "%";

    }


    /* =====================================================
       12. NAVIGASI SOAL
       ===================================================== */

    function updateNavigation() {

        const section =
            sections[
                currentSectionIndex
            ];


        if (!section) {
            return;
        }


        /*
         * Sebelumnya hanya untuk soal
         * dalam subtes yang sama.
         */

        previousBtn.disabled =
            currentQuestionIndex === 0;


        const lastQuestion =
            currentQuestionIndex ===
            section.questions.length - 1;


        const lastSection =
            currentSectionIndex ===
            sections.length - 1;


        if (
            lastQuestion &&
            lastSection
        ) {

            nextBtn.textContent =
                "Selesaikan Tes";

        }

        else if (
            lastQuestion
        ) {

            nextBtn.textContent =
                "Lanjut ke Subtes Berikutnya →";

        }

        else {

            nextBtn.textContent =
                "Berikutnya →";

        }

    }


    /* =====================================================
       13. NEXT
       ===================================================== */

    nextBtn.addEventListener(
        "click",
        function () {

            const section =
                sections[
                    currentSectionIndex
                ];


            if (!section) {
                return;
            }


            /*
             * Jika masih ada soal
             */

            if (
                currentQuestionIndex <
                section.questions.length - 1
            ) {

                currentQuestionIndex++;


                renderQuestion();


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });


                return;

            }


            /*
             * Soal terakhir.
             *
             * Langsung selesaikan subtes.
             */

            completeCurrentSection();

        }
    );


    /* =====================================================
       14. SELESAIKAN SUBTES
       ===================================================== */

    function completeCurrentSection() {

        /*
         * Tandai subtes selesai
         */

        if (
            !completedSections.includes(
                currentSectionIndex
            )
        ) {

            completedSections.push(
                currentSectionIndex
            );

        }


        /*
         * Simpan progres sementara
         */

        saveProgress();


        /*
         * MASIH ADA SUBTES BERIKUTNYA
         */

        if (
            currentSectionIndex <
            sections.length - 1
        ) {

            currentSectionIndex++;

            currentQuestionIndex =
                0;


            updateSectionButtons();


            /*
             * Sedikit jeda agar perpindahan
             * terasa halus dan profesional.
             */

            setTimeout(
                function () {

                    renderQuestion();


                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                },
                300
            );


            return;

        }


        /*
         * SEMUA SUBTES SELESAI
         */

        finishTest(false);

    }


    /* =====================================================
       15. PREVIOUS
       ===================================================== */

    previousBtn.addEventListener(
        "click",
        function () {

            /*
             * Tidak boleh kembali ke
             * subtes sebelumnya.
             */

            if (
                currentQuestionIndex > 0
            ) {

                currentQuestionIndex--;


                renderQuestion();


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }

        }
    );


    /* =====================================================
       16. TIMER
       ===================================================== */

    function startTimer() {

        updateTimer();


        timerInterval =
            setInterval(
                function () {

                    if (
                        remainingSeconds <= 0
                    ) {

                        clearInterval(
                            timerInterval
                        );


                        finishTest(true);


                        return;

                    }


                    remainingSeconds--;


                    updateTimer();

                },
                1000
            );

    }


    function updateTimer() {

        const minutes =
            Math.floor(
                remainingSeconds / 60
            );


        const seconds =
            remainingSeconds % 60;


        timerElement.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


        /*
         * Warning 5 menit terakhir
         */

        if (
            remainingSeconds <= 300
        ) {

            timerBox.classList.add(
                "warning"
            );

        }

    }


    /* =====================================================
       17. SIMPAN PROGRES
       ===================================================== */

    function saveProgress() {

        const progressData = {

            testId:
                testConfig.id,

            currentSection:
                currentSectionIndex,

            completedSections:
                completedSections,

            sections:
                sections.map(
                    function (section) {

                        return {

                            id:
                                section.id,

                            title:
                                section.title,

                            answers:
                                section.answers,

                            totalQuestions:
                                section.questions.length

                        };

                    }
                )

        };


        try {

            localStorage.setItem(
                "careerTestProgress_intelligence",
                JSON.stringify(progressData)
            );

        }

        catch (error) {

            console.error(
                "Gagal menyimpan progres:",
                error
            );

        }

    }


        /* =====================================================
   18. SELESAIKAN TES
===================================================== */

function finishTest(autoFinish) {

    if (testFinished) {
        return;
    }

    testFinished = true;


    /* -------------------------------------------------
       STOP TIMER
    ------------------------------------------------- */

    clearInterval(timerInterval);


    /* -------------------------------------------------
       BUAT RESULT
    ------------------------------------------------- */

    const result = {

        testId:
            testConfig.id,

        testTitle:
            testConfig.title,

        completedAt:
            new Date().toISOString(),

        autoFinish:
            autoFinish,

        sections:
            sections.map(function (section) {

                return {

                    id:
                        section.id,

                    title:
                        section.title,

                    answers:
                        section.answers,

                    totalQuestions:
                        section.questions.length

                };

            })

    };


    /* =================================================
       SIMPAN HASIL LAMA
       Jangan dihapus karena masih digunakan
       oleh sistem Archive v-1
    ================================================= */

    try {

        localStorage.setItem(
            "careerTestResult_intelligence",
            JSON.stringify(result)
        );


        localStorage.setItem(
            "careerTestProgress_intelligence",
            JSON.stringify(result)
        );

    }

    catch (error) {

        console.error(
            "Gagal menyimpan hasil tes:",
            error
        );

    }


    /* =================================================
       SIMPAN KE MASTER RESULT TALENTSCOPE
    ================================================= */

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const projectId =
            params.get("projectId");


        const participantId =
            params.get("participantId");


        if (
            projectId &&
            participantId &&
            typeof saveAssessmentResult === "function"
        ) {

            saveAssessmentResult({

                projectId:
                    projectId,

                participantId:
                    participantId,

                assessmentCode:
                    testConfig.id,

                completed:
                    true,

                completedAt:
                    result.completedAt,

                data:
                    result

            });

        }

        else {

            console.warn(
                "Master result belum disimpan. projectId, participantId, atau saveAssessmentResult tidak tersedia."
            );

        }

    }

    catch (error) {

        console.error(
            "Gagal menyimpan TalentScope result:",
            error
        );

    }


    /* =================================================
       KEMBALI KE DASHBOARD TES
    ================================================= */

    setTimeout(
        function () {

            window.location.href =
                "dashboard.html";

        },
        500
    );

}

    /* =====================================================
       19. ESCAPE HTML
       ===================================================== */

    function escapeHTML(
        value
    ) {

        if (
            typeof value !==
            "string"
        ) {

            return value;

        }


        return value
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }

});