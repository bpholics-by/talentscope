/* ==========================================================
   MIGRATE USERS TO SUPABASE AUTH — SECURED v2
   ----------------------------------------------------------
   Migrasi user dari ts_users dan participants ke auth.users.
   
   SECURITY LAYERS:
   1. JWT verification (wajib login)
   2. Role check (SYSTEM_ADMIN ONLY — paling ketat)
   3. Migration kill-switch (env MIGRATION_ENABLED)
   4. Rate limit (1x per 24 jam per admin)
   5. Audit logging
   6. Data masking (jangan return semua email)
   7. Confirmation flag (wajib set `confirm: true` untuk eksekusi)
   
   CARA DISABLE SETELAH MIGRASI:
   Set env MIGRATION_ENABLED=false di Supabase Secrets
========================================================== */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// KILL SWITCH: Set MIGRATION_ENABLED=true hanya saat migrasi awal
// Setelah migrasi selesai, set ke "false" untuk disable function
const MIGRATION_ENABLED = (Deno.env.get("MIGRATION_ENABLED") || "false").toLowerCase() === "true";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
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

// HANYA system_admin yang boleh migrasi
const ALLOWED_ROLES = ["system_admin"];

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
// HELPER: Mask email
// ============================================================
function maskEmail(email: string): string {
    if (!email || !email.includes("@")) return "***";
    const [local, domain] = email.split("@");
    return local.substring(0, 2) + "***@" + domain;
}

// ============================================================
// HELPER: Rate limit (maks 1x per 24 jam)
// ============================================================
async function checkRateLimit(actorId: string): Promise<{ allowed: boolean; lastRun: string | null }> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabaseAdmin
        .from("audit_log")
        .select("created_at")
        .eq("action", "migrate_users_to_auth")
        .eq("actor_id", actorId)
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false })
        .limit(1);
    
    if (error) {
        console.warn("[rate-limit] Error:", error);
        return { allowed: true, lastRun: null };
    }
    
    if (data && data.length > 0) {
        return { allowed: false, lastRun: data[0].created_at };
    }
    
    return { allowed: true, lastRun: null };
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
        // LAYER 0: KILL SWITCH
        // ============================================================
        if (!MIGRATION_ENABLED) {
            console.warn("[migrate-users] Function disabled via MIGRATION_ENABLED env");
            return jsonResponse({ 
                error: "Migration is disabled",
                message: "Function ini sudah di-disable karena migrasi telah selesai. Set MIGRATION_ENABLED=true di Supabase Secrets untuk mengaktifkan kembali."
            }, 403);
        }
        
        // ============================================================
        // LAYER 1: VERIFIKASI JWT
        // ============================================================
        const authHeader = req.headers.get("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return jsonResponse({ error: "Unauthorized: missing token" }, 401);
        }
        
        const token = authHeader.replace("Bearer ", "");
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token);
        
        if (authError || !caller) {
            return jsonResponse({ error: "Unauthorized: invalid token" }, 401);
        }
        
        console.log("[migrate-users] Caller:", caller.email);
        
        // ============================================================
        // LAYER 2: VERIFIKASI ROLE (SYSTEM_ADMIN ONLY)
        // ============================================================
        const callerRole = normalizeRole(caller.user_metadata?.role || "");
        
        if (!ALLOWED_ROLES.includes(callerRole)) {
            console.warn("[migrate-users] Forbidden role:", callerRole);
            
            await supabaseAdmin.from("audit_log").insert({
                action: "migrate_users_to_auth_forbidden",
                actor_id: caller.id,
                actor_email: caller.email,
                actor_role: callerRole,
                metadata: { reason: "insufficient_role" },
                created_at: new Date().toISOString(),
            });
            
            return jsonResponse({ error: "Forbidden: only SYSTEM_ADMIN can migrate" }, 403);
        }
        
        // ============================================================
        // LAYER 3: PARSE & VALIDASI BODY
        // ============================================================
        const body = await req.json().catch(() => ({}));
        const mode = body.mode || "dry-run";
        const limit = Math.min(body.limit || 50, 100); // Maks 100 per batch
        const confirm = body.confirm === true; // Wajib true untuk eksekusi
        
        // Validasi mode
        if (!["dry-run", "migrate"].includes(mode)) {
            return jsonResponse({ 
                error: "Invalid mode. Use 'dry-run' or 'migrate'" 
            }, 400);
        }
        
        // Eksekusi butuh confirm
        if (mode === "migrate" && !confirm) {
            return jsonResponse({ 
                error: "Migration requires confirm=true",
                message: "Set { \"confirm\": true, \"mode\": \"migrate\" } untuk eksekusi"
            }, 400);
        }
        
        console.log(`[migrate-users] Mode: ${mode}, Limit: ${limit}, Confirm: ${confirm}`);
        
        // ============================================================
        // LAYER 4: RATE LIMITING (migrate only)
        // ============================================================
        if (mode === "migrate") {
            const rateCheck = await checkRateLimit(caller.id);
            
            if (!rateCheck.allowed) {
                return jsonResponse({ 
                    error: "Rate limit exceeded: maksimal 1x migrasi per 24 jam",
                    last_run: rateCheck.lastRun
                }, 429);
            }
        }
        
        // ============================================================
        // STEP 1: Ambil user dari ts_users
        // ============================================================
        const { data: tsUsers, error: tsErr } = await supabaseAdmin
            .from("ts_users")
            .select("id, data, auth_user_id")
            .is("auth_user_id", null)
            .limit(limit);
        
        if (tsErr) throw new Error(`Query ts_users gagal: ${tsErr.message}`);
        
        // ============================================================
        // STEP 2: Ambil peserta dari participants
        // ============================================================
        const { data: participants, error: partErr } = await supabaseAdmin
            .from("participants")
            .select("id, name, email, password_hash, access_code, auth_user_id")
            .is("auth_user_id", null)
            .not("password_hash", "is", null)
            .not("email", "is", null)
            .limit(limit);
        
        if (partErr) throw new Error(`Query participants gagal: ${partErr.message}`);
        
        console.log(`[migrate-users] Found: ${tsUsers.length} ts_users, ${participants.length} participants`);
        
        // ============================================================
        // STEP 3: Summary (data masking)
        // ============================================================
        const summary = {
            mode,
            migration_enabled: MIGRATION_ENABLED,
            ts_users: {
                total: tsUsers.length,
                migrated: 0,
                failed: 0,
                skipped: 0,
                errors_sample: [] as any[],  // Hanya sample errors
            },
            participants: {
                total: participants.length,
                migrated: 0,
                failed: 0,
                skipped: 0,
                errors_sample: [] as any[],
            },
        };
        
        // ============================================================
        // DRY RUN: Preview saja
        // ============================================================
        if (mode === "dry-run") {
            return jsonResponse({
                ...summary,
                dry_run: true,
                message: "Ini preview. Kirim dengan { \"mode\": \"migrate\", \"confirm\": true } untuk eksekusi.",
                preview: {
                    ts_users: tsUsers.map(u => ({
                        id: u.id,
                        email: maskEmail(u.data?.email || ""),
                        role: u.data?.role,
                    })),
                    participants: participants.map(p => ({
                        id: p.id,
                        email: maskEmail(p.email),
                        name: p.name,
                    })),
                }
            });
        }
        
        // ============================================================
        // MIGRATE: ts_users
        // ============================================================
        for (const user of tsUsers) {
            try {
                const userData = user.data || {};
                const email = userData.email;
                const password = userData.password;
                const role = userData.role;
                const username = userData.username;
                const name = userData.name || userData.fullName;
                
                if (!email) {
                    summary.ts_users.skipped++;
                    continue;
                }
                
                const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: password || undefined,
                    email_confirm: true,
                    user_metadata: {
                        username: username,
                        role: role,
                        name: name,
                        old_user_id: user.id,
                        source: "ts_users",
                    },
                });
                
                if (authErr) {
                    summary.ts_users.failed++;
                    if (summary.ts_users.errors_sample.length < 5) {
                        summary.ts_users.errors_sample.push({
                            id: user.id,
                            email: maskEmail(email),
                            error: authErr.message,
                        });
                    }
                    continue;
                }
                
                const { error: updateErr } = await supabaseAdmin
                    .from("ts_users")
                    .update({ auth_user_id: authUser.user.id })
                    .eq("id", user.id);
                
                if (updateErr) {
                    summary.ts_users.failed++;
                    if (summary.ts_users.errors_sample.length < 5) {
                        summary.ts_users.errors_sample.push({
                            id: user.id,
                            email: maskEmail(email),
                            error: updateErr.message,
                        });
                    }
                    continue;
                }
                
                summary.ts_users.migrated++;
            } catch (e) {
                summary.ts_users.failed++;
                if (summary.ts_users.errors_sample.length < 5) {
                    summary.ts_users.errors_sample.push({
                        id: user.id,
                        error: String(e),
                    });
                }
            }
        }
        
        // ============================================================
        // MIGRATE: participants
        // ============================================================
        for (const p of participants) {
            try {
                const email = p.email;
                const password = p.password_hash;
                const name = p.name;
                
                if (!email) {
                    summary.participants.skipped++;
                    continue;
                }
                
                const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: password || undefined,
                    email_confirm: true,
                    user_metadata: {
                        name: name,
                        role: "Peserta",
                        old_participant_id: p.id,
                        access_code: p.access_code,
                        source: "participants",
                    },
                });
                
                if (authErr) {
                    summary.participants.failed++;
                    if (summary.participants.errors_sample.length < 5) {
                        summary.participants.errors_sample.push({
                            id: p.id,
                            email: maskEmail(email),
                            error: authErr.message,
                        });
                    }
                    continue;
                }
                
                const { error: updateErr } = await supabaseAdmin
                    .from("participants")
                    .update({ auth_user_id: authUser.user.id })
                    .eq("id", p.id);
                
                if (updateErr) {
                    summary.participants.failed++;
                    continue;
                }
                
                summary.participants.migrated++;
            } catch (e) {
                summary.participants.failed++;
                if (summary.participants.errors_sample.length < 5) {
                    summary.participants.errors_sample.push({
                        id: p.id,
                        error: String(e),
                    });
                }
            }
        }
        
        // ============================================================
        // AUDIT LOG
        // ============================================================
        await supabaseAdmin.from("audit_log").insert({
            action: "migrate_users_to_auth",
            actor_id: caller.id,
            actor_email: caller.email,
            actor_role: callerRole,
            metadata: {
                ts_users_migrated: summary.ts_users.migrated,
                ts_users_failed: summary.ts_users.failed,
                participants_migrated: summary.participants.migrated,
                participants_failed: summary.participants.failed,
                total_processed: tsUsers.length + participants.length,
            },
            created_at: new Date().toISOString(),
        });
        
        console.log("[migrate-users] ✅ Done");
        
        return jsonResponse(summary);
        
    } catch (error) {
        console.error("[migrate-users] Exception:", error);
        return jsonResponse({ error: "Internal server error" }, 500);
    }
});