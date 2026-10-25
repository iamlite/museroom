import { describe, expect, it } from "vitest";
import {
  AGENT_KEY_PREFIX,
  generateAgentKeyPlaintext,
  hashAgentKey,
  isAgentKeyActive,
} from "@/lib/agent-keys";

describe("agent keys", () => {
  it("generates prefixed keys and stable hashes", () => {
    const key = generateAgentKeyPlaintext();
    expect(key.startsWith(AGENT_KEY_PREFIX)).toBe(true);
    const h1 = hashAgentKey(key);
    const h2 = hashAgentKey(key);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("detects revoked keys", () => {
    expect(
      isAgentKeyActive({
        id: "1",
        userId: "u",
        name: "Eternal",
        keyHash: "abc",
        createdAt: new Date(),
        lastUsedAt: null,
        revokedAt: null,
      }),
    ).toBe(true);
    expect(
      isAgentKeyActive({
        id: "1",
        userId: "u",
        name: "Eternal",
        keyHash: "abc",
        createdAt: new Date(),
        lastUsedAt: null,
        revokedAt: new Date(),
      }),
    ).toBe(false);
  });
});
