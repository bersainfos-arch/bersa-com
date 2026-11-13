import { Extension } from "@tiptap/core";
/** Conserve la mise en page inline (alinéas, retraits, colonnes d’en-tête) des modèles ouverts dans l’Atelier. */
const strip = (s: string | null) => (s ?? "").split(";").map(r => r.trim()).filter(r => r && !/^text-align/i.test(r)).join(";") || null;
export const KeepBlockStyle = Extension.create({
  name: "keepBlockStyle",
  addGlobalAttributes() {
    return [{ types: ["paragraph", "heading", "table", "tableCell", "tableHeader"], attributes: { blockStyle: {
      default: null,
      parseHTML: el => strip(el.getAttribute("style")),
      renderHTML: a => (a["blockStyle"] ? { style: a["blockStyle"] } : {}),
    } } }];
  },
});
