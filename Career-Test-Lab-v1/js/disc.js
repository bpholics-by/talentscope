/* ==========================================================
   DISC.JS
   TALENTSCOPE
   ----------------------------------------------------------
   MODULE:
   - DISC typological behaviour database
   - DISC Graph 1 / MOST
   - DISC Graph 2 / LEAST
   - DISC Graph 3 / CHANGE
   - Typological code berdasarkan Graph 3 / CHANGE
   ========================================================== */


/* ==========================================================
   DISC TYPOLOGICAL BEHAVIOUR DATABASE
   SOURCE:
   TABEL INTERPRETASI DISC YANG DITETAPKAN
========================================================== */

const DISC_TYPOLOGICAL_PATTERNS = {

    SDCI: {
        name: "INQUIRER PATTERN",

        strengths: [
            "Sabar dan terkontrol",
            "Faktual serta menggunakan logika dan analisis",
            "Tekun dalam mencapai tujuan",
            "Berorientasi pada pelayanan",
            "Dapat diandalkan",
            "Mampu mengumpulkan data dan merencanakan pekerjaan dengan hati-hati"
        ],

        weaknesses: [
            "Cenderung lambat mengambil inisiatif",
            "Tidak cepat beradaptasi terhadap perubahan",
            "Dapat menjadi kaku setelah mengambil keputusan",
            "Dapat terlihat keras kepala ketika sangat yakin terhadap keputusannya"
        ],

        description: `
            Mereka yang termasuk Inquirer memperlihatkan suatu sifat sabar,
            terkontrol, factual yang dikombinasi dengan tekad mencapai tujuan mereka.
            Penuh pertimbangan dan sederhana, mereka berhubungan dengan sebagian besar
            orang dengan baik; namun bila perlu, mereka dapat menentukan pendirian.
            Hubungan yang dekat sangat penting dengan mereka, tetapi mereka selektif
            dalam memilih kawan. Mereka merencanakan pekerjaan mereka dengan hati-hati,
            tetapi secara agresif mengajukan pertanyaan dan mengumpulkan data.
            Hal ini diikuti dengan upaya konsisten dalam saluran-saluran yang terarah.
            Inquirer dengan C sebagai karakteristik sekunder umumnya lambat dalam
            mengambil inisiatif dan tidak beradaptasi dengan cepat untuk berubah.
            Namun demikian, bila D merupakan karakteristik sekunder, orang ini akan
            lebih berorientasi pada tujuan dan agresif dalam tanggung jawab mereka.
            Karena keteguhan kuat, Inquirer bisa berhasil dalam banyak hal.
            Mereka menggunakan logika dan analisis untuk membuat keputusan, dan mereka
            dapat bersikap kaku setelah membuat keputusan ini. Inquirer akan bangkit
            menghadapi tantangan dan tidak mundur jika mereka sangat yakin akan hasilnya.
            Mereka berorientasi pada jasa layanan dan sangat dapat diandalkan.
        `
    },


    SICD: {
        name: "AGENT PATTERN",

        strengths: [
            "Empatik dan mengutamakan hubungan",
            "Mampu menciptakan harmonisasi kelompok",
            "Toleran dan menerima orang lain",
            "Persuasif melalui pendekatan interpersonal",
            "Mendukung kerja sama dan pertemanan"
        ],

        weaknesses: [
            "Cenderung menghindari konflik",
            "Dapat terlalu mencari dukungan kelompok",
            "Dapat kesulitan bersikap tegas",
            "Perlu meningkatkan kemampuan berkata tidak ketika diperlukan"
        ],

        description: `
            Mereka yang tergolong Agent Pattern selalu menerima kasih sayang
            dan menolak agresi. Bertujuan agar dapat diterima oleh kelompok,
            memiliki komitmen untuk bertoleransi dan menerima semua orang.
            Mengedepankan perasaan empati dan pertemanan. Cenderung mencari dukungan
            atau sokongan dan harmonisasi. Apabila berada dalam tekanan, tipe Agent
            Pattern selalu mencoba untuk bersikap persuasif, berusaha untuk
            mempengaruhi orang lain atas dasar pertemanan. Tipe Agent Pattern selalu
            menghindari dan lari dari konflik dan perselisihan. Tipe Agent Pattern
            akan efektif jika mampu bersikap tegas, asertif dan mampu berkata
            "TIDAK" saat diperlukan.
        `
    },


    ICDS: {
        name: "APPRAISER PATTERN",

        strengths: [
            "Berorientasi pada keberhasilan",
            "Memiliki dorongan kompetitif",
            "Mampu mengarahkan orang menuju tujuan",
            "Kreatif dalam mencapai tujuan bersama",
            "Memiliki perhatian terhadap otoritas dan pencapaian"
        ],

        weaknesses: [
            "Dapat tidak sabar ketika berada dalam tekanan",
            "Cenderung kritis ketika target tidak tercapai",
            "Dapat memforsir tenaga",
            "Perlu meningkatkan empati ketika terjadi ketidaksepakatan",
            "Perlu menjaga kestabilan dan menghindari ketakutan terhadap kegagalan"
        ],

        description: `
            Mereka yang tergolong tipe Appraiser Pattern cenderung ingin terlihat sukses,
            berprinsip "KEMENANGAN YANG MENARIK", selalu mencari pengakuan atau penghargaan
            atas kompetisi. Tipe ini cenderung mengedepankan otoritas, selalu melihat
            kemampuan orang lain sebelum memulai aktivitas. Memiliki nilai-nilai untuk
            mencapai tujuan bersama dalam tim dengan menunjukkan kreativitas.
            Appraiser apabila berada dalam tekanan cenderung memforsir tenaga,
            tidak sabaran, kritis, takut gagal dan kalah. Appraiser akan lebih efektif
            apabila lebih menunjukkan sikap empati apabila merasa tidak sepakat,
            lebih stabil dan bertindak secara individu dalam mencapai tujuan.
        `
    },


    ISDC: {
        name: "MOTIVATOR PATTERN",

        strengths: [
            "Mampu memotivasi orang lain",
            "Komunikatif dan mampu membangun hubungan",
            "Berorientasi pada hasil",
            "Kuat dalam pemecahan masalah",
            "Mampu memimpin sekaligus mendukung tim",
            "Tekun menghadapi tantangan"
        ],

        weaknesses: [
            "Membutuhkan pengakuan dan penghargaan",
            "Dapat terlalu menggeneralisasi kegagalan atau penolakan",
            "Membutuhkan penegasan dalam situasi tertentu",
            "Perlu menjaga konsistensi ketika menghadapi tekanan"
        ],

        description: `
            Mereka yang termasuk Motivator memperlihatkan suatu style yang menyemangati
            bilamana termotivasi oleh suatu tujuan. Mereka lebih suka memimpin atau
            bertanggung jawab atas sesuatu, tetapi mereka juga dapat menjadi seorang
            supporter. Motivator memerlukan pengakuan dan penghargaan. Motivator
            memperhatikan orang di sekitar mereka dan mempertimbangkan perasaan orang
            lain dalam proses pembuatan keputusan. Dengan memperlihatkan kemampuan yang
            baik dalam berhubungan dengan orang, mereka berupaya mencari cara untuk
            menyelesaikan tugas dengan cepat dan efisien. Motivator memiliki kemampuan
            menyelesaikan masalah yang kuat dan lebih suka mencapai tujuan mereka dengan
            memimpin kelompoknya dengan ketekunan dan kesetiaan. Karena teguh dan
            bersemangat, Motivator dengan sungguh-sungguh menerima tantangan dan bekerja
            untuk hasil yang positif bagi situasi yang ada. Mereka memiliki kemampuan
            untuk mendengarkan secara kreatif dan berkomunikasi secara efektif.
        `
    },


    DCSI: {
        name: "CREATIVE PATTERN",

        strengths: [
            "Kreatif dan inovatif",
            "Berorientasi pada pencapaian unik",
            "Mampu mengembangkan sistem atau metode baru",
            "Berani melakukan perubahan",
            "Memiliki standar pribadi yang kuat"
        ],

        weaknesses: [
            "Mudah bosan dengan pekerjaan rutin",
            "Dapat kritis atau keras dalam berinteraksi",
            "Dapat bertindak terlalu mengikuti caranya sendiri",
            "Mudah frustrasi ketika ditolak",
            "Perlu meningkatkan komunikasi diplomatis dan kerja sama"
        ],

        description: `
            Orang yang tergolong Creative Pattern cenderung menerima agresi dan
            menahan ekspresi. Mereka bertujuan untuk mendominasi dan pencapaian yang
            unik atau berbeda. Tipe ini cenderung melakukan penilaian berdasarkan
            standar pribadi, ide atau metode yang baru dalam menyelesaikan tugas.
            Selalu berusaha mempercepat perkembangan sistem dan mencoba melakukan
            pendekatan inovatif. Dimulai dengan merancang atau mendesain perubahan.
            Creative Pattern cenderung kritis, mudah bosan dengan pekerjaan rutin,
            cenderung bertingkah semaunya dan marah ketika merasa ditolak.
            Creative Pattern akan lebih efektif jika dapat berkomunikasi secara
            diplomatis dan bekerja sama secara efektif.
        `
    },


    DCIS: {
        name: "DEVELOPER PATTERN",

        strengths: [
            "Bertanggung jawab terhadap hasil",
            "Berorientasi pada peluang",
            "Kuat dalam mencari solusi",
            "Tidak mudah memindahkan tanggung jawab kepada orang lain",
            "Inovatif dalam menyelesaikan masalah",
            "Mandiri dan berorientasi pada tantangan"
        ],

        weaknesses: [
            "Cenderung mengontrol orang lain atau situasi",
            "Lebih menyukai bekerja sendiri",
            "Dapat menjadi agresif ketika cara kerja dikritik",
            "Mudah bosan ketika pekerjaan kehilangan tantangan"
        ],

        description: `
            Orang yang tergolong Developer Pattern cenderung menaruh perhatian lebih
            untuk memenuhi kebutuhan pribadi. Mereka selalu berorientasi untuk mencari
            kesempatan atau peluang baru. Tipe ini tergolong individu yang cukup
            bertanggung jawab. Developer Pattern cenderung mencari solusi yang tepat
            dalam menghadapi masalah. Mereka selalu berusaha untuk tidak memindahkan
            tanggung jawab ke orang lain dan mencari berbagai cara yang inovatif atau
            baru dalam menyelesaikan masalah. Di sisi lain, untuk mencapai tujuannya,
            tipe Developer Pattern cenderung mengontrol orang lain dan situasi.
            Mereka lebih menyukai untuk bekerja sendiri dan dapat menjadi agresif bila
            cara kerjanya dikritik atau hilangnya tantangan.
        `
    },


    DICS: {
        name: "INSPIRATIONAL / RESULT-ORIENTED PATTERN",

        strengths: [
            "Visioner dan progresif",
            "Kuat dalam mencapai tujuan",
            "Berani memimpin",
            "Memiliki energi dan motivasi tinggi",
            "Mampu mempengaruhi dan menggerakkan orang",
            "Menetapkan standar tinggi"
        ],

        weaknesses: [
            "Dapat terlihat dingin atau terlalu terus terang",
            "Cenderung terlalu berorientasi pada tugas",
            "Dapat kritis ketika standar tidak terpenuhi",
            "Mudah frustrasi ketika tidak ada hasil",
            "Perlu meningkatkan sensitivitas terhadap orang lain"
        ],

        description: `
            Mereka yang termasuk Inspirational / Result-Oriented memperlihatkan suatu
            kecenderungan menjadi individu yang kuat. Mereka bersifat visioner,
            progresif dan bekerja keras untuk mencapai tujuan. Mereka memaksa dan suka
            memimpin. Mereka menempatkan standar yang tinggi pada diri mereka dan
            orang-orang di sekitar mereka dengan harapan tujuan terpenuhi. Mereka
            dapat memiliki pengaruh yang sangat kuat terhadap orang dan memotivasi
            mereka untuk mencapai tujuan. Mereka perlu secara khusus peka terhadap
            orang lain di sekitar mereka. Terlibat dalam kegiatan, mereka secara tetap
            bergerak maju dan dapat menjadi sangat frustrasi ketika tidak ada satupun
            yang mereka capai.
        `
    },


    SCDI: {
        name: "INVESTIGATOR PATTERN",

        strengths: [
            "Disiplin dan tidak mudah dipengaruhi emosi sesaat",
            "Berorientasi pada fakta dan data",
            "Gigih mencapai tujuan",
            "Tekun menyelesaikan tugas",
            "Mampu bekerja mandiri maupun dalam kelompok kecil"
        ],

        weaknesses: [
            "Dapat menjadi curiga ketika berada dalam tekanan",
            "Dapat terlihat keras",
            "Cenderung menyimpan kemarahan atau ketidaksukaan",
            "Kurang nyaman menjual ide abstrak",
            "Perlu meningkatkan fleksibilitas dan hubungan interpersonal"
        ],

        description: `
            Mereka yang termasuk Investigator Pattern adalah individu yang disiplin,
            tidak mudah dipengaruhi oleh situasi emosi sesaat. Berorientasi pada posisi
            formal serta memiliki kekuasaan dan kontrol. Dalam menghadapi permasalahan,
            Investigator Pattern cenderung memanfaatkan fakta dan data. Mereka tidak
            mudah menyerah, berkeinginan kuat, menunjukkan tindakan untuk mencapai
            tujuan yang komprehensif dan bekerja giat untuk menyelesaikan tugas pribadi
            maupun tugas dalam kelompok kecil. Apabila berada dalam tekanan, mereka
            cenderung menampilkan sikap curiga dan kasar. Investigator Pattern akan
            lebih efektif jika mereka lebih fleksibel, bersedia menerima orang lain,
            serta membina hubungan personal lebih intens dengan orang lain.
        `
    },


    CDSI: {
        name: "OBJECTIVE THINKER PATTERN",

        strengths: [
            "Praktis dan objektif",
            "Kritis dan analitis",
            "Menggunakan fakta dan logika dalam keputusan",
            "Mampu memahami masalah secara mendalam",
            "Terorganisasi dan berorientasi kualitas",
            "Memiliki standar kerja tinggi"
        ],

        weaknesses: [
            "Cenderung lambat mengambil keputusan",
            "Dapat terlalu banyak menganalisis",
            "Sensitif terhadap kritik",
            "Kurang nyaman dengan perubahan spontan",
            "Membutuhkan panduan dalam lingkungan kerja tertentu"
        ],

        description: `
            Mereka yang termasuk Objective Thinker memperlihatkan sifat yang praktis
            dan layak. Mereka suka mengevaluasi diri dan kritis baik terhadap diri
            mereka dan orang lain, meskipun mereka jarang menyuarakannya karena
            pendiam dan tenang. Mereka terus-menerus berupaya mencapai kesempurnaan.
            Objective Thinker menginternalisasi informasi, menganalisis masalah
            berulang-ulang. Mereka membuat keputusan dengan lambat berdasarkan fakta
            dan logika, bukan emosi, dan mengajukan pertanyaan bagaimana dan mengapa.
            Mereka suka merencanakan dan mengorganisasi setiap bidang kehidupan mereka.
            Lingkungan yang stabil adalah hal terbaik bagi Objective Thinker karena
            mereka lebih suka bergerak lambat dan penuh pertimbangan dalam perubahan.
            Mereka menjunjung standar yang tinggi dan terus-menerus berupaya memenuhinya.
        `
    },


    CSDI: {
        name: "PERFECTIONIST PATTERN",

        strengths: [
            "Teliti dan detail",
            "Stabil dan sistematis",
            "Diplomatis dan bijaksana",
            "Menjaga akurasi dan standar tinggi",
            "Dapat diandalkan dalam melaksanakan tugas",
            "Berbasis fakta dan angka"
        ],

        weaknesses: [
            "Tidak nyaman dengan perubahan mendadak",
            "Dapat terlalu berhati-hati dalam mengambil keputusan",
            "Sensitif terhadap kritik",
            "Dapat gelisah ketika dipaksa mengambil keputusan cepat",
            "Cenderung membutuhkan lingkungan yang stabil"
        ],

        description: `
            Orang yang termasuk Perfectionist menampilkan suatu sifat yang tepat,
            detail dan stabil. Mereka adalah pemikir sistematis yang cenderung
            mengikuti prosedur. Mereka bertindak dengan gaya yang sangat bijaksana
            dan diplomatis serta berupaya menghindari konflik. Mereka sangat teliti,
            menuntut akurasi dan mempertahankan standar yang tinggi. Perfectionist
            menyukai lingkungan yang terlindung dan aman dengan peraturan dan regulasi
            yang berlaku dan tidak menyukai perubahan yang seketika. Mereka
            menginginkan fakta dan angka sebelum membuat keputusan dan merasa gelisah
            ketika dipaksa memutuskan sesuatu dengan cepat.
        `
    },


    IDCS: {
        name: "PERSUADER PATTERN",

        strengths: [
            "Orientasi tugas tinggi",
            "Mudah melibatkan dan merekrut orang",
            "Komunikatif",
            "Mampu membangun harmoni",
            "Mampu menggunakan logika dan kemampuan verbal",
            "Aktif dan antusias terhadap tantangan baru"
        ],

        weaknesses: [
            "Dapat dominan atau agresif ketika berada dalam tekanan",
            "Perlu meningkatkan kemampuan mendengarkan",
            "Perlu lebih mempertimbangkan kebutuhan orang lain",
            "Cenderung sulit pasif atau menunggu"
        ],

        description: `
            Mereka yang termasuk Persuader memperlihatkan suatu orientasi tugas yang
            tinggi dan juga menyukai orang. Mereka sangat pandai merekrut orang untuk
            tim atau organisasi. Persuader bersikap bersahabat dan suka melibatkan
            orang lain, tetapi juga suka melihat tugas-tugasnya dikerjakan dengan benar.
            Karena keinginan melakukan segala hal dengan benar, terkadang mereka tampil
            mendominasi dan agresif saat terjadi tekanan. Mereka unggul dalam
            keterampilan komunikasi dan mampu membuat orang asing merasa santai dan
            nyaman. Mereka mempengaruhi orang lain dengan keterampilan manusia yang
            kuat serta kemampuan bernalar dan logika.
        `
    },


    CISD: {
        name: "MEDIATOR PATTERN",

        strengths: [
            "Berorientasi pada manusia",
            "Loyal dan komunikatif",
            "Mampu menganalisis situasi",
            "Mampu menyelesaikan konflik",
            "Fleksibel dan mudah beradaptasi",
            "Mampu membangun hubungan harmonis"
        ],

        weaknesses: [
            "Sensitif terhadap kritik",
            "Dapat terlalu memikirkan penilaian orang lain",
            "Tidak cenderung memulai konfrontasi",
            "Dapat terlalu memperhatikan kualitas dan persetujuan sosial"
        ],

        description: `
            Mereka yang termasuk Mediator menampilkan suatu style berorientasi pada
            manusia yang didorong oleh cara yang benar dan loyalitas. Tujuan utama
            seorang Mediator adalah menyelesaikan tugas dengan waktu dan
            mempertahankan lingkungan yang stabil dan harmonis. Mereka bersahabat,
            bersemangat, informal, suka berbicara dan sensitif terhadap apa yang
            dipikirkan orang. Mereka dapat mempengaruhi orang dengan pengetahuan
            fakta dan kemampuan menganalisis orang dan situasi. Mereka mampu
            menggunakan logika untuk menyelesaikan konflik dan membangun kembali
            hubungan. Mereka bersahabat dan fleksibel serta mampu beradaptasi.
        `
    },


    IDSC: {
        name: "NEGOTIATOR PATTERN",

        strengths: [
            "Mudah bergaul dan memiliki minat tinggi terhadap orang",
            "Mampu mendapatkan rasa hormat dan kekaguman",
            "Persuasif dan berorientasi pada pencapaian",
            "Optimistis dan penuh motivasi",
            "Mampu mencapai hasil melalui orang lain",
            "Bersemangat menghadapi mobilitas dan tantangan"
        ],

        weaknesses: [
            "Dapat terlihat terlalu percaya diri",
            "Dapat terlihat agresif atau memaksa",
            "Dapat gelisah karena selalu ingin terlibat dalam kegiatan",
            "Perlu mengingat bahwa tidak selalu harus menjadi pemimpin",
            "Perlu meningkatkan kemampuan menerima peran sebagai pendukung"
        ],

        description: `
            Mereka yang termasuk Negotiator memperlihatkan semangat suka bergaul,
            minat yang tinggi terhadap orang, dan kemampuan mendapatkan rasa hormat
            dan kekaguman dari banyak orang. Mereka melakukan usaha dengan cara yang
            bersahabat sambil berupaya mempengaruhi orang lain untuk mencapai tujuan
            mereka dan mempromosikan sudut pandang mereka. Negotiator menyukai
            kebebasan daripada rutinitas dan menginginkan otoritas serta prestasi.
            Mereka membutuhkan beragam kegiatan dan bekerja lebih efisien ketika
            orang lain memberikan data analisis. Mereka bersemangat ketika diberi
            tugas yang menuntut mobilitas dan tantangan. Secara umum mereka optimistis
            dan penuh motivasi. Negotiator tahu bagaimana mencapai hasil melalui
            orang lain.
        `
    },


    SCID: {
        name: "PEACE MAKER, RESPECTFUL & ACCURATE PATTERN",

        strengths: [
            "Baik hati dan memperhatikan orang lain",
            "Sangat cermat dalam penyelesaian tugas",
            "Loyal terhadap pemimpin",
            "Unggul dalam kerja tim",
            "Berorientasi pada akurasi",
            "Mempertimbangkan dampak keputusan terhadap orang lain"
        ],

        weaknesses: [
            "Tidak nyaman ketika dipaksa mengambil keputusan cepat",
            "Sensitif terhadap kritik",
            "Dapat menyimpan perasaan sendiri",
            "Membutuhkan rasa aman dan lingkungan stabil"
        ],

        description: `
            Orang yang termasuk Peace Maker memperlihatkan sifat yang baik hati dan
            sangat berorientasi pada detail masalah. Mereka memperhatikan orang dan
            memiliki kualitas yang membuat mereka amat cermat pada penyelesaian tugas.
            Mereka menginginkan lingkungan yang tetap yang mempromosikan rasa aman.
            Mereka suka memikirkan masalah dengan hati-hati dan mempertimbangkan
            bagaimana suatu keputusan akan berdampak pada orang lain. Peace Maker
            menginginkan fakta dan angka sebelum membuat keputusan dan merasa tidak
            nyaman ketika dipaksa membuat keputusan cepat. Mereka loyal terhadap
            pemimpin yang mereka dukung dan merupakan orang-orang unggulan dalam tim.
        `
    },


    CDIS: {
        name: "DESIGNER PATTERN",

        strengths: [
            "Kreatif dan analitis",
            "Teguh dalam pemecahan masalah",
            "Berorientasi pada akurasi",
            "Mampu merancang perubahan dan perbaikan",
            "Memiliki standar kerja tinggi",
            "Kuat dalam pengendalian kualitas"
        ],

        weaknesses: [
            "Dapat merasa hanya dirinya yang mampu melakukan pekerjaan dengan benar",
            "Dapat kurang memberikan ruang bagi orang lain untuk membantu",
            "Dapat menjadi agresif atau keras kepala ketika tertekan",
            "Perlu meningkatkan sensitivitas terhadap kebutuhan orang lain"
        ],

        description: `
            Orang yang termasuk Designer menunjukkan orientasi pada tugas yang tinggi
            dan sangat sensitif terhadap masalah. Mereka kreatif, teguh dan analitis
            dalam pendekatan terhadap pemecahan masalah yang efektif. Tujuan mereka
            adalah membuat semuanya benar dan dalam kendali sambil menghindari
            kesalahan. Designer dapat berinisiatif atas perubahan dan perbaikan.
            Mereka terkadang merasa bahwa hanya mereka yang dapat melakukan pekerjaan
            dengan benar sehingga tidak mengizinkan orang lain membantu. Di bawah
            tekanan mereka mungkin menjadi agresif atau keras kepala. Designer
            mempertahankan standar yang tinggi dalam semua aspek kerja.
        `
    },


    CSID: {
        name: "PRACTITIONER PATTERN",

        strengths: [
            "Ramah dan analitis",
            "Perhatian terhadap kebutuhan orang",
            "Dapat diandalkan",
            "Berorientasi pada kualitas",
            "Memperhatikan detail",
            "Mampu menggabungkan intuisi, logika, analisis dan keterampilan interpersonal"
        ],

        weaknesses: [
            "Dapat mengisolasi diri demi menyelesaikan pekerjaan",
            "Cenderung menyukai situasi yang dapat diprediksi",
            "Dapat kesulitan dalam peran yang menuntut disiplin",
            "Membutuhkan persetujuan atas pekerjaan yang dilakukan dengan baik"
        ],

        description: `
            Mereka yang termasuk Practitioner menampilkan gaya suka bergaul dengan
            kecenderungan sifat analitis dan waspada. Mereka mudah memperbanyak teman
            sekaligus mengendalikan mereka. Practitioner bersikap penuh perhatian,
            bersahabat dan kompeten. Karena sifatnya perfeksionis, mereka akan
            mengisolasi diri jika diperlukan demi terselesainya pekerjaan. Mereka
            suka berada dalam situasi yang dapat diprediksi. Mereka berorientasi
            pada kualitas dan memperhatikan detail serta kebutuhan orang di sekitarnya.
            Mereka dapat menjadi sangat efektif dalam menggabungkan keterampilan
            intuisi, logika, analisis dengan keterampilan yang kuat terhadap orang.
        `
    },


    DSIC: {
        name: "SELF-MOTIVATED PATTERN",

        strengths: [
            "Mandiri",
            "Objektif dan analitis",
            "Memiliki motivasi internal yang kuat",
            "Teguh menghadapi hambatan",
            "Mampu merencanakan dan menjalankan pekerjaan",
            "Berorientasi kuat pada pencapaian tujuan"
        ],

        weaknesses: [
            "Dapat mengesampingkan pertimbangan orang lain",
            "Dapat terlihat tidak peduli atau berjarak",
            "Cenderung sangat fokus pada tujuan",
            "Dapat mengalami gejolak internal ketika hubungan tidak berjalan baik"
        ],

        description: `
            Mereka yang termasuk Self-Motivated memperlihatkan style yang objektif dan
            analitis. Mereka mungkin sangat mandiri tetapi juga menikmati kerja sebagai
            bagian tim. Mereka memperoleh motivasi lebih dari sumber internal daripada
            eksternal, khususnya dari tujuan pribadi dan dorongan batin untuk
            menyelesaikan tugas. Fokus terhadap tugas membuat mereka mungkin
            mengesampingkan pertimbangan orang lain sehingga tampak tak peduli dan
            berjarak. Mereka memperlihatkan keteguhan yang kuat dan dapat sukses
            dalam banyak hal. Karakter mereka yang tenang dan tetap membuat mereka
            menjadi pemimpin yang baik.
        `
    },


    DISC: {
        name: "DIRECTOR PATTERN",

        strengths: [
            "Visioner dan berorientasi pada masa depan",
            "Mampu menggerakkan orang dan tugas",
            "Energik dan sosial",
            "Berorientasi pada big picture",
            "Teguh menghadapi tekanan",
            "Kreatif dan berorientasi hasil"
        ],

        weaknesses: [
            "Dapat mengabaikan detail",
            "Cenderung memunculkan konflik ketika mempertahankan pendirian",
            "Membutuhkan kebebasan dalam bekerja",
            "Perlu dukungan individu yang kuat dalam analisis detail"
        ],

        description: `
            Orang yang termasuk Director menampilkan kemampuan yang mengagumkan
            dalam menggerakkan orang dan tugas ke masa depan karena visi dan keahlian
            mengelola orang. Karena energik dan sosial, mereka cenderung berfokus pada
            tujuan umum atau big picture dan mungkin tidak menghiraukan detail.
            Fokus mereka adalah membuat dan menggerakkan orang lain agar mengadopsi
            visi mereka. Dalam situasi stres seorang Director akan bertindak dengan
            keteguhan dan bertahan hingga akhir. Director membutuhkan kebebasan untuk
            melakukan sesuatu dengan cara yang mereka yakini. Mereka kreatif,
            pekerja keras dan terdorong mencapai hasil yang memberi kemenangan.
        `
    },


    ICSD: {
        name: "RESPONSIVE & THOUGHTFUL PATTERN",

        strengths: [
            "Energi dan kemampuan komunikasi tinggi",
            "Perhatian dan sensitif terhadap orang lain",
            "Ramah dan komunikatif",
            "Mampu mempengaruhi orang dengan fakta dan analisis",
            "Mampu mencari hasil win-win",
            "Dapat memimpin ketika kewenangan jelas"
        ],

        weaknesses: [
            "Dapat terlalu khawatir terhadap penilaian orang lain",
            "Sensitif terhadap penolakan dan kritik",
            "Membutuhkan kejelasan ekspektasi sebelum memulai proyek",
            "Perlu menjaga keseimbangan antara perhatian terhadap orang dan hasil"
        ],

        description: `
            Orang yang termasuk Responsive and Thoughtful memperlihatkan energi yang
            tinggi, keterampilan komunikasi yang ulung, penuh perhatian dan sensitif.
            Mereka langsung, ramah, bersemangat, informal dan cukup banyak bicara.
            Karena ketakutan terbesar mereka adalah penolakan, kritik dan hilangnya
            keamanan, mereka mungkin terlalu khawatir dengan apa yang dipikirkan
            orang lain. Mereka ingin diterima sebagai anggota tim dan ingin mengetahui
            dengan pasti apa yang diharapkan sebelum memulai proyek baru. Mereka
            menggunakan keterampilan komunikasi untuk mempengaruhi orang dengan
            pengetahuan fakta dan kemampuan menganalisis orang dan situasi.
        `
    },


    SIDC: {
        name: "SPECIALIST PATTERN",

        strengths: [
            "Stabil dan konsisten",
            "Sabar dan loyal",
            "Suka membantu",
            "Dapat bekerja baik dengan banyak gaya kepribadian",
            "Dapat diandalkan sampai tugas selesai",
            "Nyaman dengan aturan dan panduan yang jelas"
        ],

        weaknesses: [
            "Lambat menyesuaikan diri dengan perubahan",
            "Kurang nyaman dengan perubahan mendadak",
            "Cenderung sulit mengatakan tidak",
            "Cenderung menghindari konflik",
            "Dapat menjadi keras kepala setelah mengambil keputusan"
        ],

        description: `
            Mereka yang termasuk Specialist memperlihatkan suatu sifat yang stabil
            dan konsisten dengan bekerja mempertahankan lingkungan yang statis dan
            terfokus di sekitar orang. Karena lebih menyukai peran pendukung, mereka
            bekerja dengan baik dengan banyak gaya kepribadian berkat perilaku
            terkendali dan sederhana. Mereka sabar, loyal dan suka membantu teman.
            Specialist tidak bosan dengan rutinitas dan bekerja dengan sangat baik
            dengan panduan dan aturan yang jelas. Mereka memerlukan waktu untuk
            menyesuaikan diri dengan perubahan dan enggan melepaskan cara lama.
            Mereka cenderung menghindari konflik dan dapat diandalkan untuk tetap
            benar hingga selesai.
        `
    },


    CIDS: {
        name: "ASSESSOR PATTERN",

        strengths: [
            "Berorientasi pada pengembangan diri",
            "Termotivasi oleh posisi dan promosi",
            "Tertarik pada pengembangan prosedur",
            "Memiliki keahlian teknis",
            "Mampu menyelesaikan masalah",
            "Berorientasi pada spesialisasi"
        ],

        weaknesses: [
            "Dapat memiliki ekspektasi tidak realistis terhadap orang lain",
            "Sensitif terhadap kritik",
            "Dapat terlalu menahan diri",
            "Takut tidak diakui sebagai ahli",
            "Perlu meningkatkan kolaborasi dan delegasi"
        ],

        description: `
            Mereka yang termasuk Assessor Pattern selalu berusaha untuk setara dengan
            orang lain dalam hal usaha dan kinerja teknis. Mereka berorientasi pada
            pengembangan diri. Sangat termotivasi pada posisi dan promosi, cukup
            percaya diri untuk dapat menjadi ahli pada kemampuan baru, sangat tertarik
            dengan pengembangan prosedur dan tindakan yang sesuai dengan nilai-nilai.
            Memiliki keahlian teknis dalam penyelesaian masalah, menunjukkan kemahiran
            dan spesialisasi. Di sisi lain, Assessor Pattern cenderung memperhatikan
            tujuan pribadi dan menunjukkan ekspektasi yang tidak realistis pada orang
            lain. Akan lebih efektif apabila melakukan kolaborasi dan mendelegasikan
            tugas pada orang yang tepat.
        `
    },


    DSCI: {
        name: "ESTABLISHER PATTERN",

        strengths: [
            "Individualistis dan percaya diri",
            "Berani mengambil peluang",
            "Visioner",
            "Mampu menggerakkan proyek",
            "Berani mengambil risiko",
            "Bersemangat membuat ide menjadi nyata"
        ],

        weaknesses: [
            "Dapat mengambil risiko terlalu cepat",
            "Tidak selalu mengumpulkan fakta sebelum mengambil keputusan",
            "Dapat mengabaikan sisi emosional orang lain",
            "Perlu meningkatkan pengendalian diri dan disiplin diri",
            "Perlu meningkatkan sensitivitas interpersonal"
        ],

        description: `
            Orang yang termasuk Establisher memperlihatkan suatu pendekatan yang
            efektif dan individualistis, terutama terhadap tantangan dan kesempatan
            baru. Mereka biasanya mempertunjukkan kekuatan ego yang tinggi.
            Establisher menginginkan terobosan dan terkadang masuk ke petualangan baru
            sebelum memikirkannya masak-masak. Mereka tidak selalu mengumpulkan fakta
            sebelum mengambil keputusan. Establisher senang menang dan merupakan
            pencipta kesempatan. Mereka memiliki visi big picture dan dapat
            menggerakkan proyek ke depan dengan semangat tinggi. Sebagai pengambil
            risiko, mereka dapat terlihat nekat, percaya diri dan berani.
        `
    },


    ISCD: {
        name: "REFORMER PATTERN",

        strengths: [
            "Mudah bergaul dan bersahabat",
            "Mampu memimpin dan mengarahkan",
            "Berorientasi pada penyelesaian tugas",
            "Mampu bekerja sebagai pemimpin maupun anggota tim",
            "Empatik dan sensitif terhadap orang lain",
            "Motivator yang baik dan optimistis"
        ],

        weaknesses: [
            "Membutuhkan pengakuan dan ketenaran",
            "Dapat terlalu percaya terhadap orang lain",
            "Perlu menjaga keseimbangan antara optimisme dan evaluasi objektif",
            "Dapat terlalu terlibat dalam proyek dan orang"
        ],

        description: `
            Mereka yang termasuk Reformer memperlihatkan suatu sifat mudah bergaul
            dan bersahabat, tetapi juga suka mengarahkan situasi dan menjadi seorang
            pemimpin. Reformer berkonsentrasi pada tugas hingga selesai tetapi tahu
            keterbatasan mereka dan akan meminta bantuan jika diperlukan. Mereka dapat
            berfungsi sebagai pemimpin tim maupun anggota tim. Mereka sensitif dengan
            perasaan orang lain dan berupaya menciptakan lingkungan yang mendukung.
            Mereka memiliki keterampilan sosial yang ulung dan empati yang tulus,
            membuat mereka menjadi motivator yang baik. Mereka optimis dan positif.
        `
    },


    SDIC: {
        name: "GOVERNOR PATTERN",

        strengths: [
            "Rajin dan pekerja keras",
            "Berorientasi pada pencapaian",
            "Fokus pada hasil konkret",
            "Mampu bekerja mandiri",
            "Memiliki standar kerja tinggi",
            "Berorientasi pada prioritas dan hasil"
        ],

        weaknesses: [
            "Dapat mengorbankan tujuan kelompok demi pencapaian pribadi",
            "Cenderung frustrasi dan tidak sabar ketika berada dalam tekanan",
            "Dapat terlalu banyak melakukan pekerjaan sendiri",
            "Kurang mendelegasikan",
            "Dapat menghindari orang yang dianggap memiliki standar kerja lebih rendah"
        ],

        description: `
            Mereka yang tergolong Governor Pattern adalah individu yang rajin dan
            pekerja keras. Mereka lebih berorientasi pada pencapaian personal,
            kadang-kadang mengorbankan tujuan kelompok. Dalam proses kerja Governor
            Pattern cenderung menilai kemampuan untuk mencapai hasil yang konkret.
            Apabila berada di bawah tekanan, Governor Pattern menjadi frustrasi dan
            tidak sabar, melakukan apa-apa sendiri dan kurang mendelegasi. Tipe ini
            dapat lebih efektif jika membuat prioritas tugas yang jelas, mengurangi
            pilihan, mempertimbangkan pendekatan lain dan mengompromikan jangka pendek
            demi kebaikan jangka panjang.
        `
    }

};


/* ==========================================================
   DISC SCORE BOX
========================================================== */

function renderDiscScoreBox(label, value) {

    return `

        <div
            style="
                padding:12px;
                border:1px solid #e2e8f0;
                border-radius:8px;
                text-align:center;
                background:#ffffff;
            "
        >

            <div
                style="
                    font-size:12px;
                    color:#64748b;
                    margin-bottom:4px;
                    font-weight:600;
                "
            >
                ${label}
            </div>

            <strong
                style="
                    font-size:18px;
                    color:#1e293b;
                "
            >
                ${value}
            </strong>

        </div>

    `;
}


/* ==========================================================
   ESCAPE HTML
   Digunakan agar teks database aman ditampilkan
========================================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================================
   SAFE HTML ESCAPE
========================================================== */

function discEscapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==========================================================
   NORMALIZE DISC SCORES
========================================================== */

function normalizeDiscScores(scores) {

    const source =
        scores && typeof scores === "object"
            ? scores
            : {};

    return {
        D: Number(source.D ?? 0),
        I: Number(source.I ?? 0),
        S: Number(source.S ?? 0),
        C: Number(source.C ?? 0)
    };
}


/* ==========================================================
   GET DISC TYPOLOGICAL CODE
   ----------------------------------------------------------
   ATURAN:
   - HANYA Graph 3 / CHANGE
   - Positif: terbesar → terkecil
   - Nol: tetap di tengah
   - Negatif: paling rendah → paling tinggi
========================================================== */

function getDiscTypologicalCode(changeScores) {

    const scores =
        normalizeDiscScores(changeScores);

    const dimensions = [
        {
            key: "D",
            value: scores.D,
            originalIndex: 0
        },
        {
            key: "I",
            value: scores.I,
            originalIndex: 1
        },
        {
            key: "S",
            value: scores.S,
            originalIndex: 2
        },
        {
            key: "C",
            value: scores.C,
            originalIndex: 3
        }
    ];


    const positive =
        dimensions
            .filter(item => item.value > 0)
            .sort((a, b) => {

                if (b.value !== a.value) {
                    return b.value - a.value;
                }

                return a.originalIndex - b.originalIndex;

            });


    const neutral =
        dimensions
            .filter(item => item.value === 0)
            .sort((a, b) =>
                a.originalIndex - b.originalIndex
            );


    const negative =
        dimensions
            .filter(item => item.value < 0)
            .sort((a, b) => {

                if (a.value !== b.value) {
                    return a.value - b.value;
                }

                return a.originalIndex - b.originalIndex;

            });


    return [
        ...positive,
        ...neutral,
        ...negative
    ]
        .map(item => item.key)
        .join("");
}


/* ==========================================================
   GET DISC TYPOLOGICAL PATTERN
========================================================== */

function getDiscTypologicalPattern(changeScores) {

    const code =
        getDiscTypologicalCode(changeScores);

    return {
        code,
        pattern:
            DISC_TYPOLOGICAL_PATTERNS[code] || null
    };
}


/* ==========================================================
   RENDER DISC TYPOLOGICAL BEHAVIOUR
========================================================== */

function renderDiscTypologicalBehaviour(changeScores) {

    const result =
        getDiscTypologicalPattern(changeScores);

    const code =
        result.code;

    const pattern =
        result.pattern;


    if (!pattern) {

        return `
            <div
                style="
                    margin-top:20px;
                    background:#ffffff;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                    padding:24px;
                    box-shadow:0 1px 3px rgba(0,0,0,.05);
                "
            >

                <h3
                    style="
                        margin:0 0 8px 0;
                        color:#0f172a;
                        font-size:18px;
                    "
                >
                    Typological Behaviour
                </h3>

                <p
                    style="
                        margin:0 0 18px 0;
                        color:#64748b;
                        font-size:13px;
                        line-height:1.6;
                    "
                >
                    Urutan kecenderungan perilaku berdasarkan
                    <strong>Graph 3: CHANGE (Mirror)</strong>.
                </p>

                <div
                    style="
                        display:inline-flex;
                        align-items:center;
                        justify-content:center;
                        padding:10px 18px;
                        border-radius:10px;
                        background:#eff6ff;
                        border:1px solid #bfdbfe;
                        color:#2563eb;
                        font-size:24px;
                        font-weight:800;
                        letter-spacing:4px;
                    "
                >
                    ${discEscapeHTML(code)}
                </div>

                <p
                    style="
                        margin:16px 0 0 0;
                        color:#64748b;
                        font-size:14px;
                        line-height:1.6;
                    "
                >
                    Interpretasi pattern untuk kode
                    <strong>${discEscapeHTML(code)}</strong>
                    belum tersedia dalam database interpretasi DISC.
                </p>

            </div>
        `;
    }


    const strengthsHTML =
        pattern.strengths
            .map(item => `
                <li>
                    ${discEscapeHTML(item)}
                </li>
            `)
            .join("");


    const weaknessesHTML =
        pattern.weaknesses
            .map(item => `
                <li>
                    ${discEscapeHTML(item)}
                </li>
            `)
            .join("");


    return `

        <div
            style="
                margin-top:20px;
                background:#ffffff;
                border:1px solid #e2e8f0;
                border-radius:12px;
                padding:24px;
                box-shadow:0 1px 3px rgba(0,0,0,.05);
            "
        >

            <!-- HEADER -->

            <div
                style="
                    margin-bottom:20px;
                "
            >

                <h3
                    style="
                        margin:0 0 6px 0;
                        color:#0f172a;
                        font-size:18px;
                    "
                >
                    Typological Behaviour
                </h3>

                
            </div>


            <!-- CODE + PATTERN -->

            <div
                style="
                    display:flex;
                    flex-wrap:wrap;
                    align-items:center;
                    gap:16px;
                    margin-bottom:22px;
                "
            >

                <div>

                    <div
                        style="
                            font-size:11px;
                            font-weight:700;
                            color:#64748b;
                            text-transform:uppercase;
                            letter-spacing:.7px;
                            margin-bottom:6px;
                        "
                    >
                        Typological Code
                    </div>

                    <div
                        style="
                            display:inline-flex;
                            align-items:center;
                            justify-content:center;
                            min-width:110px;
                            padding:10px 18px;
                            border-radius:10px;
                            background:#eff6ff;
                            border:1px solid #bfdbfe;
                            color:#2563eb;
                            font-size:24px;
                            font-weight:800;
                            letter-spacing:4px;
                        "
                    >
                        ${discEscapeHTML(code)}
                    </div>

                </div>


                <div>

                    <div
                        style="
                            font-size:11px;
                            font-weight:700;
                            color:#64748b;
                            text-transform:uppercase;
                            letter-spacing:.7px;
                            margin-bottom:6px;
                        "
                    >
                        Pattern
                    </div>

                    <div
                        style="
                            font-size:17px;
                            font-weight:800;
                            color:#0f172a;
                        "
                    >
                        ${discEscapeHTML(pattern.name)}
                    </div>

                </div>

            </div>


            <!-- DESCRIPTION -->

            <div
                style="
                    padding:18px;
                    border-radius:10px;
                    background:#f8fafc;
                    border:1px solid #e2e8f0;
                    margin-bottom:20px;
                "
            >

                <div
                    style="
                        font-size:14px;
                        font-weight:800;
                        color:#0f172a;
                        margin-bottom:8px;
                    "
                >
                    Description
                </div>

                <div
                    style="
                        color:#475569;
                        font-size:14px;
                        line-height:1.8;
                        text-align:justify;
                    "
                >
                    ${discEscapeHTML(pattern.description)}
                </div>

            </div>


            <!-- STRENGTH / WEAKNESS -->

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fit,minmax(280px,1fr));
                    gap:18px;
                "
            >

                <!-- STRENGTH -->

                <div
                    style="
                        padding:18px;
                        border-radius:10px;
                        background:#ffffff;
                        border:1px solid #e2e8f0;
                    "
                >

                    <h4
                        style="
                            margin:0 0 12px 0;
                            color:#0f172a;
                            font-size:15px;
                        "
                    >
                        Strengths
                    </h4>

                    <ul
                        style="
                            margin:0;
                            padding-left:20px;
                            color:#475569;
                            font-size:14px;
                            line-height:1.8;
                        "
                    >
                        ${strengthsHTML}
                    </ul>

                </div>


                <!-- WEAKNESS -->

                <div
                    style="
                        padding:18px;
                        border-radius:10px;
                        background:#ffffff;
                        border:1px solid #e2e8f0;
                    "
                >

                    <h4
                        style="
                            margin:0 0 12px 0;
                            color:#0f172a;
                            font-size:15px;
                        "
                    >
                        Weaknesses / Development Areas
                    </h4>

                    <ul
                        style="
                            margin:0;
                            padding-left:20px;
                            color:#475569;
                            font-size:14px;
                            line-height:1.8;
                        "
                    >
                        ${weaknessesHTML}
                    </ul>

                </div>

            </div>

        </div>

    `;
}


/* ==========================================================
   RENDER DISC RESULT
========================================================== */

function renderDiscResult(assessment, participantResult) {

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


    /*
        TIDAK ADA DUMMY SCORE.

        Jika data Graph 1/2/3 tidak tersedia,
        nilai default yang digunakan adalah 0.
    */

    const most =
        normalizeDiscScores(
            scores.most
        );


    const least =
        normalizeDiscScores(
            scores.least
        );


    const change =
        normalizeDiscScores(
            scores.change
        );


    const typological =
        getDiscTypologicalPattern(change);


    container.innerHTML = `

        <div
            style="
                display:flex;
                flex-direction:column;
                gap:24px;
            "
        >

            <!-- INTRO -->

            <div
                style="
                    background:#f8fafc;
                    border-left:4px solid #2563eb;
                    padding:16px;
                    border-radius:0 8px 8px 0;
                "
            >

                <h4
                    style="
                        margin:0 0 8px 0;
                        color:#1e293b;
                        font-size:16px;
                    "
                >
                    Grafik Profil Perilaku Kerja DISC
                </h4>

                <p
                    style="
                        margin:0;
                        color:#475569;
                        font-size:14px;
                        line-height:1.6;
                    "
                >
                    Visualisasi profil DISC menggunakan tiga grafik:
                    <strong>Graph 1 (MOST)</strong>,
                    <strong>Graph 2 (LEAST)</strong>, dan
                    <strong>Graph 3 (CHANGE)</strong>.
                </p>

            </div>


            <!-- THREE GRAPHS -->

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fit,minmax(280px,1fr));
                    gap:20px;
                "
            >

                <!-- MOST -->

                <div
                    style="
                        background:#ffffff;
                        border:1px solid #e2e8f0;
                        border-radius:12px;
                        padding:20px;
                        box-shadow:0 1px 3px rgba(0,0,0,.05);
                    "
                >

                    <div
                        style="
                            font-weight:700;
                            color:#1e293b;
                            margin-bottom:2px;
                            font-size:15px;
                        "
                    >
                        Graph 1: MOST
                    </div>

                    <div
                        style="
                            font-size:12px;
                            color:#64748b;
                            margin-bottom:16px;
                        "
                    >
                        Public Self / Perilaku Tampak
                    </div>

                    ${renderDiscLineChart(most)}

                </div>


                <!-- LEAST -->

                <div
                    style="
                        background:#ffffff;
                        border:1px solid #e2e8f0;
                        border-radius:12px;
                        padding:20px;
                        box-shadow:0 1px 3px rgba(0,0,0,.05);
                    "
                >

                    <div
                        style="
                            font-weight:700;
                            color:#1e293b;
                            margin-bottom:2px;
                            font-size:15px;
                        "
                    >
                        Graph 2: LEAST
                    </div>

                    <div
                        style="
                            font-size:12px;
                            color:#64748b;
                            margin-bottom:16px;
                        "
                    >
                        Private Self / Di Bawah Tekanan
                    </div>

                    ${renderDiscLineChart(least)}

                </div>


                <!-- CHANGE -->

                <div
                    style="
                        background:#ffffff;
                        border:1px solid #e2e8f0;
                        border-radius:12px;
                        padding:20px;
                        box-shadow:0 1px 3px rgba(0,0,0,.05);
                    "
                >

                    <div
                        style="
                            font-weight:700;
                            color:#1e293b;
                            margin-bottom:2px;
                            font-size:15px;
                        "
                    >
                        Graph 3: CHANGE
                    </div>

                    <div
                        style="
                            font-size:12px;
                            color:#64748b;
                            margin-bottom:16px;
                        "
                    >
                        Perceived Self / Penyesuaian Diri
                    </div>

                    ${renderDiscLineChart(change)}

                </div>

            </div>


            <!-- TYPOLOGICAL ANALYSIS -->

            <div
                style="
                    background:#ffffff;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                    padding:24px;
                    box-shadow:0 1px 3px rgba(0,0,0,.05);
                "
            >

                <h3
                    style="
                        margin:0;
                        color:#1e293b;
                        font-size:18px;
                        border-bottom:2px solid #f1f5f9;
                        padding-bottom:10px;
                    "
                >
                    <i
                        class="fa-solid fa-brain"
                        style="
                            color:#2563eb;
                            margin-right:8px;
                        "
                    ></i>

                    Typological Behavior & Analisis Perilaku Kerja
                </h3>


                ${renderDiscTypologicalBehaviour(change)}


                
                    </div>

                </div>

            </div>

        </div>

    `;
}


/* ==========================================================
   RENDER DISC LINE CHART
   ----------------------------------------------------------
   Grafik:
   D | I | S | C
   ========================================================== */

function renderDiscLineChart(scoreObj) {

    const scores =
        normalizeDiscScores(scoreObj);


    const valD = scores.D;
    const valI = scores.I;
    const valS = scores.S;
    const valC = scores.C;


    const height = 520;

    const centerY = 260;

    // Data DISC 24 nomor adalah skor hitungan mentah (0..24 / -24..24).
    // Jangan memotong nilai > 8 hanya karena grid lama memakai ±8.
    // Skala grafik dibuat dinamis, sementara angka skor tetap data asli.
    const maxAbs = Math.max(
        8,
        Math.abs(valD),
        Math.abs(valI),
        Math.abs(valS),
        Math.abs(valC)
    );
    const chartMax = Math.max(8, Math.ceil(maxAbs / 4) * 4);
    const plotHalfHeight = 208;
    const scaleFactor = plotHalfHeight / chartMax;


    const getX = function(index) {

        return 65 + (index * 60);

    };


    const getY = function(value) {

        return centerY - (value * scaleFactor);

    };


    const x1 = getX(0);
    const y1 = getY(valD);

    const x2 = getX(1);
    const y2 = getY(valI);

    const x3 = getX(2);
    const y3 = getY(valS);

    const x4 = getX(3);
    const y4 = getY(valC);


    /* ======================================================
       GRID
    ====================================================== */

    const getScaleY = function(value) {

        return centerY - (value * scaleFactor);

    };


    let svgLinesAndTexts = "";


    for (let i = chartMax; i >= -chartMax; i -= Math.max(1, chartMax / 4)) {

        const currentY =
            getScaleY(i);


        const isZero =
            i === 0;


        const isMajor =
            i % 2 === 0;


        const strokeColor =
            isZero
                ? "#0f172a"
                : (
                    isMajor
                        ? "#cbd5e1"
                        : "#f1f5f9"
                );


        const strokeWidth =
            isZero
                ? 2.5
                : (
                    isMajor
                        ? 1.5
                        : 1
                );


        const dashArray =
            isZero
                ? "none"
                : "2,2";


        svgLinesAndTexts += `

            <text
                x="25"
                y="${currentY + 4}"
                font-size="9"
                fill="${
                    isZero
                        ? "#1e293b"
                        : "#64748b"
                }"
                font-weight="${
                    isZero
                        ? "bold"
                        : "normal"
                }"
                text-anchor="end"
            >
                ${i}
            </text>


            <line
                x1="40"
                y1="${currentY}"
                x2="250"
                y2="${currentY}"
                stroke="${strokeColor}"
                stroke-width="${strokeWidth}"
                stroke-dasharray="${dashArray}"
            />

        `;
    }


    /* ======================================================
       VERTICAL DIVIDERS
    ====================================================== */

    const dividerY1 =
        getScaleY(chartMax);


    const dividerY2 =
        getScaleY(-chartMax);


    const dividerPositions = [

        (x1 + x2) / 2,

        (x2 + x3) / 2,

        (x3 + x4) / 2

    ];


    let verticalDividers = "";


    dividerPositions.forEach(function(x) {

        verticalDividers += `

            <line
                x1="${x}"
                y1="${dividerY1}"
                x2="${x}"
                y2="${dividerY2}"
                stroke="#cbd5e1"
                stroke-width="1.5"
                stroke-dasharray="4,4"
            />

        `;

    });


    /* ======================================================
       RETURN SVG
    ====================================================== */

    return `

        <div
            style="
                display:flex;
                justify-content:center;
                background:#fafafa;
                border:1px solid #e2e8f0;
                border-radius:8px;
                padding:16px 8px;
            "
        >

            <svg
                width="280"
                height="${height}"
                viewBox="0 0 280 ${height}"
                style="overflow:visible;"
                role="img"
                aria-label="DISC profile chart"
            >

                <!-- GRID -->

                ${svgLinesAndTexts}


                <!-- VERTICAL DIVIDERS -->

                ${verticalDividers}


                <!-- PROFILE LINE -->

                <polyline
                    points="
                        ${x1},${y1}
                        ${x2},${y2}
                        ${x3},${y3}
                        ${x4},${y4}
                    "
                    fill="none"
                    stroke="#dc2626"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />


                <!-- D -->

                <circle
                    cx="${x1}"
                    cy="${y1}"
                    r="5"
                    fill="#dc2626"
                />

                <text
                    x="${x1}"
                    y="${y1 + (valD >= 0 ? -10 : 18)}"
                    font-size="11"
                    font-weight="bold"
                    fill="#dc2626"
                    text-anchor="middle"
                >
                    ${valD}
                </text>


                <!-- I -->

                <circle
                    cx="${x2}"
                    cy="${y2}"
                    r="5"
                    fill="#dc2626"
                />

                <text
                    x="${x2}"
                    y="${y2 + (valI >= 0 ? -10 : 18)}"
                    font-size="11"
                    font-weight="bold"
                    fill="#dc2626"
                    text-anchor="middle"
                >
                    ${valI}
                </text>


                <!-- S -->

                <circle
                    cx="${x3}"
                    cy="${y3}"
                    r="5"
                    fill="#dc2626"
                />

                <text
                    x="${x3}"
                    y="${y3 + (valS >= 0 ? -10 : 18)}"
                    font-size="11"
                    font-weight="bold"
                    fill="#dc2626"
                    text-anchor="middle"
                >
                    ${valS}
                </text>


                <!-- C -->

                <circle
                    cx="${x4}"
                    cy="${y4}"
                    r="5"
                    fill="#dc2626"
                />

                <text
                    x="${x4}"
                    y="${y4 + (valC >= 0 ? -10 : 18)}"
                    font-size="11"
                    font-weight="bold"
                    fill="#dc2626"
                    text-anchor="middle"
                >
                    ${valC}
                </text>


                <!-- LABELS -->

                <text
                    x="${x1}"
                    y="${height - 5}"
                    font-size="13"
                    font-weight="bold"
                    fill="#1e293b"
                    text-anchor="middle"
                >
                    D
                </text>


                <text
                    x="${x2}"
                    y="${height - 5}"
                    font-size="13"
                    font-weight="bold"
                    fill="#1e293b"
                    text-anchor="middle"
                >
                    I
                </text>


                <text
                    x="${x3}"
                    y="${height - 5}"
                    font-size="13"
                    font-weight="bold"
                    fill="#1e293b"
                    text-anchor="middle"
                >
                    S
                </text>


                <text
                    x="${x4}"
                    y="${height - 5}"
                    font-size="13"
                    font-weight="bold"
                    fill="#1e293b"
                    text-anchor="middle"
                >
                    C
                </text>

            </svg>

        </div>


        <div
            style="
                display:grid;
                grid-template-columns:
                    repeat(4,1fr);
                gap:4px;
                font-size:11px;
                color:#64748b;
                margin-top:8px;
                text-align:center;
            "
        >

            <span>Dominance</span>

            <span>Influence</span>

            <span>Steadiness</span>

            <span>Compliance</span>

        </div>

    `;
}


/* ==========================================================
   OPTIONAL DEBUG HELPER
   ----------------------------------------------------------
   Tidak dipanggil otomatis.
   Bisa digunakan dari browser console:
   debugDiscTypology({D:5,I:4,S:4,C:4})
========================================================== */

function debugDiscTypology(changeScores) {

    const result =
        getDiscTypologicalPattern(changeScores);

    console.log(
        "DISC CHANGE:",
        normalizeDiscScores(changeScores)
    );

    console.log(
        "TYPOLOGICAL CODE:",
        result.code
    );

    console.log(
        "TYPOLOGICAL PATTERN:",
        result.pattern
    );

    return result;
}

/* ==========================================================
   DISC ASSESSMENT MODULE
   Public API untuk test-result.js
========================================================== */

const DISCAssessment = {

    calculate(participantResult) {
        return participantResult && typeof participantResult === "object"
            ? participantResult
            : {};
    },

    render(container, result, assessment) {
        if (!container) return;

        renderDiscResult(
            assessment || {},
            result || {}
        );
    }
};

