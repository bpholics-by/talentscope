/* =========================================================
   TALENTSCOPE — EDGE FUNCTION: CALCULATE VAP SCORE
   Server-side scoring untuk Work Performance & Sustained Attention (VAP)
   
   Deploy: supabase functions deploy calculate-vap-score --no-verify-jwt
   ========================================================= */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// =========================================================
// CORS WHITELIST
// =========================================================
const ALLOWED_ORIGINS = [
  // Production — ganti dengan domain asli kalau sudah ada
  "https://your-production-domain.com",
  "https://staging.your-production-domain.com",

  // Dev umum
  "http://localhost:3000",
  "http://localhost:5173",      // Vite
  "http://localhost:8000",      // Python http.server
  "http://localhost:8080",

  // VS Code Live Server
  "http://127.0.0.1:5500",
  "http://localhost:5500",

  // Fallback untuk file:// (origin = "null")
  "null",
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  // Kalau origin null/kosong (file://), izinkan dengan "null"
  const effectiveOrigin = origin ?? "null";

  const allowedOrigin = ALLOWED_ORIGINS.includes(effectiveOrigin)
    ? effectiveOrigin
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function buildHeaders(origin: string | null): Record<string, string> {
  return {
    ...buildCorsHeaders(origin),
    ...SECURITY_HEADERS,
    "Content-Type": "application/json",
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildHeaders(origin),
  });
}

// =========================================================
// RATE LIMIT
// =========================================================
async function checkRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  actorId: string,
  functionName: string,
  maxPerMinute: number
): Promise<{ allowed: boolean; remaining: number }> {
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();

  const { count } = await supabaseAdmin
    .from("rate_limit_log")
    .select("*", { count: "exact", head: true })
    .eq("actor_id", actorId)
    .eq("function_name", functionName)
    .gte("created_at", oneMinuteAgo);

  const used = count ?? 0;
  if (used >= maxPerMinute) {
    return { allowed: false, remaining: 0 };
  }

  await supabaseAdmin.from("rate_limit_log").insert({
    actor_id: actorId,
    function_name: functionName,
  });

  return { allowed: true, remaining: maxPerMinute - used - 1 };
}

// =========================================================
// AUDIT LOG
// =========================================================
async function writeAuditLog(
  supabaseAdmin: ReturnType<typeof createClient>,
  entry: {
    action: string;
    actorId: string | null;
    actorEmail: string | null;
    actorRole: string | null;
    targetUserId: string | null;
    targetEmail: string | null;
    metadata: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await supabaseAdmin.from("audit_log").insert({
      action: entry.action,
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      actor_role: entry.actorRole,
      target_user_id: entry.targetUserId,
      target_email: entry.targetEmail,
      metadata: entry.metadata,
    });
  } catch (err) {
    console.error("[audit_log] insert error:", err);
  }
}

// =========================================================
// CONFIG (harus sama dengan client speedtest.html CFG)
// =========================================================
const CFG = {
  sessionSeconds: 1800,
  totalSeconds: 3600,
  itemWindowMs: 3000,
  blocks: 6,
  rtMinMs: 150,
  rtTrimSD: 3,
  session2Chance: 0.5,
};

const NORM_PARAMS = {
  speed:     { m: 45, sd: 18 },
  accuracy:  { m: 70, sd: 15 },
  stability: { m: 65, sd: 16 },
  endurance: { m: 70, sd: 14 },
  attention: { m: 68, sd: 15 },
  vigilance: { m: 62, sd: 16 },
};

// =========================================================
// MATH HELPERS
// =========================================================
const clamp = (x: number, a = 0, b = 100) => Math.max(a, Math.min(b, x));
const mean = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const median = (a: number[]): number | null => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const sd = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map(x => (x - m) ** 2)));
};
const cv = (a: number[]): number | null => {
  if (a.length < 2) return null;
  const m = mean(a);
  if (!m) return null;
  return (sd(a) / m) * 100;
};

const normalize = (raw: number, key: keyof typeof NORM_PARAMS): number => {
  const p = NORM_PARAMS[key];
  if (!p) return clamp(raw);
  const z = (raw - p.m) / p.sd;
  return clamp(50 + z * 15, 1, 99);
};

// =========================================================
// ANSWER VERIFICATION (re-compute dari stimulus, no trust client)
// =========================================================
function verifyNumericAnswer(stimulus: string, answer: string): boolean {
  const m = String(stimulus || "").match(/^(\d+)\s*\+\s*(\d+)$/);
  if (!m) return false;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  const expected = String((a + b) % 10);
  return expected === String(answer).trim();
}

function verifyLetterAnswer(stimulus: string, answer: string): boolean {
  const parts = String(stimulus || "").split(/\s+vs\s+/i);
  if (parts.length !== 2) return false;
  const left = parts[0].trim();
  const right = parts[1].trim();
  const isSame = left === right;
  const expected = isSame ? "S" : "B";
  return expected === String(answer).trim().toUpperCase();
}

// =========================================================
// SCORING (port dari client calc())
// =========================================================
interface Trial {
  session: number;
  block: number;
  stimulus: string;
  answer: string | null;
  correct: boolean;
  timeout: boolean;
  responseTimeMs: number | null;
}

function trimRT(rtArray: number[]): number[] {
  if (!rtArray.length) return [];
  const filtered = rtArray.filter(rt => rt >= CFG.rtMinMs);
  if (filtered.length < 3) return filtered;
  const m = mean(filtered);
  const s = sd(filtered);
  const upper = m + CFG.rtTrimSD * s;
  return filtered.filter(rt => rt <= upper);
}

function metrics(trials: Trial[], sessionNumber: number) {
  const answered = trials.filter(x => !x.timeout);
  const correct = trials.filter(x => x.correct);
  const wrong = trials.filter(x => !x.timeout && !x.correct);
  const missed = trials.filter(x => x.timeout);
  const rtAll = answered
    .map(x => x.responseTimeMs)
    .filter((x): x is number => Number.isFinite(x));
  const rtTrimmed = trimRT(rtAll);
  const rawAccuracy = answered.length ? correct.length / answered.length : 0;
  const chance = sessionNumber === 2 ? CFG.session2Chance : 0;
  const correctedAccuracy = chance > 0
    ? Math.max(0, (rawAccuracy - chance) / (1 - chance))
    : rawAccuracy;
  const sessionMinutes = CFG.sessionSeconds / 60;
  const crpm = (correct.length *
    (chance > 0 ? (correctedAccuracy / Math.max(rawAccuracy, 0.001)) : 1)) /
    Math.max(1, sessionMinutes);

  return {
    answered: answered.length,
    correct: correct.length,
    wrong: wrong.length,
    missed: missed.length,
    rawAccuracy: rawAccuracy * 100,
    correctedAccuracy: correctedAccuracy * 100,
    omissionRate: trials.length ? (missed.length / trials.length) * 100 : 0,
    crpm,
    medianRT: median(rtTrimmed),
    meanRT: mean(rtTrimmed),
    sdRT: sd(rtTrimmed),
    rtTrimmedCount: rtTrimmed.length,
    rtRawCount: rtAll.length,
  };
}

function blocksOf(trials: Trial[], sessionNumber: number) {
  return Array.from({ length: CFG.blocks }, (_, i) => {
    const t = trials.filter(x => x.block === i + 1);
    const answered = t.filter(x => !x.timeout);
    const correct = t.filter(x => x.correct);
    const missed = t.filter(x => x.timeout);
    const chance = sessionNumber === 2 ? CFG.session2Chance : 0;
    const rawAcc = answered.length ? correct.length / answered.length : 0;
    const corrAcc = chance > 0
      ? Math.max(0, (rawAcc - chance) / (1 - chance))
      : rawAcc;
    return {
      block: i + 1,
      trialCount: t.length,
      rawAccuracy: rawAcc * 100,
      correctedAccuracy: corrAcc * 100,
      omissionRate: t.length ? (missed.length / t.length) * 100 : 0,
      crpm: correct.length / Math.max(1, CFG.sessionSeconds / CFG.blocks / 60),
    };
  });
}

function fatigueSlope(blockData: { correctedAccuracy: number }[]): number {
  const n = blockData.length;
  if (n < 2) return 0;
  const xs = blockData.map((_, i) => i + 1);
  const ys = blockData.map(b => b.correctedAccuracy);
  const mx = mean(xs), my = mean(ys);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function calc(s1Trials: Trial[], s2Trials: Trial[]) {
  const s1 = metrics(s1Trials, 1);
  const s2 = metrics(s2Trials, 2);
  const b1 = blocksOf(s1Trials, 1);
  const b2 = blocksOf(s2Trials, 2);
  const all = [s1, s2];

  const avgCRPM = mean(all.map(x => x.crpm));
  const allRTTrimmed = trimRT(
    [...s1Trials, ...s2Trials]
      .filter(x => !x.timeout && Number.isFinite(x.responseTimeMs))
      .map(x => x.responseTimeMs as number)
  );
  const medRT = median(allRTTrimmed) || CFG.itemWindowMs;
  const throughputScore = clamp(avgCRPM * 20);
  const rtEfficiency = clamp(100 - (medRT / CFG.itemWindowMs) * 55);
  const rawSpeed = clamp(throughputScore * 0.60 + rtEfficiency * 0.40);

  const rawAccuracy = clamp(mean(all.map(x => x.correctedAccuracy)));

  const blockAccs = [...b1, ...b2].map(b => b.correctedAccuracy);
  const accCV = cv(blockAccs) ?? 100;
  const rawStability = clamp(100 - accCV * 2);

  const slope1 = fatigueSlope(b1);
  const slope2 = fatigueSlope(b2);
  const avgSlope = (slope1 + slope2) / 2;
  const rawEndurance = clamp(100 + avgSlope * 20);

  const rawAttention = clamp(
    s2.correctedAccuracy * 0.60 + (100 - s2.omissionRate) * 0.40
  );

  const avgOmission = mean(all.map(x => x.omissionRate));
  const rawVigilance = clamp(
    rawEndurance * 0.45 + rawStability * 0.30 + (100 - avgOmission) * 0.25
  );

  const speed     = normalize(rawSpeed, "speed");
  const accuracy  = normalize(rawAccuracy, "accuracy");
  const stability = normalize(rawStability, "stability");
  const endurance = normalize(rawEndurance, "endurance");
  const attention = normalize(rawAttention, "attention");
  const vigilance = normalize(rawVigilance, "vigilance");

  const satIndex = clamp(50 + (accuracy - speed) * 0.5, 0, 100);

  return {
    speed, accuracy, stability, endurance, attention, vigilance,
    satIndex,
    raw: {
      speed: rawSpeed, accuracy: rawAccuracy, stability: rawStability,
      endurance: rawEndurance, attention: rawAttention, vigilance: rawVigilance,
    },
    s1, s2, b1, b2,
    medianRT: medRT,
    avgCRPM,
    fatigueSlope: avgSlope,
    rtTrimmedCount: allRTTrimmed.length,
    rtRawCount: [...s1Trials, ...s2Trials]
      .filter(x => !x.timeout && Number.isFinite(x.responseTimeMs)).length,
  };
}

// =========================================================
// REBUILD TRIALS dari raw payload + re-verify correct
// =========================================================
interface RawTrial {
  trialId?: string;
  session?: number;
  number?: number;
  block?: number;
  stimulus?: string;
  answer?: string | null;
  timeout?: boolean;
  responseTimeMs?: number | null;
}

function rebuildTrials(rawTrials: RawTrial[], sessionNum: number): Trial[] {
  const out: Trial[] = [];
  for (const raw of rawTrials) {
    let isCorrect = false;
    const timedOut = !!raw.timeout;
    const answerStr = raw.answer !== null && raw.answer !== undefined
      ? String(raw.answer)
      : null;

    if (!timedOut && answerStr !== null) {
      if (sessionNum === 1) {
        isCorrect = verifyNumericAnswer(raw.stimulus || "", answerStr);
      } else {
        isCorrect = verifyLetterAnswer(raw.stimulus || "", answerStr);
      }
    }

    out.push({
      session: sessionNum,
      block: Number(raw.block) || 1,
      stimulus: String(raw.stimulus || ""),
      answer: answerStr,
      correct: isCorrect,
      timeout: timedOut,
      responseTimeMs: Number.isFinite(raw.responseTimeMs) ? (raw.responseTimeMs as number) : null,
    });
  }
  return out;
}

// =========================================================
// MAIN HANDLER
// =========================================================
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: buildCorsHeaders(origin) });
  }

  // Method check
  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Method not allowed" },
      405,
      origin
    );
  }

  try {
    // ---- 1. Verify JWT ----
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return jsonResponse({ success: false, error: "Missing token" }, 401, origin);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("[VAP] Missing Supabase env vars");
      return jsonResponse({ success: false, error: "Server config error" }, 500, origin);
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ success: false, error: "Invalid or expired token" }, 401, origin);
    }

    // ---- 2. Parse body ----
    const body = await req.json().catch(() => ({}));
    const projectId = String(body.projectId || "").trim();
    const participantId = String(body.participantId || "").trim();
    const assessmentIndex = Number(body.assessmentIndex ?? 0);
    const assessmentCodeRaw = String(body.assessmentCode || "vap").trim();
    const assessmentCode = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assessmentCodeRaw)
      ? "vap"
      : assessmentCodeRaw.toLowerCase();
    const assessmentName = String(body.assessmentName || "VAP").trim();
    const rawSessions = body.sessions || {};

    if (!projectId || !participantId) {
      return jsonResponse(
        { success: false, error: "projectId & participantId wajib" },
        400,
        origin
      );
    }

    // ---- 3. Admin client ----
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // ---- 4. Ownership check ----
    const { data: ownership } = await supabaseAdmin
      .from("participants")
      .select("id, project_id, name, full_name")
      .eq("id", participantId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (!ownership) {
      await writeAuditLog(supabaseAdmin, {
        action: "vap_score_forbidden",
        actorId: user.id,
        actorEmail: user.email || null,
        actorRole: (user.user_metadata as Record<string, unknown>)?.role as string || null,
        targetUserId: participantId,
        targetEmail: null,
        metadata: { project_id: projectId, reason: "ownership_failed" },
      });
      return jsonResponse(
        { success: false, error: "Participant not found in project" },
        403,
        origin
      );
    }

    // ---- 5. Rate limit ----
    const rl = await checkRateLimit(supabaseAdmin, user.id, "calculate-vap-score", 10);
    if (!rl.allowed) {
      await writeAuditLog(supabaseAdmin, {
        action: "vap_score_rate_limited",
        actorId: user.id,
        actorEmail: user.email || null,
        actorRole: (user.user_metadata as Record<string, unknown>)?.role as string || null,
        targetUserId: participantId,
        targetEmail: null,
        metadata: { project_id: projectId },
      });
      return jsonResponse(
        { success: false, error: "Rate limit exceeded. Coba lagi dalam 1 menit." },
        429,
        origin
      );
    }

    // ---- 6. Rebuild trials + re-verify correct ----
    const s1Raw: RawTrial[] = Array.isArray(rawSessions?.[1]?.trials)
      ? rawSessions[1].trials
      : (Array.isArray(rawSessions?.["1"]?.trials) ? rawSessions["1"].trials : []);
    const s2Raw: RawTrial[] = Array.isArray(rawSessions?.[2]?.trials)
      ? rawSessions[2].trials
      : (Array.isArray(rawSessions?.["2"]?.trials) ? rawSessions["2"].trials : []);

    if (s1Raw.length === 0 && s2Raw.length === 0) {
      return jsonResponse(
        { success: false, error: "sessions.trials kosong" },
        400,
        origin
      );
    }

    const s1Trials = rebuildTrials(s1Raw, 1);
    const s2Trials = rebuildTrials(s2Raw, 2);

    // ---- 7. Compute scores ----
    const result = calc(s1Trials, s2Trials);

    // ---- 8. Persist ke vap_results ----
    const submittedAt = new Date().toISOString();

    const { error: upsertErr } = await supabaseAdmin
      .from("vap_results")
      .upsert(
        {
          project_id: projectId,
          participant_id: participantId,
          assessment_index: assessmentIndex,
          assessment_code: assessmentCode,
          assessment_name: assessmentName,
          participant_name: ownership.name || ownership.full_name || "",
          result_type: "VAP",
          scores: result,
          raw_data: {
            sessions: {
              1: { trials: s1Trials },
              2: { trials: s2Trials },
            },
          },
          submitted_at: submittedAt,
        },
        { onConflict: "project_id,participant_id,assessment_index,assessment_code" }
      );

    if (upsertErr) {
      console.error("[VAP] upsert error:", upsertErr);
      await writeAuditLog(supabaseAdmin, {
        action: "vap_score_persist_failed",
        actorId: user.id,
        actorEmail: user.email || null,
        actorRole: (user.user_metadata as Record<string, unknown>)?.role as string || null,
        targetUserId: participantId,
        targetEmail: null,
        metadata: {
          project_id: projectId,
          error: upsertErr.message,
        },
      });
      return jsonResponse(
        { success: false, error: "Failed to persist result" },
        500,
        origin
      );
    }

    // ---- 9. Audit log (success) ----
    await writeAuditLog(supabaseAdmin, {
      action: "calculate_vap_score",
      actorId: user.id,
      actorEmail: user.email || null,
      actorRole: (user.user_metadata as Record<string, unknown>)?.role as string || null,
      targetUserId: participantId,
      targetEmail: null,
      metadata: {
        project_id: projectId,
        assessment_index: assessmentIndex,
        assessment_code: assessmentCode,
        trial_count: s1Trials.length + s2Trials.length,
        score_snapshot: {
          speed: result.speed,
          accuracy: result.accuracy,
          stability: result.stability,
          endurance: result.endurance,
          attention: result.attention,
          vigilance: result.vigilance,
          satIndex: result.satIndex,
        },
      },
    });

    // ---- 10. Response ----
    return jsonResponse(
      {
        success: true,
        scores: result,
        submittedAt,
        rateLimitRemaining: rl.remaining,
      },
      200,
      origin
    );

  } catch (err) {
    console.error("[VAP] Unhandled error:", err);
    return jsonResponse(
      {
        success: false,
        error: "Internal error: " + (err instanceof Error ? err.message : String(err)),
      },
      500,
      origin
    );
  }
});