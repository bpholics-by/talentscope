/* ==========================================================
   TALENTSCOPE
   VAP (WORK PERFORMANCE & SUSTAINED ATTENTION) RESULT RENDERER
   ----------------------------------------------------------
   Public API disamakan dengan pola DISCAssessment di disc.js,
   dipanggil dari test-result.js:

       VAPAssessment.render(container, participantResult, assessment)

   `participantResult` adalah object yang disimpan oleh
   speedtest.html ke assessment_result_v3_* / talent_scope_results:

       {
           version, resultType: "VAP",
           projectId, participantId, assessmentIndex, assessmentCode,
           assessmentName,
           scores: { speed, accuracy, stability, endurance,
                      attention, vigilance, s1, s2, b1, b2, medianRT },
           sessions: { 1: {...}, 2: {...} },
           submittedAt
       }

   Gaya visual (warna, radius, spacing) sengaja disamakan
   dengan renderDiscResult() di disc.js dan renderTestResult()
   di papikostik.js supaya ketiga jenis laporan terasa satu
   keluarga desain.
========================================================== */


/* ==========================================================
   HELPERS
========================================================== */

function vapEscapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}


function vapClamp(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) return 0;

    return Math.max(0, Math.min(100, number));

}


function vapMean(list) {

    const valid =
        (list || []).filter(Number.isFinite);

    if (!valid.length) return 0;

    return valid.reduce(function (a, b) { return a + b; }, 0) / valid.length;

}


/* ==========================================================
   VERDICT
   (formula sama dengan verdict() di speedtest.html, supaya
   kesimpulan yang tampil di sini konsisten dengan laporan
   yang dilihat peserta sesaat setelah selesai tes)
========================================================== */

function vapVerdict(d) {

    const core =
        vapMean([
            d.speed,
            d.accuracy,
            d.stability,
            d.endurance,
            d.attention,
            d.vigilance
        ]);

    if (core >= 75 && d.accuracy >= 70) {
        return { label: "Fit", color: "#16a34a", bg: "#dcfce7" };
    }

    if (core >= 60 && d.accuracy >= 55) {
        return { label: "Fit with Reservation", color: "#d97706", bg: "#fef3c7" };
    }

    return { label: "Needs Further Review", color: "#dc2626", bg: "#fee2e2" };

}


/* ==========================================================
   DIMENSION SCORE CARD (bar 0-100)
========================================================== */

function renderVapScoreCard(label, description, value) {

    const score = vapClamp(value);

    const barColor =
        score >= 75 ? "#16a34a" :
        score >= 55 ? "#0075ff" :
        "#dc2626";

    return `

        <div
            style="
                background:#ffffff;
                border:1px solid #e2e8f0;
                border-radius:12px;
                padding:16px 18px;
                box-shadow:0 1px 3px rgba(0,0,0,.05);
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:baseline;
                    margin-bottom:6px;
                "
            >

                <span
                    style="
                        font-weight:700;
                        color:#1e293b;
                        font-size:13.5px;
                    "
                >
                    ${vapEscapeHTML(label)}
                </span>

                <span
                    style="
                        font-weight:800;
                        color:${barColor};
                        font-size:16px;
                    "
                >
                    ${score.toFixed(0)}
                </span>

            </div>

            <div
                style="
                    height:8px;
                    background:#eef2f7;
                    border-radius:99px;
                    overflow:hidden;
                    margin-bottom:8px;
                "
            >

                <div
                    style="
                        height:100%;
                        width:${score}%;
                        background:${barColor};
                        border-radius:99px;
                    "
                ></div>

            </div>

            <p
                style="
                    margin:0;
                    color:#64748b;
                    font-size:11.5px;
                    line-height:1.5;
                "
            >
                ${vapEscapeHTML(description)}
            </p>

        </div>

    `;

}


/* ==========================================================
   SESSION SUMMARY ROW
========================================================== */

function renderVapSessionRow(label, session) {

    const safe = session || {};

    const accuracy =
        Number.isFinite(safe.accuracy) ? safe.accuracy.toFixed(1) + "%" : "-";

    const omission =
        Number.isFinite(safe.omissionRate) ? safe.omissionRate.toFixed(1) + "%" : "-";

    const crpm =
        Number.isFinite(safe.crpm) ? safe.crpm.toFixed(1) : "-";

    const medianRT =
        Number.isFinite(safe.medianRT) ? (safe.medianRT / 1000).toFixed(2) + " sec" : "-";

    return `

        <tr>

            <td style="padding:10px 12px;font-weight:700;color:#1e293b;">
                ${vapEscapeHTML(label)}
            </td>

            <td style="padding:10px 12px;text-align:center;">
                ${safe.answered ?? "-"}
            </td>

            <td style="padding:10px 12px;text-align:center;">
                ${safe.correct ?? "-"}
            </td>

            <td style="padding:10px 12px;text-align:center;">
                ${safe.wrong ?? "-"}
            </td>

            <td style="padding:10px 12px;text-align:center;">
                ${safe.missed ?? "-"}
            </td>

            <td style="padding:10px 12px;text-align:center;">
                ${accuracy}
            </td>

            <td style="padding:10px 12px;text-align:center;">
                ${omission}
            </td>

            <td style="padding:10px 12px;text-align:center;">
                ${crpm}
            </td>

            <td style="padding:10px 12px;text-align:center;">
                ${medianRT}
            </td>

        </tr>

    `;

}


/* ==========================================================
   MAIN RENDER
========================================================== */

function renderVapResult(assessment, participantResult) {

    const container =
        document.getElementById("resultContent");

    if (!container) {
        return;
    }

    const scores =
        participantResult &&
        participantResult.scores &&
        typeof participantResult.scores === "object"
            ? participantResult.scores
            : {};

    const testName =
        (assessment && (assessment.name || assessment.title)) ||
        participantResult?.assessmentName ||
        "VAP Test";

    const verdict = vapVerdict(scores);

    const dimensions = [
        {
            label: "Speed",
            desc: "Kecepatan merespons stimulus secara konsisten.",
            value: scores.speed
        },
        {
            label: "Accuracy",
            desc: "Ketelitian kerja — proporsi jawaban benar.",
            value: scores.accuracy
        },
        {
            label: "Stability",
            desc: "Kestabilan performa dari awal hingga akhir sesi.",
            value: scores.stability
        },
        {
            label: "Endurance",
            desc: "Daya tahan kerja pada durasi tes yang panjang.",
            value: scores.endurance
        },
        {
            label: "Attention",
            desc: "Tingkat konsentrasi & minimnya distraksi.",
            value: scores.attention
        },
        {
            label: "Vigilance",
            desc: "Kewaspadaan terhadap perubahan pola stimulus.",
            value: scores.vigilance
        }
    ];

    container.innerHTML = `

        <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:24px;font-family:inherit;">

            <!-- HEADER -->
            <div
                style="
                    border-bottom:2px solid #0075ff;
                    padding-bottom:16px;
                    margin-bottom:20px;
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    flex-wrap:wrap;
                    gap:10px;
                "
            >

                <div>
                    <h3 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 4px 0;">
                        LAPORAN KINERJA: ${vapEscapeHTML(testName.toUpperCase())}
                    </h3>
                    <p style="font-size:13px;color:#64748b;margin:0;">
                        Work Performance &amp; Sustained Attention Assessment
                    </p>
                </div>

                <span style="background:#e0f2fe;color:#0369a1;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;">
                    Completed
                </span>

            </div>


            <!-- VERDICT -->
            <div
                style="
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    margin-bottom:24px;
                    background:linear-gradient(to bottom,#f8fafc,#f1f5f9);
                    border:1px solid #cbd5e1;
                    border-radius:12px;
                    padding:20px;
                "
            >

                <span style="font-size:11px;font-weight:700;letter-spacing:.6px;color:#64748b;text-transform:uppercase;">
                    Kesimpulan
                </span>

                <span
                    style="
                        margin-top:8px;
                        background:${verdict.bg};
                        color:${verdict.color};
                        font-size:16px;
                        font-weight:800;
                        padding:8px 18px;
                        border-radius:999px;
                    "
                >
                    ${vapEscapeHTML(verdict.label)}
                </span>

            </div>


            <!-- INTRO -->
            <div style="background:#f8fafc;border-left:4px solid #0075ff;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
                <h4 style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">
                    Ringkasan Kinerja
                </h4>
                <p style="font-size:13px;color:#334155;line-height:1.6;margin:0;">
                    Enam dimensi berikut mengukur kecepatan, ketelitian, kestabilan,
                    daya tahan, perhatian, dan kewaspadaan peserta selama dua sesi
                    pengerjaan tes.
                </p>
            </div>


            <!-- 6 DIMENSION GRID -->
            <h4 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:12px;">
                Rincian 6 Dimensi Kinerja
            </h4>

            <div
                style="
                    display:grid;
                    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
                    gap:16px;
                    margin-bottom:24px;
                "
            >
                ${dimensions.map(function (d) {
                    return renderVapScoreCard(d.label, d.desc, d.value);
                }).join("")}
            </div>


            <!-- SESSION TABLE -->
            <h4 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:12px;">
                Ringkasan Per Sesi
            </h4>

            <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:8px;">
                <table style="width:100%;border-collapse:collapse;font-size:12.5px;text-align:left;min-width:640px;">
                    <thead>
                        <tr style="background:#f1f5f9;color:#475569;font-weight:700;">
                            <th style="padding:10px 12px;">Sesi</th>
                            <th style="padding:10px 12px;text-align:center;">Dijawab</th>
                            <th style="padding:10px 12px;text-align:center;">Benar</th>
                            <th style="padding:10px 12px;text-align:center;">Salah</th>
                            <th style="padding:10px 12px;text-align:center;">Terlewat</th>
                            <th style="padding:10px 12px;text-align:center;">Akurasi</th>
                            <th style="padding:10px 12px;text-align:center;">Omission</th>
                            <th style="padding:10px 12px;text-align:center;">CRPM</th>
                            <th style="padding:10px 12px;text-align:center;">Median RT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderVapSessionRow("Sesi 1 — Numerical", scores.s1)}
                        ${renderVapSessionRow("Sesi 2 — Visual Attention", scores.s2)}
                    </tbody>
                </table>
            </div>

        </div>

    `;

}


/* ==========================================================
   VAP ASSESSMENT MODULE
   Public API untuk test-result.js — pola sama dengan
   DISCAssessment di disc.js.
========================================================== */

const VAPAssessment = {

    calculate(participantResult) {
        return participantResult && typeof participantResult === "object"
            ? participantResult
            : {};
    },

    render(container, result, assessment) {
        if (!container) return;

        renderVapResult(
            assessment || {},
            result || {}
        );
    }

};
