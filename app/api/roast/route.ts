// app/api/roast/route.ts
// Streaming endpoint — roast muncul kata per kata di frontend.

import { type NextRequest, NextResponse } from "next/server";
import { streamRoast, cleanCVText } from "@/lib/gemini";
import { type PersonaId } from "@/lib/personas";

export const runtime = "nodejs";
export const maxDuration = 60; // Vertex AI bisa lambat di cold start

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cvText, personaId, targetRole, targetCompany } = body as {
      cvText: string;
      personaId: PersonaId;
      targetRole: string;
      targetCompany?: string;
    };

    // ── Validasi input ────────────────────────────────────────────────────────
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

    // ── Stream roast ──────────────────────────────────────────────────────────
    const cleanedCV = cleanCVText(cvText);
    const roastStream = await streamRoast({
      cvText: cleanedCV,
      personaId,
      targetRole: targetRole.trim(),
      targetCompany: targetCompany?.trim(),
    });

    return new Response(roastStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
        // Disable buffering di Nginx/Cloud Run biar stream langsung sampai ke client
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[/api/roast] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal. Coba lagi dalam beberapa detik." },
      { status: 500 }
    );
  }
}