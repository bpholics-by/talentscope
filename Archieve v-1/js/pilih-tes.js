document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* =========================================
           ELEMENT
        ========================================= */

        const participantName =
            document.getElementById(
                "participantName"
            );

        const personalityBtn =
            document.getElementById(
                "personalityBtn"
            );

        const personalityOptions =
            document.getElementById(
                "personalityOptions"
            );


        /* =========================================
           PESERTA
        ========================================= */

        const participant =
            Storage.load("participant");


        if (
            participant &&
            participant.nama
        ) {

            participantName.textContent =
                participant.nama;

        }


        /* =========================================
           COMBINED TEST
           KECERDASAN & SIKAP KERJA
        ========================================= */

        document
            .querySelectorAll(
                "[data-test]"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const testId =
                            button.dataset.test;


                        console.log(
                            "Memulai kategori:",
                            testId
                        );


                        /*
                         * Simpan kategori tes
                         */

                        TestSession.select(
                            testId
                        );


                        /*
                         * Tandai sebagai kategori
                         */

                        sessionStorage.setItem(
                            "activeTestCategory",
                            testId
                        );


                        /*
                         * Hapus subtes kepribadian
                         * jika sebelumnya pernah dipilih
                         */

                        sessionStorage.removeItem(
                            "activePersonalityTest"
                        );


                        /*
                         * Masuk ke CBT baru
                         */

                        window.location.href =
                            "tes-v2.html";

                    }
                );

            });



        /* =========================================
           TAMPILKAN PILIHAN KEPRIBADIAN
        ========================================= */

        if (personalityBtn) {

            personalityBtn.addEventListener(
                "click",
                function () {

                    personalityOptions
                        .classList.toggle(
                            "hidden"
                        );

                }
            );

        }



        /* =========================================
           PERSONALITY TEST
        ========================================= */

        document
            .querySelectorAll(
                "[data-personality]"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const testId =
                            button.dataset
                                .personality;


                        console.log(
                            "Memulai tes kepribadian:",
                            testId
                        );


                        /*
                         * Simpan kategori
                         */

                        sessionStorage.setItem(
                            "activeTestCategory",
                            "personality"
                        );


                        /*
                         * Simpan instrumen
                         */

                        sessionStorage.setItem(
                            "activePersonalityTest",
                            testId
                        );


                        /*
                         * Tetap simpan melalui
                         * TestSession jika tersedia
                         */

                        if (
                            typeof TestSession !==
                            "undefined"
                        ) {

                            TestSession.select(
                                "personality"
                            );

                        }


                        /*
                         * Masuk ke CBT
                         */

                        window.location.href =
                            "tes-v2.html";

                    }
                );

            });

    }
);