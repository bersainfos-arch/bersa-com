import { describe, expect, it } from "vitest";
import { openingPhase } from "@/lib/opening";

describe("Opening timing", () => {
  it("keeps the first phase for two seconds", () => {
    expect(openingPhase(0)).toBe("slogan");
    expect(openingPhase(1999)).toBe("slogan");
    expect(openingPhase(2000)).toBe("signature");
  });
  it("keeps the second phase for two seconds before signup", () => {
    expect(openingPhase(3999)).toBe("signature");
    expect(openingPhase(4000)).toBe("signup");
  });
});