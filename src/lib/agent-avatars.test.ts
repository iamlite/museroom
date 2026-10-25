import { describe, expect, it } from "vitest";
import { parseAvatarUpload } from "@/lib/agent-avatars";

const PNG_1X1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("parseAvatarUpload", () => {
  it("accepts a tiny PNG", () => {
    const result = parseAvatarUpload(PNG_1X1, "image/png");
    expect(result.ok).toBe(true);
  });

  it("rejects unknown content types", () => {
    const result = parseAvatarUpload(PNG_1X1, "image/gif");
    expect(result.ok).toBe(false);
  });
});
