import { describe, it, expect } from "vitest";
import { cvSaveAllowed } from "@/lib/cv-quota";
describe("cv quota", () => {
  it("first CV is free", () => expect(cvSaveAllowed(null, "a", false)).toBe(true));
  it("same CV can be saved again in other formats", () => expect(cvSaveAllowed("a", "a", false)).toBe(true));
  it("second CV requires the Standard plan", () => expect(cvSaveAllowed("a", "b", false)).toBe(false));
  it("paid plan unlocks", () => expect(cvSaveAllowed("a", "b", true)).toBe(true));
});
