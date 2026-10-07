// supabase/functions/calculate-vap-score/index.ts
// VAP Scoring — Server-side, no answer key exposure to client
// Deploy: supabase functions deploy calculate-vap-score --no-verify-jwt

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // TODO Phase 7: ganti ke domain spesifik
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// =========================================================
// CONFIG (harus sama dengan client CFG)
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
const median = (a: number[]) => {
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
const cv = (a: number[]) => {
  if (a.length < 2) return null;
  const m = mean(a);
  if (!m) return null;
  return (sd(a) / m) * 100;
};

const normalize = (raw: number, key: keyof typeof NORM_PARAMS) => {
  const p = NORM_PARAMS[key];
  if (!p) return clamp(raw);
  const z = (raw - p.m) / p.sd;
  return clamp(50 + z * 15, 1, 99);
};

// =========================================================
// ANSWER KEY — HANYA ADA DI SERVER
// =========================================================
// Format: { trialId: "expected answer" }
// trialId dikirim client, tapi TIDAK berisi jawaban.
// =========================================================
function generateNumericTrial(seed: number): { stimulus: string; key: string } {
  // Deterministic PRNG dari seed — supaya client & server generate sama
  // Client generate stimulus, kirim trialId + stimulus, server verifikasi
  // ATAU client kirim stimulus + jawaban, server re-compute key dari stimulus.
  // Pendekatan kedua lebih sederhana untuk VAP karena stimulus = "a + b".
  throw new Error("not used — see verifyNumericAnswer");
}

/**
 * Verifikasi jawaban numerik.
 * Client kirim: { trialId, stimulus: "12 + 7", answer: "9" }
 * Server parse stimulus, hitung key, bandingkan.
 */
function verifyNumericAnswer(stimulus: string, answer: string): boolean {
  const m = stimulus.match(/^(\d+)\s*\+\s*(\d+)$/);
  if (!m) return false;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  const expected = String((a + b) % 10);
  return expected === String(answer);
}

/**
 * Verifikasi jawaban letter.
 * Client kirim: { trialId, stimulus: "ABCD vs ABCE", answer: "B" }
 * Server cek apakah kedua string sama.
 * CATATAN: client HARUS kirim kedua string asli (bukan cuma "SAMA"/"BERBEDA").
 */
function verifyLetterAnswer(stimulus: string, answer: string): boolean {
  const parts = stimulus.split("   vs   ");
  if (parts.length !== 2) return false;
  const [left, right] = parts.map(s => s.trim());
  const isSame = left === right;
  const expected = isSame ? "S" : "B";
  return expected === String(answer);
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
  let filtered = rtArray.filter(rt => rt >= CFG.rtMinMs);
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
  const rtAll = answered.map(x => x.responseTimeMs).filter((x): x is number => Number.isFinite(x));
  const rtTrimmed = trimRT(rtAll);
  const rawAccuracy = answered.length ? correct.length / answered.length : 0;
  const chance = sessionNumber === 2 ? CFG.session2Chance : 0;
  const correctedAccuracy = chance > 0
    ? Math.max(0, (rawAccuracy - chance) / (1 - chance))
    : rawAccuracy;
  const sessionMinutes = CFG.sessionSeconds / 60;
  const crpm = (correct.length * (chance > 0 ? (correctedAccuracy / Math.max(rawAccuracy, 0.001)) : 1))
    / Math.max(1, sessionMinutes);

  return {
    answered: answered.length,
    correct: correct.length,
    wrong: wrong.length,
    missed: missed.length,
    rawAccuracy: rawAccuracy * 100,
    correctedAccuracy: correctedAccuracy * 100,
    omissionRate: trials.length ? missed.length / trials.length * 100 : 0,
    crpm,
    medianRT: median(rtTrimmed),
    meanRT: mean(rtTrimmed),
    sdRT: sd(rtTrimmed),
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
      omissionRate: t.length ? missed.length / t.length * 100 : 0,
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
      .map(x => x.responseTimeMs!)
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

  const rawAttention = clamp(s2.correctedAccuracy * 0.60 + (100 - s2.omissionRate) * 0.40);

  const avgOmission = mean(all.map(x => x.omissionRate));
  const rawVigilance = clamp(rawEndurance * 0.45 + rawStability * 0.30 + (100 - avgOmission) * 0.25);

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
    rtRawCount: [...s1Trials, ...s2Trials].filter(x => !x.timeout && Number.isFinite(x.responseTimeMs)).length,
  };
}

// =========================================================
// MAIN HANDLER
// =========================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // ---- 1. Verify JWT ----
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return json({ success: false, error: "Missing token" }, 401);
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return json({ success: false, error: "Invalid token" }, 401);
    }

    // ---- 2. Parse body ----
    const body = await req.json();
    const { projectId, participantId, assessmentIndex, assessmentCode, assessmentName, sessions } = body;

    if (!projectId || !participantId || !sessions) {
      return json({ success: false, error: "Missing required fields" }, 400);
    }

    // ---- 3. Verify ownership ----
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: ownership, error: ownErr } = await supabaseAdmin
      .from("participants")
      .select("id, project_id")
      .eq("id", participantId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (ownErr || !ownership) {
      return json({ success: false, error: "Participant not found in project" }, 403);
    }

    // ---- 4. Re-verify setiap trial (server-side, no trust client) ----
    const s1Trials: Trial[] = [];
    const s2Trials: Trial[] = [];

    for (const sessionNum of [1, 2]) {
      const rawTrials = sessions[String(sessionNum)]?.trials || sessions[sessionNum]?.trials || [];
      for (const raw of rawTrials) {
        let isCorrect = false;
        if (!raw.timeout && raw.answer !== null && raw.answer !== undefined) {
          if (sessionNum === 1) {
            isCorrect = verifyNumericAnswer(raw.stimulus, String(raw.answer));
          } else {
            isCorrect = verifyLetterAnswer(raw.stimulus, String(raw.answer));
          }
        }
        const trial: Trial = {
          session: sessionNum,
          block: raw.block,
          stimulus: raw.stimulus,
          answer: raw.answer !== null && raw.answer !== undefined ? String(raw.answer) : null,
          correct: isCorrect,
          timeout: !!raw.timeout,
          responseTimeMs: Number.isFinite(raw.responseTimeMs) ? raw.responseTimeMs : null,
        };
        if (sessionNum === 1) s1Trials.push(trial);
        else s2Trials.push(trial);
      }
    }

    // ---- 5. Compute scores ----
    const result = calc(s1Trials, s2Trials);

    // ---- 6. Persist ----
    const submittedAt = new Date().toISOString();
    const payload = {
      project_id: projectId,
      participant_id: participantId,
      assessment_index: Number(assessmentIndex || 0),
      assessment_code: String(assessmentCode || "VAP").toLowerCase(),
      assessment_name: String(assessmentName || "VAP"),
      participant_name: ownership.id ? "" : "", // optional
      result_type: "VAP",
      scores: result,
      raw_data: { sessions: { 1: { trials: s1Trials }, 2: { trials: s2Trials } } },
      submitted_at: submittedAt,
    };

    const { error: upsertErr } = await supabaseAdmin
      .from("vap_results")
      .upsert(payload, { onConflict: "project_id,participant_id,assessment_index,assessment_code" });

    if (upsertErr) {
      console.error("[VAP] upsert error:", upsertErr);
      return json({ success: false, error: "Failed to persist result" }, 500);
    }

    // ---- 7. Return ----
    return json({
      success: true,
      scores: result,
      submittedAt,
    });

  } catch (err) {
    console.error("[VAP] error:", err);
    return json({ success: false, error: String(err?.message || err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}