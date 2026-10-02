/* ==========================================================
   GENERATE CREDENTIALS — SECURED v2
   ==========================================================
   
   SECURITY LAYERS:
   1. JWT verification
   2. Role check (canonical, bukan .includes)
   3. Rate limit (maks 20 user/jam per admin)
   4. Audit logging
   5. Input validation (email, role, name)
   6. Project ownership check (Client Admin hanya untuk project sendiri)
   7. Duplicate email check
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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
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
    if (role === "client_user" || role === "clientuser") return "client_user";
    return role;
}

// Role yang boleh create user
const ALLOWED_CREATOR_ROLES = ["system_admin", "administrator", "client_admin"];

// Role yang boleh di-create (whitelist)
const ALLOWED_TARGET_ROLES = ["client_user", "client_admin", "asesor", "peserta"];

// Rate limit
const MAX_USERS_PER_HOUR = 20;

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
// HELPER: Generate secure password
// ============================================================
function generateSecurePassword(length = 12): string {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length];
    }
    return password;
}

// ============================================================
// HELPER: Validate email
// ============================================================
function isValidEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

// ============================================================
// HELPER: Username to email
// ============================================================
function usernameToEmail(username: string): string {
    const clean = String(username).toLowerCase().replace(/[^a-z0-9._-]/g, "");
    return `${clean}@talentscope.local`;
}

// ============================================================
// HELPER: Rate limit
// ============================================================
async function checkRateLimit(actorId: string): Promise<{ allowed: boolean; count: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count, error } = await supabaseAdmin
        .from("audit_log")
        .select("*", { count: "exact", head: true })
        .eq("action", "generate_credentials")
        .eq("actor_id", actorId)
        .gte("created_at", oneHourAgo);
    
    if (error) {
        return { allowed: true, count: 0 };
    }
    
    return { allowed: (count || 0) < MAX_USERS_PER_HOUR, count: count || 0 };
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
        // LAYER 1: JWT VERIFICATION
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
        
        console.log("[generate-credentials] Caller:", caller.email);
        
        // ============================================================
        // LAYER 2: ROLE CHECK (CANONICAL)
        // ============================================================
        const callerRole = normalizeRole(caller.user_metadata?.role || "");
        
        if (!ALLOWED_CREATOR_ROLES.includes(callerRole)) {
            await supabaseAdmin.from("audit_log").insert({
                action: "generate_credentials_forbidden",
                actor_id: caller.id,
                actor_email: caller.email,
                actor_role: callerRole,
                metadata: { reason: "insufficient_role" },
                created_at: new Date().toISOString(),
            });
            
            return jsonResponse({ error: "Forbidden: insufficient permissions" }, 403);
        }
        
        // ============================================================
        // LAYER 3: RATE LIMIT
        // ============================================================
        const rateCheck = await checkRateLimit(caller.id);
        if (!rateCheck.allowed) {
            return jsonResponse({ 
                error: `Rate limit exceeded: maksimal ${MAX_USERS_PER_HOUR} user/jam`,
                current_count: rateCheck.count
            }, 429);
        }
        
        // ============================================================
        // PARSE & VALIDATE INPUT
        // ============================================================
        const body = await req.json();
        const {
            username,
            email,
            password,
            role,
            name,
            project_id,
            user_id,
            ts_user_data
        } = body;
        
        // Validasi role target
        const targetRole = normalizeRole(role || "client_user");
        if (!ALLOWED_TARGET_ROLES.includes(targetRole)) {
            return jsonResponse({ 
                error: `Invalid role: ${role}. Allowed: ${ALLOWED_TARGET_ROLES.join(", ")}` 
            }, 400);
        }
        
        // Validasi: Client Admin hanya boleh create user untuk project mereka sendiri
        if (callerRole === "client_admin" && project_id) {
            const { data: membership } = await supabaseAdmin
                .from("project_members")
                .select("project_id")
                .eq("auth_user_id", caller.id)
                .eq("project_id", project_id)
                .maybeSingle();
            
            if (!membership) {
                await supabaseAdmin.from("audit_log").insert({
                    action: "generate_credentials_forbidden",
                    actor_id: caller.id,
                    actor_email: caller.email,
                    actor_role: callerRole,
                    metadata: { reason: "project_not_owned", project_id },
                    created_at: new Date().toISOString(),
                });
                
                return jsonResponse({ 
                    error: "Forbidden: Anda hanya bisa create user untuk project yang Anda miliki" 
                }, 403);
            }
        }
        
        // Generate final values
        const finalUsername = username || `user-${Date.now()}`;
        const finalEmail = email || usernameToEmail(finalUsername);
        const finalPassword = password || generateSecurePassword(12);
        const finalName = name || finalUsername;
        
        // Validasi email
        if (!isValidEmail(finalEmail)) {
            return jsonResponse({ error: "Email tidak valid: " + finalEmail }, 400);
        }
        
        // Cek duplikat email di auth.users
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const emailExists = existingUsers?.users?.some(u => u.email === finalEmail);
        if (emailExists) {
            return jsonResponse({ error: "Email sudah terdaftar: " + finalEmail }, 409);
        }
        
        console.log("[generate-credentials] Creating user:", finalEmail);
        
        // ============================================================
        // CREATE AUTH USER
        // ============================================================
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: finalEmail,
            password: finalPassword,
            email_confirm: true,
            user_metadata: {
                role: targetRole,
                name: finalName,
                username: finalUsername,
                source: "generate-credentials",
                company: ts_user_data?.projectName || "",
                projectId: project_id || "",
                project_id: project_id || ""
            }
        });
        
        if (createError) {
            console.error("[generate-credentials] Auth error:", createError);
            return jsonResponse({ error: "Gagal buat user auth: " + createError.message }, 400);
        }
        
        const authUserId = authData.user.id;
        
        // ============================================================
        // INSERT ts_users (kalau user_id disediakan)
        // ============================================================
        let tsUserResult = null;
        if (user_id) {
            const tsUserPayload = {
                id: user_id,
                data: {
                    ...ts_user_data,
                    auth_user_id: authUserId,
                    username: finalUsername,
                    email: finalEmail,
                    role: targetRole,
                    name: finalName,
                    source: "generate-credentials",
                    company: ts_user_data?.projectName || "",
                    projectId: project_id || "",
                    project_id: project_id || ""
                },
                updated_at: new Date().toISOString()
            };
            
            const { data: tsData, error: tsError } = await supabaseAdmin
                .from("ts_users")
                .upsert(tsUserPayload, { onConflict: "id" })
                .select();
            
            if (tsError) {
                console.error("[generate-credentials] ts_users error:", tsError);
                // ROLLBACK
                await supabaseAdmin.auth.admin.deleteUser(authUserId);
                return jsonResponse({ error: "Gagal insert ts_users: " + tsError.message }, 400);
            }
            tsUserResult = tsData;
        }
        
        // ============================================================
        // INSERT project_members
        // ============================================================
        let projectMemberResult = null;
        if (project_id && user_id) {
            let memberRole = "clientuser";
            if (targetRole === "client_admin") memberRole = "clientadmin";
            else if (targetRole === "asesor") memberRole = "asesor";
            else if (targetRole === "peserta") memberRole = "peserta";
            
            const { data: pmData, error: pmError } = await supabaseAdmin
                .from("project_members")
                .upsert({
                    auth_user_id: authUserId,
                    user_id: user_id,
                    project_id: project_id,
                    role: memberRole
                }, { onConflict: "auth_user_id,project_id" })
                .select();
            
            if (pmError) {
                console.error("[generate-credentials] project_members error:", pmError);
                // Tidak rollback — user utama sudah dibuat
            } else {
                projectMemberResult = pmData;
            }
        }
        
        // ============================================================
        // AUDIT LOG
        // ============================================================
        await supabaseAdmin.from("audit_log").insert({
            action: "generate_credentials",
            actor_id: caller.id,
            actor_email: caller.email,
            actor_role: callerRole,
            target_user_id: authUserId,
            target_email: finalEmail,
            metadata: {
                target_role: targetRole,
                project_id: project_id || null,
                has_ts_user: !!user_id,
            },
            created_at: new Date().toISOString(),
        });
        
        console.log("[generate-credentials] ✅ Success:", finalEmail);
        
        return jsonResponse({
            success: true,
            credentials: {
                username: finalUsername,
                email: finalEmail,
                password: finalPassword,
                role: targetRole,
                name: finalName
            },
            auth_user_id: authUserId
        });
        
    } catch (error) {
        console.error("[generate-credentials] Exception:", error);
        return jsonResponse({ error: "Internal server error" }, 500);
    }
});