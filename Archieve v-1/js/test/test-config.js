const TEST_CONFIG = {

    /* =====================================================
       TES KECERDASAN
       ===================================================== */

    intelligence: {

        id: "intelligence",

        title: "Tes Kecerdasan",

        description:
            "Rangkaian tes untuk mengukur kemampuan verbal, numerik, logika, dan spasial.",

        duration: 2400,

        type: "combined",

        sections: [

            {
                id: "verbal",
                title: "Tes Verbal",
                data: "soalVerbal"
            },

            {
                id: "numerik",
                title: "Tes Numerik",
                data: "soalNumerik"
            },

            {
                id: "logika",
                title: "Tes Logika",
                data: "soalLogika"
            },

            {
                id: "spasial",
                title: "Tes Spasial",
                data: "soalSpasial"
            }

        ]

    },


    /* =====================================================
       TES SIKAP KERJA
       ===================================================== */

    workAttitude: {

        id: "workAttitude",

        title: "Tes Sikap Kerja",

        description:
            "Mengukur kecepatan, ketelitian, dan stabilitas kerja.",

        duration: 1200,

        type: "combined",

        sections: [

            {
                id: "kecepatan",
                title: "Kecepatan Kerja",
                data: "soalKecepatan"
            },

            {
                id: "ketelitian",
                title: "Ketelitian Kerja",
                data: "soalKetelitian"
            },

            {
                id: "stabilitas",
                title: "Stabilitas Kerja",
                data: "soalStabilitas"
            }

        ]

    },


    /* =====================================================
       TES KEPRIBADIAN
       ===================================================== */

    personality: {

        id: "personality",

        title: "Tes Kepribadian",

        description:
            "Pilih instrumen tes kepribadian yang ingin Anda kerjakan.",

        type: "selection",

        tests: [

            {
                id: "disc",

                title: "DISC",

                data: "soalDISC",

                duration: 1800,

                type: "individual"
            },


            {
                id: "papikostik",

                title: "PAPIKOSTIK",

                data: "soalPAPIKOSTIK",

                duration: 2400,

                type: "individual"
            }

        ]

    }

};