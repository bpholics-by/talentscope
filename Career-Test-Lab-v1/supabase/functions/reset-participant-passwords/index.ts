/* ==========================================================
   RESET PARTICIPANT PASSWORDS — SECURED v2
   ----------------------------------------------------------
   Reset password SEMUA peserta (atau sebagian) berdasarkan
   access_code mereka.
   
   SECURITY LAYERS:
   1. JWT verification (wajib login)
   2. Role check (hanya SYSTEM_ADMIN & ADMINISTRATOR)
   3. Rate limiting (maks 3x mass reset per 24 jam)
   4. Audit logging (semua aksi tercatat)
   5. Optional project filter (hanya reset peserta di project tertentu)
   6. Data masking (jangan kirim semua email ke client)
========================================================== */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

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

// Hanya SYSTEM_ADMIN & ADMINISTRATOR yang bisa mass reset
// Client Admin TIDAK boleh (terlalu berbahaya)
const ALLOWED_ROLES = ["system_admin", "administrator"];

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
// HELPER: Mask email untuk response (data leak prevention)
// ============================================================
function maskEmail(email: string): string {
    if (!email || !email.includes("@")) return "***";
    const [local, domain] = email.split("@");
    const visibleChars = Math.min(2, local.length);
    return local.substring(0, visibleChars) + "***@" + domain;
}

// ============================================================
// HELPER: Rate limit (maks 3x mass reset per 24 jam per admin)
// ============================================================
async function checkRateLimit(actorId: string): Promise<{ allowed: boolean; count: number; limit: number }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count, error } = await supabaseAdmin
        .from("audit_log")
        .select("*", { count: "exact", head: true })
        .eq("action", "reset_participant_passwords")
        .eq("actor_id", actorId)
        .gte("created_at", oneDayAgo);
    
    if (error) {
        console.warn("[rate-limit] Error:", error);
        return { allowed: true, count: 0, limit: 3 };
    }
    
    const MAX_PER_DAY = 3;
    return { 
        allowed: (count || 0) < MAX_PER_DAY, 
        count: count || 0,
        limit: MAX_PER_DAY 
    };
}

// ============================================================
// MAIN HANDLER
// ============================================================
serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    
    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }
    
    try {
        // ============================================================
        // LAYER 1: VERIFIKASI JWT
        // ============================================================
        const authHeader = req.headers.get("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.warn("[reset-participant-passwords] Missing auth header");
            return jsonResponse({ error: "Unauthorized: missing token" }, 401);
        }
        
        const token = authHeader.replace("Bearer ", "");
        
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token);
        
        if (authError || !caller) {
            console.warn("[reset-participant-passwords] Invalid token");
            return jsonResponse({ error: "Unauthorized: invalid token" }, 401);
        }
        
        console.log("[reset-participant-passwords] Caller:", caller.email);
        
        // ============================================================
        // LAYER 2: VERIFIKASI ROLE
        // ============================================================
        const callerRole = normalizeRole(caller.user_metadata?.role || "");
        
        if (!ALLOWED_ROLES.includes(callerRole)) {
            console.warn("[reset-participant-passwords] Forbidden role:", callerRole);
            
            await supabaseAdmin.from("audit_log").insert({
                action: "reset_participant_passwords_forbidden",
                actor_id: caller.id,
                actor_email: caller.email,
                actor_role: callerRole,
                metadata: { reason: "insufficient_role" },
                created_at: new Date().toISOString(),
            });
            
            return jsonResponse({ error: "Forbidden: insufficient permissions" }, 403);
        }
        
        console.log("[reset-participant-passwords] Authorized:", callerRole);
        
        // ============================================================
        // LAYER 3: RATE LIMITING
        // ============================================================
        const rateCheck = await checkRateLimit(caller.id);
        
        if (!rateCheck.allowed) {
            console.warn("[reset-participant-passwords] Rate limit exceeded");
            return jsonResponse({ 
                error: `Rate limit exceeded: maksimal ${rateCheck.limit} mass reset per 24 jam`,
                current_count: rateCheck.count,
                limit: rateCheck.limit
            }, 429);
        }
        
        console.log("[reset-participant-passwords] Rate OK:", rateCheck.count, "/", rateCheck.limit);
        
        // ============================================================
        // PARSE BODY (optional project filter)
        // ============================================================
        let body: any = {};
        try {
            body = await req.json();
        } catch (e) {
            // Body kosong, OK
        }
        
        const filterProjectId = body?.project_id || null;
        const dryRun = body?.dry_run === true; // Preview mode
        
        console.log("[reset-participant-passwords] Filter:", { filterProjectId, dryRun });
        
        // ============================================================
        // LAYER 4: QUERY PARTICIPANTS (dengan optional project filter)
        // ============================================================
        let query = supabaseAdmin
            .from("participants")
            .select("id, name, email, access_code, auth_user_id, project_id")
            .not("auth_user_id", "is", null)
            .not("access_code", "is", null);
        
        if (filterProjectId) {
            query = query.eq("project_id", filterProjectId);
        }
        
        const { data: participants, error: pErr } = await query;
        
        if (pErr) {
            return jsonResponse({ error: "Query gagal: " + pErr.message }, 500);
        }
        
        console.log("[reset-participant-passwords] Total peserta:", participants.length);
        
        // ============================================================
        // DRY RUN: Preview saja, tidak eksekusi
        // ============================================================
        if (dryRun) {
            return jsonResponse({
                success: true,
                dry_run: true,
                total: participants.length,
                preview: participants.map(p => ({
                    name: p.name,
                    email: maskEmail(p.email),  // Mask email
                    project_id: p.project_id,
                    will_reset: true
                })),
                message: "Ini adalah preview. Kirim ulang dengan dry_run=false untuk eksekusi."
            });
        }
        
        // ============================================================
        // EKSEKUSI: Reset semua password
        // ============================================================
        let success = 0;
        let failed = 0;
        const errorSamples: any[] = [];
        
        for (const p of participants) {
            try {
                const { error } = await supabaseAdmin.auth.admin.updateUserById(
                    p.auth_user_id,
                    { password: p.access_code }
                );
                
                if (error) {
                    failed++;
                    if (errorSamples.length < 5) {
                        errorSamples.push({
                            email: maskEmail(p.email),
                            error: error.message
                        });
                    }
                } else {
                    success++;
                }
            } catch (err) {
                failed++;
                if (errorSamples.length < 5) {
                    errorSamples.push({
                        email: maskEmail(p.email),
                        error: String(err)
                    });
                }
            }
        }
        
        // ============================================================
        // AUDIT LOG: Catat aksi berhasil
        // ============================================================
        await supabaseAdmin.from("audit_log").insert({
            action: "reset_participant_passwords",
            actor_id: caller.id,
            actor_email: caller.email,
            actor_role: callerRole,
            target_email: null, // mass action
            metadata: {
                total: participants.length,
                success: success,
                failed: failed,
                filter_project_id: filterProjectId,
                error_samples: errorSamples
            },
            created_at: new Date().toISOString(),
        });
        
        console.log("[reset-participant-passwords] ✅ Done:", success, "/", participants.length);
        
        return jsonResponse({
            success: true,
            total: participants.length,
            updated: success,
            failed: failed,
            filter_project_id: filterProjectId,
            // JANGAN return semua results (data leak prevention)
            error_samples: errorSamples
        });
        
    } catch (error) {
        console.error("[reset-participant-passwords] Exception:", error);
        return jsonResponse({ error: "Internal server error" }, 500);
    }
});