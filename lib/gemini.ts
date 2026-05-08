// lib/gemini.ts
// Vertex AI client untuk RejectMe — handles roast streaming, bullet fix, dan survival scoring.

import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";
import { buildSystemPrompt, getPersona, type PersonaId } from "./personas";

// ── Client setup ──────────────────────────────────────────────────────────────

const vertex = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1",
});

const model = vertex.getGenerativeModel({
  model: "gemini-1.5-pro",
  safetySettings: [
    // Kita turunkan threshold biar persona bisa "galak" tanpa diblok
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
  generationConfig: {
    temperature: 0.8,      // Sedikit kreatif biar roast-nya tidak robotic
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
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    return result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "Gagal generate rewrite.";
  } catch (error) {
    console.error("[RejectMe] Fix bullet error:", error);
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

CV yang dinilai:
---
${req.cvText}
---`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,   // Lebih deterministik untuk scoring
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    const raw = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    // Strip markdown fences kalau ada
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as SurvivalScoreResult;

    // Validasi basic
    if (typeof parsed.total !== "number") {
      throw new Error("Invalid score format from Gemini");
    }

    return parsed;
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