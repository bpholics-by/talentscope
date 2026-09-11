/* =========================================================
   SJT CATALOG SEED — LSJT + MSJT
   Auto-register LSJT dan MSJT ke tabel `assessments`.
========================================================= */

(function(){
    "use strict";

    if (typeof supabaseClient === "undefined") {
        console.warn("[SJT Seed] supabaseClient tidak tersedia");
        return;
    }

    const SJT_RECORDS = [
        {
            assessment_code: "LSJT",
            name: "Leadership Situational Judgment Test",
            assessment_name: "Leadership Situational Judgment Test",
            category: "Personality",
            description: "Mengukur kecenderungan gaya kepemimpinan (Otoriter, Demokratis, Laissez-Faire, Situasional) melalui 28 situasi kerja.",
            duration: 30,
            total_questions: 28,
            status: "Active",
            raw_data: {
                route: "sjt_leadership.html",
                dimensions: ["Otoriter", "Demokratis", "Laissez-Faire", "Situasional"],
                format: "MOST-LEAST",
                scoring: "ipsative"
            }
        },
        {
            assessment_code: "MSJT",
            name: "Managerial Situational Judgment Test",
            assessment_name: "Managerial Situational Judgment Test",
            category: "Behavior",
            description: "Mengukur 8 kompetensi manajerial: Planning & Organizing, Strategic Thinking, Decision Making, Mindful of Cost & Efficiency, Controlling, Conflict Resolution, People Management, Business Acumen.",
            duration: 30,
            total_questions: 32,
            status: "Active",
            raw_data: {
                route: "msjt_managerial.html",
                dimensions: ["Planning & Organizing", "Strategic Thinking", "Decision Making", "Mindful of Cost & Efficiency", "Controlling", "Conflict Resolution", "People Management", "Business Acumen"],
                format: "MOST-LEAST",
                scoring: "ipsative"
            }
        }
    ];

    async function seedSJT() {
        try {
            for (const record of SJT_RECORDS) {
                const { data: existing, error: selectErr } = await supabaseClient
                    .from("assessments")
                    .select("id, assessment_code")
                    .eq("assessment_code", record.assessment_code)
                    .limit(1);

                if (selectErr) {
                    console.warn("[SJT Seed] Gagal cek " + record.assessment_code + ":", selectErr.message);
                    continue;
                }

                if (Array.isArray(existing) && existing.length > 0) {
                    console.log("[SJT Seed] " + record.assessment_code + " sudah terdaftar.");
                    continue;
                }

                const { data, error } = await supabaseClient
                    .from("assessments")
                    .insert([record])
                    .select();

                if (error) {
                    console.error("[SJT Seed] Gagal insert " + record.assessment_code + ":", error.message);
                } else {
                    console.log("[SJT Seed] ✓ " + record.assessment_code + " ditambahkan:", data);
                }
            }
        } catch (err) {
            console.error("[SJT Seed] Unexpected error:", err);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", seedSJT);
    } else {
        seedSJT();
    }
})();