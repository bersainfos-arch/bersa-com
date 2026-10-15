import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Underline, Undo2, Redo2, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Eraser, Table, Link2, ImagePlus, Paperclip, FilePlus2, Printer, Search, MessageSquare, BookMarked, ListTree, SeparatorHorizontal, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeLink } from "@/lib/assistant-actions";
import { toast } from "sonner";
import { translateUi } from "@/lib/translate-ui";
import { useState, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  FileText, Home, PlusCircle, Layout, BookmarkCheck, Mail, CheckSquare, Eye,
  Scissors, Copy, Clipboard, Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Indent, Outdent,
  Eraser, Table, Image, Link2, Search, Replace, Printer, Share2, Download,
  FolderOpen, Save, FilePlus, Sparkles, Sliders, Type, Hash, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeLink } from "@/lib/assistant-actions";
import { toast } from "sonner";
import { translateUi } from "@/lib/translate-ui";

export type PageSettings = {
  margin: "Normales" | "Étroites" | "Larges";
  orientation: "Portrait" | "Paysage";
  format: "A4" | "A5" | "Letter";
  zoom: string;
  ruler: boolean;
  watermark: string;
  lineNumbers: boolean;
  viewMode: "page" | "lecture" | "web" | "plan";
  headerText: string;
  footerText: string;
};

export function EditorRibbon({
  editor,
  tab,
  setTab,
  settings,
  setSettings,
  attach,
  save,
  correct
}: {
  editor: Editor | null;
  tab: string;
  setTab: (tab: string) => void;
  settings: PageSettings;
  setSettings: (s: PageSettings) => void;
  attach: () => void;
  save: () => void;
  correct: () => void;
}) {
  const [activeMenu, setActiveMenu] = useState<string>("Accueil");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [citationStyle, setCitationStyle] = useState<"APA7" | "APA6" | "APA5" | "Chicago">("APA7");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Outils d'aide pour boutons
  const btn = (icon: any, label: string, onClick: () => void, active = false) => (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="h-8 px-2 text-xs gap-1"
      title={label}
      onClick={onClick}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );

  // --- 9. MENU FICHIER ---
  const handleNewDoc = () => {
    if (confirm("Créer un nouveau document vierge ? Les modifications non enregistrées seront perdues.")) {
      editor?.commands.clearContent();
      toast.success("Nouveau document créé.");
    }
  };

  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    if (file.name.endsWith(".txt") || file.name.endsWith(".html")) {
      reader.onload = () => {
        editor?.commands.setContent(String(reader.result));
        toast.success(`Fichier ${file.name} ouvert.`);
      };
      reader.readAsText(file);
    } else {
      toast.info("Importation DOCX/ODT : le texte brut sera extrait.");
      reader.onload = () => {
        editor?.commands.setContent(`<p>${String(reader.result)}</p>`);
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const exportAs = (format: "html" | "txt" | "docx") => {
    if (!editor) return;
    let mime = "text/plain";
    let ext = "txt";
    let content: BlobPart = editor.getText();

    if (format === "html") {
      mime = "text/html";
      ext = "html";
      content = `<!doctype html><html><head><meta charset="utf-8"><title>Document BERSA</title><style>body{font-family:'Times New Roman',serif;padding:2cm;}</style></head><body>${editor.getHTML()}</body></html>`;
    } else if (format === "docx") {
      mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      ext = "docx";
      // Conteneur HTML interprétable par Word
      content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>BERSA Export</title>
        <style>@page{size:21cm 29.7cm;margin:2.5cm;}body{font-family:'Times New Roman',serif;font-size:13pt;line-height:1.6;}</style>
        </head><body>${editor.getHTML()}</body></html>`;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document-bersa.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Export ${ext.toUpperCase()} téléchargé.`);
  };

  const handleShare = async () => {
    const text = editor?.getText().slice(0, 300) ?? "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Document BERSA",
          text: `Extrait de mon travail sur BERSA :\n${text}...`,
          url: window.location.href,
        });
        toast.success("Document partagé.");
      } catch {
        /* annulé */
      }
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent("Document rédigé sur BERSA :\n" + text)}`;
      window.open(waUrl, "_blank");
    }
  };

  // --- 10. RECHERCHER / REMPLACER ---
  const handleReplaceAll = () => {
    if (!editor || !findText) return;
    const matches: { from: number; to: number }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      let i = node.text.indexOf(findText);
      while (i >= 0) {
        matches.push({ from: pos + i, to: pos + i + findText.length });
        i = node.text.indexOf(findText, i + findText.length);
      }
    });
    if (!matches.length) {
      toast.info("Aucune occurrence trouvée.");
      return;
    }
    const tr = editor.state.tr;
    for (const match of matches.reverse()) {
      tr.insertText(replaceText, match.from, match.to);
    }
    editor.view.dispatch(tr);
    toast.success(`${matches.length} occurrence(s) remplacée(s).`);
  };

  // --- 13. CITATIONS & BIBLIOGRAPHIE ACADÉMIQUE ---
  const insertCitation = () => {
    if (!editor) return;
    const author = prompt("Nom de l'auteur (ex: NZUNDU NZALALEMBA, J.-E.) :");
    if (!author) return;
    const year = prompt("Année de publication (ex: 2026) :") || "s.d.";
    const page = prompt("Page citée (optionnel, ex: p. 45) :");
    const title = prompt("Titre de l'ouvrage ou de l'article :");
    const publisher = prompt("Maison d'édition ou Ville (ex: Kinshasa, PUK) :");

    let inline = `(${author}, ${year}${page ? `, ${page}` : ""})`;
    let biblio = `${author} (${year}). *${title || "Sans titre"}*. ${publisher || ""}.`;

    if (citationStyle === "Chicago") {
      inline = `[${author}, ${year}${page ? `, ${page}` : ""}]`;
      biblio = `${author}. ${year}. ${title || "Sans titre"}. ${publisher || ""}.`;
    }

    editor.chain().focus().insertContent(`${inline} `).run();
    toast.success(`Citation insérée au format ${citationStyle}.`);
  };

  const insertTOC = () => {
    if (!editor) return;
    const headings: string[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "heading") {
        headings.push(`${node.attrs.level === 1 ? "• " : "    - "}${node.textContent}`);
      }
    });
    if (!headings.length) {
      toast.info("Ajoutez des Titres (Titre 1, Titre 2) dans votre texte pour générer la table.");
      return;
    }
    const tocHtml = `<h2>TABLE DES MATIÈRES</h2><ul>${headings.map(h => `<li>${h}</li>`).join("")}</ul><hr/>`;
    editor.chain().focus().insertContent(tocHtml).run();
    toast.success("Table des matières générée.");
  };

  return (
    <div className="no-print border-b bg-card text-foreground">
      {/* Barre supérieure des onglets Office */}
      <div className="flex items-center overflow-x-auto bg-primary/95 text-primary-foreground px-1 py-0.5 gap-0.5 scrollbar-none">
        <Button
          size="sm"
          variant={tab === "Assistant" ? "secondary" : "ghost"}
          className="h-7 px-3 text-xs font-semibold"
          onClick={() => setTab("Assistant")}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" /> Assistant IA
        </Button>
        {[
          "Fichier", "Accueil", "Insérer", "Mise en page",
          "Références", "Publipostage", "Révision", "Affichage", "Retouche"
        ].map((m) => (
          <Button
            key={m}
            size="sm"
            variant={activeMenu === m && tab !== "Assistant" ? "secondary" : "ghost"}
            className="h-7 px-2.5 text-xs text-primary-foreground hover:bg-primary/80"
            onClick={() => {
              setActiveMenu(m);
              setTab("Mise en forme");
            }}
          >
            {m}
          </Button>
        ))}
      </div>

      {/* Ruban dynamique contextuel */}
      <div className="p-1 flex flex-wrap items-center gap-1 border-b bg-background min-h-10 text-xs">
        {/* ONGLET FICHIER */}
        {activeMenu === "Fichier" && (
          <div className="flex flex-wrap items-center gap-1">
            {btn(<FilePlus className="h-4 w-4" />, "Nouveau", handleNewDoc)}
            <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.html,.docx,.odt" onChange={handleOpenFile} />
            {btn(<FolderOpen className="h-4 w-4" />, "Ouvrir", () => fileInputRef.current?.click())}
            {btn(<Save className="h-4 w-4" />, "Enregistrer", save)}
            {btn(<Download className="h-4 w-4" />, "DOCX", () => exportAs("docx"))}
            {btn(<Download className="h-4 w-4" />, "HTML", () => exportAs("html"))}
            {btn(<Download className="h-4 w-4" />, "Texte (.txt)", () => exportAs("txt"))}
            {btn(<Printer className="h-4 w-4" />, "Imprimer / PDF", () => window.print())}
            {btn(<Share2 className="h-4 w-4" />, "Partager / WhatsApp", handleShare)}
          </div>
        )}

        {/* ONGLET ACCUEIL */}
        {activeMenu === "Accueil" && (
          <div className="flex flex-wrap items-center gap-1">
            {/* Presse-papier */}
            {btn(<Scissors className="h-4 w-4" />, "Couper", () => document.execCommand("cut"))}
            {btn(<Copy className="h-4 w-4" />, "Copier", () => document.execCommand("copy"))}
            <div className="h-4 w-px bg-border mx-1" />

            {/* Polices & Tailles */}
            <select
              className="h-7 rounded border bg-card px-1 text-xs"
              value={editor?.getAttributes("textStyle")["fontFamily"] ?? "Times New Roman"}
              onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
            >
              <option value="Times New Roman">Times New Roman</option>
              <option value="Arial">Arial</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
            </select>

            <select
              className="h-7 rounded border bg-card px-1 text-xs"
              value={editor?.getAttributes("textStyle")["fontSize"] ?? "13pt"}
              onChange={(e) => editor?.chain().focus().setFontSize(e.target.value).run()}
            >
              {["10pt", "11pt", "12pt", "13pt", "14pt", "16pt", "18pt", "24pt"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {btn(<Bold className="h-4 w-4" />, "Gras", () => editor?.chain().focus().toggleBold().run(), editor?.isActive("bold"))}
            {btn(<Italic className="h-4 w-4" />, "Italique", () => editor?.chain().focus().toggleItalic().run(), editor?.isActive("italic"))}
            {btn(<Underline className="h-4 w-4" />, "Souligné", () => editor?.chain().focus().toggleUnderline().run(), editor?.isActive("underline"))}
            {btn(<Strikethrough className="h-4 w-4" />, "Barré", () => editor?.chain().focus().toggleStrike().run(), editor?.isActive("strike"))}

            <label className="flex items-center gap-1 cursor-pointer" title="Couleur texte">
              <span className="font-bold underline">A</span>
              <input type="color" className="h-6 w-6 cursor-pointer border-none bg-transparent" onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()} />
            </label>

            <label className="flex items-center gap-1 cursor-pointer" title="Surlignage">
              <span className="bg-yellow-200 px-1 font-bold">ab</span>
              <input type="color" defaultValue="#fef08a" className="h-6 w-6 cursor-pointer border-none bg-transparent" onChange={(e) => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()} />
            </label>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Paragraphes & Alignement */}
            {btn(<AlignLeft className="h-4 w-4" />, "Gauche", () => editor?.chain().focus().setTextAlign("left").run())}
            {btn(<AlignCenter className="h-4 w-4" />, "Centré", () => editor?.chain().focus().setTextAlign("center").run())}
            {btn(<AlignRight className="h-4 w-4" />, "Droite", () => editor?.chain().focus().setTextAlign("right").run())}
            {btn(<AlignJustify className="h-4 w-4" />, "Justifié", () => editor?.chain().focus().setTextAlign("justify").run())}

            {btn(<List className="h-4 w-4" />, "Puces", () => editor?.chain().focus().toggleBulletList().run())}
            {btn(<ListOrdered className="h-4 w-4" />, "Numéros", () => editor?.chain().focus().toggleOrderedList().run())}

            {/* Styles Rapides */}
            <select
              className="h-7 rounded border bg-card px-1 text-xs font-semibold"
              onChange={(e) => {
                const val = e.target.value;
                if (val === "p") editor?.chain().focus().setParagraph().run();
                else editor?.chain().focus().setHeading({ level: Number(val) as 1 | 2 | 3 | 4 }).run();
              }}
            >
              <option value="p">Normal</option>
              <option value="1">Titre 1</option>
              <option value="2">Titre 2</option>
              <option value="3">Titre 3</option>
              <option value="4">Titre 4</option>
            </select>

            {btn(<Eraser className="h-4 w-4" />, "Effacer format", () => editor?.chain().focus().unsetAllMarks().clearNodes().run())}
          </div>
        )}

        {/* ONGLET INSÉRER */}
        {activeMenu === "Insérer" && (
          <div className="flex flex-wrap items-center gap-1">
            {btn(<Table className="h-4 w-4" />, "Tableau 3x3", () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
            {btn(<Image className="h-4 w-4" />, "Image locale", () => {
              const inp = document.createElement("input");
              inp.type = "file";
              inp.accept = "image/*";
              inp.onchange = () => {
                const f = inp.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => editor?.chain().focus().setImage({ src: String(r.result) }).run();
                r.readAsDataURL(f);
              };
              inp.click();
            })}
            {btn(<Link2 className="h-4 w-4" />, "Lien", () => {
              const url = prompt("Adresse URL (ex: https://...) :");
              if (url) editor?.chain().focus().setLink({ href: safeLink(url) }).run();
            })}
            {btn(<FilePlus className="h-4 w-4" />, "Saut de page", () => editor?.chain().focus().insertContent({ type: "pageBreak" }).run())}
            {btn(<PlusCircle className="h-4 w-4" />, "Page de garde", () => {
              const cover = `<div class="cover-page" style="text-align:center;padding:5cm 0;border-bottom:2px solid #ccc;"><h1>TITRE DU TRAVAIL SCIENTIFIQUE</h1><h3>Sous-titre ou mention de recherche</h3><p style="margin-top:4cm;">Présenté par l'Auteur<br/>Directeur : Prof. Jules-Eminence NZUNDU NZALALEMBA</p><p style="margin-top:3cm;">BERSA — Berceau du Savoir</p></div><div class="page-break"></div>`;
              editor?.chain().focus().insertContent(cover).run();
              toast.success("Page de garde insérée.");
            })}
            {btn(<Type className="h-4 w-4" />, "Date & Heure", () => {
              const d = new Date().toLocaleDateString("fr-FR", { dateStyle: "long" });
              editor?.chain().focus().insertContent(` ${d} `).run();
            })}
          </div>
        )}

        {/* ONGLET MISE EN PAGE */}
        {activeMenu === "Mise en page" && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1">
              Marges :
              <select
                className="h-7 rounded border bg-card px-1"
                value={settings.margin}
                onChange={(e) => setSettings({ ...settings, margin: e.target.value as any })}
              >
                <option value="Normales">Normales (2.5 cm)</option>
                <option value="Étroites">Étroites (1.27 cm)</option>
                <option value="Larges">Larges (3.5 cm)</option>
              </select>
            </label>

            <label className="flex items-center gap-1">
              Orientation :
              <select
                className="h-7 rounded border bg-card px-1"
                value={settings.orientation}
                onChange={(e) => setSettings({ ...settings, orientation: e.target.value as any })}
              >
                <option value="Portrait">Portrait</option>
                <option value="Paysage">Paysage</option>
              </select>
            </label>

            <label className="flex items-center gap-1">
              Format papier :
              <select
                className="h-7 rounded border bg-card px-1"
                value={settings.format}
                onChange={(e) => setSettings({ ...settings, format: e.target.value as any })}
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="A5">A5</option>
                <option value="Letter">Letter</option>
              </select>
            </label>

            <label className="flex items-center gap-1">
              Filigrane :
              <Input
                placeholder="Ex: BROUILLON / CONFIDENTIEL"
                value={settings.watermark}
                onChange={(e) => setSettings({ ...settings, watermark: e.target.value })}
                className="h-7 w-40 text-xs"
              />
            </label>
          </div>
        )}

        {/* ONGLET RÉFÉRENCES */}
        {activeMenu === "Références" && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 font-semibold">
              Norme académique :
              <select
                className="h-7 rounded border bg-card px-1"
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value as any)}
              >
                <option value="APA7">APA 7e édition</option>
                <option value="APA6">APA 6e édition</option>
                <option value="APA5">APA 5e édition</option>
                <option value="Chicago">Chicago 15e / 16e</option>
              </select>
            </label>

            {btn(<BookmarkCheck className="h-4 w-4" />, "Insérer une citation", insertCitation)}
            {btn(<BookOpen className="h-4 w-4" />, "Table des matières", insertTOC)}
            {btn(<Hash className="h-4 w-4" />, "Note de bas de page", () => {
              const note = prompt("Texte de la note explicative :");
              if (!note) return;
              editor?.chain().focus().insertContent(`<sup>[Note]</sup> <small style="font-size:10pt;">${note}</small>`).run();
            })}
          </div>
        )}

        {/* ONGLET PUBLIPOSTAGE */}
        {activeMenu === "Publipostage" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Champs de fusion :</span>
            {["{{Nom}}", "{{Prénom}}", "{{Titre}}", "{{Institution}}", "{{Date}}"].map((field) => (
              <Button
                key={field}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => editor?.chain().focus().insertContent(` ${field} `).run()}
              >
                + {field}
              </Button>
            ))}
            {btn(<Sliders className="h-4 w-4" />, "Fusionner aperçu", () => {
              let html = editor?.getHTML() ?? "";
              html = html.replace(/{{Nom}}/g, "KABAMBA")
                         .replace(/{{Prénom}}/g, "Dieudonné")
                         .replace(/{{Institution}}/g, "Université de Kinshasa");
              editor?.commands.setContent(html);
              toast.success("Aperçu de la fusion appliqué sur l'exemple.");
            })}
          </div>
        )}

        {/* ONGLET RÉVISION */}
        {activeMenu === "Révision" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="default" className="h-7 text-xs" onClick={correct}>
              <CheckSquare className="h-4 w-4 mr-1" /> Correction & Grammaire IA
            </Button>
            <div className="flex items-center gap-1">
              <Input
                placeholder="Rechercher"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="h-7 w-28 text-xs"
              />
              <Input
                placeholder="Remplacer"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="h-7 w-28 text-xs"
              />
              {btn(<Replace className="h-4 w-4" />, "Remplacer tout", handleReplaceAll)}
            </div>
            <span className="text-muted-foreground ml-auto">
              Statistiques : {editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0} mots · {editor?.getText().length ?? 0} caractères
            </span>
          </div>
        )}

        {/* ONGLET AFFICHAGE */}
        {activeMenu === "Affichage" && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1">
              Zoom :
              <select
                className="h-7 rounded border bg-card px-1"
                value={settings.zoom}
                onChange={(e) => setSettings({ ...settings, zoom: e.target.value })}
              >
                <option value="75%">75 %</option>
                <option value="100%">100 %</option>
                <option value="125%">125 %</option>
                <option value="150%">150 %</option>
                <option value="200%">200 %</option>
              </select>
            </label>

            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.ruler}
                onChange={(e) => setSettings({ ...settings, ruler: e.target.checked })}
              />
              Règle métrique
            </label>

            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.viewMode === "lecture"}
                onChange={(e) => {
                  const mode = e.target.checked ? "lecture" : "page";
                  editor?.setEditable(!e.target.checked);
                  setSettings({ ...settings, viewMode: mode });
                }}
              />
              Mode lecture seule
            </label>
          </div>
        )}
        {/* ONGLET RETOUCHE */}
        {activeMenu === "Retouche" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Retouche de texte sélectionné :</span>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => correct()}>
              Harmoniser le style
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => editor?.chain().focus().undo().run()}>
              Annuler dernière retouche
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => editor?.chain().focus().redo().run()}>
              Rétablir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

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
   </div>
   </div>
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
