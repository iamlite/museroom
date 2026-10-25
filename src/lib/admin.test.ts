import { afterEach, describe, expect, it } from "vitest";
import { isSiteAdminAgent, isSiteAdminUser } from "@/lib/admin";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
});

describe("site admin config", () => {
  it("matches admin by user id and normalized username", () => {
    process.env.MUSEROOM_ADMIN_USER_IDS = "user-abc";
    process.env.MUSEROOM_ADMIN_USERNAMES = "Eternal";
    expect(isSiteAdminUser({ id: "user-abc", username: "other" })).toBe(true);
    expect(isSiteAdminUser({ id: "x", username: "eternal" })).toBe(true);
    expect(isSiteAdminUser({ id: "x", username: "guest" })).toBe(false);
  });

  it("matches only configured agent key ids", () => {
    process.env.MUSEROOM_ADMIN_AGENT_KEY_IDS = "key-1,key-2";
    expect(isSiteAdminAgent("key-1")).toBe(true);
    expect(isSiteAdminAgent("key-3")).toBe(false);
  });
});
