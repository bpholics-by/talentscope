/* ==========================================================
   RESET USER PASSWORD — SECURED v2
   ----------------------------------------------------------
   Reset password user Supabase Auth by email atau auth_user_id.
   
   SECURITY LAYERS:
   1. JWT verification (wajib login)
   2. Role check (hanya SYSTEM_ADMIN & ADMINISTRATOR)
   3. Audit logging (semua aksi tercatat)
   4. Rate limiting (maks 10 reset/jam per admin)
========================================================== */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Service role client untuk operasi admin
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // TODO: Ganti dengan domain spesifik untuk production
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================================
// HELPER: Canonical role check
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

const ALLOWED_ROLES = ["system_admin", "administrator"];

// ============================================================
// HELPER: Response JSON
// ============================================================
function jsonResponse(data: any, status = 200) {
    return new Response(
        JSON.stringify(data),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
}

// ============================================================
// HELPER: Rate limiting (maks 10 reset/jam per admin)
// ============================================================
async function checkRateLimit(actorId: string): Promise<{ allowed: boolean; count: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count, error } = await supabaseAdmin
        .from("audit_log")
        .select("*", { count: "exact", head: true })
        .eq("action", "reset_user_password")
        .eq("actor_id", actorId)
        .gte("created_at", oneHourAgo);
    
    if (error) {
        console.warn("[rate-limit] Error:", error);
        return { allowed: true, count: 0 }; // Fail open, jangan block kalau error
    }
    
    const MAX_PER_HOUR = 10;
    return { allowed: (count || 0) < MAX_PER_HOUR, count: count || 0 };
}

// ============================================================
// MAIN HANDLER
// ============================================================
serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    
    // Hanya izinkan POST
    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }
    
    try {
        // ============================================================
        // LAYER 1: VERIFIKASI JWT
        // ============================================================
        const authHeader = req.headers.get("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.warn("[reset-user-password] Missing/invalid auth header");
            return jsonResponse({ error: "Unauthorized: missing token" }, 401);
        }
        
        const token = authHeader.replace("Bearer ", "");
        
        // Verifikasi token dengan anon client
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token);
        
        if (authError || !caller) {
            console.warn("[reset-user-password] Invalid token:", authError?.message);
            return jsonResponse({ error: "Unauthorized: invalid token" }, 401);
        }
        
        console.log("[reset-user-password] Caller:", caller.email, "ID:", caller.id);
        
        // ============================================================
        // LAYER 2: VERIFIKASI ROLE
        // ============================================================
        const callerRole = normalizeRole(caller.user_metadata?.role || "");
        
        if (!ALLOWED_ROLES.includes(callerRole)) {
            console.warn("[reset-user-password] Forbidden role:", callerRole);
            
            // Log percobaan akses ilegal
            await supabaseAdmin.from("audit_log").insert({
                action: "reset_user_password_forbidden",
                actor_id: caller.id,
                actor_email: caller.email,
                actor_role: callerRole,
                metadata: { reason: "insufficient_role" },
                created_at: new Date().toISOString(),
            });
            
            return jsonResponse({ error: "Forbidden: insufficient permissions" }, 403);
        }
        
        console.log("[reset-user-password] Authorized role:", callerRole);
        
        // ============================================================
        // LAYER 3: RATE LIMITING
        // ============================================================
        const rateCheck = await checkRateLimit(caller.id);
        
        if (!rateCheck.allowed) {
            console.warn("[reset-user-password] Rate limit exceeded:", caller.id);
            return jsonResponse({ 
                error: "Rate limit exceeded: maksimal 10 reset per jam" 
            }, 429);
        }
        
        console.log("[reset-user-password] Rate limit OK:", rateCheck.count, "/ 10");
        
        // ============================================================
        // LAYER 4: PROSES RESET (kode asli)
        // ============================================================
        const body = await req.json();
        const { email, auth_user_id, new_password } = body;
        
        console.log("[reset-user-password] Request:", { 
            email, 
            auth_user_id, 
            has_password: !!new_password 
        });
        
        // Validasi input
        if (!new_password || new_password.length < 6) {
            return jsonResponse({ error: "Password minimal 6 karakter" }, 400);
        }
        
        if (!email && !auth_user_id) {
            return jsonResponse({ error: "Email atau auth_user_id wajib" }, 400);
        }
        
        // Cari user ID
        let userId = auth_user_id;
        let targetEmail = email;
        
        if (!userId && email) {
            console.log("[reset-user-password] Cari user by email:", email);
            const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            
            if (listError) {
                return jsonResponse({ error: "List users gagal: " + listError.message }, 500);
            }
            
            const found = usersList?.users?.find(u => u.email === email);
            userId = found?.id;
            if (found) targetEmail = found.email;
        }
        
               if (!userId) {
            // Log: user tidak ditemukan
            await supabaseAdmin.from("audit_log").insert({
                action: "reset_user_password_not_found",
                actor_id: caller.id,
                actor_email: caller.email,
                actor_role: callerRole,
                target_email: targetEmail,
                metadata: { reason: "user_not_found" },
                created_at: new Date().toISOString(),
            });
            
            return jsonResponse({ error: "User tidak ditemukan" }, 404);
        }
        
        console.log("[reset-user-password] Update password untuk user:", userId);
        
        // Update password
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: new_password }
        );
        
        if (error) {
            console.error("[reset-user-password] Update error:", error);
            
            // Log kegagalan
            await supabaseAdmin.from("audit_log").insert({
                action: "reset_user_password_failed",
                actor_id: caller.id,
                actor_email: caller.email,
                actor_role: callerRole,
                target_user_id: userId,
                target_email: targetEmail,
                metadata: { error: error.message },
                created_at: new Date().toISOString(),
            });
            
            return jsonResponse({ error: error.message }, 500);
        }
        
        // ============================================================
        // AUDIT LOG: Catat aksi berhasil
        // ============================================================
        await supabaseAdmin.from("audit_log").insert({
            action: "reset_user_password",
            actor_id: caller.id,
            actor_email: caller.email,
            actor_role: callerRole,
            target_user_id: data.user.id,
            target_email: data.user.email,
            metadata: { 
                success: true,
                target_updated_at: data.user.updated_at 
            },
            created_at: new Date().toISOString(),
        });
        
        console.log("[reset-user-password] ✅ Success:", data.user.email);
        
        return jsonResponse({ 
            success: true, 
            email: data.user.email,
            user_id: data.user.id,
            updated_at: data.user.updated_at
        });
        
    } catch (error) {
        console.error("[reset-user-password] Exception:", error);
        return jsonResponse({ error: String(error) }, 500);
    }
});