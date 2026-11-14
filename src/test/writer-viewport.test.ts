import { expect, it } from "vitest";
import { writerTextFit } from "@/lib/writer-viewport";

it.each([360, 390, 430])("shows the full sheet fitting screen width with 8px margin at %ipx", width => {
  const fit = writerTextFit(width, "Portrait", "Normales");
  expect(fit.pageWidth * fit.scale).toBeCloseTo(width - 16);
  expect(fit.scrollLeft).toBe(0);
});
it.each(["Normales", "Étroites", "Larges"] as const)("fits landscape with %s margins without modifying them", margin => {
  const fit = writerTextFit(430, "Paysage", margin);
  expect(fit.pageWidth).toBe(1123);
  expect(fit.pageWidth * fit.scale).toBeCloseTo(414);
});
