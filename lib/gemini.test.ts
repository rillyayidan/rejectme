import { describe, expect, it, vi } from "vitest";

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: vi.fn(),
      generateContentStream: vi.fn(),
    };
  },
  HarmBlockThreshold: {
    BLOCK_ONLY_HIGH: "BLOCK_ONLY_HIGH",
    BLOCK_MEDIUM_AND_ABOVE: "BLOCK_MEDIUM_AND_ABOVE",
  },
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
    HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
    HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT",
    HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  },
}));

import {
  cleanCVText,
  normalizeStructuredRoast,
  normalizeSurvivalScoreResult,
  parseGeminiJson,
} from "@/lib/gemini";

describe("Gemini helpers", () => {
  it("cleans CV text without exceeding the token guard limit", () => {
    const raw = `  Line one\r\n\r\n\r\nLine    two\t\tthree  ${"x".repeat(9000)}`;
    const cleaned = cleanCVText(raw);

    expect(cleaned).toContain("Line one\n\nLine two three");
    expect(cleaned.length).toBeLessThanOrEqual(8000);
    expect(cleaned).toBe(cleaned.trim());
  });

  it("parses fenced and repairable JSON", () => {
    expect(parseGeminiJson<{ ok: boolean }>("```json\n{\"ok\": true}\n```")).toEqual({
      ok: true,
    });

    expect(parseGeminiJson<{ ok: boolean }>("{ok:true}")).toEqual({
      ok: true,
    });
  });

  it("normalizes structured roast arrays and defaults", () => {
    const normalized = normalizeStructuredRoast(
      {
        personaId: "startup",
        targetRole: "Frontend Developer",
        overall_impression: "Needs focus.",
        verdict: "Needs work.",
        critiques: [],
        strengths: "not-array" as never,
        quick_wins: "not-array" as never,
        survival_score_hint: undefined as never,
      },
      {
        cvText: "A".repeat(60),
        personaId: "corporate",
        targetRole: "Product Manager",
        targetCompany: "Acme",
      }
    );

    expect(normalized.personaId).toBe("startup");
    expect(normalized.targetCompany).toBe("Acme");
    expect(normalized.strengths).toEqual([]);
    expect(normalized.quick_wins).toEqual([]);
    expect(normalized.survival_score_hint.estimated_total).toBe(0);
  });

  it("normalizes survival score fallbacks", () => {
    const normalized = normalizeSurvivalScoreResult({
      total: 72,
      breakdown: undefined as never,
      verdict: "",
      top_issues: "bad" as never,
      quick_wins: undefined as never,
    });

    expect(normalized.total).toBe(72);
    expect(normalized.breakdown.red_flag_penalty).toBe(0);
    expect(normalized.top_issues).toEqual([]);
    expect(normalized.quick_wins).toEqual([]);
  });
});
