// app/api/score/route.ts
// Hitung Survival Score - dipanggil setelah roast selesai, atau setelah user edit CV.

import { type NextRequest, NextResponse } from "next/server";
import {
  calculateSurvivalScore,
  cleanCVText,
  type SurvivalScoreResult,
} from "@/lib/gemini";
import { type PersonaId } from "@/lib/personas";
import { isAuthFailure, requireFirebaseAuth } from "@/firebase/server-auth";
import { getScoreTier, type ScoreTier } from "@/lib/score-tier";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFirebaseAuth(req);

    if (isAuthFailure(authResult)) {
      return authResult.response;
    }

    const body = await req.json();
    const { cvText, personaId, targetRole, jobDescription } = body as {
      cvText: string;
      personaId: PersonaId;
      targetRole: string;
      jobDescription?: string;
    };

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

    const cleanedCV = cleanCVText(cvText);
    const score = await calculateSurvivalScore({
      cvText: cleanedCV,
      personaId,
      targetRole: targetRole.trim(),
      jobDescription: jobDescription?.trim(),
    });

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
