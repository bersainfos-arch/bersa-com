import { Mark, Extension, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";

/** Commentaire attaché à un passage : le texte du commentaire est gardé dans le document. */
export const CommentMark = Mark.create({
  name: "comment",
  inclusive: false,
  addAttributes() {
    return { text: { default: "", parseHTML: el => el.getAttribute("data-comment") ?? "", renderHTML: a => ({ "data-comment": a["text"], title: a["text"] }) } };
  },
  parseHTML() { return [{ tag: "span[data-comment]" }]; },
  renderHTML({ HTMLAttributes }) { return ["span", mergeAttributes(HTMLAttributes, { class: "bersa-comment" }), 0]; },
});

/** Texte ajouté pendant le suivi des modifications. */
export const InsertionMark = Mark.create({
  name: "trackedInsert",
  parseHTML() { return [{ tag: "ins[data-track]" }]; },
  renderHTML({ HTMLAttributes }) { return ["ins", mergeAttributes(HTMLAttributes, { "data-track": "1", class: "bersa-track-ins" }), 0]; },
});

export const trackKey = new PluginKey<boolean>("bersaTrack");

/** Quand le suivi est actif, tout texte tapé reçoit la marque « ajout ». */
export const TrackChanges = Extension.create({
  name: "trackChanges",
  addProseMirrorPlugins() {
    return [new Plugin<boolean>({
      key: trackKey,
      state: { init: () => false, apply: (tr, v) => { const m = tr.getMeta(trackKey); return typeof m === "boolean" ? m : v; } },
      appendTransaction: (trs, _old, state) => {
        if (!trackKey.getState(state)) return null;
        const type = state.schema.marks["trackedInsert"];
        if (!type) return null;
        const tr = state.tr; let changed = false;
        for (const t of trs) {
          if (!t.docChanged || t.getMeta(trackKey) !== undefined || t.getMeta("trackSkip")) continue;
          t.mapping.maps.forEach((map, i) => {
            map.forEach((_os, _oe, ns, ne) => {
              let from = ns, to = ne;
              for (let j = i + 1; j < t.mapping.maps.length; j++) { const mj = t.mapping.maps[j]; if (mj) { from = mj.map(from, -1); to = mj.map(to, 1); } }
              if (to > from) { tr.addMark(from, to, type.create()); changed = true; }
            });
          });
        }
        if (!changed) return null;
        tr.setMeta("trackSkip", true).setMeta("addToHistory", true);
        return tr;
      },
    })];
  },
});

export const setTracking = (editor: Editor, on: boolean) => editor.view.dispatch(editor.state.tr.setMeta(trackKey, on));
export const isTracking = (editor: Editor) => !!trackKey.getState(editor.state);

const rangesOf = (editor: Editor, name: string) => {
  const out: Array<{ from: number; to: number; text: string }> = [];
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return;
    const m = node.marks.find(x => x.type.name === name);
    if (m) out.push({ from: pos, to: pos + node.nodeSize, text: String(m.attrs["text"] ?? node.text ?? "") });
  });
  return out;
};

export const acceptAll = (editor: Editor) => {
  const type = editor.schema.marks["trackedInsert"]; if (!type) return 0;
  const n = rangesOf(editor, "trackedInsert").length;
  editor.view.dispatch(editor.state.tr.removeMark(0, editor.state.doc.content.size, type).setMeta("trackSkip", true));
  return n;
};
export const rejectAll = (editor: Editor) => {
  const r = rangesOf(editor, "trackedInsert"); const tr = editor.state.tr.setMeta("trackSkip", true);
  for (const x of [...r].reverse()) tr.delete(x.from, x.to);
  editor.view.dispatch(tr); return r.length;
};
export const listComments = (editor: Editor) => rangesOf(editor, "comment");
export const removeComment = (editor: Editor, from: number, to: number) => {
  const type = editor.schema.marks["comment"]; if (type) editor.view.dispatch(editor.state.tr.removeMark(from, to, type));
};

/** Bibliographie : sources gardées sur l'appareil, citations (Auteur, année) et liste APA. */
export type Source = { id: string; author: string; year: string; title: string; publisher: string };
export const formatApa = (s: Source) => `${s.author} (${s.year}). <em>${s.title}</em>.${s.publisher ? ` ${s.publisher}.` : ""}`;
export const citation = (s: Source) => `(${s.author.split(",")[0]}, ${s.year})`;
export const bibliographyHtml = (list: Source[]) =>
  `<h2>Bibliographie</h2>${[...list].sort((a, b) => a.author.localeCompare(b.author)).map(s => `<p style="padding-left:1.27cm;text-indent:-1.27cm">${formatApa(s)}</p>`).join("")}`;

/** Formes simples insérées comme images SVG. */
export const SHAPES: Record<string, string> = {
  Rectangle: '<rect x="4" y="4" width="152" height="92" fill="none" stroke="#1e3a8a" stroke-width="4"/>',
  Cercle: '<ellipse cx="80" cy="50" rx="74" ry="44" fill="none" stroke="#1e3a8a" stroke-width="4"/>',
  Flèche: '<path d="M6 50h120M100 20l40 30-40 30" fill="none" stroke="#1e3a8a" stroke-width="6"/>',
  Triangle: '<path d="M80 6 154 94H6Z" fill="none" stroke="#1e3a8a" stroke-width="4"/>',
  Ligne: '<path d="M4 50h152" stroke="#1e3a8a" stroke-width="4"/>',
};
export const shapeSrc = (name: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100" viewBox="0 0 160 100">${SHAPES[name]}</svg>`)}`;
export const SYMBOLS = ["©", "®", "™", "§", "¶", "€", "$", "£", "°", "±", "×", "÷", "≤", "≥", "≠", "≈", "∞", "√", "π", "α", "β", "Σ", "→", "←", "↑", "↓", "✓", "•", "«", "»", "…", "–", "—"];
