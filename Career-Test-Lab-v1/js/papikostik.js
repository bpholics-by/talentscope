/* ==========================================================
    RENDER TEST RESULT (PAPI KOSTICK - CUSTOM INTERPRETATION)
========================================================== */

function renderTestResult(assessment, result) {
    let resultContent = document.getElementById("resultContent") || document.getElementById("result") || document.querySelector(".result-container");
    
    if (!resultContent) {
        resultContent = document.createElement("div");
        resultContent.id = "resultContent";
        document.body.appendChild(resultContent);
    }

    // ==========================================================
    // SUMBER DATA TUNGGAL:
    // Renderer memakai hasil yang SUDAH dipilih oleh
    // test-result.js berdasarkan project + participant + index.
    // Tidak ada lookup localStorage berbasis URL di renderer.
    // ==========================================================
    const sourceResult =
        result && typeof result === 'object'
            ? result
            : {};

    let scoresObj = (
        sourceResult.scores &&
        typeof sourceResult.scores === 'object'
    )
        ? sourceResult.scores
        : (
            sourceResult.skorDimensi &&
            typeof sourceResult.skorDimensi === 'object'
                ? sourceResult.skorDimensi
                : {}
        );

    const resultIdentity = {
        projectId: sourceResult.projectId || '',
        participantId: sourceResult.participantId || '',
        assessmentIndex: sourceResult.assessmentIndex,
        assessmentCode: sourceResult.assessmentCode || ''
    };

    console.info(
        '[PAPI] Renderer menggunakan RESULT PESERTA INI:',
        resultIdentity,
        sourceResult
    );

        const keys = ['N', 'G', 'A', 'L', 'P', 'I', 'T', 'V', 'S', 'B', 'O', 'X', 'C', 'D', 'R', 'Z', 'E', 'K', 'F', 'W'];

    // ... (lanjutkan sisa kode fungsi ke bawah seperti biasa)

    const papiDefinitions = {
        N: { name: "Kebutuhan Menyelesaikan Tugas (Need to Finish a Task)" },
        G: { name: "Peran Pekerja Keras (Role of Hard Intense Worker)" },
        A: { name: "Kebutuhan Berprestasi (Need to Achieve)" },
        L: { name: "Peran Kepemimpinan (Leadership Role)" },
        P: { name: "Kebutuhan Mengatur Orang Lain (Need to Control Others)" },
        I: { name: "Kemudahan Mengambil Keputusan (Ease in Decision Making)" },
        T: { name: "Tempo / Kecepatan Kerja (Pace)" },
        V: { name: "Semangat / Aktivitas Fisik (Vigorous Type)" },
        O: { name: "Kebutuhan Kedekatan Interpersonal (Need for Closeness & Affection)" },
        B: { name: "Kebutuhan Menjadi Bagian Kelompok (Need to Belong to Groups)" },
        S: { name: "Hubungan Sosial (Social Extension)" },
        X: { name: "Kebutuhan Untuk Diperhatikan (Need to be Noticed)" },
        C: { name: "Keteraturan (Organized Type)" },
        D: { name: "Minat Terhadap Detail (Interest in Working with Details)" },
        R: { name: "Orientasi Teoritis (Theoretical Type)" },
        Z: { name: "Kebutuhan Terhadap Perubahan (Need for Change)" },
        E: { name: "Pengendalian Emosi (Emotional Restraint)" },
        K: { name: "Kebutuhan Bersikap Tegas (Need to be Forceful)" },
        F: { name: "Kebutuhan Mendukung Atasan/Otoritas (Need to Support Authority)" },
        W: { name: "Kebutuhan Terhadap Aturan dan Pengawasan (Need for Rules & Supervision)" }
    };

    // Fungsi helper dinamis untuk mengambil interpretasi berdasarkan Dimensi (Key) dan Skor
    function getInterpretationByScore(key, score) {
        const s = Number(score);
        switch (key) {
            case 'N':
                if (s === 0) return "Kurang bertanggung jawab terhadap penyelesaian tugas dan cenderung kurang bergairah dalam mengerjakannya.";
                if (s <= 2) return "Cenderung berhati-hati dalam mengerjakan tugas dan agak lamban dalam menyelesaikannya.";
                if (s <= 5) return "Bertanggung jawab terhadap pekerjaan dan berusaha menyelesaikan tugas sampai tuntas.";
                if (s <= 7) return "Mampu menangani pekerjaan satu demi satu, tetapi masih dapat mengubah prioritas bila diperlukan.";
                return "Sangat terpaku pada penyelesaian satu tugas; dapat mengalami kesulitan menangani beberapa pekerjaan sekaligus atau ketika sering diinterupsi.";
            case 'G':
                if (s <= 1) return "Santai; pekerjaan cenderung dipandang sebagai sesuatu yang menyenangkan dan bukan beban yang membutuhkan usaha besar.";
                if (s <= 3) return "Cenderung mencari cara atau sistem yang dapat mempermudah pekerjaan.";
                if (s <= 6) return "Memiliki kemauan bekerja keras dan tujuan kerja yang cukup jelas.";
                if (s === 7) return "Bekerja keras sesuai tuntutan dan mengarahkan usaha pada hal-hal yang dianggap menguntungkan.";
                return "Sangat ingin terlihat sebagai pekerja keras; dapat cenderung menciptakan aktivitas tambahan agar terlihat tetap sibuk.";
            case 'A':
                if (s <= 1) return "Tidak terlalu kompetitif; cenderung puas dengan kondisi yang ada dan membutuhkan dorongan eksternal.";
                if (s <= 4) return "Mengetahui tujuan yang ingin dicapai dan mampu merumuskannya.";
                if (s <= 8) return "Realistis terhadap kemampuan diri, berorientasi pada target, menyukai tantangan dan cenderung memiliki inisiatif.";
                return "Sangat berambisi untuk berprestasi; dapat menetapkan target sangat tinggi dan memiliki kecenderungan mengejar kesempurnaan.";
            case 'L':
                if (s <= 4) return "Tidak secara aktif memproyeksikan diri sebagai pemimpin atau tidak terlalu berusaha menggunakan orang lain untuk mencapai tujuan.";
                return "Cenderung memproyeksikan diri sebagai pemimpin dan nyaman mengambil peran untuk mengarahkan orang lain.";
            case 'P':
                if (s <= 4) return "Relatif rendah kebutuhan untuk mengontrol orang lain atau mengambil tanggung jawab atas pekerjaan orang lain.";
                return "Tinggi kebutuhan untuk mengarahkan, mengontrol, dan menerima tanggung jawab atas tindakan/hasil kerja orang lain.";
            case 'I':
                if (s <= 2) return "Ragu-ragu dan cenderung menghindari atau menolak mengambil keputusan.";
                if (s <= 4) return "Berhati-hati dalam membuat keputusan.";
                if (s <= 7) return "Relatif percaya diri; dapat mengambil keputusan dengan cukup lancar.";
                return "Sangat berani dan tidak terlalu ragu dalam mengambil keputusan; dapat cenderung cepat dalam memutuskan.";
            case 'T':
                if (s <= 3) return "Cenderung bekerja mengikuti ritme sendiri dan tidak terlalu memiliki urgensi terhadap kecepatan.";
                if (s <= 6) return "Aktif secara mental dan internal serta mampu menyesuaikan tempo kerja.";
                return "Memiliki tempo kerja tinggi; cenderung ingin segera menyelesaikan pekerjaan dan menjaga aktivitas tetap tinggi.";
            case 'V':
                if (s <= 4) return "Cenderung pasif dan lebih nyaman pada aktivitas yang tidak terlalu menuntut energi fisik.";
                if (s <= 7) return "Aktif secara fisik dan cenderung memiliki energi kerja yang baik.";
                return "Sangat aktif secara fisik; dapat merasa kurang nyaman pada pekerjaan yang terlalu statis atau membutuhkan duduk dalam waktu lama.";
            case 'O':
                if (s === 0) return "Lebih berorientasi pada tugas/aturan dan tidak mudah dipengaruhi oleh individu tertentu.";
                if (s <= 4) return "Cenderung objektif dan analitis, tetapi tetap menyadari perasaan orang lain.";
                if (s <= 6) return "Cukup peka terhadap kebutuhan orang lain dan memperhatikan hubungan interpersonal.";
                return "Sangat peka terhadap orang lain; dapat menjadi subjektif atau terlalu terlibat secara interpersonal.";
            case 'B':
                if (s === 0) return "Sangat mandiri secara sosial dan tidak terlalu membutuhkan keterlibatan kelompok.";
                if (s === 1) return "Mandiri secara emosional, tidak mudah dipengaruhi tekanan kelompok dan relatif kurang peka terhadap kebutuhan kelompok.";
                if (s <= 5) return "Senang bergabung dengan kelompok, sadar terhadap kebutuhan kelompok dan mampu bekerja sama.";
                if (s <= 7) return "Selektif dalam memilih kelompok dan lebih tertarik bergabung bila kelompok tersebut memiliki nilai atau manfaat tertentu.";
                return "Sangat membutuhkan keterlibatan kelompok dan dapat menjadi terlalu sensitif terhadap penerimaan kelompok.";
            case 'S':
                if (s <= 2) return "Tidak terlalu membutuhkan kehadiran orang lain; cenderung menarik diri atau canggung dalam situasi sosial.";
                if (s <= 4) return "Cukup percaya diri dan cukup aktif dalam menjalin hubungan sosial.";
                if (s <= 7) return "Percaya diri, senang bergaul, menyukai interaksi sosial dan komunikatif.";
                return "Tingkat kebutuhan hubungan sosial sangat tinggi; dapat terlalu banyak mengalokasikan waktu untuk aktivitas sosial.";
            case 'X':
                if (s === 0) return "Cenderung pemalu dan lebih suka menyendiri.";
                if (s <= 2) return "Sederhana dan cenderung merendahkan atau mengecilkan kapasitas diri.";
                if (s <= 4) return "Rendah hati, sederhana, tulus dan tidak terlalu suka menampilkan diri.";
                if (s <= 7) return "Mengharapkan pengakuan dari lingkungan tetapi tidak selalu mencari perhatian secara berlebihan.";
                return "Sangat ingin diperhatikan; dapat bangga terhadap diri dan gaya sendiri serta berpotensi mencari perhatian secara berlebihan.";
            case 'C':
                if (s <= 1) return "Kurang mempedulikan keteraturan atau kerapihan; dapat bekerja secara spontan tetapi berisiko kurang terstruktur.";
                if (s === 2) return "Lebih mengutamakan fleksibilitas daripada struktur; pendekatan kerja banyak menyesuaikan situasi.";
                if (s <= 6) return "Sistematis, metodis, terstruktur, rapi dan mampu menata pekerjaan dengan baik.";
                if (s === 7) return "Fleksibel tetapi masih cukup memperhatikan keteraturan dan sistematika kerja.";
                return "Sangat membutuhkan keteraturan; dapat menjadi kaku dan kurang fleksibel.";
            case 'D':
                if (s === 0) return "Melihat pekerjaan secara makro dan mampu membedakan hal penting dengan hal yang kurang penting.";
                if (s <= 5) return "Cukup memperhatikan akurasi dan kelengkapan data serta memiliki ketertarikan menangani detail.";
                return "Sangat memperhatikan akurasi dan kelengkapan data; dapat terlalu terlibat pada detail.";
            case 'R':
                if (s === 0) return "Sangat praktis-pragmatis; lebih mengandalkan pengalaman dan intuisi.";
                if (s <= 3) return "Sangat tertarik pada teori dan alternatif baru; gagasannya dapat terkadang sulit dipahami orang lain.";
                if (s <= 7) return "Mampu menyeimbangkan pertimbangan teoritis dan praktis/pengalaman.";
                if (s === 8) return "Sangat teoritis; dapat menjadi kurang praktis dan terlalu abstrak.";
                return "Penekanan terhadap penalaran/konseptualisasi sangat tinggi.";
            case 'Z':
                if (s <= 2) return "Menyukai stabilitas dan cenderung tidak membutuhkan perubahan.";
                if (s <= 4) return "Bersedia menerima perubahan apabila alasan dan manfaatnya jelas.";
                if (s <= 6) return "Relatif mudah beradaptasi dan cukup menyukai variasi/perubahan.";
                if (s <= 8) return "Cenderung aktif mencari variasi dan perubahan serta lebih antusias terhadap hal baru.";
                return "Sangat membutuhkan perubahan, variasi dan gagasan baru; dapat mudah merasa bosan terhadap rutinitas.";
            case 'E':
                if (s <= 1) return "Sangat terbuka dan cepat bereaksi; ekspresi perasaan relatif mudah terlihat.";
                if (s <= 3) return "Cukup terbuka dalam mengungkapkan pendapat atau perasaan.";
                if (s <= 6) return "Relatif seimbang dalam mengekspresikan dan menyimpan perasaan serta mampu mengendalikan respons emosional.";
                if (s === 7) return "Cenderung menyimpan pendapat/perasaan dan menjaga jarak interpersonal.";
                return "Sangat menahan ekspresi emosi; dapat menunjukkan pengendalian diri yang berlebihan.";
            case 'K':
                if (s <= 2) return "Cenderung menghindari konflik atau tidak nyaman menghadapi masalah secara konfrontatif.";
                if (s <= 4) return "Menyukai lingkungan yang tenang dan cenderung menghindari konflik.";
                if (s === 5) return "Dapat menunjukkan keteguhan/keras kepala dalam mempertahankan posisi.";
                if (s <= 7) return "Ketegasan/agresivitas diarahkan pada pekerjaan; memiliki dorongan kompetitif.";
                return "Sangat forceful/agresif dalam mempertahankan posisi; perlu memperhatikan kecenderungan defensif atau konfrontatif.";
            case 'F':
                if (s <= 1) return "Sangat mandiri terhadap otoritas; dapat cenderung mengutamakan kepentingan sendiri dan kurang nyaman berada di bawah kontrol otoritas.";
                if (s <= 3) return "Lebih berorientasi pada kepentingan diri sendiri dan tidak terlalu membutuhkan kedekatan dengan otoritas.";
                if (s <= 5) return "Cukup loyal terhadap organisasi dan mampu bekerja dalam struktur hierarki.";
                return "Sangat mendukung otoritas; cenderung loyal dan membantu atasan.";
            case 'W':
                if (s <= 3) return "Berorientasi pada tujuan, cukup mandiri dan tidak terlalu membutuhkan aturan/pengawasan eksternal.";
                if (s <= 5) return "Membutuhkan arahan dan ekspektasi kerja yang cukup jelas.";
                return "Membutuhkan struktur, instruksi dan pengawasan yang lebih jelas serta lebih nyaman bekerja dalam sistem yang teratur.";
            default:
                return "Bertanggung jawab terhadap pekerjaan dan berusaha menyelesaikan tugas sampai tuntas.";
        }
    }

    const size = 820;
    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = 210;
    const ringInnerRadius = 214;
    const ringOuterRadius = 245;
    const textRadius = 265;

    let polygonPoints = "";
    let axisLinesHtml = "";
    let labelsHtml = "";
    let concentricCirclesHtml = "";
    let defsPathsHtml = "";
    let curvedTextsHtml = "";

    for (let i = 1; i <= 9; i++) {
        let r = (i / 9) * maxRadius;
        let strokeColor = (i === 3 || i === 6 || i === 9) ? "#94a3b8" : "#e2e8f0";
        let strokeWidth = (i === 9) ? "2" : "1.2";
        concentricCirclesHtml += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
        
        let numY = centerY - r;
        concentricCirclesHtml += `
            <rect x="${centerX + 5}" y="${numY - 6}" width="15" height="12" fill="#ffffff" opacity="0.9" />
            <text x="${centerX + 12.5}" y="${numY}" font-size="11" fill="#1e293b" font-weight="700" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${i}</text>
        `;
    }

    const totalPoints = keys.length;
    const angleStep = (Math.PI * 2) / totalPoints;
    const rotationOffset = - (Math.PI / 2) - (angleStep / 2);

    const getCategoryInfo = (index) => {
        if (index >= 0 && index <= 2) return { name: "WORK DIRECTION", color: "#dc2626", id: "cat_NGA" };
        if (index >= 3 && index <= 5) return { name: "LEADERSHIP", color: "#db2777", id: "cat_LPI" };
        if (index >= 6 && index <= 7) return { name: "ACTIVITY", color: "#2563eb", id: "cat_TV" };
        if (index >= 8 && index <= 11) return { name: "SOCIAL NATURE", color: "#16a34a", id: "cat_SBOX" };
        if (index >= 12 && index <= 14) return { name: "WORK STYLE", color: "#0d9488", id: "cat_RDC" };
        if (index >= 15 && index <= 17) return { name: "TEMPERAMENT", color: "#ca8a04", id: "cat_ZEK" };
        return { name: "FOLLOWERSHIP", color: "#ea580c", id: "cat_FW" };
    };

    let colorRingHtml = "";
    let renderedCategories = new Set();

    keys.forEach((key, index) => {
        const angle = angleStep * index + rotationOffset;
        const rawScore = scoresObj[key];
        const hasScore = rawScore !== undefined && rawScore !== null && rawScore !== '';
        const score = hasScore ? Number(rawScore) : null;
        const clampedScore = hasScore && Number.isFinite(score)
            ? Math.max(0, Math.min(9, score))
            : 0;
        
        let effectiveScore = (key === 'Z' || key === 'K') ? (9 - clampedScore) : clampedScore;

        const r = (effectiveScore / 9) * maxRadius;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        polygonPoints += `${x},${y} `;

        const outerX = centerX + maxRadius * Math.cos(angle);
        const outerY = centerY + maxRadius * Math.sin(angle);
        axisLinesHtml += `<line x1="${centerX}" y1="${centerY}" x2="${outerX}" y2="${outerY}" stroke="#cbd5e1" stroke-width="1.2" />`;

        if (key === 'Z' || key === 'K') {
            for (let scaleVal = 1; scaleVal <= 9; scaleVal++) {
                let invScale = 10 - scaleVal;
                let rPos = (invScale / 9) * maxRadius;
                let sx = centerX + rPos * Math.cos(angle);
                let sy = centerY + rPos * Math.sin(angle);

                axisLinesHtml += `
                    <circle cx="${sx}" cy="${sy}" r="7" fill="#ffffff" opacity="0.95" />
                    <text x="${sx}" y="${sy}" font-size="10" fill="#0284c7" font-weight="700" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${scaleVal}</text>
                `;
            }
        }

        const startAngle = angle - (angleStep / 2);
        const endAngle = angle + (angleStep / 2);
        
        const x1_in = centerX + ringInnerRadius * Math.cos(startAngle);
        const y1_in = centerY + ringInnerRadius * Math.sin(startAngle);
        const x2_in = centerX + ringInnerRadius * Math.cos(endAngle);
        const y2_in = centerY + ringInnerRadius * Math.sin(endAngle);

        const x1_out = centerX + ringOuterRadius * Math.cos(startAngle);
        const y1_out = centerY + ringOuterRadius * Math.sin(startAngle);
        const x2_out = centerX + ringOuterRadius * Math.cos(endAngle);
        const y2_out = centerY + ringOuterRadius * Math.sin(endAngle);

        const cat = getCategoryInfo(index);
        colorRingHtml += `
            <path d="M ${x1_in} ${y1_in} L ${x1_out} ${y1_out} A ${ringOuterRadius} ${ringOuterRadius} 0 0 1 ${x2_out} ${y2_out} L ${x2_in} ${y2_in} A ${ringInnerRadius} ${ringInnerRadius} 0 0 0 ${x1_in} ${y1_in} Z" 
                  fill="${cat.color}" stroke="#ffffff" stroke-width="2" />
        `;

        if (!renderedCategories.has(cat.id)) {
            renderedCategories.add(cat.id);

            let groupIndices = keys.map((k, idx) => getCategoryInfo(idx).id === cat.id ? idx : -1).filter(idx => idx !== -1);
            let firstIdx = groupIndices[0];
            let lastIdx = groupIndices[groupIndices.length - 1];

            let aStart = angleStep * firstIdx - (angleStep / 2) + rotationOffset;
            let aEnd = angleStep * lastIdx + (angleStep / 2) + rotationOffset;

            let sx = centerX + textRadius * Math.cos(aStart);
            let sy = centerY + textRadius * Math.sin(aStart);
            let ex = centerX + textRadius * Math.cos(aEnd);
            let ey = centerY + textRadius * Math.sin(aEnd);

            let sweep = 1;
            let angleSpan = aEnd - aStart;
            if (angleSpan < 0) angleSpan += Math.PI * 2;
            let largeArc = angleSpan > Math.PI ? 1 : 0;

            defsPathsHtml += `<path id="${cat.id}_path" d="M ${sx} ${sy} A ${textRadius} ${textRadius} 0 ${largeArc} ${sweep} ${ex} ${ey}" fill="none" />`;
            
            curvedTextsHtml += `
                <text font-size="12" font-weight="800" fill="${cat.color}" font-family="sans-serif">
                    <textPath href="#${cat.id}_path" startOffset="50%" text-anchor="middle">${cat.name}</textPath>
                </text>
            `;
        }

        const labelRadius = 229.5;
        const labelX = centerX + labelRadius * Math.cos(angle);
        const labelY = centerY + labelRadius * Math.sin(angle);
        
        let labelColor = (key === 'Z' || key === 'K') ? "#0284c7" : "#0f172a";
        labelsHtml += `
            <text x="${labelX}" y="${labelY}" font-size="13" font-weight="800" fill="${labelColor}" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${key}</text>
        `;
    });

    // ==========================================================
    // RINGKASAN EKSEKUTIF PROFIL KERJA — DINAMIKA 4 AREA
    // ----------------------------------------------------------
    // Ringkasan TIDAK mengambil 4 skor tertinggi secara global.
    // Setiap area membaca dinamika kelompok dimensi yang memang
    // membentuk konstruk tersebut:
    //   Leadership : L, P, I
    //   Hubungan Sosial : S, B, O, X
    //   Sikap Kerja : N, G, A, V, T, R, D, C
    //   Adaptasi : Z, E, K, F, W
    // Semua kalimat diturunkan dari skor aktual peserta.
    // ==========================================================

    function getActualScore(key) {
        const raw = scoresObj ? scoresObj[key] : undefined;
        const n = Number(raw);
        return (raw !== undefined && raw !== null && raw !== '' && Number.isFinite(n))
            ? Math.max(0, Math.min(9, n))
            : null;
    }

    function getGroupScores(groupKeys) {
        return groupKeys
            .map(function (key) {
                const score = getActualScore(key);
                return score === null ? null : { key: key, score: score };
            })
            .filter(Boolean);
    }

    function avgOf(items) {
        return items.length
            ? items.reduce(function (sum, item) { return sum + item.score; }, 0) / items.length
            : null;
    }

    function minOf(items) {
        return items.length ? Math.min.apply(null, items.map(function (x) { return x.score; })) : null;
    }

    function maxOf(items) {
        return items.length ? Math.max.apply(null, items.map(function (x) { return x.score; })) : null;
    }

    function keysWithScore(items, threshold, mode) {
        return items
            .filter(function (x) {
                return mode === 'low' ? x.score <= threshold : x.score >= threshold;
            })
            .map(function (x) { return x.key; });
    }

    function fmtKeys(list) {
        return list.join(', ');
    }

    function buildLeadershipSummary() {
        const items = getGroupScores(['L', 'P', 'I']);
        if (items.length < 3) return 'Data Leadership (L, P, I) belum lengkap sehingga dinamika kepemimpinan belum dapat disimpulkan secara penuh.';

        const L = getActualScore('L'), P = getActualScore('P'), I = getActualScore('I');
        const avg = avgOf(items);
        const parts = [];

        if (L >= 6 && P >= 6 && I >= 6) {
            parts.push('Profil menunjukkan dorongan kepemimpinan yang kuat, disertai kebutuhan mengarahkan orang lain dan keberanian mengambil keputusan');
        } else if (L >= 6 && P <= 4 && I >= 6) {
            parts.push('Profil menunjukkan kecenderungan tampil sebagai pemimpin dan mengambil keputusan, tetapi tidak terlalu berorientasi pada kontrol langsung terhadap orang lain');
        } else if (L >= 6 && P >= 6 && I <= 4) {
            parts.push('Dorongan memimpin dan mengarahkan orang lain cukup kuat, namun pengambilan keputusan cenderung lebih berhati-hati');
        } else if (L <= 4 && P >= 6 && I >= 6) {
            parts.push('Kemampuan mengambil keputusan dan dorongan mengendalikan pekerjaan orang lain cukup kuat, tetapi kebutuhan untuk memproyeksikan diri sebagai pemimpin relatif lebih rendah');
        } else if (L >= 6) {
            parts.push('Kecenderungan mengambil peran kepemimpinan terlihat cukup kuat');
        } else if (P >= 6) {
            parts.push('Kebutuhan mengarahkan atau mengontrol pekerjaan orang lain terlihat cukup menonjol');
        } else if (I >= 6) {
            parts.push('Kepercayaan diri dalam mengambil keputusan relatif menonjol');
        } else if (L <= 3 && P <= 3 && I <= 3) {
            parts.push('Profil cenderung tidak agresif dalam mengambil posisi kepemimpinan, kontrol terhadap orang lain, maupun keputusan yang cepat');
        } else {
            parts.push('Kecenderungan kepemimpinan berada pada tingkat moderat dan relatif bergantung pada tuntutan situasi');
        }

        const high = keysWithScore(items, 6, 'high');
        const low = keysWithScore(items, 3, 'low');
        if (high.length && low.length) {
            parts.push('Kekuatan utama tampak pada ' + fmtKeys(high) + ', sementara ' + fmtKeys(low) + ' relatif lebih rendah sehingga gaya kepemimpinan tidak sepenuhnya seragam');
        } else if (Math.max.apply(null, items.map(function (x) { return x.score; })) - Math.min.apply(null, items.map(function (x) { return x.score; })) <= 2) {
            parts.push('Ketiga dimensi relatif seimbang');
        }

        return parts.join('. ') + '.';
    }

    function buildSocialSummary() {
        const items = getGroupScores(['S', 'B', 'O', 'X']);
        if (items.length < 4) return 'Data Hubungan Sosial (S, B, O, X) belum lengkap sehingga dinamika sosial belum dapat disimpulkan secara penuh.';

        const S = getActualScore('S'), B = getActualScore('B'), O = getActualScore('O'), X = getActualScore('X');
        const parts = [];

        if (S >= 6 && B >= 6 && O >= 6) {
            parts.push('Profil menunjukkan keterlibatan sosial yang kuat, nyaman berada dalam kelompok, dan cukup peka terhadap kebutuhan interpersonal');
        } else if (S >= 6 && B <= 3) {
            parts.push('Peserta tampak nyaman berinteraksi secara sosial, tetapi kebutuhan untuk menjadi bagian dari kelompok relatif lebih rendah sehingga relasi dapat lebih bersifat individual');
        } else if (B >= 6 && S <= 3) {
            parts.push('Kebutuhan menjadi bagian kelompok cukup kuat, tetapi ekspansi hubungan sosial secara luas relatif lebih rendah');
        } else if (O >= 6 && S >= 6) {
            parts.push('Keterampilan relasional dan kebutuhan interaksi sosial sama-sama menonjol');
        } else if (O >= 6) {
            parts.push('Kepekaan terhadap orang lain dan kualitas hubungan interpersonal relatif menonjol');
        } else if (S >= 6) {
            parts.push('Kebutuhan berinteraksi dan berkomunikasi dengan orang lain relatif tinggi');
        } else if (B >= 6) {
            parts.push('Kebutuhan keterlibatan dalam kelompok relatif tinggi');
        } else if (S <= 3 && B <= 3) {
            parts.push('Profil sosial cenderung selektif dan tidak terlalu membutuhkan intensitas interaksi atau keterikatan kelompok');
        } else {
            parts.push('Kebutuhan hubungan sosial berada pada tingkat moderat dan dapat menyesuaikan konteks');
        }

        if (X >= 7 && (S >= 6 || B >= 6)) {
            parts.push('Dorongan memperoleh pengakuan juga cukup kuat, sehingga visibilitas sosial dapat menjadi bagian penting dalam interaksi');
        } else if (X <= 3 && S >= 6) {
            parts.push('Interaksi sosial yang tinggi tidak otomatis diikuti kebutuhan tampil atau mencari perhatian');
        } else if (X >= 7) {
            parts.push('Kebutuhan untuk diperhatikan atau memperoleh pengakuan terlihat menonjol');
        }

        const spread = maxOf(items) - minOf(items);
        if (spread <= 2) parts.push('Keempat dimensi sosial relatif seimbang');
        else {
            const high = keysWithScore(items, 7, 'high');
            const low = keysWithScore(items, 3, 'low');
            if (high.length && low.length) {
                parts.push('Pola paling menonjol berada pada ' + fmtKeys(high) + ', sedangkan ' + fmtKeys(low) + ' menjadi sisi yang relatif lebih rendah');
            }
        }

        return parts.join('. ') + '.';
    }

    function buildWorkAttitudeSummary() {
        const items = getGroupScores(['N', 'G', 'A', 'V', 'T', 'R', 'D', 'C']);
        if (items.length < 8) return 'Data Sikap Kerja (N, G, A, V, T, R, D, C) belum lengkap sehingga dinamika sikap kerja belum dapat disimpulkan secara penuh.';

        const N = getActualScore('N'), G = getActualScore('G'), A = getActualScore('A');
        const V = getActualScore('V'), T = getActualScore('T'), R = getActualScore('R');
        const D = getActualScore('D'), C = getActualScore('C');
        const parts = [];

        if (G >= 6 && A >= 6 && N >= 5) {
            parts.push('Dorongan menyelesaikan pekerjaan, kemauan bekerja keras, dan orientasi pencapaian tampak kuat');
        } else if (A >= 6 && G >= 6) {
            parts.push('Orientasi target dan kemauan bekerja keras terlihat menonjol');
        } else if (N >= 6) {
            parts.push('Dorongan menyelesaikan pekerjaan sampai tuntas relatif kuat');
        } else if (G >= 6) {
            parts.push('Kemauan bekerja keras dan energi untuk mengejar tuntutan kerja relatif kuat');
        } else if (A >= 6) {
            parts.push('Orientasi pencapaian dan inisiatif relatif menonjol');
        } else {
            parts.push('Dorongan dasar terhadap penyelesaian tugas, usaha, dan pencapaian berada pada tingkat moderat');
        }

        if (T >= 7 && V >= 6) {
            parts.push('Tempo kerja dan aktivitas juga tinggi sehingga cenderung cocok dengan pekerjaan yang dinamis dan menuntut energi');
        } else if (T >= 7) {
            parts.push('Tempo kerja cenderung tinggi meskipun aktivitas fisik tidak selalu setinggi itu');
        } else if (V >= 7) {
            parts.push('Energi aktivitas fisik relatif tinggi, sementara tempo kerja perlu dibaca bersama tuntutan situasi');
        } else if (T <= 3 && V <= 3) {
            parts.push('Tempo dan aktivitas cenderung tenang sehingga lingkungan kerja yang stabil dapat lebih sesuai');
        }

        if (C >= 6 && D >= 6) {
            parts.push('Keteraturan dan perhatian terhadap detail sama-sama kuat, mendukung pendekatan kerja yang sistematis dan teliti');
        } else if (C >= 6) {
            parts.push('Kecenderungan bekerja secara terstruktur dan teratur cukup kuat');
        } else if (D >= 6) {
            parts.push('Perhatian terhadap detail dan akurasi cukup menonjol');
        } else if (C <= 2 && D <= 2) {
            parts.push('Kebutuhan struktur dan keterlibatan pada detail relatif rendah, sehingga pendekatan kerja cenderung lebih fleksibel atau makro');
        }

        if (R >= 7) {
            parts.push('Pertimbangan teoritis/konseptual juga cukup kuat');
        } else if (R <= 3) {
            parts.push('Pendekatan kerja cenderung lebih praktis daripada teoritis');
        }

        const high = keysWithScore(items, 7, 'high');
        const low = keysWithScore(items, 2, 'low');
        if (high.length && low.length) {
            parts.push('Secara keseluruhan, dinamika paling kuat terlihat pada ' + fmtKeys(high) + ', sementara ' + fmtKeys(low) + ' relatif lebih rendah');
        }

        return parts.join('. ') + '.';
    }

    function buildAdaptationSummary() {
        const items = getGroupScores(['Z', 'E', 'K', 'F', 'W']);
        if (items.length < 5) return 'Data Adaptasi (Z, E, K, F, W) belum lengkap sehingga dinamika adaptasi belum dapat disimpulkan secara penuh.';

        const Z = getActualScore('Z'), E = getActualScore('E'), K = getActualScore('K');
        const F = getActualScore('F'), W = getActualScore('W');
        const parts = [];

        if (Z >= 7) {
            parts.push('Kebutuhan terhadap perubahan dan variasi relatif tinggi');
        } else if (Z <= 3) {
            parts.push('Preferensi terhadap stabilitas relatif kuat');
        } else {
            parts.push('Sikap terhadap perubahan cenderung fleksibel dan situasional');
        }

        if (E >= 7) {
            parts.push('pengendalian ekspresi emosi juga kuat sehingga respons cenderung lebih tertahan');
        } else if (E <= 3) {
            parts.push('ekspresi respons emosional cenderung lebih terbuka');
        } else {
            parts.push('pengendalian emosi berada pada tingkat relatif seimbang');
        }

        if (K >= 7) {
            parts.push('ketegasan dan dorongan mempertahankan posisi cukup kuat');
        } else if (K <= 3) {
            parts.push('kecenderungan konfrontatif relatif rendah dan pendekatan cenderung lebih menghindari konflik');
        } else {
            parts.push('ketegasan dapat disesuaikan dengan tuntutan situasi');
        }

        if (F >= 6 && W >= 6) {
            parts.push('Pada sisi struktur, loyalitas terhadap otoritas dan kebutuhan akan aturan/pengawasan sama-sama menonjol');
        } else if (F >= 6) {
            parts.push('Loyalitas terhadap otoritas atau struktur hierarki cukup menonjol');
        } else if (W >= 6) {
            parts.push('Kebutuhan terhadap arahan, aturan, dan struktur kerja cukup menonjol');
        } else if (F <= 3 && W <= 3) {
            parts.push('kemandirian terhadap otoritas dan aturan eksternal relatif tinggi');
        }

        if (Z >= 7 && W >= 6) {
            parts.push('Kombinasi ini menunjukkan kebutuhan akan variasi yang tetap memerlukan kerangka atau ekspektasi kerja yang jelas');
        } else if (Z <= 3 && W >= 6) {
            parts.push('Kombinasi stabilitas dan kebutuhan struktur menunjukkan kecenderungan nyaman pada lingkungan kerja yang teratur dan konsisten');
        } else if (Z >= 7 && W <= 3) {
            parts.push('Kombinasi ini menunjukkan kecenderungan mencari perubahan dengan kebutuhan pengawasan eksternal yang relatif rendah');
        }

        const high = keysWithScore(items, 7, 'high');
        const low = keysWithScore(items, 3, 'low');
        if (high.length && low.length) {
            parts.push('Pola adaptasi paling menonjol pada ' + fmtKeys(high) + ', sedangkan ' + fmtKeys(low) + ' relatif lebih rendah');
        }

        return parts.join('. ') + '.';
    }

    const executiveGroups = [
        { title: 'Leadership', keys: ['L', 'P', 'I'], build: buildLeadershipSummary },
        { title: 'Hubungan Sosial', keys: ['S', 'B', 'O', 'X'], build: buildSocialSummary },
        { title: 'Sikap Kerja', keys: ['N', 'G', 'A', 'V', 'T', 'R', 'D', 'C'], build: buildWorkAttitudeSummary },
        { title: 'Adaptasi', keys: ['Z', 'E', 'K', 'F', 'W'], build: buildAdaptationSummary }
    ];

    const summaryDataAvailable = executiveGroups.some(function (group) {
        return getGroupScores(group.keys).length > 0;
    });

    const summaryIntro = summaryDataAvailable
        ? 'Ringkasan berikut membaca dinamika antar-dimensi dalam empat area profil kerja, berdasarkan skor aktual peserta ini.'
        : 'Data skor PAPI Kostick peserta belum tersedia, sehingga ringkasan profil kerja belum dapat dibuat.';

    const summaryItemsHtml = summaryDataAvailable
        ? executiveGroups.map(function (group) {
            return `<li style="margin-bottom: 8px;"><strong>${group.title}:</strong> ${group.build()}</li>`;
        }).join('')
        : '<li>Hasil belum tersedia untuk peserta ini.</li>';

    let tableRowsHtml = '';
    keys.forEach(key => {
        let dimInfo = papiDefinitions[key] || { name: `Dimensi ${key}` };
        const rawScore = scoresObj ? scoresObj[key] : undefined;
        const currentScore = Number.isFinite(Number(rawScore))
            ? Number(rawScore)
            : null;
        let interpretationText = currentScore === null
            ? 'Hasil belum tersedia.'
            : getInterpretationByScore(key, currentScore);
        let specialNote = (key === 'Z' || key === 'K') ? ` <span style="font-size: 10px; color: #0284c7; background: #e0f2fe; padding: 1px 6px; border-radius: 4px; margin-left: 6px;">Skala Invers (9 di Pusat)</span>` : '';
        
        tableRowsHtml += `
            <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; text-align: center; background: #f8fafc;">${key}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155;">
                    <strong style="display: block; color: #0f172a;">${dimInfo.name} ${specialNote}</strong>
                    <span style="font-size: 12px; color: #64748b; display: block; margin-top: 3px;">${interpretationText}</span>
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: 700; color: #0075ff; font-size: 16px;">${currentScore === null ? '—' : currentScore}</td>
            </tr>
        `;
    });

    resultContent.innerHTML = `
        <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; font-family: inherit;">
            <div style="border-bottom: 2px solid #0075ff; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">LAPORAN PSIKOLOGIS: PAPI KOSTICK</h3>
                    <p style="font-size: 13px; color: #64748b; margin: 0;">Profil Aspek Kepribadian & Perilaku Kerja (Work Role & Needs)</p>
                </div>
                <span style="background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">Completed</span>
            </div>

            <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; background: linear-gradient(to bottom, #f8fafc, #f1f5f9); border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; overflow-x: auto;">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow: visible; max-width: 100%; min-width: 650px;">
                    <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.55" />
                            <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.35" />
                        </linearGradient>
                        ${defsPathsHtml}
                    </defs>

                    ${colorRingHtml}

                    <circle cx="${centerX}" cy="${centerY}" r="${maxRadius}" fill="#ffffff" stroke="#1e293b" stroke-width="3" />

                    ${concentricCirclesHtml}
                    ${axisLinesHtml}

                    <polygon points="${polygonPoints}" fill="url(#chartGradient)" stroke="#1d4ed8" stroke-width="3" />

                    ${keys.map((key, index) => {
                        const angle = angleStep * index + rotationOffset;
                        const rawScore = scoresObj[key];
                        const hasScore = rawScore !== undefined && rawScore !== null && rawScore !== '';
                        const score = hasScore ? Number(rawScore) : null;
                        const clampedScore = hasScore && Number.isFinite(score)
                            ? Math.max(0, Math.min(9, score))
                            : 0;
                        let effectiveScore = (key === 'Z' || key === 'K') ? (9 - clampedScore) : clampedScore;
                        const r = (effectiveScore / 9) * maxRadius;
                        const x = centerX + r * Math.cos(angle);
                        const y = centerY + r * Math.sin(angle);
                        let dotColor = (key === 'Z' || key === 'K') ? "#0284c7" : "#1d4ed8";
                        return `<circle cx="${x}" cy="${y}" r="6" fill="${dotColor}" stroke="#ffffff" stroke-width="2" />`;
                    }).join('')}

                    ${curvedTextsHtml}
                    ${labelsHtml}
                </svg>
            </div>

            <div style="background: #f8fafc; border-left: 4px solid #0075ff; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">Ringkasan Eksekutif Profil Kerja</h4>
                <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0 0 8px 0;">
                    ${summaryIntro}
                </p>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.5;">
                    ${summaryItemsHtml}
                </ul>
            </div>

            <h4 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Rincian Skor 20 Dimensi PAPI Kostick</h4>
            <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
                    <thead>
                        <tr style="background: #f1f5f9; color: #475569; font-weight: 700;">
                            <th style="padding: 10px 12px; text-align: center; width: 60px;">Kode</th>
                            <th style="padding: 10px 12px;">Dimensi & Interpretasi</th>
                            <th style="padding: 10px 12px; text-align: center; width: 80px;">Skor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
                <span>Metode Tes: <strong>PAPI Kostick (Kostick's Perception and Preference Inventory)</strong></span>
                <span>Status Verifikasi: <strong style="color: #10b981;">Valid & Selesai</strong></span>
            </div>
        </div>
    `;
}

if (typeof window !== 'undefined') {
    window.renderTestResult = renderTestResult;
}
// Tambahkan alias ini di bagian paling bawah papikostick.js
if (typeof window !== 'undefined') {
    window.renderTestResult = renderTestResult;
    // Tambahkan alias cadangan agar terdeteksi oleh test-result.js
    window.renderPAPIPage = renderTestResult;
    window.renderPAPIResult = renderTestResult;
    window.PAPIAssessment = {
        render: renderTestResult
    };
}