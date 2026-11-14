import { Extension, Mark, type Editor } from "@tiptap/core";

export const WriterLayout = Extension.create({
  name: "writerLayout",
  addGlobalAttributes() {
    return [{ types: ["paragraph", "heading"], attributes: {
      paragraphSpacing: { default: null, parseHTML: el => el.style.marginBottom || null, renderHTML: a => a["paragraphSpacing"] ? { style: `margin-bottom:${a["paragraphSpacing"]}` } : {} },
      paragraphLine: { default: null, parseHTML: el => el.style.lineHeight || null, renderHTML: a => a["paragraphLine"] ? { style: `line-height:${a["paragraphLine"]}` } : {} },
      keepTogether: { default: false, parseHTML: el => el.dataset["keep"] === "true", renderHTML: a => a["keepTogether"] ? { "data-keep": "true", style: "break-inside:avoid" } : {} },
      dropCap: { default: false, parseHTML: el => el.dataset["dropCap"] === "true", renderHTML: a => a["dropCap"] ? { "data-drop-cap": "true" } : {} },
      textBox: { default: false, parseHTML: el => el.dataset["textBox"] === "true", renderHTML: a => a["textBox"] ? { "data-text-box": "true" } : {} },
      paragraphBorder: { default: false, parseHTML: el => el.dataset["border"] === "true", renderHTML: a => a["paragraphBorder"] ? { "data-border": "true" } : {} },
    } }];
  },
});

export const Bookmark = Mark.create({
  name: "bookmark",
  inclusive: false,
  addAttributes: () => ({ name: { default: "", parseHTML: el => el.getAttribute("data-bookmark") } }),
  parseHTML: () => [{ tag: "span[data-bookmark]" }],
  renderHTML: ({ mark }) => ["span", { "data-bookmark": mark.attrs["name"] }, 0],
});

export function setParagraphLayout(editor: Editor, attrs: Record<string, unknown>) {
  const { from, to } = editor.state.selection;
  const tr = editor.state.tr;
  editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (["paragraph", "heading"].includes(node.type.name)) tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
  });
  editor.view.dispatch(tr);
  editor.commands.focus();
}

export function changeCase(editor: Editor, mode: "upper" | "lower" | "sentence") {
  const { from, to } = editor.state.selection;
  if (from === to) return false;
  const replacements: Array<{ from: number; to: number; text: string }> = [];
  editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText || !node.text) return;
    const start = Math.max(from, pos), end = Math.min(to, pos + node.nodeSize);
    const text = node.text.slice(start - pos, end - pos);
    const transformed = mode === "upper" ? text.toLocaleUpperCase("fr") : mode === "lower" ? text.toLocaleLowerCase("fr") : text.toLocaleLowerCase("fr").replace(/(^|[.!?]\s+)(\p{L})/gu, (_, prefix, letter) => prefix + letter.toLocaleUpperCase("fr"));
    replacements.push({ from: start, to: end, text: transformed });
  });
  const tr = editor.state.tr;
  replacements.reverse().forEach(r => tr.insertText(r.text, r.from, r.to));
  editor.view.dispatch(tr);
  return true;
}

export function pageGeometry(width: number, landscape = false) {
  // Vraie proportion A4 (210 × 297 mm), identique à Word/WPS, sur toutes les tailles d'écran.
  const height = width * (landscape ? 210 / 297 : 297 / 210);
  return { height, stride: height + 16 };
}
/** Page layout (header/footer/numbering) saved alongside document HTML as a trailing comment. */
export type SavedLayout = { headerText?: string; footerText?: string; pageNumbers?: boolean; differentFirstPage?: boolean; margin?: string; orientation?: string; pageNumberAlign?: PageNumberAlign | undefined; pageNumberFormat?: PageNumberFormat | undefined };
const LAYOUT_RE = /<!--BERSA_LAYOUT:([A-Za-z0-9+/=]*)-->\s*$/;
export function attachLayout(html: string, layout: SavedLayout): string {
  const clean = html.replace(LAYOUT_RE, "");
  const json = JSON.stringify(layout);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `${clean}<!--BERSA_LAYOUT:${b64}-->`;
}
export function extractLayout(html: string): { html: string; layout: SavedLayout | null } {
  const m = html.match(LAYOUT_RE);
  if (!m) return { html, layout: null };
  try { return { html: html.replace(LAYOUT_RE, ""), layout: JSON.parse(decodeURIComponent(escape(atob(m[1] ?? "")))) }; }
  catch { return { html: html.replace(LAYOUT_RE, ""), layout: null }; }
}

export type PageNumberAlign = "left" | "center" | "right";
export type PageNumberFormat = "arabic" | "roman";
/** Numéro de page affiché selon le format choisi (arabe 1, 2, 3 ou romain i, ii, iii). */
export function formatPageNumber(n: number, format: PageNumberFormat = "arabic"): string {
  if (format !== "roman" || n < 1) return String(n);
  const table: Array<[number, string]> = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
  let out = "", rest = n;
  for (const [v, r] of table) while (rest >= v) { out += r; rest -= v; }
  return out;
}
