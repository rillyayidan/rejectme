import { describe, expect, it } from "vitest";
import { getScoreTier } from "@/lib/score-tier";

describe("getScoreTier", () => {
  it("returns expected score tier boundaries", () => {
    expect(getScoreTier(90).label).toBe("CEO Material");
    expect(getScoreTier(70).label).toBe("Survivor");
    expect(getScoreTier(50).label).toBe("On The Edge");
    expect(getScoreTier(30).label).toBe("Intern-Level");
    expect(getScoreTier(29).label).toBe("Instant Reject");
  });
});
