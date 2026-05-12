import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/firebase/server-auth", () => ({
  requireFirebaseAuth: vi.fn(),
  isAuthFailure: (result: unknown) =>
    Boolean(result && typeof result === "object" && "response" in result),
}));

vi.mock("@/lib/gemini", () => ({
  cleanCVText: vi.fn((value: string) => value.trim()),
  calculateSurvivalScore: vi.fn(),
}));

import { POST } from "@/app/api/score/route";
import { requireFirebaseAuth } from "@/firebase/server-auth";
import { calculateSurvivalScore } from "@/lib/gemini";

const mockedRequireFirebaseAuth = vi.mocked(requireFirebaseAuth);
const mockedCalculateSurvivalScore = vi.mocked(calculateSurvivalScore);

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/score", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("/api/score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 before validation when auth fails", async () => {
    mockedRequireFirebaseAuth.mockResolvedValue({
      response: Response.json({ error: "Login required." }, { status: 401 }),
    } as never);

    const response = await POST(makeRequest({}) as never);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Login required." });
    expect(mockedCalculateSurvivalScore).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid request bodies after auth succeeds", async () => {
    mockedRequireFirebaseAuth.mockResolvedValue({
      decodedToken: { uid: "user-1" },
    } as never);

    const response = await POST(
      makeRequest({
        cvText: "too short",
        personaId: "startup",
        targetRole: "FE",
      }) as never
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "CV terlalu pendek atau kosong.",
    });
    expect(mockedCalculateSurvivalScore).not.toHaveBeenCalled();
  });
});
