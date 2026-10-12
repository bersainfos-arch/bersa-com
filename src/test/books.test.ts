import { it, expect } from "vitest";
import { validateSummary, purchasable } from "@/lib/books";
it("accepts exactly 5000 summary characters", () => expect(validateSummary("a".repeat(5000), false, false)).toBeNull());
it("rejects 5001 summary characters", () => expect(validateSummary("a".repeat(5001), false, false)).not.toBeNull());
it("requires author validation of generated summary", () => expect(validateSummary("Résumé", true, false)).not.toBeNull());
it("allows author validated summary", () => expect(validateSummary("Résumé", true, true)).toBeNull());
it("does not sell an uncontrolled external link", () => expect(purchasable({ status: "published", currency: "USD", price_usd: 12, file_path: null })).toBe(false));
it("does not sell unsupported currencies", () => expect(purchasable({ status: "published", currency: "CDF", price_usd: 12, file_path: "book.pdf" })).toBe(false));