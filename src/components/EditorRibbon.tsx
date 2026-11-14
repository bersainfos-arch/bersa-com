import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Indent, Outdent,
  Eraser, Table as TableIcon, Image as ImageIcon, Link2, Search, Replace, Printer, Download,
  Save, Sparkles, Sliders, Type, FileText, Layout, BookOpen, CheckSquare, Eye,
  Plus, Trash2, Columns, ZoomIn, ZoomOut, FilePlus, FolderOpen, HelpCircle, Paintbrush, ClipboardPaste, Highlighter, ArrowDownUp, WrapText, ScanText, Bookmark as BookmarkIcon, Signature, Calendar, Hash, Paperclip as PaperclipIcon, PanelTop, RectangleHorizontal, CaseSensitive, Minus, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { changeCase, setParagraphLayout } from "@/lib/writer-layout";
import { changeIndent, replaceAllText } from "@/lib/writer-commands";
import { insertFootnote, collectFootnotes } from "@/lib/footnotes";
import { importDocumentFile } from "@/lib/document-import";
import { TOC_TITLE, tocLines, refreshToc } from "@/lib/toc";
import { SHAPES, SYMBOLS, shapeSrc, setTracking, isTracking, acceptAll, rejectAll, listComments, removeComment, citation, bibliographyHtml, type Source } from "@/lib/review-marks";

export type PageSettings = {
  margin: "Normales" | "Étroites" | "Larges";
  orientation: "Portrait" | "Paysage";
  format: "A4" | "A5" | "Letter" | "A3" | "Legal";
  pageColor?: string | undefined;
  pageNumbers?: boolean;
  pageNumberAlign?: "left" | "center" | "right" | undefined;
  pageNumberFormat?: "arabic" | "roman" | undefined;
  nightMode?: boolean;
  eyeCare?: boolean;
  spellcheck?: boolean;
  showComments?: boolean;
  showRevisions?: boolean;
  showMarks?: boolean;
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
  fitPaper,
  attach,
  save,
  correct,
  translate,
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
  fitPaper?: () => void;
  attach: () => void;
  save: () => void;
  correct: () => void;
  translate?: (lang: string) => void;
  exportPdf: () => void;
  saveVersion: () => void;
  openVersions: () => void;
  cloudState: string;
}) {
  const [sources, setSources] = useState<Source[]>(() => { try { return JSON.parse(localStorage.getItem("bersa_sources") || "[]"); } catch { return []; } });
  const [, force] = useState(0);
  const [isFull, setIsFull] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>("Accueil");
  const [copiedFormat, setCopiedFormat] = useState<{ marks: Array<{ type: string; attrs: Record<string, unknown> }>; attrs: Record<string, unknown> } | null>(null);
  const [scanning, setScanning] = useState(false);
  const scanInput = useRef<HTMLInputElement>(null);
  const objectInput = useRef<HTMLInputElement>(null);
  const [findText, setFindText] = useState("");
  const [findOpen, setFindOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [readPage, setReadPage] = useState(1);
  useEffect(() => () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  const [replaceText, setReplaceText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editor) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const fn = () => { clearTimeout(t); t = setTimeout(() => refreshToc(editor), 800); };
    editor.on("update", fn);
    return () => { clearTimeout(t); editor.off("update", fn); };
  }, [editor]);
  useEffect(() => {
    if (!editor) return;
    const update = () => force(x => x + 1);
    editor.on("selectionUpdate", update); editor.on("transaction", update);
    return () => { editor.off("selectionUpdate", update); editor.off("transaction", update); };
  }, [editor]);
  if (!editor) return null;
  const scanFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image trop volumineuse (10 Mo maximum)"); return; }
    setScanning(true);
    let worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | undefined;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("fra+eng");
      const { data } = await worker.recognize(file);
      if (!data.text.trim()) { toast.info("Aucun texte lisible détecté"); return; }
      editor.chain().focus().insertContent(data.text.split("\n").map(text => ({ type: "paragraph", content: text ? [{ type: "text", text }] : [] }))).run();
      toast.success("Texte extrait et inséré");
    } catch { toast.error("Lecture impossible. Vérifiez la connexion et la lisibilité de l’image."); }
    finally { await worker?.terminate(); setScanning(false); }
  };
  const note = () => {
    const position = editor.state.selection.from;
    insertFootnote(editor, "");
    const inserted = collectFootnotes(editor).find(item => item.pos === position);
    setTimeout(() => { const el = document.querySelector<HTMLTextAreaElement>(`[data-fn-input="${inserted?.number}"]`); el?.scrollIntoView({ block: "center" }); el?.focus({ preventScroll: true }); }, 350);
  };
  const editMargin = (part: "header" | "footer") => {
    document.querySelector<HTMLTextAreaElement>(part === "header" ? ".writer-internal-header" : ".writer-footer-row textarea")?.focus();
    document.querySelector(part === "header" ? ".writer-internal-header" : ".writer-footer-row textarea")?.scrollIntoView({ block: "center" });
  };
  const addBookmark = () => {
    if (editor.state.selection.empty) { toast.info("Sélectionnez le texte du signet"); return; }
    const name = window.prompt("Nom du signet :");
    if (name?.trim()) editor.chain().focus().setMark("bookmark", { name: name.trim() }).run();
  };
  const goBookmark = (name: string) => { Array.from(editor.view.dom.querySelectorAll<HTMLElement>("[data-bookmark]")).find(el => el.dataset["bookmark"] === name)?.scrollIntoView({ block: "center", behavior: "smooth" }); };
  const seeBookmark = () => {
    const names = Array.from(editor.view.dom.querySelectorAll<HTMLElement>("[data-bookmark]")).map(el => el.dataset["bookmark"]);
    if (!names.length) { toast.info("Aucun signet dans le document"); return; }
    const name = window.prompt("Signet à ouvrir : " + names.join(", "), names[0]);
    const target = Array.from(editor.view.dom.querySelectorAll<HTMLElement>("[data-bookmark]")).find(el => el.dataset["bookmark"] === name);
    target?.scrollIntoView({ block: "center" });
  };
  const copyFormat = () => {
    const { $from } = editor.state.selection;
    const marks = $from.nodeAfter?.marks || $from.marks();
    setCopiedFormat({ marks: (marks.length ? marks : editor.state.storedMarks || []).map(m => ({ type: m.type.name, attrs: m.attrs })), attrs: { ...$from.parent.attrs } });
  };
  const pasteFormat = () => {
    if (!copiedFormat) return;
    const chain = editor.chain().focus().unsetAllMarks();
    copiedFormat.marks.forEach(m => chain.setMark(m.type, m.attrs)); chain.run();
    setParagraphLayout(editor, copiedFormat.attrs);
  };
  const row = (icon: React.ReactNode, label: string, action: () => void) => <Button type="button" variant="ghost" className="writer-tool-row" onMouseDown={e => e.preventDefault()} onClick={action}>{icon}<span>{label}</span><span className="ml-auto text-muted-foreground">›</span></Button>;
  const group = (title: string, children: React.ReactNode) => <section className="writer-tool-group"><h4>{title}</h4><div className="writer-tool-surface">{children}</div></section>;

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
  const pagesCount = Number(editor.view.dom.dataset["pages"]) || 1;
  const goToPage = (n: number) => { const sheet = editor.view.dom; const h = sheet.clientWidth * (settings.orientation === "Paysage" ? 210 / 297 : 297 / 210); const top = sheet.getBoundingClientRect().top + window.scrollY + (n - 1) * (h + 16); const desk = sheet.closest(".home-paper-desk"); if (desk && desk.scrollHeight > desk.clientHeight) desk.scrollTo({ top: desk.scrollTop + sheet.getBoundingClientRect().top - desk.getBoundingClientRect().top + (n - 1) * (h + 16), behavior: "smooth" }); else window.scrollTo({ top, behavior: "smooth" }); };
  const bookmarks = Array.from(new Set(Array.from(editor.view.dom.querySelectorAll<HTMLElement>("[data-bookmark]")).map(el => el.dataset["bookmark"] || "").filter(Boolean)));
  const headingEls = Array.from(editor.view.dom.querySelectorAll<HTMLElement>("h1, h2, h3"));
  const comments = listComments(editor);

  const btn = (icon: any, label: string, onClick: () => void, active = false, title?: string) => (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className={`h-8 px-2 text-xs font-medium gap-1.5 ${active ? "bg-primary/15 text-primary border border-primary/20" : "text-foreground"}`}
      onMouseDown={e => e.preventDefault()}
      aria-label={title || label}
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
      onMouseDown={e => e.preventDefault()}
      aria-label={title}
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
      const ctx = c.getContext("2d"); if (!ctx) throw new Error("Canvas indisponible");
      ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
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

  const menus: Array<[string, any]> = [["Accueil", Type], ["Insérer", Plus], ["Afficher", Eye]];
  const moreMenus = ["Mise en page", "Fichier", "Références", "Révision"];
  const curSize = () => parseFloat((editor.getAttributes("textStyle")["fontSize"] as string) || settings.fontSize || "13") || 13;
  const stepSize = (d: number) => { const v = Math.min(96, Math.max(6, curSize() + d)) + "pt"; setSettings((s) => ({ ...s, fontSize: v })); (editor.chain().focus() as any).setFontSize(v).run(); };
  const askTable = () => {
    const r = Number(window.prompt("Nombre de lignes :", "3")); const c = Number(window.prompt("Nombre de colonnes :", "3"));
    if (!r || !c || r < 1 || c < 1 || r > 50 || c > 20) { toast.error("Dimensions invalides (lignes 1-50, colonnes 1-20)"); return; }
    editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run(); toast.success(`Tableau ${r}×${c} inséré`);
  };

  return (
    <div className="no-print border-b border-border bg-card/95 backdrop-blur-sm select-none">
      <input type="file" ref={objectInput} accept=".docx,.doc,.txt,.md,.csv,.html,.pdf" className="hidden" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = "";
        if (!file) return;
        try { const result = await importDocumentFile(file); editor.chain().focus().insertContent(result.html).run(); toast.success("Contenu du fichier inséré"); }
        catch (error) { toast.error(error instanceof Error ? error.message : "Insertion impossible"); }
      }} />
      <input type="file" ref={scanInput} accept="image/*" className="hidden" onChange={e => { void scanFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

      {/* Onglets principaux du Ruban WPS / Word */}
      <div className="flex flex-nowrap items-center gap-0.5 px-1.5 pt-0.5 border-b border-border/60 overflow-x-auto scrollbar-none">
        {menus.map(([m, Icon]) => (
          <Button variant="ghost" key={m} type="button" onClick={() => setActiveMenu(m)} aria-pressed={activeMenu === m}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold rounded-md transition-colors ${activeMenu === m ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>
            <Icon className="h-4 w-4" />{m}
          </Button>
        ))}
        {moreMenus.map(m => <Button key={m} variant="ghost" size="sm" aria-pressed={activeMenu === m} onClick={() => setActiveMenu(m)} className="shrink-0 text-[11px]">{m}</Button>)}


      </div>
      
      {/* Boîte à outils horizontale défilable sans empilement désordonné */}
      <div className={`writer-tool-panel ${["Accueil", "Insérer"].includes(activeMenu) ? "writer-tool-panel-primary" : ""}`}>
    
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

        {activeMenu === "Accueil" && <div className="writer-home-tools">
          {group("Format de police", <>
            <div className="writer-tool-line">
              {iconOnly(<Bold />, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "Gras")}
              {iconOnly(<Italic />, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "Italique")}
              {iconOnly(<Underline />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), "Souligné")}
              {iconOnly(<Strikethrough />, () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"), "Barré")}
              {iconOnly(<Superscript />, () => editor.chain().focus().toggleSuperscript().run(), editor.isActive("superscript"), "Exposant")}
              {iconOnly(<Subscript />, () => editor.chain().focus().toggleSubscript().run(), editor.isActive("subscript"), "Indice")}
              {iconOnly(<Eraser />, () => editor.chain().focus().unsetAllMarks().run(), false, "Effacer la mise en forme")}
            </div>
            <div className="writer-tool-line">{[1,2,3].map(level => <Button key={level} variant={editor.isActive("heading", { level }) ? "secondary" : "ghost"} size="sm" onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: level as 1|2|3 }).run()}>Titre{level}</Button>)}<Button variant="ghost" size="sm" onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().setParagraph().run()}>Normales</Button></div>
            <label className="writer-select-row"><Type /><span>Police</span><select aria-label="Police" value={editor.getAttributes("textStyle")["fontFamily"] || settings.fontFamily || "Times New Roman"} onChange={e => { setSettings(s => ({ ...s, fontFamily: e.target.value })); editor.chain().focus().setFontFamily(e.target.value).run(); }}>{["Times New Roman", "Arial", "Calibri", "Aptos", "Cambria", "Georgia", "Garamond", "Verdana", "Courier New"].map(f => <option key={f}>{f}</option>)}</select></label>
            <div className="writer-select-row"><Type /><span>Taille de police</span>{iconOnly(<Minus />, () => stepSize(-1), false, "Diminuer la taille")}<input type="number" aria-label="Taille du texte" min="6" max="96" value={curSize()} onChange={e => { const v = Number(e.target.value); if (v < 6 || v > 96) return; setSettings(s => ({ ...s, fontSize: v + "pt" })); editor.chain().focus().setFontSize(v + "pt").run(); }} />{iconOnly(<Plus />, () => stepSize(1), false, "Augmenter la taille")}</div>
            <div className="writer-tool-line"><label className="writer-color-control" title="Couleur du texte"><Type /><input aria-label="Couleur du texte" type="color" onChange={e => editor.chain().focus().setColor(e.target.value).run()} /></label><select aria-label="Modifier la casse" value="" onChange={e => { if (!changeCase(editor, e.target.value as "upper"|"lower"|"sentence")) toast.info("Sélectionnez le texte à transformer"); }}><option value="">Aa</option><option value="upper">MAJUSCULES</option><option value="lower">minuscules</option><option value="sentence">Phrase</option></select></div>
          </>)}
          {group("Reproduire la mise en forme", <div className="writer-tool-line"><Button variant="ghost" size="sm" onMouseDown={e => e.preventDefault()} onClick={copyFormat}><Paintbrush />Copier le format</Button><Button variant="ghost" size="sm" disabled={!copiedFormat} onMouseDown={e => e.preventDefault()} onClick={pasteFormat}><ClipboardPaste />Coller le format</Button></div>)}
          {group("Surlignage", <div className="writer-tool-line">{iconOnly(<Eraser />, () => editor.chain().focus().unsetHighlight().run(), false, "Sans surlignage")}<label className="writer-color-control"><Highlighter /><input type="color" aria-label="Surlignage" onChange={e => editor.chain().focus().setHighlight({ color: e.target.value }).run()} /></label></div>)}
          {group("Paragraphes", <>
            <div className="writer-tool-line">{[["left", AlignLeft, "Aligner à gauche"], ["center", AlignCenter, "Centrer"], ["right", AlignRight, "Aligner à droite"], ["justify", AlignJustify, "Justifier"]].map(([align, Icon, label]) => { const I = Icon as typeof AlignLeft; return <Button key={String(align)} size="icon" variant={editor.isActive({ textAlign: align }) ? "secondary" : "ghost"} aria-label={String(label)} title={String(label)} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign(String(align)).run()}><I /></Button>; })}{iconOnly(<Indent />, () => changeIndent(editor, 1), false, "Augmenter le retrait")}{iconOnly(<Outdent />, () => changeIndent(editor, -1), false, "Diminuer le retrait")}</div>
            <label className="writer-select-row"><ArrowDownUp /><span>Espace</span><select aria-label="Interligne" value={editor.getAttributes("paragraph")["paragraphLine"] || "1.6"} onChange={e => setParagraphLayout(editor, { paragraphLine: e.target.value })}>{["1", "1.15", "1.5", "1.6", "2", "2.5", "3"].map(v => <option key={v} value={v}>{v}</option>)}</select></label>
            {row(<ArrowDownUp />, "Espacement avant / après", () => { const value = window.prompt("Espace après le paragraphe (pt) :", "8"); if (value !== null && Number(value) >= 0) setParagraphLayout(editor, { paragraphSpacing: `${Number(value)}pt` }); })}
            {row(<WrapText />, "Disposition des paragraphes", () => setParagraphLayout(editor, { keepTogether: !editor.getAttributes("paragraph")["keepTogether"] }))}
            {row(<Sliders />, "Format de paragraphe", () => setParagraphLayout(editor, { paragraphBorder: !editor.getAttributes("paragraph")["paragraphBorder"] }))}
          </>)}
          {group("Numérotation", <><div className="writer-tool-line">{iconOnly(<Eraser />, () => { if (editor.isActive("listItem")) editor.chain().focus().liftListItem("listItem").run(); }, false, "Sans liste")}{iconOnly(<List />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"), "Puces")}{iconOnly(<ListOrdered />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"), "Numérotation")}{iconOnly(<Indent />, () => changeIndent(editor, 1), false, "Augmenter le niveau")}{iconOnly(<Outdent />, () => changeIndent(editor, -1), false, "Diminuer le niveau")}</div>{row(<ListOrdered />, "Recommencer la numérotation", () => { if (!editor.chain().focus().updateAttributes("orderedList", { start: 1 }).run()) toast.info("Placez le curseur dans une liste numérotée"); })}{row(<ListOrdered />, "Continuer la numérotation", () => { let previous = 0; editor.state.doc.descendants((n, pos) => { if (n.type.name === "orderedList" && pos < editor.state.selection.from - editor.state.selection.$from.parentOffset - 2) previous = (Number(n.attrs["start"]) || 1) + n.childCount; }); editor.chain().focus().updateAttributes("orderedList", { start: previous || 1 }).run(); })}</>)}
          {group("Colonnes", <div className="writer-tool-line">{[1,2,3].map(n => <Button key={n} variant={(settings.columns || 1) === n ? "secondary" : "ghost"} onClick={() => setSettings(s => ({ ...s, columns: n }))}><Columns />{["Une", "Deux", "Trois"][n-1]}</Button>)}</div>)}
        </div>}
        {activeMenu === "Insérer" && <div className="writer-insert-tools">
          <div className="writer-insert-shortcuts">{row(<ImageIcon />, "Image", () => fileInputRef.current?.click())}{row(<TableIcon />, "Table", askTable)}{row(<FilePlus />, "Page vierge", () => editor.chain().focus().insertContent([{ type: "pageBreak" }, { type: "paragraph" }]).run())}{row(<FileText />, "Note de bas de page", note)}</div>
          {group("", <><label className="writer-select-row"><RectangleHorizontal /><span>Forme</span><select aria-label="Formes" value="" onChange={e => { if (e.target.value) editor.chain().focus().setImage({ src: shapeSrc(e.target.value), alt: e.target.value }).run(); }}><option value="">Choisir…</option>{Object.keys(SHAPES).map(n => <option key={n}>{n}</option>)}</select></label>{row(<RectangleHorizontal />, "Zone de texte", () => editor.chain().focus().insertContent({ type: "paragraph", attrs: { textBox: true }, content: [] }).run())}<Button variant="ghost" className="writer-tool-row" disabled={scanning} onClick={() => scanInput.current?.click()}><ScanText /><span>{scanning ? "Lecture en cours…" : "Scanner un Texte"}</span></Button>{row(<FolderOpen />, "Ressources du document", attach)}</>)}
          {group("Pages", <>{row(<FilePlus />, "Page vierge en portrait", () => { setSettings(s => ({ ...s, orientation: "Portrait" })); editor.chain().focus().insertContent([{ type: "pageBreak" }, { type: "paragraph" }]).run(); })}{row(<FilePlus />, "Page vierge Paysage", () => { setSettings(s => ({ ...s, orientation: "Paysage" })); editor.chain().focus().insertContent([{ type: "pageBreak" }, { type: "paragraph" }]).run(); })}{row(<WrapText />, "Sauts", () => editor.chain().focus().insertContent([{ type: "pageBreak" }, { type: "paragraph" }]).run())}<label className="writer-tool-row flex items-center gap-1 px-2 text-xs"><Hash className="h-4 w-4" /><span>Numéro de page</span><select aria-label="Position et format du numéro de page" className="ml-auto h-7 rounded border border-input bg-background px-1 text-xs" value={settings.pageNumbers ? `${settings.pageNumberAlign || "center"}-${settings.pageNumberFormat || "arabic"}` : "none"} onChange={e => { const v = e.target.value; if (v === "none") { setSettings(s => ({ ...s, pageNumbers: false })); return; } const [a, f] = v.split("-") as ["left" | "center" | "right", "arabic" | "roman"]; setSettings(s => ({ ...s, pageNumbers: true, pageNumberAlign: a, pageNumberFormat: f })); }}><option value="none">Aucun</option>{(["left", "center", "right"] as const).flatMap(a => (["arabic", "roman"] as const).map(f => <option key={`${a}-${f}`} value={`${a}-${f}`}>{a === "left" ? "Gauche" : a === "center" ? "Milieu" : "Droite"} · {f === "arabic" ? "1, 2, 3" : "i, ii, iii"}</option>))}</select></label>{row(<PanelTop />, "En-tête", () => editMargin("header"))}{row(<PanelTop />, "Pied de page", () => editMargin("footer"))}</>)}
          {group("Notes et objets", <>{row(<FileText />, "Note de fin", () => { const text = window.prompt("Texte de la note de fin :"); if (!text) return; editor.chain().focus().insertContent([{ type: "text", text: "*", marks: [{ type: "superscript" }] }]).run(); editor.chain().focus("end").insertContent([{ type: "horizontalRule" }, { type: "paragraph", content: [{ type: "text", text: `* ${text}` }] }]).run(); })}{row(<Signature />, "Signature", () => fileInputRef.current?.click())}{row(<Calendar />, "Date et heure", () => editor.chain().focus().insertContent(new Date().toLocaleString("fr-FR")).run())}{row(<Link2 />, "Lien", handleInsertLink)}{row(<BookmarkIcon />, "Insérer un signet", addBookmark)}{row(<BookmarkIcon />, "Voir le Signet", seeBookmark)}{row(<CaseSensitive />, "Lettrine", () => setParagraphLayout(editor, { dropCap: !editor.getAttributes("paragraph")["dropCap"] }))}{row(<PaperclipIcon />, "Insérer un objet à partir du fichier", () => objectInput.current?.click())}<label className="writer-select-row"><Type /><span>Symboles</span><select aria-label="Symboles" value="" onChange={e => { if (e.target.value) editor.chain().focus().insertContent(e.target.value).run(); }}><option value="">Ω</option>{SYMBOLS.map(c => <option key={c}>{c}</option>)}</select></label></>)}
          {group("Tableau", <>{row(<Columns />, "Fusionner les cellules", () => { if (!editor.chain().focus().mergeCells().run()) toast.info("Sélectionnez plusieurs cellules"); })}{row(<Columns />, "Fractionner la cellule", () => { if (!editor.chain().focus().splitCell().run()) toast.info("Sélectionnez une cellule fusionnée"); })}{row(<Plus />, "Ajouter une ligne", () => editor.chain().focus().addRowAfter().run())}{row(<Plus />, "Ajouter une colonne", () => editor.chain().focus().addColumnAfter().run())}{row(<Trash2 />, "Supprimer une ligne", () => editor.chain().focus().deleteRow().run())}{row(<Trash2 />, "Supprimer une colonne", () => editor.chain().focus().deleteColumn().run())}{row(<Trash2 />, "Supprimer le tableau", () => editor.chain().focus().deleteTable().run())}</>)}
        </div>}
        {/* 4. MISE EN PAGE */}
        {activeMenu === "Mise en page" && (
          <div className="flex flex-nowrap items-center gap-1">
            {fitPaper && btn(<Layout className="w-4 h-4" />, "Ajuster à l’écran", fitPaper)}
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

        {/* 6. RÉVISER */}
        {activeMenu === "Révision" && (
          <div className="flex flex-nowrap items-center gap-1">
            {btn(<Hash className="w-4 h-4" />, "Nombre de mots", () => {
              const text = editor.state.selection.empty ? editor.getText() : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " ");
              const words = (text.match(/[\p{L}\p{N}'’-]+/gu) || []).length;
              const paras = editor.state.selection.empty ? editor.state.doc.childCount : text.split(/\n+/).filter(Boolean).length;
              toast.info(`${words} mots · ${text.replace(/\s/g, "").length} caractères (sans espaces) · ${text.length} avec espaces · ${paras} paragraphes · ${pagesCount} page(s)`, { duration: 8000 });
            })}
            {btn(<BookOpen className="w-4 h-4" />, speaking ? "Arrêter la lecture" : "Lecture vocale", () => {
              if (!("speechSynthesis" in window)) { toast.error("La lecture vocale n'est pas disponible sur cet appareil."); return; }
              if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
              const text = editor.state.selection.empty ? editor.getText() : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, " ");
              if (!text.trim()) { toast.info("Le papier est vide."); return; }
              const u = new SpeechSynthesisUtterance(text.slice(0, 30000)); u.lang = "fr-FR"; u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
              window.speechSynthesis.speak(u); setSpeaking(true);
            }, speaking)}
            {btn(<CheckSquare className="w-4 h-4" />, settings.spellcheck === false ? "Orthographe désactivée" : "Vérification orthographique", () => { const on = settings.spellcheck === false; editor.view.dom.setAttribute("spellcheck", String(on)); setSettings(s => ({ ...s, spellcheck: on })); toast.success(on ? "Les fautes sont soulignées sur le papier" : "Soulignement des fautes désactivé"); }, settings.spellcheck !== false)}
            {btn(<Sparkles className="w-4 h-4 text-gold" />, "Correction & style BERSA", correct)}
            {translate && <select aria-label="Traducteur" value="" onChange={e => { const v = e.target.value; if (v) translate(v); }} className="shrink-0 h-7 px-1 text-[11px] rounded-md border border-input bg-background">
              <option value="">Traducteur…</option>
              {["anglais", "français", "lingala", "swahili", "espagnol", "portugais", "allemand", "arabe"].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>}
            <div className="h-5 w-[1px] bg-border mx-1" />
            {btn(<Plus className="w-4 h-4 text-amber-500" />, "Insérer un commentaire", () => {
              if (editor.state.selection.empty) { toast.info("Sélectionnez d'abord le passage à commenter."); return; }
              const text = window.prompt("Votre commentaire :"); if (!text) return;
              const author = localStorage.getItem("bersa_review_author");
              editor.chain().focus().setMark("comment", { text: author ? `${author} : ${text}` : text }).run(); force(x => x + 1); toast.success("Commentaire ajouté");
            })}
            {btn(<Eye className="w-4 h-4" />, "Afficher les commentaires", () => setSettings(s => ({ ...s, showComments: s.showComments === false })), settings.showComments !== false)}
            {comments.length > 0 && (
              <select aria-label="Commentaires" className="h-8 px-1 text-xs rounded-md border border-input bg-background max-w-[160px]" value="" onChange={e => { const c = comments[Number(e.target.value)]; if (!c) return; if (window.confirm(`« ${c.text} »\n\nSupprimer ce commentaire ?`)) { removeComment(editor, c.from, c.to); force(x => x + 1); } else editor.chain().focus().setTextSelection({ from: c.from, to: c.to }).run(); }}>
                <option value="">Commentaires ({comments.length})</option>
                {comments.map((c, i) => <option key={i} value={i}>{c.text.slice(0, 40)}</option>)}
              </select>
            )}
            <div className="h-5 w-[1px] bg-border mx-1" />
            {btn(<CheckSquare className="w-4 h-4 text-emerald-600" />, "Suivi des modifications", () => { setTracking(editor, !tracking); force(x => x + 1); toast.success(tracking ? "Suivi désactivé" : "Suivi activé : vos ajouts apparaissent en vert"); }, tracking)}
            {btn(<Eye className="w-4 h-4" />, "Afficher les révisions", () => setSettings(s => ({ ...s, showRevisions: s.showRevisions === false })), settings.showRevisions !== false)}
            {btn(<Type className="w-4 h-4" />, "Afficher les marques", () => setSettings(s => ({ ...s, showMarks: !s.showMarks })), !!settings.showMarks)}
            {btn(<CheckSquare className="w-4 h-4" />, "Tout accepter", () => { const n = acceptAll(editor); toast.success(`${n} ajout(s) accepté(s)`); })}
            {btn(<Trash2 className="w-4 h-4 text-destructive" />, "Tout refuser", () => { const n = rejectAll(editor); toast.success(`${n} ajout(s) retiré(s)`); })}
            {btn(<Signature className="w-4 h-4" />, "Modifier le nom d'utilisateur", () => { const v = window.prompt("Nom affiché dans vos commentaires :", localStorage.getItem("bersa_review_author") || ""); if (v === null) return; localStorage.setItem("bersa_review_author", v.trim()); toast.success(v.trim() ? `Nom enregistré : ${v.trim()}` : "Nom retiré"); })}
          </div>
        )}

        {/* 7. AFFICHER */}
        {activeMenu === "Afficher" && (
          <div className="flex flex-nowrap items-center gap-1">
            {btn(<Search className="w-4 h-4" />, "Rechercher et remplacer", () => setFindOpen(o => !o), findOpen)}
            {findOpen && <>
              <Input placeholder="Rechercher" value={findText} onChange={e => setFindText(e.target.value)} className="h-8 w-24 shrink-0 text-xs" />
              <Input placeholder="Remplacer par" value={replaceText} onChange={e => setReplaceText(e.target.value)} className="h-8 w-24 shrink-0 text-xs" />
              <Button type="button" size="sm" variant="secondary" className="h-8 shrink-0 text-xs" onClick={handleFindReplace}><Replace className="mr-1 h-3 w-3" />Remplacer</Button>
            </>}
            {btn(<Eye className="w-4 h-4" />, "Mode nuit", () => setSettings(s => ({ ...s, nightMode: !s.nightMode, eyeCare: false })), !!settings.nightMode)}
            {btn(<Eye className="w-4 h-4 text-amber-600" />, "Protection des yeux", () => setSettings(s => ({ ...s, eyeCare: !s.eyeCare, nightMode: false })), !!settings.eyeCare)}
            {btn(<RectangleHorizontal className="w-4 h-4" />, "Faire pivoter", () => setSettings(s => ({ ...s, orientation: s.orientation === "Portrait" ? "Paysage" : "Portrait" })), settings.orientation === "Paysage")}
            <div className="h-5 w-[1px] bg-border mx-1" />
            <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">Lecture
              <input type="range" min={1} max={Math.max(1, pagesCount)} value={Math.min(readPage, pagesCount)} aria-label="Progression de la lecture" className="w-20" onChange={e => { const n = Number(e.target.value); setReadPage(n); goToPage(n); }} />
              <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">{Math.min(readPage, pagesCount)}</span>/{pagesCount}
            </label>
            <div className="h-5 w-[1px] bg-border mx-1" />
            <span className="shrink-0 text-xs text-muted-foreground">Fond</span>
            {[["#ffffff", "Aucun (blanc)"], ["#1f2937", "Noir"], ["#9ca3af", "Gris"], ["#bfdbfe", "Bleu"], ["#fed7aa", "Pêche"], ["#fef3c7", "Crème"]].map(([c, n]) => (
              <button key={c} type="button" aria-label={`Arrière-plan ${n}`} title={n} onClick={() => setSettings(s => ({ ...s, pageColor: c }))} className={`h-6 w-6 shrink-0 rounded-full border ${(settings.pageColor || "#ffffff") === c ? "ring-2 ring-primary" : "border-border"}`} style={{ background: c }} />
            ))}
            <div className="h-5 w-[1px] bg-border mx-1" />
            <select aria-label="Marges" value={settings.margin} onChange={e => setSettings(s => ({ ...s, margin: e.target.value as PageSettings["margin"] }))} className="h-8 shrink-0 rounded-md border border-input bg-background px-1 text-xs"><option value="Normales">Marges normales</option><option value="Étroites">Marges étroites</option><option value="Larges">Marges larges</option></select>
            <select aria-label="Taille du papier" value={settings.format} onChange={e => setSettings(s => ({ ...s, format: e.target.value as PageSettings["format"] }))} className="h-8 shrink-0 rounded-md border border-input bg-background px-1 text-xs">{["A4", "A5", "Letter", "Legal", "A3"].map(f => <option key={f} value={f}>Papier {f}</option>)}</select>
            <select aria-label="Orientation" value={settings.orientation} onChange={e => setSettings(s => ({ ...s, orientation: e.target.value as PageSettings["orientation"] }))} className="h-8 shrink-0 rounded-md border border-input bg-background px-1 text-xs"><option value="Portrait">Portrait</option><option value="Paysage">Paysage</option></select>
            <div className="h-5 w-[1px] bg-border mx-1" />
            <select aria-label="Signets" value="" onChange={e => { if (e.target.value) goBookmark(e.target.value); }} className="h-8 shrink-0 max-w-[120px] rounded-md border border-input bg-background px-1 text-xs"><option value="">Signets ({bookmarks.length})</option>{bookmarks.map(b => <option key={b} value={b}>{b}</option>)}</select>
            <select aria-label="Maquette du document" value="" onChange={e => { const el = headingEls[Number(e.target.value)]; el?.scrollIntoView({ block: "start", behavior: "smooth" }); }} className="h-8 shrink-0 max-w-[140px] rounded-md border border-input bg-background px-1 text-xs"><option value="">Maquette ({headingEls.length})</option>{headingEls.map((h, i) => <option key={i} value={i}>{"— ".repeat(Number(h.tagName[1]) - 1)}{(h.textContent || "").slice(0, 40)}</option>)}</select>
            <select aria-label="Vignettes des pages" value="" onChange={e => { if (e.target.value) goToPage(Number(e.target.value)); }} className="h-8 shrink-0 rounded-md border border-input bg-background px-1 text-xs"><option value="">Vignettes</option>{Array.from({ length: pagesCount }, (_, i) => <option key={i} value={i + 1}>Page {i + 1}</option>)}</select>
            <div className="h-5 w-[1px] bg-border mx-1" />
            {iconOnly(<ZoomOut />, () => setSettings(s => ({ ...s, zoom: `${Math.max(20, (parseFloat(s.zoom) || 100) - 10)}%` })), false, "Réduire")}
            <span className="shrink-0 text-xs font-semibold">{Math.round(parseFloat(settings.zoom) || 100)}%</span>
            {iconOnly(<ZoomIn />, () => setSettings(s => ({ ...s, zoom: `${Math.min(400, (parseFloat(s.zoom) || 100) + 10)}%` })), false, "Agrandir")}
            {btn(<Layout className="w-4 h-4" />, "Règle", () => setSettings(s => ({ ...s, ruler: !s.ruler })), settings.ruler)}
            {btn(<ZoomIn className="w-4 h-4" />, isFull ? "Quitter le plein écran" : "Plein écran", toggleFull, isFull)}
          </div>
        )}

      </div>
    </div>
  );
}
