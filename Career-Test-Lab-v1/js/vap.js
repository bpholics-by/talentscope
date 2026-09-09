/* ==========================================================
   TALENTSCOPE
   VAP (WORK PERFORMANCE & SUSTAINED ATTENTION) RESULT RENDERER
   ----------------------------------------------------------
   Public API disamakan dengan pola DISCAssessment di disc.js,
   dipanggil dari test-result.js:

       VAPAssessment.calculate(participantResult)
       VAPAssessment.render(container, result, assessment)

   `participantResult` adalah object yang disimpan oleh
   speedtest.html ke assessment_result_v3_* / talent_scope_results:

       {
           version, resultType: "VAP",
           projectId, participantId, assessmentIndex, assessmentCode,
           assessmentName,
           scores: { speed, accuracy, stability, endurance,
                      attention, vigilance, s1, s2, b1, b2, medianRT },
           sessions: { 1: {trials:[...]}, 2: {trials:[...]} },
           submittedAt
       }

   ----------------------------------------------------------
   UPDATE: laporan dibuat lebih lengkap & detail — bukan cuma
   6 kartu skor + tabel sesi, tapi mengikuti struktur laporan
   psikometrik yang sama seperti yang dilihat di speedtest.html
   sendiri (executive summary + narasi kesimpulan, job match
   indicator, pengelompokan Kapasitas Output vs Kualitas &
   Stabilitas, grafik tren performa + radar dimensi, interpretasi
   perilaku per kelompok, deteksi anomali antarblok, dan tabel
   detail jawaban per soal). Formula skor TIDAK diubah — hanya
   presentasi/narasi yang diperluas, supaya kesimpulan yang
   tampil di sini tetap konsisten dengan data yang sama.
========================================================== */


/* ==========================================================
   STYLE (SELF-CONTAINED)
   Disuntik sekali saja, di-scope di bawah ".vap-report" supaya
   tidak bentrok dengan stylesheet test-result.html.
========================================================== */

function vapEnsureStyleInjected() {

    if (document.getElementById("vap-report-style")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "vap-report-style";

    style.textContent = `
        .vap-report{--vblue:#0075ff;--vline:#e2e8f0;--vmuted:#64748b;--vsoft:#f8fafc;font-family:inherit;color:#0f172a}
        .vap-report .vap-card{background:#fff;border:1px solid var(--vline);border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
        .vap-report .vap-eyebrow{font-size:11px;font-weight:800;letter-spacing:1px;color:var(--vblue);text-transform:uppercase}
        .vap-report .vap-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .vap-report .vap-verdict-badge{display:inline-block;padding:8px 16px;border-radius:999px;font-weight:800;font-size:15px;margin-top:8px}
        .vap-report .vap-job-match{display:grid;gap:10px;margin-top:12px}
        .vap-report .vap-match-item{border:1px solid var(--vline);border-radius:10px;padding:12px;background:var(--vsoft)}
        .vap-report .vap-match-head{display:flex;justify-content:space-between;gap:10px;font-size:13px}
        .vap-report .vap-match-bar{height:8px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-top:8px}
        .vap-report .vap-match-bar i{display:block;height:100%;background:var(--vblue)}
        .vap-report .vap-dim-row{padding:10px 0;border-bottom:1px solid var(--vline)}
        .vap-report .vap-dim-row:last-child{border-bottom:0}
        .vap-report .vap-dim-head{display:flex;justify-content:space-between;font-size:13px;font-weight:800}
        .vap-report .vap-dim-sub{font-size:11px;color:var(--vmuted);margin-top:3px}
        .vap-report .vap-bar{height:7px;background:#eef2f7;border-radius:99px;margin-top:10px;overflow:hidden}
        .vap-report .vap-bar i{display:block;height:100%}
        .vap-report .vap-norm-note{font-size:11px;color:var(--vmuted);line-height:1.5;margin:8px 0 0}
        .vap-report .vap-anomaly{margin-top:8px;padding:11px 13px;background:#fffbeb;border-left:4px solid #d97706;border-radius:8px;font-size:12px}
        .vap-report .vap-anomaly-ok{margin-top:8px;padding:11px 13px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;font-size:12px}
        .vap-report canvas{width:100%!important;max-height:300px}
        .vap-report .vap-interpret{display:grid;gap:9px}
        .vap-report .vap-interpret div{background:var(--vsoft);border:1px solid var(--vline);border-radius:10px;padding:13px;line-height:1.6;font-size:13px}
        .vap-report .vap-interpret ul{margin:6px 0 0;padding-left:18px}
        .vap-report .vap-interpret li{margin-bottom:4px}
        .vap-report table{width:100%;border-collapse:collapse;font-size:12.5px}
        .vap-report th,.vap-report td{padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:left}
        .vap-report th{background:#f1f5f9;color:#475569;font-weight:700}
        .vap-report td{text-align:center}
        .vap-report td:first-child{text-align:left;font-weight:700;color:#1e293b}
        .vap-report .vap-section-gap{margin-top:18px}
        .vap-report summary{cursor:pointer;font-weight:700}
        @media(max-width:750px){.vap-report .vap-grid-2{grid-template-columns:1fr}}
    `;

    document.head.appendChild(style);
}


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


function vapCls(x) {
    return x >= 80 ? "Strong" : x >= 65 ? "Adequate" : x >= 50 ? "Developing" : "Needs Further Review";
}


function vapBand(v) {
    return v >= 80 ? "sangat kuat" : v >= 65 ? "baik" : v >= 50 ? "cukup" : v >= 35 ? "perlu penguatan" : "rendah";
}


/* ==========================================================
   VERDICT
   (formula sama dengan verdict() di speedtest.html, supaya
   kesimpulan yang tampil di sini konsisten dengan data skor
   yang sama)
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
        return { label: "Fit", color: "#166534", bg: "#dcfce7" };
    }

    if (core >= 60 && d.accuracy >= 55) {
        return { label: "Fit with Reservation", color: "#92400e", bg: "#fef3c7" };
    }

    return { label: "Needs Further Review", color: "#991b1b", bg: "#fee2e2" };

}


/* ==========================================================
   NARASI PER DIMENSI
   (porting dari causeNarrative()/monitoredNarrative() di
   speedtest.html — label dimensi memakai istilah Indonesia
   yang sama supaya konsisten dengan laporan yang dilihat
   peserta saat pertama kali menyelesaikan tes)
========================================================== */

const VAP_DIMENSION_LABEL = {
    speed: "Kecepatan Kerja",
    accuracy: "Ketelitian Kerja",
    stability: "Stabilitas Kerja",
    endurance: "Endurance",
    attention: "Kontrol Perhatian",
    vigilance: "Vigilance"
};

function vapCauseNarrative(label, val) {

    const strong = vapBand(val) === "sangat kuat" || vapBand(val) === "baik";

    const map = {
        "Kecepatan Kerja": strong
            ? "menunjukkan tempo pemrosesan yang efisien sehingga tuntutan penyelesaian pekerjaan berulang dalam batas waktu cenderung dapat direspons dengan cepat."
            : "menunjukkan tempo pemrosesan yang belum konsisten sehingga pada tuntutan volume kerja tinggi kandidat berpotensi membutuhkan waktu lebih panjang untuk mempertahankan output.",
        "Ketelitian Kerja": strong
            ? "menunjukkan kontrol kualitas respons yang baik sehingga risiko kesalahan pada tugas rutin relatif lebih terkendali."
            : "menunjukkan kualitas respons yang masih perlu dipantau karena peningkatan tempo dapat diikuti kenaikan risiko kesalahan.",
        "Stabilitas Kerja": strong
            ? "menunjukkan konsistensi performa antarblok sehingga kualitas kerja cenderung tetap terjaga ketika tuntutan berlangsung berulang."
            : "menunjukkan fluktuasi performa antarperiode sehingga kualitas output dapat berubah ketika tuntutan kerja berlangsung terus-menerus.",
        "Endurance": strong
            ? "menunjukkan kemampuan mempertahankan performa dari fase awal hingga akhir sehingga kandidat relatif mampu menjaga output pada tugas berdurasi panjang."
            : "menunjukkan penurunan retensi performa sehingga tugas panjang dan repetitif berpotensi menurunkan efektivitas kerja apabila tidak disertai strategi pengaturan fokus.",
        "Kontrol Perhatian": strong
            ? "menunjukkan kemampuan menyaring dan mempertahankan perhatian terhadap stimulus relevan sehingga informasi penting relatif tidak mudah terlewat."
            : "menunjukkan kontrol perhatian yang belum stabil sehingga pada kondisi banyak stimulus atau distraksi terdapat risiko informasi relevan terlewat.",
        "Vigilance": strong
            ? "menunjukkan kewaspadaan yang cukup terpelihara pada tugas monoton sehingga perubahan stimulus tetap dapat dipantau secara konsisten."
            : "menunjukkan kewaspadaan yang mudah menurun pada aktivitas monoton sehingga risiko omission atau penurunan respons perlu menjadi perhatian."
    };

    return map[label] || "";
}

function vapMonitoredNarrative(label) {

    const map = {
        "Kecepatan Kerja": "merupakan salah satu aspek yang relatif lebih rendah dibandingkan dimensi lain, sehingga pada situasi dengan lonjakan volume dan tekanan waktu yang sangat tinggi, konsistensi tempo tetap perlu dipantau.",
        "Ketelitian Kerja": "merupakan aspek yang relatif lebih rendah dibandingkan dimensi lain, sehingga mekanisme pengecekan kualitas tetap penting ketika tuntutan kecepatan meningkat.",
        "Stabilitas Kerja": "relatif lebih rendah dibandingkan dimensi lain, sehingga konsistensi performa tetap perlu diamati pada pekerjaan yang berlangsung panjang dan berulang.",
        "Endurance": "relatif lebih rendah dibandingkan dimensi lain, sehingga kemampuan mempertahankan output pada tugas berkepanjangan perlu dikonfirmasi melalui tuntutan kerja nyata.",
        "Kontrol Perhatian": "relatif lebih rendah dibandingkan dimensi lain, sehingga kemampuan menjaga fokus pada situasi multitugas atau penuh distraksi tetap perlu dipantau.",
        "Vigilance": "relatif lebih rendah dibandingkan dimensi lain, sehingga kewaspadaan pada pekerjaan yang monoton dan repetitif tetap perlu diperhatikan."
    };

    return map[label] || "merupakan aspek yang relatif lebih rendah dibandingkan dimensi lain dan perlu dipantau sesuai tuntutan jabatan.";
}

function vapListConclusion(title, items, mode) {

    const isStrength = mode === "strength";
    const isRisk = mode === "risk";

    const intro = isStrength
        ? "Berdasarkan dimensi yang menunjukkan kapasitas paling menonjol, kandidat memiliki modal perilaku kerja sebagai berikut:"
        : isRisk
            ? "Berdasarkan dimensi yang berada pada kategori pengembangan atau rendah, terdapat area yang berpotensi menjadi hambatan ketika tuntutan kerja meningkat:"
            : "Tidak ditemukan kelemahan yang menonjol secara absolut. Namun, dibandingkan dengan dimensi kandidat lainnya, aspek berikut tetap perlu dipantau sesuai tuntutan jabatan:";

    const itemsHtml = items.map(function (x) {
        const narrative = (isStrength || isRisk) ? vapCauseNarrative(x[0], x[1]) : vapMonitoredNarrative(x[0]);
        return `<li><b>${vapEscapeHTML(x[0])} (${x[1].toFixed(1)})</b> — ${narrative}</li>`;
    }).join("");

    return `<div><b>${title}</b><p style="margin:6px 0 8px">${intro}</p><ul>${itemsHtml}</ul></div>`;

}


/* ==========================================================
   DETEKSI ANOMALI ANTARBLOK
   (porting dari detectAnomalies() di speedtest.html)
========================================================== */

function vapDetectAnomalies(d) {

    const out = [];

    [[1, d.b1 || []], [2, d.b2 || []]].forEach(function (pair) {

        const s = pair[0], b = pair[1];

        for (let i = 1; i < b.length; i++) {

            if (b[i].omissionRate >= 30 && (b[i].omissionRate - b[i - 1].omissionRate) >= 15) {
                out.push(`Anomali: Sesi ${s}, Block ${b[i].block} menunjukkan lonjakan omission/timeout (indikasi sementara loss of focus atau distraksi singkat).`);
            } else if ((b[i - 1].accuracy - b[i].accuracy) >= 25) {
                out.push(`Anomali: Sesi ${s}, Block ${b[i].block} menunjukkan penurunan akurasi tajam.`);
            }
        }
    });

    return out;

}


/* ==========================================================
   DIMENSION ROW (list style, dipakai di kolom Kapasitas
   Output / Kualitas & Stabilitas)
========================================================== */

function vapDimRow(label, value, desc) {

    const score = vapClamp(value);

    const barColor =
        score >= 75 ? "#16a34a" :
        score >= 55 ? "#0075ff" :
        "#dc2626";

    return `
        <div class="vap-dim-row">
            <div class="vap-dim-head"><span>${vapEscapeHTML(label)}</span><span>${score.toFixed(1)}</span></div>
            <div class="vap-dim-sub">${vapEscapeHTML(desc)} • ${vapCls(score)}</div>
            <div class="vap-bar"><i style="width:${score}%;background:${barColor}"></i></div>
        </div>
    `;

}


/* ==========================================================
   DIMENSION SCORE CARD (bar 0-100) — dipertahankan untuk
   kompatibilitas kalau ada pemanggil lama.
========================================================== */

function renderVapScoreCard(label, description, value) {

    const score = vapClamp(value);

    const barColor =
        score >= 75 ? "#16a34a" :
        score >= 55 ? "#0075ff" :
        "#dc2626";

    return `
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;box-shadow:0 1px 3px rgba(0,0,0,.05);">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
                <span style="font-weight:700;color:#1e293b;font-size:13.5px;">${vapEscapeHTML(label)}</span>
                <span style="font-weight:800;color:${barColor};font-size:16px;">${score.toFixed(0)}</span>
            </div>
            <div style="height:8px;background:#eef2f7;border-radius:99px;overflow:hidden;margin-bottom:8px;">
                <div style="height:100%;width:${score}%;background:${barColor};border-radius:99px;"></div>
            </div>
            <p style="margin:0;color:#64748b;font-size:11.5px;line-height:1.5;">${vapEscapeHTML(description)}</p>
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

    const medianRT =
        Number.isFinite(safe.medianRT) ? (safe.medianRT / 1000).toFixed(2) + " sec" : "-";

    return `
        <tr>
            <td>${vapEscapeHTML(label)}</td>
            <td>${safe.correct ?? "-"}</td>
            <td>${safe.wrong ?? "-"}</td>
            <td>${safe.missed ?? "-"}</td>
            <td>${accuracy}</td>
            <td>${medianRT}</td>
        </tr>
    `;

}


/* ==========================================================
   TABEL DETAIL JAWABAN
   (dari raw trials tersimpan di participantResult.sessions;
   diam-diam disembunyikan bila trial mentah tidak tersedia
   pada data lama)
========================================================== */

function renderVapLogRows(sessionsData) {

    if (!sessionsData || typeof sessionsData !== "object") return "";

    const trials1 = (sessionsData[1] && Array.isArray(sessionsData[1].trials)) ? sessionsData[1].trials : [];
    const trials2 = (sessionsData[2] && Array.isArray(sessionsData[2].trials)) ? sessionsData[2].trials : [];

    return trials1.concat(trials2).map(function (t) {
        return `
            <tr>
                <td style="text-align:left;font-weight:400;color:inherit;">${t.number != null ? t.number : "-"}</td>
                <td>S${vapEscapeHTML(t.session)}</td>
                <td>${vapEscapeHTML(t.block)}</td>
                <td>${vapEscapeHTML(t.stimulus)}</td>
                <td>${t.timeout ? "—" : vapEscapeHTML(t.answer)}</td>
                <td>${vapEscapeHTML(t.answerKey)}</td>
                <td>${t.timeout ? "TIMEOUT" : (t.correct ? "BENAR" : "SALAH")}</td>
                <td>${t.responseTimeMs ? (t.responseTimeMs / 1000).toFixed(2) + " sec" : "—"}</td>
            </tr>
        `;
    }).join("");

}


/* ==========================================================
   CHARTS: PERFORMANCE TREND + DIMENSION PROFILE (RADAR)
   (porting dari draw() di speedtest.html, diskop ke elemen
   canvas milik container laporan ini)
========================================================== */

function vapDrawCharts(trendCanvas, radarCanvas, d, anomalies) {

    if (!trendCanvas || !radarCanvas) return;

    const ratio = window.devicePixelRatio || 1;


    /* PERFORMANCE TREND */

    const w = Math.max(280, trendCanvas.clientWidth || 420), h = 280;
    trendCanvas.width = Math.round(w * ratio);
    trendCanvas.height = Math.round(h * ratio);
    trendCanvas.style.height = h + "px";

    const tctx = trendCanvas.getContext("2d");
    tctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    tctx.clearRect(0, 0, w, h);

    const b1 = d.b1 || [], b2 = d.b2 || [];
    const p1 = b1.map(function (x) { return vapClamp(x.accuracy * 0.65 + vapClamp(x.crpm * 20) * 0.35); });
    const p2 = b2.map(function (x) { return vapClamp(x.accuracy * 0.65 + vapClamp(x.crpm * 20) * 0.35); });
    const data = p1.concat(p2);

    const L = 40, R = w - 16, T = 20, B = h - 38;
    tctx.font = "11px sans-serif";

    [0, 25, 50, 75, 100].forEach(function (val) {
        const y = B - val / 100 * (B - T);
        tctx.strokeStyle = "#e2e8f0";
        tctx.lineWidth = 1;
        tctx.beginPath();
        tctx.moveTo(L, y);
        tctx.lineTo(R, y);
        tctx.stroke();
        tctx.fillStyle = "#64748b";
        tctx.fillText(String(val), 6, y + 4);
    });

    if (data.length) {

        tctx.strokeStyle = "#0075ff";
        tctx.lineWidth = 2.5;
        tctx.beginPath();

        data.forEach(function (val, i) {
            const x = data.length === 1 ? (L + R) / 2 : L + i * (R - L) / (data.length - 1);
            const y = B - val / 100 * (B - T);
            i ? tctx.lineTo(x, y) : tctx.moveTo(x, y);
        });

        tctx.stroke();

        data.forEach(function (val, i) {
            const x = data.length === 1 ? (L + R) / 2 : L + i * (R - L) / (data.length - 1);
            const y = B - val / 100 * (B - T);
            tctx.fillStyle = "#0075ff";
            tctx.beginPath();
            tctx.arc(x, y, 3.2, 0, Math.PI * 2);
            tctx.fill();
            tctx.fillStyle = "#64748b";
            tctx.fillText(i < p1.length ? ("S1-B" + (i + 1)) : ("S2-B" + (i - p1.length + 1)), x - 13, B + 16);
        });

    } else {
        tctx.fillStyle = "#64748b";
        tctx.fillText("Data blok belum tersedia.", L, T + 20);
    }

    if (anomalies && anomalies.length) {
        tctx.fillStyle = "#b45309";
        tctx.font = "bold 11px sans-serif";
        tctx.fillText("⚑ Flag anomali terdeteksi — lihat catatan", L, T + 2);
    }


    /* DIMENSION PROFILE (radar) */

    const rw = Math.max(280, radarCanvas.clientWidth || 420), rh = 280;
    radarCanvas.width = Math.round(rw * ratio);
    radarCanvas.height = Math.round(rh * ratio);
    radarCanvas.style.height = rh + "px";

    const rctx = radarCanvas.getContext("2d");
    rctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    rctx.clearRect(0, 0, rw, rh);

    const vals = [d.speed, d.accuracy, d.stability, d.endurance, d.attention, d.vigilance].map(vapClamp);
    const labels = ["Speed", "Accuracy", "Stability", "Endurance", "Attention", "Vigilance"];
    const cx = rw / 2, cy = rh / 2 + 6, rad = Math.min(rw, rh) * 0.28;

    function polygon(arr, fill, stroke, lw) {
        rctx.beginPath();
        arr.forEach(function (v, i) {
            const a = -Math.PI / 2 + i * Math.PI * 2 / 6, rr = rad * v / 100;
            const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
            i ? rctx.lineTo(x, y) : rctx.moveTo(x, y);
        });
        rctx.closePath();
        if (fill) { rctx.fillStyle = fill; rctx.fill(); }
        rctx.strokeStyle = stroke;
        rctx.lineWidth = lw || 1;
        rctx.stroke();
    }

    [25, 50, 75, 100].forEach(function (v) { polygon(Array(6).fill(v), null, "#dbe3ee", 1); });

    for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 6;
        rctx.strokeStyle = "#dbe3ee";
        rctx.beginPath();
        rctx.moveTo(cx, cy);
        rctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        rctx.stroke();
    }

    polygon(Array(6).fill(50), "rgba(100,116,139,.10)", "#94a3b8", 1.2);
    polygon(vals, "rgba(0,117,255,.18)", "#0075ff", 2);

    rctx.font = "10px sans-serif";
    rctx.fillStyle = "#475569";

    labels.forEach(function (l, i) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 6;
        const x = cx + Math.cos(a) * (rad + 26), y = cy + Math.sin(a) * (rad + 26);
        rctx.textAlign = Math.abs(Math.cos(a)) < 0.25 ? "center" : Math.cos(a) > 0 ? "left" : "right";
        rctx.fillText(l, x, y + 3);
    });

    rctx.textAlign = "left";

}


/* ==========================================================
   MAIN RENDER
========================================================== */

function renderVapResult(assessment, participantResult, explicitContainer) {

    const container =
        explicitContainer ||
        document.getElementById("resultContent");

    if (!container) {
        return;
    }

    vapEnsureStyleInjected();

    const scores =
        participantResult &&
        participantResult.scores &&
        typeof participantResult.scores === "object"
            ? participantResult.scores
            : {};

    const hasScores =
        ["speed", "accuracy", "stability", "endurance", "attention", "vigilance"]
            .every(function (k) { return Number.isFinite(scores[k]); });

    const testName =
        (assessment && (assessment.name || assessment.title)) ||
        (participantResult && participantResult.assessmentName) ||
        "Work Performance & Sustained Attention Assessment";

    if (!hasScores) {

        container.innerHTML = `
            <div class="vap-report">
                <div class="vap-card">
                    <h3 style="margin:0 0 6px 0;">${vapEscapeHTML(testName)}</h3>
                    <p style="color:#64748b;font-size:13px;margin:0;">
                        Hasil VAP belum tersedia atau data skor tidak lengkap.
                    </p>
                </div>
            </div>
        `;

        return;
    }


    /* ---------------- KESIMPULAN & NARASI ---------------- */

    const verdict = vapVerdict(scores);

    const dims = Object.keys(VAP_DIMENSION_LABEL)
        .map(function (key) { return [VAP_DIMENSION_LABEL[key], scores[key]]; })
        .sort(function (a, b) { return b[1] - a[1]; });

    const conclusion = verdict.label === "Fit"
        ? "Secara keseluruhan, profil menunjukkan kapasitas kerja yang memadai untuk memenuhi tuntutan tugas terstruktur dengan tempo dan ketelitian yang relatif seimbang."
        : verdict.label === "Fit with Reservation"
            ? "Secara keseluruhan, kandidat memiliki modal kapasitas kerja yang dapat digunakan, namun terdapat ketimpangan pada beberapa dimensi sehingga kesesuaian peran perlu mempertimbangkan tingkat tuntutan kerja dan sistem kontrol kualitas."
            : "Secara keseluruhan, profil menunjukkan beberapa area yang belum cukup kuat untuk dijadikan dasar kesimpulan kesesuaian tanpa data tambahan; keputusan perlu dikonfirmasi melalui metode asesmen lain dan konteks tuntutan jabatan.";

    const strengths = dims.filter(function (x) { return x[1] >= 80; }).slice(0, 2);
    const strengthItems = strengths.length ? strengths : dims.slice(0, 2);

    const riskItems = dims.filter(function (x) { return x[1] < 65; })
        .sort(function (a, b) { return a[1] - b[1]; })
        .slice(0, 2);

    const watchItems = dims.slice(-2).reverse();

    const developmentSection = riskItems.length
        ? vapListConclusion("Area Risiko Perilaku Kerja", riskItems, "risk")
        : vapListConclusion("Area yang Perlu Dipantau", watchItems, "monitor");

    const executiveNarrativeHtml =
        `<div><b>Kesimpulan Asesmen</b><p style="margin:6px 0 0">${conclusion}</p></div>` +
        vapListConclusion("Kekuatan Utama Perilaku Kerja", strengthItems, "strength") +
        developmentSection;


    /* ---------------- JOB MATCH ---------------- */

    const jobs = [
        ["Operational & Fast-Paced Roles", vapClamp(scores.speed * 0.40 + scores.endurance * 0.25 + scores.stability * 0.15 + scores.accuracy * 0.20)],
        ["Quality Control, Finance & Auditor Roles", vapClamp(scores.accuracy * 0.45 + scores.attention * 0.25 + scores.stability * 0.20 + scores.vigilance * 0.10)]
    ];

    const jobMatchHtml = jobs.map(function (x) {
        return `
            <div class="vap-match-item">
                <div class="vap-match-head"><b>${x[0]}</b><strong>${x[1].toFixed(0)}%</strong></div>
                <div class="vap-match-bar"><i style="width:${x[1]}%"></i></div>
            </div>
        `;
    }).join("");


    /* ---------------- BEHAVIORAL INTERPRETATION ---------------- */

    const behavioral = Object.keys(VAP_DIMENSION_LABEL).map(function (key) {
        return [VAP_DIMENSION_LABEL[key], scores[key]];
    });

    const grouped = [
        ["Pola Kapasitas Output", vapMean([scores.speed, scores.endurance]), ["Kecepatan Kerja", "Endurance"]],
        ["Pola Kualitas Kerja", vapMean([scores.accuracy, scores.stability]), ["Ketelitian Kerja", "Stabilitas Kerja"]],
        ["Pola Pengelolaan Perhatian", vapMean([scores.attention, scores.vigilance]), ["Kontrol Perhatian", "Vigilance"]]
    ];

    const interpretHtml = grouped.map(function (g) {

        const title = g[0], val = g[1], parts = g[2];
        const related = behavioral.filter(function (x) { return parts.indexOf(x[0]) !== -1; });
        const high = related.slice().sort(function (a, b) { return b[1] - a[1]; })[0];
        const low = related.slice().sort(function (a, b) { return a[1] - b[1]; })[0];

        return `<div><b>${title} — ${val.toFixed(1)} (${vapCls(val)})</b><br>` +
            `Skor pada kelompok ${parts.join(" dan ")} menunjukkan profil ${vapBand(val)}. ` +
            `${high[0]} menjadi aspek yang relatif lebih dominan karena ${vapCauseNarrative(high[0], high[1])} ` +
            `${low[0] !== high[0] ? "Sementara itu, " + low[0] + " perlu tetap diperhatikan karena " + vapCauseNarrative(low[0], low[1]) : ""}` +
            ` Dengan demikian, implikasi perilaku kerja yang paling mungkin terlihat adalah ${val >= 65 ? "kemampuan mempertahankan tuntutan kerja secara relatif konsisten" : "kebutuhan terhadap struktur kerja, prioritas yang jelas, dan kontrol kualitas agar performa tetap terjaga"}.</div>`;

    }).join("");


    /* ---------------- ANOMALI ---------------- */

    const anomalies = vapDetectAnomalies(scores);

    const anomaliesHtml = anomalies.length
        ? anomalies.map(function (x) { return `<div class="vap-anomaly">${x}</div>`; }).join("")
        : `<div class="vap-anomaly-ok">Tidak ditemukan penurunan tajam yang memenuhi kriteria flag screening antarblok.</div>`;


    /* ---------------- DETAIL JAWABAN (opsional) ---------------- */

    const logRows = renderVapLogRows(participantResult && participantResult.sessions);


    /* ---------------- MARKUP ---------------- */

    container.innerHTML = `
        <div class="vap-report">

            <div class="vap-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;border-bottom:2px solid var(--vblue);border-radius:12px 12px 0 0;">
                <div>
                    <div class="vap-eyebrow">VAP REPORT</div>
                    <h3 style="font-size:18px;font-weight:800;margin:4px 0 4px 0;">${vapEscapeHTML(testName)}</h3>
                    <p style="font-size:13px;color:#64748b;margin:0;">Work Performance &amp; Sustained Attention Assessment</p>
                </div>
                <span style="background:#e0f2fe;color:#0369a1;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;">Completed</span>
            </div>

            <div class="vap-grid-2 vap-section-gap">
                <div class="vap-card">
                    <div class="vap-eyebrow">EXECUTIVE SUMMARY</div>
                    <h3 style="margin:8px 0 0;">${verdict.label}</h3>
                    <span class="vap-verdict-badge" style="background:${verdict.bg};color:${verdict.color};">${verdict.label}</span>
                    <div class="vap-interpret" style="margin-top:14px;">${executiveNarrativeHtml}</div>
                </div>
                <div class="vap-card">
                    <div class="vap-eyebrow">JOB MATCH INDICATOR</div>
                    <div class="vap-job-match">${jobMatchHtml}</div>
                    <p class="vap-norm-note">Indikator kesesuaian peran bersifat decision-support dan perlu diinterpretasikan bersama data asesmen lain.</p>
                </div>
            </div>

            <div class="vap-grid-2 vap-section-gap">
                <div class="vap-card">
                    <h3 style="margin-top:0;">Kapasitas Output (Quantity)</h3>
                    ${vapDimRow("Kecepatan Kerja", scores.speed, "Output benar terintegrasi dengan median waktu respons")}
                    ${vapDimRow("Endurance", scores.endurance, "Kemampuan mempertahankan performa sepanjang tugas")}
                </div>
                <div class="vap-card">
                    <h3 style="margin-top:0;">Kualitas &amp; Stabilitas (Quality)</h3>
                    ${vapDimRow("Ketelitian Kerja", scores.accuracy, "Proporsi respons benar")}
                    ${vapDimRow("Stabilitas Kerja", scores.stability, "Konsistensi performa antarblok")}
                    ${vapDimRow("Kontrol Perhatian", scores.attention, "Pemeliharaan perhatian dan minimnya omission")}
                    ${vapDimRow("Vigilance", scores.vigilance, "Kewaspadaan pada tugas monoton")}
                </div>
            </div>

            <div class="vap-grid-2 vap-section-gap">
                <div class="vap-card">
                    <h3 style="margin-top:0;">Performance Trend</h3>
                    <canvas class="vap-trend-canvas"></canvas>
                    <div class="vap-anomalies">${anomaliesHtml}</div>
                </div>
                <div class="vap-card">
                    <h3 style="margin-top:0;">Dimension Profile</h3>
                    <canvas class="vap-radar-canvas"></canvas>
                    <p class="vap-norm-note">Area transparan menunjukkan benchmark referensi 50 sebagai titik pembanding visual, bukan norma populasi final.</p>
                </div>
            </div>

            <div class="vap-card vap-section-gap">
                <h3 style="margin-top:0;">Behavioral Interpretation</h3>
                <div class="vap-interpret">${interpretHtml}</div>
            </div>

            <div class="vap-card vap-section-gap">
                <h3 style="margin-top:0;">Session Summary</h3>
                <div style="overflow-x:auto;margin-top:10px;">
                    <table>
                        <thead>
                            <tr><th>Session</th><th>Correct</th><th>Wrong</th><th>Missed</th><th>Accuracy</th><th>Median RT</th></tr>
                        </thead>
                        <tbody>
                            ${renderVapSessionRow("Session 1 — Numerical", scores.s1)}
                            ${renderVapSessionRow("Session 2 — Letter Matching", scores.s2)}
                        </tbody>
                    </table>
                </div>
            </div>

            ${logRows ? `
            <details class="vap-card vap-section-gap">
                <summary>Detail Jawaban &amp; Kunci Jawaban</summary>
                <div style="overflow-x:auto;margin-top:12px;">
                    <table>
                        <thead>
                            <tr><th>No</th><th>Sesi</th><th>Block</th><th>Stimulus</th><th>Jawaban</th><th>Kunci</th><th>Status</th><th>RT</th></tr>
                        </thead>
                        <tbody>${logRows}</tbody>
                    </table>
                </div>
            </details>
            ` : ""}

        </div>
    `;


    /* ---------------- GAMBAR CHART (setelah DOM ter-attach) ---------------- */

    requestAnimationFrame(function () {
        vapDrawCharts(
            container.querySelector(".vap-trend-canvas"),
            container.querySelector(".vap-radar-canvas"),
            scores,
            anomalies
        );
    });

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
        renderVapResult(
            assessment || {},
            result || {},
            container
        );
    }

};