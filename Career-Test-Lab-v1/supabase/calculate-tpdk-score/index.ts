/* =========================================================
   TALENTSCOPE — EDGE FUNCTION: CALCULATE TPDK SCORE
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ success: false, error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const body = await req.json().catch(() => ({}));
        const projectId = String(body.projectId || "").trim();
        const participantId = String(body.participantId || "").trim();
        const answers = body.answers || {};

        if (!projectId || !participantId) {
            return new Response(
                JSON.stringify({ success: false, error: "projectId & participantId wajib" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

        if (!supabaseUrl || !serviceRoleKey) {
            return new Response(
                JSON.stringify({ success: false, error: "Server config error" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
        });

        const { data: keys, error: keysError } = await supabase
            .from("assessment_keys")
            .select("question_id, correct_answer, score_value")
            .eq("assessment_code", "TPDK")
            .order("question_id", { ascending: true });

        if (keysError || !Array.isArray(keys)) {
            return new Response(
                JSON.stringify({ success: false, error: "Gagal load kunci" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        let total = 0;
        const perSubtest = { A: 0, B: 0, C: 0, D: 0 };

        const subtestBoundaries = {
            A: [0, 10],
            B: [10, 15],
            C: [15, 20],
            D: [20, 30]
        };

        keys.forEach(function (key, idx) {
            const userAnswer = String(answers[String(idx)] || "").trim().toUpperCase();
            const correctAnswer = String(key.correct_answer || "").trim().toUpperCase();

            if (userAnswer && userAnswer === correctAnswer) {
                total += (key.score_value || 1);

                for (const [subtest, [start, end]] of Object.entries(subtestBoundaries)) {
                    if (idx >= start && idx < end) {
                        perSubtest[subtest]++;
                        break;
                    }
                }
            }
        });

        const maxTotal = keys.length;
        const percentage = (total / maxTotal) * 100;
        const gScore = Math.round(100 + ((percentage - 50) / 50) * 50);

        let gCategory, gPercentile, gDesc;
        if (gScore >= 140) { gCategory = "Sangat Superior"; gPercentile = "≥ 99.6%"; gDesc = "Kemampuan penalaran jauh di atas rata-rata."; }
        else if (gScore >= 130) { gCategory = "Sangat Superior"; gPercentile = "≥ 98%"; gDesc = "Kemampuan penalaran sangat tinggi."; }
        else if (gScore >= 120) { gCategory = "Superior"; gPercentile = "91-97%"; gDesc = "Kemampuan penalaran di atas rata-rata."; }
        else if (gScore >= 110) { gCategory = "Di Atas Rata-rata"; gPercentile = "75-90%"; gDesc = "Kemampuan penalaran baik."; }
        else if (gScore >= 100) { gCategory = "Rata-rata"; gPercentile = "50-74%"; gDesc = "Kemampuan penalaran rata-rata."; }
        else if (gScore >= 90) { gCategory = "Rata-rata"; gPercentile = "25-49%"; gDesc = "Rata-rata bawah. Perlu pengembangan."; }
        else if (gScore >= 80) { gCategory = "Di Bawah Rata-rata"; gPercentile = "9-24%"; gDesc = "Di bawah rata-rata. Perlu pelatihan."; }
        else if (gScore >= 70) { gCategory = "Borderline"; gPercentile = "2-8%"; gDesc = "Borderline. Disarankan pendampingan."; }
        else { gCategory = "Rendah"; gPercentile = "< 2%"; gDesc = "Di bawah standar. Perlu intervensi."; }

        return new Response(
            JSON.stringify({
                success: true,
                total: total,
                maxTotal: maxTotal,
                perSubtest: perSubtest,
                percentage: Math.round(percentage * 100) / 100,
                gScore: gScore,
                gCategory: gCategory,
                gPercentile: gPercentile,
                gDesc: gDesc,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        return new Response(
            JSON.stringify({
                success: false,
                error: "Internal error: " + (err instanceof Error ? err.message : String(err))
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});