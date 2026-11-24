import { expect, it } from "vitest";
import { EMPTY_CV } from "@/lib/cv-templates";
import { canFinalizeCv, validStagePeriod, cvStepError } from "@/lib/cv-wizard";

it("requires a stage start and end year in chronological order", () => {
  expect(validStagePeriod("2020", "2021")).toBe(true);
  expect(validStagePeriod("2021", "2020")).toBe(false);
  expect(validStagePeriod("", "2021")).toBe(false);
  expect(validStagePeriod("2020", "")).toBe(false);
});
it("does not finalize until all nine sections are reviewed", () => {
  const data = { ...EMPTY_CV, firstName: "Marie", lastName: "Kanku", phone: "+243810000000" };
  expect(canFinalizeCv(data, 8)).toBe(false);
  expect(canFinalizeCv(data, 9)).toBe(true);
});
it("blocks a stage with no end year", () => {
  expect(cvStepError({ ...EMPTY_CV, sections: [{ key: "stage", title: "Stages", content: "Comptabilité", start: "2020" }] }, 8)).not.toBe("");
});