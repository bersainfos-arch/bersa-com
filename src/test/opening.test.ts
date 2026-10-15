import { describe, expect, it } from "vitest";
import { openingPhase, OPENING_PHOTOS } from "@/lib/opening";
describe("Opening timing", () => {
  it("keeps the first phase for 4 seconds", () => {
    expect(openingPhase(0)).toBe("slogan");
    expect(openingPhase(3999)).toBe("slogan");
    expect(openingPhase(4000)).toBe("signature");
  });

  it("keeps the second phase for 4 seconds before signup", () => {
    expect(openingPhase(7999)).toBe("signature");
    expect(openingPhase(8000)).toBe("signup");
  });
  it("includes exactly 20 opening photos for the 5-minute rotation", () => {
    expect(OPENING_PHOTOS).toHaveLength(20);
  });
});
