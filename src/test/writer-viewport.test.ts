import { expect, it } from "vitest";
import { writerTextFit } from "@/lib/writer-viewport";

it.each([360, 390, 430])("shows the full text with 8px side breathing room at %ipx", width => {
  const fit = writerTextFit(width, "Portrait", "Normales");
  expect((fit.pageWidth - 2 * fit.padding) * fit.scale).toBeCloseTo(width - 16);
  expect(8 + fit.padding * fit.scale - fit.scrollLeft).toBeCloseTo(8);
});
it.each(["Normales", "Étroites", "Larges"] as const)("fits landscape with %s margins without modifying them", margin => {
  const fit = writerTextFit(430, "Paysage", margin);
  expect(fit.pageWidth).toBe(1123);
  expect((fit.pageWidth - 2 * fit.padding) * fit.scale).toBeCloseTo(414);
});