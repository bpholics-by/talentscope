/* ==========================================================
   TALENTSCOPE - TEST RESULT CONTROLLER
   FINAL RESULT LOADER
   ----------------------------------------------------------
   Tugas:
   1. Membaca parameter URL
   2. Membaca project & participant
   3. Menentukan assessment
   4. Mengambil RESULT NYATA dari localStorage
   5. Menormalisasi format hasil
   6. Mengarahkan ke DISCAssessment / PAPIKostickAssessment

   CATATAN:
   - Tidak ada dummy score.
   - Controller ini tidak menghitung skor DISC/PAPI.
   - Perhitungan/interpretasi tetap berada di module assessment.
========================================================== */

document.addEventListener("DOMContentLoaded", function () {
    loadTestResult();
});


/* ==========================================================
   MAIN CONTROLLER
========================================================== */

function loadTestResult() {

    const params = new URLSearchParams(window.location.search);

    const projectId =
        String(params.get("projectId") || "").trim();

    const participantId =
        String(params.get("participantId") || "").trim();

    const assessmentIndexRaw =
        params.get("assessmentIndex");

    if (!projectId || !participantId) {
        showResultMessage(
            "Data project atau peserta tidak ditemukan."
        );
        return;
    }

    const index =
        Number(assessmentIndexRaw);

    if (
        !Number.isInteger(index) ||
        index < 0
    ) {
        showResultMessage(
            "Assessment index tidak valid."
        );
        return;
    }


    /* ======================================================
       LOAD PROJECT
    ====================================================== */

    const projects =
        readLocalStorageArray(
            "talentscope_projects"
        );

    const project =
        projects.find(function (item) {

            return String(
                item?.id ?? ""
            ) === String(projectId);

        });

    if (!project) {

        showResultMessage(
            "Project tidak ditemukan."
        );

        return;
    }


    /* ======================================================
       FIND PARTICIPANT
    ====================================================== */

    const participants =
        Array.isArray(project.participants)
            ? project.participants
            : [];

    const participant =
        participants.find(function (item) {

            return String(
                item?.id ??
                item?.participantId ??
                ""
            ) === String(participantId);

        });

    if (!participant) {

        showResultMessage(
            "Peserta tidak ditemukan."
        );

        return;
    }


    /* ======================================================
       PAGE INFORMATION
    ====================================================== */

    updateElement(
        "participantName",
        participant.name ||
        participant.fullName ||
        participant.participantName ||
        "-"
    );

    updateElement(
        "projectName",
        project.projectName ||
        project.name ||
        project.project ||
        "-"
    );

    updateElement(
        "assessmentDate",
        formatTestDate(
            project.startDate ||
            project.start ||
            project.assessmentDate ||
            "-"
        )
    );


    /* ======================================================
       GET ASSESSMENT
    ====================================================== */

    const projectAssessments =
        Array.isArray(project.assessments)
            ? project.assessments
            : [];

    const projectAssessment =
        projectAssessments[index];

    if (
        projectAssessment === undefined ||
        projectAssessment === null
    ) {

        showResultMessage(
            "Assessment tidak ditemukan di project."
        );

        return;
    }


    /* ======================================================
       MASTER ASSESSMENTS
    ====================================================== */

    const masterAssessments =
        readLocalStorageArray(
            "assessments"
        );

    const assessmentCode =
        resolveAssessmentCode(
            projectAssessment,
            masterAssessments
        );

    if (!assessmentCode) {

        showResultMessage(
            "Kode assessment tidak ditemukan."
        );

        return;
    }


    /* ======================================================
       BUILD ASSESSMENT OBJECT
    ====================================================== */

    const masterAssessment =
        masterAssessments.find(function (item) {

            return String(
                item?.code || ""
            ).toUpperCase() ===
            assessmentCode.toUpperCase();

        });

    let assessment =
        masterAssessment
            ? { ...masterAssessment }
            : {};

    if (
        projectAssessment &&
        typeof projectAssessment === "object"
    ) {

        assessment = {
            ...assessment,
            ...projectAssessment
        };

    }

    if (
        typeof projectAssessment === "string" &&
        !assessment.name &&
        !assessment.title
    ) {

        assessment = {
            ...assessment,
            name: projectAssessment,
            code: assessmentCode
        };

    }

    if (
        !assessment.name &&
        !assessment.title &&
        !assessment.code
    ) {

        assessment = {
            ...assessment,
            code: assessmentCode,
            name: assessmentCode
        };

    }


    /* ======================================================
       TEST TITLE
    ====================================================== */

    const testName =
        assessment.name ||
        assessment.title ||
        assessment.code ||
        `Assessment ${index + 1}`;

    updateElement(
        "testTitle",
        testName + " Result"
    );


    /* ======================================================
       IDENTIFY ASSESSMENT
    ====================================================== */

    const codeUpper =
        assessmentCode.toUpperCase();

    const nameUpper =
        String(
            assessment.name ||
            assessment.title ||
            ""
        ).toUpperCase();

    const isDISC =
        codeUpper.includes("DISC") ||
        nameUpper.includes("DISC");

    const isPAPI =
        codeUpper.includes("PAPI") ||
        nameUpper.includes("PAPI");


    /* ======================================================
       HEADER
    ====================================================== */

    updateAssessmentHeader(
        isDISC,
        isPAPI
    );


    /* ======================================================
        LOAD REAL RESULT (MAPPING DISC ANSWERS)
   ====================================================== */

    /* ======================================================
        LOAD REAL RESULT (MAPPING DISC ANSWERS)
   ====================================================== */

    let participantResult =
        getAssessmentResult(
            projectId,
            participantId,
            index,
            assessmentCode,
            isDISC,
            isPAPI,
            project,
            participant
        );

    // Hapus seluruh blok dummy statis/fallback di sini!
    // Gantikan cukup dengan validasi ini:
    if (!participantResult) {
        showResultMessage(
            "Hasil assessment untuk peserta ini belum tersedia atau belum disubmit."
        );
        return;
    }

    /* ======================================================
       RENDER CONTAINER
    ====================================================== */

    const resultContainer =
        document.getElementById(
            "resultContent"
        );

    if (!resultContainer) {

        console.error(
            "Element #resultContent tidak ditemukan."
        );

        return;
    }


    /* ======================================================
        DISC
   ====================================================== */

    if (isDISC) {

        if (
            typeof DISCAssessment !==
            "undefined"
        ) {

            // Jangan pernah menyuntikkan dummy score.
            // Module DISC harus menerima hasil nyata dari participantResult.
            const result =
                DISCAssessment.calculate(
                    participantResult
                );

            DISCAssessment.render(
                resultContainer,
                result,
                assessment
            );

        } else {

            showResultMessage(
                "Module DISC belum dimuat. Pastikan disc.js dipasang sebelum test-result.js."
            );

        }

        return;
    }

    /* ======================================================
        PAPI KOSTICK
    ====================================================== */

    if (isPAPI) {
        console.log("DEBUG PAPI - Assessment:", assessment);
        console.log("DEBUG PAPI - Participant Result:", participantResult);

        const renderer = window.renderTestResult || (typeof renderTestResult === 'function' ? renderTestResult : null);
        
        if (renderer) {
            // Pastikan parameter dikirim dengan benar (sesuai yang diminta papikostick.js)
            renderer(assessment, participantResult);
            return;
        } else {
            showResultMessage(
                "Module PAPI Kostick belum dimuat. Pastikan papikostick.js dipasang sebelum test-result.js."
            );
            return;
        }
    }
    /* ======================================================
       GENERIC FALLBACK
    ====================================================== */

    if (
        typeof renderTestResult ===
        "function"
    ) {

        renderTestResult(
            assessment,
            participantResult
        );

    } else {

        showResultMessage(
            `Renderer untuk assessment "${assessmentCode}" belum tersedia.`
        );

    }
}


/* ==========================================================
   GET ASSESSMENT RESULT
   FINAL ROBUST VERSION
========================================================== */

function getAssessmentResult(
    projectId,
    participantId,
    assessmentIndex,
    assessmentCode,
    isDISC,
    isPAPI,
    project,
    participant
) {

    console.log(
        "=========================================="
    );

    console.log(
        "Mencari hasil untuk Participant ID:",
        participantId
    );

    console.log(
        "Project ID:",
        projectId
    );

    console.log(
        "Assessment Index:",
        assessmentIndex
    );

    console.log(
        "Assessment Code:",
        assessmentCode
    );


    /*
       ======================================================
       HELPER
       ======================================================
    */

    function tryNormalize(
        raw,
        source
    ) {

        if (!raw) {
            return null;
        }


        console.log(
            "RESULT DITEMUKAN DARI:",
            source,
            raw
        );


        var normalized =
            normalizeAssessmentResult(
                raw,
                projectId,
                participantId,
                assessmentIndex,
                assessmentCode,
                isDISC,
                isPAPI
            );


        if (normalized) {

            console.log(
                "RESULT BERHASIL DINORMALISASI:",
                normalized
            );

            return normalized;

        }


        return null;

    }


    /*
       ======================================================
       1. DISC RESULT v3 / EXACT ASSESSMENT RESULT
       ------------------------------------------------------
       v3 adalah format utama yang ditulis oleh disc_test.html.
       Harus dibaca sebelum semua format legacy agar hasil terbaru
       tidak tertutup oleh data lama / talentscope_all_results.
       ======================================================
    */

    if (isDISC) {

        var discV3Keys = [
            "disc_result_v3_" +
            projectId +
            "_" +
            participantId +
            "_" +
            assessmentIndex,

            "assessment_result_v3_" +
            projectId +
            "_" +
            participantId +
            "_" +
            assessmentIndex
        ];

        for (var v3 = 0; v3 < discV3Keys.length; v3++) {
            var v3Key = discV3Keys[v3];
            var v3Raw = readLocalStorageObject(v3Key);

            if (v3Raw) {
                var normalizedV3 = tryNormalize(v3Raw, v3Key);
                if (normalizedV3) {
                    console.info("DISC v3 RESULT DIPAKAI:", v3Key);
                    return normalizedV3;
                }
            }
        }

        // Fallback sessionStorage untuk kondisi localStorage dibatasi browser.
        for (var sv3 = 0; sv3 < discV3Keys.length; sv3++) {
            var sessionKey = discV3Keys[sv3];
            try {
                var sessionRaw = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
                if (sessionRaw) {
                    var normalizedSessionV3 = tryNormalize(sessionRaw, "sessionStorage:" + sessionKey);
                    if (normalizedSessionV3) {
                        console.info("DISC v3 RESULT DIPAKAI DARI SESSION:", sessionKey);
                        return normalizedSessionV3;
                    }
                }
            } catch (e) {
                console.warn("Gagal membaca sessionStorage key:", sessionKey, e);
            }
        }
    }



    /*
       ======================================================
       2. CENTRAL RESULT (LEGACY / COMPATIBILITY)
       talentscope_all_results
       ------------------------------------------------------
       Support legacy dan format baru yang memisahkan hasil
       berdasarkan project + assessmentIndex.
       ======================================================
    */

    try {

        var allResultsRaw =
            localStorage.getItem(
                "talentscope_all_results"
            );

        if (allResultsRaw) {

            var allResults =
                JSON.parse(allResultsRaw);

            var participantResults =
                allResults &&
                allResults[participantId];

            if (participantResults) {

                /* ------------------------------------------
                   FORMAT BARU
                   participantId.assessments[key] = result
                ------------------------------------------ */
                var nestedResults =
                    participantResults.assessments;

                if (
                    nestedResults &&
                    typeof nestedResults === "object"
                ) {

                    var nestedKeys =
                        Object.keys(nestedResults);

                    for (
                        var nr = 0;
                        nr < nestedKeys.length;
                        nr++
                    ) {

                        var nestedKey =
                            nestedKeys[nr];

                        var nestedResult =
                            nestedResults[nestedKey];

                        if (
                            !nestedResult ||
                            typeof nestedResult !== "object"
                        ) {
                            continue;
                        }

                        var nestedProjectId = String(
                            nestedResult.projectId ??
                            nestedResult.projectID ??
                            nestedResult.project_id ??
                            ""
                        ).trim();

                        var nestedAssessmentIndex =
                            nestedResult.assessmentIndex ??
                            nestedResult.assessment_index;

                        var nestedCode =
                            nestedResult.assessmentCode ??
                            nestedResult.assessment_code;

                        var matchesProject =
                            !nestedProjectId ||
                            nestedProjectId === String(projectId).trim();

                        var matchesIndex =
                            nestedAssessmentIndex === undefined ||
                            nestedAssessmentIndex === null ||
                            String(nestedAssessmentIndex) === String(assessmentIndex);

                        var matchesCode =
                            !nestedCode ||
                            String(nestedCode).toUpperCase() ===
                            String(assessmentCode).toUpperCase();

                        if (
                            matchesProject &&
                            matchesIndex &&
                            matchesCode
                        ) {

                            var normalizedNestedCentral =
                                tryNormalize(
                                    nestedResult,
                                    "talentscope_all_results[" +
                                    participantId +
                                    "].assessments[" +
                                    nestedKey +
                                    "]"
                                );

                            if (normalizedNestedCentral) {
                                return normalizedNestedCentral;
                            }
                        }
                    }
                }

                /* ------------------------------------------
                   FORMAT LEGACY
                   participantId = result
                   Hanya pakai jika metadata cocok.
                ------------------------------------------ */
                var centralProjectId = String(
                    participantResults.projectId ??
                    participantResults.projectID ??
                    participantResults.project_id ??
                    ""
                ).trim();

                var centralAssessmentIndex =
                    participantResults.assessmentIndex ??
                    participantResults.assessment_index;

                var centralAssessmentCode =
                    participantResults.assessmentCode ??
                    participantResults.assessment_code;

                var legacyMatchesProject =
                    !centralProjectId ||
                    centralProjectId === String(projectId).trim();

                var legacyMatchesIndex =
                    centralAssessmentIndex === undefined ||
                    centralAssessmentIndex === null ||
                    String(centralAssessmentIndex) === String(assessmentIndex);

                var legacyMatchesCode =
                    !centralAssessmentCode ||
                    String(centralAssessmentCode).toUpperCase() ===
                    String(assessmentCode).toUpperCase();

                if (
                    legacyMatchesProject &&
                    legacyMatchesIndex &&
                    legacyMatchesCode
                ) {

                    var normalizedCentral =
                        tryNormalize(
                            participantResults,
                            "talentscope_all_results[" +
                            participantId +
                            "]"
                        );

                    if (normalizedCentral) {
                        return normalizedCentral;
                    }
                }
            }
        }

    } catch (error) {

        console.error(
            "Error membaca talentscope_all_results:",
            error
        );

    }


    /*
       ======================================================
       3. EXACT ASSESSMENT RESULT (LEGACY KEY)
       ======================================================
    */

    var exactKeys = [

        "assessment_result_" +
        projectId +
        "_" +
        participantId +
        "_" +
        assessmentIndex,

        "assessment_result_" +
        projectId +
        "_" +
        participantId

    ];


    for (
        var i = 0;
        i < exactKeys.length;
        i++
    ) {

        var exactKey =
            exactKeys[i];


        var exactRaw =
            readLocalStorageObject(
                exactKey
            );


        if (exactRaw) {

            var normalizedExact =
                tryNormalize(
                    exactRaw,
                    exactKey
                );


            if (normalizedExact) {

                return normalizedExact;

            }

        }

    }


    /*
       ======================================================
       3. DISC RESULT
       ======================================================
    */
if (isDISC) {
    var discKeys = [

    "disc_result_" +
    projectId +
    "_" +
    participantId +
    "_" +
    assessmentIndex,

    "disc_result_" +
    projectId +
    "_" +
    participantId,

    "DISC_result_" +
    projectId +
    "_" +
    participantId +
    "_" +
    assessmentIndex,

    "DISC_result_" +
    projectId +
    "_" +
    participantId

];


        for (
            var d = 0;
            d < discKeys.length;
            d++
        ) {

            var discKey =
                discKeys[d];


            var discRaw =
                readLocalStorageObject(
                    discKey
                );


            if (!discRaw) {

                continue;

            }


            var normalizedDisc =
                tryNormalize(
                    discRaw,
                    discKey
                );


            if (normalizedDisc) {

                return normalizedDisc;

            }

        }

    }


    /*
       ======================================================
       4. PAPI RESULT
       ======================================================
    */

    if (isPAPI) {

        var papiKeys = [
            "papi_result_" +
            projectId +
            "_" +
            participantId +
            "_" +
            assessmentIndex
        ];


        for (
            var p = 0;
            p < papiKeys.length;
            p++
        ) {

            var papiKey =
                papiKeys[p];


            var papiRaw =
                readLocalStorageObject(
                    papiKey
                );


            if (!papiRaw) {

                continue;

            }


            var rawPapiProject = String(
                papiRaw.projectId ?? papiRaw.projectID ?? papiRaw.project_id ?? ""
            ).trim();
            var rawPapiParticipant = String(
                papiRaw.participantId ?? papiRaw.participantID ?? papiRaw.participant_id ?? ""
            ).trim();
            var rawPapiIndex = papiRaw.assessmentIndex;
            var rawPapiCode = String(
                papiRaw.assessmentCode ?? papiRaw.assessment_code ?? ""
            ).trim().toUpperCase();

            if (
                rawPapiProject !== String(projectId).trim() ||
                rawPapiParticipant !== String(participantId).trim() ||
                String(rawPapiIndex) !== String(assessmentIndex) ||
                (rawPapiCode && rawPapiCode !== String(assessmentCode).trim().toUpperCase())
            ) {
                console.warn("PAPI result ditolak: metadata tidak cocok.", papiKey);
                continue;
            }

            var normalizedPapi =
                tryNormalize(
                    papiRaw,
                    papiKey
                );


            if (normalizedPapi) {

                return normalizedPapi;

            }

        }

    }


    /*
       ======================================================
       5. CENTRAL RESULT ARRAY
       talent_scope_results
       ======================================================
    */

    var resultArray =
        readLocalStorageArray(
            "talent_scope_results"
        );


    if (
        Array.isArray(resultArray) &&
        resultArray.length
    ) {

        console.log(
            "Memeriksa talent_scope_results:",
            resultArray
        );


        /*
           Cari berdasarkan:

           projectId
           participantId
           assessmentIndex
        */

        for (
            var r =
                resultArray.length - 1;
            r >= 0;
            r--
        ) {

            var item =
                resultArray[r];


            if (!item) {

                continue;

            }


            var itemProjectId =
                String(
                    item.projectId ??
                    item.projectID ??
                    item.project_id ??
                    ""
                ).trim();


            var itemParticipantId =
                String(
                    item.participantId ??
                    item.participantID ??
                    item.participant_id ??
                    item.idParticipant ??
                    ""
                ).trim();


            var itemIndex =
                item.assessmentIndex ??
                item.assessment_index;


            var sameProject =
                itemProjectId ===
                String(projectId).trim();


            var sameParticipant =
                itemParticipantId ===
                String(participantId).trim();


            var sameIndex =
                itemIndex === undefined ||
                itemIndex === null ||
                String(itemIndex) ===
                String(assessmentIndex);


            if (
                sameProject &&
                sameParticipant &&
                sameIndex
            ) {

                var normalizedArray =
                    tryNormalize(
                        item,
                        "talent_scope_results[" +
                        r +
                        "]"
                    );


                if (normalizedArray) {

                    return normalizedArray;

                }

            }

        }

    }


    /*
       ======================================================
       6. NESTED PARTICIPANT RESULTS
       ======================================================
    */

    var nestedCandidates = [

        participant &&
        participant.assessmentResults,

        participant &&
        participant.results,

        participant &&
        participant.assessment_results,

        project &&
        project.assessmentResults,

        project &&
        project.results,

        project &&
        project.assessment_results

    ];


    for (
        var n = 0;
        n < nestedCandidates.length;
        n++
    ) {

        var candidate =
            nestedCandidates[n];


        if (!candidate) {

            continue;

        }


        var list =
            Array.isArray(candidate)
                ? candidate
                : [candidate];


        for (
            var x = 0;
            x < list.length;
            x++
        ) {

            var nestedItem =
                list[x];


            if (!nestedItem) {

                continue;

            }


            var nestedIndex =
                nestedItem.assessmentIndex ??
                nestedItem.assessment_index;


            var nestedCode =
                nestedItem.assessmentCode ??
                nestedItem.assessment_code;


            var sameNestedIndex =
                nestedIndex === undefined ||
                nestedIndex === null ||
                String(nestedIndex) ===
                String(assessmentIndex);


            var sameNestedCode =
                !nestedCode ||
                String(nestedCode)
                    .toUpperCase() ===
                String(assessmentCode)
                    .toUpperCase();


            if (
                sameNestedIndex &&
                sameNestedCode
            ) {

                var normalizedNested =
                    tryNormalize(
                        nestedItem,
                        "nested participant/project result"
                    );


                if (normalizedNested) {

                    return normalizedNested;

                }

            }

        }

    }


    /*
       ======================================================
       7. LAST RESORT:
       SCAN LOCALSTORAGE
       ======================================================
    */

    console.log(
        "Exact result belum ditemukan."
    );

    console.log(
        "Scanning localStorage..."
    );


    for (
        var k = 0;
        k < localStorage.length;
        k++
    ) {

        var storageKey =
            localStorage.key(k);


        if (!storageKey) {

            continue;

        }


        /*
           Hanya periksa key yang
           kemungkinan berhubungan
           dengan participant/project.
        */

        var keyLower =
            storageKey.toLowerCase();


        // LAST RESORT tetap harus participant-scoped.
        // Jangan pernah memilih hasil hanya karena key mengandung projectId;
        // itu dapat mengambil hasil peserta lain (mis. AA02) untuk AA01.
        var participantToken =
            String(participantId).trim().toLowerCase();

        var projectToken =
            String(projectId).trim().toLowerCase();

        var related =
            !!participantToken &&
            !!projectToken &&
            keyLower.includes(participantToken) &&
            keyLower.includes(projectToken);

        if (!related) {
            continue;
        }

        var scannedRaw =
            readLocalStorageObject(
                storageKey
            );

        if (!scannedRaw) {
            continue;
        }

        // Bila object memiliki metadata, metadata WAJIB cocok.
        var scannedProjectId = String(
            scannedRaw.projectId ??
            scannedRaw.projectID ??
            scannedRaw.project_id ??
            ""
        ).trim();

        var scannedParticipantId = String(
            scannedRaw.participantId ??
            scannedRaw.participantID ??
            scannedRaw.participant_id ??
            scannedRaw.idParticipant ??
            ""
        ).trim();

        var scannedIndex =
            scannedRaw.assessmentIndex ??
            scannedRaw.assessment_index;

        var scannedCode =
            scannedRaw.assessmentCode ??
            scannedRaw.assessment_code;

        if (
            (scannedProjectId && scannedProjectId !== String(projectId).trim()) ||
            (scannedParticipantId && scannedParticipantId !== String(participantId).trim()) ||
            (
                scannedIndex !== undefined &&
                scannedIndex !== null &&
                String(scannedIndex) !== String(assessmentIndex)
            ) ||
            (
                scannedCode &&
                String(scannedCode).toUpperCase() !==
                String(assessmentCode).toUpperCase()
            )
        ) {
            console.warn(
                "SKIP localStorage scan: metadata tidak cocok.",
                storageKey,
                { scannedProjectId, scannedParticipantId, scannedIndex, scannedCode }
            );
            continue;
        }

        var normalizedScanned =
            tryNormalize(
                scannedRaw,
                "localStorage scan: " +
                storageKey
            );

        if (normalizedScanned) {
            return normalizedScanned;
        }

    }


    /*
       ======================================================
       TIDAK DITEMUKAN
       ======================================================
    */

    console.warn(
        "HASIL ASSESSMENT TIDAK DITEMUKAN",
        {
            projectId:
                projectId,

            participantId:
                participantId,

            assessmentIndex:
                assessmentIndex,

            assessmentCode:
                assessmentCode
        }
    );


    return null;

}

    
/* ==========================================================
   NORMALIZE RESULT
========================================================== */

function normalizeAssessmentResult(
    raw,
    projectId,
    participantId,
    assessmentIndex,
    assessmentCode,
    isDISC,
    isPAPI
) {

    if (
        !raw ||
        typeof raw !== "object"
    ) {
        return null;
    }


    /* ======================================================
       BASE RESULT
    ====================================================== */

    const result = {
        ...raw,

        projectId:
            raw.projectId ??
            projectId,

        participantId:
            raw.participantId ??
            participantId,

        assessmentIndex:
            raw.assessmentIndex ??
            assessmentIndex,

        assessmentCode:
            raw.assessmentCode ??
            assessmentCode
    };


    /* ======================================================
       1. SUDAH MEMILIKI SCORES
    ====================================================== */

    if (
        result.scores &&
        typeof result.scores === "object"
    ) {

        // DISC v3/baru: wajib mempertahankan tiga graph apa adanya.
        if (
            isDISC &&
            result.scores.most &&
            result.scores.least &&
            result.scores.change &&
            typeof result.scores.most === "object" &&
            typeof result.scores.least === "object" &&
            typeof result.scores.change === "object"
        ) {
            const storedScores = {
                most: normalizeDiscScores(result.scores.most),
                least: normalizeDiscScores(result.scores.least),
                change: normalizeDiscScores(result.scores.change)
            };

            // Bila jawaban 24 nomor tersedia, jawaban adalah sumber kebenaran.
            const recoveredFromAnswers =
                calculateDiscScoresFromAnswers(
                    result.answers ||
                    raw.answers ||
                    raw.jawabanMentah
                );

            if (recoveredFromAnswers) {
                const sameScores =
                    JSON.stringify(storedScores) ===
                    JSON.stringify(recoveredFromAnswers);

                if (!sameScores) {
                    console.warn(
                        "DISC SCORE TIDAK SINKRON DENGAN ANSWERS. SCORE DIPULIHKAN DARI JAWABAN.",
                        { participantId, assessmentIndex, storedScores, recoveredFromAnswers }
                    );
                    result.scores = recoveredFromAnswers;
                } else {
                    result.scores = storedScores;
                }
            } else {
                result.scores = storedScores;
            }

            return result;
        }

        // DISC lama menyimpan scores langsung sebagai {D,I,S,C}.
        // Jika answers tersedia, hitung ulang ketiga graph dari jawaban asli.
        if (
            isDISC &&
            hasDiscDimensions(result.scores) &&
            !result.scores.most &&
            !result.scores.least &&
            !result.scores.change
        ) {

            const recoveredDisc =
                calculateDiscScoresFromAnswers(
                    result.answers ||
                    raw.answers ||
                    raw.jawabanMentah
                );

            if (recoveredDisc) {
                result.scores = recoveredDisc;
                return result;
            }

            // Tidak ada jawaban yang dapat direkonstruksi.
            // Angka flat lama diperlakukan sebagai MOST agar tidak hilang,
            // tetapi Graph 2/3 tidak dibuat-buat.
            result.scores = {
                most: normalizeDiscScores(result.scores),
                least: {},
                change: {}
            };
        }

        return result;

    }


    /* ======================================================
       2. DISC - FORMAT GRAPH
    ====================================================== */

    if (isDISC) {

        const most =
            firstObject([
                raw.most,
                raw.graph1,
                raw.graph1Most,
                raw.graphs?.most,
                raw.graphs?.graph1
            ]);


        const least =
            firstObject([
                raw.least,
                raw.graph2,
                raw.graph2Least,
                raw.graphs?.least,
                raw.graphs?.graph2
            ]);


        const change =
            firstObject([
                raw.change,
                raw.graph3,
                raw.graph3Change,
                raw.graphs?.change,
                raw.graphs?.graph3
            ]);


        if (
            most ||
            least ||
            change
        ) {

            result.scores = {

                most:
                    most || {},

                least:
                    least || {},

                change:
                    change || {}

            };


            return result;

        }


        /* ==================================================
           DISC - FORMAT SCORE LANGSUNG
        ================================================== */

        if (
            hasDiscDimensions(raw)
        ) {

            result.scores = {

                most: {},

                least: {},

                change: {

                    D:
                        Number(
                            raw.D ??
                            raw.d ??
                            0
                        ),

                    I:
                        Number(
                            raw.I ??
                            raw.i ??
                            0
                        ),

                    S:
                        Number(
                            raw.S ??
                            raw.s ??
                            0
                        ),

                    C:
                        Number(
                            raw.C ??
                            raw.c ??
                            0
                        )

                }

            };


            return result;

        }


        /* ==================================================
           DISC - DATA NESTED DI DALAM RESULT
        ================================================== */

        const nestedDisc =
            raw.result ||
            raw.resultData ||
            raw.data ||
            raw.disc ||
            raw.discResult ||
            raw.disc_result;


        if (
            nestedDisc &&
            typeof nestedDisc === "object"
        ) {

            return normalizeAssessmentResult(
                nestedDisc,
                projectId,
                participantId,
                assessmentIndex,
                assessmentCode,
                true,
                false
            );

        }

    }


    /* ======================================================
       3. PAPI
       FORMAT: skorDimensi
    ====================================================== */

    if (
        isPAPI &&
        raw.skorDimensi &&
        typeof raw.skorDimensi === "object"
    ) {

        result.scores =
            raw.skorDimensi;

        return result;

    }


    /* ======================================================
       4. GENERIC SCORE
    ====================================================== */

    if (
        raw.score &&
        typeof raw.score === "object"
    ) {

        result.scores =
            raw.score;

        return result;

    }


    /* ======================================================
       5. RAW ANSWERS
       Jangan buang data yang sudah ditemukan.
    ====================================================== */

    if (
        raw.answers &&
        typeof raw.answers === "object"
    ) {

        if (isDISC) {
            const recoveredDisc =
                calculateDiscScoresFromAnswers(raw.answers);

            if (recoveredDisc) {
                result.scores = recoveredDisc;
                result.answers = raw.answers;
                return result;
            }
        }

        result.scores = {
            answers:
                raw.answers
        };

        return result;
    }


    if (
        raw.jawabanMentah &&
        typeof raw.jawabanMentah === "object"
    ) {

        result.scores = {

            answers:
                raw.jawabanMentah

        };

        result.answers =
            raw.jawabanMentah;

        return result;

    }


    /* ======================================================
       6. FALLBACK
       Data sudah ditemukan dari localStorage.
       Jangan langsung dianggap tidak ada.
    ====================================================== */

    result.scores = {};

    result.answers =
        raw.answers ||
        raw.jawabanMentah ||
        {};

    return result;

}


/* ==========================================================
   ASSESSMENT CODE RESOLVER
========================================================== */

function resolveAssessmentCode(
    projectAssessment,
    masterAssessments
) {

    if (
        typeof projectAssessment ===
        "string"
    ) {

        const text =
            projectAssessment.trim();

        if (!text) {
            return "";
        }

        const byCode =
            masterAssessments.find(
                function (item) {

                    return String(
                        item?.code || ""
                    ).toUpperCase() ===
                    text.toUpperCase();

                }
            );

        if (byCode) {
            return String(
                byCode.code || ""
            ).trim();
        }

        const byName =
            masterAssessments.find(
                function (item) {

                    return String(
                        item?.name || ""
                    ).toLowerCase() ===
                    text.toLowerCase();

                }
            );

        return String(
            byName?.code || text
        ).trim();

    }


    if (
        projectAssessment &&
        typeof projectAssessment ===
        "object"
    ) {

        return String(
            projectAssessment.code ||
            projectAssessment.assessmentCode ||
            projectAssessment.assessmentId ||
            projectAssessment.id ||
            ""
        ).trim();

    }


    return "";
}


/* ==========================================================
   HELPERS
========================================================== */

function readLocalStorageObject(
    key
) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return null;
        }

        const parsed =
            JSON.parse(raw);

        return (
            parsed &&
            typeof parsed === "object"
        )
            ? parsed
            : null;

    } catch (error) {

        console.error(
            `Gagal membaca localStorage key "${key}":`,
            error
        );

        return null;
    }
}


function readLocalStorageArray(
    key
) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(raw);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            `Gagal membaca localStorage array "${key}":`,
            error
        );

        return [];
    }
}


function firstObject(
    candidates
) {

    for (
        const candidate of candidates
    ) {

        if (
            candidate &&
            typeof candidate === "object" &&
            !Array.isArray(candidate)
        ) {

            return candidate;

        }

    }

    return null;
}


function calculateDiscScoresFromAnswers(answers) {

    if (!Array.isArray(answers) || !answers.length) {
        return null;
    }

    const most = { D: 0, I: 0, S: 0, C: 0 };
    const leastCount = { D: 0, I: 0, S: 0, C: 0 };

    let typedAnswerCount = 0;

    answers.forEach(function (answer) {

        if (!answer || typeof answer !== "object") {
            return;
        }

        // Jawaban hasil lama menyimpan index option, bukan tipe D/I/S/C.
        // Karena normalizeAssessmentResult tidak memiliki questions[],
        // rekonstruksi hanya mungkin bila caller menyimpan dimensi langsung.
        // Jika format answer sudah membawa type, dukung juga format tersebut.
        const mostType =
            answer.mostType ||
            answer.MType ||
            answer.most?.type;

        const leastType =
            answer.leastType ||
            answer.LType ||
            answer.least?.type;

        let used = false;

        if (Object.prototype.hasOwnProperty.call(most, mostType)) {
            most[mostType]++;
            used = true;
        }

        if (Object.prototype.hasOwnProperty.call(leastCount, leastType)) {
            leastCount[leastType]++;
            used = true;
        }

        if (used) {
            typedAnswerCount++;
        }
    });

    // Index-only answers tidak cukup untuk direkonstruksi tanpa bank soal.
    // Kembalikan null supaya tidak menghasilkan angka palsu.
    if (typedAnswerCount === 0) {
        return null;
    }

    const least = {
        D: -leastCount.D,
        I: -leastCount.I,
        S: -leastCount.S,
        C: -leastCount.C
    };

    const change = {
        D: most.D + least.D,
        I: most.I + least.I,
        S: most.S + least.S,
        C: most.C + least.C
    };

    return { most, least, change };
}


function hasDiscDimensions(
    value
) {

    if (
        !value ||
        typeof value !== "object"
    ) {
        return false;
    }

    return (
        Object.prototype.hasOwnProperty.call(
            value,
            "D"
        ) ||
        Object.prototype.hasOwnProperty.call(
            value,
            "I"
        ) ||
        Object.prototype.hasOwnProperty.call(
            value,
            "S"
        ) ||
        Object.prototype.hasOwnProperty.call(
            value,
            "C"
        )
    );
}


function isDiscAssessment(
    assessmentCode,
    assessment
) {

    const code =
        String(
            assessmentCode || ""
        ).toUpperCase();

    const name =
        String(
            assessment?.name ||
            assessment?.title ||
            ""
        ).toUpperCase();

    return (
        code.includes("DISC") ||
        name.includes("DISC")
    );
}


/* ==========================================================
   HEADER
========================================================== */

function updateAssessmentHeader(
    isDISC,
    isPAPI
) {

    const titleEl =
        document.getElementById(
            "sectionTitle"
        );

    const descEl =
        document.getElementById(
            "sectionDesc"
        );

    const badgeEl =
        document.getElementById(
            "dominantBadge"
        );


    if (isDISC) {

        if (titleEl) {
            titleEl.textContent =
                "Skoring & Analisis Hasil DISC";
        }

        if (descEl) {
            descEl.textContent =
                "Hasil evaluasi dan penilaian detail tipe perilaku kerja DISC.";
        }

        if (badgeEl) {
            badgeEl.textContent = "D";
        }

        return;
    }


    if (isPAPI) {

        if (titleEl) {
            titleEl.textContent =
                "Skoring & Analisis Hasil PAPI Kostick";
        }

        if (descEl) {
            descEl.textContent =
                "Profil aspek kepribadian, work role, dan kebutuhan dalam bekerja.";
        }

        if (badgeEl) {
            badgeEl.textContent = "P";
        }

        return;
    }


    if (titleEl) {
        titleEl.textContent =
            "Hasil Assessment";
    }

    if (descEl) {
        descEl.textContent =
            "Hasil evaluasi assessment peserta.";
    }
}


/* ==========================================================
   UPDATE ELEMENT
========================================================== */

function updateElement(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );

    if (element) {

        element.textContent =
            value ?? "-";

    }
}


/* ==========================================================
   SHOW MESSAGE
========================================================== */

function showResultMessage(
    message
) {

    const resultContent =
        document.getElementById(
            "resultContent"
        );

    if (!resultContent) {
        return;
    }

    resultContent.innerHTML = `

        <div
            class="empty-test"
            style="
                padding:24px;
                border:1px solid #e2e8f0;
                border-radius:12px;
                background:#ffffff;
                color:#334155;
                display:flex;
                align-items:center;
                gap:10px;
            "
        >

            <i
                class="fa-solid fa-circle-info"
                style="color:#2563eb;"
            ></i>

            <span>
                ${escapeResultHTML(message)}
            </span>

        </div>

    `;
}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeResultHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==========================================================
   FORMAT DATE
========================================================== */

function formatTestDate(
    date
) {

    if (
        !date ||
        date === "-"
    ) {

        return "-";
    }

    const raw =
        String(date).trim();

    const d =
        new Date(
            raw.includes("T")
                ? raw
                : raw + "T00:00:00"
        );

    if (
        isNaN(
            d.getTime()
        )
    ) {

        return raw;
    }

    return d.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}
