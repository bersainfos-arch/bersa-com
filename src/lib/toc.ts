import type { Editor } from "@tiptap/react";

export const TOC_TITLE = "TABLE DES MATIÈRES";

export function tocLines(editor: Editor): string[] {
  const out: string[] = [];
  editor.state.doc.descendants(node => {
    if (node.type.name === "heading" && node.textContent.trim() && node.textContent.trim() !== TOC_TITLE) {
      const level = Number(node.attrs["level"]) || 1;
      out.push(`${"\u00a0\u00a0\u00a0".repeat(level - 1)}${node.textContent.trim()}`);
    }
  });
  return out;
}

/** Replaces the paragraph right after each "TABLE DES MATIÈRES" heading with the current headings. */
export function refreshToc(editor: Editor, history = false) {
  const { state } = editor;
  const lines = tocLines(editor);
  const target: { pos: number; size: number; text: string }[] = [];
  let prevToc = false;
  state.doc.forEach((node, offset) => {
    if (prevToc && node.type.name === "paragraph") target.push({ pos: offset, size: node.nodeSize, text: node.textContent });
    prevToc = node.type.name === "heading" && node.textContent.trim() === TOC_TITLE;
  });
  if (!target.length) return;
  const wanted = lines.join("");
  const { schema } = state;
  let tr = state.tr;
  for (const t of target.reverse()) {
    if (t.text === wanted) continue;
    const content: ReturnType<typeof schema.text>[] = [];
    lines.forEach((l, i) => { if (i) content.push(schema.nodes["hardBreak"]!.create()); content.push(schema.text(l)); });
    tr = tr.replaceWith(t.pos, t.pos + t.size, schema.nodes["paragraph"]!.create(null, content.length ? content : null));
  }
  if (!tr.docChanged) return;
  if (!history) tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}
