import { describe, it, expect } from "vitest";
import { homeCards, TEMPLATE_DOMAINS, templateDomain } from "../lib/home-catalog";
describe("home catalogue rules", () => {
  it("limits home to four items", () => { expect(homeCards([1,2,3,4,5,6])).toEqual([1,2,3,4]); });
  it("preserves requested category order", () => { expect(TEMPLATE_DOMAINS.slice(0,6)).toEqual(["Folio CV","Lettres administratives","Business","Actes juridiques","Affiches","Couverture"]); });
  it("routes administrative letters to their domain", () => { expect(templateDomain("Lettre administrative")).toBe("Lettres administratives"); });
});