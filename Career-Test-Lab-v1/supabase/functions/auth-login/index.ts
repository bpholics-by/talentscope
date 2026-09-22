/* =========================================================
   TALENTSCOPE — AUTH-LOGIN EDGE FUNCTION
   ---------------------------------------------------------
   Version: v3 (JWT-signed, bcrypt, case-insensitive)
   
   Auto-detect login untuk:
   - System Admin (username: admin, USR-*)
   - Client Admin (username: *.clientadmin)
   - Client User / Asesor (username: *.clientuser)
   - Peserta (username: email atau access_code)
   
   Input:  { username, password }
   Output: { success, user, token, expiresAt }
   
   Changelog:
   - v1: Base64 token, ilike query (buggy)
   - v2: eq query, lowerUser (fix case-sensitivity)
   - v3: JWT HS256 signed, 24h expiry
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

// @ts-ignore — Deno runtime
declare const Deno: any;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// @ts-ignore — Deno.serve is available in Supabase Edge Functions
Deno.serve(async (req: Request) => {

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // Hanya terima POST
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ success: false, error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        // ============================================================
        // 1. PARSE BODY
        // ============================================================
        const body = await req.json().catch(() => ({}));
        const username = String(body.username || "").trim();
        const password = String(body.password || "").trim();

        if (!username || !password) {
            return new Response(
                JSON.stringify({ success: false, error: "Username dan password wajib diisi" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("[AUTH-LOGIN] Attempt:", username, "| pass length:", password.length);

        // ============================================================
        // 2. INIT SUPABASE (SERVICE ROLE)
        // ============================================================
        // @ts-ignore — Deno.env available at runtime
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        // @ts-ignore
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        // @ts-ignore
        const jwtSecret = Deno.env.get("AUTH_JWT_SECRET") || "";

        if (!supabaseUrl || !serviceRoleKey) {
            console.error("[AUTH-LOGIN] Missing Supabase env vars");
            return new Response(
                JSON.stringify({ success: false, error: "Server configuration error" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!jwtSecret) {
            console.error("[AUTH-LOGIN] Missing AUTH_JWT_SECRET");
            return new Response(
                JSON.stringify({ success: false, error: "Server configuration error" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
        });

        // ============================================================
        // 3. AUTO-DETECT USER TYPE
        // ============================================================
        const lowerUser = username.toLowerCase();

        let userType = "unknown";   // "admin" | "client" | "asesor" | "participant" | "participant_code"

        if (lowerUser === "admin" || lowerUser.startsWith("usr-")) {
            userType = "admin";
        } else if (lowerUser.endsWith(".clientadmin")) {
            userType = "client";
        } else if (lowerUser.endsWith(".clientuser")) {
            userType = "asesor";
        } else if (lowerUser.includes("@")) {
            userType = "participant";
        } else {
            // Kode pendek = access_code peserta
            userType = "participant_code";
        }

        console.log("[AUTH-LOGIN] Detected type:", userType);

        // ============================================================
        // 4. CARI USER DI DATABASE
        // ============================================================
        let userRecord: any = null;
        let tableName = "";
        let userId = "";

        // ---- ADMIN / CLIENT / ASESOR: cari di ts_users ----
        if (userType === "admin" || userType === "client" || userType === "asesor") {
            tableName = "ts_users";

            // FIX #1b: pakai .eq() + lowerUser (bukan .ilike)
            // Alasan: PostgREST salah parsing `.` di value saat pakai ilike
            const { data, error } = await supabase
                .from("ts_users")
                .select("id, data")
                .eq("data->>username", lowerUser)
                .maybeSingle();

            if (error) {
                console.error("[AUTH-LOGIN] ts_users query error:", error);
            }

            if (data) {
                userRecord = data.data;
                userId = data.id;
            }
        }
        // ---- PESERTA via EMAIL/USERNAME ----
        else if (userType === "participant") {
            tableName = "participants";

            // FIX #1: ilike untuk email (bisa mixed-case)
            const { data, error } = await supabase
                .from("participants")
                .select("id, name, email, password, password_hash, access_code, project_id, is_active, raw_data")
                .or(`email.ilike.${username},username.ilike.${username}`)
                .maybeSingle();

            if (error) {
                console.error("[AUTH-LOGIN] participants query error:", error);
            }

            if (data) {
                userRecord = data;
                userId = data.id;
            }
        }
        // ---- PESERTA via ACCESS CODE ----
        else if (userType === "participant_code") {
            tableName = "participants";

            // Access code case-sensitive by design
                       const { data, error } = await supabase
                .from("participants")
                .select("id, name, email, password, password_hash, access_code, project_id, is_active, raw_data")
                .ilike("access_code", username)
                .maybeSingle();

            if (error) {
                console.error("[AUTH-LOGIN] participants query error:", error);
            }

            if (data) {
                userRecord = data;
                userId = data.id;
            }
        }

        // ============================================================
        // 5. CEK USER DITEMUKAN
        // ============================================================
        if (!userRecord) {
            console.log("[AUTH-LOGIN] User not found:", username);
            return new Response(
                JSON.stringify({ success: false, error: "Username atau password salah" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ============================================================
        // 6. CEK is_active
        // ============================================================
        const isActive = (userRecord.is_active !== false);

        if (!isActive) {
            console.log("[AUTH-LOGIN] User inactive:", username);
            return new Response(
                JSON.stringify({ success: false, error: "Akun Anda telah dinonaktifkan. Hubungi admin." }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ============================================================
        // 7. VERIFIKASI PASSWORD
        // ============================================================
        let passwordValid = false;

        if (tableName === "ts_users") {
            // Cek via bcrypt menggunakan RPC + lowerUser (FIX #1)
            const { data: verifyResult, error: verifyError } = await supabase
                .rpc("verify_password", {
                    p_username: lowerUser,
                    p_password: password
                });

            if (verifyError) {
                console.error("[AUTH-LOGIN] Verify error:", verifyError);
            }

            passwordValid = verifyResult === true;
        }
        else if (tableName === "participants") {
            // Peserta bisa login pakai password ATAU access_code
            if (userRecord.access_code && userRecord.access_code === password) {
                passwordValid = true;
            } else {
                // Verifikasi via bcrypt RPC
                const { data: verifyResult, error: verifyError } = await supabase
                    .rpc("verify_participant_password", {
                        p_participant_id: userId,
                        p_password: password
                    });

                if (verifyError) {
                    console.error("[AUTH-LOGIN] Verify participant error:", verifyError);
                }

                passwordValid = verifyResult === true;
            }
        }

        if (!passwordValid) {
            console.log("[AUTH-LOGIN] Wrong password for:", username);
            return new Response(
                JSON.stringify({ success: false, error: "Username atau password salah" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ============================================================
        // 8. BUILD USER OBJECT
        // ============================================================
        let userObj: any = {};

        if (tableName === "ts_users") {
            userObj = {
                id: userId,
                username: userRecord.username || username,
                name: userRecord.name || "User",
                role: userRecord.role || "Client User",
                email: userRecord.email || "",
                projectId: userRecord.projectId || null,
                projectName: userRecord.projectName || null,
            };
        } else {
            userObj = {
                id: userId,
                participant_code: userRecord.participant_code || "",
                username: userRecord.username || userRecord.email || "",
                name: userRecord.name || "Peserta",
                email: userRecord.email || "",
                role: "Participant",
                projectId: userRecord.project_id || null,
                access_code: userRecord.access_code || "",
            };
        }

        // ============================================================
        // 9. GENERATE SESSION TOKEN (JWT HS256, 24 jam)
        // ============================================================
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(jwtSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign", "verify"]
        );

        const now = Math.floor(Date.now() / 1000);
        const expiresIn = 60 * 60 * 24; // 24 jam

        const tokenPayload = {
            sub: userId,
            username: username,
            role: userObj.role,
            projectId: userObj.projectId,
            iat: now,
            exp: now + expiresIn,
        };

        const token = await create({ alg: "HS256", typ: "JWT" }, tokenPayload, cryptoKey);

        const expiresAt = new Date((now + expiresIn) * 1000).toISOString();

        console.log("[AUTH-LOGIN] Login success:", username, "| role:", userObj.role);

        // ============================================================
        // 10. RETURN SUCCESS
        // ============================================================
        return new Response(
            JSON.stringify({
                success: true,
                user: userObj,
                token: token,
                expiresAt: expiresAt,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("[AUTH-LOGIN] Unexpected error:", err);
        return new Response(
            JSON.stringify({
                success: false,
                error: "Internal server error: " + (err instanceof Error ? err.message : String(err))
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});