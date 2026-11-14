import { describe, expect, it } from "vitest";
import { BODY_HEIGHT, BODY_LINE, PAGE_HEIGHT, PAGE_MARGIN, PAGE_WIDTH, TEXT_WIDTH, clampView, fittedScale, initialView, paginateBlocks, stackHeight, zoomAt, type DocumentBlock } from "@/components/document-viewer/layout";

const measure = (text: string, kind: "title" | "paragraph" | "note") => text.length * (kind === "note" ? 5.4 : 7.5);

describe("DocumentViewer geometry and gestures", () => {
  it("uses 794 × 1123 A4 pages and 2.5 cm margins", () => {
    expect(PAGE_WIDTH).toBe(794); expect(PAGE_HEIGHT).toBe(1123);
    expect(PAGE_MARGIN).toBeCloseTo(2.5 * 96 / 2.54);
  });
  it.each([360, 390, 430])("fits text with 8px breathing room at %ipx", width => {
    const view = initialView(width);
    expect(view.x + PAGE_MARGIN * view.scale).toBeCloseTo(8);
    expect(TEXT_WIDTH * view.scale).toBeCloseTo(width - 16);
  });
  it("keeps eight screen pixels between transformed pages", () => {
    expect(stackHeight(3, 0.6) - 3 * PAGE_HEIGHT * 0.6).toBe(16);
  });
  it("bounds zoom from fitted 100% to 400%", () => {
    const fit = fittedScale(360);
    expect(clampView({ scale: fit / 10, x: 0, y: 0 }, 360, 600, 2, fit).scale).toBe(fit);
    expect(clampView({ scale: fit * 10, x: 0, y: 0 }, 360, 600, 2, fit).scale).toBe(fit * 4);
  });
  it("keeps pinch anchor stationary", () => {
    const old = initialView(360), x = 150, y = 250;
    const next = zoomAt(old, old.scale * 2, x, y);
    expect((x - next.x) / next.scale).toBeCloseTo((x - old.x) / old.scale);
    expect((y - next.y) / next.scale).toBeCloseTo((y - old.y) / old.scale);
  });
  it("locks horizontal pan only at fitted minimum and allows vertical scrolling", () => {
    const fit = fittedScale(360), initial = initialView(360);
    const next = clampView({ scale: fit, x: 999, y: -200 }, 360, 600, 3, fit);
    expect(next.x).toBe(initial.x); expect(next.y).toBe(-200);
    expect(clampView({ scale: fit * 2, x: -100, y: -200 }, 360, 600, 3, fit).x).toBe(-100);
  });
});

describe("DocumentViewer pagination", () => {
  it("splits long paragraphs without losing characters", () => {
    const text = "Un argument clair et vérifiable. ".repeat(600);
    const pages = paginateBlocks([{ id: "p", type: "paragraph", text }], measure);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.flatMap(page => page.blocks).map(block => block.text).join("")).toBe(text);
    for (const page of pages) expect(page.blocks.reduce((sum, block) => sum + Math.ceil(measure(block.text, "paragraph") / TEXT_WIDTH) * BODY_LINE + 12, 0)).toBeLessThan(BODY_HEIGHT + BODY_LINE);
  });
  it("places footnotes on their reference page", () => {
    const blocks: DocumentBlock[] = [{ id: "p", type: "paragraph", text: "Une idée." }, { id: "n", type: "note", referenceId: "p", text: "Une référence précise." }];
    const pages = paginateBlocks(blocks, measure);
    expect(pages[0]?.blocks[0]?.noteNumbers).toEqual([1]);
    expect(pages[0]?.notes[0]?.text).toBe("Une référence précise.");
  });
  it("continues long notes without losing text or numbering", () => {
    const text = "Note détaillée. ".repeat(1500);
    const pages = paginateBlocks([{ id: "p", type: "paragraph", text: "Texte." }, { id: "n", type: "note", referenceId: "p", text }], measure);
    const notes = pages.flatMap(page => page.notes);
    expect(notes.length).toBeGreaterThan(1);
    expect(notes.map(note => note.text).join("")).toBe(text);
    expect(notes.every(note => note.number === 1)).toBe(true);
  });
});