import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Underline, Undo2, Redo2, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Eraser, Table, Link2, ImagePlus, Paperclip, FilePlus2, Printer, Search, MessageSquare, BookMarked, ListTree, SeparatorHorizontal, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeLink } from "@/lib/assistant-actions";
import { toast } from "sonner";
import { translateUi } from "@/lib/translate-ui";

export type PageSettings = { margin: string; orientation: string; format: string; zoom: string; ruler: boolean; reading: boolean };
export function EditorRibbon({ editor, tab, setTab, settings, setSettings, attach, save, correct }: {
 editor: Editor | null; tab: string; setTab: (tab: string) => void; settings: PageSettings;
 setSettings: (s: PageSettings) => void; attach: () => void; save: () => void; correct: () => void;
}) {
 const [part, setPart] = useState("Accueil");
 const [find, setFind] = useState(""); const [replacement, setReplacement] = useState("");
  const tool = (Icon: typeof Bold, label: string, fn: () => void, active = false) => <Button key={label} type="button" variant={active ? "secondary" : "ghost"} size="icon" title={translateUi(label) as string} aria-label={translateUi(label) as string} onMouseDown={e => e.preventDefault()} onClick={fn}><Icon className="h-4 w-4" /></Button>;
  const pick = (label: string, value: string, values: string[], fn: (s: string) => void) => <label className="flex items-center gap-1 text-xs">{label}<select aria-label={translateUi(label) as string} className="h-8 max-w-40 rounded border bg-card px-1 text-xs" value={value} onChange={e => fn(e.target.value)}>{values.map(v => <option key={v} value={v}>{translateUi(v)}</option>)}</select></label>;
 function exportHtml() { if (!editor) return; const blob = new Blob([`<!doctype html><meta charset="utf-8"><title>Document BERSA</title><body>${editor.getHTML()}</body>`], { type: "text/html" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "document-bersa.html"; a.click(); URL.revokeObjectURL(url); }
 function replace() {
  if (!editor || !find) return;
  const matches: { from: number; to: number }[] = [];
  editor.state.doc.descendants((node, pos) => { if (!node.isText || !node.text) return; let i = node.text.indexOf(find); while (i >= 0) { matches.push({ from: pos + i, to: pos + i + find.length }); i = node.text.indexOf(find, i + find.length); } });
  if (!matches.length) { toast.info("Aucun résultat."); return; }
  const tr = editor.state.tr; for (const match of matches.reverse()) tr.insertText(replacement, match.from, match.to); editor.view.dispatch(tr); toast.success(`${matches.length} remplacement(s)`);
 }
 function references(kind: string) {
  if (!editor) return;
  if (kind === "toc") { const titles: { type: "paragraph"; content: { type: "text"; text: string }[] }[] = []; editor.state.doc.descendants(node => { if (node.type.name === "heading") titles.push({ type: "paragraph", content: [{ type: "text", text: node.textContent }] }); }); if (!titles.length) { toast.info("Ajoutez des titres au document."); return; } editor.chain().focus().insertContent([{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "TABLE DES MATIÈRES" }] }, ...titles]).run(); }
  else { const text = prompt(kind === "note" ? "Texte de la note" : "Référence bibliographique vérifiée"); if (!text) return; const n = (editor.getText().match(/\[Note /g) ?? []).length + 1; editor.chain().focus().insertContent({ type: "paragraph", content: [{ type: "text", text: kind === "note" ? `[Note ${n}] ${text}` : text }] }).run(); }
 }
 return <div className="no-print border-b bg-card">  
  <div className="flex items-center gap-1 bg-primary p-0.5 text-primary-foreground" role="tablist" aria-label="Rubriques de l’éditeur">
  {["Assistant", "Insérer", "Mise en forme"].map(name => <Button key={name} role="tab" aria-selected={tab === name} variant="ghost" onClick={() => setTab(name)} className={`h-8 rounded px-2.5 text-xs ${tab === name ? "bg-card text-foreground" : "text-primary-foreground"}`}>{name}</Button>)}
   <div className="ml-auto flex items-center">
  {tab === "Assistant" && <>{tool(Undo2, "Annuler", () => editor?.chain().focus().undo().run())}
  {tool(Redo2, "Rétablir", () => editor?.chain().focus().redo().run())}</>}
   {tool(Save, "Sauvegarder et ouvrir", save)}
   {tool(Download, "Exporter HTML", exportHtml)}
  {tab === "Insérer" && <div className="flex flex-wrap items-center gap-1 p-1">
   <Button size="sm" variant="outline" onClick={attach}><Paperclip className="h-4 w-4" /> Ajouter un fichier</Button>
   {tool(Table, "Insérer un tableau", () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
   {tool(Link2, "Insérer un lien", () => { const link = prompt("Adresse du lien"); if (!link) return; const url = safeLink(link); if (!url) { toast.error("Adresse non autorisée."); return; } editor?.chain().focus().setLink({ href: url }).run(); })}
   {tool(ImagePlus, "Insérer une image", () => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/png,image/jpeg,image/webp"; input.onchange = () => { const file = input.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { toast.error("Image : 5 Mo maximum."); return; } const reader = new FileReader(); reader.onload = () => editor?.chain().focus().setImage({ src: String(reader.result) }).run(); reader.readAsDataURL(file); }; input.click(); })}
   {tool(SeparatorHorizontal, "Saut de page", () => editor?.chain().focus().insertContent({ type: "pageBreak" }).run())}
   {tool(FilePlus2, "Nouveau document", () => { if (confirm("Effacer le papier pour un nouveau document ?")) editor?.commands.clearContent(); })}
   {editor?.isActive("table") && <><Button size="sm" variant="ghost" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Ligne</Button><Button size="sm" variant="ghost" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Colonne</Button><Button size="sm" variant="ghost" onClick={() => editor.chain().focus().deleteTable().run()}>Supprimer le tableau</Button></>}
  </div>}
  {tab === "Mise en forme" && <>
   <div className="flex gap-1 overflow-x-auto border-b px-1">{["Accueil", "Mise en page", "Références", "Révision", "Affichage"].map(name => <Button key={name} size="sm" variant={part === name ? "secondary" : "ghost"} className="shrink-0 text-xs" onClick={() => setPart(name)}>{name}</Button>)}</div>
   <div className="flex flex-wrap items-center gap-1 p-1">
    {part === "Accueil" && <>
     {pick("Police", editor?.getAttributes("textStyle")["fontFamily"] ?? "Times New Roman", ["Times New Roman", "Arial", "Georgia", "Courier New"], v => editor?.chain().focus().setFontFamily(v).run())}
     {pick("Taille", editor?.getAttributes("textStyle")["fontSize"] ?? "13pt", ["10pt", "11pt", "12pt", "13pt", "14pt", "16pt", "20pt", "24pt"], v => editor?.chain().focus().setFontSize(v).run())}
     {tool(Bold, "Gras", () => editor?.chain().focus().toggleBold().run(), editor?.isActive("bold"))}{tool(Italic, "Italique", () => editor?.chain().focus().toggleItalic().run(), editor?.isActive("italic"))}{tool(Underline, "Souligné", () => editor?.chain().focus().toggleUnderline().run(), editor?.isActive("underline"))}
     <label title="Couleur du texte" className="text-xs">A<input type="color" aria-label="Couleur du texte" className="h-6 w-6" onChange={e => editor?.chain().focus().setColor(e.target.value).run()} /></label>
     <label title="Surlignage" className="text-xs">S<input type="color" aria-label="Surlignage" className="h-6 w-6" onChange={e => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()} /></label>
     {tool(List, "Liste à puces", () => editor?.chain().focus().toggleBulletList().run())}{tool(ListOrdered, "Liste numérotée", () => editor?.chain().focus().toggleOrderedList().run())}
     {[ [AlignLeft, "Gauche", "left"], [AlignCenter, "Centrer", "center"], [AlignRight, "Droite", "right"], [AlignJustify, "Justifier", "justify"] ].map(([Icon, label, align]) => tool(Icon as typeof Bold, String(label), () => editor?.chain().focus().setTextAlign(String(align)).run()))}
     {pick("Interligne", editor?.getAttributes("textStyle")["lineHeight"] ?? "1.6", ["1", "1.15", "1.5", "1.6", "2"], v => editor?.chain().focus().setLineHeight(v).run())}
     {pick("Style", "Normal", ["Normal", "Titre 1", "Titre 2", "Titre 3"], v => v === "Normal" ? editor?.chain().focus().setParagraph().run() : editor?.chain().focus().setHeading({ level: Number(v.slice(-1)) as 1 | 2 | 3 }).run())}
     {tool(Eraser, "Effacer la mise en forme", () => editor?.chain().focus().unsetAllMarks().clearNodes().run())}
    </>}
    {part === "Mise en page" && <>{pick("Marges", settings.margin, ["Normales", "Étroites", "Larges"], margin => setSettings({ ...settings, margin }))}{pick("Orientation", settings.orientation, ["Portrait", "Paysage"], orientation => setSettings({ ...settings, orientation }))}{pick("Papier", settings.format, ["A4", "A5", "Letter"], format => setSettings({ ...settings, format }))}{tool(SeparatorHorizontal, "Saut de page", () => editor?.chain().focus().insertContent({ type: "pageBreak" }).run())}</>}
    {part === "Références" && <><Button size="sm" variant="ghost" onClick={() => references("note")}><BookMarked className="h-4 w-4" /> Note</Button><Button size="sm" variant="ghost" onClick={() => references("bib")}>Bibliographie</Button><Button size="sm" variant="ghost" onClick={() => references("toc")}><ListTree className="h-4 w-4" /> Table des matières</Button></>}
    {part === "Révision" && <><Button size="sm" variant="ghost" onClick={correct}>Correction IA</Button><Input aria-label="Rechercher" value={find} onChange={e => setFind(e.target.value)} placeholder="Rechercher" className="h-8 w-28" /><Input aria-label="Remplacer par" value={replacement} onChange={e => setReplacement(e.target.value)} placeholder="Remplacer par" className="h-8 w-28" />{tool(Search, "Remplacer les occurrences", replace)}{tool(MessageSquare, "Ajouter un commentaire", () => { const text = prompt("Commentaire"); if (text) editor?.chain().focus().insertContent({ type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: `Commentaire : ${text}` }] }] }).run(); })}<span className="px-2 text-xs">{editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0} mots</span></>}
    {part === "Affichage" && <>{pick("Zoom", settings.zoom, ["75%", "100%", "125%", "150%"], zoom => setSettings({ ...settings, zoom }))}<label className="px-2 text-xs"><input type="checkbox" checked={settings.ruler} onChange={e => setSettings({ ...settings, ruler: e.target.checked })} /> Règle</label><label className="px-2 text-xs"><input type="checkbox" checked={settings.reading} onChange={e => { editor?.setEditable(!e.target.checked); setSettings({ ...settings, reading: e.target.checked }); }} /> Lecture</label>{tool(Printer, "Aperçu et impression / PDF", () => window.print())}</>}
   </div>
  </>}
 </div>;
}
