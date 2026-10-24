// =========================================================
// Edge Function: calculate-tpdk-score (v3 — 70 item + IQ + kelebihan/kelemahan)
// Deploy: supabase functions deploy calculate-tpdk-score
// =========================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============ KUNCI JAWABAN 70 ITEM ============
const ANSWER_KEY: Record<string, string> = {
  // A: Verbal (20)
  A01:"C",A02:"A",A03:"D",A04:"A",A05:"D",A06:"B",A07:"A",A08:"D",A09:"B",A10:"B",
  A11:"C",A12:"B",A13:"D",A14:"C",A15:"C",A16:"C",A17:"C",A18:"C",A19:"C",A20:"C",
  // B: Numerik (20)
  B01:"B",B02:"C",B03:"B",B04:"B",B05:"C",B06:"B",B07:"C",B08:"C",B09:"C",B10:"A",
  B11:"A",B12:"A",B13:"C",B14:"C",B15:"B",B16:"C",B17:"C",B18:"B",B19:"C",B20:"B",
  // C: Spasial (20)
  C01:"C",C02:"A",C03:"D",C04:"A",C05:"B",C06:"C",C07:"C",C08:"A",C09:"B",C10:"C",
  C11:"A",C12:"D",C13:"C",C14:"C",C15:"A",C16:"B",C17:"A",C18:"A",C19:"A",C20:"B",
  // D: Logika/Analisa-Sintesa (10)
  D01:"A",D02:"A",D03:"A",D04:"D",D05:"B",D06:"D",D07:"B",D08:"B",D09:"B",D10:"B",
};

const MAX_PER_SUBTEST = { A: 20, B: 20, C: 20, D: 10 } as const;

// Norma placeholder (WAJIB dikalibrasi setelah pilot N ≥ 200)
const NORMS = {
  A: { mean: 11.0, sd: 3.5, max: 20 },
  B: { mean: 9.0,  sd: 4.0, max: 20 },
  C: { mean: 12.0, sd: 4.0, max: 20 },
  D: { mean: 6.5,  sd: 2.0, max: 10 },
  TOTAL: { mean: 38.5, sd: 10.0, max: 70 },
};

// ============ UTIL STATISTIK ============
function scoreToTScore(raw: number, mean: number, sd: number): number {
  return 50 + 10 * ((raw - mean) / sd);
}

// T-score → IQ (mean 100, SD 15)
function tScoreToIQ(t: number): number {
  return 100 + 15 * ((t - 50) / 10);
}

// Aproksimasi CDF normal (Abramowitz-Stegun)
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

function tToPercentile(t: number): number {
  const z = (t - 50) / 10;
  return Math.round(normalCDF(z) * 1000) / 10;
}

// ============ KATEGORI ============
function tCategory(t: number): string {
  if (t >= 70) return "Sangat Tinggi";
  if (t >= 60) return "Tinggi";
  if (t >= 50) return "Di Atas Rata-rata";
  if (t >= 40) return "Rata-rata";
  if (t >= 30) return "Di Bawah Rata-rata";
  return "Rendah";
}

function iqCategory(iq: number): string {
  if (iq >= 130) return "Sangat Superior";
  if (iq >= 120) return "Superior";
  if (iq >= 110) return "Di Atas Rata-rata";
  if (iq >= 90)  return "Rata-rata";
  if (iq >= 80)  return "Di Bawah Rata-rata";
  if (iq >= 70)  return "Borderline";
  return "Sangat Rendah";
}

function iqDescription(iq: number): string {
  if (iq >= 130) return "Kecerdasan umum sangat superior; kemampuan analisis dan pemecahan masalah kompleks di atas 98% populasi.";
  if (iq >= 120) return "Kecerdasan umum superior; mampu menangani masalah abstrak dan kompleks dengan sangat baik.";
  if (iq >= 110) return "Kecerdasan umum di atas rata-rata; cepat memahami pola dan konsep baru.";
  if (iq >= 90)  return "Kecerdasan umum pada level rata-rata; mampu menyelesaikan tugas analitis standar.";
  if (iq >= 80)  return "Kecerdasan umum di bawah rata-rata; memerlukan pendampingan pada tugas analitis kompleks.";
  if (iq >= 70)  return "Kecerdasan umum borderline; disarankan pendampingan intensif pada tugas penalaran.";
  return "Kecerdasan umum sangat rendah; membutuhkan dukungan khusus dalam tugas penalaran.";
}

// ============ KELEBIHAN & KELEMAHAN ============
type SubtestInfo = {
  code: string;
  name: string;
  raw: number;
  max: number;
  t: number;
  category: string;
  pct: number;
};

function deriveStrengthsWeaknesses(subs: SubtestInfo[]): {
  kelebihan: string[];
  kelemahan: string[];
  rekomendasi: string[];
} {
  const kelebihan: string[] = [];
  const kelemahan: string[] = [];
  const rekomendasi: string[] = [];

  const STRENGTH_TEMPLATES: Record<string, string[]> = {
    A: [
      "Kemampuan verbal kuat: mudah memahami bacaan kompleks, menangkap nuansa makna, dan menyusun argumen.",
      "Cakap dalam analogi kata dan klasifikasi konsep — berguna untuk analisis dokumen & komunikasi tertulis.",
    ],
    B: [
      "Kemampuan numerik kuat: cepat dan akurat dalam perhitungan, deret angka, dan penalaran kuantitatif.",
      "Mampu mengolah data numerik dan menemukan pola angka dengan efisien.",
    ],
    C: [
      "Kemampuan spasial-perseptual kuat: baik dalam visualisasi, rotasi mental, dan pencerminan figur.",
      "Cepat menangkap hubungan ruang & bentuk — berguna untuk desain, navigasi, dan analisis visual.",
    ],
    D: [
      "Kemampuan analisa-sintesa kuat: mampu menghubungkan informasi, menyimpulkan, dan mengambil keputusan berbasis cerita.",
      "Logika praktis tajam — baik dalam menganalisis situasi kompleks dan menemukan akar masalah.",
    ],
  };

  const WEAKNESS_TEMPLATES: Record<string, string[]> = {
    A: [
      "Kemampuan verbal perlu diperkuat: latihan membaca kritis, analogi, dan klasifikasi kata.",
      "Perhatikan ketelitian dalam memahami hubungan makna antar kata.",
    ],
    B: [
      "Kemampuan numerik perlu diperkuat: latihan aritmatika, deret angka, dan estimasi cepat.",
      "Disarankan berlatih soal hitung dan pola angka secara rutin.",
    ],
    C: [
      "Kemampuan spasial perlu diperkuat: latihan rotasi mental, analogi figur, dan pencerminan.",
      "Perhatikan detail visual dan hubungan ruang pada gambar.",
    ],
    D: [
      "Kemampuan analisa-sintesa perlu diperkuat: latihan membaca cerita panjang, menyimpulkan, dan mengidentifikasi asumsi.",
      "Disarankan berlatih soal logika praktis dan studi kasus.",
    ],
  };

  const REKOM_TEMPLATES: Record<string, string[]> = {
    A: ["Ikuti pelatihan business writing & critical reading.", "Biasakan membuat ringkasan bacaan panjang."],
    B: ["Latihan mental math & analisis data dasar.", "Gunakan spreadsheet untuk melatih pola angka."],
    C: ["Latihan visual reasoning (puzzle, figural).", "Gunakan aplikasi latihan spasial 15 menit/hari."],
    D: ["Ikuti pelatihan problem solving & case study.", "Biasakan menulis kesimpulan dari bacaan panjang."],
  };

  // Hitung rata-rata T
  const avgT = subs.reduce((s, x) => s + x.t, 0) / subs.length;

  subs.forEach((s) => {
    const isStrength = s.t >= 55;
    const isWeakness = s.t <= 45;
    if (isStrength) {
      const idx = kelebihan.length % STRENGTH_TEMPLATES[s.code].length;
      kelebihan.push(STRENGTH_TEMPLATES[s.code][idx]);
    }
    if (isWeakness) {
      const idx = kelemahan.length % WEAKNESS_TEMPLATES[s.code].length;
      kelemahan.push(WEAKNESS_TEMPLATES[s.code][idx]);
      const ridx = rekomendasi.length % REKOM_TEMPLATES[s.code].length;
      rekomendasi.push(REKOM_TEMPLATES[s.code][ridx]);
    }
  });

  // Fallback jika semua merata
  if (kelebihan.length === 0) {
    kelebihan.push("Profil kemampuan relatif merata; tidak ada keunggulan mencolok pada satu subtes.");
  }
  if (kelemahan.length === 0) {
    kelemahan.push("Tidak ditemukan kelemahan signifikan; kemampuan relatif seimbang di semua subtes.");
  }
  // Rekomendasi umum
  if (rekomendasi.length === 0) {
    rekomendasi.push("Pertahankan latihan kognitif rutin untuk menjaga performa penalaran.");
  }

  return { kelebihan, kelemahan, rekomendasi };
}

// ============ HANDLER ============
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const body = await req.json();
    const { projectId, participantId, answers } = body || {};

    if (!projectId || !participantId || !Array.isArray(answers)) {
      return json({ success: false, error: "projectId, participantId, answers wajib diisi" }, 400);
    }
    if (answers.length !== 70) {
      return json({ success: false, error: `Jumlah jawaban harus 70, diterima ${answers.length}` }, 400);
    }

    // Susun kode item
    const codes: string[] = [];
    for (let i = 1; i <= 20; i++) codes.push("A" + String(i).padStart(2, "0"));
    for (let i = 1; i <= 20; i++) codes.push("B" + String(i).padStart(2, "0"));
    for (let i = 1; i <= 20; i++) codes.push("C" + String(i).padStart(2, "0"));
    for (let i = 1; i <= 10; i++) codes.push("D" + String(i).padStart(2, "0"));

    // Hitung skor per subtes + detail
    const perSubtest: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    const detail: Array<{ code: string; selected: string | null; key: string; correct: boolean }> = [];

    answers.forEach((ans: string | null, idx: number) => {
      const code = codes[idx];
      const key = ANSWER_KEY[code];
      const sub = code[0];
      const correct = ans === key;
      if (correct) perSubtest[sub] += 1;
      detail.push({ code, selected: ans, key, correct });
    });

    // Subtest info + T-score
    const subs: SubtestInfo[] = [
      { code: "A", name: "Verbal",         raw: perSubtest.A, max: 20, t: 0, category: "", pct: 0 },
      { code: "B", name: "Numerik",        raw: perSubtest.B, max: 20, t: 0, category: "", pct: 0 },
      { code: "C", name: "Spasial",        raw: perSubtest.C, max: 20, t: 0, category: "", pct: 0 },
      { code: "D", name: "Analisa-Sintesa", raw: perSubtest.D, max: 10, t: 0, category: "", pct: 0 },
    ];

    subs.forEach((s) => {
      const n = NORMS[s.code as keyof typeof NORMS];
      s.t = Math.round(scoreToTScore(s.raw, n.mean, n.sd) * 10) / 10;
      s.pct = Math.round((s.raw / s.max) * 1000) / 10;
      s.category = tCategory(s.t);
    });

    const totalRaw = subs.reduce((sum, s) => sum + s.raw, 0);
    const tTotal = Math.round(scoreToTScore(totalRaw, NORMS.TOTAL.mean, NORMS.TOTAL.sd) * 10) / 10;
    const iqEstimate = Math.round(tScoreToIQ(tTotal) * 10) / 10;
    const iqPct = tToPercentile(tTotal);

    const { kelebihan, kelemahan, rekomendasi } = deriveStrengthsWeaknesses(subs);

    // Payload hasil lengkap
    const result = {
      success: true,
      perSubtest,
      maxPerSubtest: MAX_PER_SUBTEST,
      raw: {
        verbal: subs[0].raw, numerik: subs[1].raw,
        spasial: subs[2].raw, analisa: subs[3].raw,
        total: totalRaw,
      },
      tScore: {
        verbal: subs[0].t, numerik: subs[1].t,
        spasial: subs[2].t, analisa: subs[3].t,
        total: tTotal,
      },
      kategori: {
        verbal: subs[0].category, numerik: subs[1].category,
        spasial: subs[2].category, analisa: subs[3].category,
        total: tCategory(tTotal),
      },
      iq: {
        value: iqEstimate,
        category: iqCategory(iqEstimate),
        percentile: iqPct,
        description: iqDescription(iqEstimate),
        tScore: tTotal,
        rawTotal: totalRaw,
      },
      kelebihan,
      kelemahan,
      rekomendasi,
      detail,
      skoringVersion: "v3-70item",
      normaVersion: "placeholder-2025",
      disclaimer: "IQ estimasi ini adalah estimasi berbasis tes penalaran khusus, BUKAN diagnosis IQ klinis. Untuk diagnosis resmi, konsultasikan dengan psikolog berlisensi.",
      generatedAt: new Date().toISOString(),
    };

    // ============ SIMPAN KE SUPABASE (opsional) ============
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

      // Ambil nama peserta
      let participantName: string | null = null;
      const { data: pRow } = await supabase.from("participants").select("name, full_name, email").eq("id", participantId).maybeSingle();
      if (pRow) participantName = pRow.name || pRow.full_name || pRow.email || null;

      const assessmentIndex = Number(body.assessmentIndex ?? 0);
      const assessmentCode  = String(body.assessmentCode ?? "TPDK").toUpperCase();
      const assessmentId    = body.assessmentId || null;

      await supabase.from("tpdk_results").upsert({
        project_id: projectId,
        participant_id: participantId,
        participant_name: participantName,
        assessment_index: assessmentIndex,
        assessment_code: assessmentCode,
        assessment_name: "Tes Penalaran Khusus",
        result_type: "TPDK",

        raw_verbal: result.raw.verbal,
        raw_numerik: result.raw.numerik,
        raw_spasial: result.raw.spasial,
        raw_analisa: result.raw.analisa,
        raw_total: result.raw.total,

        t_verbal: result.tScore.verbal,
        t_numerik: result.tScore.numerik,
        t_spasial: result.tScore.spasial,
        t_analisa: result.tScore.analisa,
        t_total: result.tScore.total,

        iq_estimate: result.iq.value,
        iq_category: result.iq.category,
        iq_percentile: result.iq.percentile,
        iq_description: result.iq.description,

        kategori_verbal: result.kategori.verbal,
        kategori_numerik: result.kategori.numerik,
        kategori_spasial: result.kategori.spasial,
        kategori_analisa: result.kategori.analisa,

        kelebihan: result.kelebihan,
        kelemahan: result.kelemahan,
        rekomendasi: result.rekomendasi,

        detail_jawaban: result.detail,
        skoring_version: result.skoringVersion,
        norma_version: result.normaVersion,
        disclaimer: result.disclaimer,
        submitted_at: new Date().toISOString(),
      }, { onConflict: "project_id,participant_id,assessment_index,assessment_code" });

      console.log(`[TPDK v3] Saved result IQ=${iqEstimate} for ${participantId}`);
    } catch (dbErr) {
      console.error("[TPDK v3] DB save error:", dbErr);
      // Jangan gagalkan response jika hanya gagal simpan
    }

    return json(result, 200);

  } catch (err) {
    console.error("[calculate-tpdk-score v3] Error:", err);
    return json({ success: false, error: String((err as Error)?.message || err) }, 500);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}