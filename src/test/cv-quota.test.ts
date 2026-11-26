import { describe, it, expect } from "vitest";
import { cvSaveAllowed, cvExportIdentity } from "@/lib/cv-quota";
import { EMPTY_CV } from "@/lib/cv-templates";
describe("cv quota", () => {
  it("first CV is free", () => expect(cvSaveAllowed(null, "a", false)).toBe(true));
  it("same CV can be saved again in other formats", () => expect(cvSaveAllowed("a", "a", false)).toBe(true));
  it("second CV requires the Standard plan", () => expect(cvSaveAllowed("a", "b", false)).toBe(false));
  it("paid plan unlocks", () => expect(cvSaveAllowed("a", "b", true)).toBe(true));
  it("a second enrichment for the same person requires payment", () => {
    const first = { ...EMPTY_CV, firstName: "Anne", lastName: "Martin", summary: "Profil initial" };
    const enriched = { ...first, summary: "Profil enrichi" };
    expect(cvSaveAllowed(cvExportIdentity(first), cvExportIdentity(enriched), false)).toBe(false);
  });
  it("changing the export appearance does not consume another free CV", () => {
    expect(cvExportIdentity({ ...EMPTY_CV, customColor: "#123456" })).toBe(cvExportIdentity(EMPTY_CV));
  });
});
