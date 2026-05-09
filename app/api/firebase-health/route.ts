// app/api/firebase-health/route.ts
// Endpoint internal untuk mengecek Firebase Admin sudah connect atau belum.

import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const testRef = adminDb.collection("_health").doc("firebase-admin");

    await testRef.set(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        source: "RejectMe Firebase Admin health check",
      },
      { merge: true }
    );

    const snapshot = await testRef.get();

    return NextResponse.json({
      ok: true,
      message: "Firebase Admin connected.",
      data: snapshot.data(),
    });
  } catch (error) {
    console.error("[/api/firebase-health] Error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Firebase Admin error",
      },
      { status: 500 }
    );
  }
}