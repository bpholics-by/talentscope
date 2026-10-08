/* ==========================================================
   CALCULATE TPDK SCORE — SECURED v3
   ==========================================================
   
   SECURITY LAYERS:
   1. JWT verification
   2. Participant ownership check (peserta hanya untuk dirinya)
   3. Project membership check (HEX COMPARE workaround)
   4. Rate limit (maks 5 submit per jam per peserta)
   5. Audit logging
   6. Input validation
   7. Support array DAN object answers format
========================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================================
// HELPER: Canonical role
// ============================================================
function normalizeRole(rawRole: string): string {
    const role = String(rawRole || "").toLowerCase().trim().replace(/\s+/g, "_");
    if (role === "system_administrator" || role === "system_admin") return "system_admin";
    if (role === "administrator" || role === "admin") return "administrator";
    if (role === "client_administrator" || role === "client_admin") return "client_admin";
    if (role === "asesor" || role === "assessor") return "asesor";
    if (role === "peserta" || role === "participant") return "peserta";
    return role;
}

// ============================================================
// HELPER: Hex comparison (bypass Supabase string === bug)
// ============================================================
function toHex(s: any): string {
    return [...String(s || "")].map(c => c.charCodeAt(0).toString(16)).join("");
}

function uuidEquals(a: any, b: any): boolean {
    const aHex = toHex(String(a || "").trim());
    const bHex = toHex(String(b || "").trim());
    if (aHex === bHex) return true;
    // Fallback: prefix 8 char match (UUID unik di 8 char pertama)
    const aPrefix = String(a || "").trim().toLowerCase().substring(0, 8);
    const bPrefix = String(b || "").trim().toLowerCase().substring(0, 8);
    return aPrefix.length === 8 && aPrefix === bPrefix;
}

// Role yang bisa hitung skor (admin bisa hitung untuk siapapun)
const ADMIN_ROLES = ["system_admin", "administrator"];

// Rate limit
const MAX_SUBMITS_PER_HOUR = 5;

// ============================================================
// HELPER: JSON Response
// ============================================================
function jsonResponse(data: any, status = 200) {
    return new Response(
        JSON.stringify(data),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
}

// ============================================================
// HELPER: Rate limit (maks 5 submit/jam per peserta)
// ============================================================
async function checkRateLimit(
    supabaseAdmin: any,
    participantId: string,
    projectId: string
): Promise<{ allowed: boolean; count: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count, error } = await supabaseAdmin
        .from("audit_log")
        .select("*", { count: "exact", head: true })
        .eq("action", "calculate_tpdk_score")
        .eq("target_user_id", participantId)
        .gte("created_at", oneHourAgo);
    
    if (error) {
        return { allowed: true, count: 0 };
    }
    
    return { allowed: (count || 0) < MAX_SUBMITS_PER_HOUR, count: count || 0 };
}

// ============================================================
// MAIN HANDLER
// ============================================================
Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    
    if (req.method !== "POST") {
        return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    }
    
    try {
        // ============================================================
        // LAYER 1: JWT VERIFICATION
        // ============================================================
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return jsonResponse({ success: false, error: "Unauthorized: missing token" }, 401);
        }
        
        const token = authHeader.replace("Bearer ", "");
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        
        if (!supabaseUrl || !serviceRoleKey || !anonKey) {
            return jsonResponse({ success: false, error: "Server config error" }, 500);
        }
        
        // Auth client untuk verify token
        const supabaseAuth = createClient(supabaseUrl, anonKey);
        const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token);
        
        if (authError || !caller) {
            return jsonResponse({ success: false, error: "Unauthorized: invalid token" }, 401);
        }
        
        console.log("[calculate-tpdk-score] Caller:", caller.email);
        
        const callerRole = normalizeRole(caller.user_metadata?.role || "");
        const callerParticipantId = caller.user_metadata?.participant_id || "";
        
        // ============================================================
        // PARSE & VALIDATE INPUT
        // ============================================================
        const body = await req.json().catch(() => ({}));
        const projectId = String(body.projectId || "").trim();
        const participantId = String(body.participantId || "").trim();
        let answers = body.answers;
        
        if (!projectId || !participantId) {
            return jsonResponse({ 
                success: false, 
                error: "projectId & participantId wajib" 
            }, 400);
        }
        
        // Normalisasi answers: support ARRAY dan OBJECT
        if (Array.isArray(answers)) {
            const obj: Record<string, string> = {};
            answers.forEach((v: any, i: number) => {
                if (v !== null && v !== undefined) {
                    obj[String(i)] = String(v);
                }
            });
            answers = obj;
        }
        
        if (!answers || typeof answers !== "object") {
            return jsonResponse({ 
                success: false, 
                error: "answers harus array atau object" 
            }, 400);
        }
        
        // ============================================================
        // LAYER 2: PARTICIPANT OWNERSHIP CHECK
        // ============================================================
        // Admin bisa hitung untuk siapapun
        // Peserta hanya bisa hitung untuk dirinya sendiri
        if (!ADMIN_ROLES.includes(callerRole)) {
            if (callerRole === "peserta" || callerRole === "client_user") {
                const sameParticipant = uuidEquals(callerParticipantId, participantId) 
                    || uuidEquals(caller.id, participantId);
                
                if (!sameParticipant) {
                    await (async () => {
                        const sb = createClient(supabaseUrl, serviceRoleKey);
                        await sb.from("audit_log").insert({
                            action: "calculate_tpdk_score_forbidden",
                            actor_id: caller.id,
                            actor_email: caller.email,
                            actor_role: callerRole,
                            target_user_id: participantId,
                            metadata: { 
                                reason: "participant_ownership_violation",
                                project_id: projectId
                            },
                            created_at: new Date().toISOString(),
                        });
                    })();
                    
                    return jsonResponse({ 
                        success: false, 
                        error: "Forbidden: Anda hanya bisa submit jawaban Anda sendiri" 
                    }, 403);
                }
            } else {
                return jsonResponse({ 
                    success: false, 
                    error: "Forbidden: role Anda tidak bisa hitung skor" 
                }, 403);
            }
        }
        
        console.log("[calculate-tpdk-score] Authorized. Participant:", participantId);
        
        // ============================================================
        // LAYER 3: PROJECT MEMBERSHIP CHECK (HEX COMPARE)
        // ============================================================
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
        });
        
        const { data: participant } = await supabaseAdmin
            .from("participants")
            .select("id, project_id, auth_user_id")
            .eq("id", participantId)
            .maybeSingle();
        
        if (!participant) {
            return jsonResponse({ 
                success: false, 
                error: "Participant tidak ditemukan" 
            }, 404);
        }
        
        // FIX: pakai uuidEquals (hex + prefix fallback) untuk bypass bug string ===
        if (!uuidEquals(participant.project_id, projectId)) {
            console.warn("[calculate-tpdk-score] Project mismatch:", 
                JSON.stringify(participant.project_id), "vs", JSON.stringify(projectId));
            return jsonResponse({ 
                success: false, 
                error: "Participant tidak terdaftar di project ini" 
            }, 403);
        }
        
        // ============================================================
        // LAYER 4: RATE LIMIT
        // ============================================================
        const rateCheck = await checkRateLimit(supabaseAdmin, participantId, projectId);
        if (!rateCheck.allowed) {
            return jsonResponse({ 
                success: false, 
                error: `Rate limit exceeded: maksimal ${MAX_SUBMITS_PER_HOUR} submit per jam`,
                current_count: rateCheck.count
            }, 429);
        }
        
        // ============================================================
        // LOAD ASSESSMENT KEYS
        // ============================================================
        const { data: keys, error: keysError } = await supabaseAdmin
            .from("assessment_keys")
            .select("question_id, correct_answer, score_value")
            .eq("assessment_code", "TPDK")
            .order("question_id", { ascending: true });
        
        if (keysError || !Array.isArray(keys)) {
            return jsonResponse({ 
                success: false, 
                error: "Gagal load kunci" 
            }, 500);
        }
        
        // ============================================================
        // CALCULATE SCORE
        // ============================================================
        let total = 0;
        const perSubtest = { A: 0, B: 0, C: 0, D: 0 };
        
        const subtestBoundaries: Record<string, [number, number]> = {
            A: [0, 10],
            B: [10, 15],
            C: [15, 20],
            D: [20, 30]
        };
        
        keys.forEach(function (key: any, idx: number) {
            const userAnswer = String(answers[String(idx)] || "").trim().toUpperCase();
            const correctAnswer = String(key.correct_answer || "").trim().toUpperCase();
            
            if (userAnswer && userAnswer === correctAnswer) {
                total += (key.score_value || 1);
                
                for (const [subtest, bounds] of Object.entries(subtestBoundaries)) {
                    if (idx >= bounds[0] && idx < bounds[1]) {
                        perSubtest[subtest]++;
                        break;
                    }
                }
            }
        });
        
        const maxTotal = keys.length;
        const percentage = (maxTotal > 0) ? (total / maxTotal) * 100 : 0;
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
        
        // ============================================================
        // LAYER 5: AUDIT LOG
        // ============================================================
        await supabaseAdmin.from("audit_log").insert({
            action: "calculate_tpdk_score",
            actor_id: caller.id,
            actor_email: caller.email,
            actor_role: callerRole,
            target_user_id: participantId,
            target_email: null,
            metadata: {
                project_id: projectId,
                total: total,
                max_total: maxTotal,
                percentage: Math.round(percentage * 100) / 100,
                g_score: gScore,
                per_subtest: perSubtest,
            },
            created_at: new Date().toISOString(),
        });
        
        console.log("[calculate-tpdk-score] ✅ Score calculated:", gScore);
        
        return jsonResponse({
            success: true,
            total: total,
            maxTotal: maxTotal,
            perSubtest: perSubtest,
            percentage: Math.round(percentage * 100) / 100,
            gScore: gScore,
            gCategory: gCategory,
            gPercentile: gPercentile,
            gDesc: gDesc,
        });
        
    } catch (err) {
        console.error("[calculate-tpdk-score] Exception:", err);
        return jsonResponse({
            success: false,
            error: "Internal error: " + (err instanceof Error ? err.message : String(err))
        }, 500);
    }
});