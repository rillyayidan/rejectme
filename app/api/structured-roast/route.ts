// app/api/structured-roast/route.ts
// Generate roast terstruktur untuk CritiqueItem + Fix This.

import { type NextRequest, NextResponse } from "next/server";
import {
  cleanCVText,
  generateStructuredRoast,
} from "@/lib/gemini";
import { type PersonaId } from "@/lib/personas";
import type { StructuredRoastResult } from "@/lib/critique";
import { isAuthFailure, requireFirebaseAuth } from "@/firebase/server-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFirebaseAuth(req);

    if (isAuthFailure(authResult)) {
      return authResult.response;
    }

    const body = await req.json();

    const { cvText, personaId, targetRole, targetCompany, jobDescription } = body as {
      cvText: string;
      personaId: PersonaId;
      targetRole: string;
      targetCompany?: string;
      jobDescription?: string;
    };

    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json(
        { error: "CV terlalu pendek atau kosong. Minimal 50 karakter." },
        { status: 400 }
      );
    }

    if (!personaId || !["bumn", "startup", "corporate"].includes(personaId)) {
      return NextResponse.json(
        { error: "Persona tidak valid. Pilih: bumn, startup, atau corporate." },
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

    const structuredRoast = await generateStructuredRoast({
      cvText: cleanedCV,
      personaId,
      targetRole: targetRole.trim(),
      targetCompany: targetCompany?.trim(),
      jobDescription: jobDescription?.trim(),
    });

    return NextResponse.json<StructuredRoastResult>(structuredRoast);
  } catch (error) {
    console.error("[/api/structured-roast] Error:", error);

    return NextResponse.json(
      { error: "Gagal membuat structured roast. Coba lagi." },
      { status: 500 }
    );
  }
}
