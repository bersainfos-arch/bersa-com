import { expect, it } from "vitest";
import { writerTextFit, scaleToDisplayZoom, displayZoomToScale, writerLineSpacing } from "@/lib/writer-viewport";

it.each([360, 390, 430])("fits the text without displaying the saved margins at %ipx", width => {
  const fit = writerTextFit(width, "Portrait", "Normales");
  expect((fit.pageWidth - fit.padding * 2) * fit.scale).toBeCloseTo(width - 16);
  expect(fit.scrollLeft).toBeCloseTo(fit.padding * fit.scale - 8);
  expect(scaleToDisplayZoom(fit.scale, fit.scale)).toBe(100);
  expect(displayZoomToScale(100, fit.scale)).toBe(fit.scale);
});
it.each(["Normales", "Étroites", "Larges"] as const)("fits landscape with %s margins without modifying them", margin => {
  const fit = writerTextFit(430, "Paysage", margin);
  expect(fit.pageWidth).toBe(1123);
  expect((fit.pageWidth - fit.padding * 2) * fit.scale).toBeCloseTo(414);
});

import { writerTextFit as fit55 } from "@/lib/writer-viewport";
test("téléphone large : lecture agrandie sans modifier le papier", () => {
  expect(fit55(480, "Portrait", "Normales").pageWidth).toBe(794);
  expect(fit55(480, "Portrait", "Normales").scale).toBeGreaterThan(0.55);
});
test("téléphone 360 px : le texte reste entièrement visible", () => {
  const fit = fit55(360, "Portrait", "Normales");
  expect((794 - 2 * fit.padding) * fit.scale).toBeCloseTo(344);
});
it("calibrates displayed line spacing 1 to the previous 1.5", () => expect(writerLineSpacing(1)).toBe(1.5));
