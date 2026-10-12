import { describe, it, expect } from "vitest";
import { writingTarget, safeLink } from "@/lib/assistant-actions";
import { authIdentifier } from "@/lib/auth-identifier";
describe("Assistant input", () => {
  it("transforms edited text when nothing is selected", () => expect(writingTarget("Texte retouché", { from: 0, to: 0, text: "" })).toBe("Texte retouché"));
  it("transforms only the selection", () => expect(writingTarget("Tout le papier", { from: 1, to: 4, text: "le papier" })).toBe("le papier"));
  it("rejects executable links", () => expect(safeLink("javascript:alert(1)")).toBeNull());
  it("recognizes a private international phone without fake email", () => expect(authIdentifier("+243 818 147 637")).toEqual({ phone: "+243818147637" }));
  it("rejects ambiguous local numbers", () => expect(authIdentifier("0818147637")).toBeNull());
});