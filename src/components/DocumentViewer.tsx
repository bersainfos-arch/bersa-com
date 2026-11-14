import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, CalendarDays, Volume2, Save, Share2, MoreHorizontal, Pencil, ScanLine, Search, Wrench, Monitor, Minus, Plus, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Page } from "./document-viewer/Page";
import { BODY_LINE, PAGE_GAP, PAGE_MARGIN, PAGE_WIDTH, paginateBlocks, type DocumentBlock, type PageBlock, type MeasureText } from "./document-viewer/layout";
import { useDocumentGestures } from "./document-viewer/useDocumentGestures";
import "./document-viewer/DocumentViewer.css";

export type DocumentViewerProps = {
  blocks: readonly DocumentBlock[];
  title?: string;
  header?: string;
  onBack?: () => void;
  onChange?: (blocks: DocumentBlock[]) => void;
  onSave?: (blocks: DocumentBlock[]) => Promise<void> | void;
  onEditOnPC?: () => void;
};

export default function DocumentViewer({ blocks, title = "Document BERSA", header = "GUIDE PRATIQUE EN RÉDACTION | BERCEAU DU SAVOIR | BERSA", onBack, onChange, onSave, onEditOnPC }: DocumentViewerProps) {
  const [document, setDocument] = useState<DocumentBlock[]>(() => [...blocks]);
  const [measure, setMeasure] = useState<MeasureText>(() => (text: string, kind: "title" | "paragraph" | "note") => text.length * (kind === "note" ? 5.4 : 7.7));
  const [editable, setEditable] = useState(false);
  const [panel, setPanel] = useState<"search" | "tools" | "calendar" | "pc" | null>(null);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [status, setStatus] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { setDocument([...blocks]); }, [blocks]);
  useEffect(() => {
    mounted.current = true;
    setAudioAvailable("speechSynthesis" in window);
    const canvas = window.document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) setMeasure(() => (text: string, kind: "title" | "paragraph" | "note") => {
      context.font = `${kind === "title" ? "bold " : ""}${kind === "note" ? "8" : kind === "title" ? "12" : "11"}pt Arial`;
      return context.measureText(text).width;
    });
    return () => { mounted.current = false; if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);
  const pages = useMemo(() => paginateBlocks(document, measure), [document, measure]);
  const gestures = useDocumentGestures(pages.length);
  const currentPage = Math.min(pages.length, Math.max(1, Math.floor(-gestures.view.y / (1123 * gestures.view.scale + PAGE_GAP)) + 1));
  const update = (next: DocumentBlock[]) => { setDocument(next); onChange?.(next); };
  const edit = (fragment: PageBlock, text: string) => update(document.map(block => block.id === fragment.sourceId ? { ...block, text: block.text.slice(0, fragment.start) + text + block.text.slice(fragment.end) } : block));
  const serialized = () => JSON.stringify({ title, blocks: document }, null, 2);
  const download = () => {
    const url = URL.createObjectURL(new Blob([serialized()], { type: "application/json" }));
    const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = `${title.replace(/[^\p{L}\p{N} _-]/gu, "") || "document"}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setStatus("Document téléchargé.");
  };
  const save = async () => {
    if (saving) return;
    if (!onSave) { download(); return; }
    setSaving(true);
    try { await onSave(document); if (mounted.current) setStatus("Document enregistré."); }
    catch { if (mounted.current) setStatus("L’enregistrement a échoué. Réessayez."); }
    finally { if (mounted.current) setSaving(false); }
  };
  const share = async () => {
    const file = new File([serialized()], `${title}.json`, { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title, files: [file] });
      else { download(); setStatus("Fichier téléchargé, prêt à être partagé."); }
    } catch { setStatus("Partage annulé ou indisponible."); }
  };
  const audio = () => {
    if (!audioAvailable) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(document.filter(block => block.type !== "note").map(block => block.text).join("\n"));
    utterance.lang = "fr-FR"; utterance.onend = () => setSpeaking(false); utterance.onerror = () => { setSpeaking(false); setStatus("Lecture vocale indisponible."); };
    window.speechSynthesis.speak(utterance); setSpeaking(true);
  };
  const matches = useMemo(() => query ? document.reduce((sum, block) => sum + block.text.toLocaleLowerCase().split(query.toLocaleLowerCase()).length - 1, 0) : 0, [document, query]);
  const find = () => {
    const index = pages.findIndex(page => [...page.blocks, ...page.notes].some(block => block.text.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
    if (query && index >= 0) gestures.goToPage(index + 1);
  };
  const replace = () => {
    if (!editable || !query) return;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "gi");
    update(document.map(block => ({ ...block, text: block.text.replace(pattern, () => replacement) })));
    setStatus(`${matches} remplacement(s).`);
  };
  const togglePanel = (next: typeof panel) => setPanel(panel === next ? null : next);
  const iconClass = "dv-button shrink-0";
  return <section className="document-viewer" aria-label={title} style={{ "--dv-margin": `${PAGE_MARGIN}px`, "--dv-line": `${BODY_LINE}px` } as CSSProperties}>
    <header className="dv-toolbar dv-top flex items-center justify-between border-b px-1" aria-label="Commandes du document">
      <Button variant="ghost" size="icon" className={iconClass} aria-label="Retour" title="Retour" onClick={() => onBack ? onBack() : window.history.back()}><ArrowLeft /></Button>
      <Button variant="ghost" size="icon" className={iconClass} aria-label="Calendrier" title="Calendrier" onClick={() => togglePanel("calendar")}><CalendarDays /></Button>
      <Button variant="ghost" size="icon" className={iconClass} aria-label={speaking ? "Arrêter la lecture" : "Lecture vocale"} title={audioAvailable ? "Lecture vocale" : "Lecture vocale indisponible"} disabled={!audioAvailable} onClick={audio}><Volume2 /></Button>
      <Button variant="ghost" size="icon" className={iconClass} aria-label="Sauvegarder" title="Sauvegarder" disabled={saving} onClick={() => void save()}><Save /></Button>
      <label className="flex items-center gap-1 text-xs" title="Numéro de page"><span className="sr-only">Numéro de page</span><input aria-label="Numéro de page" type="number" min={1} max={pages.length} value={currentPage} className="w-8 bg-transparent text-center" onChange={event => gestures.goToPage(Math.max(1, Math.min(pages.length, Number(event.target.value) || 1)))} /><span>/{pages.length}</span></label>
      <Button variant="ghost" size="icon" className={iconClass} aria-label="Partager" title="Partager" onClick={() => void share()}><Share2 /></Button>
      <Button variant="ghost" size="icon" className={iconClass} aria-label="Menu" title="Menu" onClick={() => togglePanel("tools")}><MoreHorizontal /></Button>
    </header>
    {panel && <aside className="dv-panel border-b p-3" aria-label={panel === "search" ? "Rechercher et remplacer" : "Options du document"}>
      <div className="flex items-center justify-between gap-2 mb-2"><strong className="text-sm">{panel === "search" ? "Rechercher et remplacer" : panel === "calendar" ? "Calendrier" : panel === "pc" ? "Modifier sur PC" : title}</strong><Button className={iconClass} variant="ghost" size="icon" aria-label="Fermer" onClick={() => setPanel(null)}><X /></Button></div>
      {panel === "search" && <div className="flex flex-col gap-2">
        <div className="flex gap-2"><input aria-label="Rechercher" placeholder="Rechercher" className="flex-1" value={query} onChange={event => setQuery(event.target.value)} /><Button variant="outline" size="icon" aria-label="Rechercher le passage" onClick={find}><Search /></Button></div>
        <div className="flex gap-2"><input aria-label="Remplacer par" placeholder="Remplacer par" className="flex-1" value={replacement} onChange={event => setReplacement(event.target.value)} /><Button variant="outline" size="sm" disabled={!editable || !query} onClick={replace}>Tout remplacer</Button></div>
        <span className="text-xs" role="status">{matches} résultat(s)</span>
      </div>}
      {panel === "tools" && <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Réduire" onClick={() => gestures.zoom(1 / 1.2)}><Minus /></Button><output className="text-sm w-12 text-center" aria-label="Zoom">{gestures.zoomPercent}%</output><Button variant="outline" size="icon" aria-label="Agrandir" onClick={() => gestures.zoom(1.2)}><Plus /></Button>
        <Button variant="outline" size="sm" onClick={gestures.wholePage}><ScanLine />Page entière</Button>
        <Button variant="outline" size="sm" onClick={download}><Download />Télécharger</Button>
      </div>}
      {panel === "calendar" && <input type="date" aria-label="Date" />}
      {panel === "pc" && <Button variant="outline" onClick={download}><Download />Télécharger le document pour PC</Button>}
    </aside>}
    <div ref={gestures.viewportRef} className="dv-viewport" tabIndex={0} aria-label="Pages du document" onPointerDown={gestures.onPointerDown} onPointerMove={gestures.onPointerMove} onPointerUp={gestures.onPointerUp} onPointerCancel={gestures.onPointerCancel} onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "+") gestures.zoom(1.2);
      else if (event.key === "-") gestures.zoom(1 / 1.2);
      else if (event.key === "ArrowDown") gestures.goToPage(Math.min(pages.length, currentPage + 1));
      else if (event.key === "ArrowUp") gestures.goToPage(Math.max(1, currentPage - 1));
      else return;
      event.preventDefault();
    }}>
      <div className="dv-content flex flex-col" data-moving={gestures.moving} data-scale={gestures.view.scale} style={{ width: PAGE_WIDTH, transform: `translate3d(${gestures.view.x}px, ${gestures.view.y}px, 0) scale(${gestures.view.scale})` }}>
        {pages.map((page, index) => <Page key={index} page={page} number={index + 1} header={header} gap={index === pages.length - 1 ? 0 : PAGE_GAP / gestures.view.scale} editable={editable} query={query} onEdit={edit} />)}
      </div>
    </div>
    {status && <div className="dv-toolbar flex items-center justify-between px-3 text-xs" role="status">{status}<Button variant="ghost" size="icon" className={iconClass} aria-label="Fermer le message" onClick={() => setStatus("")}><X /></Button></div>}
    <nav className="dv-toolbar dv-bottom flex items-stretch overflow-x-auto border-t" aria-label="Outils de lecture">
      <Button variant="ghost" className="dv-button flex-col" aria-pressed={editable} onClick={() => setEditable(!editable)}><Pencil /><span>{editable ? "Lecture seule" : "Autoriser la modification"}</span></Button>
      <Button variant="ghost" className="dv-button flex-col" onClick={gestures.fit}><ScanLine /><span>Ajuster à l’écran</span></Button>
      <Button variant="ghost" className="dv-button flex-col" onClick={() => togglePanel("search")}><Search /><span>Rechercher et remplacer</span></Button>
      <Button variant="ghost" className="dv-button flex-col" onClick={() => togglePanel("tools")}><Wrench /><span>Outils</span></Button>
      <Button variant="ghost" className="dv-button flex-col" onClick={() => onEditOnPC ? onEditOnPC() : togglePanel("pc")}><Monitor /><span>Modifier sur PC</span></Button>
    </nav>
  </section>;
}

export { DocumentViewer };
export type { DocumentBlock } from "./document-viewer/layout";