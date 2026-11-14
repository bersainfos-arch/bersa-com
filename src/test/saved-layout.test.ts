import { describe, it, expect } from "vitest";
import { attachLayout, extractLayout } from "@/lib/writer-layout";
describe("saved page layout", () => {
  it("keeps header, footer and numbering with the document", () => {
    const saved = attachLayout("<p>Texte</p>", { headerText: "Mémoire – Kinshasa", footerText: "BERSA", pageNumbers: true });
    const { html, layout } = extractLayout(saved);
    expect(html).toBe("<p>Texte</p>");
    expect(layout).toEqual({ headerText: "Mémoire – Kinshasa", footerText: "BERSA", pageNumbers: true });
  });
});
