/* ==========================================================
   TALENTSCOPE — SUPABASE SYNC BRIDGE
   ----------------------------------------------------------
   TUJUAN
   File ini menghubungkan aplikasi TalentScope (yang sebelumnya
   100% berbasis localStorage) ke database Supabase, TANPA perlu
   menulis ulang seluruh halaman/skrip lama.

   CARA KERJA
   1. Skrip ini WAJIB menjadi <script> PERTAMA yang dimuat di
      setiap halaman (diletakkan tepat setelah <meta charset>,
      sebelum skrip apa pun yang lain).
   2. Saat halaman dibuka, skrip ini mengambil data terbaru dari
      Supabase secara SINKRON (via XMLHttpRequest synchronous)
      dan menuliskannya ke localStorage SEBELUM skrip lama
      (result.js, test-result.js, disc_test.html, dst.) sempat
      berjalan. Dengan begitu kode lama tetap membaca
      localStorage seperti biasa, tapi isinya sudah "segar" dari
      database pusat.
      Catatan: XHR sinkron sengaja dipakai (bukan fetch/async)
      supaya urutan eksekusi terjamin tanpa mengubah struktur
      <script> di halaman lama. Efeknya: saat pertama membuka
      halaman ada jeda singkat sebelum halaman lain diproses.
      Untuk pengalaman yang lebih halus di masa depan, ini bisa
      diganti dengan pola async + splash/loading screen.
   3. Skrip ini juga "membungkus" localStorage.setItem: setiap
      kali kode lama menyimpan data ke key yang relevan
      (talentscope_projects / projects / talent_scope_results),
      data tsb otomatis dikirim (upsert) ke Supabase di
      belakang layar, tanpa mengubah baris kode lain di file
      manapun.

   DATA YANG DISINKRONKAN
   - talentscope_projects & projects  → tabel ts_projects
     (project + seluruh peserta di dalamnya, termasuk status
     online/offline, assessmentStatus, activity log, dst.)
   - talent_scope_results             → tabel ts_results
     (hasil setiap tes: DISC, PAPI Kostick, VAP/speed test, dst.)
     Skrip ini juga menulis ulang key per-tes yang dipakai
     halaman hasil (assessment_result_v3_..., assessment_result_...,
     <kode>_result_v3_..., <kode>_result_...) dari data Supabase.
   - talentscope_settings_users       → tabel ts_users
     (akun Admin/Client/Asesor yang dibuat lewat tab "Users" di
     settings.html, supaya bisa login dari perangkat/browser mana
     pun — sebelumnya akun ini murni localStorage per-device).

   DATA YANG TIDAK DISINKRONKAN (sengaja tetap lokal per-device)
   - Jawaban yang sedang dikerjakan (draft autosave) & sisa waktu
     timer tiap tes — ini state sementara per sesi pengerjaan.
   - papi_final_result — key "serah-terima" sementara antara
     halaman tes PAPI dan halaman hasil pada browser yang sama.
   Jika suatu saat peserta perlu bisa melanjutkan tes dari
   perangkat lain, bagian ini juga bisa disinkronkan menyusul.
========================================================== */

(function () {
    "use strict";

    /* ------------------------------------------------------
       KONFIGURASI SUPABASE
    ------------------------------------------------------ */

    var SUPABASE_URL = "https://nixmychfhsnsvymkuxtm.supabase.co";
    var SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peG15Y2hmaHNuc3Z5bWt1eHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NzU0MzMsImV4cCI6MjEwMzA1MTQzM30.Ak9SMJkhwtTlo8zIcHha8uecF4ayz172zIwGbdliNm4";

    var PROJECTS_KEYS = ["talentscope_projects", "projects"];
    var RESULTS_KEY = "talent_scope_results";
    var USERS_KEY = "talentscope_settings_users";


    /* ------------------------------------------------------
       HELPER: REST GET (SINKRON)
    ------------------------------------------------------ */

    function restGetSync(path) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", SUPABASE_URL + path, false);
            xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
            xhr.setRequestHeader("Authorization", "Bearer " + SUPABASE_ANON_KEY);
            xhr.send(null);

            if (xhr.status >= 200 && xhr.status < 300) {
                return JSON.parse(xhr.responseText || "[]");
            }

            console.warn("[TS-Sync] GET gagal:", path, xhr.status, xhr.responseText);
            return null;

        } catch (error) {
            console.warn("[TS-Sync] GET error:", path, error);
            return null;
        }
    }


    /* ------------------------------------------------------
       HELPER: HAPUS BARIS DENGAN "id" YANG SAMA (DUPLIKAT)
       PENTING: Postgres akan menolak (error 500) kalau satu
       kali kirim upsert berisi >1 baris dengan "id" yang sama
       persis — errornya: "ON CONFLICT DO UPDATE command
       cannot affect row a second time". Ini gampang terjadi
       kalau data lokal (talent_scope_results / projects) sudah
       terlanjur punya duplikat karena tersimpan berkali-kali.
       Jadi sebelum dikirim, kita simpan HANYA kemunculan
       TERAKHIR dari tiap id.
    ------------------------------------------------------ */

    function dedupeRowsById(rows) {
        var map = {};
        var order = [];

        rows.forEach(function (row) {
            if (!row || !row.id) return;
            if (!(row.id in map)) {
                order.push(row.id);
            }
            map[row.id] = row;
        });

        return order.map(function (id) { return map[id]; });
    }


    /* ------------------------------------------------------
       HELPER: REST UPSERT (INTI, MENGEMBALIKAN PROMISE)
       ----------------------------------------------------
       Dipakai oleh restUpsert() (fire-and-forget, perilaku
       lama tidak berubah) DAN oleh pushUsersNow() yang bisa
       di-await oleh kode lain (mis. settings.js) supaya tahu
       PASTI apakah upsert ke Supabase benar-benar berhasil,
       bukan cuma "sudah dikirim".

       options.keepalive (default FALSE): SENGAJA default
       mati, sama seperti restUpsert() versi sebelumnya --
       payload tabel seperti ts_projects/ts_results bisa
       lebih besar dari batas 64KB yang dikenakan browser
       untuk request keepalive:true, dan kalau kelewat itu
       fetch GAGAL TOTAL di setiap pemanggilan (bukan cuma
       saat unload). Hanya nyalakan keepalive secara eksplisit
       untuk payload yang dijamin kecil (mis. daftar akun user
       di pushUsersNow()).
    ------------------------------------------------------ */

    function performUpsertRequest(table, rows, options) {

        if (!rows || !rows.length) {
            return Promise.resolve({ ok: true, skipped: true });
        }

        var deduped = dedupeRowsById(rows);

        if (!deduped.length) {
            return Promise.resolve({ ok: true, skipped: true });
        }

        var useKeepalive = !!(options && options.keepalive);

        var fetchOptions = {
            method: "POST",
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": "Bearer " + SUPABASE_ANON_KEY,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal"
            },
            body: JSON.stringify(deduped)
        };

        // CATATAN: keepalive:true HANYA dipasang kalau caller minta
        // secara eksplisit (lihat komentar di atas soal batas 64KB).
        if (useKeepalive) {
            fetchOptions.keepalive = true;
        }

        return fetch(SUPABASE_URL + "/rest/v1/" + table + "?on_conflict=id", fetchOptions)
            .then(function (response) {

                if (response.ok) {
                    return { ok: true, status: response.status };
                }

                return response.text().then(function (text) {
                    console.warn("[TS-Sync] Upsert ditolak server:", table, response.status, text);
                    return { ok: false, status: response.status, message: text };
                });

            }).catch(function (error) {
                console.warn("[TS-Sync] Upsert gagal (network):", table, error);
                return { ok: false, status: 0, message: String((error && error.message) || error) };
            });
    }


    /* ------------------------------------------------------
       HELPER: REST UPSERT (ASYNC, FIRE-AND-FORGET)
       Perilaku lama dipertahankan persis: dipanggil dari
       localStorage.setItem() yang dibungkus di bawah, tanpa
       keepalive (lihat catatan batas 64KB di atas), tidak ada
       yang menunggu hasilnya.
    ------------------------------------------------------ */

    function restUpsert(table, rows) {
        try {
            performUpsertRequest(table, rows, { keepalive: false });
        } catch (error) {
            console.warn("[TS-Sync] Upsert error:", table, error);
        }
    }


    /* ------------------------------------------------------
       PUBLIC API: pushUsersNow()
       ----------------------------------------------------
       Dipakai settings.js saat ganti password, supaya UI bisa
       menunggu (await) dan tahu PASTI apakah perubahan sudah
       tersimpan di Supabase `ts_users` sebelum menampilkan
       "berhasil" ke pengguna -- bukan lagi asumsi otomatis
       seperti alur debounce biasa.

       keepalive DINYALAKAN di sini (beda dari restUpsert() di
       atas) karena payload-nya cuma daftar akun Admin/Client/
       Asesor -- jauh di bawah batas 64KB -- dan justru butuh
       bertahan kalau pengguna buru-buru pindah halaman persis
       saat password sedang disimpan.

       usersOverride (opsional): array users yang MAU dikirim,
       dipakai kalau caller belum/tidak mau commit perubahan ke
       localStorage sebelum push ke server sukses (lihat
       settings.js). Kalau tidak diisi, baca dari localStorage
       seperti biasa.

       Mengembalikan Promise<{ ok, status, message? }>.
    ------------------------------------------------------ */

    function pushUsersNow(usersOverride) {

        try {

            var arr = Array.isArray(usersOverride)
                ? usersOverride
                : readLocalArray(USERS_KEY);

            var rows = arr.map(userToRow).filter(Boolean);

            return performUpsertRequest("ts_users", rows, { keepalive: true });

        } catch (error) {

            console.warn("[TS-Sync] pushUsersNow error:", error);

            return Promise.resolve({
                ok: false,
                status: 0,
                message: String((error && error.message) || error)
            });
        }
    }


    window.TalentScopeSync = window.TalentScopeSync || {};
    window.TalentScopeSync.pushUsersNow = pushUsersNow;


    /* ------------------------------------------------------
       HELPER: BACA ARRAY DARI LOCALSTORAGE DENGAN AMAN
    ------------------------------------------------------ */

    function readLocalArray(key) {
        try {
            var raw = localStorage.getItem(key);
            var parsed = JSON.parse(raw || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }


    /* ------------------------------------------------------
       KONVERSI: PROJECT OBJECT -> ROW ts_projects
    ------------------------------------------------------ */

    function projectToRow(project) {
        var pid = String(project && (project.id || project.projectId || project.project_id) || "");
        if (!pid) return null;
        return { id: pid, data: project };
    }


    /* ------------------------------------------------------
       KONVERSI: RESULT OBJECT -> ROW ts_results
    ------------------------------------------------------ */

    function resultToRow(item) {
        var pid = String((item && item.projectId) || "");
        var parid = String((item && item.participantId) || "");
        if (!pid || !parid) return null;

        var idx = String(item.assessmentIndex !== undefined && item.assessmentIndex !== null ? item.assessmentIndex : "");
        var code = String(item.assessmentCode || "GEN").toLowerCase();

        return {
            id: pid + "__" + parid + "__" + idx + "__" + code,
            project_id: pid,
            participant_id: parid,
            assessment_index: idx,
            assessment_code: code,
            data: item
        };
    }


    /* ------------------------------------------------------
       KONVERSI: USER OBJECT -> ROW ts_users
    ------------------------------------------------------ */

    function userToRow(user) {
        var uid = String(user && user.id || "");
        if (!uid) return null;
        return { id: uid, data: user };
    }


    /* ------------------------------------------------------
       SYNC-DOWN: PROJECTS (Supabase -> localStorage)
       ----------------------------------------------------
       SUMBER UTAMA: tabel relasional (projects, project_participants,
       participants, project_assessments) — tabel YANG SAMA dipakai
       oleh js/data-service.js di halaman admin (Participants,
       Database, Projects). Ini penting supaya halaman participant-
       facing (yang baca "talentscope_projects" dari localStorage)
       selalu melihat data project/peserta YANG SAMA dengan yang
       dibuat/diedit lewat halaman admin — tidak lagi baca tabel
       "ts_projects" (blob lama) yang datanya bisa basi/tidak sinkron.

       FALLBACK: kalau tabel relasional gagal diakses total (mis.
       nama tabel belum ada), baru coba cara lama lewat "ts_projects".
    ------------------------------------------------------ */

    function assembleProjectsFromRelationalTables() {
        var projectRows = restGetSync("/rest/v1/projects?select=*");

        if (projectRows === null) {
            return null;
        }

        var relationRowsRaw = restGetSync("/rest/v1/project_participants?select=*");
        var participantRowsRaw = restGetSync("/rest/v1/participants?select=*");

        // PENTING: kalau salah satu dari dua request ini gagal (null),
        // JANGAN lanjut dengan anggapan "kosong" (rows = []) — itu akan
        // membuat semua project seolah tidak punya peserta sama sekali,
        // padahal cuma request-nya yang gagal/lambat. Lebih aman gagal
        // total di sini dan biarkan caller fallback ke cara lama.
        if (relationRowsRaw === null || participantRowsRaw === null) {
            console.warn(
                "[TS-Sync] Gagal ambil project_participants/participants, batalkan assembly relasional."
            );
            return null;
        }

        var relationRows = relationRowsRaw;
        var participantRows = participantRowsRaw;

        // Assessment tidak sekritis peserta — kalau gagal, cukup anggap
        // kosong untuk project terkait (assessments lama tetap dipakai).
        var assessmentRows = restGetSync("/rest/v1/project_assessments?select=*") || [];

        var participantById = {};
        participantRows.forEach(function (p) {
            if (p && p.id !== undefined && p.id !== null) {
                participantById[String(p.id)] = p;
            }
        });

        var relationsByProject = {};
        relationRows.forEach(function (rel) {
            var pid = String((rel && rel.project_id) || "");
            if (!pid) return;
            if (!relationsByProject[pid]) relationsByProject[pid] = [];
            relationsByProject[pid].push(rel);
        });

        var assessmentsByProject = {};
        assessmentRows.forEach(function (a) {
            var pid = String((a && a.project_id) || "");
            if (!pid) return;
            if (!assessmentsByProject[pid]) assessmentsByProject[pid] = [];
            assessmentsByProject[pid].push(a);
        });

        return projectRows.map(function (project) {
            var pid = String((project && project.id) || "");
            var relations = relationsByProject[pid] || [];

            var participants = relations.map(function (rel) {
                var participant = participantById[String(rel.participant_id)];
                if (!participant) return null;

                // PENTING (FIX): raw_data (JSONB) berisi snapshot presence
                // & activity log yang ditulis pushParticipantsPresence()
                // -- isLoggedIn, lastSeenAt, currentActivity, activityHistory,
                // dst. Sebelumnya field ini TIDAK di-unpack ke level atas,
                // jadi setiap kali halaman peserta berpindah (ts-supabase-
                // sync.js wajib dimuat pertama di SETIAP halaman -> syncDown
                // jalan lagi -> localStorage ditimpa), activityHistory ikut
                // hilang karena dianggap tidak ada. Unpack raw_data DULU,
                // baru timpa dengan kolom asli tabel participants supaya
                // kolom tabel tetap sumber kebenaran kalau bentrok.
                var rawData = (participant && participant.raw_data) || {};

                // Gabungkan status relasi (project_participants.status) ke
                // dalam object participant, tanpa menghapus status asli
                // kalau memang sudah ada di tabel participants.
                var merged = {};
                for (var k in rawData) merged[k] = rawData[k];
                for (var k in participant) merged[k] = participant[k];

                merged.status =
                    participant.status ||
                    rel.status ||
                    rel.participant_status ||
                    "Not Started";

                return merged;
            }).filter(Boolean);

            var merged = {};
            for (var k in project) merged[k] = project[k];

            merged.participants = participants;

                        // ============================================
            // FIX: Assessment list — prioritas + fallback
            // ============================================
            // Prioritas 1: project_assessments (tabel relasional)
            // Prioritas 2: raw_data.assessments (JSONB fallback)
            // Prioritas 3: assessments di project langsung
            // Prioritas 4: []
            // ============================================
            if (assessmentsByProject[pid] && assessmentsByProject[pid].length) {
                merged.assessments = assessmentsByProject[pid];
                console.log(
                    "[TS-Sync] assessments dari project_assessments:",
                    pid,
                    merged.assessments.length
                );
            } else if (project.raw_data && Array.isArray(project.raw_data.assessments) && project.raw_data.assessments.length) {
                // FALLBACK: baca dari raw_data.assessments
                merged.assessments = project.raw_data.assessments;
                console.log(
                    "[TS-Sync] assessments dari raw_data.assessments:",
                    pid,
                    merged.assessments.length
                );
            } else if (Array.isArray(project.assessments) && project.assessments.length) {
                // FALLBACK: dari project.assessments langsung
                merged.assessments = project.assessments;
            } else {
                merged.assessments = [];
            }

            return merged;
        });
    }

    function syncProjectsDown() {
        var assembled = assembleProjectsFromRelationalTables();

        if (assembled !== null) {
            var json = JSON.stringify(assembled);

            PROJECTS_KEYS.forEach(function (key) {
                localStorage.setItem(key, json);
            });

            return;
        }

        // ---- FALLBACK: cara lama (tabel ts_projects blob) ----

        var remote = restGetSync("/rest/v1/ts_projects?select=id,data");

        if (remote === null) {
            // Gagal konek (offline / tabel belum dibuat) -> biarkan data lokal apa adanya.
            return;
        }

        if (remote.length > 0) {
            var projects = remote.map(function (row) { return row.data; });
            var json2 = JSON.stringify(projects);

            PROJECTS_KEYS.forEach(function (key) {
                localStorage.setItem(key, json2);
            });

        } else {
            var local = readLocalArray("talentscope_projects");
            if (local.length > 0) {
                var rows = local.map(projectToRow).filter(Boolean);
                restUpsert("ts_projects", rows);
            }
        }
    }


    /* ------------------------------------------------------
       SYNC-DOWN: RESULTS (Supabase -> localStorage)
    ------------------------------------------------------ */

    function syncResultsDown() {
        var remote = restGetSync(
            "/rest/v1/ts_results?select=id,project_id,participant_id,assessment_index,assessment_code,data"
        );

        if (remote === null) {
            return;
        }

        if (remote.length > 0) {
            var results = remote.map(function (row) { return row.data; });
            localStorage.setItem(RESULTS_KEY, JSON.stringify(results));

            remote.forEach(function (row) {
                var pid = row.project_id;
                var parid = row.participant_id;
                var idx = row.assessment_index;
                var code = String(row.assessment_code || "").toLowerCase();
                var json = JSON.stringify(row.data);

                // Tulis ulang semua variasi nama key yang dipakai
                // halaman-halaman lama (DISC, PAPI, dst.) agar tetap terbaca.
                localStorage.setItem("assessment_result_v3_" + pid + "_" + parid + "_" + idx, json);
                localStorage.setItem("assessment_result_" + pid + "_" + parid + "_" + idx, json);

                if (code) {
                    localStorage.setItem(code + "_result_v3_" + pid + "_" + parid + "_" + idx, json);
                    localStorage.setItem(code + "_result_" + pid + "_" + parid + "_" + idx, json);
                }
            });

        } else {
            var local = readLocalArray(RESULTS_KEY);
            if (local.length > 0) {
                var rows = local.map(resultToRow).filter(Boolean);
                restUpsert("ts_results", rows);
            }
        }
    }


    /* ------------------------------------------------------
       SYNC-DOWN: USERS ADMIN/CLIENT/ASESOR (Supabase -> localStorage)
       ----------------------------------------------------
       KENAPA INI PERLU:
       Sebelumnya akun Admin/Client/Asesor (dibuat lewat tab
       "Users" di settings.html) hanya tersimpan di localStorage
       key "talentscope_settings_users" — TIDAK PERNAH disinkronkan
       ke Supabase sama sekali. Akibatnya:
       - Akun yang dibuat di satu browser/perangkat tidak bisa
         dipakai login dari perangkat/browser lain.
       - login.html tidak punya sumber data terpusat untuk akun
         non-peserta, sehingga sebelumnya terpaksa scan SEMUA
         key localStorage sebagai tebakan (lihat catatan lama
         di login.html, sudah dihapus).
       Sama seperti projects & results, key ini sekarang disalin
       ke tabel `ts_users` (id, data jsonb) setiap kali berubah,
       dan ditarik turun setiap halaman yang memuat skrip ini
       dibuka.
    ------------------------------------------------------ */

    function syncUsersDown() {
        var remote = restGetSync("/rest/v1/ts_users?select=id,data");

        if (remote === null) {
            // Gagal konek (offline / tabel belum dibuat) -> biarkan data lokal apa adanya.
            return;
        }

        if (remote.length > 0) {
            var users = remote.map(function (row) { return row.data; });
            localStorage.setItem(USERS_KEY, JSON.stringify(users));

        } else {
            var local = readLocalArray(USERS_KEY);
            if (local.length > 0) {
                var rows = local.map(userToRow).filter(Boolean);
                restUpsert("ts_users", rows);
            }
        }
    }


    /* ------------------------------------------------------
       JALANKAN SYNC-DOWN SEKARANG (SEBELUM SKRIP LAIN JALAN)
    ------------------------------------------------------ */

    syncProjectsDown();
    syncResultsDown();
    syncUsersDown();


    /* ------------------------------------------------------
       PUSH PRESENCE PESERTA LANGSUNG KE TABEL `participants`
       ----------------------------------------------------
       KENAPA INI PERLU:
       Heartbeat presence (isLoggedIn, lastSeenAt, currentActivity,
       dst.) selama ini hanya tersimpan di localStorage lalu ikut
       terkirim ke tabel LAMA `ts_projects` (blob per-project).
       Tapi halaman monitoring admin (view-monitoring.js) membaca
       status online/offline dari kolom `raw_data` di tabel
       `participants` (hasil assembly relasional), BUKAN dari
       `ts_projects`. Akibatnya heartbeat peserta tidak pernah
       sampai ke tempat yang benar-benar dibaca admin — peserta
       bisa aktif mengerjakan tes tapi tetap terlihat "Offline".

       Fungsi ini menutup celah itu: setiap peserta yang datanya
       sudah pernah tersinkron dari Supabase (sehingga punya
       `id` asli, hasil assembleProjectsFromRelationalTables)
       akan di-PATCH langsung ke baris `participants` miliknya.
    ------------------------------------------------------ */

    function pushOneParticipantPresence(participantRowId, participant) {

        if (!participantRowId) {
            return Promise.resolve({ ok: false, skipped: true });
        }

        return fetch(
            SUPABASE_URL +
            "/rest/v1/participants?id=eq." +
            encodeURIComponent(participantRowId) +
            "&select=raw_data",
            {
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": "Bearer " + SUPABASE_ANON_KEY
                },
                keepalive: true
            }
        )
            .then(function (res) {
                return res.ok ? res.json() : [];
            })
            .then(function (rows) {

                var existingRawData =
                    (rows && rows[0] && rows[0].raw_data) || {};

                /*
                   FIX: activityHistory TIDAK BOLEH ditimpa
                   langsung dengan Object.assign — itu shallow
                   merge, jadi array lokal (yang bisa saja lebih
                   pendek/basi daripada yang sudah tersimpan di
                   Supabase dari tab/perangkat lain) akan
                   MENGGANTIKAN riwayat yang sudah lebih
                   lengkap, bukan digabung. Ini akar penyebab
                   "activity history hilang" yang dilaporkan.

                   Solusi: gabungkan (union) riwayat lokal +
                   riwayat remote, hapus duplikat, urutkan
                   terbaru duluan — baru dipakai.
                */

                var existingHistory =
                    Array.isArray(existingRawData.activityHistory)
                        ? existingRawData.activityHistory
                        : [];

                var localHistory =
                    Array.isArray(participant.activityHistory)
                        ? participant.activityHistory
                        : [];

                var seenHistoryKeys = {};

                var mergedHistory =
                    localHistory.concat(existingHistory).filter(function (item) {
                        var key = JSON.stringify([
                            item && item.type,
                            item && (item.activity || item.description),
                            item && item.timestamp
                        ]);
                        if (seenHistoryKeys[key]) return false;
                        seenHistoryKeys[key] = true;
                        return true;
                    });

                mergedHistory.sort(function (a, b) {
                    return new Date((b && b.timestamp) || 0) - new Date((a && a.timestamp) || 0);
                });

                var mergedRawData =
                    Object.assign(
                        {},
                        existingRawData,
                        {
                            isLoggedIn: participant.isLoggedIn,
                            onlineStatus: participant.onlineStatus,
                            // FIX: waktu login sebelumnya tidak pernah
                            // ikut terkirim, jadi "Waktu Login" di
                            // database.html selalu tampil "-".
                            loginTime: participant.loginTime,
                            loginAt: participant.loginAt,
                            loggedInAt: participant.loggedInAt,
                            lastLoginAt: participant.lastLoginAt,
                            lastSeen: participant.lastSeen,
                            lastSeenAt: participant.lastSeenAt,
                            lastHeartbeat: participant.lastHeartbeat,
                            currentActivity: participant.currentActivity,
                            currentTest: participant.currentTest,
                            currentAssessmentIndex: participant.currentAssessmentIndex,
                            currentAssessmentCode: participant.currentAssessmentCode,
                            activity: participant.activity,
                            lastActivity: participant.lastActivity,
                            activityUpdatedAt: participant.activityUpdatedAt,
                            activityHistory: mergedHistory,
                            assessmentStatus: participant.assessmentStatus,
                            logoutTime: participant.logoutTime,
                            loggedOutAt: participant.loggedOutAt,
                            logoutAt: participant.logoutAt,
                            // FIX: field ini dibersihkan (di-null-kan) saat
                            // login di participant-dashboard.html, tapi
                            // sebelumnya tidak ikut ditimpa di sini --
                            // database.html jatuh ke fallback lastLogoutAt
                            // yang masih bawa tanggal logout sesi lama.
                            lastLogoutAt: participant.lastLogoutAt,
                            lastLogout: participant.lastLogout,
                            waktuLogout: participant.waktuLogout
                        }
                    );

                return fetch(
                    SUPABASE_URL +
                    "/rest/v1/participants?id=eq." +
                    encodeURIComponent(participantRowId),
                    {
                        method: "PATCH",
                        headers: {
                            "apikey": SUPABASE_ANON_KEY,
                            "Authorization": "Bearer " + SUPABASE_ANON_KEY,
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal"
                        },
                        body: JSON.stringify({
                            is_logged_in: participant.isLoggedIn === true,
                            raw_data: mergedRawData
                        }),
                        // FIX: sama seperti di restUpsert() -- PATCH
                        // presence ini paling sering terpicu justru
                        // pada saat logout (pagehide/beforeunload),
                        // yaitu momen paling rawan request dibatalkan
                        // browser karena halaman langsung ditutup.
                        keepalive: true
                    }
                );
            })
            .then(function (res) {
                if (res && !res.ok) {
                    return res.text().then(function (text) {
                        console.warn(
                            "[TS-Sync] Gagal update presence peserta:",
                            participantRowId,
                            res.status,
                            text
                        );
                        return { ok: false, status: res.status };
                    });
                }
                return { ok: true };
            })
            .catch(function (error) {
                console.warn(
                    "[TS-Sync] Presence sync error:",
                    participantRowId,
                    error
                );
                return { ok: false, error: String((error && error.message) || error) };
            });
    }


    /*
       PUBLIC API: pushParticipantPresenceNow(participantRowId, participant)
       ----------------------------------------------------------------
       Dipakai halaman yang perlu MEMASTIKAN sync ke Supabase betul-betul
       selesai sebelum pindah halaman (mis. tombol Logout di
       participant-dashboard.html) -- await fungsi ini SEBELUM
       window.location.href, alih-alih mengandalkan keepalive di
       pagehide/beforeunload yang tidak menjamin promise chain lanjut
       jalan setelah halaman dinavigasi pergi.

       Mengembalikan Promise<{ ok, status?, error? }>.
    */
    window.TalentScopeSync = window.TalentScopeSync || {};
    window.TalentScopeSync.pushParticipantPresenceNow = pushOneParticipantPresence;


    function pushParticipantsPresence(projects) {

        var pending = [];

        (projects || []).forEach(function (project) {

            var participants =
                Array.isArray(project && project.participants)
                    ? project.participants
                    : [];

            participants.forEach(function (participant) {

                var participantRowId =
                    participant && participant.id;

                // Hanya peserta yang id-nya sudah berupa id asli
                // dari Supabase (hasil sync-down) yang bisa di-PATCH.
                if (!participantRowId) return;

                pending.push(
                    pushOneParticipantPresence(
                        participantRowId,
                        participant
                    )
                );
            });
        });

        return Promise.all(pending);
    }


    /* ------------------------------------------------------
       SYNC-UP: BUNGKUS localStorage.setItem
       Setiap kali kode lama menulis ke key yang relevan,
       kirim juga ke Supabase (debounce agar tidak spam saat
       heartbeat presence menulis tiap beberapa detik).
    ------------------------------------------------------ */

    var originalSetItem = localStorage.setItem.bind(localStorage);
    var debounceTimers = {};

    // FIX: simpan fungsi yang masih "menunggu" debounce per bucket,
    // supaya bisa di-flush SEKARANG JUGA (bukan nunggu delay) begitu
    // halaman mau ditutup/pindah -- lihat listener pagehide/beforeunload
    // di bawah. Tanpa ini, presence logout (recordAssessmentLogout di
    // speedtest.html, dipanggil dari pagehide) menulis ke localStorage
    // tepat saat halaman ditutup, tapi push ke Supabase-nya baru terjadi
    // 800ms KEMUDIAN -- yang mana halaman sudah keburu hilang duluan,
    // jadi PATCH ke Supabase tidak pernah sempat dikirim sama sekali.
    var pendingPushes = {};

    function debouncedPush(bucket, fn, delay) {
        clearTimeout(debounceTimers[bucket]);
        pendingPushes[bucket] = fn;

        debounceTimers[bucket] = setTimeout(function () {
            delete pendingPushes[bucket];
            fn();
        }, delay || 800);
    }

    function flushPendingPushesNow() {
        Object.keys(pendingPushes).forEach(function (bucket) {
            clearTimeout(debounceTimers[bucket]);
            var fn = pendingPushes[bucket];
            delete pendingPushes[bucket];
            try {
                fn();
            } catch (error) {
                console.warn("[TS-Sync] Gagal flush pending push:", bucket, error);
            }
        });
    }

    // Momen paling rawan kehilangan data: peserta menutup tab / pindah
    // halaman (logout, pindah assessment, dsb). Paksa kirim SEKARANG,
    // jangan tunggu debounce, dan andalkan keepalive:true di atas supaya
    // request tetap selesai walau halaman sudah unload.
    window.addEventListener("pagehide", flushPendingPushesNow);
    window.addEventListener("beforeunload", flushPendingPushesNow);
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
            flushPendingPushesNow();
        }
    });

    localStorage.setItem = function (key, value) {
        // Perilaku asli TIDAK diubah sama sekali.
        originalSetItem(key, value);

        try {
            if (PROJECTS_KEYS.indexOf(key) !== -1) {

                debouncedPush("projects", function () {
                    var arr = readLocalArray("talentscope_projects");
                    var rows = arr.map(projectToRow).filter(Boolean);
                    restUpsert("ts_projects", rows);

                    // FIX: heartbeat/presence peserta sekarang juga
                    // sampai ke tabel `participants` (bukan cuma
                    // blob ts_projects), supaya status online/offline
                    // di halaman monitoring admin akurat real-time.
                    pushParticipantsPresence(arr);
                });

            } else if (key === RESULTS_KEY) {

                debouncedPush("results", function () {
                    var arr = readLocalArray(RESULTS_KEY);
                    var rows = arr.map(resultToRow).filter(Boolean);
                    restUpsert("ts_results", rows);
                });

            } else if (key === USERS_KEY) {

                debouncedPush("users", function () {
                    var arr = readLocalArray(USERS_KEY);
                    var rows = arr.map(userToRow).filter(Boolean);
                    restUpsert("ts_users", rows);
                });
            }
        } catch (error) {
            console.warn("[TS-Sync] Gagal mengirim perubahan key ke Supabase:", key, error);
        }
    };

})();