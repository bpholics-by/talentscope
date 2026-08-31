const state = {
    currentQuestion: 0,
    answers: []
};

// Memuat jawaban yang tersimpan
const saved = Storage.load("verbal_answer");

if (saved) {
    state.answers = saved;
}

// Mengambil elemen HTML
const questionText = document.getElementById("questionText");
const options = document.getElementById("options");
const progressBar = document.getElementById("progressBar");
const nomorSoal = document.getElementById("nomorSoal");
const questionGrid = document.getElementById("questionGrid");
const namaPeserta = document.getElementById("namaPeserta");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

// Menampilkan nama peserta
const participant = Participant.get();

if (participant && namaPeserta) {
    namaPeserta.textContent = participant.nama;
}

// Data soal
const questions = soalVerbal;

// ======================
// Render Soal
// ======================
function renderQuestion() {

    const q = questions[state.currentQuestion];

    questionText.textContent = q.pertanyaan;

    nomorSoal.textContent =
        `${state.currentQuestion + 1} / ${questions.length}`;

    options.innerHTML = "";

    q.pilihan.forEach((pilihan, index) => {

        const div = document.createElement("div");

        div.className = "option";
        div.textContent = pilihan;

        if (state.answers[state.currentQuestion] === index) {
            div.classList.add("active");
        }

        div.onclick = () => {

            state.answers[state.currentQuestion] = index;

            Storage.save(
                "verbal_answer",
                state.answers
            );

            renderQuestion();
            renderGrid();
            updateProgress();
        };

        options.appendChild(div);

    });

    // Update tombol
    prevBtn.disabled = state.currentQuestion === 0;

    if (state.currentQuestion === questions.length - 1) {
        nextBtn.textContent = "Selesai";
    } else {
        nextBtn.textContent = "Berikutnya →";
    }

}

// ======================
// Daftar Nomor Soal
// ======================
function renderGrid() {

    questionGrid.innerHTML = "";

    questions.forEach((q, index) => {

        const item = document.createElement("div");

        item.className = "number";
        item.textContent = index + 1;

        if (index === state.currentQuestion) {
            item.classList.add("active");
        }

        if (state.answers[index] != null) {
            item.classList.add("done");
        }

        item.onclick = () => {

            state.currentQuestion = index;

            renderQuestion();
            renderGrid();

        };

        questionGrid.appendChild(item);

    });

}

// ======================
// Progress Bar
// ======================
function updateProgress() {

    const answered =
        state.answers.filter(v => v != null).length;

    progressBar.style.width =
        (answered / questions.length * 100) + "%";

}

// ======================
// Tombol Berikutnya
// ======================
nextBtn.onclick = () => {

    if (state.currentQuestion < questions.length - 1) {

        state.currentQuestion++;

        renderQuestion();
        renderGrid();

    } else {

        const yakin = confirm(
            "Apakah Anda yakin ingin menyelesaikan tes?"
        );

        if (yakin) {
            location.href = "hasil.html";
        }

    }

};

// ======================
// Tombol Sebelumnya
// ======================
prevBtn.onclick = () => {

    if (state.currentQuestion > 0) {

        state.currentQuestion--;

        renderQuestion();
        renderGrid();

    }

};

// ======================
// Shortcut Keyboard
// ======================
document.addEventListener("keydown", (event) => {

    if (event.key === "ArrowRight") {
        nextBtn.click();
    }

    if (event.key === "ArrowLeft") {
        prevBtn.click();
    }

});

// ======================
// Inisialisasi
// ======================
renderQuestion();
renderGrid();
updateProgress();