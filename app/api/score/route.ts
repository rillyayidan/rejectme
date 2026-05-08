// app/api/score/route.ts
// Hitung Survival Score — dipanggil setelah roast selesai, atau setiap kali user edit CV.

import { type NextRequest, NextResponse } from "next/server";
import { calculateSurvivalScore, cleanCVText, type SurvivalScoreResult } from "@/lib/gemini";
import { type PersonaId } from "@/lib/personas";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cvText, personaId, targetRole } = body as {
      cvText: string;
      personaId: PersonaId;
      targetRole: string;
    };

    // ── Validasi ──────────────────────────────────────────────────────────────
    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json(
        { error: "CV terlalu pendek atau kosong." },
        { status: 400 }
      );
    }
    if (!personaId || !["bumn", "startup", "corporate"].includes(personaId)) {
      return NextResponse.json(
        { error: "Persona tidak valid." },
        { status: 400 }
      );
    }
    if (!targetRole || targetRole.trim().length < 2) {
      return NextResponse.json(
        { error: "Target role harus diisi." },
        { status: 400 }
      );
    }

    // ── Hitung score ──────────────────────────────────────────────────────────
    const cleanedCV = cleanCVText(cvText);
    const score = await calculateSurvivalScore({
      cvText: cleanedCV,
      personaId,
      targetRole: targetRole.trim(),
    });

    // Tambahkan label tier berdasarkan skor total
    const tier = getScoreTier(score.total);

    return NextResponse.json<SurvivalScoreResult & { tier: ScoreTier }>({
      ...score,
      tier,
    });
  } catch (error) {
    console.error("[/api/score] Error:", error);
    return NextResponse.json(
      { error: "Gagal menghitung skor. Coba lagi." },
      { status: 500 }
    );
  }
}

// ── Score tier labels ─────────────────────────────────────────────────────────

export type ScoreTier = {
  label: string;
  emoji: string;
  color: string;
  message: string;
};

function getScoreTier(score: number): ScoreTier {
  if (score >= 85) {
    return {
      label: "CEO Material",
      emoji: "🏆",
      color: "emerald",
      message: "CV kamu sangat kuat. Kemungkinan besar lolos screening pertama.",
    };
  }
  if (score >= 70) {
    return {
      label: "Survivor",
      emoji: "✅",
      color: "green",
      message: "CV kamu cukup baik, tapi masih ada beberapa hal yang bisa diperkuat.",
    };
  }
  if (score >= 50) {
    return {
      label: "On The Edge",
      emoji: "⚠️",
      color: "yellow",
      message: "CV kamu bisa lolos, tapi bersaing tipis. Perbaiki quick wins dulu.",
    };
  }
  if (score >= 30) {
    return {
      label: "Intern-Level",
      emoji: "📋",
      color: "orange",
      message: "Banyak hal fundamental yang perlu diperbaiki sebelum apply.",
    };
  }
  return {
    label: "Instant Reject",
    emoji: "🗑️",
    color: "red",
    message: "CV ini tidak akan bertahan 7 detik di tangan HRD. Mulai dari awal.",
  };
}