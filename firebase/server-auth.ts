import { type DecodedIdToken } from "firebase-admin/auth";
import { type NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/firebase/admin";

export type FirebaseAuthResult =
  | { decodedToken: DecodedIdToken }
  | { response: NextResponse<{ error: string }> };

export async function requireFirebaseAuth(
  req: NextRequest
): Promise<FirebaseAuthResult> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      response: NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return {
      response: NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      ),
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    return { decodedToken };
  } catch (error) {
    console.warn("[requireFirebaseAuth] Invalid Firebase ID token:", error);

    return {
      response: NextResponse.json(
        { error: "Invalid or expired login. Please sign in again." },
        { status: 401 }
      ),
    };
  }
}

export function isAuthFailure(
  result: FirebaseAuthResult
): result is { response: NextResponse<{ error: string }> } {
  return "response" in result;
}
