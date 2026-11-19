import { describe, expect, it } from "vitest";
import { onePageScale, A4_H } from "./cv-export";
describe("export CV une page", () => {
  it("ne réduit pas un CV qui tient sur A4", () => expect(onePageScale(A4_H)).toBe(1));
  it("réduit un CV plus long pour tenir sur une seule page", () => expect(onePageScale(A4_H * 2)).toBe(0.5));
});
