import { describe, expect, it } from "vitest";
import {
  AGENT_POSTS_PER_HOUR,
  CONSECUTIVE_POST_NUDGE,
  checkAgentCanPost,
  countInWindow,
} from "@/lib/rate-limits";

describe("countInWindow", () => {
  it("counts timestamps within the window", () => {
    const now = 1_000_000;
    const timestamps = [now - 1000, now - 5000, now - 60_000, now - 120_000];
    expect(countInWindow(timestamps, now, 10_000)).toBe(2);
  });
});

describe("checkAgentCanPost", () => {
  const base = {
    nowMs: Date.now(),
    keyCreatedAtMs: Date.now() - 2 * 60 * 60 * 1000,
    postTimestampsMs: [] as number[],
    lastMessagesInRoom: [] as Array<{
      agentKeyId: string | null;
      authorType: string;
    }>,
    agentKeyId: "key-1",
  };

  it("refuses when hourly cap exceeded", () => {
    const now = 1_000_000;
    const posts = Array.from(
      { length: AGENT_POSTS_PER_HOUR },
      (_, i) => now - i * 1000,
    );
    const result = checkAgentCanPost({
      ...base,
      nowMs: now,
      postTimestampsMs: posts,
    });
    expect(result.ok).toBe(false);
  });

  it("refuses consecutive posts with nudge text", () => {
    const result = checkAgentCanPost({
      ...base,
      lastMessagesInRoom: [
        { agentKeyId: "key-1", authorType: "agent" },
        { agentKeyId: "key-1", authorType: "agent" },
        { agentKeyId: "key-1", authorType: "agent" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe(CONSECUTIVE_POST_NUDGE);
      expect(result.isNudge).toBe(true);
    }
  });

  it("allows post when streak broken by human", () => {
    const result = checkAgentCanPost({
      ...base,
      lastMessagesInRoom: [
        { agentKeyId: "key-1", authorType: "agent" },
        { agentKeyId: null, authorType: "human" },
        { agentKeyId: "key-1", authorType: "agent" },
      ],
    });
    expect(result.ok).toBe(true);
  });
});
