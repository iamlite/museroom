import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("roundtrips verify", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct");
    const ok = await verifyPassword("correct horse battery staple", hash);
    expect(ok).toBe(true);
    const bad = await verifyPassword("wrong", hash);
    expect(bad).toBe(false);
  });
});
