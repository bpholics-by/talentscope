/* ==========================================================
    RENDER TEST RESULT (PAPI KOSTICK - CUSTOM INTERPRETATION)
    FULL FIX VERSION — dengan narasi kontekstual
========================================================== */

function renderTestResult(assessment, result) {
    let resultContent = document.getElementById("resultContent") || document.getElementById("result") || document.querySelector(".result-container");
    
    if (!resultContent) {
        resultContent = document.createElement("div");
        resultContent.id = "resultContent";
        document.body.appendChild(resultContent);
    }

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
        R: { name: "Orientasi Teoretis (Theoretical Type)" },
        Z: { name: "Kebutuhan Terhadap Perubahan (Need for Change)" },
        E: { name: "Pengendalian Emosi (Emotional Restraint)" },
        K: { name: "Kebutuhan Bersikap Tegas (Need to be Forceful)" },
        F: { name: "Kebutuhan Mendukung Atasan/Otoritas (Need to Support Authority)" },
        W: { name: "Kebutuhan Terhadap Aturan dan Pengawasan (Need for Rules & Supervision)" }
    };

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

    // ==========================================================
    // HELPER: Akses skor & layer analysis
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

    function _layerize(items) {
        if (!items || items.length === 0) return { dominant: [], supporting: [], latent: [] };
        
        const scores = items.map(x => x.score);
        const max = Math.max(...scores);
        const min = Math.min(...scores);
        const range = max - min;
        
        if (range <= 1) {
            return { dominant: [], supporting: items, latent: [] };
        }
        
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const dominantCut = Math.max(avg + (range * 0.05), avg + 0.5);
        const latentCut = Math.min(avg - (range * 0.05), avg - 0.5);
        
        let dominant = items.filter(x => x.score >= dominantCut);
        let latent = items.filter(x => x.score <= latentCut);
        let supporting = items.filter(x => !dominant.includes(x) && !latent.includes(x));
        
        // Fallback: ambil top 2 kalau dominant < 2
        if (dominant.length < 2 && items.length > 2) {
            const sorted = [...items].sort((a, b) => b.score - a.score);
            for (let i = 0; i < 2; i++) {
                if (!dominant.includes(sorted[i]) && !latent.includes(sorted[i])) {
                    dominant.push(sorted[i]);
                    const idx = supporting.indexOf(sorted[i]);
                    if (idx >= 0) supporting.splice(idx, 1);
                }
            }
        }
        
        // Fallback: ambil bottom 2 kalau latent < 2
        if (latent.length < 2 && items.length > 2) {
            const sorted = [...items].sort((a, b) => a.score - b.score);
            for (let i = 0; i < 2; i++) {
                if (!latent.includes(sorted[i]) && !dominant.includes(sorted[i])) {
                    latent.push(sorted[i]);
                    const idx = supporting.indexOf(sorted[i]);
                    if (idx >= 0) supporting.splice(idx, 1);
                }
            }
        }
        
        return { dominant, supporting, latent };
    }

    function _profilePattern(items) {
        if (!items || items.length < 2) return "unknown";
        const scores = items.map(x => x.score);
        const max = Math.max(...scores);
        const min = Math.min(...scores);
        const spread = max - min;
        
        if (spread <= 2) return "flat";
        if (spread <= 4) return "moderate";
        return "polarized";
    }

    const PAPI_DIM_LABEL = {
        L: "Peran Kepemimpinan",
        P: "Kebutuhan Mengatur Orang Lain",
        I: "Kemudahan Mengambil Keputusan",
        S: "Hubungan Sosial",
        B: "Kebutuhan Menjadi Bagian Kelompok",
        O: "Kebutuhan Kedekatan Interpersonal",
        X: "Kebutuhan Untuk Diperhatikan",
        N: "Kebutuhan Menyelesaikan Tugas",
        G: "Peran Pekerja Keras",
        A: "Kebutuhan Berprestasi",
        V: "Semangat Aktivitas Fisik",
        T: "Tempo Kerja",
        R: "Orientasi Teoretis",
        D: "Minat Terhadap Detail",
        C: "Keteraturan Kerja",
        Z: "Kebutuhan Terhadap Perubahan",
        E: "Pengendalian Emosi",
        K: "Kebutuhan Bersikap Tegas",
        F: "Dukungan Terhadap Otoritas",
        W: "Kebutuhan Terhadap Aturan"
    };

    function _namesOf(items) {
        return items.map(x => PAPI_DIM_LABEL[x.key] || x.key).join(", ");
    }

    // ==========================================================
    // 1. LEADERSHIP — Narasi Kontekstual
    // ==========================================================
    function buildLeadershipSummary() {
        const items = getGroupScores(['L', 'P', 'I']);
        if (items.length < 3) {
            return 'Data kepemimpinan belum lengkap untuk dianalisis.';
        }
        
        const L = getActualScore('L');
        const P = getActualScore('P');
        const I = getActualScore('I');
        const E = getActualScore('E');
        const K = getActualScore('K');
        const layers = _layerize(items);
        
        const dominantKeys = layers.dominant.map(x => x.key);
        const latentKeys = layers.latent.map(x => x.key);
        
        const emotionCtx = (E !== null && E >= 6) 
            ? "Dengan pengendalian emosi yang kuat, ia cenderung tetap tenang di bawah tekanan" 
            : (E !== null && E <= 3) 
                ? "Dengan ekspresi emosi yang terbuka, ia mudah menunjukkan reaksi saat menghadapi tekanan"
                : "Dengan pengendalian emosi yang seimbang, ia dapat menahan diri saat perlu dan mengekspresikan saat tepat";
        
        const assertiveCtx = (K !== null && K >= 6)
            ? "didukung ketegasan tinggi, ia berani menyampaikan posisi bahkan saat tidak populer"
            : (K !== null && K <= 3)
                ? "namun dengan ketegasan yang rendah, ia cenderung menghindari konfrontasi langsung"
                : "dengan ketegasan yang moderat, ia dapat menyesuaikan diri antara tegas dan diplomatis";
        
        let narasi = "";
        
        // KASUS 1: Pemimpin Utuh
        if (L >= 6 && P >= 6 && I >= 6) {
            narasi = "🎯 **Pemimpin Utuh** — Kandidat menunjukkan kombinasi lengkap: nyaman memimpin (**Peran Kepemimpinan**), terdorong mengarahkan orang lain (**Kebutuhan Mengatur Orang Lain**), dan berani mengambil keputusan (**Kemudahan Mengambil Keputusan**). " + emotionCtx + ". " + assertiveCtx + ". **Konteks optimal:** posisi manajerial senior, kepala unit, atau peran yang menuntut kepemimpinan formal dengan tanggung jawab besar — seperti memimpin tim produksi, mengelola cabang, atau mengarahkan proyek strategis. **Risiko:** dorongan kontrol yang kuat bisa mematikan inisiatif tim; perlu menjaga keseimbangan antara mengarahkan dan memberi ruang.";
        }
        // KASUS 2: Pemimpin Visioner
        else if (dominantKeys.includes('L') && dominantKeys.includes('I') && latentKeys.includes('P')) {
            narasi = "🎯 **Pemimpin Visioner** — Kandidat nyaman memimpin (**Peran Kepemimpinan**) dan berani memutuskan (**Kemudahan Mengambil Keputusan**), tetapi tidak merasa perlu mengontrol detail pekerjaan orang lain. Ia lebih mengandalkan visi dan arahan strategis dibanding pengawasan operasional. " + emotionCtx + ". **Konteks optimal:** peran kepemimpinan strategis, head of department, atau posisi yang menuntut pengambilan keputusan cepat dengan delegasi luas. **Contoh situasi:** saat harus memilih antara dua strategi besar dengan informasi terbatas, ia akan memutuskan dengan tegas dan mempercayakan eksekusi kepada tim. **Pengembangan:** pada situasi yang menuntut pemantauan ketat (audit, quality control), ia perlu lebih sabar terlibat detail operasional.";
        }
        // KASUS 3: Pemimpin Konservatif
        else if (dominantKeys.includes('L') && dominantKeys.includes('P') && latentKeys.includes('I')) {
            narasi = "🎯 **Pemimpin Konservatif** — Kandidat menunjukkan dorongan kuat untuk memimpin (**Peran Kepemimpinan**) dan mengatur orang lain (**Kebutuhan Mengatur Orang Lain**), namun dalam mengambil keputusan ia cenderung berhati-hati (**Kemudahan Mengambil Keputusan** rendah). Ia lebih suka mempertimbangkan banyak hal dan mengumpulkan informasi sebelum memutuskan. " + assertiveCtx + ". **Konteks optimal:** posisi manajerial yang menuntut keputusan matang dengan konsekuensi besar — seperti HR manager, kepala compliance, atau peran yang menangani isu sensitif. **Contoh situasi:** saat menghadapi konflik antar-anggota tim, ia akan mendengarkan semua pihak dan mempertimbangkan berbagai sudut sebelum mengambil tindakan. **Risiko:** pada situasi yang menuntut keputusan cepat (krisis operasional, deadline mendesak), ia perlu melatih diri untuk lebih tegas.";
        }
        // KASUS 4: Penggerak Operasional
        else if (dominantKeys.includes('P') && dominantKeys.includes('I') && latentKeys.includes('L')) {
            narasi = "🎯 **Penggerak Operasional** — Kandidat tidak merasa perlu tampil sebagai 'pemimpin formal', tetapi memiliki dorongan kuat untuk mengatur pekerjaan (**Kebutuhan Mengatur Orang Lain**) dan mengambil keputusan (**Kemudahan Mengambil Keputusan**). Ia lebih nyaman menggerakkan dari sisi teknis atau operasional — memastikan pekerjaan berjalan benar tanpa harus menjadi figur sentral. " + emotionCtx + ". **Konteks optimal:** project coordinator, team lead non-formal, atau orang kepercayaan di belakang pemimpin. **Contoh situasi:** saat tim butuh keputusan cepat di lapangan tapi atasannya tidak ada, ia akan mengambil tanggung jawab dan memutuskan tanpa ragu. **Pengembangan:** pada situasi yang menuntut visibilitas kepemimpinan publik (presentasi ke eksekutif, negosiasi strategis), ia perlu membangun kepercayaan diri untuk tampil di depan.";
        }
        // KASUS 5: Pemimpin Simbolik
        else if (dominantKeys.includes('L') && !dominantKeys.includes('P') && !dominantKeys.includes('I')) {
            narasi = "🎯 **Pemimpin Simbolik** — Kandidat memiliki kebutuhan menonjol untuk memproyeksikan diri sebagai pemimpin (**Peran Kepemimpinan**), tetapi dimensi lain dalam area kepemimpinan tidak selalu mendukung secara merata. Ini bisa berarti ia mengandalkan kharisma atau otoritas posisi, bukan kontrol langsung atau keberanian keputusan. " + assertiveCtx + ". **Konteks optimal:** peran yang menuntut representasi, tokoh panutan, atau figurehead — seperti ketua komite, spokesperson tim, atau lead yang menginspirasi. **Contoh situasi:** saat tim butuh figur yang menenangkan atau mewakili mereka ke pihak eksternal, ia tampil optimal. **Pengembangan:** memperkuat kemampuan teknis kepemimpinan (mengatur, memutuskan) agar tidak hanya terlihat memimpin tapi juga efektif menggerakkan.";
        }
        // KASUS 6: Manajer Kontrol
        else if (dominantKeys.includes('P') && !dominantKeys.includes('L') && !dominantKeys.includes('I')) {
            narasi = "🎯 **Manajer Kontrol** — Kandidat menunjukkan kebutuhan kuat untuk mengendalikan dan mengarahkan pekerjaan orang lain (**Kebutuhan Mengatur Orang Lain**). Ia merasa nyaman mengambil tanggung jawab atas hasil kerja tim, dan cenderung ingin memastikan segala sesuatunya berjalan sesuai standar. " + assertiveCtx + ". **Konteks optimal:** posisi supervisory, manajer operasional, atau kepala shift. **Contoh situasi:** saat ada anggota tim yang tidak mengikuti SOP, ia akan langsung menegur dan mengarahkan sesuai standar yang berlaku. **Risiko:** dorongan kontrol ini perlu diimbangi kepercayaan terhadap kemampuan orang lain agar tidak berubah menjadi micromanagement yang mematikan inisiatif.";
        }
        // KASUS 7: Pengambil Keputusan
        else if (dominantKeys.includes('I') && !dominantKeys.includes('L') && !dominantKeys.includes('P')) {
            narasi = "🎯 **Pengambil Keputusan** — Kandidat menunjukkan kepercayaan diri tinggi dalam mengambil keputusan (**Kemudahan Mengambil Keputusan**). Ia tidak mudah ragu, dan merasa mantap ketika harus menentukan pilihan — bahkan dalam situasi yang ambigu atau penuh ketidakpastian. " + emotionCtx + ". **Konteks optimal:** peran yang menuntut ketegasan dan respons cepat — seperti crisis manager, kapten tim lapangan, atau posisi yang harus sering mengambil keputusan di bawah tekanan waktu. **Contoh situasi:** saat terjadi gangguan operasional dan tidak ada yang mengambil inisiatif, ia akan segera memutuskan langkah penanganan berdasarkan informasi yang ada. **Pengembangan:** perlu diimbangi keterbukaan terhadap informasi baru dan kemampuan meninjau ulang keputusan bila konteks berubah.";
        }
        // KASUS 8: Profil Eksekutif
        else if (dominantKeys.includes('L') && dominantKeys.includes('I')) {
            narasi = "🎯 **Profil Eksekutif** — Kandidat menunjukkan kombinasi kuat antara kenyamanan memimpin (**Peran Kepemimpinan**) dan keberanian mengambil keputusan (**Kemudahan Mengambil Keputusan**). Ini adalah profil yang mampu mengarahkan sekaligus bertindak cepat ketika situasi menuntut. " + emotionCtx + ". **Konteks optimal:** peran kepemimpinan strategis, direktur, atau posisi yang harus mengambil keputusan berdampak besar dengan cepat. **Contoh situasi:** saat organisasi menghadapi perubahan pasar mendadak, ia akan segera mengarahkan tim dan mengambil keputusan strategis untuk menyesuaikan diri.";
        }
        // KASUS 9: Manajer Tegas
        else if (dominantKeys.includes('L') && dominantKeys.includes('P')) {
            narasi = "🎯 **Manajer Tegas** — Kandidat menunjukkan dorongan kuat untuk memimpin (**Peran Kepemimpinan**) dan mengendalikan (**Kebutuhan Mengatur Orang Lain**). Ia tidak hanya nyaman di depan, tetapi juga merasa perlu memastikan pekerjaan orang lain berjalan sesuai arah yang ia tentukan. " + assertiveCtx + ". **Konteks optimal:** posisi manajerial dengan tuntutan kontrol operasional ketat — seperti kepala produksi, manajer QC, atau posisi yang menuntut kepatuhan tinggi terhadap prosedur. **Contoh situasi:** saat ada anggota tim yang menyimpang dari standar, ia akan segera mengambil alih dan mengoreksi tanpa ragu.";
        }
        // KASUS 10: Supervisor Operasional
        else if (dominantKeys.includes('P') && dominantKeys.includes('I')) {
            narasi = "🎯 **Supervisor Operasional** — Kandidat menunjukkan kemampuan mengendalikan orang lain (**Kebutuhan Mengatur Orang Lain**) sekaligus mengambil keputusan dengan mantap (**Kemudahan Mengambil Keputusan**). Kombinasi ini efektif pada peran yang menuntut pengawasan sekaligus keputusan cepat. **Konteks optimal:** supervisor produksi, manajer operasional, atau kepala shift. **Contoh situasi:** saat ada masalah operasional yang perlu keputusan cepat, ia akan segera mengarahkan tim dan memutuskan langkah penanganan tanpa menunggu instruksi atasan.";
        }
        // FALLBACK: Profil Fleksibel
        else {
            narasi = "🎯 **Profil Kepemimpinan Fleksibel** — Kandidat menunjukkan dorongan kepemimpinan yang bergantung pada konteks. Ia dapat mengambil peran memimpin ketika situasi menuntut, tetapi juga nyaman berada di belakang layar bila ada pihak lain yang lebih tepat memimpin. " + emotionCtx + ". " + assertiveCtx + ". **Konteks optimal:** peran lintas fungsi, koordinator, atau posisi yang menuntut kolaborasi. **Contoh situasi:** saat tim membutuhkan pemimpin, ia akan maju; saat ada figur lain yang lebih tepat, ia akan mendukung dari belakang. **Pengembangan:** kejelasan dalam menentukan kapan harus maju dan kapan harus mendukung.";
        }
        
        // Dinamika internal
        if (layers.dominant.length > 0 && layers.latent.length > 0) {
            const namaDominan = _namesOf(layers.dominant);
            const namaLatent = _namesOf(layers.latent);
            narasi += "\n\n📊 **Dinamika internal** — Kekuatan: " + namaDominan + ". Pengembangan: " + namaLatent + ".";
        }
        
        return narasi;
    }

    // ==========================================================
    // 2. HUBUNGAN SOSIAL — Narasi Kontekstual
    // ==========================================================
    function buildSocialSummary() {
        const items = getGroupScores(['S', 'B', 'O', 'X']);
        if (items.length < 4) {
            return 'Data hubungan sosial belum lengkap untuk dianalisis.';
        }
        
        const S = getActualScore('S');
        const B = getActualScore('B');
        const O = getActualScore('O');
        const X = getActualScore('X');
        const layers = _layerize(items);
        const pattern = _profilePattern(items);
        
        const dominantKeys = layers.dominant.map(x => x.key);
        const latentKeys = layers.latent.map(x => x.key);
        
        let narasi = "";
        
        // KASUS 1: Sosial Penuh
        if (dominantKeys.includes('S') && dominantKeys.includes('B') && dominantKeys.includes('O')) {
            narasi = "🎯 **Sosial Penuh** — Kandidat menunjukkan orientasi sosial yang utuh: nyaman berinteraksi (**Hubungan Sosial**), terdorong menjadi bagian dari kelompok (**Kebutuhan Menjadi Bagian Kelompok**), dan cukup peka terhadap kebutuhan interpersonal (**Kebutuhan Kedekatan Interpersonal**). Ia cenderung mudah membangun hubungan dan menjadi penggerak dalam dinamika tim. **Konteks optimal:** peran yang menuntut kolaborasi intens, customer-facing, atau kerja lintas fungsi — seperti account manager, HR business partner, atau community manager. **Contoh situasi:** saat tim mengalami konflik internal, ia akan menjadi jembatan komunikasi dan membantu menyelesaikan perbedaan. **Pengembangan:** pada situasi yang menuntut keputusan tidak populer, kepekaan sosial yang tinggi bisa membuatnya enggan menyampaikan hal yang berpotensi mengganggu harmoni.";
        }
        // KASUS 2: Sosialis Praktis
        else if (dominantKeys.includes('S') && dominantKeys.includes('B') && latentKeys.includes('O')) {
            narasi = "🎯 **Sosialis Praktis** — Kandidat menunjukkan kebutuhan kuat untuk berinteraksi (**Hubungan Sosial**) dan menjadi bagian dari kelompok (**Kebutuhan Menjadi Bagian Kelompok**), tetapi tidak terlalu bergantung pada kedekatan emosional yang mendalam. Ia nyaman bergaul dalam lingkaran luas, tetapi menjaga jarak yang sehat. **Konteks optimal:** peran yang menuntut jaringan luas tanpa harus terlibat personal mendalam — seperti business development, partnership manager, atau peran lintas organisasi. **Contoh situasi:** saat harus membangun kemitraan dengan pihak eksternal, ia akan mudah membuka percakapan tanpa merasa perlu terikat secara personal.";
        }
        // KASUS 3: Sosialis Independen
        else if (dominantKeys.includes('S') && dominantKeys.includes('O') && latentKeys.includes('B')) {
            narasi = "🎯 **Sosialis Independen** — Kandidat nyaman berinteraksi (**Hubungan Sosial**) dan cukup peka terhadap kebutuhan orang lain (**Kebutuhan Kedekatan Interpersonal**), tetapi tidak merasa perlu selalu menjadi bagian dari kelompok tertentu. Ia bisa bergaul dengan banyak orang namun tetap memiliki jarak yang sehat. **Konteks optimal:** peran yang menuntut jaringan luas tanpa kehilangan independensi — seperti konsultan, freelancer, atau spesialis yang bekerja lintas tim. **Contoh situasi:** saat harus berganti-ganti tim untuk berbagai proyek, ia akan cepat beradaptasi tanpa kehilangan jati diri.";
        }
        // KASUS 4: Setia Kelompok
        else if (dominantKeys.includes('B') && dominantKeys.includes('O') && latentKeys.includes('S')) {
            narasi = "🎯 **Setia Kelompok** — Kandidat menunjukkan kebutuhan kuat untuk menjadi bagian dari kelompok yang erat (**Kebutuhan Menjadi Bagian Kelompok**) dan peka terhadap kebutuhan interpersonal (**Kebutuhan Kedekatan Interpersonal**). Ia lebih mengutamakan kedalaman relasi daripada luasnya jaringan. **Konteks optimal:** peran yang menuntut loyalitas, kerja tim yang erat, dan dedikasi jangka panjang — seperti tim R&D, tim proyek jangka panjang, atau peran yang membutuhkan kepercayaan tinggi. **Contoh situasi:** saat tim menghadapi masa sulit, ia akan tetap setia dan berusaha menjaga kohesi kelompok. **Pengembangan:** keterbukaan terhadap jaringan baru agar tidak terjebak dalam kelompok yang terlalu eksklusif.";
        }
        // KASUS 5: Ekstrovert Sosial
        else if (dominantKeys.includes('S') && !dominantKeys.includes('B') && !dominantKeys.includes('O')) {
            narasi = "🎯 **Ekstrovert Sosial** — Kandidat menunjukkan kebutuhan tinggi untuk berinteraksi dan berkomunikasi (**Hubungan Sosial**). Ia merasa berenergi saat berada di tengah orang banyak, mudah memulai percakapan, dan cenderung menjadi penghubung dalam tim. **Konteks optimal:** peran yang menuntut interaksi intens, presentasi, atau negosiasi — seperti sales, marketing, atau public relations. **Contoh situasi:** saat harus mempresentasikan ide ke banyak pihak, ia akan tampil percaya diri dan energik. **Pengembangan:** pada pekerjaan yang menuntut fokus soliter dalam waktu lama, ia mungkin merasa cepat bosan dan kehilangan energi.";
        }
        // KASUS 6: Setia Kelompok (B saja)
        else if (dominantKeys.includes('B') && !dominantKeys.includes('S') && !dominantKeys.includes('O')) {
            narasi = "🎯 **Setia Kelompok** — Kandidat memiliki dorongan kuat untuk menjadi bagian dari kelompok (**Kebutuhan Menjadi Bagian Kelompok**) — ia menghargai kebersamaan, komitmen, dan rasa memiliki. **Konteks optimal:** budaya organisasi yang menekankan kerja tim dan loyalitas — seperti perusahaan keluarga, tim dengan ikatan kuat, atau organisasi dengan budaya kolektif. **Contoh situasi:** saat ada anggota tim baru, ia akan berusaha membuat mereka merasa diterima dan menjadi bagian dari kelompok. **Pengembangan:** pada situasi yang menuntut keputusan independen, dorongan untuk selalu selaras dengan kelompok bisa membuatnya enggan mengambil sikap berbeda.";
        }
        // KASUS 7: Hangat
        else if (dominantKeys.includes('O') && !dominantKeys.includes('S') && !dominantKeys.includes('B')) {
            narasi = "🎯 **Hangat** — Kandidat menunjukkan kepekaan interpersonal yang menonjol (**Kebutuhan Kedekatan Interpersonal**) — ia memperhatikan perasaan orang lain, mudah menangkap nuansa emosional, dan cenderung membangun kedekatan yang tulus. **Konteks optimal:** peran yang menuntut empati — seperti HR, coaching, customer relations, atau peran pendampingan. **Contoh situasi:** saat ada anggota tim yang sedang mengalami kesulitan, ia akan menjadi pendengar yang baik dan menawarkan dukungan. **Pengembangan:** kepekaan yang tinggi bisa membuatnya terlalu terlibat secara emosional, sehingga perlu menjaga batas profesional.";
        }
        // KASUS 8: Cari Pengakuan
        else if (dominantKeys.includes('X') && !dominantKeys.includes('S') && !dominantKeys.includes('B') && !dominantKeys.includes('O')) {
            narasi = "🎯 **Cari Pengakuan** — Kandidat menunjukkan kebutuhan menonjol untuk diperhatikan dan diakui (**Kebutuhan Untuk Diperhatikan**). Ia senang menonjolkan pencapaian, mengharapkan apresiasi, dan merasa termotivasi oleh pengakuan publik. **Konteks optimal:** peran yang menuntut kehadiran sosial tinggi — seperti sales, marketing, MC, atau posisi public-facing. **Contoh situasi:** saat berhasil mencapai target, ia akan merasa termotivasi ketika pencapaiannya diakui di depan tim. **Pengembangan:** dorongan mencari perhatian perlu diimbangi kepekaan terhadap kontribusi orang lain agar tidak dianggap egois.";
        }
        // KASUS 9: Sosialis Ekspresif
        else if (dominantKeys.includes('S') && dominantKeys.includes('X')) {
            narasi = "🎯 **Sosialis Ekspresif** — Kandidat menunjukkan kombinasi sosial yang ekspresif: nyaman berinteraksi (**Hubungan Sosial**) sekaligus ingin diperhatikan dan diakui (**Kebutuhan Untuk Diperhatikan**). Ia tampil sebagai figur yang hadir dan terlihat dalam dinamika kelompok. **Konteks optimal:** peran public-facing, MC, atau posisi yang menuntut kehadiran sosial yang kuat — seperti brand ambassador, event host, atau public speaker.";
        }
        // FALLBACK: Sosial Fleksibel
        else {
            narasi = "🎯 **Sosial Fleksibel** — Kebutuhan hubungan sosial kandidat berada pada tingkat yang seimbang. Ia dapat menikmati interaksi sosial namun tidak bergantung pada kehadiran orang lain. **Konteks optimal:** peran yang menuntut adaptasi sosial — dari kerja tim hingga fokus soliter. **Contoh situasi:** saat bekerja dalam tim, ia dapat berkontribusi; saat bekerja mandiri, ia juga produktif. **Pengembangan:** fleksibilitas dalam menyesuaikan intensitas sosial dengan tuntutan konteks.";
        }
        
        // Dinamika internal
        if (layers.dominant.length > 0 && layers.latent.length > 0) {
            const namaDominan = _namesOf(layers.dominant);
            const namaLatent = _namesOf(layers.latent);
            narasi += "\n\n📊 **Dinamika internal** — Kekuatan: " + namaDominan + ". Pengembangan: " + namaLatent + ".";
        }
        
        return narasi;
    }

    // ==========================================================
    // 3. SIKAP KERJA — Narasi Kontekstual
    // ==========================================================
    function buildWorkAttitudeSummary() {
        const items = getGroupScores(['N', 'G', 'A', 'V', 'T', 'R', 'D', 'C']);
        if (items.length < 8) {
            return 'Data sikap kerja belum lengkap untuk dianalisis.';
        }
        
        const N = getActualScore('N');
        const G = getActualScore('G');
        const A = getActualScore('A');
        const V = getActualScore('V');
        const T = getActualScore('T');
        const R = getActualScore('R');
        const D = getActualScore('D');
        const C = getActualScore('C');
        const layers = _layerize(items);
        
        const dominantKeys = layers.dominant.map(x => x.key);
        const latentKeys = layers.latent.map(x => x.key);
        
        let narasi = "";
        
        // Deteksi kluster
        const effortCluster = ['N', 'G', 'A'].filter(k => dominantKeys.includes(k));
        const structureCluster = ['C', 'D'].filter(k => dominantKeys.includes(k));
        const energyCluster = ['T', 'V'].filter(k => dominantKeys.includes(k));
        const theoryCluster = ['R'].filter(k => dominantKeys.includes(k));
        
        // KASUS 1: Pekerja Terstruktur & Produktif
        if (effortCluster.length >= 2 && structureCluster.length >= 1) {
            const effortNames = effortCluster.map(k => PAPI_DIM_LABEL[k]).join(", ");
            const structureNames = structureCluster.map(k => PAPI_DIM_LABEL[k]).join(", ");
            narasi = "🎯 **Pekerja Terstruktur & Produktif** — Kandidat menunjukkan kombinasi kuat antara **" + effortNames + "** dengan **" + structureNames + "**. Ia bukan hanya ambisius dan tekun, tetapi juga sistematis dan bertanggung jawab. **Konteks optimal:** peran dengan target tinggi dan tuntutan akurasi — seperti finance manager, project manager, atau posisi quality control senior. **Contoh situasi:** saat menghadapi deadline ketat, ia akan menyusun rencana kerja terstruktur dan mengeksekusinya dengan disiplin. **Pengembangan:** menjaga keseimbangan antara ambisi dan istirahat agar tidak burnout.";
        }
        // KASUS 2: Pekerja Ambisius
        else if (effortCluster.length >= 2) {
            const effortNames = effortCluster.map(k => PAPI_DIM_LABEL[k]).join(", ");
            narasi = "🎯 **Pekerja Ambisius** — Kandidat menunjukkan kekuatan utama pada **" + effortNames + "**. Ia berorientasi pada hasil, tidak mudah menyerah pada tuntutan kerja, dan merasa terdorong untuk membuktikan kemampuan. **Konteks optimal:** peran kompetitif atau peran dengan target yang jelas dan terukur — seperti sales manager, business development, atau posisi dengan KPI ketat. **Contoh situasi:** saat diberikan target tinggi, ia akan menyusun strategi ambisius dan bekerja keras untuk mencapainya. **Pengembangan:** pada peran yang menuntut konsistensi jangka panjang, perlu menjaga ritme agar tidak cepat kehabisan energi.";
        }
        // KASUS 3: Pekerja Presisi
        else if (structureCluster.length >= 2) {
            const structureNames = structureCluster.map(k => PAPI_DIM_LABEL[k]).join(", ");
            narasi = "🎯 **Pekerja Presisi** — Kandidat menunjukkan preferensi kuat terhadap **" + structureNames + "**. Ia nyaman dengan prosedur yang jelas, teliti dalam detail, dan merasa tidak nyaman dengan pekerjaan yang serba kasar. **Konteks optimal:** peran yang menuntut akurasi tinggi — seperti quality control, keuangan, audit, atau analisis data. **Contoh situasi:** saat menemukan selisih kecil dalam laporan, ia akan menelusuri hingga detail untuk memastikan akurasi. **Pengembangan:** pada peran yang menuntut kecepatan, ia perlu menyeimbangkan presisi dengan efisiensi waktu.";
        }
        // KASUS 4: Pekerja Dinamis
        else if (energyCluster.length >= 1) {
            const energyNames = energyCluster.map(k => PAPI_DIM_LABEL[k]).join(", ");
            narasi = "🎯 **Pekerja Dinamis** — Kandidat menunjukkan energi kerja yang menonjol pada **" + energyNames + "**. Ia bergerak cepat, tidak suka menunda, dan merasa hidup ketika pekerjaan berjalan dinamis. **Konteks optimal:** lingkungan yang menuntut kecepatan dan mobilitas tinggi — seperti operasional, sales lapangan, atau peran dengan volume kerja besar. **Contoh situasi:** saat menghadapi banyak pekerjaan bersamaan, ia akan bergerak cepat dan menikmati ritme tinggi tersebut. **Pengembangan:** pada pekerjaan yang menuntut fokus mendalam (analisis, perencanaan), ia perlu belajar memperlambat tempo.";
        }
        // KASUS 5: Pemikir Konseptual
        else if (theoryCluster.length >= 1) {
            narasi = "🎯 **Pemikir Konseptual** — Kandidat menunjukkan orientasi teoretis yang kuat (**Orientasi Teoretis**). Ia senang berpikir mendalam, menganalisis prinsip, dan merasa tertarik pada gagasan-gagasan abstrak. **Konteks optimal:** peran yang menuntut analisis konseptual, riset, atau pengembangan strategi — seperti business analyst, researcher, atau strategic planner. **Contoh situasi:** saat menghadapi masalah kompleks, ia akan menganalisis akar penyebab dan menyusun solusi konseptual. **Pengembangan:** pada situasi yang menuntut tindakan cepat, ia perlu belajar mengimbangi analisis dengan eksekusi praktis.";
        }
        // FALLBACK: Pekerja Stabil
        else {
            narasi = "🎯 **Pekerja Stabil** — Dorongan kerja kandidat berada pada tingkat yang seimbang. Ia dapat bekerja dengan stabil tanpa dorongan ambisi yang berlebihan. **Konteks optimal:** peran yang menuntut konsistensi jangka panjang — seperti posisi administratif, operasional rutin, atau peran support. **Contoh situasi:** saat menjalani pekerjaan rutin, ia akan konsisten dan dapat diandalkan. **Pengembangan:** pada situasi yang menuntut inisiatif tinggi, ia perlu membangun dorongan internal untuk lebih proaktif.";
        }
        
        // Dinamika internal
        if (layers.dominant.length > 0 || layers.latent.length > 0) {
            const parts = [];
            if (layers.dominant.length > 0) {
                parts.push("Kekuatan: " + _namesOf(layers.dominant));
            }
            if (layers.latent.length > 0) {
                parts.push("Pengembangan: " + _namesOf(layers.latent));
            }
            narasi += "\n\n📊 **Dinamika internal** — " + parts.join(". ") + ".";
        }
        
        return narasi;
    }

    // ==========================================================
    // 4. ADAPTASI — Narasi Kontekstual
    // ==========================================================
    function buildAdaptationSummary() {
        const items = getGroupScores(['Z', 'E', 'K', 'F', 'W']);
        if (items.length < 5) {
            return 'Data adaptasi belum lengkap untuk dianalisis.';
        }
        
        const Z = getActualScore('Z');
        const E = getActualScore('E');
        const K = getActualScore('K');
        const F = getActualScore('F');
        const W = getActualScore('W');
        const layers = _layerize(items);
        
        const dominantKeys = layers.dominant.map(x => x.key);
        const latentKeys = layers.latent.map(x => x.key);
        
        let narasi = "";
        
        const highZ = Z >= 5 && dominantKeys.includes('Z');
        const lowZ = Z <= 4 && latentKeys.includes('Z');
        const highE = E >= 6;
        const lowE = E <= 3;
        const highK = K >= 6;
        const lowK = K <= 3;
        const highW = W >= 5;
        const highF = F >= 5;
        
        // KASUS 1: Fleksibel & Mandiri
        if (highZ && (dominantKeys.includes('Z')) && (highK || highE)) {
            narasi = "🎯 **Fleksibel & Mandiri** — Kandidat menunjukkan profil adaptif yang mandiri: mencari perubahan dan variasi (**Kebutuhan Terhadap Perubahan**), tidak membutuhkan banyak arahan eksternal, dan memiliki kestabilan emosi atau ketegasan. **Konteks optimal:** peran yang menuntut inisiatif, otonomi, dan kemampuan menavigasi situasi ambigu — seperti startup environment, peran konsultan, atau posisi yang sering menghadapi perubahan. **Contoh situasi:** saat proyek berubah arah mendadak, ia akan cepat beradaptasi dan mencari cara baru untuk mencapai tujuan. **Pengembangan:** dalam organisasi yang menuntut kepatuhan ketat, gaya ini bisa terasa 'terlalu bebas' — perlu keseimbangan antara otonomi dan kolaborasi.";
        }
        // KASUS 2: Stabil & Terstruktur
        else if (lowZ && (highW || highF)) {
            narasi = "🎯 **Stabil & Terstruktur** — Kandidat menunjukkan preferensi kuat terhadap stabilitas, aturan, dan struktur yang jelas. Ia merasa nyaman dengan rutinitas, menghargai hierarki, dan lebih produktif bila ekspektasi kerjanya terdefinisi dengan baik. **Konteks optimal:** peran yang menuntut konsistensi, kepatuhan prosedural, atau lingkungan yang sudah mapan — seperti pemerintahan, perbankan, atau perusahaan dengan SOP ketat. **Contoh situasi:** saat menjalani prosedur rutin, ia akan menjalankannya dengan disiplin dan konsisten. **Pengembangan:** fleksibilitas menghadapi perubahan tak terduga agar tidak kaku.";
        }
        // KASUS 3: Eksploratif
        else if (highZ && !highW && !highF) {
            narasi = "🎯 **Eksploratif** — Kandidat menunjukkan orientasi eksploratif yang kuat: mencari perubahan, variasi, dan gagasan baru tanpa perlu banyak pengawasan eksternal. Ia lebih suka mengatur sendiri cara kerjanya dan merasa bosan dengan rutinitas. **Konteks optimal:** peran kreatif, inovasi, atau lingkungan startup yang dinamis — seperti R&D, product development, atau creative director. **Contoh situasi:** saat harus menyelesaikan masalah dengan cara lama, ia akan mencari pendekatan baru yang lebih efisien. **Pengembangan:** dalam sistem yang menuntut prosedur ketat, gaya ini perlu adaptasi.";
        }
        // KASUS 4: Tegas & Ekspresif
        else if (highK && lowE) {
            narasi = "🎯 **Tegas & Ekspresif** — Kandidat menunjukkan ketegasan yang kuat (**Kebutuhan Bersikap Tegas**) disertai ekspresi emosi yang terbuka (**Pengendalian Emosi** rendah). Ia berani menyampaikan pendapat, tidak mudah mundur pada tekanan, dan tidak menyimpan perasaan di dalam. **Konteks optimal:** peran yang menuntut advokasi, negosiasi keras, atau kepemimpinan yang tegas — seperti negosiator, sales manager, atau tim legal. **Contoh situasi:** saat harus mempertahankan posisi dalam negosiasi, ia akan tegas dan tidak mudah mundur. **Pengembangan:** pada situasi yang menuntut diplomasi, ia perlu mengelola intensitas agar tidak terkesan konfrontatif.";
        }
        // KASUS 5: Tenang & Menahan Diri
        else if (highE && !highK) {
            narasi = "🎯 **Tenang & Menahan Diri** — Kandidat menunjukkan pengendalian emosi yang kuat (**Pengendalian Emosi**): cenderung menahan ekspresi perasaan, menjaga jarak, dan mempertahankan ketenangan di bawah tekanan. **Konteks optimal:** peran yang menuntut stabilitas emosional tinggi — seperti mediasi, negosiasi sensitif, atau posisi dengan tekanan publik. **Contoh situasi:** saat menghadapi pelanggan marah atau krisis, ia akan tetap tenang dan profesional. **Pengembangan:** keterbukaan komunikasi perlu tetap dijaga agar tidak dianggap 'tertutup' atau sulit dibaca.";
        }
        // KASUS 6: Kombinasi Z + W
        else if (highZ && highW) {
            narasi = "🎯 **Adaptif Terarah** — Kandidat mencari perubahan (**Kebutuhan Terhadap Perubahan**) tetapi tetap membutuhkan kerangka kerja yang jelas (**Kebutuhan Terhadap Aturan**). **Konteks optimal:** lingkungan yang dinamis namun tetap terstruktur — seperti organisasi yang sedang bertransformasi dengan arah terdefinisi, atau tim agile dengan sprint terencana. **Contoh situasi:** saat harus mengadopsi sistem baru, ia akan antusias belajar tapi tetap butuh panduan implementasi yang jelas.";
        }
        // KASUS 7: Kombinasi Z + F
        else if (highZ && highF) {
            narasi = "🎯 **Adaptif Terarah** — Kandidat menyukai perubahan (**Kebutuhan Terhadap Perubahan**) tetapi tetap menghargai arahan dan otoritas yang jelas (**Dukungan Terhadap Otoritas**). **Konteks optimal:** peran yang menuntut inovasi dalam kerangka kebijakan terdefinisi — seperti product manager di perusahaan besar, atau posisi yang harus menyeimbangkan inovasi dengan compliance.";
        }
        // FALLBACK: Adaptasi Fleksibel
        else {
            narasi = "🎯 **Adaptasi Fleksibel** — Profil adaptasi kandidat relatif seimbang: sikapnya terhadap perubahan, emosi, ketegasan, otoritas, dan struktur berada pada tingkat moderat. Ia fleksibel dan dapat menyesuaikan gaya adaptasinya dengan konteks yang dihadapi. **Konteks optimal:** peran yang menuntut adaptasi beragam — dari inovasi hingga konsistensi. **Contoh situasi:** saat menghadapi perubahan kecil, ia dapat menyesuaikan diri; saat menghadapi perubahan besar, ia juga bisa bertahan. **Pengembangan:** kejelasan arah adaptasi sesuai tuntutan peran.";
        }
        
        // Dinamika internal
        if (layers.dominant.length > 0 && layers.latent.length > 0) {
            const namaDominan = _namesOf(layers.dominant);
            const namaLatent = _namesOf(layers.latent);
            narasi += "\n\n📊 **Dinamika internal** — Kekuatan: " + namaDominan + ". Pengembangan: " + namaLatent + ".";
        }
        
        return narasi;
    }

    // ==========================================================
    // RENDER KOMPONEN
    // ==========================================================
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
    // EXECUTIVE SUMMARY
    // ==========================================================
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
        const rawNarasi = group.build();
        // FIX: Convert markdown bold + emoji jadi HTML yang proper
        const cleanNarasi = rawNarasi
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')   // **text** → <strong>text</strong>
            .replace(/🎯\s*/g, '')                                 // hapus emoji target
            .replace(/⚠️\s*/g, '')                                // hapus emoji warning
            .replace(/⚖️\s*/g, '')                                // hapus emoji balance
            .replace(/📊\s*/g, '')                                 // hapus emoji chart
            .replace(/\n\n/g, '<br><br>');                         // line break
        return `<li style="margin-bottom: 14px; line-height: 1.7;"><strong>${group.title}:</strong><br>${cleanNarasi}</li>`;
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

// ==========================================================
// EXPORT KE WINDOW
// ==========================================================
if (typeof window !== 'undefined') {
    window.renderTestResult = renderTestResult;
    window.renderPAPIPage = renderTestResult;
    window.renderPAPIResult = renderTestResult;
    window.PAPIAssessment = {
        render: renderTestResult
    };
}