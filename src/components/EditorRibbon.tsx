import { useState, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Indent, Outdent,
  Eraser, Table as TableIcon, Image as ImageIcon, Link2, Search, Replace, Printer, Download,
  Save, Sparkles, Sliders, Type, FileText, Layout, BookOpen, CheckSquare, Eye,
  Plus, Trash2, Columns, ZoomIn, ZoomOut, FilePlus, FolderOpen, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  lineSpacing?: string;
  fontFamily?: string;
  fontSize?: string;
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
  setSettings: React.Dispatch<React.SetStateAction<PageSettings>>;
  attach: () => void;
  save: () => void;
  correct: () => void;
}) {
  const [activeMenu, setActiveMenu] = useState<string>("Accueil");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const btn = (icon: any, label: string, onClick: () => void, active = false, title?: string) => (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className={`h-8 px-2 text-xs font-medium gap-1.5 ${active ? "bg-primary/15 text-primary border border-primary/20" : "text-foreground"}`}
      onClick={onClick}
      title={title || label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );

  const iconOnly = (icon: any, onClick: () => void, active = false, title: string) => (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className={`h-8 w-8 ${active ? "bg-primary/15 text-primary" : "text-foreground"}`}
      onClick={onClick}
      title={title}
    >
      {icon}
    </Button>
  );

  // Insertion d'image locale
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          editor.chain().focus().setImage({ src: reader.result }).run();
          toast.success("Image insérée avec succès");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Insertion de lien
  const handleInsertLink = () => {
    const url = window.prompt("Entrez l'adresse du lien URL :", "https://");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
      toast.success("Lien inséré");
    }
  };

  // Insertion d'un sommaire dynamique (Table des matières)
  const handleInsertTOC = () => {
    const headings: string[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "heading") {
        const level = node.attrs.level;
        headings.push(`${"  ".repeat(level - 1)}• ${node.textContent}`);
      }
    });

    if (headings.length === 0) {
      toast.info("Aucun titre détecté. Utilisez Titre 1, 2 ou 3 dans l'onglet Accueil.");
      return;
    }

    const tocHtml = `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; margin:20px 0; border-radius:6px;">
        <h3 style="margin-top:0; font-family:'Times New Roman', serif; text-align:center;">TABLE DES MATIÈRES</h3>
        <p style="text-indent:0; font-size:14px; line-height:1.6;">${headings.join("<br/>")}</p>
      </div>
    `;
    editor.chain().focus().insertContent(tocHtml).run();
    toast.success("Sommaire généré avec succès");
  };

  // Recherche et remplacement
  const handleFindReplace = () => {
    if (!findText) return;
    const html = editor.getHTML();
    if (!html.includes(findText)) {
      toast.error("Texte introuvable");
      return;
    }
    const newHtml = html.split(findText).join(replaceText);
    editor.commands.setContent(newHtml);
    toast.success(`Remplacement effectué pour "${findText}"`);
  };

  const menus = ["Fichier", "Accueil", "Insertion", "Mise en page", "Références", "Révision", "Affichage"];

  return (
    <div className="no-print border-b border-border bg-card/95 backdrop-blur-sm select-none">
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

      {/* Onglets principaux du Ruban WPS / Word */}
      <div className="flex items-center gap-1 px-3 pt-1 border-b border-border/60 overflow-x-auto scrollbar-none">
        {menus.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setActiveMenu(m)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-t-md transition-colors relative ${
              activeMenu === m
                ? "bg-background text-primary border-t-2 border-primary border-x border-border/80 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            {m}
          </button>
        ))}

        {/* Bouton rapide d'amélioration BERSA */}
        <div className="ml-auto flex items-center gap-1.5 pb-1">
          <Button
            type="button"
            size="sm"
            variant="default"
            className="h-7 text-xs gap-1.5 bg-royal-gradient text-white shadow-xs font-medium"
            onClick={correct}
            title="Optimiser, corriger et enrichir le document avec BERSA"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Améliorer</span>
          </Button>
        </div>
      </div>

      {/* Boîte à outils contextuelle selon l'onglet actif */}
      <div className="p-2 flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-none min-h-[46px] bg-background/50">

        {/* 1. FICHIER */}
        {activeMenu === "Fichier" && (
          <div className="flex items-center gap-1.5">
            {btn(<FilePlus className="w-4 h-4 text-primary" />, "Nouveau", () => {
              if (window.confirm("Créer un nouveau document vierge ? Les modifications non enregistrées seront perdues.")) {
                editor.commands.setContent("<p></p>");
                toast.success("Nouveau document vierge créé");
              }
            })}
            {btn(<FolderOpen className="w-4 h-4 text-amber-500" />, "Ouvrir / Importer", attach)}
            {btn(<Save className="w-4 h-4 text-emerald-600" />, "Enregistrer", save)}
            <div className="h-5 w-[1px] bg-border mx-1" />
            {btn(<Download className="w-4 h-4 text-blue-600" />, "Exporter Word (.docx)", () => {
              const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Document BERSA</title></head><body>${editor.getHTML()}</body></html>`;
              const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `Document_BERSA_${new Date().toISOString().slice(0, 10)}.doc`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Document Word téléchargé");
            })}
            {btn(<Printer className="w-4 h-4" />, "Imprimer / PDF", () => window.print())}
          </div>
        )}

        {/* 2. ACCUEIL */}
        {activeMenu === "Accueil" && (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Police */}
            <select
              className="h-8 px-2 text-xs rounded-md border border-input bg-background font-medium"
              value={settings.fontFamily || "Times New Roman"}
              onChange={(e) => {
                const val = e.target.value;
                setSettings((s) => ({ ...s, fontFamily: val }));
                editor.chain().focus().run();
              }}
              title="Police du document"
            >
              <option value="Times New Roman">Times New Roman (Standard)</option>
              <option value="Arial">Arial</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
            </select>

            {/* Taille de police */}
            <div className="flex items-center gap-0.5 border border-input rounded-md px-1 bg-background h-8">
              <span className="text-xs font-semibold px-1">12 pt</span>
            </div>

            <div className="h-5 w-[1px] bg-border mx-1" />

            {/* Gras, Italique, Souligné, Barré */}
            {iconOnly(<Bold className="w-4 h-4" />, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "Gras (Ctrl+B)")}
            {iconOnly(<Italic className="w-4 h-4" />, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "Italique (Ctrl+I)")}
            {iconOnly(<Underline className="w-4 h-4" />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), "Souligné (Ctrl+U)")}
            {iconOnly(<Strikethrough className="w-4 h-4" />, () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"), "Barré")}
            {iconOnly(<Subscript className="w-4 h-4" />, () => editor.chain().focus().toggleSubscript?.().run(), editor.isActive("subscript"), "Indice")}
            {iconOnly(<Superscript className="w-4 h-4" />, () => editor.chain().focus().toggleSuperscript?.().run(), editor.isActive("superscript"), "Exposant")}

            <div className="h-5 w-[1px] bg-border mx-1" />

            {/* Styles rapides */}
            <Button
              type="button"
              variant={editor.isActive("paragraph") ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              Normal
            </Button>
            <Button
              type="button"
              variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 text-xs font-bold"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              Titre 1
            </Button>
            <Button
              type="button"
              variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 text-xs font-semibold"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              Titre 2
            </Button>
            <Button
              type="button"
              variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 text-xs italic"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              Titre 3
            </Button>

            <div className="h-5 w-[1px] bg-border mx-1" />

            {/* Alignements : G, C, D, Justifié */}
            {iconOnly(<AlignLeft className="w-4 h-4" />, () => editor.chain().focus().setTextAlign("left").run(), editor.isActive({ textAlign: "left" }), "Aligner à gauche")}
            {iconOnly(<AlignCenter className="w-4 h-4" />, () => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }), "Centrer")}
            {iconOnly(<AlignRight className="w-4 h-4" />, () => editor.chain().focus().setTextAlign("right").run(), editor.isActive({ textAlign: "right" }), "Aligner à droite")}
            {iconOnly(<AlignJustify className="w-4 h-4" />, () => editor.chain().focus().setTextAlign("justify").run(), editor.isActive({ textAlign: "justify" }) || (!editor.isActive({ textAlign: "left" }) && !editor.isActive({ textAlign: "center" }) && !editor.isActive({ textAlign: "right" })), "Justifier (Standard A4)")}

            <div className="h-5 w-[1px] bg-border mx-1" />

            {/* Listes et retraits */}
            {iconOnly(<List className="w-4 h-4" />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"), "Puces")}
            {iconOnly(<ListOrdered className="w-4 h-4" />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"), "Numérotation")}
            {iconOnly(<Indent className="w-4 h-4" />, () => editor.chain().focus().indent?.().run(), false, "Augmenter le retrait")}
            {iconOnly(<Outdent className="w-4 h-4" />, () => editor.chain().focus().outdent?.().run(), false, "Diminuer le retrait")}
            {iconOnly(<Eraser className="w-4 h-4" />, () => editor.chain().focus().unsetAllMarks().clearNodes().run(), false, "Effacer la mise en forme")}
          </div>
        )}

        {/* 3. INSERTION */}
        {activeMenu === "Insertion" && (
          <div className="flex flex-wrap items-center gap-1.5">
            {btn(<TableIcon className="w-4 h-4 text-primary" />, "Insérer Tableau (3x3)", () => {
              editor.chain().focus().insertTable?.({ rows: 3, cols: 3, withHeaderRow: true }).run();
              toast.success("Tableau 3x3 inséré");
            })}
            {btn(<Plus className="w-4 h-4" />, "+ Colonne", () => editor.chain().focus().addColumnAfter?.().run())}
            {btn(<Trash2 className="w-4 h-4 text-destructive" />, "- Colonne", () => editor.chain().focus().deleteColumn?.().run())}
            {btn(<Plus className="w-4 h-4" />, "+ Ligne", () => editor.chain().focus().addRowAfter?.().run())}
            {btn(<Trash2 className="w-4 h-4 text-destructive" />, "- Ligne", () => editor.chain().focus().deleteRow?.().run())}
            
            <div className="h-5 w-[1px] bg-border mx-1" />

            {btn(<ImageIcon className="w-4 h-4 text-emerald-600" />, "Image...", () => fileInputRef.current?.click())}
            {btn(<Link2 className="w-4 h-4 text-blue-600" />, "Lien", handleInsertLink)}
            {btn(<FileText className="w-4 h-4 text-purple-600" />, "Saut de page", () => {
              editor.chain().focus().insertContent('<hr class="page-break" /><p></p>').run();
              toast.success("Saut de page inséré");
            })}
          </div>
        )}

        {/* 4. MISE EN PAGE */}
        {activeMenu === "Mise en page" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Marges :</span>
            <Button
              type="button"
              size="sm"
              variant={settings.margin === "Normales" ? "secondary" : "ghost"}
              className="h-8 text-xs font-medium"
              onClick={() => setSettings((s) => ({ ...s, margin: "Normales" }))}
            >
              2,5 cm (Standard)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={settings.margin === "Étroites" ? "secondary" : "ghost"}
              className="h-8 text-xs font-medium"
              onClick={() => setSettings((s) => ({ ...s, margin: "Étroites" }))}
            >
              1,27 cm (Étroites)
            </Button>

            <div className="h-5 w-[1px] bg-border mx-1" />

            <span className="text-xs text-muted-foreground font-medium">Orientation :</span>
            <Button
              type="button"
              size="sm"
              variant={settings.orientation === "Portrait" ? "secondary" : "ghost"}
              className="h-8 text-xs font-medium"
              onClick={() => setSettings((s) => ({ ...s, orientation: "Portrait" }))}
            >
              Portrait (A4)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={settings.orientation === "Paysage" ? "secondary" : "ghost"}
              className="h-8 text-xs font-medium"
              onClick={() => setSettings((s) => ({ ...s, orientation: "Paysage" }))}
            >
              Paysage
            </Button>

            <div className="h-5 w-[1px] bg-border mx-1" />

            <span className="text-xs text-muted-foreground font-medium">Format :</span>
            <span className="text-xs font-semibold px-2 py-1 bg-muted rounded">A4 (210 × 297 mm)</span>
          </div>
        )}

        {/* 5. RÉFÉRENCES */}
        {activeMenu === "Références" && (
          <div className="flex flex-wrap items-center gap-1.5">
            {btn(<BookOpen className="w-4 h-4 text-primary" />, "Générer Sommaire / Table des matières", handleInsertTOC)}
            {btn(<FileText className="w-4 h-4 text-amber-600" />, "Insérer Note de bas de page", () => {
              const noteText = window.prompt("Texte de la note de bas de page :");
              if (noteText) {
                editor.chain().focus().insertContent(`<sup>[note]</sup>`).run();
                toast.success("Note ajoutée");
              }
            })}
            {btn(<Type className="w-4 h-4 text-purple-600" />, "Citation APA 7ème", () => {
              const author = window.prompt("Auteur (ex: BERSA, 2026) :", "BERSA, 2026");
              if (author) {
                editor.chain().focus().insertContent(` (${author})`).run();
              }
            })}
          </div>
        )}

        {/* 6. RÉVISION */}
        {activeMenu === "Révision" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Input
                placeholder="Rechercher..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="h-8 w-28 text-xs"
              />
              <Input
                placeholder="Remplacer par..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="h-8 w-28 text-xs"
              />
              <Button type="button" size="sm" variant="secondary" className="h-8 text-xs" onClick={handleFindReplace}>
                Remplacer
              </Button>
            </div>

            <div className="h-5 w-[1px] bg-border mx-1" />

            {btn(<Sparkles className="w-4 h-4 text-gold" />, "Vérification & Style BERSA", correct)}
          </div>
        )}

        {/* 7. AFFICHAGE */}
        {activeMenu === "Affichage" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={settings.ruler ? "secondary" : "ghost"}
              className="h-8 text-xs"
              onClick={() => setSettings((s) => ({ ...s, ruler: !s.ruler }))}
            >
              {settings.ruler ? "Masquer la Règle" : "Afficher la Règle"}
            </Button>

            <div className="h-5 w-[1px] bg-border mx-1" />

            <span className="text-xs text-muted-foreground font-medium">Zoom :</span>
            {["75%", "100%", "125%"].map((z) => (
              <Button
                key={z}
                type="button"
                size="sm"
                variant={settings.zoom === z ? "secondary" : "ghost"}
                className="h-8 text-xs"
                onClick={() => setSettings((s) => ({ ...s, zoom: z }))}
              >
                {z}
              </Button>
            ))}
            
            <div className="h-5 w-[1px] bg-border mx-1" />

            <Button
              type="button"
              size="sm"
              variant={settings.viewMode === "lecture" ? "secondary" : "ghost"}
              className="h-8 text-xs"
              onClick={() => setSettings((s) => ({ ...s, viewMode: s.viewMode === "lecture" ? "page" : "lecture" }))}
            >
              <Eye className="w-4 h-4 mr-1" />
              {settings.viewMode === "lecture" ? "Mode Page" : "Mode Lecture"}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
