import { useState, useRef, useEffect } from "react";
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
import { changeIndent, replaceAllText } from "@/lib/writer-commands";
import { insertFootnote } from "@/lib/footnotes";
import { TOC_TITLE, tocLines, refreshToc } from "@/lib/toc";
import { SHAPES, SYMBOLS, shapeSrc, setTracking, isTracking, acceptAll, rejectAll, listComments, removeComment, citation, bibliographyHtml, type Source } from "@/lib/review-marks";

export type PageSettings = {
  margin: "Normales" | "Étroites" | "Larges";
  orientation: "Portrait" | "Paysage";
  format: "A4" | "A5" | "Letter" | "A3" | "Legal";
  pageColor?: string;
  differentFirstPage?: boolean;
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
  columns?: number;
  pageBorder?: boolean;
};

export function EditorRibbon({
  editor,
  tab,
  setTab,
  settings,
  setSettings,
  attach,
  save,
  correct,
  exportPdf,
  saveVersion,
  openVersions,
  cloudState,
}: {
  editor: Editor | null;
  tab: string;
  setTab: (tab: string) => void;
  settings: PageSettings;
  setSettings: React.Dispatch<React.SetStateAction<PageSettings>>;
  attach: () => void;
  save: () => void;
  correct: () => void;
  exportPdf: () => void;
  saveVersion: () => void;
  openVersions: () => void;
  cloudState: string;
}) {
  const [sources, setSources] = useState<Source[]>(() => { try { return JSON.parse(localStorage.getItem("bersa_sources") || "[]"); } catch { return []; } });
  const [, force] = useState(0);
  const [isFull, setIsFull] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>("Texte");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editor) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const fn = () => { clearTimeout(t); t = setTimeout(() => refreshToc(editor), 800); };
    editor.on("update", fn);
    return () => { clearTimeout(t); editor.off("update", fn); };
  }, [editor]);
  if (!editor) return null;
  const persistSources = (l: Source[]) => { setSources(l); localStorage.setItem("bersa_sources", JSON.stringify(l)); };
  const addSource = () => {
    const author = window.prompt("Auteur(s) (Nom, Initiale) :"); if (!author) return;
    const year = window.prompt("Année de publication :") || "s.d.";
    const title = window.prompt("Titre de l'ouvrage ou de l'article :"); if (!title) return;
    const publisher = window.prompt("Éditeur ou revue (facultatif) :") || "";
    const s: Source = { id: crypto.randomUUID(), author: author.trim(), year: year.trim(), title: title.trim(), publisher: publisher.trim() };
    persistSources([...sources, s]); editor.chain().focus().insertContent(" " + citation(s)).run(); toast.success("Source ajoutée et citée");
  };
  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); setIsFull(false); }
      else { await document.documentElement.requestFullscreen(); setIsFull(true); }
    } catch { toast.error("Plein écran non disponible sur cet appareil"); }
  };
  const tracking = isTracking(editor);
  const comments = listComments(editor);

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

  // Table des matières : un titre « TABLE DES MATIÈRES » suivi d'un paragraphe mis à jour automatiquement
  const handleInsertTOC = () => {
    if (!tocLines(editor).length) { toast.info("Aucun titre détecté. Utilisez Titre 1, 2 ou 3 dans l'onglet Paragraphe."); return; }
    editor.chain().focus().insertContent(`<h3 style="text-align:center">${TOC_TITLE}</h3><p>…</p>`).run();
    refreshToc(editor, true);
    toast.success("Table des matières insérée — elle se met à jour automatiquement");
  };
  const cropImage = async () => {
    const sel = editor.state.selection as unknown as { node?: { type: { name: string }; attrs: Record<string, unknown> } };
    if (sel.node?.type.name !== "image") { toast.info("Touchez d'abord une image pour la sélectionner."); return; }
    const v = window.prompt("Rogner (%) : haut, droite, bas, gauche", "10,10,10,10");
    if (!v) return;
    const [t = 0, r = 0, b = 0, l = 0] = v.split(",").map(n => Math.min(45, Math.max(0, Number(n) || 0)) / 100);
    try {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.src = String(sel.node.attrs["src"]);
      await img.decode();
      const sx = img.naturalWidth * l, sy = img.naturalHeight * t;
      const w = img.naturalWidth * (1 - l - r), h = img.naturalHeight * (1 - t - b);
      const c = document.createElement("canvas"); c.width = Math.round(w); c.height = Math.round(h);
      c.getContext("2d")!.drawImage(img, sx, sy, w, h, 0, 0, w, h);
      editor.chain().focus().updateAttributes("image", { src: c.toDataURL("image/png") }).run();
      toast.success("Image rognée");
    } catch { toast.error("Cette image ne peut pas être rognée (source externe protégée)."); }
  };

  // Recherche et remplacement
  const handleFindReplace = () => {
    if (!findText) return;
    const n = replaceAllText(editor, findText, replaceText);
    if (!n) { toast.error("Texte introuvable"); return; }
    toast.success(`${n} remplacement(s) effectué(s)`);
  };

  const menus: Array<[string, any]> = [["Texte", Type], ["Paragraphe", AlignLeft], ["Insertion", Plus], ["Mise en page", Layout]];
  const moreMenus = ["Fichier", "Références", "Révision", "Affichage"];
  const curSize = () => parseFloat((editor.getAttributes("textStyle")["fontSize"] as string) || settings.fontSize || "13") || 13;
  const stepSize = (d: number) => { const v = Math.min(96, Math.max(6, curSize() + d)) + "pt"; setSettings((s) => ({ ...s, fontSize: v })); (editor.chain().focus() as any).setFontSize(v).run(); };
  const askTable = () => {
    const r = Number(window.prompt("Nombre de lignes :", "3")); const c = Number(window.prompt("Nombre de colonnes :", "3"));
    if (!r || !c || r < 1 || c < 1 || r > 50 || c > 20) { toast.error("Dimensions invalides (lignes 1-50, colonnes 1-20)"); return; }
    editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run(); toast.success(`Tableau ${r}×${c} inséré`);
  };

  return (
    <div className="no-print border-b border-border bg-card/95 backdrop-blur-sm select-none">
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

      {/* Onglets principaux du Ruban WPS / Word */}
      <div className="flex flex-nowrap items-center gap-0.5 px-1.5 pt-0.5 border-b border-border/60 overflow-x-auto scrollbar-none">
        {menus.map(([m, Icon]) => (
          <button key={m} type="button" onClick={() => setActiveMenu(m)} aria-pressed={activeMenu === m}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${activeMenu === m ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>
            <Icon className="h-4 w-4" />{m}
          </button>
        ))}
        <select aria-label="Autres outils" value={moreMenus.includes(activeMenu) ? activeMenu : ""} onChange={(e) => e.target.value && setActiveMenu(e.target.value)}
          className={`shrink-0 h-7 px-1 text-[11px] rounded-md border border-input bg-background ${moreMenus.includes(activeMenu) ? "text-primary font-semibold" : "text-muted-foreground"}`}>
          <option value="">Plus…</option>
          {moreMenus.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

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
      
      {/* Boîte à outils horizontale défilable sans empilement désordonné */}
      <div className="px-1.5 py-1 flex flex-nowrap items-center gap-1 overflow-x-auto scrollbar-none touch-pan-x min-h-[38px] bg-background/50 whitespace-nowrap">
    
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
            {btn(<Download className="w-4 h-4 text-blue-600" />, "Exporter PDF", exportPdf)}
            {btn(<Printer className="w-4 h-4" />, "Imprimer", () => window.print())}
            <div className="h-5 w-[1px] bg-border mx-1" />
            {btn(<Save className="w-4 h-4 text-primary" />, "Enregistrer une version", saveVersion)}
            {btn(<FolderOpen className="w-4 h-4 text-primary" />, "Historique des versions", openVersions)}
            <span className="text-[11px] text-muted-foreground px-1">{cloudState}</span>
          </div>
        )}

        {/* 2. ACCUEIL */}
        {activeMenu === "Texte" && (
          <div className="flex flex-nowrap items-center gap-1">
            {/* Police */}
            <select
              className="h-8 px-2 text-xs rounded-md border border-input bg-background font-medium"
              value={settings.fontFamily || "Times New Roman"}
              onChange={(e) => {
                const val = e.target.value;
                setSettings((s) => ({ ...s, fontFamily: val }));
                const chain = editor.chain().focus();
                if (editor.state.selection.empty) chain.selectAll().setFontFamily(val).run();
                else chain.setFontFamily(val).run();
              }}
              title="Police du document"
            >
              <option value="Times New Roman">Times New Roman (Standard)</option>
              <option value="Arial">Arial</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
              <option value="Aptos">Aptos</option>
              <option value="Cambria">Cambria</option>
              <option value="Garamond">Garamond</option>
              <option value="Verdana">Verdana</option>
              <option value="Courier New">Courier New</option>
            </select>

            {/* Taille de police */}
            <select
              aria-label="Taille du texte"
              title="Taille du texte"
              className="h-8 px-1 text-xs rounded-md border border-input bg-background font-semibold"
              value={(editor.getAttributes("textStyle")["fontSize"] as string) || settings.fontSize || "13pt"}
              onChange={(e) => {
                const size = e.target.value;
                setSettings((s) => ({ ...s, fontSize: size }));
                const chain = editor.chain().focus() as any;
                if (editor.state.selection.empty) chain.selectAll().setFontSize(size).run();
                else chain.setFontSize(size).run();
              }}
            >
              {["8pt","9pt","10pt","11pt","12pt","13pt","14pt","16pt","18pt","20pt","24pt","28pt","36pt","48pt","72pt"].map((v) => (
                <option key={v} value={v}>{v.replace("pt", " pt")}</option>
              ))}
            </select>

            <div className="h-5 w-[1px] bg-border mx-1" />

            {/* Gras, Italique, Souligné, Barré */}
            {iconOnly(<Bold className="w-4 h-4" />, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "Gras (Ctrl+B)")}
            {iconOnly(<Italic className="w-4 h-4" />, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "Italique (Ctrl+I)")}
            {iconOnly(<Underline className="w-4 h-4" />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), "Souligné (Ctrl+U)")}
            {iconOnly(<Strikethrough className="w-4 h-4" />, () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"), "Barré")}
            {iconOnly(<Subscript className="w-4 h-4" />, () => editor.chain().focus().toggleSubscript().run(), editor.isActive("subscript"), "Indice")}
            {iconOnly(<Superscript className="w-4 h-4" />, () => editor.chain().focus().toggleSuperscript().run(), editor.isActive("superscript"), "Exposant")}        
            <div className="h-5 w-[1px] bg-border mx-1" />

            {iconOnly(<span className="text-xs font-bold">A+</span>, () => stepSize(1), false, "Augmenter la taille")}
            {iconOnly(<span className="text-[10px] font-bold">A-</span>, () => stepSize(-1), false, "Diminuer la taille")}
            <label className="flex h-8 items-center gap-1 rounded-md px-1.5 text-xs hover:bg-muted" title="Couleur du texte">
              <span className="font-bold underline decoration-2">A</span>
              <input type="color" aria-label="Couleur du texte" className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" onChange={(e) => (editor.chain().focus() as any).setColor(e.target.value).run()} />
            </label>
            <label className="flex h-8 items-center gap-1 rounded-md px-1.5 text-xs hover:bg-muted" title="Surlignage">
              <span className="rounded bg-accent px-0.5 font-bold">ab</span>
              <input type="color" aria-label="Surlignage" defaultValue="#fff59d" className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} />
            </label>
            {iconOnly(<Eraser className="w-4 h-4" />, () => editor.chain().focus().unsetAllMarks().run(), false, "Effacer la mise en forme")}
          </div>
        )}

        {activeMenu === "Paragraphe" && (
          <div className="flex flex-nowrap items-center gap-1">
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
            {iconOnly(<Indent className="w-4 h-4" />, () => changeIndent(editor, 1), false, "Augmenter le retrait")}
            {iconOnly(<Outdent className="w-4 h-4" />, () => changeIndent(editor, -1), false, "Diminuer le retrait")}
            <div className="h-5 w-[1px] bg-border mx-1" />

            {/* Outil d'Espacement et Interligne (WPS / Word) */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground font-semibold">Interligne :</span>
              <select
                className="h-8 px-2 text-xs rounded-md border border-input bg-background font-medium"
                value={settings.lineSpacing || "1.5"}
                onChange={(e) => {
                  const val = e.target.value;
                  setSettings((s) => ({ ...s, lineSpacing: val }));
                  toast.success(`Interligne réglé à ${val}`);
                }}
                title="Espacement des lignes (Interligne)"
              >
                <option value="1.0">1,0 (Simple)</option>
                <option value="1.15">1,15 (Normal)</option>
                <option value="1.5">1,5 (Standard académique)</option>
                <option value="2.0">2,0 (Double)</option>
              </select>

              {/* Supprimer / Ajouter l'espace de paragraphe */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  const sheet = document.querySelector(".home-ai-sheet") as HTMLElement;
                  if (sheet) {
                    const isZero = sheet.classList.toggle("no-para-spacing");
                    sheet.querySelectorAll("p").forEach((p) => {
                      (p as HTMLElement).style.marginBottom = isZero ? "0px" : "0.65em";
                    });
                    toast.success(isZero ? "Espace après paragraphe supprimé" : "Espace après paragraphe activé");
                  }
                }}
                title="Activer ou désactiver l'espacement après les paragraphes"
              >
               Espacement §
              </Button>
            </div>
          </div>
        )}
        
        {/* 3. INSERTION */}
        {activeMenu === "Insertion" && (
          <div className="flex flex-nowrap items-center gap-1">
            {btn(<FileText className="w-4 h-4 text-amber-600" />, "Note de bas de page", () => { insertFootnote(editor, ""); setTimeout(() => { const all = document.querySelectorAll<HTMLInputElement>("input[data-fn-input]"); all[all.length - 1]?.focus(); }, 80); })}
            {btn(<TableIcon className="w-4 h-4 text-primary" />, "Tableau…", askTable)}
            {btn(<Columns className="w-4 h-4" />, "Fusionner", () => { if (!editor.chain().focus().mergeCells().run()) toast.error("Sélectionnez plusieurs cellules"); })}
            {btn(<Columns className="w-4 h-4" />, "Fractionner", () => { if (!editor.chain().focus().splitCell().run()) toast.error("Placez-vous dans une cellule fusionnée"); })}
            {btn(<Trash2 className="w-4 h-4 text-destructive" />, "Suppr. tableau", () => editor.chain().focus().deleteTable().run())}
            {btn(<Plus className="w-4 h-4" />, "+ Colonne", () => editor.chain().focus().addColumnAfter?.().run())}
            {btn(<Trash2 className="w-4 h-4 text-destructive" />, "- Colonne", () => editor.chain().focus().deleteColumn?.().run())}
            {btn(<Plus className="w-4 h-4" />, "+ Ligne", () => editor.chain().focus().addRowAfter?.().run())}
            {btn(<Trash2 className="w-4 h-4 text-destructive" />, "- Ligne", () => editor.chain().focus().deleteRow?.().run())}
            
            <div className="h-5 w-[1px] bg-border mx-1" />

            {btn(<ImageIcon className="w-4 h-4 text-emerald-600" />, "Image...", () => fileInputRef.current?.click())}
            {btn(<Link2 className="w-4 h-4 text-blue-600" />, "Lien", handleInsertLink)}
            {btn(<FileText className="w-4 h-4" />, "Date et heure", () => editor.chain().focus().insertContent(new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })).run())}
            {btn(<span className="text-xs">―</span>, "Ligne", () => editor.chain().focus().setHorizontalRule().run())}
            {btn(<FileText className="w-4 h-4 text-purple-600" />, "Saut de page", () => {
              editor.chain().focus().insertContent([{ type: "pageBreak" }, { type: "paragraph" }]).run();
              toast.success("Saut de page inséré");
            })}
            <div className="h-5 w-[1px] bg-border mx-1" />
            <select aria-label="Formes" className="h-8 px-1 text-xs rounded-md border border-input bg-background" value="" onChange={e => { const v = e.target.value; if (v) { editor.chain().focus().setImage({ src: shapeSrc(v), alt: v }).run(); toast.success(`Forme « ${v} » insérée`); } }}>
              <option value="">Formes…</option>
              {Object.keys(SHAPES).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select aria-label="Symboles" className="h-8 px-1 text-xs rounded-md border border-input bg-background" value="" onChange={e => { const v = e.target.value; if (v) editor.chain().focus().insertContent(v).run(); }}>
              <option value="">Symboles Ω</option>
              {SYMBOLS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input aria-label="En-tête" placeholder="En-tête de page" value={settings.headerText} onChange={e => setSettings(s => ({ ...s, headerText: e.target.value }))} className="h-8 w-32 text-xs" />
            <Input aria-label="Pied de page" placeholder="Pied de page" value={settings.footerText} onChange={e => setSettings(s => ({ ...s, footerText: e.target.value }))} className="h-8 w-32 text-xs" />
          </div>
        )}

        {/* 4. MISE EN PAGE */}
        {activeMenu === "Mise en page" && (
          <div className="flex flex-nowrap items-center gap-1">
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
            <select aria-label="Format du papier" className="h-8 px-1 text-xs rounded-md border border-input bg-background" value={settings.format} onChange={e => setSettings(s => ({ ...s, format: e.target.value as PageSettings["format"] }))}>
              <option value="A4">A4 (21 × 29,7 cm)</option>
              <option value="A5">A5 (14,8 × 21 cm)</option>
              <option value="Letter">Lettre US (21,6 × 27,9 cm)</option>
              <option value="A3">A3 (29,7 × 42 cm)</option>
              <option value="Legal">Legal (21,6 × 35,6 cm)</option>
            </select>
            <Button type="button" size="sm" variant={settings.margin === "Larges" ? "secondary" : "ghost"} className="h-8 text-xs" onClick={() => setSettings(s => ({ ...s, margin: "Larges" }))}>3,5 cm (Larges)</Button>
            <div className="h-5 w-[1px] bg-border mx-1" />
            <span className="text-xs text-muted-foreground font-medium">Colonnes :</span>
            {[1, 2, 3].map(n => <Button key={n} type="button" size="sm" variant={(settings.columns || 1) === n ? "secondary" : "ghost"} className="h-8 w-8 text-xs" onClick={() => setSettings(s => ({ ...s, columns: n }))}>{n}</Button>)}
            <Button type="button" size="sm" variant={settings.pageBorder ? "secondary" : "ghost"} className="h-8 text-xs" onClick={() => setSettings(s => ({ ...s, pageBorder: !s.pageBorder }))}><Columns className="w-4 h-4 mr-1" />Bordure de page</Button>
            <Button type="button" size="sm" variant={settings.differentFirstPage ? "secondary" : "ghost"} className="h-8 text-xs" onClick={() => setSettings(s => ({ ...s, differentFirstPage: !s.differentFirstPage }))}>Première page différente</Button>
            <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => void cropImage()}>✂ Rogner l'image</Button>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">Couleur de page<input aria-label="Couleur de page" type="color" className="h-7 w-8 rounded border border-input" value={settings.pageColor || "#ffffff"} onChange={e => setSettings(s => ({ ...s, pageColor: e.target.value }))} /></label>
            <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { const f = window.prompt("Équation (ex. x^2 + y_1 = sqrt(a))"); if (!f) return; const html = f.replace(/[<>&]/g, "").replace(/sqrt\(([^)]*)\)/g, "√($1)").replace(/\^(\w+)/g, "<sup>$1</sup>").replace(/_(\w+)/g, "<sub>$1</sub>"); editor.chain().focus().insertContent(`<em>${html}</em> `).run(); }}>∑ Équation</Button>
          </div>
        )}

        {/* 5. RÉFÉRENCES */}
        {activeMenu === "Références" && (
          <div className="flex flex-nowrap items-center gap-1">
            {btn(<BookOpen className="w-4 h-4 text-primary" />, "Générer Sommaire / Table des matières", handleInsertTOC)}
            {btn(<FileText className="w-4 h-4 text-amber-600" />, "Insérer Note de bas de page", () => {
              insertFootnote(editor, "");
              setTimeout(() => { const all = document.querySelectorAll<HTMLInputElement>("input[data-fn-input]"); all[all.length - 1]?.focus(); }, 80);
            })}
            {btn(<Type className="w-4 h-4 text-purple-600" />, "Citation APA 7ème", () => {
              const author = window.prompt("Auteur (ex: BERSA, 2026) :", "BERSA, 2026");
              if (author) {
                editor.chain().focus().insertContent(` (${author})`).run();
              }
            })}
            <div className="h-5 w-[1px] bg-border mx-1" />
            {btn(<Plus className="w-4 h-4 text-primary" />, "Nouvelle source", addSource)}
            {sources.length > 0 && (
              <select aria-label="Citer une source" className="h-8 px-1 text-xs rounded-md border border-input bg-background max-w-[150px]" value="" onChange={e => { const src = sources.find(x => x.id === e.target.value); if (src) editor.chain().focus().insertContent(" " + citation(src)).run(); }}>
                <option value="">Citer ({sources.length})…</option>
                {sources.map(x => <option key={x.id} value={x.id}>{x.author}, {x.year}</option>)}
              </select>
            )}
            {btn(<BookOpen className="w-4 h-4 text-amber-600" />, "Insérer la bibliographie", () => {
              if (!sources.length) { toast.info("Ajoutez d'abord une source."); return; }
              editor.chain().focus().insertContent(bibliographyHtml(sources)).run(); toast.success("Bibliographie insérée");
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
            <div className="h-5 w-[1px] bg-border mx-1" />
            {btn(<Plus className="w-4 h-4 text-amber-500" />, "Commentaire", () => {
              if (editor.state.selection.empty) { toast.info("Sélectionnez d'abord le passage à commenter."); return; }
              const text = window.prompt("Votre commentaire :"); if (!text) return;
              editor.chain().focus().setMark("comment", { text }).run(); force(x => x + 1); toast.success("Commentaire ajouté");
            })}
            {comments.length > 0 && (
              <select aria-label="Commentaires" className="h-8 px-1 text-xs rounded-md border border-input bg-background max-w-[160px]" value="" onChange={e => { const c = comments[Number(e.target.value)]; if (!c) return; if (window.confirm(`« ${c.text} »\n\nSupprimer ce commentaire ?`)) { removeComment(editor, c.from, c.to); force(x => x + 1); } else editor.chain().focus().setTextSelection({ from: c.from, to: c.to }).run(); }}>
                <option value="">Commentaires ({comments.length})</option>
                {comments.map((c, i) => <option key={i} value={i}>{c.text.slice(0, 40)}</option>)}
              </select>
            )}
            {btn(<CheckSquare className="w-4 h-4 text-emerald-600" />, tracking ? "Suivi activé" : "Suivi des modifications", () => { setTracking(editor, !tracking); force(x => x + 1); toast.success(tracking ? "Suivi désactivé" : "Suivi activé : vos ajouts apparaissent en vert"); }, tracking)}
            {btn(<CheckSquare className="w-4 h-4" />, "Tout accepter", () => { const n = acceptAll(editor); toast.success(`${n} ajout(s) accepté(s)`); })}
            {btn(<Trash2 className="w-4 h-4 text-destructive" />, "Tout refuser", () => { const n = rejectAll(editor); toast.success(`${n} ajout(s) retiré(s)`); })}
          </div>
        )}

        {/* 7. AFFICHAGE */}
        {activeMenu === "Affichage" && (
          <div className="flex flex-nowrap items-center gap-1">
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
            {btn(<ZoomIn className="w-4 h-4" />, isFull ? "Quitter le plein écran" : "Plein écran", toggleFull, isFull)}
          </div>
        )}

      </div>
    </div>
  );
}
