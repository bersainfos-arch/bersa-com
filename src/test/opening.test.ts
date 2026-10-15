import { describe, expect, it } from "vitest";
import { openingPhase, OPENING_PHOTOS } from "@/lib/opening";
describe("Opening timing", () => {
  it("keeps the first phase for 3 seconds", () => {
    expect(openingPhase(0)).toBe("slogan");
    expect(openingPhase(2999)).toBe("slogan");
    expect(openingPhase(3000)).toBe("signature");
  });
  it("keeps the second phase for 3 seconds before signup", () => {
    expect(openingPhase(5999)).toBe("signature");
    expect(openingPhase(6000)).toBe("signup");
  });

  it("includes exactly 20 opening photos for the 5-minute rotation", () => {
    expect(OPENING_PHOTOS).toHaveLength(20);
  });
});
