document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("assessmentModal");

    // Fungsi Buka & Tutup Modal
    window.openModal = function() {
        if (modal) modal.style.display = "flex";
    };

    window.closeModal = function() {
        if (modal) {
            modal.style.display = "none";
            // Reset isi input setelah modal ditutup
            const inputs = modal.querySelectorAll("input, textarea");
            inputs.forEach(input => input.value = "");
        }
    };

    // =========================================================
    // EVENT LISTENER GLOBAL (CANCEL, CLOSE, & SAVE)
    // =========================================================
    document.addEventListener("click", (e) => {

        // 1. Tombol Buka Modal (Klik pada "+ Add Assessment")
        if (e.target.closest("#openModalBtn") || e.target.closest(".btn-primary")) {
            const btn = e.target.closest("#openModalBtn") || e.target.closest(".btn-primary");
            // Pastikan bukan tombol save di dalam modal
            if (!btn.closest(".modal-card")) {
                openModal();
            }
        }

        // 2. Tombol Cancel atau Silang (Close)
        if (e.target.closest("#cancelAssessment") || e.target.closest("#closeAssessmentModal")) {
            e.preventDefault();
            closeModal();
        }

        // 3. Klik Backdrop Luar Modal untuk Menutup
        if (e.target === modal) {
            closeModal();
        }

        // 4. Tombol Save Assessment
        if (e.target.closest("#saveAssessment")) {
            e.preventDefault();

            const codeInput = document.getElementById("assessmentCode");
            const nameInput = document.getElementById("assessmentName");

            const code = codeInput ? codeInput.value.trim() : "";
            const name = nameInput ? nameInput.value.trim() : "";

            if (!code || !name) {
                alert("Harap isi Assessment Code dan Assessment Name!");
                return;
            }

            // Ambil nilai sisa input
            const category = document.getElementById("assessmentCategory")?.value || "Cognitive";
            const statusVal = document.getElementById("assessmentStatus")?.value || "true";
            const duration = document.getElementById("assessmentDuration")?.value || "20";
            const questions = document.getElementById("assessmentQuestion")?.value || "30";
            const description = document.getElementById("assessmentDescription")?.value || "";

            // Tambahkan baris baru ke tabel HTML secara langsung
            const tableBody = document.querySelector("tbody");
            if (tableBody) {
                const newRow = document.createElement("tr");
                newRow.innerHTML = `
                    <td><input type="checkbox" class="row-checkbox"></td>
                    <td><strong>${code.toUpperCase()}</strong></td>
                    <td>
                        <div style="font-weight: 600; color: #0f172a;">${name}</div>
                        <small style="color: #64748b;">${description || '-'}</small>
                    </td>
                    <td><span class="badge category-${category.toLowerCase()}">${category}</span></td>
                    <td>${duration} Minutes</td>
                    <td>${questions} Items</td>
                    <td><span class="status-pill ${statusVal === 'true' || statusVal === 'Active' ? 'active' : 'inactive'}">${statusVal === 'true' || statusVal === 'Active' ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="btn-icon edit-btn" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon delete-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tableBody.prepend(newRow); // Masukkan ke posisi paling atas tabel
            }

            alert("Assessment berhasil ditambahkan!");
            closeModal();
        }
    });
});