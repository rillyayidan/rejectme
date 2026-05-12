// app/api/fix/route.ts
// Rewrite satu bullet point — dipanggil saat user klik tombol "Fix This".

import { type NextRequest, NextResponse } from "next/server";
import { fixBullet } from "@/lib/gemini";
import { type PersonaId } from "@/lib/personas";
import { isAuthFailure, requireFirebaseAuth } from "@/firebase/server-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export interface FixResponse {
  minimal: string;
  ideal: string;
  raw: string;
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFirebaseAuth(req);

    if (isAuthFailure(authResult)) {
      return authResult.response;
    }

    const body = await req.json();
    const { originalBullet, critiqueReason, personaId, targetRole } = body as {
      originalBullet: string;
      critiqueReason: string;
      personaId: PersonaId;
      targetRole: string;
    };

    // ── Validasi ──────────────────────────────────────────────────────────────
    if (!originalBullet || originalBullet.trim().length < 5) {
      return NextResponse.json(
        { error: "Bullet point terlalu pendek." },
        { status: 400 }
      );
    }
    if (!critiqueReason || critiqueReason.trim().length < 5) {
      return NextResponse.json(
        { error: "Critique reason harus diisi." },
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

    // ── Generate fix ──────────────────────────────────────────────────────────
    const raw = await fixBullet({
      originalBullet: originalBullet.trim(),
      critiqueReason: critiqueReason.trim(),
      personaId,
      targetRole: targetRole.trim(),
    });

    // Parse dua baris output: "MINIMAL: ..." dan "IDEAL: ..."
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    const minimalLine = lines.find((l) => l.toUpperCase().startsWith("MINIMAL:"));
    const idealLine = lines.find((l) => l.toUpperCase().startsWith("IDEAL:"));

    const minimal = minimalLine
      ? minimalLine.replace(/^MINIMAL:\s*/i, "").trim()
      : raw.trim();

    const ideal = idealLine
      ? idealLine.replace(/^IDEAL:\s*/i, "").trim()
      : raw.trim();

    return NextResponse.json<FixResponse>({ minimal, ideal, raw });
  } catch (error) {
    console.error("[/api/fix] Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbaiki bullet point. Coba lagi." },
      { status: 500 }
    );
  }
}
