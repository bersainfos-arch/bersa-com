import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { WriterLayout, Bookmark, setParagraphLayout, changeCase, pageGeometry, formatPageNumber } from "@/lib/writer-layout";
import { Footnote, insertFootnote, collectFootnotes, deleteFootnote } from "@/lib/footnotes";

let editor: Editor | undefined;
afterEach(() => editor?.destroy());
const make = () => editor = new Editor({ extensions: [StarterKit, WriterLayout, Bookmark, Footnote], content: "<p>Bonjour Bersa</p>" });
describe("commandes Writer persistantes", () => {
  it("enregistre l’interligne et l’espacement sur le paragraphe sélectionné", () => {
    const e = make(); e.commands.setTextSelection(3);
    setParagraphLayout(e, { paragraphLine: "2", paragraphSpacing: "12pt" });
    expect(e.getJSON().content?.[0]?.attrs?.["paragraphLine"]).toBe("2");
    expect(e.getHTML()).toContain("margin-bottom: 12pt");
  });
  it("ne change la casse que de la sélection", () => {
    const e = make(); e.commands.setTextSelection({ from: 1, to: 8 });
    changeCase(e, "upper"); expect(e.getText()).toBe("BONJOUR Bersa");
  });
  it("numérote les notes 1, 2, 3 et renumérote après suppression", () => {
    const e = make(); e.commands.focus("end");
    insertFootnote(e, "A"); insertFootnote(e, "B"); insertFootnote(e, "C");
    expect(collectFootnotes(e).map(x => x.number)).toEqual([1, 2, 3]);
    const first = collectFootnotes(e)[0]; if (!first) throw new Error("Note absente");
    deleteFootnote(e, first.pos);
    expect(collectFootnotes(e).map(x => [x.number, x.note])).toEqual([[1, "B"], [2, "C"]]);
  });
  it("conserve le signet dans la structure sauvegardée", () => {
    const e = make(); e.commands.setTextSelection({ from: 1, to: 8 }); e.commands.setMark("bookmark", { name: "Début" });
    expect(e.getHTML()).toContain('data-bookmark="Début"');
  });
  it("restaure le texte et le numéro des notes depuis un document sauvegardé", () => {
    const e = make(); insertFootnote(e, "Source conservée");
    const html = e.getHTML(); e.commands.setContent(html);
    expect(collectFootnotes(e).map(item => [item.number, item.note])).toEqual([[1, "Source conservée"]]);
  });
  it("utilise la même hauteur et un intercalaire de 16px pour chaque page mobile", () => {
    expect(pageGeometry(360).height).toBeCloseTo(509.14, 1);
    expect(pageGeometry(794).height).toBeCloseTo(1122.9, 0);
    expect(pageGeometry(1123, true).height).toBeCloseTo(794, 0);
    expect(formatPageNumber(4, "roman")).toBe("iv");
    expect(formatPageNumber(14, "roman")).toBe("xiv");
    expect(formatPageNumber(7, "arabic")).toBe("7");
  });
});