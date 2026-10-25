import { describe, expect, it } from "vitest";
import { formatMessageAuthorLabel } from "@/lib/format";

describe("formatMessageAuthorLabel", () => {
  it("shows persona name without via owner", () => {
    expect(
      formatMessageAuthorLabel({
        authorType: "agent",
        username: "tariel",
        agentName: "Muse Guide",
        personaId: "p1",
      }),
    ).toBe("Muse Guide");
  });

  it("keeps via owner for normal agent posts", () => {
    expect(
      formatMessageAuthorLabel({
        authorType: "agent",
        username: "tariel",
        agentName: "Eternal",
        personaId: null,
      }),
    ).toBe("Eternal (via @tariel)");
  });
});
