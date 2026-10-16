import { Node } from "@tiptap/core";
import type { Editor } from "@tiptap/react";

/**
 * Note de bas de page : nœud inline atomique portant le texte de la note.
 * Le numéro affiché dépend de la position dans le document (renumérotation
 * automatique via renumberFootnotes après chaque modification).
 */
export const Footnote = Node.create({
  name: "footnote",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      note: { default: "" },
      number: { default: 0 },
    };
  },

  parseHTML() {
    return [{ tag: "sup.footnote-ref" }];
  },

  renderHTML({ node }) {
    return [
      "sup",
      {
        class: "footnote-ref",
        "data-note": node.attrs.note,
        title: node.attrs.note,
      },
      String(node.attrs.number || ""),
    ];
  },
});

export interface FootnoteItem {
  number: number;
  note: string;
  pos: number;
}

/** Renvoie les notes dans l'ordre d'apparition du document. */
export function collectFootnotes(editor: Editor): FootnoteItem[] {
  const items: FootnoteItem[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "footnote") {
      items.push({ number: items.length + 1, note: node.attrs.note as string, pos });
    }
    return true;
  });
  return items;
}

/** Réécrit les numéros dans le document lorsqu'ils ne suivent plus l'ordre. */
export function renumberFootnotes(editor: Editor) {
  const items = collectFootnotes(editor);
  let dirty = false;
  const tr = editor.state.tr;
  items.forEach((item) => {
    const node = editor.state.doc.nodeAt(item.pos);
    if (node && node.attrs.number !== item.number) {
      tr.setNodeMarkup(item.pos, undefined, { ...node.attrs, number: item.number });
      dirty = true;
    }
  });
  if (dirty) editor.view.dispatch(tr.setMeta("addToHistory", false));
}

/** Insère une note de bas de page à la position du curseur. */
export function insertFootnote(editor: Editor, note: string) {
  const number = collectFootnotes(editor).length + 1;
  editor.chain().focus().insertContent({ type: "footnote", attrs: { note, number } }).run();
  renumberFootnotes(editor);
}

/** Modifie le texte d'une note existante. */
export function updateFootnote(editor: Editor, pos: number, note: string) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  const tr = editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, note });
  editor.view.dispatch(tr);
}

/** Supprime une note (l'appel de note dans le texte). */
export function deleteFootnote(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  const tr = editor.state.tr.delete(pos, pos + node.nodeSize);
  editor.view.dispatch(tr);
  renumberFootnotes(editor);
}
