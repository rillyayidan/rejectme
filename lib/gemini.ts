// lib/gemini.ts
// Vertex AI client untuk RejectMe — handles roast streaming, bullet fix, dan survival scoring.

import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";
import { jsonrepair } from "jsonrepair";
import { buildSystemPrompt, getPersona, type PersonaId } from "./personas";
import type { StructuredRoastResult } from "@/lib/critique";

// ── Client setup ──────────────────────────────────────────────────────────────

const vertex = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1",
});

const model = vertex.getGenerativeModel({
  model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
  generationConfig: {
    temperature: 0.8,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RoastRequest {
  cvText: string;
  personaId: PersonaId;
  targetRole: string;
  targetCompany?: string;
}

export interface FixRequest {
  originalBullet: string;
  critiqueReason: string;
  personaId: PersonaId;
  targetRole: string;
}

export interface ScoreRequest {
  cvText: string;
  personaId: PersonaId;
  targetRole: string;
}

export interface SurvivalScoreResult {
  total: number;
  breakdown: {
    ats_readability: number;
    role_match: number;
    recruiter_clarity: number;
    impact_proof: number;
    red_flag_penalty: number;
  };
  verdict: string;
  top_issues: string[];
  quick_wins: string[];
}

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Stream roast dari Gemini — returns ReadableStream untuk Next.js streaming response.
 * Tiap chunk adalah text partial dari roast.
 */
export async function streamRoast(req: RoastRequest): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = buildSystemPrompt(req.personaId, req.targetRole, req.targetCompany);
  const persona = getPersona(req.personaId);

  const userMessage = `Berikut adalah CV yang perlu kamu review:

---
${req.cvText}
---

Berikan roast yang jujur, spesifik, dan actionable sesuai standar kamu sebagai ${persona.title} di ${persona.company_type}.
Ingat: setiap kritik harus menyebut bagian spesifik dari CV ini, bukan generik.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const streamingResult = await model.generateContentStream({
          systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
        });

        for await (const chunk of streamingResult.stream) {
          const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();
      } catch (error) {
        console.error("[RejectMe] Gemini streaming error:", error);
        controller.enqueue(
          encoder.encode(
            "\n\n[Error: Gagal mendapatkan feedback dari AI. Coba lagi dalam beberapa detik.]"
          )
        );
        controller.close();
      }
    },
  });

  return stream;
}

function parseGeminiJson<T>(raw: string): T {
  const withoutFence = raw.replace(/```json|```/g, "").trim();

  const jsonMatch = withoutFence.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : withoutFence;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const repaired = jsonrepair(candidate);
    return JSON.parse(repaired) as T;
  }
}

function getErrorText(error: unknown): string {
  if (!error) return "";

  if (error instanceof Error) {
    const cause = "cause" in error ? String(error.cause) : "";

    return [
      error.name,
      error.message,
      error.stack,
      cause,
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  return String(error).toLowerCase();
}

function isRetryableGeminiError(error: unknown) {
  const message = getErrorText(error);

  return (
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("too many requests") ||
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("fetch failed") ||
    message.includes("headers timeout") ||
    message.includes("und_err_headers_timeout") ||
    message.includes("socket") ||
    message.includes("timeout")
  );
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function withGeminiRetry<T>(
  operation: () => Promise<T>,
  label: string,
  maxRetries = 2,
  timeoutMs = 25000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(operation(), timeoutMs, label);
    } catch (error) {
      lastError = error;

      if (!isRetryableGeminiError(error) || attempt === maxRetries) {
        throw error;
      }

      const delayMs =
        1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 500);

      console.warn(
        `[RejectMe] ${label} hit retryable Gemini error. Retrying in ${delayMs}ms... attempt ${
          attempt + 1
        }/${maxRetries}`
      );

      await sleep(delayMs);
    }
  }

  throw lastError;
}

function normalizeStructuredRoast(
  parsed: StructuredRoastResult,
  req: RoastRequest
): StructuredRoastResult {
  return {
    personaId: parsed.personaId ?? req.personaId,
    targetRole: parsed.targetRole ?? req.targetRole,
    targetCompany: parsed.targetCompany ?? req.targetCompany,
    overall_impression: parsed.overall_impression ?? "",
    verdict: parsed.verdict ?? "",
    critiques: Array.isArray(parsed.critiques) ? parsed.critiques : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    quick_wins: Array.isArray(parsed.quick_wins) ? parsed.quick_wins : [],
    survival_score_hint: parsed.survival_score_hint ?? {
      estimated_total: 0,
      weakest_dimension: "impact_proof",
      strongest_dimension: "role_match",
    },
  };
}

function normalizeSurvivalScoreResult(
  parsed: SurvivalScoreResult
): SurvivalScoreResult {
  return {
    total: typeof parsed.total === "number" ? parsed.total : 0,
    breakdown: {
      ats_readability:
        typeof parsed.breakdown?.ats_readability === "number"
          ? parsed.breakdown.ats_readability
          : 0,
      role_match:
        typeof parsed.breakdown?.role_match === "number"
          ? parsed.breakdown.role_match
          : 0,
      recruiter_clarity:
        typeof parsed.breakdown?.recruiter_clarity === "number"
          ? parsed.breakdown.recruiter_clarity
          : 0,
      impact_proof:
        typeof parsed.breakdown?.impact_proof === "number"
          ? parsed.breakdown.impact_proof
          : 0,
      red_flag_penalty:
        typeof parsed.breakdown?.red_flag_penalty === "number"
          ? parsed.breakdown.red_flag_penalty
          : 0,
    },
    verdict: parsed.verdict ?? "Belum ada verdict.",
    top_issues: Array.isArray(parsed.top_issues) ? parsed.top_issues : [],
    quick_wins: Array.isArray(parsed.quick_wins) ? parsed.quick_wins : [],
  };
}

/**
 * Generate structured critique — dipakai untuk fitur CritiqueItem + Fix This.
 * Berbeda dari streamRoast:
 * - streamRoast = pengalaman dramatis text panjang
 * - generateStructuredRoast = data terstruktur untuk UI interaktif
 */
export async function generateStructuredRoast(
  req: RoastRequest
): Promise<StructuredRoastResult> {
  const persona = getPersona(req.personaId);

  const prompt = `Kamu adalah ${persona.name}, ${persona.title} di ${persona.company_type}.
Kandidat apply sebagai: ${req.targetRole}${req.targetCompany ? ` di ${req.targetCompany}` : ""}.

Analisis CV berikut dengan standar persona kamu.

CV:
---
${req.cvText}
---

Berikan response HANYA dalam JSON valid.
Jangan pakai markdown.
Jangan pakai backticks.
Jangan menulis newline di dalam string.
Jangan memakai tanda kutip ganda di dalam value string; gunakan tanda kutip tunggal jika perlu.
Pastikan semua string tertutup dengan benar.

Schema JSON:
{
  "personaId": "${req.personaId}",
  "targetRole": "${req.targetRole}",
  "targetCompany": ${req.targetCompany ? `"${req.targetCompany}"` : "null"},
  "overall_impression": "kesan pertama 1-2 kalimat",
  "verdict": "keputusan singkat apakah CV ini layak lanjut atau tidak",
  "critiques": [
    {
      "id": "critique-1",
      "category": "ats_readability | role_match | recruiter_clarity | impact_proof | red_flag | formatting | language | missing_info",
      "severity": "low | medium | high | fatal",
      "quoted_text": "quote spesifik dari CV yang bermasalah. Kalau masalahnya info hilang, tulis nama info yang hilang, contoh: IPK tidak dicantumkan",
      "issue": "masalah utama",
      "reason": "kenapa ini masalah menurut persona kamu",
      "suggestion": "saran perbaikan yang actionable",
      "fixable": true
    }
  ],
  "strengths": ["hal yang sudah baik"],
  "quick_wins": ["perbaikan cepat"],
  "survival_score_hint": {
    "estimated_total": 0,
    "weakest_dimension": "ats_readability | role_match | recruiter_clarity | impact_proof | red_flag | formatting | language | missing_info",
    "strongest_dimension": "ats_readability | role_match | recruiter_clarity | impact_proof | red_flag | formatting | language | missing_info"
  }
}

Aturan penting:
- critiques harus berisi 4 sampai 8 item.
- Setiap critique harus spesifik ke isi CV.
- quoted_text wajib mengutip bagian nyata dari CV jika tersedia.
- Jangan membuat data palsu.
- fixable bernilai true hanya kalau AI bisa membantu rewrite text tersebut.
- Untuk missing info seperti tidak ada IPK/foto/link portfolio, fixable harus false.
- estimated_total harus angka 0-100.
- Gunakan bahasa Indonesia sesuai gaya persona.`;

  try {
    const result = await withGeminiRetry(
      () =>
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      "Structured roast"
    );

    const raw = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: StructuredRoastResult;

    try {
      parsed = parseGeminiJson<StructuredRoastResult>(raw);
    } catch (parseError) {
      console.error("[RejectMe] Failed to parse structured roast JSON.");
      console.error("[RejectMe] Raw Gemini output:", raw);
      throw parseError;
    }

    const normalized = normalizeStructuredRoast(parsed, req);

    if (!Array.isArray(normalized.critiques)) {
      throw new Error("Invalid structured roast format: critiques missing");
    }

    return normalized;
  } catch (error) {
    console.error("[RejectMe] Structured roast error:", error);
    throw new Error("Gagal membuat analisis terstruktur. Coba lagi.");
  }
}

function createFallbackFixBullet(req: FixRequest): string {
  const cleanedBullet = req.originalBullet.trim().replace(/^[-•]\s*/, "");

  return [
    `MINIMAL: ${cleanedBullet}`,
    `IDEAL: Mengoptimalkan ${cleanedBullet.toLowerCase()} untuk mendukung target role ${req.targetRole}, dengan menambahkan konteks, kontribusi spesifik, dan hasil terukur seperti [metric] dalam [periode].`,
  ].join("\n");
}

/**
 * Fix satu bullet point — returns teks rewrite langsung (non-streaming).
 * Dipakai untuk tombol "Fix This" di CV editor.
 */
export async function fixBullet(req: FixRequest): Promise<string> {
  const persona = getPersona(req.personaId);

  const prompt = `Kamu adalah ${persona.name}, ${persona.title} di ${persona.company_type}.

Kandidat punya bullet point ini di CV-nya (apply sebagai ${req.targetRole}):
"${req.originalBullet}"

Masalah yang kamu temukan: ${req.critiqueReason}

Tulis ulang bullet point ini agar menjadi lebih kuat sesuai standar kamu.
Berikan TEPAT 2 versi rewrite:
1. MINIMAL FIX: Perbaikan kecil yang tetap akurat tanpa asumsi data baru
2. IDEAL VERSION: Versi terbaik dengan template [Achievement] + [Action] + [Result/Metric]

Format output:
MINIMAL: [rewrite minimal]
IDEAL: [rewrite ideal dengan placeholder metric jika perlu, contoh: "meningkatkan X sebesar [N]%"]

Jangan tambahkan penjelasan lain. Hanya dua baris output.`;

  try {
    const result = await withGeminiRetry(
      () =>
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 384,
          },
        }),
      "Fix bullet",
      2,
      18000
    );

    return result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "Gagal generate rewrite.";
  } catch (error) {
    console.error("[RejectMe] Fix bullet error:", error);

    if (isRetryableGeminiError(error)) {
      return createFallbackFixBullet(req);
    }

    throw new Error("Gagal memperbaiki bullet point. Coba lagi.");
  }
}

/**
 * Hitung Survival Score — returns JSON dengan breakdown per dimensi.
 * Dipanggil setelah roast selesai, atau setelah user edit CV.
 */
export async function calculateSurvivalScore(req: ScoreRequest): Promise<SurvivalScoreResult> {
  const persona = getPersona(req.personaId);

  const prompt = `Kamu adalah ${persona.name}, ${persona.title} di ${persona.company_type}.
Kandidat apply sebagai: ${req.targetRole}

Nilai CV ini dengan rubrik spesifikmu. Berikan response HANYA dalam format JSON berikut (tidak ada teks lain):

{
  "total": [0-100, integer],
  "breakdown": {
    "ats_readability": [0-100, seberapa mudah CV ini dibaca sistem ATS],
    "role_match": [0-100, seberapa cocok dengan role ${req.targetRole}],
    "recruiter_clarity": [0-100, dalam 7 detik recruiter bisa ngerti profil kandidat?],
    "impact_proof": [0-100, seberapa banyak achievement yang punya angka/metric nyata],
    "red_flag_penalty": [0-100, 100 = tidak ada red flag, 0 = banyak red flag serius]
  },
  "verdict": "[1-2 kalimat kenapa dapat skor ini]",
  "top_issues": ["issue 1", "issue 2", "issue 3"],
  "quick_wins": ["quick win 1", "quick win 2", "quick win 3"]
}

WAJIB:
- Field top_issues harus selalu ada dan berisi array string.
- Field quick_wins harus selalu ada dan berisi array string.
- Jangan mengubah nama field.
- Jangan pakai camelCase seperti topIssues atau quickWins.
- Response harus JSON valid tanpa markdown.

CV yang dinilai:
---
${req.cvText}
---`;

  try {
    const result = await withGeminiRetry(
      () =>
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      "Score calculation"
    );

    const raw = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: SurvivalScoreResult;

    try {
      parsed = parseGeminiJson<SurvivalScoreResult>(raw);
    } catch (parseError) {
      console.error("[RejectMe] Failed to parse score JSON.");
      console.error("[RejectMe] Raw score output:", raw);
      throw parseError;
    }

    const normalized = normalizeSurvivalScoreResult(parsed);

    if (typeof normalized.total !== "number") {
      throw new Error("Invalid score format from Gemini");
    }

    return normalized;
  } catch (error) {
    console.error("[RejectMe] Score calculation error:", error);
    // Fallback score kalau Gemini gagal
    return {
      total: 0,
      breakdown: {
        ats_readability: 0,
        role_match: 0,
        recruiter_clarity: 0,
        impact_proof: 0,
        red_flag_penalty: 50,
      },
      verdict: "Gagal menghitung skor. Coba lagi.",
      top_issues: ["Terjadi error saat analisis CV."],
      quick_wins: ["Coba refresh dan upload ulang CV kamu."],
    };
  }
}

/**
 * Utility: ekstrak teks dari CV yang sudah di-parse PDF.js
 * Bersihkan whitespace berlebih dan formatting artifacts.
 */
export function cleanCVText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, "\n")           // normalize line endings
    .replace(/\n{3,}/g, "\n\n")       // max 2 newlines berurutan
    .replace(/[ \t]{2,}/g, " ")       // multiple spaces jadi satu
    .replace(/^\s+|\s+$/g, "")        // trim
    .slice(0, 8000);                  // limit 8000 chars biar tidak makan token berlebihan
}