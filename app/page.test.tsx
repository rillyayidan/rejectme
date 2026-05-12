import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createRoastSession = vi.fn();
const updateRoastSession = vi.fn();

vi.mock("@/components/auth/LoginButton", () => ({
  LoginButton: () => <div>Logged in as Test User</div>,
}));

vi.mock("@/components/history/SessionHistory", () => ({
  SessionHistory: () => <div>No history in test</div>,
}));

vi.mock("@/firebase/use-current-user", () => ({
  useCurrentUser: () => ({
    user: {
      uid: "user-1",
      displayName: "Test User",
      email: "test@example.com",
      getIdToken: vi.fn().mockResolvedValue("token-1"),
    },
    isAuthLoading: false,
    isLoggedIn: true,
  }),
}));

vi.mock("@/firebase/sessions", () => ({
  createRoastSession: (...args: unknown[]) => createRoastSession(...args),
  updateRoastSession: (...args: unknown[]) => updateRoastSession(...args),
}));

vi.mock("@/lib/pdf-parser", () => ({
  parsePdfToText: vi.fn(),
}));

import HomePage from "@/app/page";

function streamResponse(text: string) {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text));
        controller.close();
      },
    }),
    { status: 200 }
  );
}

describe("HomePage smoke flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRoastSession.mockResolvedValue("session-1");
    updateRoastSession.mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/api/roast")) {
          return streamResponse("Roast finished.");
        }

        if (url.endsWith("/api/score")) {
          return Response.json({
            total: 70,
            breakdown: {
              ats_readability: 70,
              role_match: 70,
              recruiter_clarity: 70,
              impact_proof: 70,
              red_flag_penalty: 70,
            },
            verdict: "Decent.",
            top_issues: ["Weak metrics"],
            quick_wins: ["Add numbers"],
            tier: {
              label: "Survivor",
              emoji: "",
              color: "green",
              message: "Good enough.",
            },
          });
        }

        if (url.endsWith("/api/structured-roast")) {
          return Response.json({
            personaId: "startup",
            targetRole: "Frontend Developer",
            overall_impression: "Specific but needs metrics.",
            verdict: "Improve bullets.",
            critiques: [
              {
                id: "critique-1",
                category: "impact_proof",
                severity: "high",
                quoted_text: "Managed social media campaigns",
                issue: "No measurable impact",
                reason: "The bullet lacks numbers.",
                suggestion: "Add scope and result.",
                fixable: true,
              },
            ],
            strengths: [],
            quick_wins: [],
            survival_score_hint: {
              estimated_total: 70,
              weakest_dimension: "impact_proof",
              strongest_dimension: "role_match",
            },
          });
        }

        if (url.endsWith("/api/fix")) {
          return Response.json({
            minimal: "Managed social media campaigns with weekly performance reporting",
            ideal:
              "Improved social media campaign performance by [N]% through weekly reporting and content iteration",
            raw: "MINIMAL: Managed social media campaigns with weekly performance reporting\nIDEAL: Improved social media campaign performance by [N]% through weekly reporting and content iteration",
          });
        }

        throw new Error(`Unexpected fetch: ${url}`);
      })
    );
  });

  it("runs a mocked roast, applies one rewrite, and exposes final CV copy", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.type(
      screen.getByPlaceholderText("Paste your CV text here..."),
      "Managed social media campaigns for a campus organization with content planning and reporting."
    );
    await user.type(
      screen.getByPlaceholderText("Example: Frontend Developer"),
      "Frontend Developer"
    );
    await user.type(
      screen.getByPlaceholderText(
        "Paste the job post requirements, responsibilities, or keywords..."
      ),
      "Requires measurable campaign impact and product sense."
    );

    await user.click(screen.getByRole("button", { name: /roast my cv/i }));

    expect(await screen.findByText("Roast finished.")).toBeInTheDocument();
    expect(await screen.findByText("No measurable impact")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /fix this/i }));
    expect(await screen.findByText("AI Rewrite Suggestion")).toBeInTheDocument();

    const minimalSection = screen
      .getByText("Minimal Fix")
      .closest("div") as HTMLElement;
    await user.click(
      within(minimalSection).getByRole("button", { name: /apply minimal/i })
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /copy final cv/i })).toBeInTheDocument();
    });

    expect(screen.getByText("Fixed Critiques")).toBeInTheDocument();
    expect(updateRoastSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-1",
        fixedCritiqueIds: ["critique-1"],
      })
    );
  });
});
