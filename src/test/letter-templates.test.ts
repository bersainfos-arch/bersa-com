import { describe, it, expect } from "vitest";
import { parseImproved, improvePrompt, LETTER_TEMPLATES, sampleData } from "@/lib/letter-templates";
describe("lettres", () => {
  it("n’extrait que appel, corps et politesse", () => {
    expect(parseImproved("[APPEL]\nMonsieur,\n[CORPS]\nA\nB\n[POLITESSE]\nSalutations.")).toEqual({ salut: "Monsieur,", corps: "A\nB", politesse: "Salutations." });
  });
  it("refuse une réponse hors format", () => { expect(parseImproved("bonjour")).toBeNull(); });
  it("transmet les données personnelles comme verrouillées", () => {
    const t = LETTER_TEMPLATES[0]!; expect(improvePrompt(t, sampleData(t))).toContain("DJOMA ONOLOKE Dieudonné");
  });
});
import { wordReadyHtml } from "@/lib/letter-templates";
describe("catalogue RDC", () => {
  it("compte 53 modèles uniques", () => { expect(new Set(LETTER_TEMPLATES.map(t => t.id)).size).toBe(53); });
  it("l’en-tête ne dépasse pas le milieu", () => { expect(LETTER_TEMPLATES[0]!.html).toContain("width:46%"); });
  it("convertit les alinéas en cm pour Word", () => { expect(wordReadyHtml("text-indent: 45%")).toBe("text-indent:7.65cm"); });
});
