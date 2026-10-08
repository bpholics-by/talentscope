/* ==========================================================
   SEND INVITATION — SECURED v2
   ----------------------------------------------------------
   Kirim email undangan ke peserta assessment.
   
   SECURITY LAYERS:
   1. JWT verification (wajib login)
   2. Role check (SYSTEM_ADMIN/ADMIN/CLIENT_ADMIN)
   3. Rate limiting (maks 50 email/jam per admin)
   4. Recipient limit (maks 30 penerima per request)
   5. Whitelist domain (opsional, bisa di-set via env)
   6. Audit logging (semua aksi tercatat)
   7. Content sanitization (cegah HTML injection)
========================================================== */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const GMAIL_USER = Deno.env.get("GMAIL_USER") || "bpholis@gmail.com";

// Opsional: whitelist domain (kosongkan = semua domain diizinkan)
// Contoh: "talentscope.com,company.com"
const ALLOWED_DOMAINS = (Deno.env.get("INVITATION_ALLOWED_DOMAINS") || "")
    .split(",").map(d => d.trim().toLowerCase()).filter(Boolean);

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
    return role;
}

const ALLOWED_ROLES = ["system_admin", "administrator", "client_admin"];

// Batas keras
const MAX_RECIPIENTS_PER_REQUEST = 30;
const MAX_EMAILS_PER_HOUR = 50;

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
// HELPER: Sanitasi HTML (cegah XSS/phishing via email body)
// ============================================================
function sanitizeHtml(input: string): string {
    if (!input) return "";
    return String(input)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");
}

// ============================================================
// HELPER: Validasi email format
// ============================================================
function isValidEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

// ============================================================
// HELPER: Whitelist domain check
// ============================================================
function isAllowedDomain(email: string): boolean {
    if (ALLOWED_DOMAINS.length === 0) return true; // No whitelist = allow all
    const domain = email.split("@")[1]?.toLowerCase();
    return ALLOWED_DOMAINS.includes(domain);
}

// ============================================================
// HELPER: Rate limit (maks 50 email/jam per admin)
// ============================================================
async function checkRateLimit(actorId: string): Promise<{ allowed: boolean; sent: number; limit: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Ambil total email yang sudah dikirim dalam 1 jam terakhir
    const { data, error } = await supabaseAdmin
        .from("audit_log")
        .select("metadata")
        .eq("action", "send_invitation")
        .eq("actor_id", actorId)
        .gte("created_at", oneHourAgo);
    
    if (error) {
        console.warn("[rate-limit] Error:", error);
        return { allowed: true, sent: 0, limit: MAX_EMAILS_PER_HOUR };
    }
    
    const totalSent = (data || []).reduce((sum, row) => {
        const count = row.metadata?.sent_count || 0;
        return sum + count;
    }, 0);
    
    return {
        allowed: totalSent < MAX_EMAILS_PER_HOUR,
        sent: totalSent,
        limit: MAX_EMAILS_PER_HOUR
    };
}

// ============================================================
// HELPER: Kirim via Brevo
// ============================================================
async function sendViaBrevo(to: string, subject: string, html: string) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            sender: { name: "TalentScope", email: GMAIL_USER },
            to: [{ email: to }],
            subject: subject,
            htmlContent: html
        })
    });
    
    const result = await res.json();
    
    if (!res.ok) {
        throw new Error(`Brevo error ${res.status}: ${result.message || JSON.stringify(result)}`);
    }
    
    return { success: true, provider: "brevo", email: to, messageId: result.messageId };
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
            console.warn("[send-invitation] Missing auth header");
            return jsonResponse({ error: "Unauthorized: missing token" }, 401);
        }
        
        const token = authHeader.replace("Bearer ", "");
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token);
        
        if (authError || !caller) {
            return jsonResponse({ error: "Unauthorized: invalid token" }, 401);
        }
        
        console.log("[send-invitation] Caller:", caller.email);
        
        // ============================================================
        // LAYER 2: VERIFIKASI ROLE
        // ============================================================
        const callerRole = normalizeRole(caller.user_metadata?.role || "");
        
        if (!ALLOWED_ROLES.includes(callerRole)) {
            console.warn("[send-invitation] Forbidden role:", callerRole);
            
            await supabaseAdmin.from("audit_log").insert({
                action: "send_invitation_forbidden",
                actor_id: caller.id,
                actor_email: caller.email,
                actor_role: callerRole,
                metadata: { reason: "insufficient_role" },
                created_at: new Date().toISOString(),
            });
            
            return jsonResponse({ error: "Forbidden: insufficient permissions" }, 403);
        }
        
        console.log("[send-invitation] Authorized:", callerRole);
        
        // ============================================================
        // LAYER 3: PARSE & VALIDASI BODY
        // ============================================================
        const body = await req.json();
        const { participants, projectTitle } = body;
        
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return jsonResponse({ error: "Data peserta tidak valid atau kosong" }, 400);
        }
        
        // Batas keras jumlah penerima
        if (participants.length > MAX_RECIPIENTS_PER_REQUEST) {
            return jsonResponse({ 
                error: `Terlalu banyak penerima. Maksimal ${MAX_RECIPIENTS_PER_REQUEST} per request.`,
                requested: participants.length,
                max: MAX_RECIPIENTS_PER_REQUEST
            }, 400);
        }
        
        // Validasi setiap email
        const invalidEmails: string[] = [];
        for (const p of participants) {
            if (!p.email || !isValidEmail(p.email)) {
                invalidEmails.push(p.email || "(kosong)");
            } else if (!isAllowedDomain(p.email)) {
                invalidEmails.push(p.email + " (domain tidak diizinkan)");
            }
        }
        
        if (invalidEmails.length > 0) {
            return jsonResponse({ 
                error: "Beberapa email tidak valid",
                invalid: invalidEmails
            }, 400);
        }
        
        console.log("[send-invitation] Validated:", participants.length, "recipients");
        
        // ============================================================
        // LAYER 4: RATE LIMITING
        // ============================================================
        const rateCheck = await checkRateLimit(caller.id);
        
        if (!rateCheck.allowed) {
            console.warn("[send-invitation] Rate limit exceeded");
            return jsonResponse({ 
                error: `Rate limit exceeded: maksimal ${rateCheck.limit} email per jam`,
                sent_this_hour: rateCheck.sent,
                limit: rateCheck.limit
            }, 429);
        }
        
        // Cek apakah total setelah request ini masih dalam batas
        if (rateCheck.sent + participants.length > MAX_EMAILS_PER_HOUR) {
            return jsonResponse({ 
                error: `Request ini akan melebihi batas ${rateCheck.limit} email/jam`,
                sent_this_hour: rateCheck.sent,
                requested_now: participants.length,
                limit: rateCheck.limit
            }, 429);
        }
        
        console.log("[send-invitation] Rate OK:", rateCheck.sent, "/", rateCheck.limit);
        
        // ============================================================
        // SEND EMAILS
        // ============================================================
        console.log(`[send-invitation] Sending ${participants.length} emails via Brevo`);
        
        const emailPromises = participants.map(async (p: any) => {
            const emailSubject = String(p.subject || "Invitation to Complete Assessment").substring(0, 200);
            
            const rawMessage = p.invitationBody || `Halo ${p.name || "Participant"},

Anda diundang untuk mengikuti assessment online "${projectTitle || "TalentScope"}", pada :

Hari/Tanggal : ${p.scheduleDate || "-"}
Waktu        : ${p.scheduleTime || "-"}

Username : ${p.username || p.email || "-"}
Password : ${p.password || p.accessCode || "-"}

Anda akan menerima tautan login (Login URL) secara terpisah untuk menghindari kadaluarsa kredensial apabila proses login dilakukan lebih awal.

Apabila terdapat pertanyaan atau kendala teknis, silakan menghubungi admin melalui grup WhatsApp yang tersedia.

Terima kasih,
TalentScope`;
            
            const htmlMessage = sanitizeHtml(rawMessage);
            
            const html = `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.7; max-width: 650px; margin: auto; padding: 20px;">
                    ${htmlMessage}
                </div>
            `;
            
            try {
                const result = await sendViaBrevo(p.email, emailSubject, html);
                console.log(`[send-invitation] ✅ Sent:`, p.email);
                return { success: true, email: p.email, provider: "brevo" };
            } catch (error) {
                console.error(`[send-invitation] ❌ Failed:`, p.email, error);
                return { success: false, email: p.email, error: String(error) };
            }
        });
        
        const results = await Promise.all(emailPromises);
        const failedEmails = results.filter((r) => r.success === false);
        const successCount = results.length - failedEmails.length;
        
        // ============================================================
        // LAYER 5: AUDIT LOG
        // ============================================================
        await supabaseAdmin.from("audit_log").insert({
            action: "send_invitation",
            actor_id: caller.id,
            actor_email: caller.email,
            actor_role: callerRole,
            metadata: {
                project_title: projectTitle || null,
                sent_count: successCount,
                failed_count: failedEmails.length,
                total_recipients: participants.length,
                // Jangan simpan email lengkap (privacy)
                recipient_domains: [...new Set(participants.map((p: any) => p.email.split("@")[1]))]
            },
            created_at: new Date().toISOString(),
        });
        
        console.log("[send-invitation] ✅ Done:", successCount, "/", results.length);
        
        return jsonResponse({
            success: failedEmails.length === 0,
            provider: "brevo",
            message: failedEmails.length === 0
                ? `✅ ${successCount}/${results.length} email berhasil dikirim`
                : `⚠️ ${successCount}/${results.length} email terkirim, ${failedEmails.length} gagal`,
            sent: successCount,
            failed: failedEmails.length,
            // Jangan return semua results (data leak prevention)
            errors: failedEmails.slice(0, 5).map((f: any) => ({
                email: f.email,
                error: f.error
            }))
        });
        
    } catch (error) {
        console.error("[send-invitation] Exception:", error);
        return jsonResponse({ error: "Internal server error" }, 500);
    }
});