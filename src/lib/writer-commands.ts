import { Extension, type Editor } from "@tiptap/core";

/** Retrait réel de paragraphe (stocké dans le document, exporté avec lui). */
export const ParagraphIndent = Extension.create({
  name: "paragraphIndent",
  addGlobalAttributes() {
    return [{ types: ["paragraph", "heading"], attributes: { indent: {
      default: 0,
      parseHTML: el => Number(el.getAttribute("data-indent")) || 0,
      renderHTML: a => (a["indent"] ? { "data-indent": a["indent"], style: `margin-left:${a["indent"] * 1.25}cm` } : {}),
    } } }];
  },
});

export function changeIndent(editor: Editor, delta: 1 | -1) {
  if (editor.isActive("listItem")) {
    return delta > 0 ? editor.chain().focus().sinkListItem("listItem").run() : editor.chain().focus().liftListItem("listItem").run();
  }
  const { from, to } = editor.state.selection;
  const tr = editor.state.tr;
  editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name === "paragraph" || node.type.name === "heading") {
      const next = Math.max(0, Math.min(8, (Number(node.attrs["indent"]) || 0) + delta));
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
    }
  });
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}

/** Rechercher/remplacer dans les nœuds texte, sans détruire la structure ni l'historique. */
export function replaceAllText(editor: Editor, find: string, replacement: string): number {
  if (!find) return 0;
  const matches: Array<{ from: number; to: number }> = [];
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    let i = node.text.indexOf(find);
    while (i !== -1) { matches.push({ from: pos + i, to: pos + i + find.length }); i = node.text.indexOf(find, i + find.length); }
  });
  if (!matches.length) return 0;
  const tr = editor.state.tr;
  for (const m of matches.reverse()) {
    if (replacement) tr.insertText(replacement, m.from, m.to); else tr.delete(m.from, m.to);
  }
  editor.view.dispatch(tr);
  return matches.length;
}
